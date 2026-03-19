// ── FILE: components/calendar/CalendarView.jsx ────────────────────────────────
import React, { memo, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../common/Icon';
import { TYPE_COLORS, MONTHS_PL, DAYS_PL, getCalendarDays, fmt, fmtTime } from '../../config';

export const CalendarView = memo(function CalendarView({ data, getReplies, month, year, setMonth, setYear, selected, setSelected, onSelectApt, onCreateApt }) {
  const { isManager } = useAuth();

  // FIX: today z useMemo
  const today = useMemo(() => new Date(), []);

  const days    = useMemo(() => getCalendarDays(year, month), [year, month]);
  const selApts = useMemo(() =>
    selected
      ? data.appointments.filter(a => {
          const d = new Date(a.date_start);
          return d.getDate()===selected.getDate() && d.getMonth()===selected.getMonth() && d.getFullYear()===selected.getFullYear();
        })
      : [],
    [selected, data.appointments]
  );

  const prev = () => { if (month===0) { setMonth(11); setYear(y=>y-1); } else setMonth(m=>m-1); };
  const next = () => { if (month===11) { setMonth(0); setYear(y=>y+1); } else setMonth(m=>m+1); };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Kalendarz</div>
          <div className="page-sub">{MONTHS_PL[month]} {year}</div>
        </div>
        {isManager && (
          <button className="btn btn-primary" aria-label="Utwórz nowy termin" onClick={onCreateApt}>
            <Icon name="plus" size={15}/> Nowy termin
          </button>
        )}
      </div>
      <div className="content">
        <div className="cal-nav">
          <button className="btn btn-ghost btn-sm" aria-label="Poprzedni miesiąc" onClick={prev}><Icon name="chevronL" size={16}/></button>
          <span className="cal-month-label">{MONTHS_PL[month]} {year}</span>
          <button className="btn btn-ghost btn-sm" aria-label="Następny miesiąc" onClick={next}><Icon name="chevronR" size={16}/></button>
        </div>
        <div className="cal-grid">
          {DAYS_PL.map(d => <div key={d} className="cal-day-header">{d}</div>)}
          {days.map((d, i) => {
            const apts = data.appointments.filter(a => {
              const ad = new Date(a.date_start);
              return ad.getDate()===d.date.getDate() && ad.getMonth()===d.date.getMonth() && ad.getFullYear()===d.date.getFullYear();
            });
            const isToday = d.date.toDateString() === today.toDateString();
            const isSel   = selected && d.date.toDateString() === selected.toDateString();
            return (
              <div key={i}
                className={`cal-day ${!d.current?"other-month":""} ${isToday?"today":""} ${isSel?"selected":""}`}
                onClick={() => setSelected(isSel ? null : d.date)}
              >
                <div className="cal-day-num">{d.date.getDate()}</div>
                <div className="cal-day-dots">
                  {apts.slice(0,3).map(a => <div key={a.id} className="cal-dot" style={{ background:TYPE_COLORS[a.type] }}/>)}
                </div>
              </div>
            );
          })}
        </div>

        {selected && (
          <div style={{ marginTop:20 }}>
            <div style={{ fontSize:13, fontWeight:600, color:"var(--text3)", textTransform:"uppercase", letterSpacing:".07em", marginBottom:12 }}>
              {fmt(selected)}
            </div>
            {selApts.length === 0
              ? <div style={{ fontSize:13, color:"var(--text3)" }}>Brak terminów</div>
              : selApts.map(a => (
                  <div key={a.id} style={{ padding:"10px 12px", borderRadius:8, background:"var(--bg3)", marginBottom:8, cursor:"pointer" }} onClick={() => onSelectApt(a)}>
                    <div style={{ fontSize:13, fontWeight:500, color:"var(--text)" }}>{a.name}</div>
                    <div style={{ fontSize:12, color:"var(--text3)", marginTop:3 }}>{fmtTime(a.date_start)} — {fmtTime(a.date_end)}</div>
                  </div>
                ))
            }
          </div>
        )}
      </div>
    </>
  );
});
