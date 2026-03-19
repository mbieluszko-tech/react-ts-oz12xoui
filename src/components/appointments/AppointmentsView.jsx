import React, { useState, useMemo, memo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../common/Icon';
import { AptRow } from './AptRow';

// ─── APPOINTMENTS VIEW ────────────────────────────────────────────────────────
export const AppointmentsView = memo(function AppointmentsView({ data, getReplies, onSelectApt, onCreateApt, onReply }) {
  const { currentMember, isManager } = useAuth();
  const [filter, setFilter] = useState("upcoming");

  // FIX: today z useMemo
  const today = useMemo(() => new Date(), []);

  const myApts = useMemo(() =>
    isManager
      ? data.appointments
      : data.appointments.filter(a => getReplies(a.id)[currentMember?.id] !== undefined),
    [data.appointments, isManager, currentMember?.id, getReplies]
  );

  const filtered = useMemo(() => {
    switch (filter) {
      case "upcoming":    return myApts.filter(a => new Date(a.date_start) >= today);
      case "past":        return myApts.filter(a => new Date(a.date_start) <  today);
      case "rehearsal":   return myApts.filter(a => a.type === "rehearsal");
      case "performance": return myApts.filter(a => a.type === "performance");
      case "pending":     return myApts.filter(a => new Date(a.date_start) >= today && getReplies(a.id)[currentMember?.id] === "maybe");
      default:            return myApts;
    }
  }, [myApts, filter, today, getReplies, currentMember?.id]);

  const tabs = [
    ["all","Wszystkie"],
    ["upcoming","Nadchodzące"],
    ["past","Minione"],
    ["rehearsal","Próby"],
    ["performance","Koncerty"],
    ...(!isManager ? [["pending","Do potwierdzenia"]] : []),
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Terminy</div>
          <div className="page-sub">{myApts.length} terminów łącznie</div>
        </div>
        {isManager && (
          <button className="btn btn-primary" aria-label="Utwórz nowy termin" onClick={onCreateApt}>
            <Icon name="plus" size={15}/> Nowy termin
          </button>
        )}
      </div>
      <div className="content">
        <div className="tabs">
          {tabs.map(([k, v]) => (
            <button key={k} className={`tab ${filter===k?"active":""}`} onClick={() => setFilter(k)}>{v}</button>
          ))}
        </div>
        <div className="apt-list">
          {filtered.map(apt => (
            <AptRow key={apt.id} apt={apt} replies={getReplies(apt.id)} today={today} onClick={() => onSelectApt(apt)} onReply={onReply}/>
          ))}
          {!filtered.length && (
            <div className="empty-state">
              <Icon name="list" size={32}/><p style={{ marginTop:12 }}>Brak terminów</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
});
