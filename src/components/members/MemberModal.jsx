import React, { useState, useMemo } from 'react';
import { Icon } from '../common/Icon';
import { ROLE_LABELS, TYPE_LABELS, TYPE_COLORS, fmt, fmtShort, validators } from '../../config';

// ─── MEMBER MODAL (profil) ────────────────────────────────────────────────────
export function MemberModal({ member, sections, appointments, getReplies, onClose, onUpdate, isAdmin }) {
  const sec      = sections.find(s => s.id === member.section_id);
  const initials = member.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  // ─── STATYSTYKI ─────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const yes   = appointments.filter(a => getReplies(a.id)[member.id] === "yes").length;
    const no    = appointments.filter(a => getReplies(a.id)[member.id] === "no").length;
    const maybe = appointments.filter(a => getReplies(a.id)[member.id] === "maybe").length;
    const total = appointments.length;
    const pct   = total ? Math.round((yes / total) * 100) : 0;
    return { yes, no, maybe, total, pct };
  }, [appointments, member.id, getReplies]);

  const [activeTab, setActiveTab] = useState("info");
  const [editing, setEditing]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [errors, setErrors]       = useState({});

  const [form, setForm] = useState({
    name:       member.name,
    email:      member.email      || "",
    phone:      member.phone      || "",
    role:       member.role,
    status:     member.status,
    notes:      member.notes      || "",
    section_id: member.section_id || "",
  });

  const setF = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!validators.name(form.name))
      errs.name = "Imię i nazwisko — min. 2 znaki";
    if (form.email && !validators.email(form.email))
      errs.email = "Podaj prawidłowy adres email";
    if (form.phone && !validators.phone(form.phone))
      errs.phone = "Podaj prawidłowy numer telefonu";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // 🔥 KLUCZOWE — zapis (z poprawką)
  const handleSave = async () => {
    if (!validate() || saving) return;
    setSaving(true);

    try {
      await onUpdate(member.id, {
        name:       form.name.trim(),
        email:      form.email?.trim().toLowerCase() || null,
        phone:      form.phone?.trim() || null,
        role:       form.role,
        status:     form.status,
        notes:      form.notes?.trim() || null,
        section_id: form.section_id || null,
      });

      setEditing(false);
      setErrors({});
    } finally {
      setSaving(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) handleSave();
  };

  // ─── HISTORIA TERMINÓW ─────────────────────────────────────────────────────
  const aptHistory = useMemo(() =>
    appointments
      .map(a => ({ ...a, reply: getReplies(a.id)[member.id] || null }))
      .filter(a => a.reply)
      .sort((a, b) => new Date(b.date_start) - new Date(a.date_start)),
    [appointments, member.id, getReplies]
  );

  const tabStyle = (active) => ({
    padding:"10px 16px",
    border:"none",
    background:"none",
    cursor:"pointer",
    fontFamily:"'DM Sans',sans-serif",
    fontSize:13,
    fontWeight:500,
    color: active ? "var(--gold)" : "var(--text3)",
    borderBottom: active ? "2px solid var(--gold)" : "2px solid transparent",
    marginBottom: -1,
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={e => e.stopPropagation()} role="dialog">

        {/* HEADER */}
        <div className="modal-header">
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div className="member-av"
              style={{
                width:48,
                height:48,
                fontSize:18,
                background:`linear-gradient(135deg,${sec?.color||"var(--gold)"}88,${sec?.color||"var(--gold)"}33)`,
                color:sec?.color||"var(--gold)"
              }}>
              {initials}
            </div>

            <div>
              <div className="modal-title" style={{ fontSize:20 }}>{member.name}</div>
              <div style={{ display:"flex", gap:6, marginTop:4, flexWrap:"wrap" }}>
                <span className={`role-badge role-${member.role}`}>
                  {ROLE_LABELS[member.role]}
                </span>

                {sec && <span style={{ fontSize:11, color:"var(--text3)" }}>{sec.name}</span>}

                {member.status !== "active" && (
                  <span className="pending-badge">
                    {member.status === "pending" ? "Oczekuje" : "Odrzucony"}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display:"flex", gap:8 }}>
            {isAdmin && (
              <button className="btn btn-secondary btn-sm"
                onClick={() => { setEditing(!editing); setErrors({}); }}>
                <Icon name="edit" size={14}/> {editing ? "Anuluj" : "Edytuj"}
              </button>
            )}
            <button className="btn btn-ghost btn-sm" onClick={onClose}>
              <Icon name="x" size={16}/>
            </button>
          </div>
        </div>

        {/* TABS */}
        <div style={{ padding:"0 28px", borderBottom:"1px solid var(--border)", display:"flex", gap:4 }}>
          {[["info","Informacje"],["stats","Statystyki"],["history","Historia"]].map(([k, v]) => (
            <button key={k} onClick={() => setActiveTab(k)} style={tabStyle(activeTab === k)}>
              {v}
            </button>
          ))}
        </div>

        <div className="modal-body">

          {/* INFO */}
          {activeTab === "info" && (
            editing && isAdmin ? (
              <div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Imię i nazwisko *</label>
                    <input className="form-input"
                      value={form.name}
                      onChange={e=>setF("name",e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Email</label>
                    <input className="form-input"
                      value={form.email}
                      onChange={e=>setF("email",e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Telefon</label>
                    <input className="form-input"
                      value={form.phone}
                      onChange={e=>setF("phone",e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Sekcja</label>
                    <select className="form-input"
                      value={form.section_id}
                      onChange={e=>setF("section_id", e.target.value)}>
                      <option value="">-- brak --</option>
                      {sections.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Rola</label>
                    <select className="form-input"
                      value={form.role}
                      onChange={e=>setF("role", e.target.value)}>
                      <option value="member">Członek</option>
                      <option value="manager">Zarządca</option>
                      <option value="leader">Lider sekcji</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Status</label>
                    <select className="form-input"
                      value={form.status}
                      onChange={e=>setF("status", e.target.value)}>
                      <option value="active">Aktywny</option>
                      <option value="pending">Oczekujący</option>
                      <option value="rejected">Odrzucony</option>
                    </select>
                  </div>
                </div>

                <div style={{ display:"flex", gap:8 }}>
                  <button className="btn btn-primary" onClick={handleSave}>
                    Zapisz zmiany
                  </button>
                  <button className="btn btn-secondary" onClick={()=>setEditing(false)}>
                    Anuluj
                  </button>
                </div>

              </div>
            ) : (
              <div>
                <div className="info-row"><b>Email:</b> {member.email || "—"}</div>
                <div className="info-row"><b>Telefon:</b> {member.phone || "—"}</div>
                <div className="info-row"><b>Sekcja:</b> {sec?.name || "—"}</div>
                <div className="info-row"><b>Rola:</b> {ROLE_LABELS[member.role]}</div>
              </div>
            )
          )}

          {/* STATS */}
          {activeTab === "stats" && (
            <div>Frekwencja: {stats.pct}%</div>
          )}

          {/* HISTORY */}
          {activeTab === "history" && (
            <div>
              {aptHistory.map(a => (
                <div key={a.id}>{a.name} – {a.reply}</div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
