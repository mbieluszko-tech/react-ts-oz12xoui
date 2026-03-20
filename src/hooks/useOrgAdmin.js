import { useCallback } from "react";
import { toast } from "react-hot-toast";

// ─────────────────────────────────────────────────────────────
// API helpers (możesz przenieść do services jeśli chcesz)
// ─────────────────────────────────────────────────────────────

async function promoteOrganizationMemberToAdmin(client, memberId) {
  return client.patch(`members?id=eq.${memberId}`, {
    role: "admin"
  });
}

async function demoteOrganizationAdminToMember(client, memberId) {
  return client.patch(`members?id=eq.${memberId}`, {
    role: "member"
  });
}

async function removeOrganizationMember(client, memberId) {
  return client.delete(`members?id=eq.${memberId}`);
}

// ─────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────

export function useOrgAdmin({
  client,
  loadData,
  reloadOrgs
}) {

  // ─── NADANIE ADMINA ────────────────────────────────────────
  const handlePromoteToAdmin = useCallback(async (memberId) => {
    if (!client || !memberId) return;

    try {
      await promoteOrganizationMemberToAdmin(client, memberId);

      // 🔥 KLUCZOWE — odświeżenie danych
      await loadData();
      await reloadOrgs();

      toast.success("Użytkownik został ustawiony jako administrator.");
    } catch (e) {
      console.error(e);
      toast.error(`Błąd nadawania roli admina: ${e.message}`);
    }
  }, [client, loadData, reloadOrgs]);

  // ─── ODEBRANIE ADMINA ─────────────────────────────────────
  const handleDemoteAdmin = useCallback(async (memberId) => {
    if (!client || !memberId) return;

    try {
      await demoteOrganizationAdminToMember(client, memberId);

      await loadData();
      await reloadOrgs();

      toast.success("Administrator został zmieniony na członka.");
    } catch (e) {
      console.error(e);
      toast.error(`Błąd zmiany roli: ${e.message}`);
    }
  }, [client, loadData, reloadOrgs]);

  // ─── USUNIĘCIE Z GRUPY ─────────────────────────────────────
  const handleRemoveAdminFromOrg = useCallback(async (memberId) => {
    if (!client || !memberId) return;

    try {
      await removeOrganizationMember(client, memberId);

      await loadData();
      await reloadOrgs();

      toast.success("Użytkownik został usunięty z grupy.");
    } catch (e) {
      console.error(e);
      toast.error(`Błąd usuwania użytkownika: ${e.message}`);
    }
  }, [client, loadData, reloadOrgs]);

  // ─────────────────────────────────────────────────────────

  return {
    handlePromoteToAdmin,
    handleDemoteAdmin,
    handleRemoveAdminFromOrg,
  };
}
