import React, { memo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../common/Icon';
import { ROLE_LABELS } from '../../config';

export const Sidebar = memo(function Sidebar({ view, setView, onLogout, onSwitchOrg, onManageOrgs, onManageSections, pendingCount }) {
  const { currentMember, isAdmin, isManager, isSuperAdmin, currentOrg } = useAuth();
  const initials = currentMember?.name?.split(" ").map(n => n[0]).join("").slice(0,2) || "?";
  const role     = currentMember?.role || "member";

  const nav = [
    { id:"dashboard",    icon:"home",     label:"Dashboard" },
    { id:"calendar",     icon:"calendar", label:"Kalendarz" },
    { id:"appointments", icon:"list",     label:"Terminy" },
    { id:"members",      icon:"users",    label:"Członkowie" },
  ];

  return (
    <nav className="sidebar" aria-label="Nawigacja główna">
      {/* Logo + nazwa organizacji */}
      <div className="sidebar-logo">
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
          <span style={{ fontSize:22 }} aria-hidden="true">{currentOrg?.logo_emoji || "🎼"}</span>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, color:currentOrg?.color||"var(--gold)", lineHeight:1.2 }}>
            {currentOrg?.name || "ACK Alternator"}
          </div>
        </div>
        <p style={{ fontSize:10, color:"var(--text3)", letterSpacing:".05em", textTransform:"uppercase", paddingLeft:32, margin:0 }}>
          {currentOrg?.type === "orchestra" ? "Orkiestra" :
           currentOrg?.type === "choir"     ? "Chór" :
           currentOrg?.type === "ensemble"  ? "Zespół" :
           currentOrg?.type === "vocal"     ? "Studio" : "Grupa"}
        </p>
      </div>

      {/* Nawigacja */}
      <div className="nav-section">Nawigacja</div>
      {nav.map(n => (
        <button key={n.id} className={`nav-item ${view===n.id?"active":""}`} onClick={() => setView(n.id)} aria-current={view===n.id?"page":undefined}>
          <Icon name={n.icon} size={16}/>{n.label}
        </button>
      ))}

      {/* Zarządzanie */}
      {isManager && (
        <>
          <div className="nav-section">Zarządzanie</div>
          <button className={`nav-item ${view==="pending"?"active":""}`} onClick={() => setView("pending")}>
            <Icon name="shield" size={16}/>
            Wnioski
            {pendingCount > 0 && (
              <span aria-label={`${pendingCount} oczekujących wniosków`} style={{ marginLeft:"auto", background:"var(--gold)", color:"#0C0E14", borderRadius:10, fontSize:11, fontWeight:700, padding:"1px 7px" }}>
                {pendingCount}
              </span>
            )}
          </button>
          <button className={`nav-item ${view==="stats"?"active":""}`} onClick={() => setView("stats")}>
            <Icon name="chart" size={16}/>Statystyki
          </button>
          {onManageSections && (
            <button className="nav-item" onClick={onManageSections}>
              <Icon name="list" size={16}/>Struktura zespołu
            </button>
          )}
        </>
      )}

      {/* Stopka */}
      <div className="sidebar-footer">
        <div className="user-badge">
          <div className="user-avatar" aria-hidden="true">{initials}</div>
          <div>
            <div className="user-name">{currentMember?.name || "…"}</div>
            <div className={`role-badge role-${role}`}>{ROLE_LABELS[role] || role}</div>
          </div>
        </div>

        {onSwitchOrg && (
          <button className="btn btn-ghost btn-sm" onClick={onSwitchOrg} style={{ marginTop:10, width:"100%", justifyContent:"center", fontSize:11 }}>
            🔄 Zmień grupę
          </button>
        )}
        {onManageOrgs && (
          <button className="btn btn-ghost btn-sm" onClick={onManageOrgs} style={{ marginTop:4, width:"100%", justifyContent:"center", fontSize:11 }}>
            ⚙️ Zarządzaj grupami
          </button>
        )}
        <button className="btn btn-ghost btn-sm" onClick={onLogout} style={{ marginTop:4, width:"100%", justifyContent:"center", fontSize:11 }}>
          <Icon name="logout" size={12}/> Wyloguj się
        </button>
      </div>
    </nav>
  );
});
