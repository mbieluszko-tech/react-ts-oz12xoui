import React, { useState, useCallback, createContext, useContext } from 'react';
import { TOAST_DEFAULT_MS, TOAST_ERROR_MS } from '../config';

const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((message, type = "info", duration = TOAST_DEFAULT_MS) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    }
    return id;
  }, []);

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => add(msg, "success", dur),
    error:   (msg, dur) => add(msg, "error", dur ?? TOAST_ERROR_MS),
    warning: (msg, dur) => add(msg, "warning", dur),
    info:    (msg, dur) => add(msg, "info", dur),
  };

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onRemove={remove} />
    </ToastCtx.Provider>
  );
}

const TOAST_STYLES = {
  success: { bg:"rgba(105,185,154,.12)", border:"rgba(105,185,154,.3)", color:"#69B99A", icon:"✓" },
  error:   { bg:"rgba(224,123,106,.12)", border:"rgba(224,123,106,.3)", color:"#E07B6A", icon:"✕" },
  warning: { bg:"rgba(201,168,76,.12)",  border:"rgba(201,168,76,.3)",  color:"#C9A84C", icon:"⚠" },
  info:    { bg:"rgba(91,155,213,.12)",  border:"rgba(91,155,213,.3)",  color:"#5B9BD5", icon:"ℹ" },
};

function ToastContainer({ toasts, onRemove }) {
  if (!toasts.length) return null;
  return (
    <div style={{
      position:"fixed", bottom:24, right:24,
      display:"flex", flexDirection:"column", gap:8,
      zIndex:9999, maxWidth:380, width:"calc(100vw - 48px)",
    }}>
      {toasts.map(t => {
        const s = TOAST_STYLES[t.type] || TOAST_STYLES.info;
        return (
          <div key={t.id} style={{
            display:"flex", alignItems:"flex-start", gap:10,
            padding:"12px 16px", borderRadius:12,
            background:s.bg, border:`1px solid ${s.border}`,
            boxShadow:"0 4px 20px rgba(0,0,0,.3)",
            animation:"toastIn .2s ease",
          }}>
            <span style={{ color:s.color, fontWeight:700, fontSize:14, flexShrink:0, marginTop:1 }}>{s.icon}</span>
            <span style={{ fontSize:13, color:"var(--text)", lineHeight:1.5, flex:1 }}>{t.message}</span>
            <button
              onClick={() => onRemove(t.id)}
              aria-label="Zamknij powiadomienie"
              style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text3)", fontSize:18, lineHeight:1, flexShrink:0, padding:0 }}
            >×</button>
          </div>
        );
      })}
      <style>{`@keyframes toastIn { from { transform:translateX(100%); opacity:0 } to { transform:translateX(0); opacity:1 } }`}</style>
    </div>
  );
}
