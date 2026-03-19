import React, { useState, useCallback, useMemo } from 'react';
import { Icon } from '../common/Icon';
import { useConfirm } from '../common/ConfirmModal';

// ─── PREDEFINIOWANE SZABLONY SEKCJI per typ grupy ────────────────────────────
const TEMPLATES = {
  orchestra: {
    label: "Orkiestra symfoniczna",
    sections: [
      { name:"Skrzypce I",       color:"#C9A84C", emoji:"🎻" },
      { name:"Skrzypce II",      color:"#D4A847", emoji:"🎻" },
      { name:"Altówki",          color:"#9B8EC4", emoji:"🎻" },
      { name:"Wiolonczele",      color:"#5B9BD5", emoji:"🎻" },
      { name:"Kontrabasy",       color:"#69B99A", emoji:"🎸" },
      { name:"Flety",            color:"#E07B6A", emoji:"🪈" },
      { name:"Oboje",            color:"#D4847A", emoji:"🎵" },
      { name:"Klarnety",         color:"#E8C96A", emoji:"🎵" },
      { name:"Fagoty",           color:"#7B9E87", emoji:"🎵" },
      { name:"Waltornie",        color:"#C9A84C", emoji:"🎺" },
      { name:"Trąbki",           color:"#E8C96A", emoji:"🎺" },
      { name:"Puzony",           color:"#9B8EC4", emoji:"🎺" },
      { name:"Tuba",             color:"#5B9BD5", emoji:"🎺" },
      { name:"Perkusja",         color:"#69B99A", emoji:"🥁" },
    ],
  },
  choir: {
    label: "Chór",
    sections: [
      { name:"Sopran I",    color:"#E8C96A", emoji:"🎤" },
      { name:"Sopran II",   color:"#C9A84C", emoji:"🎤" },
      { name:"Mezzosopran", color:"#D4847A", emoji:"🎤" },
      { name:"Alt",         color:"#9B8EC4", emoji:"🎤" },
      { name:"Tenor I",     color:"#5B9BD5", emoji:"🎤" },
      { name:"Tenor II",    color:"#4A8BC4", emoji:"🎤" },
      { name:"Baryton",     color:"#69B99A", emoji:"🎤" },
      { name:"Bas",         color:"#557A6A", emoji:"🎤" },
    ],
  },
  ensemble: {
    label: "Zespół Pieśni i Tańca",
    sections: [
      { name:"Tancerze",         color:"#5B9BD5", emoji:"💃" },
      { name:"Śpiewacy",         color:"#C9A84C", emoji:"🎤" },
      { name:"Muzycy",           color:"#9B8EC4", emoji:"🎵" },
      { name:"Instrumentaliści", color:"#69B99A", emoji:"🎻" },
    ],
  },
  vocal: {
    label: "Studio Wokalne",
    sections: [
      { name:"Soliści",       color:"#C9A84C", emoji:"🎤" },
      { name:"Chórek",        color:"#5B9BD5", emoji:"🎵" },
      { name:"Backing Vocal", color:"#9B8EC4", emoji:"🎵" },
    ],
  },
  band: {
    label: "Zespół muzyczny",
    sections: [
      { name:"Gitary",    color:"#C9A84C", emoji:"🎸" },
      { name:"Klawisze",  color:"#5B9BD5", emoji:"🎹" },
      { name:"Bas",       color:"#69B99A", emoji:"🎸" },
      { name:"Perkusja",  color:"#E07B6A", emoji:"🥁" },
      { name:"Wokal",     color:"#9B8EC4", emoji:"🎤" },
    ],
  },
  other: {
    label: "Własna struktura",
    sections: [
      { name:"Grupa A", color:"#5B9BD5", emoji:"🎵" },
      { name:"Grupa B", color:"#C9A84C", emoji:"🎵" },
    ],
  },
};

const COLORS = [
  "#C9A84C","#5B9BD5","#69B99A","#9B8EC4",
  "#E07B6A","#D4847A","#E8C96A","#4ECDC4",
  "#557A6A","#7B9E87","#A8C4E0","#D4A847",
];

