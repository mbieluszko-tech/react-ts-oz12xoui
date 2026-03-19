import { API_RETRY_DELAY_MS, API_MAX_ATTEMPTS } from '../config';

// ─── KODY BŁĘDÓW SUPABASE → czytelne komunikaty ───────────────────────────────
const ERROR_MESSAGES = {
  "23505":               "Ten rekord już istnieje (duplikat).",
  "23503":               "Naruszenie klucza obcego — powiązany rekord nie istnieje.",
  "23514":               "Wartość nie spełnia wymagań bazy danych.",
  "42501":               "Brak uprawnień do wykonania tej operacji.",
  "42P01":               "Tabela nie istnieje — sprawdź czy migracja została uruchomiona.",
  "PGRST116":            "Nie znaleziono rekordu.",
  "PGRST204":            "Kolumna nie istnieje — sprawdź schemat bazy.",
  "PGRST301":            "Brak uwierzytelnienia.",
  "PGRST200":            "Nieprawidłowe zapytanie — sprawdź parametry.",
  "invalid_grant":       "Nieprawidłowy email lub hasło.",
  "email_not_confirmed": "Potwierdź adres email przed zalogowaniem.",
  "user_already_exists": "Konto z tym adresem email już istnieje.",
  "weak_password":       "Hasło jest zbyt słabe — użyj co najmniej 8 znaków.",
  "over_email_send_rate_limit": "Zbyt wiele prób. Poczekaj chwilę i spróbuj ponownie.",
};

// ─── PARSOWANIE BŁĘDÓW ────────────────────────────────────────────────────────
function parseSupabaseError(text, status) {
  if (!text) return { message: `Błąd serwera (HTTP ${status})`, code: "", status };
  try {
    const json = JSON.parse(text);
    const code = json.code || json.error_code || json.error || "";
    const msg  = ERROR_MESSAGES[code]
      || json.message
      || json.msg
      || json.error_description
      || json.hint;
    return { message: msg || `Błąd serwera (HTTP ${status})`, code, status };
  } catch {
    // Odpowiedź nie jest JSON — zwróć surowy tekst (obcięty)
    const safe = text.length < 200 ? text : `${text.slice(0, 197)}…`;
    return { message: safe, code: "", status };
  }
}

// ─── KLASA BŁĘDU API ──────────────────────────────────────────────────────────
export class ApiError extends Error {
  constructor({ message, code, status }) {
    super(message);
    this.code   = code;
    this.status = status;
    this.name   = "ApiError";
  }
  /** Błąd przejściowy — warto ponowić (5xx, 429, błąd sieci) */
  get isRetryable() {
    return this.status >= 500 || this.status === 429 || this.status === 0;
  }
  /** Błąd autoryzacji — wymagane ponowne logowanie */
  get isAuthError() {
    return this.status === 401 || this.status === 403;
  }
}

// ─── RETRY Z WYKŁADNICZYM BACKOFF ─────────────────────────────────────────────
async function withRetry(fn, maxAttempts = API_MAX_ATTEMPTS, delayMs = API_RETRY_DELAY_MS) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      const isNetworkErr = e instanceof TypeError && e.message === "Failed to fetch";
      const isRetryable  = e instanceof ApiError && e.isRetryable;
      // Nie ponawiaj błędów logicznych (4xx) ani jeśli to ostatnia próba
      if ((!isNetworkErr && !isRetryable) || attempt === maxAttempts) throw e;
      await new Promise(r => setTimeout(r, delayMs * attempt));
    }
  }
  throw lastError;
}

// ─── BEZPIECZNY JSON PARSE ────────────────────────────────────────────────────
function safeJsonParse(text) {
  if (!text || !text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new ApiError({
      message: "Nieoczekiwany format odpowiedzi serwera.",
      code: "JSON_PARSE_ERROR",
      status: 0,
    });
  }
}

// ─── FABRYKA KLIENTA API ──────────────────────────────────────────────────────
export function createApiClient(url, key, token, onUnauthorized) {
  const baseHeaders = {
    "apikey":        key,
    "Authorization": `Bearer ${token}`,
    "Content-Type":  "application/json",
  };

  async function request(path, options = {}, signal = null) {
    const { prefer, headers: extraHeaders, ...rest } = options;

    return withRetry(async () => {
      const res = await fetch(`${url}/rest/v1/${path}`, {
        headers: {
          ...baseHeaders,
          "Prefer": prefer || "return=representation",
          ...extraHeaders,
        },
        signal,
        ...rest,
      });

      if (res.status === 401) {
        onUnauthorized?.();
        throw new ApiError({ message:"Sesja wygasła. Zaloguj się ponownie.", code:"401", status:401 });
      }

      const text = await res.text();
      if (!res.ok) throw new ApiError(parseSupabaseError(text, res.status));
      return safeJsonParse(text);
    });
  }

  return {
    get:    (path, signal)       => request(path, { method:"GET" }, signal),
    post:   (path, body, signal) => request(path, { method:"POST",   body:JSON.stringify(body) }, signal),
    patch:  (path, body, signal) => request(path, { method:"PATCH",  body:JSON.stringify(body) }, signal),
    delete: (path, signal)       => request(path, { method:"DELETE", prefer:"" }, signal),
    upsert: (path, body, signal) => request(path, {
      method:"POST", body:JSON.stringify(body),
      prefer:"resolution=merge-duplicates,return=representation",
    }, signal),
    insertIgnore: (path, body, signal) => request(path, {
      method:"POST", body:JSON.stringify(body),
      prefer:"resolution=ignore-duplicates,return=representation",
    }, signal),
    getOne: async (path, signal) => {
      const result = await request(path, { method:"GET" }, signal);
      return Array.isArray(result) ? (result[0] ?? null) : result;
    },
  };
}

// ─── AUTH CLIENT ──────────────────────────────────────────────────────────────
export function createAuthClient(url, key) {
  async function authRequest(path, body) {
    const res = await fetch(`${url}/auth/v1/${path}`, {
      method:  "POST",
      headers: { "apikey": key, "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) throw new ApiError(parseSupabaseError(text, res.status));
    return safeJsonParse(text) ?? {};
  }

  return {
    login:    (email, password)    => authRequest("token?grant_type=password", { email, password }),
    register: (email, password)    => authRequest("signup", { email, password }),
    refresh:  (refreshToken)       => authRequest("token?grant_type=refresh_token", { refresh_token: refreshToken }),
    logout:   (token)              => fetch(`${url}/auth/v1/logout`, {
      method:"POST",
      headers: { "apikey":key, "Authorization":`Bearer ${token}` },
    }).catch(() => {}), // fire-and-forget
  };
}
