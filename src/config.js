// ─── KONFIGURACJA SUPABASE ────────────────────────────────────────────────────
// Klucze wyłącznie ze zmiennych środowiskowych — nigdy nie hardcode!
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || "";
export const APP_NAME     = import.meta.env.VITE_APP_NAME     || "ACK Alternator";

export const isConfigured = () =>
  SUPABASE_URL.startsWith("https://") && SUPABASE_KEY.length > 20;

// ─── STAŁE CZASOWE ────────────────────────────────────────────────────────────
export const MS_PER_DAY        = 24 * 60 * 60 * 1000;
export const MS_PER_YEAR       = 365 * MS_PER_DAY;
export const APPOINTMENTS_WINDOW_YEARS = 2;   // załaduj terminy z ostatnich N lat
export const MAX_RECURRING_APTS = 52;         // max terminów w jednej serii
export const SUPABASE_MAX_ROWS  = 1000;       // domyślny limit Supabase per query
export const TOAST_DEFAULT_MS   = 4000;       // domyślny czas wyświetlania toastu
export const TOAST_ERROR_MS     = 6000;
export const API_RETRY_DELAY_MS = 800;        // bazowe opóźnienie retry
export const API_MAX_ATTEMPTS   = 3;
export const JWT_REFRESH_BUFFER_MS = 5 * 60 * 1000; // odśwież token 5 min przed wygaśnięciem

// ─── TYPY ORGANIZACJI ─────────────────────────────────────────────────────────
export const ORG_TYPE_LABELS = {
  orchestra: "Orkiestra",
  choir:     "Chór",
  band:      "Zespół",
  ensemble:  "Zespół Pieśni i Tańca",
  vocal:     "Studio Wokalne",
  other:     "Grupa",
};

// ─── STAŁE APLIKACJI ──────────────────────────────────────────────────────────
export const TYPE_LABELS  = { rehearsal:"Próba", performance:"Koncert", other:"Inne" };
export const TYPE_COLORS  = { rehearsal:"#5B9BD5", performance:"#C9A84C", other:"#9B8EC4" };
export const ROLE_LABELS  = {
  super_admin: "Super Admin",
  admin:       "Administrator",
  leader:      "Lider",
  manager:     "Zarządca",
  member:      "Członek",
};
export const REPLY_LABELS = { yes:"TAK", no:"NIE", maybe:"MOŻE" };
export const REPLY_STATUS = ["yes", "no", "maybe"];

export const MONTHS_PL = [
  "Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec",
  "Lipiec","Sierpień","Wrzesień","Październik","Listopad","Grudzień",
];
export const DAYS_PL = ["Pn","Wt","Śr","Cz","Pt","Sb","Nd"];

// ─── FORMATTERY ───────────────────────────────────────────────────────────────
export const fmt      = (d) => new Date(d).toLocaleDateString("pl-PL", { day:"numeric", month:"long",  year:"numeric" });
export const fmtShort = (d) => new Date(d).toLocaleDateString("pl-PL", { day:"numeric", month:"short" });
export const fmtTime  = (d) => new Date(d).toLocaleTimeString("pl-PL", { hour:"2-digit", minute:"2-digit" });

// ─── HELPER KALENDARZA ────────────────────────────────────────────────────────
export function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay() || 7;
  const days     = [];
  for (let i = 1; i < startDow; i++)
    days.push({ date: new Date(year, month, 1 - (startDow - i)), current: false });
  for (let d = 1; d <= lastDay.getDate(); d++)
    days.push({ date: new Date(year, month, d), current: true });
  while (days.length % 7 !== 0)
    days.push({ date: new Date(year, month + 1, days.length - lastDay.getDate() - startDow + 2), current: false });
  return days;
}

// ─── WALIDATORY ───────────────────────────────────────────────────────────────
export const validators = {
  email:    (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "")),
  password: (v) => String(v || "").length >= 8,
  name:     (v) => String(v || "").trim().length >= 2,
  slug:     (v) => /^[a-z0-9-]{2,30}$/.test(String(v || "")),
  required: (v) => v !== null && v !== undefined && String(v).trim().length > 0,
  phone:    (v) => !v || /^[+\d\s()-]{7,20}$/.test(String(v)),
  color:    (v) => /^#[0-9A-Fa-f]{6}$/.test(String(v || "")),
};

// Komunikaty walidacji — lokalizowane stringi, nie sekrety
export const validationMessages = {
  email:    "Podaj prawidłowy adres email",
  password: "Hasło musi mieć co najmniej 8 znaków",
  name:     "Nazwa musi mieć co najmniej 2 znaki",
  slug:     "Slug: tylko małe litery, cyfry i myślniki (2–30 znaków)",
  required: "To pole jest wymagane",
  phone:    "Podaj prawidłowy numer telefonu",
  color:    "Podaj prawidłowy kolor w formacie #RRGGBB",
};
