export function normalizeSlug(value) {
  return (value || "")
    .toLowerCase()
    .trim()
    .replace(/ą/g, "a")
    .replace(/ć/g, "c")
    .replace(/ę/g, "e")
    .replace(/ł/g, "l")
    .replace(/ń/g, "n")
    .replace(/ó/g, "o")
    .replace(/ś/g, "s")
    .replace(/ź/g, "z")
    .replace(/ż/g, "z")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
}

export function makeUniqueSlug(baseSlug, organizations = [], currentOrgId = null) {
  const cleanBase = normalizeSlug(baseSlug);
  if (!cleanBase) return "";

  const usedSlugs = new Set(
    organizations
      .filter(org => org?.id !== currentOrgId)
      .map(org => String(org.slug || "").toLowerCase())
  );

  if (!usedSlugs.has(cleanBase)) return cleanBase;

  let counter = 2;
  let candidate = `${cleanBase}-${counter}`;

  while (usedSlugs.has(candidate)) {
    counter += 1;
    candidate = `${cleanBase}-${counter}`;
  }

  return candidate;
}

async function ensureOrganizationAdmin({
  client,
  organizationId,
  adminEmail,
  adminName,
  approvedBy,
}) {
  const email = adminEmail?.trim().toLowerCase();
  if (!email) return null;

  const existing = await client.get(
    `members?organization_id=eq.${organizationId}&email=eq.${encodeURIComponent(email)}&select=id,name,email,role&limit=1`
  );

  const found = Array.isArray(existing) ? existing[0] : null;

  if (found?.id) {
    await client.patch(`members?id=eq.${found.id}`, {
      role: "admin",
      name: adminName?.trim() || found.name || email,
      status: "active",
      approved_by: approvedBy || null,
      approved_at: new Date().toISOString(),
    });
    return { ...found, role: "admin" };
  }

  const created = await client.post("members", {
    name: adminName?.trim() || email,
    email,
    phone: null,
    section_id: null,
    role: "admin",
    status: "active",
    organization_id: organizationId,
    rodo_accepted: true,
    terms_accepted: true,
    joined_at: new Date().toISOString(),
    approved_by: approvedBy || null,
    approved_at: new Date().toISOString(),
  });

  return Array.isArray(created) ? created[0] : created;
}

export async function createOrganizationWithAdmin({
  client,
  formData,
  sessionEmail,
  currentMember,
}) {
  const created = await client.post("organizations", {
    name: formData.name.trim(),
    slug: formData.slug.toLowerCase().trim(),
    type: formData.type,
    description: formData.description?.trim() || null,
    color: formData.color || "#C9A84C",
    logo_emoji: formData.logo_emoji || "🎼",
    active: formData.active ?? true,
    archived_at: null,
    archived_by: null,
  });

  const org = Array.isArray(created) ? created[0] : created;
  if (!org?.id) {
    throw new Error("Nie udało się utworzyć organizacji.");
  }

  const sections = (formData.sections || []).filter(s => s.name?.trim());
  if (sections.length) {
    await client.post(
      "sections",
      sections.map(s => ({
        name: s.name.trim(),
        color: s.color || "#888",
        organization_id: org.id,
      }))
    );
  }

  if (sessionEmail) {
    await client.post("members", {
      name: currentMember?.name || sessionEmail,
      email: sessionEmail,
      phone: currentMember?.phone || null,
      section_id: null,
      role: "super_admin",
      status: "active",
      organization_id: org.id,
      rodo_accepted: true,
      terms_accepted: true,
      joined_at: new Date().toISOString(),
      approved_by: sessionEmail,
      approved_at: new Date().toISOString(),
    });
  }

  const targetAdminEmail = formData.admin_email?.trim().toLowerCase();
  if (targetAdminEmail && targetAdminEmail !== sessionEmail?.toLowerCase()) {
    await ensureOrganizationAdmin({
      client,
      organizationId: org.id,
      adminEmail: targetAdminEmail,
      adminName: formData.admin_name,
      approvedBy: sessionEmail || null,
    });
  }

  return org;
}

