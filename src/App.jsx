import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { AuthCtx } from './context/AuthContext';
import { ToastProvider, useToast } from './utils/toast';
import { SUPABASE_URL, SUPABASE_KEY, isConfigured, validators } from './config';
import { createAuthClient } from './utils/api';
import { useData, useMyOrgs, useTokenRefresh } from './hooks/useData';
import { useConfirm } from './components/common/ConfirmModal';
import { useOrgAdmin } from './hooks/useOrgAdmin';

import { SetupScreen } from './components/auth/SetupScreen';
import { AuthScreen } from './components/auth/AuthScreen';
import { PendingScreen } from './components/auth/PendingScreen';
import { OrgSelectScreen } from './components/auth/OrgSelectScreen';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './components/dashboard/Dashboard';
import { MembersView } from './components/members/MembersView';
import { MemberModal } from './components/members/MemberModal';
import { AddMemberModal } from './components/members/AddMemberModal';

export default function AppRoot() {
  return <ToastProvider><App /></ToastProvider>;
}

function App() {
  const toast = useToast();
  const [confirm, ConfirmDialog] = useConfirm();

  const [config, setConfig] = useState(() => {
    if (isConfigured()) return { url: SUPABASE_URL, key: SUPABASE_KEY };
    try {
      return JSON.parse(localStorage.getItem("km_config"));
    } catch { return null; }
  });

  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("km_session"));
    } catch { return null; }
  });

  const [currentOrg, setCurrentOrg] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("km_org"));
    } catch { return null; }
  });

  const [view, setView] = useState("members");
  const [selectedMember, setSelectedMember] = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("km_session");
    localStorage.removeItem("km_org");
    setSession(null);
    setCurrentOrg(null);
  }, []);

  const handleUnauthorized = useCallback(() => {
    toast.error("Sesja wygasła");
    handleLogout();
  }, [handleLogout, toast]);

  useTokenRefresh(config, session, (s) => {
    localStorage.setItem("km_session", JSON.stringify(s));
    setSession(s);
  });

  const { data, loading, error, loadData, api } =
    useData(config, session, currentOrg, handleUnauthorized);

  const client = useMemo(() => api(), [api]);

  const currentMember = useMemo(
    () => data.members.find(m => m.email === session?.email),
    [data.members, session?.email]
  );

  const isAdmin = ["admin", "leader", "super_admin"].includes(currentMember?.role);

  // 🔥 KLUCZOWA FUNKCJA – UPDATE MEMBER
  const handleUpdateMember = useCallback(async (id, updates) => {
    if (!client) return;

    try {
      await client.patch(`members?id=eq.${id}`, updates);

      // 🔥 WAŻNE – wymusza odświeżenie danych z bazy
      await loadData();

      toast.success("Zapisano zmiany");
    } catch (e) {
      console.error("UPDATE ERROR:", e);
      toast.error(`Błąd: ${e.message}`);
    }
  }, [client, loadData, toast]);

  const handleAddMember = useCallback(async (memberData) => {
    if (!client || !currentOrg?.id) return;

    try {
      await client.post("members", {
        ...memberData,
        organization_id: currentOrg.id,
      });

      await loadData();
      toast.success("Dodano członka");
    } catch (e) {
      toast.error(e.message);
    }
  }, [client, currentOrg?.id, loadData, toast]);

  if (!config) return <SetupScreen onSave={setConfig} />;
  if (!session) return <AuthScreen config={config} onLogin={setSession} />;
  if (!currentOrg) return <OrgSelectScreen onSelect={setCurrentOrg} />;

  const authValue = { currentMember, isAdmin };

  return (
    <AuthCtx.Provider value={authValue}>
      <div className="app">

        <Sidebar view={view} setView={setView} onLogout={handleLogout} />

        <div className="main">

          {loading && <div>Ładowanie…</div>}
          {error && <div>{error}</div>}

          {!loading && view === "members" && (
            <MembersView
              data={data}
              onSelectMember={setSelectedMember}
              onAddMember={() => setShowAddMember(true)}
            />
          )}

        </div>

        {selectedMember && (
          <MemberModal
            member={selectedMember}
            sections={data.sections}
            appointments={data.appointments || []}
            getReplies={() => ({})}
            onClose={() => setSelectedMember(null)}
            onUpdate={handleUpdateMember}
            isAdmin={isAdmin}
          />
        )}

        {showAddMember && (
          <AddMemberModal
            sections={data.sections}
            onClose={() => setShowAddMember(false)}
            onAdd={handleAddMember}
          />
        )}

        {ConfirmDialog}

      </div>
    </AuthCtx.Provider>
  );
}
