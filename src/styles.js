// ─── STYLE APLIKACJI ─────────────────────────────────────────────────────────
export const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#0C0E14;--bg2:#13151E;--bg3:#1A1D2A;--bg4:#222636;
    --border:rgba(255,255,255,0.07);
    --gold:#C9A84C;--gold2:#E8C96A;
    --text:#E8E6DE;--text2:#9896A0;--text3:#5E5D68;
    --yes:#69B99A;--no:#E07B6A;--maybe:#9B8EC4;
    --radius:12px;--radius-lg:18px;
  }
  body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text)}
  .app{display:flex;height:100vh;overflow:hidden}
  .sidebar{width:230px;min-width:230px;background:var(--bg2);border-right:1px solid var(--border);display:flex;flex-direction:column;padding:24px 0}
  .sidebar-logo{padding:0 20px 28px;border-bottom:1px solid var(--border);margin-bottom:16px}
  .sidebar-logo h1{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;color:var(--gold);letter-spacing:.02em;line-height:1.2}
  .sidebar-logo p{font-size:11px;color:var(--text3);margin-top:3px;letter-spacing:.05em;text-transform:uppercase}
  .nav-item{display:flex;align-items:center;gap:10px;padding:10px 20px;margin:2px 8px;border-radius:8px;cursor:pointer;font-size:13.5px;font-weight:400;color:var(--text2);transition:all .15s;border:none;background:none;width:calc(100% - 16px);text-align:left;font-family:'DM Sans',sans-serif}
  .nav-item:hover{background:var(--bg3);color:var(--text)}
  .nav-item.active{background:rgba(201,168,76,.12);color:var(--gold);font-weight:500}
  .nav-section{padding:16px 20px 6px;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);font-weight:500}
  .sidebar-footer{margin-top:auto;padding:16px 20px 0;border-top:1px solid var(--border)}
  .user-badge{display:flex;align-items:center;gap:10px}
  .user-avatar{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--gold),#8B6914);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;color:#fff;flex-shrink:0}
  .user-name{font-size:13px;font-weight:500;color:var(--text);line-height:1.2}
  .role-badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-top:3px}
  .role-admin{background:rgba(224,123,106,.2);color:#E07B6A}
  .role-leader{background:rgba(201,168,76,.2);color:var(--gold)}
  .role-manager{background:rgba(155,142,196,.2);color:#9B8EC4}
  .role-member{background:rgba(91,155,213,.2);color:#5B9BD5}
  .main{flex:1;overflow-y:auto;background:var(--bg)}
  .page-header{padding:28px 32px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:var(--bg);z-index:10}
  .page-title{font-family:'Playfair Display',serif;font-size:24px;font-weight:600;color:var(--text)}
  .page-sub{font-size:13px;color:var(--text3);margin-top:3px}
  .content{padding:28px 32px}
  .btn{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:8px;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13.5px;font-weight:500;border:none;transition:all .15s}
  .btn-primary{background:var(--gold);color:#0C0E14}.btn-primary:hover{background:var(--gold2)}
  .btn-secondary{background:var(--bg3);color:var(--text);border:1px solid var(--border)}.btn-secondary:hover{background:var(--bg4)}
  .btn-ghost{background:transparent;color:var(--text2)}.btn-ghost:hover{color:var(--text);background:var(--bg3)}
  .btn-success{background:rgba(105,185,154,.15);color:var(--yes);border:1px solid rgba(105,185,154,.2)}.btn-success:hover{background:rgba(105,185,154,.25)}
  .btn-danger{background:rgba(224,123,106,.15);color:var(--no);border:1px solid rgba(224,123,106,.2)}.btn-danger:hover{background:rgba(224,123,106,.25)}
  .btn-sm{padding:6px 12px;font-size:12.5px;border-radius:6px}
  .btn:disabled{opacity:.5;cursor:default}
  .card{background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px}
  .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px}
  .stat-card{background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px 24px}
  .stat-label{font-size:11.5px;color:var(--text3);text-transform:uppercase;letter-spacing:.08em;font-weight:500}
  .stat-value{font-family:'Playfair Display',serif;font-size:32px;font-weight:700;color:var(--text);margin:6px 0 4px;line-height:1}
  .stat-sub{font-size:12px;color:var(--text3)}
  .stat-accent{color:var(--gold)}
  .cal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
  .cal-month{font-family:'Playfair Display',serif;font-size:20px;font-weight:600}
  .cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
  .cal-dow{text-align:center;font-size:11px;font-weight:600;color:var(--text3);padding:6px 0 10px;text-transform:uppercase;letter-spacing:.07em}
  .cal-day{min-height:72px;padding:6px;border-radius:8px;background:var(--bg2);border:1px solid var(--border);cursor:pointer;transition:all .12s}
  .cal-day:hover{background:var(--bg3);border-color:rgba(255,255,255,.12)}
  .cal-day.other-month{opacity:.3}
  .cal-day.today{border-color:var(--gold);background:rgba(201,168,76,.06)}
  .cal-day.selected{border-color:var(--gold);background:rgba(201,168,76,.1)}
  .cal-day-num{font-size:12.5px;font-weight:500;color:var(--text2);margin-bottom:4px}
  .cal-day.today .cal-day-num{color:var(--gold);font-weight:700}
  .cal-dot-label{font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:1px 3px;border-radius:3px;margin-bottom:1px;cursor:pointer}
  .apt-list{display:flex;flex-direction:column;gap:12px}
  .apt-card{background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius-lg);padding:18px 22px;cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:20px}
  .apt-card:hover{border-color:rgba(255,255,255,.14);background:var(--bg3);transform:translateY(-1px)}
  .apt-type-bar{width:3px;height:44px;border-radius:2px;flex-shrink:0}
  .apt-info{flex:1}
  .apt-name{font-size:15px;font-weight:500;color:var(--text);margin-bottom:4px}
  .apt-meta{display:flex;gap:16px;align-items:center;flex-wrap:wrap}
  .apt-meta-item{display:flex;align-items:center;gap:5px;font-size:12.5px;color:var(--text3)}
  .apt-badge{padding:3px 10px;border-radius:20px;font-size:11.5px;font-weight:500}
  .apt-badge-past{background:rgba(94,93,104,.2);color:var(--text3)}
  .apt-replies{display:flex;gap:10px;align-items:center}
  .reply-count{display:flex;align-items:center;gap:4px;font-size:13px;font-weight:500}
  .my-reply-badge{padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;display:inline-flex;align-items:center;gap:5px}
  .my-reply-badge.yes{background:rgba(105,185,154,.15);color:var(--yes)}
  .my-reply-badge.no{background:rgba(224,123,106,.15);color:var(--no)}
  .my-reply-badge.maybe{background:rgba(155,142,196,.15);color:var(--maybe)}
  .my-reply-badge.none{background:rgba(94,93,104,.2);color:var(--text3)}
  .quick-reply-row{display:flex;gap:6px;margin-top:10px}
  .qr-btn{padding:5px 14px;border-radius:20px;font-size:12px;font-weight:600;border:1px solid;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s}
  .qr-btn.yes{border-color:rgba(105,185,154,.3);color:var(--yes);background:transparent}.qr-btn.yes:hover,.qr-btn.yes.active{background:rgba(105,185,154,.15)}
  .qr-btn.no{border-color:rgba(224,123,106,.3);color:var(--no);background:transparent}.qr-btn.no:hover,.qr-btn.no.active{background:rgba(224,123,106,.15)}
  .qr-btn.maybe{border-color:rgba(155,142,196,.3);color:var(--maybe);background:transparent}.qr-btn.maybe:hover,.qr-btn.maybe.active{background:rgba(155,142,196,.15)}
  .qr-btn.active{font-weight:700}
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;z-index:100;padding:20px;animation:fadeIn .15s ease}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  .modal{background:var(--bg2);border:1px solid var(--border);border-radius:20px;width:100%;max-width:680px;max-height:90vh;overflow-y:auto;animation:slideUp .2s ease}
  .modal-wide{max-width:860px}
  @keyframes slideUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}
  .modal-header{padding:24px 28px 20px;border-bottom:1px solid var(--border);display:flex;align-items:flex-start;justify-content:space-between}
  .modal-body{padding:24px 28px}
  .modal-footer{padding:16px 28px 24px;display:flex;justify-content:flex-end;gap:10px}
  .modal-type-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px}
  .modal-title{font-family:'Playfair Display',serif;font-size:22px;font-weight:600}
  .modal-detail-row{display:flex;align-items:flex-start;gap:12px;margin-bottom:14px}
  .modal-detail-icon{color:var(--text3);margin-top:1px;flex-shrink:0}
  .modal-detail-label{font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px}
  .modal-detail-value{font-size:14px;color:var(--text)}
  .divider{border:none;border-top:1px solid var(--border);margin:20px 0}
  .replies-section h3{font-size:13px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:14px}
  .reply-bar{display:flex;gap:3px;height:8px;border-radius:4px;overflow:hidden;margin-bottom:16px}
  .reply-bar-seg{transition:width .4s ease}
  .reply-legend{display:flex;gap:16px;margin-bottom:16px}
  .reply-leg-item{display:flex;align-items:center;gap:5px;font-size:12.5px}
  .reply-leg-dot{width:8px;height:8px;border-radius:50%}
  .member-replies-list{display:flex;flex-direction:column;gap:6px;max-height:260px;overflow-y:auto}
  .member-reply-row{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-radius:8px;background:var(--bg3)}
  .member-reply-name{font-size:13px;color:var(--text)}
  .member-reply-section{font-size:11px;color:var(--text3)}
  .reply-pill{padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;border:none;cursor:pointer;transition:all .12s;font-family:'DM Sans',sans-serif}
  .reply-pill.yes{background:rgba(105,185,154,.15);color:var(--yes)}
  .reply-pill.no{background:rgba(224,123,106,.15);color:var(--no)}
  .reply-pill.maybe{background:rgba(155,142,196,.15);color:var(--maybe)}
  .reply-pill:hover{transform:scale(1.08)}
  .section-header{display:flex;align-items:center;gap:10px;margin-bottom:12px;margin-top:24px}
  .section-dot{width:10px;height:10px;border-radius:50%}
  .section-name-lbl{font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--text2)}
  .section-count{font-size:12px;color:var(--text3)}
  .members-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px}
  .member-card{background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius);padding:14px 16px;display:flex;align-items:center;gap:12px;cursor:pointer;transition:all .12s}
  .member-card:hover{background:var(--bg3);border-color:rgba(255,255,255,.12)}
  .member-av{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;flex-shrink:0}
  .member-card-name{font-size:13.5px;font-weight:500;color:var(--text)}
  .member-card-role{font-size:11px;color:var(--text3)}
  .member-role-badge{display:inline-block;padding:2px 7px;border-radius:4px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;background:rgba(201,168,76,.15);color:var(--gold)}
  .pending-badge{background:rgba(201,168,76,.15);color:var(--gold);padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600}
  .form-group{margin-bottom:18px}
  .form-label{display:block;font-size:12px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:7px}
  .form-input{width:100%;padding:10px 14px;border-radius:8px;background:var(--bg3);border:1px solid var(--border);color:var(--text);font-family:'DM Sans',sans-serif;font-size:14px;outline:none;transition:border-color .15s}
  .form-input:focus{border-color:var(--gold)}
  .form-input option{background:var(--bg3)}
  .form-row{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  textarea.form-input{resize:vertical;min-height:80px}
  .section-checks{display:flex;flex-wrap:wrap;gap:8px}
  .section-check{display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:20px;border:1px solid var(--border);cursor:pointer;font-size:12.5px;color:var(--text2);transition:all .12s;background:var(--bg3)}
  .section-check.active{border-color:var(--gold);color:var(--gold);background:rgba(201,168,76,.1)}
  .section-check-dot{width:8px;height:8px;border-radius:50%}
  .checkbox-row{display:flex;align-items:flex-start;gap:10px;padding:12px;background:var(--bg3);border-radius:10px;margin-bottom:10px;cursor:pointer}
  .checkbox-box{width:18px;height:18px;min-width:18px;border-radius:4px;border:2px solid var(--border);background:var(--bg4);display:flex;align-items:center;justify-content:center;transition:all .12s;margin-top:1px}
  .checkbox-box.checked{background:var(--gold);border-color:var(--gold)}
  .checkbox-label{font-size:13px;color:var(--text2);line-height:1.5}
  .checkbox-label strong{color:var(--text)}
  .stat-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)}
  .stat-row:last-child{border-bottom:none}
  .stat-row-bar-bg{flex:1;height:6px;background:var(--bg3);border-radius:3px;overflow:hidden}
  .stat-row-bar{height:100%;border-radius:3px;transition:width .5s ease}
  .stat-row-label{font-size:13px;color:var(--text);min-width:140px}
  .stat-row-pct{font-size:13px;font-weight:600;color:var(--text2);min-width:40px;text-align:right}
  .tabs{display:flex;gap:4px;background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:4px;margin-bottom:24px;flex-wrap:wrap}
  .tab{padding:7px 16px;border-radius:7px;cursor:pointer;font-size:13px;font-weight:500;color:var(--text3);border:none;background:none;font-family:'DM Sans',sans-serif;transition:all .12s}
  .tab.active{background:var(--bg4);color:var(--text)}
  .two-col{display:grid;grid-template-columns:1fr 1fr;gap:20px}
  .three-col{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
  .empty-state{text-align:center;padding:48px;color:var(--text3)}
  .empty-state p{font-size:14px;margin-top:8px}
  .loading{display:flex;align-items:center;justify-content:center;height:60vh;flex-direction:column;gap:16px;color:var(--text3)}
  .spinner{width:36px;height:36px;border:3px solid var(--bg4);border-top-color:var(--gold);border-radius:50%;animation:spin .8s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}
  .error-banner{background:rgba(224,123,106,.1);border:1px solid rgba(224,123,106,.3);border-radius:8px;padding:12px 16px;font-size:13px;color:var(--no);margin:16px 32px}
  .info-box{background:rgba(91,155,213,.08);border:1px solid rgba(91,155,213,.2);border-radius:10px;padding:14px 16px;font-size:13px;color:#5B9BD5;margin-bottom:20px;line-height:1.6}
  .warning-box{background:rgba(201,168,76,.08);border:1px solid rgba(201,168,76,.2);border-radius:10px;padding:14px 16px;font-size:13px;color:var(--gold);margin-bottom:20px;line-height:1.6}
  .auth-screen{display:flex;align-items:center;justify-content:center;min-height:100vh;background:var(--bg);padding:20px}
  .auth-card{background:var(--bg2);border:1px solid var(--border);border-radius:24px;padding:44px 40px;max-width:480px;width:100%}
  .auth-logo{font-family:'Playfair Display',serif;font-size:28px;font-weight:700;color:var(--gold);margin-bottom:6px}
  .auth-sub{font-size:13px;color:var(--text3);margin-bottom:32px}
  .auth-tabs{display:flex;gap:0;background:var(--bg3);border-radius:10px;padding:4px;margin-bottom:24px}
  .auth-tab{flex:1;padding:8px;border-radius:7px;cursor:pointer;font-size:13px;font-weight:500;color:var(--text3);border:none;background:none;font-family:'DM Sans',sans-serif;transition:all .12s;text-align:center}
  .auth-tab.active{background:var(--bg4);color:var(--text)}
  .auth-error{background:rgba(224,123,106,.1);border:1px solid rgba(224,123,106,.2);border-radius:8px;padding:10px 14px;font-size:13px;color:var(--no);margin-bottom:16px}
  .auth-success{background:rgba(105,185,154,.1);border:1px solid rgba(105,185,154,.2);border-radius:8px;padding:10px 14px;font-size:13px;color:var(--yes);margin-bottom:16px}
  .auth-hint{font-size:12px;color:var(--text3);margin-top:16px;text-align:center;line-height:1.6}
  .member-profile{display:grid;grid-template-columns:200px 1fr;gap:24px}
  .member-profile-left{display:flex;flex-direction:column;align-items:center;gap:12px}
  .member-avatar-lg{width:80px;height:80px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700}
  .info-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px}
  .info-row:last-child{border-bottom:none}
  .info-row-label{color:var(--text3)}
  .info-row-value{color:var(--text);font-weight:500}
  .pending-list{display:flex;flex-direction:column;gap:10px}
  .pending-card{background:var(--bg2);border:1px solid rgba(201,168,76,.2);border-radius:var(--radius);padding:16px 20px;display:flex;align-items:center;justify-content:space-between;gap:16px}
  .pending-info{flex:1}
  .pending-name{font-size:14px;font-weight:600;color:var(--text)}
  .pending-email{font-size:12px;color:var(--text3);margin-top:2px}
  .pending-meta{font-size:12px;color:var(--text2);margin-top:4px}
  .pending-actions{display:flex;gap:8px}
  .setup-screen{display:flex;align-items:center;justify-content:center;height:100vh;background:var(--bg)}
  .setup-card{background:var(--bg2);border:1px solid var(--border);border-radius:20px;padding:40px;max-width:520px;width:100%;margin:20px}
  .setup-card h2{font-family:'Playfair Display',serif;font-size:22px;color:var(--text);margin-bottom:8px}
  .setup-card p{font-size:13.5px;color:var(--text2);margin-bottom:24px;line-height:1.6}
  .setup-step{display:flex;gap:12px;margin-bottom:12px;padding:12px;background:var(--bg3);border-radius:10px;font-size:13px;color:var(--text2);line-height:1.5}
  .setup-step-num{background:var(--gold);color:#0C0E14;width:22px;height:22px;min-width:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700}
  ::-webkit-scrollbar{width:6px;height:6px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:var(--bg4);border-radius:3px}

  /* ── WALIDACJA ──────────────────────────────────────────────────── */
  .field-error{font-size:11px;color:var(--no);margin-top:4px}
  .input-error{border-color:var(--no)!important;box-shadow:0 0 0 2px rgba(224,123,106,.15)}
  /* ── CONFIRM / DANGER ───────────────────────────────────────────── */
  .btn-danger{background:rgba(224,123,106,.15);color:var(--no);border:1px solid rgba(224,123,106,.3);display:flex;align-items:center;gap:6px;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:13px;font-family:'DM Sans',sans-serif;transition:all .15s}
  .btn-danger:hover{background:rgba(224,123,106,.25)}
  /* ── RESPONSIVE ─────────────────────────────────────────────────── */
  @media(max-width:768px){.app{flex-direction:column}.sidebar{width:100%;height:auto;flex-direction:row;flex-wrap:wrap;padding:8px 12px}.main{padding:12px}}
`;
