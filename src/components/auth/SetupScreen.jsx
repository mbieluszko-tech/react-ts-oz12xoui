import React, { useState } from 'react';
import { Icon } from '../common/Icon';

// ─── SETUP SCREEN ─────────────────────────────────────────────────────────────
export function SetupScreen({ onSave }) {
  const [url, setUrl] = useState("");
  const [key, setKey] = useState("");
  const valid = url.startsWith("https://") && key.length > 20;
  return (
    <div className="setup-screen">
      <div className="setup-card">
        <h2>🎼 Połącz z bazą danych</h2>
        <p>Wpisz dane ze swojego projektu Supabase.</p>
        <div className="setup-step"><div className="setup-step-num">1</div><div><strong>supabase.com</strong> → projekt → <strong>Settings → API Keys</strong></div></div>
        <div className="setup-step"><div className="setup-step-num">2</div><div>Skopiuj <strong>Project URL</strong> i <strong>anon public key</strong></div></div>
        <div className="form-group" style={{ marginTop:20 }}>
          <label className="form-label">Supabase Project URL</label>
          <input className="form-input" placeholder="https://xyzxyz.supabase.co" value={url} onChange={e=>setUrl(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Supabase Anon Key</label>
          <input className="form-input" placeholder="eyJhbGciOiJIUzI1NiIs..." value={key} onChange={e=>setKey(e.target.value)} />
        </div>
        <button className="btn btn-primary" style={{ width:"100%", justifyContent:"center" }} disabled={!valid} onClick={() => onSave(url.replace(/\/$/,""), key)}>
          <Icon name="db" size={15} /> Połącz z bazą danych
        </button>
      </div>
    </div>
  );
}
