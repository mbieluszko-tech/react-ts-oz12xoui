import React, { memo } from 'react';
import { Icon } from '../common/Icon';
import { fmt } from '../../config';

export const PendingView = memo(function PendingView({ data, onApprove, onReject }) {
  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Wnioski o dołączenie</div>
          <div className="page-sub">{data.pending.length} oczekujących na akceptację</div>
        </div>
      </div>
      <div className="content">
        {!data.pending.length && (
          <div className="empty-state">
            <Icon name="shield" size={40}/>
            <p style={{ marginTop:12 }}>Brak oczekujących wniosków</p>
          </div>
        )}
        <div className="pending-list">
          {data.pending.map(p => (
            <div key={p.id} className="pending-card">
              <div className="pending-info">
                <div className="pending-name">{p.name}</div>
                <div className="pending-email">{p.email}</div>
                <div className="pending-meta">
                  {p.phone && <span>📞 {p.phone} · </span>}
                  Złożony: {fmt(p.created_at)}
                  {p.rodo_accepted  && <span> · ✓ RODO</span>}
                  {p.terms_accepted && <span> · ✓ Regulamin</span>}
                </div>
                {p.message && (
                  <div style={{ fontSize:12, color:"var(--text2)", marginTop:6, padding:"8px 10px", background:"var(--bg3)", borderRadius:6 }}>
                    "{p.message}"
                  </div>
                )}
              </div>
              <div className="pending-actions">
                <button className="btn btn-success btn-sm" onClick={() => onApprove(p)}>
                  <Icon name="check" size={14}/> Akceptuj
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => onReject(p)}>
                  <Icon name="x" size={14}/> Odrzuć
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
});
