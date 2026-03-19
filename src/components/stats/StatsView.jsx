import React, { memo, useMemo } from 'react';
import { Icon } from '../common/Icon';
import { TYPE_LABELS, TYPE_COLORS } from '../../config';

export const StatsView = memo(function StatsView({ data, getReplies }) {
  const activeMembers = useMemo(() => data.members.filter(m => m.status === "active"), [data.members]);

  const memberStats = useMemo(() =>
    activeMembers.map(m => {
      const yes = data.appointments.filter(a => getReplies(a.id)[m.id] === "yes").length;
      return { ...m, yes, pct: data.appointments.length ? Math.round((yes / data.appointments.length) * 100) : 0 };
    }).sort((a, b) => b.pct - a.pct),
    [activeMembers, data.appointments, getReplies]
  );

  const sectionStats = useMemo(() =>
    data.sections.map(sec => {
      const secM = activeMembers.filter(m => m.section_id === sec.id);
      if (!secM.length) return { ...sec, pct: 0 };
      const yes = secM.reduce((acc, m) => acc + data.appointments.filter(a => getReplies(a.id)[m.id] === "yes").length, 0);
      const tot = secM.length * data.appointments.length;
      return { ...sec, pct: tot ? Math.round((yes / tot) * 100) : 0 };
    }),
    [data.sections, activeMembers, data.appointments, getReplies]
  );

  const typeStats = useMemo(() =>
    Object.entries(TYPE_LABELS).map(([type, label]) => {
      const apts = data.appointments.filter(a => a.type === type);
      const yes  = apts.reduce((acc, a) => acc + Object.values(getReplies(a.id)).filter(v => v === "yes").length, 0);
      const tot  = apts.reduce((acc, a) => acc + Object.values(getReplies(a.id)).length, 0);
      return { type, label, pct: tot ? Math.round((yes / tot) * 100) : 0, color: TYPE_COLORS[type], count: apts.length };
    }),
    [data.appointments, getReplies]
  );

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Statystyki</div>
          <div className="page-sub">Frekwencja i aktywność · tylko dla zarządu</div>
        </div>
      </div>
      <div className="content">
        {/* Karty per typ */}
        <div className="three-col" style={{ marginBottom:24 }}>
          {typeStats.map(t => (
            <div className="stat-card" key={t.type}>
              <div className="stat-label" style={{ color:t.color }}>{t.label}</div>
              <div className="stat-value" style={{ color:t.color }}>{t.pct}%</div>
              <div className="stat-sub">śr. frekwencja · {t.count} terminów</div>
            </div>
          ))}
        </div>

        <div className="two-col">
          {/* Per sekcja */}
          <div className="card">
            <div style={{ fontSize:14, fontWeight:600, marginBottom:16 }}>Frekwencja per sekcja</div>
            {sectionStats.map(s => (
              <div className="stat-row" key={s.id}>
                <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:160 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:s.color }}/>
                  <div className="stat-row-label" style={{ fontSize:13 }}>{s.name}</div>
                </div>
                <div className="stat-row-bar-bg">
                  <div className="stat-row-bar" style={{ width:`${s.pct}%`, background:s.color }}/>
                </div>
                <div className="stat-row-pct">{s.pct}%</div>
              </div>
            ))}
          </div>

          {/* Ranking */}
          <div className="card">
            <div style={{ fontSize:14, fontWeight:600, marginBottom:16 }}>Ranking frekwencji (top 10)</div>
            {memberStats.slice(0, 10).map((m, i) => {
              const sec = data.sections.find(s => s.id === m.section_id);
              return (
                <div className="stat-row" key={m.id}>
                  <div style={{ fontSize:12, color:"var(--text3)", minWidth:20 }}>#{i+1}</div>
                  <div className="stat-row-label" style={{ fontSize:13 }}>
                    {m.name.split(" ")[0]} {m.name.split(" ")[1]?.[0]}.
                  </div>
                  <div className="stat-row-bar-bg">
                    <div className="stat-row-bar" style={{ width:`${m.pct}%`, background:sec?.color||"var(--gold)" }}/>
                  </div>
                  <div className="stat-row-pct">{m.pct}%</div>
                </div>
              );
            })}
            {!memberStats.length && (
              <div className="empty-state" style={{ padding:24 }}>
                <Icon name="chart" size={32}/>
                <p style={{ marginTop:8 }}>Brak danych do analizy</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
});

