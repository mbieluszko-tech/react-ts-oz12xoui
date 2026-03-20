import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { AuthCtx } from './context/AuthContext';
import { ToastProvider, useToast } from './utils/toast';
import { SUPABASE_URL, SUPABASE_KEY, isConfigured, validators } from './config';
import { createAuthClient } from './utils/api';
import { useData, useMyOrgs, useTokenRefresh } from './hooks/useData';
import { useConfirm } from './components/common/ConfirmModal';
import { css } from './styles';

import { SetupScreen }      from './components/auth/SetupScreen';
import { AuthScreen }       from './components/auth/AuthScreen';
import { PendingScreen }    from './components/auth/PendingScreen';
import { OrgSelectScreen }  from './components/auth/OrgSelectScreen';
import { Sidebar }          from './components/layout/Sidebar';
import { Dashboard }        from './components/dashboard/Dashboard';
import { CalendarView }     from './components/calendar/CalendarView';
import { AppointmentsView } from './components/appointments/AppointmentsView';
import { MembersView }      from './components/members/MembersView';
import { PendingView }      from './components/members/PendingView';
import { StatsView }        from './components/stats/StatsView';
import { AptModal }         from './components/appointments/AptModal';
import { CreateModal }      from './components/appointments/CreateModal';
import { MemberModal }      from './components/members/MemberModal';
import { AddMemberModal }   from './components/members/AddMemberModal';
import { OrgManager }       from './components/admin/OrgManager';
import { SectionManager }   from './components/admin/SectionManager';

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function AppRoot() {
  return <ToastProvider><App /></ToastProvider>;
}