export async function updateOrganization(client, id, updates) {
  await client.patch(`organizations?id=eq.${id}`, {
    ...updates,
    slug: updates.slug?.toLowerCase().trim(),
    name: updates.name?.trim(),
  });
}

export async function updateOrganizationWithAdmin({
  client,
  id,
  updates,
  sessionEmail,
}) {
  await updateOrganization(client, id, updates);

  if (updates.admin_email?.trim()) {
    await ensureOrganizationAdmin({
      client,
      organizationId: id,
      adminEmail: updates.admin_email,
      adminName: updates.admin_name,
      approvedBy: sessionEmail || null,
    });
  }
}

export async function archiveOrganization({ client, orgId, archivedBy }) {
  return client.patch(`organizations?id=eq.${orgId}`, {
    archived_at: new Date().toISOString(),
    archived_by: archivedBy || null,
    active: false,
  });
}

export async function restoreOrganization({ client, orgId }) {
  return client.patch(`organizations?id=eq.${orgId}`, {
    archived_at: null,
    archived_by: null,
    active: true,
  });
}

export async function fetchOrganizationDependencies(fetchTable, orgId) {
  const [members, appointments, sections] = await Promise.all([
    fetchTable(`members?organization_id=eq.${orgId}&select=id`),
    fetchTable(`appointments?organization_id=eq.${orgId}&select=id`),
    fetchTable(`sections?organization_id=eq.${orgId}&select=id`),
  ]);

  return {
    membersCount: members?.length || 0,
    appointmentsCount: appointments?.length || 0,
    sectionsCount: sections?.length || 0,
  };
}

export async function deleteOrganizationPermanently(client, orgId) {
  return client.delete(`organizations?id=eq.${orgId}`);
}

export async function exportOrganizationBackup({
  fetchTable,
  organization,
}) {
  const sections = await fetchTable(`sections?organization_id=eq.${organization.id}&select=*`);
  const members = await fetchTable(`members?organization_id=eq.${organization.id}&select=*`);
  const appointments = await fetchTable(`appointments?organization_id=eq.${organization.id}&select=*`);
  const pending = await fetchTable(`pending_registrations?organization_id=eq.${organization.id}&select=*`);

  const appointmentIds = appointments.map(a => a.id);

  let appointmentSections = [];
  let replies = [];

  if (appointmentIds.length > 0) {
    appointmentSections = await fetchTable(`appointment_sections?appointment_id=in.(${appointmentIds.join(",")})&select=*`);
    replies = await fetchTable(`replies?appointment_id=in.(${appointmentIds.join(",")})&select=*`);
  }

  return {
    meta: {
      version: 1,
      exported_at: new Date().toISOString(),
      source_org_id: organization.id,
    },
    organization,
    sections,
    members,
    appointments,
    appointment_sections: appointmentSections,
    replies,
    pending_registrations: pending,
  };
}

