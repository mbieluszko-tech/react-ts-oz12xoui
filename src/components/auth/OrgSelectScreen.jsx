import React from 'react';
import { ORG_TYPE_LABELS } from '../../config';

export function OrgSelectScreen({ organizations, loading, error, onSelect, onLogout, userEmail }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", justifyContent:"center",
      minHeight:"100vh", background:"var(--bg)", padding:20,
    }}>
      <div style={{ maxWidth:560, width:"100%" }}>

        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:32, fontWeight:700, color:"var(--gold)", marginBottom:8 }}>
            🎼 ACK Alternator
          </div>
          <div style={{ fontSize:14, color:"var(--text3)" }}>
            Zalogowany jako <strong style={{ color:"var(--text2)" }}>{userEmail}</strong>
          </div>
          <div style={{ fontSize:13, color:"var(--text3)", marginTop:4 }}>
            Wybierz grupę do której chcesz wejść
          </div>
        </div>

        {/* Spinner podczas ładowania */}
        {loading && (
          <div style={{ textAlign:"center", padding:"40px 0" }}>
            <div className="spinner" style={{ margin:"0 auto 16px" }}/>
            <div style={{ fontSize:13, color:"var(--text3)" }}>Ładowanie grup...</div>
          </div>
        )}

        {/* Błąd ładowania */}
        {!loading && error && (
          <div style={{
            background:"rgba(224,123,106,.1)", border:"1px solid rgba(224,123,106,.3)",
            borderRadius:12, padding:"16px 20px", marginBottom:16,
            color:"var(--no)", fontSize:13, textAlign:"center",
          }}>
            <div style={{ marginBottom:8 }}>⚠️ {error}</div>
            <div style={{ fontSize:12, color:"var(--text3)" }}>
              Sprawdź połączenie z internetem i spróbuj ponownie.
            </div>
          </div>
        )}

        {/* Lista organizacji */}
        {!loading && !error && (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {organizations.map(org => (
              <OrgCard key={org.id} org={org} onSelect={onSelect} />
            ))}
          </div>
        )}

        {/* Brak grup — po zakończeniu ładowania */}
        {!loading && !error && organizations.length === 0 && (
          <div style={{
            textAlign:"center", padding:"40px 20px",
            background:"var(--bg2)", borderRadius:16, border:"1px solid var(--border)",
            color:"var(--text3)", fontSize:14,
          }}>
            <div style={{ fontSize:40, marginBottom:12 }}>⏳</div>
            <div style={{ fontWeight:600, color:"var(--text2)", marginBottom:8 }}>
              Twoje konto czeka na akceptację
            </div>
            <div style={{ fontSize:13 }}>
              Administrator musi przypisać Cię do grupy.
              Skontaktuj się z zarządem ACK.
            </div>
          </div>
        )}

        {/* Wyloguj */}
        <div style={{ textAlign:"center", marginTop:24 }}>
          <button
            onClick={onLogout}
            style={{
              background:"none", border:"none", cursor:"pointer",
              color:"var(--text3)", fontSize:13, fontFamily:"'DM Sans',sans-serif",
            }}
          >
            Wyloguj się
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── KARTA ORGANIZACJI ────────────────────────────────────────────────────────
function OrgCard({ org, onSelect }) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <button
      onClick={() => onSelect(org)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:"flex", alignItems:"center", gap:16,
        padding:"20px 24px", borderRadius:16, width:"100%",
        background: hovered ? "var(--bg3)" : "var(--bg2)",
        border:`1px solid ${hovered ? (org.color || "var(--gold)") : "var(--border)"}`,
        cursor:"pointer", textAlign:"left",
        fontFamily:"'DM Sans',sans-serif",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        transition:"all .15s",
        outline:"none",
      }}
    >
      {/* Logo */}
      <div style={{
        width:52, height:52, borderRadius:14, flexShrink:0,
        background:`${org.color || "#C9A84C"}22`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:26,
      }}>
        {org.logo_emoji || "🎼"}
      </div>

      {/* Tekst */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:16, fontWeight:600, color:"var(--text)", marginBottom:3 }}>
          {org.name}
        </div>
        <div style={{ fontSize:12, color:"var(--text3)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {ORG_TYPE_LABELS[org.type] || org.type}
          {org.description && ` · ${org.description}`}
        </div>
      </div>

      {/* Strzałka */}
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
        stroke={hovered ? (org.color || "var(--gold)") : "var(--text3)"}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{ flexShrink:0, transition:"stroke .15s" }}>
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </button>
  );
}