// ─── APP ──────────────────────────────────────────────────────────────────────
function App() {
  const toast = useToast();
  const [confirm, ConfirmDialog] = useConfirm();

  // ─── CONFIG ──────────────────────────────────────────────────────────────
  const [config, setConfig] = useState(() => {
    if (isConfigured()) return { url: SUPABASE_URL, key: SUPABASE_KEY };
    try {
      const s = JSON.parse(localStorage.getItem("km_config") || "null");
      if (s?.url && s?.key) return s;
    } catch {}
    return null;
  });

  // ─── SESSION ─────────────────────────────────────────────────────────────
  const [session, setSession] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem("km_session") || "null");
      if (s?.token && s?.email && s?.refresh_token && s?.expires_at) return s;
    } catch {}
    return null;
  });

  // ─── ORGANIZATION ────────────────────────────────────────────────────────
  const [currentOrg, setCurrentOrg] = useState(() => {
    try {
      const o = JSON.parse(localStorage.getItem("km_org") || "null");
      if (o?.id && o?.name) return o;
    } catch {}
    return null;
  });

  // ─── UI STATE ────────────────────────────────────────────────────────────
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

  // ─── LOGOUT ──────────────────────────────────────────────────────────────
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

  // ─── TOKEN AUTO-REFRESH ─────────────────────────────────────────────────
  useTokenRefresh(config, session, (newSession) => {
    localStorage.setItem("km_session", JSON.stringify(newSession));
    setSession(newSession);
  });

  // ─── HANDLERS ────────────────────────────────────────────────────────────
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

  // ─── DATA ────────────────────────────────────────────────────────────────
  const { data, loading, error, loadData, updateReply, revertReply, api } =
    useData(config, session, currentOrg, handleUnauthorized);

  const { myOrgs, loadingOrgs, orgsError, reloadOrgs } =
    useMyOrgs(config, session, handleUnauthorized);

  useEffect(() => {
    if (myOrgs.length === 1 && !currentOrg) {
      handleSelectOrg(myOrgs[0]);
    }
  }, [myOrgs, currentOrg, handleSelectOrg]);

  // ─── DERIVED STATE ───────────────────────────────────────────────────────
  const currentMember = useMemo(
    () => data.members.find(m => m.email === session?.email) ?? null,
    [data.members, session?.email]
  );

  const isAdmin = useMemo(
    () => ["admin", "leader", "super_admin"].includes(currentMember?.role),
    [currentMember?.role]
  );

  const isManager = useMemo(
    () => ["admin", "leader", "manager", "super_admin"].includes(currentMember?.role),
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

  // ─── APPOINTMENT HANDLERS ────────────────────────────────────────────────
  const createSingleApt = useCallback(async (aptData, sectionIds, tutti, groupId = null) => {
    if (!client || !currentOrg?.id) throw new Error("Brak połączenia lub organizacji.");

    const created = await client.post("appointments", {
      name: aptData.name?.trim(),
      type: aptData.type,
      date_start: aptData.dateStart,
      date_end: aptData.dateEnd,
      location: aptData.location?.trim() || null,
      description: aptData.description?.trim() || null,
      deadline: aptData.deadline || null,
      status: "active",
      published: true,
      organization_id: currentOrg.id,
      recurring_type: aptData.recurring || "none",
      recurring_until: aptData.recurringUntil || null,
      recurring_group_id: groupId,
    });

    const apt = Array.isArray(created) ? created[0] : created;
    if (!apt?.id) throw new Error("Nie udało się utworzyć terminu.");

    if (sectionIds.length > 0) {
      await client.insertIgnore(
        "appointment_sections",
        sectionIds.map(sid => ({ appointment_id: apt.id, section_id: sid }))
      );
    }

    const invited = (sectionIds.length === 0 || tutti)
      ? data.members.filter(m => m.status === "active")
      : data.members.filter(m => sectionIds.includes(m.section_id) && m.status === "active");

    if (invited.length > 0) {
      await client.insertIgnore(
        "replies",
        invited.map(m => ({
          appointment_id: apt.id,
          member_id: m.id,
          status: "maybe"
        }))
      );
    }

    return apt;
  }, [client, currentOrg?.id, data.members]);

  const handleCreateApt = useCallback(async (form) => {
    if (!client) {
      toast.error("Brak połączenia z bazą.");
      return;
    }

    try {
      const sids = form.tutti ? [] : (form.sectionIds || []);

      if (form.recurring === "none" || !form.recurringUntil) {
        await createSingleApt(form, sids, form.tutti);
        toast.success("Termin utworzony.");
      } else {
        const { MAX_RECURRING_APTS } = await import('./config');
        const groupId = crypto.randomUUID();
        const daysMap = { weekly: 7, biweekly: 14, monthly: 30 };
        const step = daysMap[form.recurring] || 7;
        const until = new Date(form.recurringUntil);
        const start = new Date(form.dateStart);
        const dur = new Date(form.dateEnd) - start;
        const dlOff = form.deadline ? (start.getTime() - new Date(form.deadline).getTime()) : null;
        let cur = new Date(start), count = 0;

        while (cur <= until && count < MAX_RECURRING_APTS) {
          await createSingleApt({
            ...form,
            dateStart: new Date(cur).toISOString(),
            dateEnd: new Date(cur.getTime() + dur).toISOString(),
            deadline: dlOff != null ? new Date(cur.getTime() - dlOff).toISOString() : form.deadline
          }, sids, form.tutti, groupId);
          cur.setDate(cur.getDate() + step);
          count++;
        }

        toast.success(`Utworzono ${count} terminów w serii.`);
      }

      await loadData();
    } catch (e) {
      toast.error(`Błąd tworzenia terminu: ${e.message}`);
    }
  }, [client, createSingleApt, loadData, toast]);

  const handleReply = useCallback(async (aptId, memberId, status) => {
    if (!client) {
      toast.error("Brak połączenia.");
      return;
    }

    const prev = getReplies(aptId)[memberId] ?? null;
    updateReply(aptId, memberId, status);

    try {
      await client.upsert("replies", {
        appointment_id: aptId,
        member_id: memberId,
        status
      });
    } catch (e) {
      revertReply(aptId, memberId, prev);
      toast.error(`Nie udało się zapisać odpowiedzi: ${e.message}`);
    }
  }, [client, getReplies, updateReply, revertReply, toast]);

  // ─── MEMBER HANDLERS ─────────────────────────────────────────────────────
  const handleApproveMember = useCallback(async (pending) => {
    if (!client || !currentOrg?.id) return;

    try {
      await client.post("members", {
        name: pending.name?.trim(),
        email: pending.email?.trim().toLowerCase(),
        phone: pending.phone || null,
        section_id: pending.section_id || null,
        role: "member",
        status: "active",
        organization_id: currentOrg.id,
        rodo_accepted: true,
        terms_accepted: true,
        rodo_accepted_at: pending.created_at,
        terms_accepted_at: pending.created_at,
        joined_at: new Date().toISOString(),
        approved_by: currentMember?.email,
        approved_at: new Date().toISOString(),
      });

      await client.delete(`pending_registrations?id=eq.${pending.id}`);
      await loadData();
      toast.success(`${pending.name} został/a dodany/a do grupy.`);
    } catch (e) {
      toast.error(`Błąd akceptacji: ${e.message}`);
    }
  }, [client, currentOrg?.id, currentMember?.email, loadData, toast]);

  const handleRejectMember = useCallback(async (pending) => {
    const ok = await confirm({
      title: "Odrzuć wniosek",
      message: `Czy na pewno odrzucić wniosek ${pending.name}? Tej operacji nie można cofnąć.`,
      danger: true,
      confirmLabel: "Odrzuć",
    });

    if (!ok || !client) return;

    try {
      await client.delete(`pending_registrations?id=eq.${pending.id}`);
      await loadData();
      toast.info(`Wniosek ${pending.name} odrzucony.`);
    } catch (e) {
      toast.error(`Błąd: ${e.message}`);
    }
  }, [confirm, client, loadData, toast]);

  const handleUpdateMember = useCallback(async (id, updates) => {
    if (!client) return;

    try {
      await client.patch(`members?id=eq.${id}`, updates);
      await loadData();
      toast.success("Dane członka zaktualizowane.");
    } catch (e) {
      toast.error(`Błąd aktualizacji: ${e.message}`);
    }
  }, [client, loadData, toast]);

  const handleAddMember = useCallback(async (memberData) => {
    if (!client || !currentOrg?.id) return;

    if (!validators.name(memberData.name)) {
      toast.error("Podaj imię i nazwisko.");
      return;
    }

    if (memberData.email && !validators.email(memberData.email)) {
      toast.error("Nieprawidłowy email.");
      return;
    }

    try {
      await client.post("members", {
        ...memberData,
        name: memberData.name.trim(),
        email: memberData.email?.trim().toLowerCase() || null,
        organization_id: currentOrg.id,
        approved_by: currentMember?.email,
        approved_at: new Date().toISOString(),
      });

      await loadData();
      toast.success(`${memberData.name} dodany/a do grupy.`);
    } catch (e) {
      toast.error(`Błąd dodawania: ${e.message}`);
    }
  }, [client, currentOrg?.id, currentMember?.email, loadData, toast]);

  // ─── SECTION HANDLERS ────────────────────────────────────────────────────
  const handleAddSection = useCallback(async (sectionData) => {
    if (!client || !currentOrg?.id) return;

    try {
      await client.post("sections", { ...sectionData, organization_id: currentOrg.id });
      await loadData();
      toast.success(`Sekcja "${sectionData.name}" dodana.`);
    } catch (e) {
      toast.error(`Błąd dodawania sekcji: ${e.message}`);
    }
  }, [client, currentOrg?.id, loadData, toast]);

  const handleUpdateSection = useCallback(async (id, updates) => {
    if (!client) return;

    try {
      await client.patch(`sections?id=eq.${id}`, updates);
      await loadData();
      toast.success("Sekcja zaktualizowana.");
    } catch (e) {
      toast.error(`Błąd: ${e.message}`);
    }
  }, [client, loadData, toast]);

  const handleDeleteSection = useCallback(async (id) => {
    if (!client) return;

    try {
      await client.patch(`members?section_id=eq.${id}`, { section_id: null });
      await client.delete(`sections?id=eq.${id}`);
      await loadData();
      toast.info("Sekcja usunięta.");
    } catch (e) {
      toast.error(`Błąd usuwania sekcji: ${e.message}`);
    }
  }, [client, loadData, toast]);

  const handleReorderSections = useCallback(async (updates) => {
    if (!client) return;

    try {
      await Promise.all(
        updates.map(({ id, sort_order }) =>
          client.patch(`sections?id=eq.${id}`, { sort_order })
        )
      );
      await loadData();
    } catch (e) {
      toast.error(`Błąd kolejności: ${e.message}`);
    }
  }, [client, loadData, toast]);

  // ─── ORG HANDLERS ────────────────────────────────────────────────────────
  const handleCreateOrg = useCallback(async (formData) => {
    if (!client) return;

    if (!validators.slug(formData.slug)) {
      toast.error("Nieprawidłowy slug.");
      return;
    }

    if (!validators.name(formData.name)) {
      toast.error("Nazwa za krótka.");
      return;
    }

    try {
      const created = await client.post("organizations", {
        name: formData.name.trim(),
        slug: formData.slug.toLowerCase().trim(),
        type: formData.type,
        description: formData.description?.trim() || null,
        color: formData.color || "#C9A84C",
        logo_emoji: formData.logo_emoji || "🎼",
        active: formData.active ?? true,
      });

      const org = Array.isArray(created) ? created[0] : created;
      if (!org?.id) {
        throw new Error("Nie udało się utworzyć organizacji.");
      }

      const secs = (formData.sections || []).filter(s => s.name?.trim());
      if (secs.length) {
        await client.post(
          "sections",
          secs.map(s => ({
            name: s.name.trim(),
            color: s.color || "#888",
            organization_id: org.id,
          }))
        );
      }

      if (session?.email) {
        try {
          await client.post("members", {
            name: currentMember?.name || session.email,
            email: session.email,
            phone: currentMember?.phone || null,
            section_id: null,
            role: "super_admin",
            status: "active",
            organization_id: org.id,
            rodo_accepted: true,
            terms_accepted: true,
            joined_at: new Date().toISOString(),
            approved_by: session.email,
            approved_at: new Date().toISOString(),
          });
        } catch (membershipError) {
          toast.info(`Grupa została utworzona, ale nie udało się automatycznie przypisać Cię do niej: ${membershipError.message}`);
        }
      }

      await reloadOrgs();
      toast.success(`Grupa "${formData.name}" utworzona.`);
    } catch (e) {
      toast.error(`Błąd tworzenia grupy: ${e.message}`);
    }
  }, [client, currentMember?.name, currentMember?.phone, reloadOrgs, session?.email, toast]);

  const handleUpdateOrg = useCallback(async (id, updates) => {
    if (!client) return;

    if (updates.slug && !validators.slug(updates.slug)) {
      toast.error("Nieprawidłowy slug.");
      return;
    }

    try {
      await client.patch(`organizations?id=eq.${id}`, {
        ...updates,
        slug: updates.slug?.toLowerCase().trim(),
        name: updates.name?.trim(),
      });

      if (currentOrg?.id === id) {
        const updated = { ...currentOrg, ...updates };
        localStorage.setItem("km_org", JSON.stringify(updated));
        setCurrentOrg(updated);
      }

      await reloadOrgs();
      toast.success("Dane grupy zaktualizowane.");
    } catch (e) {
      toast.error(`Błąd aktualizacji grupy: ${e.message}`);
    }
  }, [client, currentOrg, reloadOrgs, toast]);

  const handleDeleteOrg = useCallback(async (org) => {
    if (!client || !org?.id) return;

    const ok = await confirm({
      title: "Usuń grupę",
      message: `Czy na pewno usunąć grupę "${org.name}"? Ta operacja usunie także powiązane dane i nie będzie można jej cofnąć.`,
      danger: true,
      confirmLabel: "Usuń grupę",
    });

    if (!ok) return;

    try {
      await client.delete(`organizations?id=eq.${org.id}`);

      if (currentOrg?.id === org.id) {
        localStorage.removeItem("km_org");
        setCurrentOrg(null);
        setView("dashboard");
      }

      await reloadOrgs();
      await loadData();
      toast.success(`Grupa "${org.name}" została usunięta.`);
    } catch (e) {
      toast.error(`Błąd usuwania grupy: ${e.message}`);
    }
  }, [client, confirm, currentOrg?.id, loadData, reloadOrgs, toast]);

  // ─── RENDER GUARDS ───────────────────────────────────────────────────────
  if (!config) {
    return (
      <>
        <style>{css}</style>
        <SetupScreen onSave={handleSaveConfig} />
      </>
    );
  }

  if (!session) {
    return (
      <>
        <style>{css}</style>
        <AuthScreen config={config} onLogin={handleLogin} />
      </>
    );
  }

  if (!currentOrg) {
    return (
      <>
        <style>{css}</style>
        <OrgSelectScreen
          organizations={myOrgs}
          loading={loadingOrgs}
          error={orgsError}
          onSelect={handleSelectOrg}
          onLogout={handleLogout}
          userEmail={session.email}
        />
      </>
    );
  }

  if (!loading && currentMember && !isActive) {
    return (
      <>
        <style>{css}</style>
        <PendingScreen onLogout={handleLogout} />
      </>
    );
  }

  const authValue = { currentMember, isAdmin, isManager, isSuperAdmin, session, currentOrg };

  return (
    <AuthCtx.Provider value={authValue}>
      <style>{css}</style>

      <div className="app">
        <Sidebar
          view={view}
          setView={setView}
          onLogout={handleLogout}
          onSwitchOrg={myOrgs.length > 1 ? handleSwitchOrg : null}
          onManageOrgs={isSuperAdmin ? () => setShowOrgManager(true) : null}
          pendingCount={data.pending.length}
        />

        <div className="main">
          {error && (
            <div className="error-banner">
              ⚠️ {error}
              <button className="btn btn-ghost btn-sm" onClick={loadData} style={{ marginLeft: 8 }}>
                Ponów
              </button>
            </div>
          )}

          {loading ? (
            <div className="loading">
              <div className="spinner" />
              <span>Ładowanie danych…</span>
            </div>
          ) : (
            <>
              {view === "dashboard" && (
                <Dashboard
                  data={data}
                  getReplies={getReplies}
                  onSelectApt={setSelectedApt}
                  onCreateApt={() => setShowCreate(true)}
                  onReply={handleReply}
                />
              )}

              {view === "calendar" && (
                <CalendarView
                  data={data}
                  getReplies={getReplies}
                  month={calMonth}
                  year={calYear}
                  setMonth={setCalMonth}
                  setYear={setCalYear}
                  selected={calSelected}
                  setSelected={setCalSelected}
                  onSelectApt={setSelectedApt}
                  onCreateApt={() => setShowCreate(true)}
                />
              )}

              {view === "appointments" && (
                <AppointmentsView
                  data={data}
                  getReplies={getReplies}
                  onSelectApt={setSelectedApt}
                  onCreateApt={() => setShowCreate(true)}
                  onReply={handleReply}
                />
              )}

              {view === "members" && (
                <MembersView
                  data={data}
                  onSelectMember={setSelectedMember}
                  onAddMember={() => setShowAddMember(true)}
                />
              )}

              {view === "pending" && isManager && (
                <PendingView
                  data={data}
                  onApprove={handleApproveMember}
                  onReject={handleRejectMember}
                />
              )}

              {view === "stats" && isManager && (
                <StatsView
                  data={data}
                  getReplies={getReplies}
                />
              )}
            </>
          )}
        </div>
      </div>

      {selectedApt && (
        <AptModal
          apt={selectedApt}
          replies={getReplies(selectedApt.id)}
          members={data.members}
          sections={data.sections}
          onClose={() => setSelectedApt(null)}
          onReply={handleReply}
          onCopy={(apt) => {
            setCopyApt(apt);
            setSelectedApt(null);
          }}
        />
      )}

      {showCreate && isManager && (
        <CreateModal
          sections={data.sections}
          onClose={() => setShowCreate(false)}
          onCreate={handleCreateApt}
        />
      )}

      {copyApt && isManager && (
        <CreateModal
          sections={data.sections}
          onClose={() => setCopyApt(null)}
          onCreate={handleCreateApt}
          prefill={copyApt}
        />
      )}

      {selectedMember && (
        <MemberModal
          member={selectedMember}
          sections={data.sections}
          appointments={data.appointments}
          getReplies={getReplies}
          onClose={() => setSelectedMember(null)}
          onUpdate={handleUpdateMember}
          isAdmin={isAdmin}
        />
      )}

      {showAddMember && isAdmin && (
        <AddMemberModal
          sections={data.sections}
          onClose={() => setShowAddMember(false)}
          onAdd={handleAddMember}
        />
      )}

      {showOrgManager && isSuperAdmin && (
        <OrgManager
          organizations={myOrgs}
          onCreateOrg={handleCreateOrg}
          onUpdateOrg={handleUpdateOrg}
          onDeleteOrg={handleDeleteOrg}
          onClose={() => setShowOrgManager(false)}
        />
      )}

      {showSectionManager && isManager && (
        <SectionManager
          sections={data.sections}
          orgType={currentOrg?.type}
          onClose={() => setShowSectionManager(false)}
          onAdd={handleAddSection}
          onUpdate={handleUpdateSection}
          onDelete={handleDeleteSection}
          onReorder={handleReorderSections}
        />
      )}

      {ConfirmDialog}
    </AuthCtx.Provider>
  );
}
