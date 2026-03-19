import React from 'react';
import { Icon } from './Icon';

/**
 * ConfirmModal — zastępuje window.confirm()
 * Użycie:
 *   const [confirm, ConfirmDialog] = useConfirm();
 *   ...
 *   await confirm({ title:"Usuń", message:"Czy na pewno?", danger:true });
 *   ...
 *   return <>{ConfirmDialog}</>;
 */
export function useConfirm() {
  const [state, setState] = React.useState(null);
  // state = { title, message, danger, resolve }

  const confirm = React.useCallback((opts) => {
    return new Promise((resolve) => {
      setState({ ...opts, resolve });
    });
  }, []);

  const handleConfirm = () => { state?.resolve(true);  setState(null); };
  const handleCancel  = () => { state?.resolve(false); setState(null); };

  const dialog = state ? (
    <div className="modal-overlay" onClick={handleCancel}>
      <div
        className="modal"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth:400 }}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-msg"
      >
        <div className="modal-header">
          <div className="modal-title" id="confirm-title">
            {state.danger ? <span style={{ color:"var(--no)" }}>⚠ </span> : null}
            {state.title || "Potwierdzenie"}
          </div>
          <button className="btn btn-ghost btn-sm" aria-label="Zamknij" onClick={handleCancel}>
            <Icon name="x" size={16}/>
          </button>
        </div>
        <div className="modal-body" id="confirm-msg" style={{ fontSize:14, color:"var(--text2)", lineHeight:1.6 }}>
          {state.message}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleCancel} autoFocus>
            Anuluj
          </button>
          <button
            className={`btn ${state.danger ? "btn-danger" : "btn-primary"}`}
            onClick={handleConfirm}
          >
            {state.confirmLabel || (state.danger ? "Usuń" : "Potwierdź")}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return [confirm, dialog];
}
