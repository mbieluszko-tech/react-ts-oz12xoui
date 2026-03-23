import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { AuthCtx } from './context/AuthContext';
import { ToastProvider, useToast } from './utils/toast';
import { SUPABASE_URL, SUPABASE_KEY, isConfigured, validators } from './config';
import { createAuthClient } from './utils/api';
import { useData, useMyOrgs, useTokenRefresh } from './hooks/useData';
import { useConfirm } from './components/common/ConfirmModal';
import { useOrgAdmin } from './hooks/useOrgAdmin';
import { makeUniqueSlug, normalizeSlug } from './services/orgService';
import { css } from './styles';

import { SetupScreen } from './components/auth/SetupScreen';
import { AuthScreen } from './components/auth/AuthScreen';
import { PendingScreen } from './components/auth/PendingScreen';
import { OrgSelectScreen } from './components/auth/OrgSelectScreen';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './components/dashboard/Dashboard';
import { CalendarView } from './components/calendar/CalendarView';
import { AppointmentsView } from './components/appointments/AppointmentsView';
import { MembersView } from './components/members/MembersView';
import { PendingView } from './components/members/PendingView';
import { StatsView } from './components/stats/StatsView';
import { AptModal } from './components/appointments/AptModal';
import { CreateModal } from './components/appointments/CreateModal';
import { MemberModal } from './components/members/MemberModal';
import { AddMemberModal } from './components/members/AddMemberModal';
import { OrgManager } from './components/admin/OrgManager';
import { SectionManager } from './components/admin/SectionManager';

export default function AppRoot() {
  return <ToastProvider><App /></ToastProvider>;
}

function App() {
  const toast = useToast();
  const [confirm, ConfirmDialog] = useConfirm();

  const [config, setConfig] = useState(() => {
    if (isConfigured()) return { url: SUPABASE_URL, key: SUPABASE_KEY };
    try {
      const s = JSON.parse(localStorage.getItem("km_config") || "null");
      if (s?.url && s?.key) return s;
    } catch {}
    return null;
  });

  const [session, setSession] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem("km_session") || "null");
      if (s?.token && s?.email && s?.refresh_token && s?.expires_at) return s;
    } catch {}
    return null;
  });

  const [currentOrg, setCurrentOrg] = useState(() => {
    try {
      const o = JSON.parse(localStorage.getItem("km_org") || "null");
      if (o?.id && o?.name) return o;
    } catch {}
    return null;
  });

  const [view, setView] = useState("dashboard");
  const [selectedApt, setSelectedApt] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [copyApt, setCopyApt] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showOrgManager, setShowOrgManager] = useState(false);
  const [showSectionManager, setShowSectionManager] = useState(false);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calSelected, setCalSelected] = useState(null);

  const handleLogout = useCallback(() => {
    if (session?.token && config) {
      createAuthClient(config.url, config.key).logout(session.token);
    }
    localStorage.removeItem("km_session");
    localStorage.removeItem("km_org");
    setSession(null);
    setCurrentOrg(null);
    setView("dashboard");
  }, [session?.token, config]);

  const handleUnauthorized = useCallback(() => {
    toast.error("Sesja wygasła. Zaloguj się ponownie.");
    handleLogout();
  }, [handleLogout, toast]);

  useTokenRefresh(config, session, (newSession) => {
    localStorage.setItem("km_session", JSON.stringify(newSession));
    setSession(newSession);
  });

  const handleSaveConfig = useCallback((url, key) => {
    const cfg = { url: url.trim(), key: key.trim() };
    localStorage.setItem("km_config", JSON.stringify(cfg));
    setConfig(cfg);
  }, []);

  const handleLogin = useCallback((authData) => {
    const token = authData?.access_token;
    const refreshToken = authData?.refresh_token;
    const email = authData?.user?.email;

    const expiresAt =
      authData?.expires_at
        ? new Date(authData.expires_at * 1000).toISOString()
        : authData?.expires_in
          ? new Date(Date.now() + authData.expires_in * 1000).toISOString()
          : null;

    if (!token || !refreshToken || !email || !expiresAt) {
      toast.error("Nieprawidłowa odpowiedź serwera logowania.");
      return;
    }

    const s = {
      token,
      refresh_token: refreshToken,
      email,
      expires_at: expiresAt,
    };

    localStorage.setItem("km_session", JSON.stringify(s));
    setSession(s);
  }, [toast]);

  const handleSelectOrg = useCallback((org) => {
    if (!org?.id) return;
    localStorage.setItem("km_org", JSON.stringify(org));
    setCurrentOrg(org);
    setView("dashboard");
  }, []);

  const handleSwitchOrg = useCallback(() => {
    localStorage.removeItem("km_org");
    setCurrentOrg(null);
    setView("dashboard");
  }, []);

  const { data, loading, error, loadData, updateReply, revertReply, api } =
    useData(config, session, currentOrg, handleUnauthorized);

  const { myOrgs, loadingOrgs, orgsError, reloadOrgs } =
    useMyOrgs(config, session, handleUnauthorized);

  const activeMyOrgs = useMemo(
    () => (myOrgs || []).filter(org => !org.archived_at),
    [myOrgs]
  );

  useEffect(() => {
    if (activeMyOrgs.length === 1 && !currentOrg) {
      handleSelectOrg(activeMyOrgs[0]);
    }
  }, [activeMyOrgs, currentOrg, handleSelectOrg]);

  const currentMember = useMemo(
    () => data.members.find(m => m.email === session?.email) ?? null,
    [data.members, session?.email]
  );

  // ✅ POPRAWIONA LOGIKA RÓL
  const isAdmin = useMemo(
    () => ["admin", "super_admin"].includes(currentMember?.role),
    [currentMember?.role]
  );

  const isManager = useMemo(
    () => ["manager", "admin", "super_admin"].includes(currentMember?.role),
    [currentMember?.role]
  );

  const isSuperAdmin = currentMember?.role === "super_admin";
  const isActive = currentMember?.status === "active";

  const getReplies = useCallback((aptId) => {
    const r = {};
    data.replies
      .filter(x => x.appointment_id === aptId)
      .forEach(x => {
        r[x.member_id] = x.status;
      });
    return r;
  }, [data.replies]);

  const client = useMemo(() => api(), [api]);

  // ... RESZTA PLIKU BEZ ZMIAN ...

  const authValue = { currentMember, isAdmin, isManager, isSuperAdmin, session, currentOrg };

  return (
    <AuthCtx.Provider value={authValue}>
      <style>{css}</style>

      <div className="app">
        <Sidebar
          view={view}
          setView={setView}
          onLogout={handleLogout}
          onSwitchOrg={activeMyOrgs.length > 1 ? handleSwitchOrg : null}
          onManageOrgs={isSuperAdmin ? () => setShowOrgManager(true) : null}
          pendingCount={data.pending.length}
        />

        {/* RESZTA UI BEZ ZMIAN */}
      </div>

      {ConfirmDialog}
    </AuthCtx.Provider>
  );
}
