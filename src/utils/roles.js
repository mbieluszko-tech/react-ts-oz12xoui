export const ROLE_LABELS_PL = {
  super_admin: "Super administrator",
  admin: "Administrator",
  manager: "Zarządca",
  leader: "Lider",
  member: "Członek",
};

export const ROLE_ORDER = {
  super_admin: 5,
  admin: 4,
  manager: 3,
  leader: 2,
  member: 1,
};

export function isSuperAdminRole(role) {
  return role === "super_admin";
}

export function isAdminRole(role) {
  return role === "admin";
}

export function isManagerRole(role) {
  return role === "manager";
}

export function isLeaderRole(role) {
  return role === "leader";
}

export function isMemberRole(role) {
  return role === "member";
}

export function canManageOrganizations(role) {
  return role === "super_admin";
}

export function canManageMembers(role) {
  return ["super_admin", "admin", "manager"].includes(role);
}

export function canManageRoles(role) {
  return ["super_admin", "admin"].includes(role);
}

export function canManageSections(role) {
  return ["super_admin", "admin", "manager"].includes(role);
}

export function canManageAppointments(role) {
  return ["super_admin", "admin", "manager", "leader"].includes(role);
}

export function canReviewPending(role) {
  return ["super_admin", "admin", "manager"].includes(role);
}

export function canExportMembers(role) {
  return ["super_admin", "admin", "manager"].includes(role);
}

export function getVisibleRoleOptions(currentUserRole) {
  if (currentUserRole === "super_admin") {
    return [
      { value: "member", label: "Członek" },
      { value: "leader", label: "Lider" },
      { value: "manager", label: "Zarządca" },
      { value: "admin", label: "Administrator" },
      { value: "super_admin", label: "Super administrator" },
    ];
  }

  if (currentUserRole === "admin") {
    return [
      { value: "member", label: "Członek" },
      { value: "leader", label: "Lider" },
      { value: "manager", label: "Zarządca" },
      { value: "admin", label: "Administrator" },
    ];
  }

  if (currentUserRole === "manager") {
    return [
      { value: "member", label: "Członek" },
      { value: "leader", label: "Lider" },
      { value: "manager", label: "Zarządca" },
    ];
  }

  return [
    { value: "member", label: "Członek" },
  ];
}

export function getMemberBuckets(members = []) {
  const administration = members.filter(m =>
    !m.section_id && ["super_admin", "admin", "manager"].includes(m.role)
  );

  const leaders = members.filter(m =>
    !m.section_id && m.role === "leader"
  );

  const unassigned = members.filter(m =>
    !m.section_id && !["super_admin", "admin", "manager", "leader"].includes(m.role)
  );

  return {
    administration,
    leaders,
    unassigned,
  };
}