export async function importOrganizationBackup({
  client,
  parsed,
  makeImportSlug,
  sessionEmail,
}) {
  const backupOrg = parsed?.organization;
  if (!backupOrg?.name) {
    throw new Error("Plik backupu nie zawiera danych organizacji.");
  }

  const newSlug = makeImportSlug(backupOrg.slug || backupOrg.name);

  const createdOrgRaw = await client.post("organizations", {
    name: backupOrg.name,
    slug: newSlug,
    type: backupOrg.type || "other",
    description: backupOrg.description || null,
    color: backupOrg.color || "#C9A84C",
    logo_emoji: backupOrg.logo_emoji || "🎼",
    active: backupOrg.active ?? true,
    archived_at: null,
    archived_by: null,
  });

  const createdOrg = Array.isArray(createdOrgRaw) ? createdOrgRaw[0] : createdOrgRaw;
  if (!createdOrg?.id) throw new Error("Nie udało się utworzyć organizacji z backupu.");

  const oldToNewSectionId = {};
  const oldToNewMemberId = {};
  const oldToNewAppointmentId = {};

  const backupSections = Array.isArray(parsed.sections) ? parsed.sections : [];
  for (const s of backupSections) {
    const createdSectionRaw = await client.post("sections", {
      name: s.name,
      color: s.color || "#888888",
      organization_id: createdOrg.id,
      sort_order: s.sort_order ?? null,
    });
    const createdSection = Array.isArray(createdSectionRaw) ? createdSectionRaw[0] : createdSectionRaw;
    oldToNewSectionId[s.id] = createdSection.id;
  }

  const backupMembers = Array.isArray(parsed.members) ? parsed.members : [];
  for (const m of backupMembers) {
    const createdMemberRaw = await client.post("members", {
      name: m.name,
      email: m.email,
      phone: m.phone || null,
      section_id: m.section_id ? oldToNewSectionId[m.section_id] || null : null,
      role: m.role || "member",
      status: m.status || "active",
      organization_id: createdOrg.id,
      rodo_accepted: m.rodo_accepted ?? true,
      terms_accepted: m.terms_accepted ?? true,
      rodo_accepted_at: m.rodo_accepted_at || null,
      terms_accepted_at: m.terms_accepted_at || null,
      joined_at: m.joined_at || new Date().toISOString(),
      approved_by: m.approved_by || sessionEmail || null,
      approved_at: m.approved_at || null,
    });
    const createdMember = Array.isArray(createdMemberRaw) ? createdMemberRaw[0] : createdMemberRaw;
    oldToNewMemberId[m.id] = createdMember.id;
  }

  const backupAppointments = Array.isArray(parsed.appointments) ? parsed.appointments : [];
  for (const a of backupAppointments) {
    const createdAppointmentRaw = await client.post("appointments", {
      name: a.name,
      type: a.type,
      date_start: a.date_start,
      date_end: a.date_end,
      location: a.location || null,
      description: a.description || null,
      deadline: a.deadline || null,
      status: a.status || "active",
      published: a.published ?? true,
      organization_id: createdOrg.id,
      recurring_type: a.recurring_type || "none",
      recurring_until: a.recurring_until || null,
      recurring_group_id: a.recurring_group_id || null,
    });
    const createdAppointment = Array.isArray(createdAppointmentRaw) ? createdAppointmentRaw[0] : createdAppointmentRaw;
    oldToNewAppointmentId[a.id] = createdAppointment.id;
  }

  const backupAppointmentSections = Array.isArray(parsed.appointment_sections) ? parsed.appointment_sections : [];
  for (const rel of backupAppointmentSections) {
    const newAppointmentId = oldToNewAppointmentId[rel.appointment_id];
    const newSectionId = oldToNewSectionId[rel.section_id];
    if (!newAppointmentId || !newSectionId) continue;

    await client.post("appointment_sections", {
      appointment_id: newAppointmentId,
      section_id: newSectionId,
    });
  }

  const backupReplies = Array.isArray(parsed.replies) ? parsed.replies : [];
  for (const reply of backupReplies) {
    const newAppointmentId = oldToNewAppointmentId[reply.appointment_id];
    const newMemberId = oldToNewMemberId[reply.member_id];
    if (!newAppointmentId || !newMemberId) continue;

    await client.upsert("replies", {
      appointment_id: newAppointmentId,
      member_id: newMemberId,
      status: reply.status || "maybe",
    });
  }

  const backupPending = Array.isArray(parsed.pending_registrations) ? parsed.pending_registrations : [];
  for (const p of backupPending) {
    await client.post("pending_registrations", {
      name: p.name,
      email: p.email,
      phone: p.phone || null,
      organization_id: createdOrg.id,
      section_id: p.section_id ? oldToNewSectionId[p.section_id] || null : null,
      rodo_accepted: p.rodo_accepted ?? true,
      terms_accepted: p.terms_accepted ?? true,
      message: p.message || null,
    });
  }

  return createdOrg;
}
