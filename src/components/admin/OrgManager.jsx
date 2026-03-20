import React, { useState } from 'react';
import { Icon } from '../common/Icon';
import { ORG_TYPE_LABELS } from '../../config';

// ─── DOMYŚLNE SEKCJE PER TYP GRUPY ───────────────────────────────────────────
const DEFAULT_SECTIONS = {
  orchestra: [
    { name:"Skrzypce I",        color:"#C9A84C" },
    { name:"Skrzypce II",       color:"#9B8EC4" },
    { name:"Altówki",           color:"#5B9BD5" },
    { name:"Wiolonczele",       color:"#69B99A" },
    { name:"Kontrabasy",        color:"#E07B6A" },
    { name:"Instrumenty dęte",  color:"#D4847A" },
  ],
  choir: [
    { name:"Sopran",   color:"#E8C96A" },
    { name:"Mezzosopran", color:"#C9A84C" },
    { name:"Alt",      color:"#9B8EC4" },
    { name:"Tenor",    color:"#5B9BD5" },
    { name:"Baryton",  color:"#69B99A" },
    { name:"Bas",      color:"#E07B6A" },
  ],
  ensemble: [
    { name:"Tancerze",    color:"#5B9BD5" },
    { name:"Śpiewacy",    color:"#C9A84C" },
    { name:"Muzycy",      color:"#69B99A" },
    { name:"Instrumentaliści", color:"#9B8EC4" },
  ],
  vocal: [
    { name:"Soliści",     color:"#C9A84C" },
    { name:"Chórek",      color:"#5B9BD5" },
    { name:"Backing vocal", color:"#9B8EC4" },
  ],
  band: [
    { name:"Instrumenty",  color:"#5B9BD5" },
    { name:"Wokal",        color:"#C9A84C" },
    { name:"Rytmika",      color:"#69B99A" },
  ],
  other: [
    { name:"Grupa A", color:"#5B9BD5" },
    { name:"Grupa B", color:"#C9A84C" },
  ],
};

const ORG_EMOJIS = {
  orchestra:"🎼", choir:"🎵", ensemble:"🎭", vocal:"🎤", band:"🎸", other:"🎪"
};

