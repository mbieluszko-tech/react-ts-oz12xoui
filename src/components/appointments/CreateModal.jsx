import React, { useState, useMemo, useCallback } from 'react';
import { Icon } from '../common/Icon';
import { MAX_RECURRING_APTS } from '../../config';

// ─── CREATE MODAL ─────────────────────────────────────────────────────────────
export function CreateModal({ sections, onClose, onCreate, prefill = null }) {
  const pad     = n => String(n).padStart(2, "0");
  const toLocal = d =>
    `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`;

  // Oblicz daty startowe POZA renderem (useMemo, nie new Date() w body)
  const defaults = useMemo(() => {
    if (prefill) {
      return {
        start: new Date(prefill.date_start),
        end:   new Date(prefill.date_end),
      };
    }
    const start = new Date();
    start.setDate(start.getDate() + 7);
    start.setHours(18, 0, 0, 0);
    const end = new Date(start);
    end.setHours(20, 0, 0, 0);
    return { start, end };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const defaultDeadline = useMemo(() => {
    const dl = new Date(defaults.start);
    dl.setDate(dl.getDate() - 2);
    return dl.toISOString().split("T")[0];
  }, [defaults.start]);

  const [form, setForm] = useState({
    name:           prefill?.name        || "",
    type:           prefill?.type        || "rehearsal",
    dateStart:      toLocal(defaults.start),
    dateEnd:        toLocal(defaults.end),
    location:       prefill?.location    || "",
    description:    prefill?.description || "",
    deadline:       defaultDeadline,
    sectionIds:     sections.map(s => s.id),
    tutti:          true,
    recurring:      "none",
    recurringUntil: "",
  });
  const [errors, setErrors] = useState({});

  const set = useCallback((k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: null }));
  }, [errors]);

  const toggleSec = useCallback((id) => {
    setForm(f => ({
      ...f,
      tutti:      false,
      sectionIds: f.sectionIds.includes(id)
        ? f.sectionIds.filter(s => s !== id)
        : [...f.sectionIds, id],
    }));
  }, []);

  const occurrences = useMemo(() => {
    if (form.recurring === "none" || !form.recurringUntil) return 1;
    const start = new Date(form.dateStart);
    const until = new Date(form.recurringUntil);
    const step  = form.recurring === "weekly" ? 7 : form.recurring === "biweekly" ? 14 : 30;
    let count = 1, cur = new Date(start);
    while (count < MAX_RECURRING_APTS) {
      cur.setDate(cur.getDate() + step);
      if (cur > until) break;
      count++;
    }
    return count;
  }, [form.recurring, form.recurringUntil, form.dateStart]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim())  errs.name      = "Podaj nazwę terminu";
    if (!form.dateStart)    errs.dateStart  = "Podaj datę i godzinę";
    if (form.dateEnd && new Date(form.dateEnd) <= new Date(form.dateStart))
      errs.dateEnd = "Koniec musi być po początku";
    if (form.recurring !== "none" && form.recurringUntil) {
      if (new Date(form.recurringUntil) <= new Date(form.dateStart))
        errs.recurringUntil = "Data końca serii musi być późniejsza niż start";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onCreate({
      name:           form.name.trim(),
      type:           form.type,
      dateStart:      new Date(form.dateStart).toISOString(),
      dateEnd:        new Date(form.dateEnd).toISOString(),
      location:       form.location.trim() || "ACK Alternator",
      description:    form.description.trim(),
      deadline:       form.deadline ? new Date(form.deadline).toISOString() : null,
      sectionIds:     form.tutti ? [] : form.sectionIds,
      tutti:          form.tutti,
      recurring:      form.recurring,
      recurringUntil: form.recurringUntil || null,
    });
    onClose();
  };

  // Enter w polu nazwy → submit
  const handleNameKey = (e) => { if (e.key === "Enter") handleSubmit(); };

  const isCopy = !!prefill;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={isCopy ? "Kopiuj termin" : "Nowy termin"}>
        <div className="modal-header">
          <div className="modal-title">{isCopy ? "Kopiuj termin" : "Nowy termin"}</div>
          <button className="btn btn-ghost btn-sm" aria-label="Zamknij" onClick={onClose}>
            <Icon name="x" size={16}/>
          </button>
        </div>

        <div className="modal-body">
          {isCopy && (
            <div className="info-box" style={{ marginBottom:16 }}>
              📋 Kopiujesz termin <strong>{prefill.name}</strong>. Zmień datę przed zapisaniem.
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="apt-name">Nazwa *</label>
            <input
              id="apt-name"
              className={`form-input ${errors.name ? "input-error" : ""}`}
              placeholder="np. Próba przed koncertem"
              value={form.name}
              onChange={e => set("name", e.target.value)}
              onKeyDown={handleNameKey}
              autoFocus
            />
            {errors.name && <div className="field-error">{errors.name}</div>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="apt-type">Typ</label>
              <select id="apt-type" className="form-input" value={form.type} onChange={e => set("type", e.target.value)}>
                <option value="rehearsal">Próba</option>
                <option value="performance">Koncert</option>
                <option value="other">Inne</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="apt-deadline">Deadline odpowiedzi</label>
              <input id="apt-deadline" className="form-input" type="date" value={form.deadline} onChange={e => set("deadline", e.target.value)}/>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="apt-start">Początek *</label>
              <input id="apt-start" className={`form-input ${errors.dateStart ? "input-error" : ""}`} type="datetime-local" value={form.dateStart} onChange={e => set("dateStart", e.target.value)}/>
              {errors.dateStart && <div className="field-error">{errors.dateStart}</div>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="apt-end">Koniec</label>
              <input id="apt-end" className={`form-input ${errors.dateEnd ? "input-error" : ""}`} type="datetime-local" value={form.dateEnd} onChange={e => set("dateEnd", e.target.value)}/>
              {errors.dateEnd && <div className="field-error">{errors.dateEnd}</div>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="apt-location">Lokalizacja</label>
            <input id="apt-location" className="form-input" placeholder="np. Aula ACK Alternator" value={form.location} onChange={e => set("location", e.target.value)}/>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="apt-desc">Opis</label>
            <textarea id="apt-desc" className="form-input" placeholder="Dodatkowe informacje…" value={form.description} onChange={e => set("description", e.target.value)}/>
          </div>

          <div className="form-group">
            <label className="form-label">Zaproszone sekcje</label>
            <div className="section-checks">
              <div className={`section-check ${form.tutti ? "active" : ""}`} onClick={() => set("tutti", !form.tutti)} style={{ fontWeight:700 }}>
                🎼 Tutti (wszyscy)
              </div>
              {!form.tutti && sections.filter(s => s.active !== false).map(sec => (
                <div key={sec.id} className={`section-check ${form.sectionIds.includes(sec.id) ? "active" : ""}`} onClick={() => toggleSec(sec.id)}>
                  {sec.emoji
                    ? <span style={{ fontSize:15 }}>{sec.emoji}</span>
                    : <div className="section-check-dot" style={{ background:sec.color }}/>
                  }
                  {sec.name}
                </div>
              ))}
            </div>
          </div>

          {!isCopy && (
            <div style={{ padding:16, background:"var(--bg3)", borderRadius:12, marginTop:4 }}>
              <div style={{ fontSize:12, fontWeight:600, color:"var(--text3)", textTransform:"uppercase", letterSpacing:".07em", marginBottom:12 }}>
                🔄 Powtarzanie
              </div>
              <div className="form-row">
                <div className="form-group" style={{ marginBottom:0 }}>
                  <label className="form-label" htmlFor="apt-recurring">Częstotliwość</label>
                  <select id="apt-recurring" className="form-input" value={form.recurring} onChange={e => set("recurring", e.target.value)}>
                    <option value="none">Jednorazowy</option>
                    <option value="weekly">Co tydzień</option>
                    <option value="biweekly">Co 2 tygodnie</option>
                    <option value="monthly">Co miesiąc</option>
                  </select>
                </div>
                {form.recurring !== "none" && (
                  <div className="form-group" style={{ marginBottom:0 }}>
                    <label className="form-label" htmlFor="apt-until">Powtarzaj do</label>
                    <input id="apt-until" className={`form-input ${errors.recurringUntil ? "input-error" : ""}`} type="date" value={form.recurringUntil} onChange={e => set("recurringUntil", e.target.value)}/>
                    {errors.recurringUntil && <div className="field-error">{errors.recurringUntil}</div>}
                  </div>
                )}
              </div>
              {form.recurring !== "none" && form.recurringUntil && !errors.recurringUntil && (
                <div style={{ marginTop:10, fontSize:13, color:"var(--gold)", display:"flex", alignItems:"center", gap:6 }}>
                  📅 Zostanie utworzonych <strong>{occurrences}</strong> {occurrences === 1 ? "termin" : occurrences < 5 ? "terminy" : "terminów"}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Anuluj</button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            <Icon name="check" size={14}/>
            {isCopy ? "Utwórz kopię" : (form.recurring !== "none" && form.recurringUntil) ? `Utwórz ${occurrences} terminów` : "Utwórz termin"}
          </button>
        </div>
      </div>
    </div>
  );
}
