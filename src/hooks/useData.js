import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createApiClient, createAuthClient } from '../utils/api';
import {
  MS_PER_YEAR,
  APPOINTMENTS_WINDOW_YEARS,
  SUPABASE_MAX_ROWS,
  JWT_REFRESH_BUFFER_MS,
} from '../config';

// ─── HOOK: dane organizacji ────────────────────────────────────────────────────
export function useData(config, session, currentOrg, onUnauthorized) {
  const [data, setData]       = useState({ sections:[], members:[], appointments:[], replies:[], pending:[] });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const abortRef              = useRef(null);

  const api = useCallback(() => {
    if (!config?.url || !config?.key || !session?.token) return null;
    return createApiClient(config.url, config.key, session.token, onUnauthorized);
  }, [config?.url, config?.key, session?.token, onUnauthorized]);

  const loadData = useCallback(async () => {
    const client = api();
    if (!client || !currentOrg?.id) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const sig = controller.signal;

    setLoading(true);
    setError(null);

    try {
      const orgId = currentOrg.id;

      // Krok 1: sekcje i członkowie
      const [sections, members] = await Promise.all([
        client.get(`sections?organization_id=eq.${orgId}&select=*&order=id`, sig),
        client.get(`members?organization_id=eq.${orgId}&select=*&order=name`, sig),
      ]);
      if (sig.aborted) return;

      // Krok 2: terminy — okno czasowe (APPOINTMENTS_WINDOW_YEARS lat wstecz + wszystkie przyszłe)
      // Supabase zwraca max SUPABASE_MAX_ROWS rekordów — dla orkiestry to wystarczy
      const windowStart = new Date(Date.now() - APPOINTMENTS_WINDOW_YEARS * MS_PER_YEAR).toISOString();
      const appointments = await client.get(
        `appointments?organization_id=eq.${orgId}&select=*` +
        `&date_start=gte.${windowStart}&order=date_start`,
        sig
      );
      if (sig.aborted) return;

      const s = sections    || [];
      const m = members     || [];
      const a = appointments|| [];

      // Krok 3: replies TYLKO dla załadowanych terminów (izolacja orgs)
      let r = [];
      if (a.length > 0) {
        // Gdy terminów > SUPABASE_MAX_ROWS podziel na partie
        if (a.length <= SUPABASE_MAX_ROWS) {
          const aptIds = a.map(apt => apt.id).join(",");
          const replies = await client.get(`replies?appointment_id=in.(${aptIds})&select=*`, sig);
          if (!sig.aborted) r = replies || [];
        } else {
          // Paginacja: partie po SUPABASE_MAX_ROWS
          const batches = [];
          for (let i = 0; i < a.length; i += SUPABASE_MAX_ROWS) {
            const batch = a.slice(i, i + SUPABASE_MAX_ROWS).map(x => x.id).join(",");
            batches.push(client.get(`replies?appointment_id=in.(${batch})&select=*`, sig));
          }
          const results = await Promise.all(batches);
          if (!sig.aborted) r = results.flat().filter(Boolean);
        }
      }
      if (sig.aborted) return;

      // Krok 4: wnioski — tylko dla managerów
      const me = m.find(x => x.email === session.email);
      let pending = [];
      if (me && ["admin","leader","manager","super_admin"].includes(me.role)) {
        const p = await client.get(
          `pending_registrations?organization_id=eq.${orgId}&select=*&order=created_at.desc`,
          sig
        );
        if (!sig.aborted) pending = p || [];
      }

      if (!sig.aborted) {
        setData({ sections:s, members:m, appointments:a, replies:r, pending });
      }

    } catch(e) {
      if (e.name === "AbortError") return;
      if (!controller.signal.aborted) {
        setError(e.message || "Błąd ładowania danych");
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [api, currentOrg?.id, session?.email]);

  useEffect(() => {
    if (session?.token && currentOrg?.id) loadData();
    return () => { abortRef.current?.abort(); };
  }, [currentOrg?.id, session?.token]);

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  // Optymistyczna aktualizacja z tymczasowym kluczem React
  const updateReply = useCallback((aptId, memberId, status) => {
    setData(d => ({
      ...d,
      replies: [
        ...d.replies.filter(r => !(r.appointment_id===aptId && r.member_id===memberId)),
        { appointment_id:aptId, member_id:memberId, status, _tempId:`${aptId}_${memberId}` },
      ],
    }));
  }, []);

  // Rollback optymistycznej aktualizacji
  const revertReply = useCallback((aptId, memberId, previousStatus) => {
    setData(d => ({
      ...d,
      replies: [
        ...d.replies.filter(r => !(r.appointment_id===aptId && r.member_id===memberId)),
        ...(previousStatus ? [{ appointment_id:aptId, member_id:memberId, status:previousStatus }] : []),
      ],
    }));
  }, []);

  return { data, loading, error, loadData, updateReply, revertReply, api };
}

// ─── HOOK: organizacje użytkownika ────────────────────────────────────────────
export function useMyOrgs(config, session, onUnauthorized) {
  const [myOrgs, setMyOrgs]       = useState([]);
  const [loadingOrgs, setLoading] = useState(false);
  const [orgsError, setError]     = useState(null);

  const load = useCallback(async () => {
    if (!config?.url || !session?.token) return;
    setLoading(true);
    setError(null);
    try {
      const client = createApiClient(config.url, config.key, session.token, onUnauthorized);
      const email  = encodeURIComponent(session.email);
      const members = await client.get(
        `members?email=eq.${email}&status=eq.active` +
        `&select=organization_id,role,organizations!inner(id,name,slug,type,description,color,logo_emoji,active)`
      );
      if (!members?.length) { setMyOrgs([]); return; }
      const orgs = members.map(m => m.organizations).filter(o => o?.active === true);
      setMyOrgs(Array.from(new Map(orgs.map(o => [o.id, o])).values()));
    } catch(e) {
      setError(e.message || "Nie udało się załadować grup.");
      setMyOrgs([]);
    } finally { setLoading(false); }
  }, [config?.url, config?.key, session?.token, session?.email, onUnauthorized]);

  useEffect(() => { if (session?.token) load(); }, [session?.token]);

  return { myOrgs, loadingOrgs, orgsError, reloadOrgs: load };
}

// ─── HOOK: auto-refresh JWT tokena ────────────────────────────────────────────
// Supabase JWT wygasa po 1h. Odświeżamy 5 min przed wygaśnięciem.
export function useTokenRefresh(config, session, onRefreshed) {
  const timerRef = useRef(null);

  useEffect(() => {
    if (!session?.token || !session?.expires_at || !config) return;

    const expiresAt   = new Date(session.expires_at).getTime();
    const refreshAt   = expiresAt - JWT_REFRESH_BUFFER_MS;
    const msUntilRefresh = refreshAt - Date.now();

    if (msUntilRefresh <= 0) {
      // Token już wygasł lub za chwilę wygaśnie — odśwież natychmiast
      doRefresh();
      return;
    }

    timerRef.current = setTimeout(doRefresh, msUntilRefresh);
    return () => clearTimeout(timerRef.current);

    async function doRefresh() {
      try {
        const auth = createAuthClient(config.url, config.key);
        const data = await auth.refresh(session.refresh_token);
        if (data?.access_token) {
          onRefreshed({
            token:         data.access_token,
            refresh_token: data.refresh_token ?? session.refresh_token,
            expires_at:    data.expires_at
              ?? new Date(Date.now() + (data.expires_in ?? 3600) * 1000).toISOString(),
            email: session.email,
          });
        }
      } catch {
        // Refresh nie powiódł się — następne zapytanie dostanie 401 i wywoła logout
      }
    }
  }, [session?.token, session?.expires_at]);
}