const EMOJIS = ["🎵","🎶","🎤","🎻","🎸","🎹","🎺","🪈","🥁","💃","🎭","🎪","⭐","🔷"];

// ─── GŁÓWNY KOMPONENT ─────────────────────────────────────────────────────────
export function SectionManager({ sections, orgType, onClose, onAdd, onUpdate, onDelete, onReorder }) {
  const [confirm, ConfirmDialog] = useConfirm();
  const [editId, setEditId]      = useState(null);   // null = lista, 'new' = nowa, id = edycja
  const [showTemplates, setShowTemplates] = useState(false);
  const [saving, setSaving]      = useState(false);

  const sorted = useMemo(() =>
    [...sections].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [sections]
  );

  const handleDelete = async (sec) => {
    const ok = await confirm({
      title:        "Usuń sekcję",
      message:      `Usunąć sekcję "${sec.name}"? Członkowie przypisani do tej sekcji zostaną bez sekcji.`,
      danger:       true,
      confirmLabel: "Usuń sekcję",
    });
    if (!ok) return;
    setSaving(true);
    try { await onDelete(sec.id); }
    finally { setSaving(false); }
  };

  const handleMoveUp = async (idx) => {
    if (idx === 0) return;
    const newOrder = [...sorted];
    [newOrder[idx-1], newOrder[idx]] = [newOrder[idx], newOrder[idx-1]];
    await onReorder(newOrder.map((s, i) => ({ id:s.id, sort_order:i })));
  };

  const handleMoveDown = async (idx) => {
    if (idx === sorted.length - 1) return;
    const newOrder = [...sorted];
    [newOrder[idx], newOrder[idx+1]] = [newOrder[idx+1], newOrder[idx]];
    await onReorder(newOrder.map((s, i) => ({ id:s.id, sort_order:i })));
  };

  const handleApplyTemplate = async (template) => {
    setSaving(true);
    try {
      for (let i = 0; i < template.sections.length; i++) {
        await onAdd({ ...template.sections[i], sort_order: (sections.length + i) });
      }
      setShowTemplates(false);
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" style={{ maxWidth:680 }} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Zarządzanie strukturą zespołu">

        <div className="modal-header">
          <div>
            <div className="modal-title">Struktura zespołu</div>
            <div style={{ fontSize:12, color:"var(--text3)", marginTop:2 }}>
              Definiuj sekcje, głosy, grupy — dowolna struktura dla Twojego zespołu
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" aria-label="Zamknij" onClick={onClose}>
            <Icon name="x" size={16}/>
          </button>
        </div>

        <div className="modal-body">
          {/* Pasek akcji */}
          <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
            <button className="btn btn-primary" onClick={() => setEditId("new")}>
              <Icon name="plus" size={14}/> Dodaj sekcję
            </button>
            <button className="btn btn-secondary" onClick={() => setShowTemplates(!showTemplates)}>
              📋 {showTemplates ? "Ukryj szablony" : "Szablony gotowych struktur"}
            </button>
            <div style={{ marginLeft:"auto", fontSize:12, color:"var(--text3)", alignSelf:"center" }}>
              {sections.length} {sections.length === 1 ? "sekcja" : sections.length < 5 ? "sekcje" : "sekcji"}
            </div>
          </div>

          {/* Szablony */}
          {showTemplates && (
            <div style={{ padding:16, background:"var(--bg3)", borderRadius:12, marginBottom:20 }}>
              <div style={{ fontSize:12, fontWeight:600, color:"var(--text3)", textTransform:"uppercase", letterSpacing:".07em", marginBottom:12 }}>
                Wybierz szablon — doda sekcje do obecnej listy
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:8 }}>
                {Object.entries(TEMPLATES).map(([key, tmpl]) => (
                  <button
                    key={key}
                    className="btn btn-secondary"
                    disabled={saving}
                    onClick={() => handleApplyTemplate(tmpl)}
                    style={{ flexDirection:"column", alignItems:"flex-start", padding:"10px 14px", gap:4 }}
                  >
                    <div style={{ fontWeight:600, fontSize:13 }}>{tmpl.label}</div>
                    <div style={{ fontSize:11, color:"var(--text3)", fontWeight:400 }}>
                      {tmpl.sections.length} sekcji · {tmpl.sections.slice(0,3).map(s=>s.name).join(", ")}…
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Formularz nowej / edytowanej sekcji */}
          {editId && (
            <SectionForm
              section={editId === "new" ? null : sections.find(s => s.id === editId)}
              nextOrder={sections.length}
              onSave={async (data) => {
                setSaving(true);
                try {
                  if (editId === "new") await onAdd(data);
                  else await onUpdate(editId, data);
                  setEditId(null);
                } finally { setSaving(false); }
              }}
              onCancel={() => setEditId(null)}
              saving={saving}
            />
          )}

          {/* Lista sekcji */}
          {!editId && (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {sorted.length === 0 && (
                <div className="empty-state" style={{ padding:40 }}>
                  <div style={{ fontSize:40, marginBottom:12 }}>🎵</div>
                  <div style={{ fontWeight:600, marginBottom:8 }}>Brak sekcji</div>
                  <div style={{ fontSize:13, color:"var(--text3)" }}>
                    Dodaj sekcje ręcznie lub wybierz gotowy szablon dla swojego zespołu.
                  </div>
                </div>
              )}
              {sorted.map((sec, idx) => (
                <div key={sec.id} style={{
                  display:"flex", alignItems:"center", gap:12,
                  padding:"12px 16px", borderRadius:12,
                  background:"var(--bg3)", border:"1px solid var(--border)",
                }}>
                  {/* Kolor + emoji */}
                  <div style={{
                    width:40, height:40, borderRadius:10, flexShrink:0,
                    background:`${sec.color}22`, display:"flex", alignItems:"center",
                    justifyContent:"center", fontSize:20,
                  }}>
                    {sec.emoji || "🎵"}
                  </div>

                  {/* Info */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ width:10, height:10, borderRadius:"50%", background:sec.color, flexShrink:0 }}/>
                      <div style={{ fontSize:14, fontWeight:600, color:"var(--text)" }}>{sec.name}</div>
                      {sec.active === false && (
                        <span style={{ fontSize:10, color:"var(--text3)", background:"var(--bg4)", padding:"1px 6px", borderRadius:4 }}>nieaktywna</span>
                      )}
                    </div>
                    {sec.description && (
                      <div style={{ fontSize:12, color:"var(--text3)", marginTop:2, marginLeft:18 }}>{sec.description}</div>
                    )}
                  </div>

                  {/* Akcje */}
                  <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                    {/* Kolejność */}
                    <button
                      className="btn btn-ghost btn-sm"
                      aria-label="Przesuń w górę"
                      disabled={idx === 0 || saving}
                      onClick={() => handleMoveUp(idx)}
                      style={{ padding:"4px 8px", opacity:idx===0?0.3:1 }}
                    >▲</button>
                    <button
                      className="btn btn-ghost btn-sm"
                      aria-label="Przesuń w dół"
                      disabled={idx === sorted.length-1 || saving}
                      onClick={() => handleMoveDown(idx)}
                      style={{ padding:"4px 8px", opacity:idx===sorted.length-1?0.3:1 }}
                    >▼</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditId(sec.id)}>
                      <Icon name="edit" size={13}/>
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      aria-label={`Usuń sekcję ${sec.name}`}
                      disabled={saving}
                      onClick={() => handleDelete(sec)}
                    >
                      <Icon name="x" size={13}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!editId && (
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Zamknij</button>
          </div>
        )}
        {ConfirmDialog}
      </div>
    </div>
  );
}

// ─── FORMULARZ SEKCJI ─────────────────────────────────────────────────────────
function SectionForm({ section, nextOrder, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    name:        section?.name        || "",
    color:       section?.color       || COLORS[nextOrder % COLORS.length],
    emoji:       section?.emoji       || "🎵",
    description: section?.description || "",
    active:      section?.active      ?? true,
    sort_order:  section?.sort_order  ?? nextOrder,
  });
  const [errors, setErrors] = useState({});
  const setF = (k, v) => { setForm(f => ({...f,[k]:v})); if(errors[k]) setErrors(e=>({...e,[k]:null})); };

  const handleSubmit = () => {
    const errs = {};
    if (!form.name.trim() || form.name.trim().length < 2)
      errs.name = "Nazwa musi mieć co najmniej 2 znaki";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onSave({
      name:        form.name.trim(),
      color:       form.color,
      emoji:       form.emoji,
      description: form.description.trim() || null,
      active:      form.active,
      sort_order:  form.sort_order,
    });
  };

  return (
    <div style={{ padding:20, background:"var(--bg3)", borderRadius:14, marginBottom:20, border:"1px solid var(--border)" }}>
      <div style={{ fontSize:13, fontWeight:600, color:"var(--text3)", textTransform:"uppercase", letterSpacing:".07em", marginBottom:16 }}>
        {section ? "Edycja sekcji" : "Nowa sekcja"}
      </div>

      {/* Podgląd */}
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", background:"var(--bg2)", borderRadius:10, marginBottom:16, border:`1px solid ${form.color}44` }}>
        <div style={{ width:44, height:44, borderRadius:10, background:`${form.color}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>
          {form.emoji}
        </div>
        <div>
          <div style={{ fontWeight:600, color:"var(--text)", fontSize:15 }}>{form.name || "Nazwa sekcji"}</div>
          {form.description && <div style={{ fontSize:12, color:"var(--text3)", marginTop:2 }}>{form.description}</div>}
        </div>
        <div style={{ marginLeft:"auto", width:14, height:14, borderRadius:"50%", background:form.color }}/>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="sec-name">Nazwa sekcji *</label>
          <input
            id="sec-name" autoFocus
            className={`form-input ${errors.name?"input-error":""}`}
            placeholder="np. Sopran I, Skrzypce, Tancerze..."
            value={form.name}
            onChange={e => setF("name", e.target.value)}
            onKeyDown={e => e.key==="Enter" && handleSubmit()}
          />
          {errors.name && <div className="field-error">{errors.name}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">Emoji</label>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {EMOJIS.map(em => (
              <button
                key={em}
                onClick={() => setF("emoji", em)}
                style={{
                  width:36, height:36, borderRadius:8, border:`2px solid ${form.emoji===em?"var(--gold)":"var(--border)"}`,
                  background:form.emoji===em?"rgba(201,168,76,.15)":"var(--bg4)",
                  cursor:"pointer", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center",
                }}
              >{em}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Kolor</label>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => setF("color", c)}
              aria-label={`Kolor ${c}`}
              style={{
                width:28, height:28, borderRadius:"50%", background:c, cursor:"pointer",
                border:`3px solid ${form.color===c?"white":"transparent"}`,
                boxShadow:form.color===c?`0 0 0 2px ${c}`:"none",
              }}
            />
          ))}
          {/* Własny kolor */}
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <input type="color" value={form.color} onChange={e => setF("color", e.target.value)}
              style={{ width:28, height:28, borderRadius:"50%", border:"none", padding:0, cursor:"pointer", background:"none" }}/>
            <span style={{ fontSize:11, color:"var(--text3)" }}>własny</span>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="sec-desc">Opis (opcjonalnie)</label>
        <input id="sec-desc" className="form-input" placeholder="np. Pierwsza linia skrzypiec, głos prowadzący..."
          value={form.description} onChange={e => setF("description", e.target.value)}/>
      </div>

      <div className="checkbox-row" onClick={() => setF("active", !form.active)} style={{ cursor:"pointer", marginTop:4 }}>
        <div className={`checkbox-box ${form.active?"checked":""}`}>
          {form.active && <Icon name="check" size={12}/>}
        </div>
        <div className="checkbox-label">Sekcja aktywna (widoczna przy tworzeniu terminów)</div>
      </div>

      <div style={{ display:"flex", gap:8, marginTop:16 }}>
        <button className="btn btn-secondary" onClick={onCancel} disabled={saving}>Anuluj</button>
        <button className="btn btn-primary" disabled={saving} onClick={handleSubmit}>
          {saving
            ? <><div className="spinner" style={{ width:14,height:14,borderWidth:2 }}/> Zapisywanie…</>
            : <><Icon name="check" size={14}/> {section ? "Zapisz zmiany" : "Dodaj sekcję"}</>
          }
        </button>
      </div>
    </div>
  );
}
