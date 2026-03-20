import { useCallback } from 'react';
import {
  createOrganizationWithAdmin,
  updateOrganizationWithAdmin,
  listOrganizationAdmins,
  promoteOrganizationMemberToAdmin,
  demoteOrganizationAdminToMember,
  removeOrganizationMember,
  archiveOrganization,
  restoreOrganization,
  fetchOrganizationDependencies,
  deleteOrganizationPermanently,
  exportOrganizationBackup,
  importOrganizationBackup,
} from '../services/orgService';

export function useOrgAdmin({
  client,
  toast,
  confirm,
  fetchTable,
  reloadOrgs,
  loadData,
  currentOrg,
  setCurrentOrg,
  setView,
  session,
  currentMember,
  makeImportSlug,
  downloadJsonFile,
}) {
  const handleCreateOrg = useCallback(async (formData) => {
    if (!client) return;

    try {
      const org = await createOrganizationWithAdmin({
        client,
        formData,
        sessionEmail: session?.email,
        currentMember,
      });

      await reloadOrgs();
      toast.success(`Grupa "${org.name}" utworzona.`);
    } catch (e) {
      toast.error(`Błąd tworzenia grupy: ${e.message}`);
    }
  }, [client, currentMember, reloadOrgs, session?.email, toast]);

  const handleUpdateOrg = useCallback(async (id, updates) => {
    if (!client) return;

    try {
      await updateOrganizationWithAdmin({
        client,
        id,
        updates,
        sessionEmail: session?.email,
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
  }, [client, currentOrg, reloadOrgs, session?.email, setCurrentOrg, toast]);

  const handleLoadAdmins = useCallback(async (orgId) => {
    if (!client || !orgId) return [];
    try {
      return await listOrganizationAdmins(client, orgId);
    } catch (e) {
      toast.error(`Błąd ładowania administratorów: ${e.message}`);
      return [];
    }
  }, [client, toast]);

  const handlePromoteToAdmin = useCallback(async (memberId) => {
    if (!client || !memberId) return;
    try {
      await promoteOrganizationMemberToAdmin(client, memberId);
      toast.success("Użytkownik został ustawiony jako admin.");
    } catch (e) {
      toast.error(`Błąd nadawania roli admina: ${e.message}`);
    }
  }, [client, toast]);

  const handleDemoteAdmin = useCallback(async (memberId) => {
    if (!client || !memberId) return;
    try {
      await demoteOrganizationAdminToMember(client, memberId);
      toast.success("Administrator został zmieniony na członka.");
    } catch (e) {
      toast.error(`Błąd zmiany roli: ${e.message}`);
    }
  }, [client, toast]);

  const handleRemoveAdminFromOrg = useCallback(async (memberId) => {
    if (!client || !memberId) return;
    try {
      await removeOrganizationMember(client, memberId);
      toast.success("Administrator został usunięty z grupy.");
    } catch (e) {
      toast.error(`Błąd usuwania administratora: ${e.message}`);
    }
  }, [client, toast]);

  const handleArchiveOrg = useCallback(async (org) => {
    if (!client || !org?.id) return;

    const ok = await confirm({
      title: "Archiwizuj grupę",
      message: `Czy na pewno zarchiwizować grupę "${org.name}"? Grupa zniknie z aktywnej listy, ale będzie można ją przywrócić.`,
      confirmLabel: "Archiwizuj",
    });

    if (!ok) return;

    try {
      await archiveOrganization({
        client,
        orgId: org.id,
        archivedBy: session?.email || null,
      });

      if (currentOrg?.id === org.id) {
        localStorage.removeItem("km_org");
        setCurrentOrg(null);
        setView("dashboard");
      }

      await reloadOrgs();
      await loadData();
      toast.success(`Grupa "${org.name}" została zarchiwizowana.`);
    } catch (e) {
      toast.error(`Błąd archiwizacji grupy: ${e.message}`);
    }
  }, [client, confirm, currentOrg?.id, loadData, reloadOrgs, session?.email, setCurrentOrg, setView, toast]);

  const handleRestoreOrg = useCallback(async (org) => {
    if (!client || !org?.id) return;

    try {
      await restoreOrganization({ client, orgId: org.id });
      await reloadOrgs();
      toast.success(`Grupa "${org.name}" została przywrócona.`);
    } catch (e) {
      toast.error(`Błąd przywracania grupy: ${e.message}`);
    }
  }, [client, reloadOrgs, toast]);

  const handleDeleteOrg = useCallback(async (org) => {
    if (!client || !org?.id) return;

    try {
      const deps = await fetchOrganizationDependencies(fetchTable, org.id);

      if (deps.membersCount > 0 || deps.appointmentsCount > 0 || deps.sectionsCount > 0) {
        toast.error(
          `Nie można usunąć grupy "${org.name}". Zawiera dane: członkowie: ${deps.membersCount}, terminy: ${deps.appointmentsCount}, sekcje: ${deps.sectionsCount}.`
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

      await deleteOrganizationPermanently(client, org.id);

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
  }, [client, confirm, currentOrg?.id, fetchTable, loadData, reloadOrgs, setCurrentOrg, setView, toast]);

  const handleExportOrg = useCallback(async (org) => {
    try {
      const backup = await exportOrganizationBackup({
        fetchTable,
        organization: org,
      });

      const filename = `backup-${String(org.slug || "grupa")}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
      downloadJsonFile(filename, backup);
      toast.success(`Backup grupy "${org.name}" został pobrany.`);
    } catch (e) {
      toast.error(`Błąd backupu: ${e.message}`);
    }
  }, [downloadJsonFile, fetchTable, toast]);

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
        makeImportSlug,
        sessionEmail: session?.email,
      });

      await reloadOrgs();
      toast.success(`Backup został przywrócony jako grupa "${createdOrg.name}" (${createdOrg.slug}).`);
    } catch (e) {
      toast.error(`Błąd przywracania backupu: ${e.message}`);
    }
  }, [client, confirm, makeImportSlug, reloadOrgs, session?.email, toast]);

  return {
    handleCreateOrg,
    handleUpdateOrg,
    handleLoadAdmins,
    handlePromoteToAdmin,
    handleDemoteAdmin,
    handleRemoveAdminFromOrg,
    handleArchiveOrg,
    handleRestoreOrg,
    handleDeleteOrg,
    handleExportOrg,
    handleImportOrg,
  };
}