function normalizeSlug(value) {
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

function makeUniqueSlug(baseSlug, organizations, currentOrgId = null) {
  const cleanBase = normalizeSlug(baseSlug);
  if (!cleanBase) return "";

  const usedSlugs = new Set(
    (organizations || [])
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

// ─── PANEL ZARZĄDZANIA ORGANIZACJAMI ─────────────────────────────────────────
export function OrgManager({
  organizations,
  onCreateOrg,
  onUpdateOrg,
  onDeleteOrg,
  onClose
}) {
  const [tab, setTab] = useState("list");
  const [editOrg, setEditOrg] = useState(null);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal modal-wide"
        style={{ maxWidth: 720 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">⚙️ Zarządzanie grupami ACK</div>
          <button className="btn btn-ghost btn-sm" aria-label="Zamknij" onClick={onClose}>
            <Icon name="x" size={16} />
          </button>
        </div>

        <div style={{ padding: "0 28px", borderBottom: "1px solid var(--border)", display: "flex", gap: 4 }}>
          {[["list", "Istniejące grupy"], ["create", "+ Dodaj nową grupę"]].map(([k, v]) => (
            <button
              key={k}
              onClick={() => { setTab(k); setEditOrg(null); }}
              style={{
                padding: "10px 16px",
                border: "none",
                background: "none",
                cursor: "pointer",
                fontFamily: "'DM Sans',sans-serif",
                fontSize: 13,
                fontWeight: 500,
                color: tab === k ? "var(--gold)" : "var(--text3)",
                borderBottom: tab === k ? "2px solid var(--gold)" : "2px solid transparent",
                marginBottom: -1
              }}
            >
              {v}
            </button>
          ))}
        </div>

        <div className="modal-body">
          {tab === "list" && (
            <OrgList
              organizations={organizations}
              onEdit={org => { setEditOrg(org); setTab("create"); }}
              onDelete={onDeleteOrg}
            />
          )}

          {tab === "create" && (
            <OrgForm
              organizations={organizations}
              editOrg={editOrg}
              onSave={async (data) => {
                if (editOrg) {
                  await onUpdateOrg(editOrg.id, data);
                } else {
                  await onCreateOrg(data);
                }
                setTab("list");
                setEditOrg(null);
              }}
              onCancel={() => { setTab("list"); setEditOrg(null); }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── LISTA ISTNIEJĄCYCH GRUP ──────────────────────────────────────────────────
function OrgList({ organizations, onEdit, onDelete }) {
  return (
    <div>
      <div style={{ fontSize: 13, color: "var(--text3)", marginBottom: 16 }}>
        {organizations.length} grup w systemie
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {organizations.map(org => (
          <div
            key={org.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "14px 18px",
              borderRadius: 12,
              background: "var(--bg3)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: `${org.color || "#C9A84C"}22`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                flexShrink: 0,
              }}
            >
              {org.logo_emoji || ORG_EMOJIS[org.type] || "🎼"}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{org.name}</div>
              <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>
                {ORG_TYPE_LABELS[org.type]} · slug: <code style={{ color: "var(--gold)" }}>/ {org.slug}</code>
              </div>
              {org.description && (
                <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>{org.description}</div>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: org.active ? "var(--yes)" : "var(--no)"
                }}
              />
              <span style={{ fontSize: 11, color: "var(--text3)" }}>
                {org.active ? "Aktywna" : "Nieaktywna"}
              </span>

              <button className="btn btn-secondary btn-sm" onClick={() => onEdit(org)}>
                <Icon name="edit" size={13} /> Edytuj
              </button>

              <button className="btn btn-danger btn-sm" onClick={() => onDelete(org)}>
                <Icon name="trash" size={13} /> Usuń
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── FORMULARZ TWORZENIA / EDYCJI GRUPY ──────────────────────────────────────
function OrgForm({ organizations = [], editOrg, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: editOrg?.name || "",
    slug: editOrg?.slug || "",
    type: editOrg?.type || "orchestra",
    description: editOrg?.description || "",
    color: editOrg?.color || "#C9A84C",
    logo_emoji: editOrg?.logo_emoji || "🎼",
    active: editOrg?.active ?? true,
  });

  const [sections, setSections] = useState(
    DEFAULT_SECTIONS[editOrg?.type || "orchestra"]
  );
  const [saving, setSaving] = useState(false);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const currentEditId = editOrg?.id ?? null;

  const handleNameChange = (val) => {
    setF("name", val);

    if (!editOrg) {
      const baseSlug = normalizeSlug(val);
      const uniqueSlug = makeUniqueSlug(baseSlug, organizations, currentEditId);
      setF("slug", uniqueSlug);
    }
  };

  const handleSlugChange = (val) => {
    const baseSlug = normalizeSlug(val);

    if (!baseSlug) {
      setF("slug", "");
      return;
    }

    if (editOrg) {
      setF("slug", baseSlug);
      return;
    }

    const uniqueSlug = makeUniqueSlug(baseSlug, organizations, currentEditId);
    setF("slug", uniqueSlug);
  };

  const handleTypeChange = (type) => {
    setF("type", type);
    setF("logo_emoji", ORG_EMOJIS[type] || "🎼");
    if (!editOrg) setSections(DEFAULT_SECTIONS[type] || DEFAULT_SECTIONS.other);
  };

  const handleSectionChange = (idx, field, val) => {
    setSections(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s));
  };

  const addSection = () => setSections(prev => [...prev, { name: "", color: "#888888" }]);
  const removeSection = (idx) => setSections(prev => prev.filter((_, i) => i !== idx));

  const slugTaken = organizations.some(
    org => org?.id !== currentEditId && String(org.slug || "").toLowerCase() === String(form.slug || "").toLowerCase()
  );

  const handleSubmit = async () => {
    if (!form.name || !form.slug || slugTaken) return;

    setSaving(true);
    try {
      await onSave({
        ...form,
        sections: editOrg ? undefined : sections
      });
    } finally {
      setSaving(false);
    }
  };

  const valid = form.name.trim().length > 1 && form.slug.length > 1 && !slugTaken;

  return (
    <div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "var(--text3)",
          textTransform: "uppercase",
          letterSpacing: ".07em",
          marginBottom: 20
        }}
      >
        {editOrg ? `Edycja: ${editOrg.name}` : "Nowa grupa"}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "16px 20px",
          background: "var(--bg3)",
          borderRadius: 12,
          marginBottom: 24,
          border: `1px solid ${form.color}44`
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: `${form.color}22`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28
          }}
        >
          {form.logo_emoji}
        </div>
        <div>
          <div
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: 18,
              fontWeight: 600,
              color: form.color
            }}
          >
            {form.name || "Nazwa grupy"}
          </div>
          <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 3 }}>
            {ORG_TYPE_LABELS[form.type]} · /{form.slug || "slug"}
          </div>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Nazwa grupy *</label>
          <input
            className="form-input"
            placeholder="np. Chór ACK UG"
            value={form.name}
            onChange={e => handleNameChange(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Typ</label>
          <select className="form-input" value={form.type} onChange={e => handleTypeChange(e.target.value)}>
            {Object.entries(ORG_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Slug (adres URL) *</label>
          <input
            className="form-input"
            placeholder="np. chor-ack"
            value={form.slug}
            onChange={e => handleSlugChange(e.target.value)}
          />
          {!editOrg && form.slug && (
            <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 6 }}>
              Adres zostanie ustawiony jako: <code style={{ color: "var(--gold)" }}>/{form.slug}</code>
            </div>
          )}
          {slugTaken && (
            <div style={{ fontSize: 12, color: "var(--no)", marginTop: 6 }}>
              Taki slug już istnieje.
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Emoji / logo</label>
          <input
            className="form-input"
            value={form.logo_emoji}
            onChange={e => setF("logo_emoji", e.target.value)}
            style={{ fontSize: 22 }}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Kolor motywu</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="color"
              value={form.color}
              onChange={e => setF("color", e.target.value)}
              style={{
                width: 44,
                height: 36,
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--bg3)",
                cursor: "pointer",
                padding: 2
              }}
            />
            <input className="form-input" value={form.color} onChange={e => setF("color", e.target.value)} style={{ flex: 1 }} />
          </div>

          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            {["#C9A84C","#5B9BD5","#69B99A","#9B8EC4","#E07B6A","#D4847A","#E8C96A","#4ECDC4"].map(c => (
              <div
                key={c}
                onClick={() => setF("color", c)}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: c,
                  cursor: "pointer",
                  border: form.color === c ? "3px solid white" : "3px solid transparent",
                }}
              />
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Opis (opcjonalnie)</label>
          <input
            className="form-input"
            placeholder="Krótki opis grupy"
            value={form.description}
            onChange={e => setF("description", e.target.value)}
          />
        </div>
      </div>

      <div className="form-group">
        <div className="checkbox-row" onClick={() => setF("active", !form.active)} style={{ cursor: "pointer" }}>
          <div className={"checkbox-box " + (form.active ? "checked" : "")}>
            {form.active && <Icon name="check" size={12} />}
          </div>
          <div className="checkbox-label"><strong>Grupa aktywna</strong> — widoczna dla użytkowników</div>
        </div>
      </div>

      {!editOrg && (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <label className="form-label" style={{ margin: 0 }}>Sekcje startowe</label>
            <button type="button" className="btn btn-ghost btn-sm" onClick={addSection}>
              <Icon name="plus" size={13} /> Dodaj sekcję
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sections.map((sec, idx) => (
              <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="color"
                  value={sec.color}
                  onChange={e => handleSectionChange(idx, "color", e.target.value)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--bg3)",
                    cursor: "pointer",
                    padding: 2,
                    flexShrink: 0
                  }}
                />
                <input
                  className="form-input"
                  placeholder="Nazwa sekcji"
                  value={sec.name}
                  onChange={e => handleSectionChange(idx, "name", e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => removeSection(idx)}
                  style={{ padding: "6px 10px", flexShrink: 0 }}
                >
                  <Icon name="x" size={13} />
                </button>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 8 }}>
            Sekcje można edytować po utworzeniu grupy.
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
        <button className="btn btn-secondary" onClick={onCancel}>Anuluj</button>
        <button className="btn btn-primary" disabled={!valid || saving} onClick={handleSubmit}>
          {saving ? (
            <>
              <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Zapisywanie...
            </>
          ) : (
            <>
              <Icon name="check" size={14} /> {editOrg ? "Zapisz zmiany" : `Utwórz ${ORG_TYPE_LABELS[form.type]}`}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
