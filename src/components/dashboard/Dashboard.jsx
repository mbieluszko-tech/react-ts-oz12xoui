import React, { memo, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../common/Icon';
import { TYPE_COLORS, fmt, fmtTime, MS_PER_DAY } from '../../config';
import { AptRow } from '../appointments/AptRow';

// FIX: React.memo — Dashboard nie re-renderuje się bez zmiany propsów
export const Dashboard = memo(function Dashboard({ data, getReplies, onSelectApt, onCreateApt, onReply }) {
  const { currentMember, isManager } = useAuth();

  // FIX: today z useMemo — nie new Date() przy każdym renderze
  const today = useMemo(() => new Date(), []);

  const upcoming = useMemo(() =>
    data.appointments
      .filter(a => new Date(a.date_start) >= today)
      .slice(0, 5),
    [data.appointments, today]
  );

  const next = upcoming[0] || null;

  const daysTo = next
    ? Math.ceil((new Date(next.date_start) - today) / MS_PER_DAY)
    : null;

  const myPending = useMemo(() =>
    !isManager && currentMember
      ? data.appointments.filter(a =>
          new Date(a.date_start) >= today &&
          getReplies(a.id)[currentMember.id] === "maybe"
        )
      : [],
    [data.appointments, currentMember, isManager, today, getReplies]
  );

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-sub">
            {next ? `Następny termin za ${daysTo} ${daysTo === 1 ? "dzień" : "dni"}` : "Brak nadchodzących terminów"}
          </div>
        </div>
        {isManager && (
          <button className="btn btn-primary" aria-label="Utwórz nowy termin" onClick={onCreateApt}>
            <Icon name="plus" size={15}/> Nowy termin
          </button>
        )}
      </div>

      <div className="content">
        {/* Karta najbliższego terminu */}
        {next && (
          <div className="next-apt-card" onClick={() => onSelectApt(next)} style={{ cursor:"pointer" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
              <div>
                <div style={{ fontSize:12, color:"var(--text3)", textTransform:"uppercase", letterSpacing:".08em", marginBottom:6 }}>
                  Najbliższy termin
                </div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:600, color:"var(--text)" }}>
                  {next.name}
                </div>
              </div>
              <div style={{ background:`${TYPE_COLORS[next.type]}22`, color:TYPE_COLORS[next.type], padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:500 }}>
                za {daysTo} {daysTo === 1 ? "dzień" : "dni"}
              </div>
            </div>
            <div style={{ display:"flex", gap:16, fontSize:13, color:"var(--text3)" }}>
              <span>📅 {fmt(next.date_start)}</span>
              <span>🕐 {fmtTime(next.date_start)} — {fmtTime(next.date_end)}</span>
              {next.location && <span>📍 {next.location}</span>}
            </div>
          </div>
        )}

        {/* Do potwierdzenia — tylko dla członków */}
        {myPending.length > 0 && (
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:16 }}>
              ⏳ Do potwierdzenia ({myPending.length})
            </div>
            <div className="apt-list">
              {myPending.map(apt => (
                <AptRow key={apt.id} apt={apt} replies={getReplies(apt.id)} today={today} onClick={() => onSelectApt(apt)} onReply={onReply}/>
              ))}
            </div>
          </div>
        )}

        {/* Nadchodzące terminy */}
        <div>
          <div style={{ fontSize:14, fontWeight:600, marginBottom:16 }}>
            Nadchodzące ({upcoming.length})
          </div>
          {upcoming.length === 0
            ? <div className="empty-state"><Icon name="calendar" size={32}/><p style={{ marginTop:12 }}>Brak nadchodzących terminów</p></div>
            : <div className="apt-list">
                {upcoming.map(apt => (
                  <AptRow key={apt.id} apt={apt} replies={getReplies(apt.id)} today={today} onClick={() => onSelectApt(apt)} onReply={onReply}/>
                ))}
              </div>
          }
        </div>
      </div>
    </>
  );
});
