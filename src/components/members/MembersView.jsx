import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../common/Icon';
import { ROLE_LABELS, fmt } from '../../config';

// ─── MEMBERS VIEW ─────────────────────────────────────────────────────────────
export function MembersView({ data, onSelectMember, onAddMember }) {
  const { currentMember, isAdmin, isManager } = useAuth();
  const [filter, setFilter]   = useState("active");
  const [search, setSearch]   = useState("");

  const filtered = data.members.filter(m => {
    const matchStatus = filter==="all" || m.status===filter;
    const matchSearch = !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.email||"").toLowerCase().includes(search.toLowerCase());

    // 🔥 OGRANICZENIE LIDERA DO SWOJEJ SEKCJI
    const isLeader = currentMember?.role === "leader";
    if (isLeader && m.section_id !== currentMember.section_id) {
      return false;
    }

    return matchStatus && matchSearch;
  });

  const exportCSV = () => {
    const rows = [
      ["Imie i nazwisko","Email","Telefon","Sekcja","Rola","Data dolaczenia","RODO","Regulamin"],
      ...filtered.map(m => {
        const sec = data.sections.find(s=>s.id===m.section_id);
        return [
          m.name,
          m.email||"",
          m.phone||"",
          sec?.name||"",
          ROLE_LABELS[m.role]||m.role,
          m.joined_at?fmt(m.joined_at):"",
          m.rodo_accepted?"Tak":"Nie",
          m.terms_accepted?"Tak":"Nie"
        ];
      })
    ];
    const csv = rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(",")).join("\n");
    const blob = new Blob(["\uFEFF"+csv], { type:"text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download="czlonkowie.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Członkowie</div>
          <div className="page-sub">
            {data.members.filter(m=>m.status==="active").length} aktywnych · {data.members.filter(m=>m.status==="pending").length} oczekujących
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {isManager && (
            <button className="btn btn-secondary" onClick={exportCSV}>
              <Icon name="list" size={15}/> Eksport CSV
            </button>
          )}
          {isAdmin && (
            <button className="btn btn-primary" onClick={onAddMember}>
              <Icon name="plus" size={15}/> Dodaj członka
            </button>
          )}
        </div>
      </div>

      <div className="content">
        <div style={{ display:"flex", gap:12, marginBottom:20, alignItems:"center", flexWrap:"wrap" }}>
          <input
            className="form-input"
            style={{ maxWidth:280 }}
            placeholder="Szukaj po nazwisku lub emailu..."
            value={search}
            onChange={e=>setSearch(e.target.value)}
          />
          <div className="tabs" style={{ marginBottom:0 }}>
            {[["active","Aktywni"],["pending","Oczekujący"],["all","Wszyscy"]].map(([k,v])=>(
              <button key={k} className={"tab "+(filter===k?"active":"")} onClick={()=>setFilter(k)}>
                {v}
              </button>
            ))}
          </div>
        </div>

        {!filtered.length && (
          <div className="empty-state">
            <Icon name="users" size={40}/>
            <p style={{ marginTop:12 }}>Brak wyników</p>
          </div>
        )}

        {/* 🔥 SEKCJE (ograniczone dla lidera) */}
        {data.sections
          .filter(sec => {
            if (currentMember?.role !== "leader") return true;
            return sec.id === currentMember.section_id;
          })
          .map(sec=>{
            const secM = filtered.filter(m=>m.section_id===sec.id);
            if (!secM.length) return null;

            return (
              <div key={sec.id}>
                <div className="section-header">
                  <div className="section-dot" style={{ background:sec.color }}/>
                  <div className="section-name-lbl">{sec.name}</div>
                  <div className="section-count">{secM.length} os.</div>
                </div>

                <div className="members-grid">
                  {secM.map(m=>{
                    const initials=m.name.split(" ").map(n=>n[0]).join("");

                    return (
                      <div key={m.id} className="member-card" onClick={()=>onSelectMember(m)}>
                        <div
                          className="member-av"
                          style={{
                            background:"linear-gradient(135deg,"+sec.color+"88,"+sec.color+"33)",
                            color:sec.color
                          }}
                        >
                          {initials}
                        </div>

                        <div style={{ flex:1, minWidth:0 }}>
                          <div className="member-card-name" style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                            {m.name}
                          </div>

                          {m.role!=="member"
                            ? <div className={"role-badge role-"+m.role}>{ROLE_LABELS[m.role]}</div>
                            : <div className="member-card-role">{sec.name}</div>
                          }

                          {m.status==="pending" && <div className="pending-badge">Oczekuje</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

        {/* BEZ SEKCJI */}
        {(()=>{
          const noSec = filtered.filter(m=>!m.section_id);
          if(!noSec.length) return null;

          return (
            <div>
              <div className="section-header">
                <div className="section-dot" style={{ background:"var(--text3)" }}/>
                <div className="section-name-lbl">Bez sekcji</div>
                <div className="section-count">{noSec.length} os.</div>
              </div>

              <div className="members-grid">
                {noSec.map(m=>{
                  const initials=m.name.split(" ").map(n=>n[0]).join("");

                  return (
                    <div key={m.id} className="member-card" onClick={()=>onSelectMember(m)}>
                      <div className="member-av" style={{ background:"var(--bg4)", color:"var(--text3)" }}>
                        {initials}
                      </div>
                      <div>
                        <div className="member-card-name">{m.name}</div>
                        <div className={"role-badge role-"+m.role}>{ROLE_LABELS[m.role]}</div>
                        {m.status==="pending" && <div className="pending-badge">Oczekuje</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>
    </>
  );
}
