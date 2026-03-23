import React, { useState, useMemo } from 'react';
import { Icon } from '../common/Icon';
import { ROLE_LABELS, TYPE_LABELS, TYPE_COLORS, fmt, fmtShort, validators } from '../../config';
import { getVisibleRoleOptions } from '../../utils/roles';

// ─── MEMBER MODAL (profil) ────────────────────────────────────────────────────
export function MemberModal({
  member,
  sections,
  appointments,
  getReplies,
  onClose,
  onUpdate,
  canEditMember,
  canManageRoles,
  currentUserRole
}) {
  const sec = sections.find(s => s.id === member.section_id);
  const initials = member.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  const stats = useMemo(() => {
    const yes = appointments.filter(a => getReplies(a.id)[member.id] === "yes").length;
    const no = appointments.filter(a => getReplies(a.id)[member.id] === "no").length;
    const maybe = appointments.filter(a => getReplies(a.id)[member.id] === "maybe").length;
    const total = appointments.length;
    const pct = total ? Math.round((yes / total) * 100) : 0;
    return { yes, no, maybe, total, pct };
  }, [appointments, member.id, getReplies]);

  const [activeTab, setActiveTab] = useState("info");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: member.name,
    email: member.email || "",
    phone: member.phone || "",
    role: member.role,
    status: member.status,
    notes: member.notes || "",
    section_id: member.section_id || "",
  });

  const roleOptions = getVisibleRoleOptions(currentUserRole);

  const setF = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!validators.name(form.name)) errs.name = "Imię i nazwisko — min. 2 znaki";
    if (form.email && !validators.email(form.email)) errs.email = "Podaj prawidłowy adres email";
    if (form.phone && !validators.phone(form.phone)) errs.phone = "Podaj prawidłowy numer telefonu";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || saving) return;
    setSaving(true);
    try {
      await onUpdate(member.id, {
        name: form.name.trim(),
        email: form.email?.trim().toLowerCase() || null,
        phone: form.phone?.trim() || null,
        role: canManageRoles ? form.role : member.role,
        status: form.status,
        notes: form.notes?.trim() || null,
        section_id: form.section_id || null,
      });
      setEditing(false);
      setErrors({});
    } finally {
      setSaving(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter" && !e.shiftKey) handleSave(); };

  const aptHistory = useMemo(() =>
    appointments
      .map(a => ({ ...a, reply: getReplies(a.id)[member.id] || null }))
      .filter(a => a.reply)
      .sort((a, b) => new Date(b.date_start) - new Date(a.date_start)),
    [appointments, member.id, getReplies]
  );

  const tabStyle = (active) => ({
    padding: "10px 16px",
    border: "none",
    background: "none",
    cursor: "pointer",
    fontFamily: "'DM Sans',sans-serif",
    fontSize: 13,
    fontWeight: 500,
    color: active ? "var(--gold)" : "var(--text3)",
    borderBottom: active ? "2px solid var(--gold)" : "2px solid transparent",
    marginBottom: -1,
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={`Profil: ${member.name}`}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              className="member-av"
              style={{
                width: 48,
                height: 48,
                fontSize: 18,
                background: `linear-gradient(135deg,${sec?.color || "var(--gold)"}88,${sec?.color || "var(--gold)"}33)`,
                color: sec?.color || "var(--gold)"
              }}
            >
              {initials}
            </div>
            <div>
              <div className="modal-title" style={{ fontSize: 20 }}>{member.name}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                <span className={`role-badge role-${member.role}`}>{ROLE_LABELS[member.role]}</span>
                {sec && <span style={{ fontSize: 11, color: "var(--text3)" }}>{sec.name}</span>}
                {member.status !== "active" && (
                  <span className="pending-badge">{member.status === "pending" ? "Oczekuje" : "Odrzucony"}</span>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {canEditMember && (
              <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(!editing); setErrors({}); }}>
                <Icon name="edit" size={14} /> {editing ? "Anuluj" : "Edytuj"}
              </button>
            )}
            <button className="btn btn-ghost btn-sm" aria-label="Zamknij" onClick={onClose}>
              <Icon name="x" size={16} />
            </button>
          </div>
        </div>

        <div role="tablist" style={{ padding: "0 28px", borderBottom: "1px solid var(--border)", display: "flex", gap: 4 }}>
          {[["info", "Informacje"], ["stats", "Statystyki"], ["history", "Historia terminów"]].map(([k, v]) => (
            <button key={k} role="tab" aria-selected={activeTab === k} onClick={() => setActiveTab(k)} style={tabStyle(activeTab === k)}>
              {v}
            </button>
          ))}
        </div>

        <div className="modal-body">
          {activeTab === "info" && (
            editing && canEditMember ? (
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 16 }}>
                  Edycja danych członka
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="em-name">Imię i nazwisko *</label>
                    <input id="em-name" className={`form-input ${errors.name ? "input-error" : ""}`} value={form.name} onChange={e => setF("name", e.target.value)} onKeyDown={handleKey} />
                    {errors.name && <div className="field-error">{errors.name}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="em-email">Email</label>
                    <input id="em-email" type="email" className={`form-input ${errors.email ? "input-error" : ""}`} value={form.email} onChange={e => setF("email", e.target.value)} onKeyDown={handleKey} />
                    {errors.email && <div className="field-error">{errors.email}</div>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="em-phone">Telefon</label>
                    <input id="em-phone" className={`form-input ${errors.phone ? "input-error" : ""}`} value={form.phone} onChange={e => setF("phone", e.target.value)} onKeyDown={handleKey} />
                    {errors.phone && <div className="field-error">{errors.phone}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="em-section">Sekcja</label>
                    <select id="em-section" className="form-input" value={form.section_id} onChange={e => setF("section_id", e.target.value)}>
                      <option value="">-- bez sekcji --</option>
                      {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="em-role">Rola</label>
                    <select
                      id="em-role"
                      className="form-input"
                      value={form.role}
                      onChange={e => setF("role", e.target.value)}
                      disabled={!canManageRoles}
                    >
                      {roleOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    {!canManageRoles && (
                      <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 6 }}>
                        Nie masz uprawnień do zmiany ról.
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="em-status">Status</label>
                    <select id="em-status" className="form-input" value={form.status} onChange={e => setF("status", e.target.value)}>
                      <option value="active">Aktywny</option>
                      <option value="pending">Oczekujący</option>
                      <option value="rejected">Odrzucony</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="em-notes">Notatki wewnętrzne</label>
                  <textarea id="em-notes" className="form-input" value={form.notes} onChange={e => setF("notes", e.target.value)} placeholder="Notatki zarządu..." />
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-primary" disabled={saving} onClick={handleSave}>
                    {saving
                      ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Zapisywanie…</>
                      : <><Icon name="check" size={14} /> Zapisz zmiany</>
                    }
                  </button>
                  <button className="btn btn-secondary" disabled={saving} onClick={() => { setEditing(false); setErrors({}); }}>Anuluj</button>
                </div>
              </div>
            ) : (
              <div>
                <div className="info-row"><span className="info-row-label">Email</span><span className="info-row-value">{member.email || "—"}</span></div>
                <div className="info-row"><span className="info-row-label">Telefon</span><span className="info-row-value">{member.phone || "—"}</span></div>
                <div className="info-row"><span className="info-row-label">Sekcja</span><span className="info-row-value">{sec?.name || "—"}</span></div>
                <div className="info-row"><span className="info-row-label">Rola</span><span className="info-row-value">{ROLE_LABELS[member.role]}</span></div>
                <div className="info-row"><span className="info-row-label">Status</span><span className="info-row-value">{member.status === "active" ? "✓ Aktywny" : member.status === "pending" ? "⏳ Oczekuje" : "✗ Odrzucony"}</span></div>
                <div className="info-row"><span className="info-row-label">Dołączył/a</span><span className="info-row-value">{member.joined_at ? fmt(member.joined_at) : "—"}</span></div>
                <div className="info-row"><span className="info-row-label">Zgoda RODO</span><span className="info-row-value">{member.rodo_accepted ? "✓ " + fmt(member.rodo_accepted_at) : "✗ Brak"}</span></div>
                <div className="info-row"><span className="info-row-label">Regulamin</span><span className="info-row-value">{member.terms_accepted ? "✓ Zaakceptowany" : "✗ Brak"}</span></div>
                {member.approved_by && <div className="info-row"><span className="info-row-label">Zatwierdził/a</span><span className="info-row-value">{member.approved_by} · {fmt(member.approved_at)}</span></div>}
                {member.notes && (
                  <div style={{ marginTop: 16, padding: 12, background: "var(--bg3)", borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Notatki zarządu</div>
                    <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.5 }}>{member.notes}</div>
                  </div>
                )}
              </div>
            )
          )}

          {activeTab === "stats" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
                {[
                  ["TAK", "var(--yes)", stats.yes],
                  ["NIE", "var(--no)", stats.no],
                  ["MOŻE", "var(--maybe)", stats.maybe],
                  ["Frekwencja", "var(--gold)", `${stats.pct}%`],
                ].map(([label, color, val]) => (
                  <div key={label} style={{ background: "var(--bg3)", borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 6 }}>{label}</div>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700, color }}>{val}</div>
                    {label !== "Frekwencja" && <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>z {stats.total}</div>}
                  </div>
                ))}
              </div>
              <div style={{ height: 8, background: "var(--bg3)", borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
                <div style={{ height: "100%", width: `${stats.pct}%`, background: "var(--yes)", borderRadius: 4, transition: "width .5s" }} />
              </div>
              <div style={{ fontSize: 12, color: "var(--text3)", textAlign: "center" }}>{stats.pct}% terminów z odpowiedzią TAK</div>
              {stats.total === 0 && <div className="empty-state" style={{ padding: 32 }}><p>Brak terminów do analizy</p></div>}
            </div>
          )}

          {activeTab === "history" && (
            <div>
              <div style={{ fontSize: 13, color: "var(--text3)", marginBottom: 16 }}>{aptHistory.length} terminów z odpowiedzią</div>
              {!aptHistory.length && (
                <div className="empty-state" style={{ padding: 32 }}>
                  <Icon name="calendar" size={32} />
                  <p style={{ marginTop: 8 }}>Brak historii</p>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 380, overflowY: "auto" }}>
                {aptHistory.map(a => (
                  <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "var(--bg3)", borderRadius: 8 }}>
                    <div style={{ width: 3, height: 32, borderRadius: 2, background: TYPE_COLORS[a.type], flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{fmtShort(a.date_start)} · {TYPE_LABELS[a.type]}</div>
                    </div>
                    <span className={`reply-pill ${a.reply}`} style={{ cursor: "default" }}>
                      {a.reply === "yes" ? "TAK" : a.reply === "no" ? "NIE" : "MOŻE"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
