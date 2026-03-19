import React, { useState } from 'react';
import { Icon } from '../common/Icon';
import { validators } from '../../config';

// ─── ADD MEMBER MODAL ─────────────────────────────────────────────────────────
export function AddMemberModal({ sections, onClose, onAdd }) {
  const [form, setForm] = useState({
    name:"", email:"", phone:"", section_id:"", role:"member", notes:"",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

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

  const handleSubmit = async () => {
    if (!validate() || saving) return;
    setSaving(true);
    try {
      await onAdd({
        name:       form.name.trim(),
        email:      form.email?.trim().toLowerCase() || null,
        phone:      form.phone?.trim() || null,
        section_id: form.section_id || null,
        role:       form.role,
        notes:      form.notes?.trim() || null,
        status:     "active",
        rodo_accepted:     true,
        terms_accepted:    true,
        rodo_accepted_at:  new Date().toISOString(),
        terms_accepted_at: new Date().toISOString(),
        joined_at:         new Date().toISOString(),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter" && !e.shiftKey) handleSubmit(); };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Dodaj członka">
        <div className="modal-header">
          <div className="modal-title">Dodaj członka</div>
          <button className="btn btn-ghost btn-sm" aria-label="Zamknij" onClick={onClose}>
            <Icon name="x" size={16}/>
          </button>
        </div>

        <div className="modal-body">
          <div className="info-box">
            Administrator dodaje członka bezpośrednio — bez procesu rejestracji.
            Zgody RODO i Regulamin zostaną zaznaczone jako zaakceptowane.
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="add-name">Imię i nazwisko *</label>
              <input
                id="add-name" autoFocus
                className={`form-input ${errors.name ? "input-error" : ""}`}
                placeholder="Jan Kowalski"
                value={form.name}
                onChange={e => setF("name", e.target.value)}
                onKeyDown={handleKey}
              />
              {errors.name && <div className="field-error">{errors.name}</div>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="add-email">Email</label>
              <input
                id="add-email" type="email"
                className={`form-input ${errors.email ? "input-error" : ""}`}
                placeholder="jan@email.pl"
                value={form.email}
                onChange={e => setF("email", e.target.value)}
                onKeyDown={handleKey}
              />
              {errors.email && <div className="field-error">{errors.email}</div>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="add-phone">Telefon</label>
              <input
                id="add-phone"
                className={`form-input ${errors.phone ? "input-error" : ""}`}
                placeholder="+48 123 456 789"
                value={form.phone}
                onChange={e => setF("phone", e.target.value)}
                onKeyDown={handleKey}
              />
              {errors.phone && <div className="field-error">{errors.phone}</div>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="add-section">Sekcja</label>
              <select id="add-section" className="form-input" value={form.section_id} onChange={e => setF("section_id", e.target.value)}>
                <option value="">-- wybierz --</option>
                {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="add-role">Rola</label>
            <select id="add-role" className="form-input" value={form.role} onChange={e => setF("role", e.target.value)}>
              <option value="member">Członek</option>
              <option value="manager">Zarządca</option>
              <option value="leader">Lider</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="add-notes">Notatki (opcjonalnie)</label>
            <textarea id="add-notes" className="form-input" placeholder="Dodatkowe informacje..." value={form.notes} onChange={e => setF("notes", e.target.value)}/>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>Anuluj</button>
          <button className="btn btn-primary" disabled={saving} onClick={handleSubmit}>
            {saving
              ? <><div className="spinner" style={{ width:14, height:14, borderWidth:2 }}/> Zapisywanie…</>
              : <><Icon name="check" size={14}/> Dodaj członka</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
