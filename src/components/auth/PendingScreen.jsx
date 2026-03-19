import React from 'react';
import { Icon } from '../common/Icon';

// ─── PENDING APPROVAL SCREEN ──────────────────────────────────────────────────
export function PendingScreen({ onLogout }) {
  return (
    <div className="auth-screen">
      <div className="auth-card" style={{ textAlign:"center" }}>
        <div style={{ fontSize:48, marginBottom:16 }}>⏳</div>
        <div className="auth-logo" style={{ marginBottom:8 }}>Wniosek w trakcie weryfikacji</div>
        <p style={{ color:"var(--text2)", fontSize:14, lineHeight:1.6, marginBottom:24 }}>
          Twoje konto zostało utworzone, ale czeka na akceptację przez administratora.<br/>
          Skontaktuj się z zarządem orkiestry jeśli proces trwa zbyt długo.
        </p>
        <button className="btn btn-secondary" style={{ width:"100%", justifyContent:"center" }} onClick={onLogout}>
          <Icon name="logout" size={14}/> Wyloguj się
        </button>
      </div>
    </div>
  );
}
