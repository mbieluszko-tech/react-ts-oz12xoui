// ── FILE: components/appointments/AptRow.jsx ──────────────────────────────────
import React, { memo, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../common/Icon';
import { TYPE_LABELS, TYPE_COLORS, fmtShort, fmtTime } from '../../config';

// FIX: React.memo — AptRow nie re-renderuje się gdy inne odpowiedzi się zmieniają
export const AptRow = memo(function AptRow({ apt, replies, onClick, onReply, today }) {
  // FIX: today przekazany z rodzica (nie new Date() w renderze)
  const isPast   = useMemo(() => new Date(apt.date_start) < today, [apt.date_start, today]);
  const { isManager, currentMember } = useAuth();
  const myStatus = currentMember ? (replies[currentMember.id] || "maybe") : null;
  const yes      = Object.values(replies).filter(v => v === "yes").length;
  const total    = Object.values(replies).length;

  return (
    <div className={`apt-row ${isPast ? "apt-row-past" : ""}`} onClick={onClick}>
      <div className="apt-row-left">
        <div className="apt-row-type-dot" style={{ background:TYPE_COLORS[apt.type] }}/>
        <div>
          <div className="apt-row-name">{apt.name}</div>
          <div className="apt-row-meta">
            <span>{fmtShort(apt.date_start)}</span>
            <span>·</span>
            <span>{fmtTime(apt.date_start)} — {fmtTime(apt.date_end)}</span>
            {apt.location && <><span>·</span><span>{apt.location}</span></>}
          </div>
        </div>
      </div>
      <div className="apt-row-right">
        {isManager && (
          <span className={`apt-badge ${isPast ? "apt-badge-past" : ""}`} style={!isPast ? { background:`${TYPE_COLORS[apt.type]}22`, color:TYPE_COLORS[apt.type] } : {}}>
            {TYPE_LABELS[apt.type]}
          </span>
        )}
        {total > 0 && (
          <span style={{ fontSize:11, color:"var(--text3)" }}>{yes}/{total}</span>
        )}
        {!isManager && currentMember && (
          <div style={{ display:"flex", gap:4 }}>
            {["yes","no","maybe"].map(s => (
              <button
                key={s}
                aria-label={s==="yes"?"TAK":s==="no"?"NIE":"MOŻE"}
                aria-pressed={myStatus===s}
                className={`reply-pill ${s}`}
                style={{ opacity:myStatus===s?1:0.3, transform:myStatus===s?"scale(1.08)":"scale(1)" }}
                onClick={e => { e.stopPropagation(); onReply(apt.id, currentMember.id, s); }}
              >
                {s==="yes"?"TAK":s==="no"?"NIE":"MOŻE"}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
