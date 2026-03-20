import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  buildOrgFilename,
  createOrgApi,
  createRestFetcher,
  createOrganizationBundle,
  archiveOrganization,
  restoreOrganization,
  deleteOrganizationSafely,
  exportOrganizationBackup,
  importOrganizationBackup,
  duplicateOrganizationStructure,
  downloadJsonFile,
  getOrganizationStats,
} from '../services/orgService';
import { validators } from '../config';

export function useOrgAdmin({
  config,
  session,
  myOrgs,
  currentOrg,
  currentMember,
  onUnauthorized,
  reloadOrgs,
  loadData,
  setCurrentOrg,
  setView,
  toast,
  confirm,
}) {
  const [orgStats, setOrgStats] = useState({});
  const [statsLoading, setStatsLoading] = useState(false);

  const client = useMemo(
    () => createOrgApi(config, session, onUnauthorized),
    [config, session, onUnauthorized]
  );

  const fetchTable = useMemo(
    () => createRestFetcher(config, session),
    [config, session]
  );

  const loadOrgStats = useCallback(async () => {
    if (!myOrgs?.length || !config || !session) {
      setOrgStats({});
      return;
    }

    setStatsLoading(true);
    try {
      const stats = await getOrganizationStats(
        fetchTable,
        myOrgs.map(org => org.id)
      );
      setOrgStats(stats);
    } catch {
      setOrgStats({});
    } finally {
      setStatsLoading(false);
    }
  }, [myOrgs, config, session, fetchTable]);

  useEffect(() => {
    loadOrgStats();
  }, [loadOrgStats]);

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

    if (formData.admin_email && !validators.email(formData.admin_email)) {
      toast.error("Nieprawidłowy email administratora.");
      return;
    }

    try {
      const org = await createOrganizationBundle({
        client,
        formData,
        sessionEmail: session?.email,
        currentMemberName: currentMember?.name,
        currentMemberPhone: currentMember?.phone,
      });

      await reloadOrgs();
      await loadOrgStats();
      toast.success(`Grupa "${org.name}" utworzona.`);
    } catch (e) {
      toast.error(`Błąd tworzenia grupy: ${e.message}`);
    }
  }, [client, currentMember?.name, currentMember?.phone, loadOrgStats, reloadOrgs, session?.email, toast]);

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
      await loadOrgStats();
      toast.success("Dane grupy zaktualizowane.");
    } catch (e) {
      toast.error(`Błąd aktualizacji grupy: ${e.message}`);
    }
  }, [client, currentOrg, loadOrgStats, reloadOrgs, setCurrentOrg, toast]);

  const handleArchiveOrg = useCallback(async (org) => {
    if (!client || !org?.id) return;

    const ok = await confirm({
      title: "Archiwizuj grupę",
      message: `Czy na pewno zarchiwizować grupę "${org.name}"? Grupa zniknie z aktywnej listy, ale będzie można ją przywrócić.`,
      confirmLabel: "Archiwizuj",
    });

    if (!ok) return;

    try {
      await archiveOrganization(client, org, session?.email);

      if (currentOrg?.id === org.id) {
        localStorage.removeItem("km_org");
        setCurrentOrg(null);
        setView("dashboard");
      }

      await reloadOrgs();
      await loadOrgStats();
      await loadData();
      toast.success(`Grupa "${org.name}" została zarchiwizowana.`);
    } catch (e) {
      toast.error(`Błąd archiwizacji grupy: ${e.message}`);
    }
  }, [client, confirm, currentOrg?.id, loadData, loadOrgStats, reloadOrgs, session?.email, setCurrentOrg, setView, toast]);

  const handleRestoreOrg = useCallback(async (org) => {
    if (!client || !org?.id) return;

    try {
      await restoreOrganization(client, org);
      await reloadOrgs();
      await loadOrgStats();
      toast.success(`Grupa "${org.name}" została przywrócona.`);
    } catch (e) {
      toast.error(`Błąd przywracania grupy: ${e.message}`);
    }
  }, [client, loadOrgStats, reloadOrgs, toast]);

  const handleDeleteOrg = useCallback(async (org) => {
    if (!client || !org?.id) return;

    try {
      const counts = orgStats[org.id] || { members: 0, appointments: 0, sections: 0 };

      if (counts.members > 0 || counts.appointments > 0 || counts.sections > 0) {
        toast.error(
          `Nie można usunąć grupy "${org.name}". Zawiera dane: członkowie: ${counts.members}, terminy: ${counts.appointments}, sekcje: ${counts.sections}. Najpierw usuń dane lub pozostaw grupę w archiwum.`
        );
        return;
      }

      const ok = await confirm({
        title: "Usuń grupę trwale",
        message: `Czy na pewno trwale usunąć grupę "${org.name}"?\n\nTa operacja jest nieodwracalna.`,
        danger: true,
        confirmLabel: "Usuń trwale",
      });

      if (!ok) return;

      await deleteOrganizationSafely(client, fetchTable, org);

      if (currentOrg?.id === org.id) {
        localStorage.removeItem("km_org");
        setCurrentOrg(null);
        setView("dashboard");
      }

      await reloadOrgs();
      await loadOrgStats();
      await loadData();
      toast.success(`Grupa "${org.name}" została usunięta.`);
    } catch (e) {
      if (e?.details) {
        toast.error(
          `Nie można usunąć grupy "${org.name}". Zawiera dane: członkowie: ${e.details.members}, terminy: ${e.details.appointments}, sekcje: ${e.details.sections}.`
        );
        return;
      }
      toast.error(`Błąd usuwania grupy: ${e.message}`);
    }
  }, [client, confirm, currentOrg?.id, fetchTable, loadData, loadOrgStats, orgStats, reloadOrgs, setCurrentOrg, setView, toast]);

  const handleExportOrg = useCallback(async (org) => {
    try {
      const backup = await exportOrganizationBackup(fetchTable, org);
      const filename = buildOrgFilename("backup", org.slug);
      downloadJsonFile(filename, backup);
      toast.success(`Backup grupy "${org.name}" został pobrany.`);
    } catch (e) {
      toast.error(`Błąd backupu: ${e.message}`);
    }
  }, [fetchTable, toast]);

  const handleImportOrg = useCallback(async (file) => {
    if (!client) return;

    const text = await file.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      toast.error("Nieprawidłowy plik JSON.");
      return;
    }

    const backupOrg = parsed?.organization;
    if (!backupOrg?.name) {
      toast.error("Plik backupu nie zawiera danych organizacji.");
      return;
    }

    const ok = await confirm({
      title: "Przywróć backup",
      message: `Czy przywrócić backup grupy "${backupOrg.name}"? Zostanie utworzona nowa grupa na podstawie pliku.`,
      confirmLabel: "Przywróć",
    });

    if (!ok) return;

    try {
      const createdOrg = await importOrganizationBackup({
        client,
        parsed,
        existingOrgs: myOrgs,
        sessionEmail: session?.email,
      });

      await reloadOrgs();
      await loadOrgStats();
      toast.success(`Backup został przywrócony jako grupa "${createdOrg.name}" (${createdOrg.slug}).`);
    } catch (e) {
      toast.error(`Błąd przywracania backupu: ${e.message}`);
    }
  }, [client, confirm, loadOrgStats, myOrgs, reloadOrgs, session?.email, toast]);

  const handleDuplicateOrg = useCallback(async (org) => {
    if (!client || !org?.id) return;

    try {
      const ok = await confirm({
        title: "Duplikuj grupę",
        message: `Czy utworzyć kopię grupy "${org.name}"? Zostanie skopiowana struktura grupy i sekcje, bez terminów i historii odpowiedzi.`,
        confirmLabel: "Duplikuj",
      });

      if (!ok) return;

      const newOrg = await duplicateOrganizationStructure({
        client,
        fetchTable,
        org,
        existingOrgs: myOrgs,
        sessionEmail: session?.email,
        currentMemberName: currentMember?.name,
        currentMemberPhone: currentMember?.phone,
      });

      await reloadOrgs();
      await loadOrgStats();
      toast.success(`Utworzono kopię grupy: "${newOrg.name}".`);
    } catch (e) {
      toast.error(`Błąd duplikowania grupy: ${e.message}`);
    }
  }, [client, confirm, currentMember?.name, currentMember?.phone, fetchTable, loadOrgStats, myOrgs, reloadOrgs, session?.email, toast]);

  return {
    orgStats,
    statsLoading,
    handleCreateOrg,
    handleUpdateOrg,
    handleArchiveOrg,
    handleRestoreOrg,
    handleDeleteOrg,
    handleExportOrg,
    handleImportOrg,
    handleDuplicateOrg,
    reloadOrgStats: loadOrgStats,
  };
}
