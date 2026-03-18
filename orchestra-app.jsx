import React, { useState, useEffect, useCallback, createContext, useContext } from "react";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt      = (d) => new Date(d).toLocaleDateString("pl-PL", { day:"numeric", month:"long", year:"numeric" });
const fmtShort = (d) => new Date(d).toLocaleDateString("pl-PL", { day:"numeric", month:"short" });
const fmtTime  = (d) => new Date(d).toLocaleTimeString("pl-PL", { hour:"2-digit", minute:"2-digit" });
const MONTHS_PL = ["Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec","Lipiec","Sierpień","Wrzesień","Październik","Listopad","Grudzień"];
const DAYS_PL   = ["Pn","Wt","Śr","Cz","Pt","Sb","Nd"];
const TYPE_LABELS = { rehearsal:"Próba", performance:"Koncert", other:"Inne" };
const TYPE_COLORS = { rehearsal:"#5B9BD5", performance:"#C9A84C", other:"#9B8EC4" };

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month+1, 0);
  let startDow = firstDay.getDay() || 7;
  const days = [];
  for (let i=1; i<startDow; i++) days.push({ date: new Date(year,month,1-(startDow-i)), current:false });
  for (let d=1; d<=lastDay.getDate(); d++) days.push({ date: new Date(year,month,d), current:true });
  while (days.length%7!==0) days.push({ date: new Date(year,month+1,days.length-lastDay.getDate()-startDow+2), current:false });
  return days;
}

// ─── AUTH CONTEXT ─────────────────────────────────────────────────────────────
const AuthCtx = createContext(null);
const useAuth = () => useContext(AuthCtx);

// ─── STYLES ───────────────────────────────────────────────────────────────────
const css = `
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

  /* SIDEBAR */
  .sidebar{width:220px;min-width:220px;background:var(--bg2);border-right:1px solid var(--border);display:flex;flex-direction:column;padding:24px 0}
  .sidebar-logo{padding:0 20px 28px;border-bottom:1px solid var(--border);margin-bottom:16px}
  .sidebar-logo h1{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;color:var(--gold);letter-spacing:.02em;line-height:1.2}
  .sidebar-logo p{font-size:11px;color:var(--text3);margin-top:3px;letter-spacing:.05em;text-transform:uppercase}
  .nav-item{display:flex;align-items:center;gap:10px;padding:10px 20px;margin:2px 8px;border-radius:8px;cursor:pointer;font-size:13.5px;font-weight:400;color:var(--text2);transition:all .15s;border:none;background:none;width:calc(100% - 16px);text-align:left;font-family:'DM Sans',sans-serif}
  .nav-item:hover{background:var(--bg3);color:var(--text)}
  .nav-item.active{background:rgba(201,168,76,.12);color:var(--gold);font-weight:500}
  .sidebar-section{padding:20px 20px 8px;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);font-weight:500}
  .sidebar-footer{margin-top:auto;padding:16px 20px 0;border-top:1px solid var(--border)}
  .user-badge{display:flex;align-items:center;gap:10px}
  .user-avatar{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--gold),#8B6914);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;color:#fff;flex-shrink:0}
  .user-name{font-size:13px;font-weight:500;color:var(--text);line-height:1.2}
  .user-role{font-size:11px;color:var(--text3)}
  .role-badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-top:3px}
  .role-leader{background:rgba(201,168,76,.2);color:var(--gold)}
  .role-member{background:rgba(91,155,213,.2);color:#5B9BD5}

  /* MAIN */
  .main{flex:1;overflow-y:auto;background:var(--bg)}
  .page-header{padding:28px 32px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:var(--bg);z-index:10}
  .page-title{font-family:'Playfair Display',serif;font-size:24px;font-weight:600;color:var(--text)}
  .page-sub{font-size:13px;color:var(--text3);margin-top:3px}
  .content{padding:28px 32px}

  /* BUTTONS */
  .btn{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:8px;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13.5px;font-weight:500;border:none;transition:all .15s}
  .btn-primary{background:var(--gold);color:#0C0E14}.btn-primary:hover{background:var(--gold2)}
  .btn-secondary{background:var(--bg3);color:var(--text);border:1px solid var(--border)}.btn-secondary:hover{background:var(--bg4)}
  .btn-ghost{background:transparent;color:var(--text2)}.btn-ghost:hover{color:var(--text);background:var(--bg3)}
  .btn-sm{padding:6px 12px;font-size:12.5px;border-radius:6px}
  .btn-danger{background:rgba(224,123,106,.15);color:var(--no);border:1px solid rgba(224,123,106,.2)}.btn-danger:hover{background:rgba(224,123,106,.25)}
  .btn:disabled{opacity:.5;cursor:default}

  /* CARDS */
  .card{background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px}
  .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px}
  .stat-card{background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px 24px}
  .stat-label{font-size:11.5px;color:var(--text3);text-transform:uppercase;letter-spacing:.08em;font-weight:500}
  .stat-value{font-family:'Playfair Display',serif;font-size:32px;font-weight:700;color:var(--text);margin:6px 0 4px;line-height:1}
  .stat-sub{font-size:12px;color:var(--text3)}
  .stat-accent{color:var(--gold)}

  /* CALENDAR */
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

  /* APPOINTMENT LIST */
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

  /* MY REPLY BADGE */
  .my-reply-badge{padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;display:inline-flex;align-items:center;gap:5px}
  .my-reply-badge.yes{background:rgba(105,185,154,.15);color:var(--yes)}
  .my-reply-badge.no{background:rgba(224,123,106,.15);color:var(--no)}
  .my-reply-badge.maybe{background:rgba(155,142,196,.15);color:var(--maybe)}
  .my-reply-badge.none{background:rgba(94,93,104,.2);color:var(--text3)}

  /* MEMBER QUICK REPLY */
  .quick-reply-row{display:flex;gap:6px;margin-top:10px}
  .qr-btn{padding:5px 14px;border-radius:20px;font-size:12px;font-weight:600;border:1px solid;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s}
  .qr-btn.yes{border-color:rgba(105,185,154,.3);color:var(--yes);background:transparent}.qr-btn.yes:hover,.qr-btn.yes.active{background:rgba(105,185,154,.15)}
  .qr-btn.no{border-color:rgba(224,123,106,.3);color:var(--no);background:transparent}.qr-btn.no:hover,.qr-btn.no.active{background:rgba(224,123,106,.15)}
  .qr-btn.maybe{border-color:rgba(155,142,196,.3);color:var(--maybe);background:transparent}.qr-btn.maybe:hover,.qr-btn.maybe.active{background:rgba(155,142,196,.15)}
  .qr-btn.active{font-weight:700}

  /* MODAL */
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;z-index:100;padding:20px;animation:fadeIn .15s ease}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  .modal{background:var(--bg2);border:1px solid var(--border);border-radius:20px;width:100%;max-width:680px;max-height:90vh;overflow-y:auto;animation:slideUp .2s ease}
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

  /* MEMBERS */
  .section-header{display:flex;align-items:center;gap:10px;margin-bottom:12px;margin-top:24px}
  .section-dot{width:10px;height:10px;border-radius:50%}
  .section-name-lbl{font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--text2)}
  .section-count{font-size:12px;color:var(--text3)}
  .members-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px}
  .member-card{background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius);padding:14px 16px;display:flex;align-items:center;gap:12px}
  .member-av{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;flex-shrink:0}
  .member-card-name{font-size:13.5px;font-weight:500;color:var(--text)}
  .member-card-role{font-size:11px;color:var(--text3)}
  .member-role-badge{display:inline-block;padding:2px 7px;border-radius:4px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;background:rgba(201,168,76,.15);color:var(--gold)}

  /* FORM */
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

  /* STATS */
  .stat-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)}
  .stat-row:last-child{border-bottom:none}
  .stat-row-bar-bg{flex:1;height:6px;background:var(--bg3);border-radius:3px;overflow:hidden}
  .stat-row-bar{height:100%;border-radius:3px;transition:width .5s ease}
  .stat-row-label{font-size:13px;color:var(--text);min-width:140px}
  .stat-row-pct{font-size:13px;font-weight:600;color:var(--text2);min-width:40px;text-align:right}

  /* TABS */
  .tabs{display:flex;gap:4px;background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:4px;margin-bottom:24px;flex-wrap:wrap}
  .tab{padding:7px 16px;border-radius:7px;cursor:pointer;font-size:13px;font-weight:500;color:var(--text3);border:none;background:none;font-family:'DM Sans',sans-serif;transition:all .12s}
  .tab.active{background:var(--bg4);color:var(--text)}

  /* LAYOUT */
  .two-col{display:grid;grid-template-columns:1fr 1fr;gap:20px}
  .three-col{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
  .empty-state{text-align:center;padding:48px;color:var(--text3)}
  .empty-state p{font-size:14px;margin-top:8px}

  /* LOADING / ERROR */
  .loading{display:flex;align-items:center;justify-content:center;height:60vh;flex-direction:column;gap:16px;color:var(--text3)}
  .spinner{width:36px;height:36px;border:3px solid var(--bg4);border-top-color:var(--gold);border-radius:50%;animation:spin .8s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}
  .error-banner{background:rgba(224,123,106,.1);border:1px solid rgba(224,123,106,.3);border-radius:8px;padding:12px 16px;font-size:13px;color:var(--no);margin:16px 32px}

  /* LOGIN SCREEN */
  .auth-screen{display:flex;align-items:center;justify-content:center;height:100vh;background:var(--bg)}
  .auth-card{background:var(--bg2);border:1px solid var(--border);border-radius:24px;padding:44px 40px;max-width:420px;width:100%;margin:20px}
  .auth-logo{font-family:'Playfair Display',serif;font-size:28px;font-weight:700;color:var(--gold);margin-bottom:6px}
  .auth-sub{font-size:13px;color:var(--text3);margin-bottom:32px}
  .auth-tabs{display:flex;gap:0;background:var(--bg3);border-radius:10px;padding:4px;margin-bottom:24px}
  .auth-tab{flex:1;padding:8px;border-radius:7px;cursor:pointer;font-size:13px;font-weight:500;color:var(--text3);border:none;background:none;font-family:'DM Sans',sans-serif;transition:all .12s;text-align:center}
  .auth-tab.active{background:var(--bg4);color:var(--text)}
  .auth-error{background:rgba(224,123,106,.1);border:1px solid rgba(224,123,106,.2);border-radius:8px;padding:10px 14px;font-size:13px;color:var(--no);margin-bottom:16px}
  .auth-success{background:rgba(105,185,154,.1);border:1px solid rgba(105,185,154,.2);border-radius:8px;padding:10px 14px;font-size:13px;color:var(--yes);margin-bottom:16px}
  .auth-hint{font-size:12px;color:var(--text3);margin-top:16px;text-align:center;line-height:1.6}

  /* SETUP SCREEN */
  .setup-screen{display:flex;align-items:center;justify-content:center;height:100vh;background:var(--bg)}
  .setup-card{background:var(--bg2);border:1px solid var(--border);border-radius:20px;padding:40px;max-width:520px;width:100%;margin:20px}
  .setup-card h2{font-family:'Playfair Display',serif;font-size:22px;color:var(--text);margin-bottom:8px}
  .setup-card p{font-size:13.5px;color:var(--text2);margin-bottom:24px;line-height:1.6}
  .setup-step{display:flex;gap:12px;margin-bottom:12px;padding:12px;background:var(--bg3);border-radius:10px;font-size:13px;color:var(--text2);line-height:1.5}
  .setup-step-num{background:var(--gold);color:#0C0E14;width:22px;height:22px;min-width:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700}

  /* INFO BOX */
  .info-box{background:rgba(91,155,213,.08);border:1px solid rgba(91,155,213,.2);border-radius:10px;padding:14px 16px;font-size:13px;color:#5B9BD5;margin-bottom:20px;line-height:1.6}

  ::-webkit-scrollbar{width:6px;height:6px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:var(--bg4);border-radius:3px}
`;

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Icon = ({ name, size=18 }) => {
  const icons = {
    calendar: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    users:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    chart:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
    plus:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    x:        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    check:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    clock:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    map:      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
    chevronL: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
    chevronR: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
    list:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
    home:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    bell:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    logout:   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    lock:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    mail:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    db:       <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
  };
  return icons[name] || null;
};

// ─── SETUP SCREEN ─────────────────────────────────────────────────────────────
function SetupScreen({ onSave }) {
  const [url, setUrl] = useState("");
  const [key, setKey] = useState("");
  const valid = url.startsWith("https://") && key.length > 20;
  return (
    <div className="setup-screen">
      <div className="setup-card">
        <h2>🎼 Połącz z bazą danych</h2>
        <p>Wpisz dane ze swojego projektu Supabase.</p>
        <div className="setup-step"><div className="setup-step-num">1</div><div><strong>supabase.com</strong> → Twój projekt → <strong>Settings → API Keys</strong></div></div>
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

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
function LoginScreen({ config, onLogin }) {
  const [tab, setTab]         = useState("login");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");

  const authFetch = async (path, body) => {
    const res = await fetch(`${config.url}/auth/v1/${path}`, {
      method: "POST",
      headers: { "apikey": config.key, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || data.msg || data.message || "Błąd");
    return data;
  };

  const handleLogin = async () => {
    setLoading(true); setError(""); setSuccess("");
    try {
      const data = await authFetch("token?grant_type=password", { email, password });
      onLogin(data.access_token, data.user);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleRegister = async () => {
    setLoading(true); setError(""); setSuccess("");
    try {
      await authFetch("signup", { email, password });
      setSuccess("Konto utworzone! Sprawdź email i potwierdź rejestrację, potem wróć i zaloguj się.");
      setTab("login");
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleKey = (e) => { if (e.key==="Enter") tab==="login" ? handleLogin() : handleRegister(); };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">🎼 Alternator</div>
        <div className="auth-sub">Orkiestra ACK UG — system zarządzania</div>
        <div className="auth-tabs">
          <button className={`auth-tab ${tab==="login"?"active":""}`} onClick={()=>{setTab("login");setError("");setSuccess("");}}>Zaloguj się</button>
          <button className={`auth-tab ${tab==="register"?"active":""}`} onClick={()=>{setTab("register");setError("");setSuccess("");}}>Utwórz konto</button>
        </div>
        {error   && <div className="auth-error">⚠️ {error}</div>}
        {success && <div className="auth-success">✓ {success}</div>}
        <div className="form-group">
          <label className="form-label"><Icon name="mail" size={12} /> Email</label>
          <input className="form-input" type="email" placeholder="twoj@email.pl" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={handleKey} />
        </div>
        <div className="form-group">
          <label className="form-label"><Icon name="lock" size={12} /> Hasło</label>
          <input className="form-input" type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={handleKey} />
        </div>
        <button className="btn btn-primary" style={{ width:"100%", justifyContent:"center", padding:"12px" }} disabled={loading||!email||!password} onClick={tab==="login"?handleLogin:handleRegister}>
          {loading ? <><div className="spinner" style={{ width:16, height:16, borderWidth:2 }}/> Ładowanie...</> : tab==="login" ? "Zaloguj się" : "Utwórz konto"}
        </button>
        {tab==="register" && (
          <div className="auth-hint">
            Użyj emaila który jest w bazie członków.<br/>
            Np. <strong>anna@ack.ug.edu.pl</strong>
          </div>
        )}
        {tab==="login" && (
          <div className="auth-hint">
            Nie masz konta? Najpierw zarejestruj się<br/>używając swojego emaila z listy członków.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [config, setConfig] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("km_config")||"null");
      if (saved) return saved;
    } catch {}
    // ⬇️ WKLEJ SWOJE DANE Z SUPABASE → Settings → API Keys
    const SUPABASE_URL = "https://pkqjlpsprxmlpkclzwoe.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrcWpscHNwcnhtbHBrY2x6d29lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4Mjg5NzksImV4cCI6MjA4OTQwNDk3OX0.kMQMbcppSQ_-NkhTasWa5d36-WfT5yJKxomf_rwWwtA";
    if (SUPABASE_KEY !== "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrcWpscHNwcnhtbHBrY2x6d29lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4Mjg5NzksImV4cCI6MjA4OTQwNDk3OX0.kMQMbcppSQ_-NkhTasWa5d36-WfT5yJKxomf_rwWwtA") {
      return { url: SUPABASE_URL, key: SUPABASE_KEY };
    }
    return null;
  });
  const [session, setSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem("km_session")||"null"); } catch { return null; }
  });
  const [currentMember, setCurrentMember] = useState(null);
  const [view, setView]       = useState("dashboard");
  const [data, setData]       = useState({ sections:[], members:[], appointments:[], replies:[] });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [selectedApt, setSelectedApt] = useState(null);
  const [showCreate, setShowCreate]   = useState(false);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear]   = useState(new Date().getFullYear());
  const [calSelected, setCalSelected] = useState(null);

  const handleSaveConfig = (url, key) => {
    const cfg = { url, key };
    localStorage.setItem("km_config", JSON.stringify(cfg));
    setConfig(cfg);
  };

  const handleLogin = (token, user) => {
    const s = { token, email: user.email };
    localStorage.setItem("km_session", JSON.stringify(s));
    setSession(s);
  };

  const handleLogout = () => {
    localStorage.removeItem("km_session");
    setSession(null);
    setCurrentMember(null);
    setData({ sections:[], members:[], appointments:[], replies:[] });
  };

  // API call with auth token
  const apiFn = useCallback(async (path, options={}) => {
    if (!config || !session) return null;
    const res = await fetch(`${config.url}/rest/v1/${path}`, {
      headers: {
        "apikey": config.key,
        "Authorization": `Bearer ${session.token}`,
        "Content-Type": "application/json",
        "Prefer": options.prefer || "return=representation",
        ...options.headers,
      },
      ...options,
    });
    if (res.status === 401) { handleLogout(); return null; }
    if (!res.ok) throw new Error(await res.text());
    const t = await res.text();
    return t ? JSON.parse(t) : null;
  }, [config, session]);

  const loadData = useCallback(async () => {
    if (!config || !session) return;
    setLoading(true); setError(null);
    try {
      const [sections, members, appointments, replies] = await Promise.all([
        apiFn("sections?select=*&order=id"),
        apiFn("members?select=*&order=id"),
        apiFn("appointments?select=*&order=date_start"),
        apiFn("replies?select=*"),
      ]);
      const s = sections||[], m = members||[], a = appointments||[], r = replies||[];
      setData({ sections:s, members:m, appointments:a, replies:r });
      // find current member by email
      const me = m.find(x => x.email === session.email);
      setCurrentMember(me || null);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }, [config, session, apiFn]);

  useEffect(() => { if (session) loadData(); }, [loadData, session]);

  const getReplies = (aptId) => {
    const r = {};
    data.replies.filter(x=>x.appointment_id===aptId).forEach(x=>{r[x.member_id]=x.status;});
    return r;
  };

  const handleCreateApt = async (form) => {
    try {
      const created = await apiFn("appointments", { method:"POST", body:JSON.stringify({
        name:form.name, type:form.type,
        date_start:form.dateStart, date_end:form.dateEnd,
        location:form.location, description:form.description,
        deadline:form.deadline, status:"active", published:true,
      })});
      const apt = Array.isArray(created)?created[0]:created;
      if (form.sectionIds.length) {
        await apiFn("appointment_sections", { method:"POST", body:JSON.stringify(
          form.sectionIds.map(sid=>({ appointment_id:apt.id, section_id:sid }))
        )});
      }
      const invited = form.sectionIds.length
        ? data.members.filter(m=>form.sectionIds.includes(m.section_id))
        : data.members;
      // Each member must insert their own reply due to RLS
      // Leader inserts on behalf — for now insert as "maybe" using service approach
      // We'll just reload and let members reply themselves
      await loadData();
    } catch(e) { alert("Błąd: "+e.message); }
  };

  const handleReply = async (aptId, memberId, status) => {
    try {
      await apiFn("replies", {
        method:"POST",
        headers:{ "Prefer":"resolution=merge-duplicates,return=representation" },
        body:JSON.stringify({ appointment_id:aptId, member_id:memberId, status }),
      });
      setData(d=>({
        ...d,
        replies:[
          ...d.replies.filter(r=>!(r.appointment_id===aptId&&r.member_id===memberId)),
          { appointment_id:aptId, member_id:memberId, status }
        ]
      }));
    } catch(e) { alert("Błąd zapisu: "+e.message); }
  };

  const isLeader = currentMember?.role === "leader";

  // ─── SCREENS ────────────────────────────────────────────────────────────────
  if (!config)  return <><style>{css}</style><SetupScreen onSave={handleSaveConfig} /></>;
  if (!session) return <><style>{css}</style><LoginScreen config={config} onLogin={handleLogin} /></>;

  const authValue = { currentMember, isLeader, session };

  return (
    <AuthCtx.Provider value={authValue}>
      <style>{css}</style>
      <div className="app">
        <Sidebar view={view} setView={setView} onLogout={handleLogout} />
        <div className="main">
          {error && <div className="error-banner">⚠️ {error.slice(0,120)} <button className="btn btn-ghost btn-sm" onClick={loadData} style={{ marginLeft:8 }}>Ponów</button></div>}
          {loading
            ? <div className="loading"><div className="spinner"/><span>Ładowanie danych...</span></div>
            : <>
                {view==="dashboard"    && <Dashboard    data={data} getReplies={getReplies} onSelectApt={setSelectedApt} onCreateApt={()=>setShowCreate(true)} onReply={handleReply} />}
                {view==="calendar"     && <CalendarView data={data} getReplies={getReplies} month={calMonth} year={calYear} setMonth={setCalMonth} setYear={setCalYear} selected={calSelected} setSelected={setCalSelected} onSelectApt={setSelectedApt} onCreateApt={()=>setShowCreate(true)} />}
                {view==="appointments" && <AppointmentsView data={data} getReplies={getReplies} onSelectApt={setSelectedApt} onCreateApt={()=>setShowCreate(true)} onReply={handleReply} />}
                {view==="members"      && <MembersView  data={data} />}
                {isLeader && view==="stats" && <StatsView data={data} getReplies={getReplies} />}
              </>
          }
        </div>
      </div>
      {selectedApt && <AptModal apt={selectedApt} replies={getReplies(selectedApt.id)} members={data.members} sections={data.sections} onClose={()=>setSelectedApt(null)} onReply={handleReply} />}
      {showCreate && isLeader && <CreateModal sections={data.sections} onClose={()=>setShowCreate(false)} onCreate={handleCreateApt} />}
    </AuthCtx.Provider>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({ view, setView, onLogout }) {
  const { currentMember, isLeader } = useAuth();
  const nav = [
    { id:"dashboard",    icon:"home",     label:"Dashboard" },
    { id:"calendar",     icon:"calendar", label:"Kalendarz" },
    { id:"appointments", icon:"list",     label:"Terminy" },
    { id:"members",      icon:"users",    label:"Członkowie" },
    ...(isLeader ? [{ id:"stats", icon:"chart", label:"Statystyki" }] : []),
  ];
  const initials = currentMember?.name.split(" ").map(n=>n[0]).join("") || "?";
  return (
    <div className="sidebar">
      <div className="sidebar-logo"><h1>🎼 Alternator</h1><p>Orkiestra ACK UG</p></div>
      <div className="sidebar-section">Nawigacja</div>
      {nav.map(n=>(
        <button key={n.id} className={`nav-item ${view===n.id?"active":""}`} onClick={()=>setView(n.id)}>
          <Icon name={n.icon} size={16}/>{n.label}
        </button>
      ))}
      <div className="sidebar-footer">
        <div className="user-badge">
          <div className="user-avatar">{initials}</div>
          <div>
            <div className="user-name">{currentMember?.name || "Gość"}</div>
            <div className={`role-badge ${isLeader?"role-leader":"role-member"}`}>
              {isLeader ? "Lider" : "Członek"}
            </div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" style={{ marginTop:12, width:"100%", justifyContent:"center", fontSize:11 }} onClick={onLogout}>
          <Icon name="logout" size={12}/> Wyloguj się
        </button>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ data, getReplies, onSelectApt, onCreateApt, onReply }) {
  const { currentMember, isLeader } = useAuth();
  const today = new Date();

  // Filter appointments for member
  const myApts = isLeader
    ? data.appointments
    : data.appointments.filter(a => {
        const r = getReplies(a.id);
        return r[currentMember?.id] !== undefined;
      });

  const upcoming = myApts.filter(a=>new Date(a.date_start)>=today).slice(0,3);
  const totalYes = myApts.reduce((acc,a)=>acc+Object.values(getReplies(a.id)).filter(v=>v==="yes").length,0);
  const totalR   = myApts.reduce((acc,a)=>acc+Object.values(getReplies(a.id)).length,0);
  const avgAtt   = totalR?Math.round((totalYes/totalR)*100):0;
  const next     = upcoming[0];
  const daysTo   = next?Math.ceil((new Date(next.date_start)-today)/86400000):null;

  // My own replies (for member view)
  const myPending = isLeader ? [] : myApts.filter(a => {
    const r = getReplies(a.id);
    return new Date(a.date_start)>=today && r[currentMember?.id]==="maybe";
  });

  return (
    <>
      <div className="page-header">
        <div><div className="page-title">Dashboard</div><div className="page-sub">{fmt(today)}</div></div>
        {isLeader && <button className="btn btn-primary" onClick={onCreateApt}><Icon name="plus" size={15}/> Nowy termin</button>}
      </div>
      <div className="content">
        {!isLeader && myPending.length>0 && (
          <div className="info-box" style={{ marginBottom:24 }}>
            📋 Masz <strong>{myPending.length}</strong> termin{myPending.length===1?"":"y"} bez potwierdzenia — kliknij i odpowiedz TAK lub NIE.
          </div>
        )}
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-label">{isLeader?"Nadchodzące":"Moje terminy"}</div><div className="stat-value">{upcoming.length}</div><div className="stat-sub">najbliższe</div></div>
          {isLeader && <div className="stat-card"><div className="stat-label">Członkowie</div><div className="stat-value">{data.members.length}</div><div className="stat-sub">w {data.sections.length} sekcjach</div></div>}
          {!isLeader && <div className="stat-card"><div className="stat-label">Moja frekwencja</div><div className="stat-value stat-accent">{(() => { const me=currentMember?.id; const y=myApts.filter(a=>getReplies(a.id)[me]==="yes").length; return myApts.length?Math.round((y/myApts.length)*100):0; })()}%</div><div className="stat-sub">odpowiedzi TAK</div></div>}
          <div className="stat-card"><div className="stat-label">Śr. frekwencja</div><div className="stat-value stat-accent">{avgAtt}%</div><div className="stat-sub">TAK w terminach</div></div>
          <div className="stat-card"><div className="stat-label">Następny termin</div><div className="stat-value">{daysTo??"—"}</div><div className="stat-sub">{next?`za ${daysTo} ${daysTo===1?"dzień":"dni"}`:"brak"}</div></div>
        </div>
        <div className="two-col">
          <div className="card">
            <div style={{ fontSize:14, fontWeight:600, marginBottom:18 }}>Najbliższe terminy</div>
            <div className="apt-list">
              {upcoming.map(apt=>(
                <AptRow key={apt.id} apt={apt} replies={getReplies(apt.id)} onClick={()=>onSelectApt(apt)} onReply={onReply} />
              ))}
              {!upcoming.length && <div className="empty-state"><p>Brak nadchodzących terminów</p></div>}
            </div>
          </div>
          <div className="card">
            <div style={{ fontSize:14, fontWeight:600, marginBottom:18 }}>Frekwencja</div>
            {myApts.slice(0,6).map(apt=>{
              const r = getReplies(apt.id);
              const yes = Object.values(r).filter(v=>v==="yes").length;
              const tot = Object.values(r).length;
              const pct = tot?Math.round((yes/tot)*100):0;
              return (
                <div className="stat-row" key={apt.id}>
                  <div className="stat-row-label" style={{ fontSize:12.5 }}>{apt.name.length>22?apt.name.slice(0,22)+"…":apt.name}</div>
                  <div className="stat-row-bar-bg"><div className="stat-row-bar" style={{ width:`${pct}%`, background:TYPE_COLORS[apt.type] }}/></div>
                  <div className="stat-row-pct">{pct}%</div>
                </div>
              );
            })}
            {!myApts.length && <div className="empty-state" style={{ padding:24 }}><p>Brak danych</p></div>}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── APT ROW ──────────────────────────────────────────────────────────────────
function AptRow({ apt, replies, onClick, onReply }) {
  const { currentMember, isLeader } = useAuth();
  const yes   = Object.values(replies).filter(v=>v==="yes").length;
  const no    = Object.values(replies).filter(v=>v==="no").length;
  const maybe = Object.values(replies).filter(v=>v==="maybe").length;
  const isPast = new Date(apt.date_start)<new Date();
  const myStatus = currentMember ? (replies[currentMember.id] || null) : null;

  return (
    <div className="apt-card" onClick={onClick}>
      <div className="apt-type-bar" style={{ background:TYPE_COLORS[apt.type] }}/>
      <div className="apt-info">
        <div className="apt-name">{apt.name}</div>
        <div className="apt-meta">
          <div className="apt-meta-item"><Icon name="clock" size={12}/>{fmtShort(apt.date_start)} · {fmtTime(apt.date_start)}</div>
          {apt.location && <div className="apt-meta-item"><Icon name="map" size={12}/>{apt.location.split(",")[0]}</div>}
        </div>
        {/* Quick reply buttons for members */}
        {!isLeader && !isPast && onReply && (
          <div className="quick-reply-row" onClick={e=>e.stopPropagation()}>
            {["yes","no","maybe"].map(s=>(
              <button key={s} className={`qr-btn ${s} ${myStatus===s?"active":""}`}
                onClick={()=>onReply(apt.id,currentMember.id,s)}>
                {s==="yes"?"✓ TAK":s==="no"?"✗ NIE":"? MOŻE"}
              </button>
            ))}
          </div>
        )}
      </div>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8, flexShrink:0 }}>
        <span className={`apt-badge ${isPast?"apt-badge-past":""}`}
          style={!isPast?{ background:`${TYPE_COLORS[apt.type]}22`, color:TYPE_COLORS[apt.type] }:{}}>
          {TYPE_LABELS[apt.type]}
        </span>
        {isLeader ? (
          <div className="apt-replies">
            <span className="reply-count" style={{ color:"var(--yes)" }}><Icon name="check" size={12}/>{yes}</span>
            <span className="reply-count" style={{ color:"var(--no)" }}><Icon name="x" size={12}/>{no}</span>
            <span className="reply-count" style={{ color:"var(--maybe)" }}><Icon name="clock" size={12}/>{maybe}</span>
          </div>
        ) : myStatus ? (
          <span className={`my-reply-badge ${myStatus}`}>
            {myStatus==="yes"?"✓ TAK":myStatus==="no"?"✗ NIE":"? MOŻE"}
          </span>
        ) : (
          <span className="my-reply-badge none">Brak odpowiedzi</span>
        )}
      </div>
    </div>
  );
}

// ─── CALENDAR VIEW ────────────────────────────────────────────────────────────
function CalendarView({ data, getReplies, month, year, setMonth, setYear, selected, setSelected, onSelectApt, onCreateApt }) {
  const { isLeader } = useAuth();
  const days  = getCalendarDays(year, month);
  const today = new Date();
  const getApts = (date) => data.appointments.filter(a=>{
    const d=new Date(a.date_start);
    return d.getFullYear()===date.getFullYear()&&d.getMonth()===date.getMonth()&&d.getDate()===date.getDate();
  });
  const prev = () => month===0?(setMonth(11),setYear(y=>y-1)):setMonth(m=>m-1);
  const next = () => month===11?(setMonth(0),setYear(y=>y+1)):setMonth(m=>m+1);
  const selApts = selected?getApts(selected):[];
  return (
    <>
      <div className="page-header">
        <div><div className="page-title">Kalendarz</div><div className="page-sub">{MONTHS_PL[month]} {year}</div></div>
        {isLeader && <button className="btn btn-primary" onClick={onCreateApt}><Icon name="plus" size={15}/> Nowy termin</button>}
      </div>
      <div className="content">
        <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:24 }}>
          <div className="card">
            <div className="cal-header">
              <button className="btn btn-ghost btn-sm" onClick={prev}><Icon name="chevronL" size={16}/></button>
              <div className="cal-month">{MONTHS_PL[month]} {year}</div>
              <button className="btn btn-ghost btn-sm" onClick={next}><Icon name="chevronR" size={16}/></button>
            </div>
            <div className="cal-grid">
              {DAYS_PL.map(d=><div key={d} className="cal-dow">{d}</div>)}
              {days.map((d,i)=>{
                const apts=getApts(d.date);
                const isToday=d.date.toDateString()===today.toDateString();
                const isSel=selected&&d.date.toDateString()===selected.toDateString();
                return (
                  <div key={i} className={`cal-day ${!d.current?"other-month":""} ${isToday?"today":""} ${isSel?"selected":""}`} onClick={()=>setSelected(d.date)}>
                    <div className="cal-day-num">{d.date.getDate()}</div>
                    {apts.slice(0,2).map(a=>(
                      <div key={a.id} className="cal-dot-label" style={{ background:`${TYPE_COLORS[a.type]}22`, color:TYPE_COLORS[a.type] }}
                        onClick={e=>{e.stopPropagation();onSelectApt(a);}}>
                        {a.name.split("—")[0].trim().slice(0,14)}
                      </div>
                    ))}
                    {apts.length>2&&<div style={{ fontSize:10, color:"var(--text3)" }}>+{apts.length-2}</div>}
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div className="card">
              <div style={{ fontSize:13, fontWeight:600, color:"var(--text3)", marginBottom:12, textTransform:"uppercase", letterSpacing:".07em" }}>
                {selected?fmt(selected):"Wybierz dzień"}
              </div>
              {!selApts.length&&<div className="empty-state" style={{ padding:24 }}><Icon name="calendar" size={28}/><p>Brak terminów</p></div>}
              {selApts.map(apt=>(
                <div key={apt.id} style={{ padding:"10px 12px", borderRadius:8, background:"var(--bg3)", marginBottom:8, cursor:"pointer" }} onClick={()=>onSelectApt(apt)}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:TYPE_COLORS[apt.type] }}/>
                    <div style={{ fontSize:13, fontWeight:500 }}>{apt.name}</div>
                  </div>
                  <div style={{ fontSize:12, color:"var(--text3)", paddingLeft:16 }}>{fmtTime(apt.date_start)} — {fmtTime(apt.date_end)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── APPOINTMENTS VIEW ────────────────────────────────────────────────────────
function AppointmentsView({ data, getReplies, onSelectApt, onCreateApt, onReply }) {
  const { currentMember, isLeader } = useAuth();
  const [filter, setFilter] = useState("all");
  const today = new Date();

  const myApts = isLeader
    ? data.appointments
    : data.appointments.filter(a => getReplies(a.id)[currentMember?.id] !== undefined);

  const filtered = myApts.filter(a=>{
    if (filter==="upcoming") return new Date(a.date_start)>=today;
    if (filter==="past")     return new Date(a.date_start)<today;
    if (filter==="rehearsal")   return a.type==="rehearsal";
    if (filter==="performance") return a.type==="performance";
    if (!isLeader && filter==="pending") {
      return new Date(a.date_start)>=today && getReplies(a.id)[currentMember?.id]==="maybe";
    }
    return true;
  });

  return (
    <>
      <div className="page-header">
        <div><div className="page-title">Terminy</div><div className="page-sub">{myApts.length} terminów łącznie</div></div>
        {isLeader && <button className="btn btn-primary" onClick={onCreateApt}><Icon name="plus" size={15}/> Nowy termin</button>}
      </div>
      <div className="content">
        <div className="tabs">
          <button className={`tab ${filter==="all"?"active":""}`} onClick={()=>setFilter("all")}>Wszystkie</button>
          <button className={`tab ${filter==="upcoming"?"active":""}`} onClick={()=>setFilter("upcoming")}>Nadchodzące</button>
          <button className={`tab ${filter==="past"?"active":""}`} onClick={()=>setFilter("past")}>Minione</button>
          <button className={`tab ${filter==="rehearsal"?"active":""}`} onClick={()=>setFilter("rehearsal")}>Próby</button>
          <button className={`tab ${filter==="performance"?"active":""}`} onClick={()=>setFilter("performance")}>Koncerty</button>
          {!isLeader && <button className={`tab ${filter==="pending"?"active":""}`} onClick={()=>setFilter("pending")}>Do potwierdzenia</button>}
        </div>
        <div className="apt-list">
          {filtered.map(apt=><AptRow key={apt.id} apt={apt} replies={getReplies(apt.id)} onClick={()=>onSelectApt(apt)} onReply={onReply} />)}
          {!filtered.length && <div className="empty-state"><Icon name="list" size={32}/><p style={{ marginTop:12 }}>Brak terminów</p></div>}
        </div>
      </div>
    </>
  );
}

// ─── MEMBERS VIEW ─────────────────────────────────────────────────────────────
function MembersView({ data }) {
  return (
    <>
      <div className="page-header">
        <div><div className="page-title">Członkowie</div><div className="page-sub">{data.members.length} muzyków w {data.sections.length} sekcjach</div></div>
      </div>
      <div className="content">
        {data.sections.map(sec=>{
          const secM=data.members.filter(m=>m.section_id===sec.id);
          if(!secM.length) return null;
          return (
            <div key={sec.id}>
              <div className="section-header">
                <div className="section-dot" style={{ background:sec.color }}/>
                <div className="section-name-lbl">{sec.name}</div>
                <div className="section-count">{secM.length} os.</div>
              </div>
              <div className="members-grid">
                {secM.map(m=>{
                  const initials=m.name.split(" ").map(n=>n[0]).join("");
                  return (
                    <div key={m.id} className="member-card">
                      <div className="member-av" style={{ background:`linear-gradient(135deg,${sec.color}88,${sec.color}33)`, color:sec.color }}>{initials}</div>
                      <div>
                        <div className="member-card-name">{m.name}</div>
                        {m.role==="leader"?<span className="member-role-badge">Lider</span>:<div className="member-card-role">{sec.name}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── STATS VIEW ───────────────────────────────────────────────────────────────
function StatsView({ data, getReplies }) {
  const memberStats = data.members.map(m=>{
    const yes=data.appointments.filter(a=>getReplies(a.id)[m.id]==="yes").length;
    return {...m,yes,pct:data.appointments.length?Math.round((yes/data.appointments.length)*100):0};
  }).sort((a,b)=>b.pct-a.pct);

  const sectionStats = data.sections.map(sec=>{
    const secM=data.members.filter(m=>m.section_id===sec.id);
    if(!secM.length) return {...sec,pct:0};
    const yes=secM.reduce((acc,m)=>acc+data.appointments.filter(a=>getReplies(a.id)[m.id]==="yes").length,0);
    const tot=secM.length*data.appointments.length;
    return {...sec,pct:tot?Math.round((yes/tot)*100):0};
  });

  const typeStats = Object.entries(TYPE_LABELS).map(([type,label])=>{
    const apts=data.appointments.filter(a=>a.type===type);
    const yes=apts.reduce((acc,a)=>acc+Object.values(getReplies(a.id)).filter(v=>v==="yes").length,0);
    const tot=apts.reduce((acc,a)=>acc+Object.values(getReplies(a.id)).length,0);
    return {type,label,pct:tot?Math.round((yes/tot)*100):0,color:TYPE_COLORS[type],count:apts.length};
  });

  return (
    <>
      <div className="page-header"><div><div className="page-title">Statystyki</div><div className="page-sub">Tylko dla lidera</div></div></div>
      <div className="content">
        <div className="three-col" style={{ marginBottom:24 }}>
          {typeStats.map(t=>(
            <div className="stat-card" key={t.type}>
              <div className="stat-label" style={{ color:t.color }}>{t.label}</div>
              <div className="stat-value" style={{ color:t.color }}>{t.pct}%</div>
              <div className="stat-sub">śr. frekwencja · {t.count} terminów</div>
            </div>
          ))}
        </div>
        <div className="two-col">
          <div className="card">
            <div style={{ fontSize:14, fontWeight:600, marginBottom:16 }}>Frekwencja per sekcja</div>
            {sectionStats.map(s=>(
              <div className="stat-row" key={s.id}>
                <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:160 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:s.color }}/>
                  <div className="stat-row-label" style={{ minWidth:0, fontSize:13 }}>{s.name}</div>
                </div>
                <div className="stat-row-bar-bg"><div className="stat-row-bar" style={{ width:`${s.pct}%`, background:s.color }}/></div>
                <div className="stat-row-pct">{s.pct}%</div>
              </div>
            ))}
          </div>
          <div className="card">
            <div style={{ fontSize:14, fontWeight:600, marginBottom:16 }}>Ranking frekwencji</div>
            {memberStats.slice(0,8).map((m,i)=>{
              const sec=data.sections.find(s=>s.id===m.section_id);
              return (
                <div className="stat-row" key={m.id}>
                  <div style={{ fontSize:12, color:"var(--text3)", minWidth:20 }}>#{i+1}</div>
                  <div className="stat-row-label" style={{ fontSize:13 }}>{m.name.split(" ")[0]} {m.name.split(" ")[1]?.[0]}.</div>
                  <div className="stat-row-bar-bg"><div className="stat-row-bar" style={{ width:`${m.pct}%`, background:sec?.color||"var(--gold)" }}/></div>
                  <div className="stat-row-pct">{m.pct}%</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── APT MODAL ────────────────────────────────────────────────────────────────
function AptModal({ apt, replies, members, sections, onClose, onReply }) {
  const { currentMember, isLeader } = useAuth();
  const yes   = Object.values(replies).filter(v=>v==="yes").length;
  const no    = Object.values(replies).filter(v=>v==="no").length;
  const maybe = Object.values(replies).filter(v=>v==="maybe").length;
  const total = yes+no+maybe;
  const [saving, setSaving] = useState(null);
  const myStatus = currentMember?(replies[currentMember.id]||null):null;

  const handleReply = async (memberId, status) => {
    setSaving(memberId);
    await onReply(apt.id, memberId, status);
    setSaving(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ flex:1 }}>
            <div className="modal-type-badge" style={{ background:`${TYPE_COLORS[apt.type]}22`, color:TYPE_COLORS[apt.type] }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:TYPE_COLORS[apt.type] }}/>{TYPE_LABELS[apt.type]}
            </div>
            <div className="modal-title">{apt.name}</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><Icon name="x" size={16}/></button>
        </div>
        <div className="modal-body">
          <div className="modal-detail-row">
            <div className="modal-detail-icon"><Icon name="clock" size={16}/></div>
            <div><div className="modal-detail-label">Termin</div><div className="modal-detail-value">{fmt(apt.date_start)}, {fmtTime(apt.date_start)} — {fmtTime(apt.date_end)}</div></div>
          </div>
          {apt.location&&(
            <div className="modal-detail-row">
              <div className="modal-detail-icon"><Icon name="map" size={16}/></div>
              <div><div className="modal-detail-label">Lokalizacja</div><div className="modal-detail-value">{apt.location}</div></div>
            </div>
          )}
          {apt.description&&(
            <div className="modal-detail-row">
              <div className="modal-detail-icon"><Icon name="list" size={16}/></div>
              <div><div className="modal-detail-label">Opis</div><div className="modal-detail-value" style={{ fontSize:13.5, color:"var(--text2)", lineHeight:1.5 }}>{apt.description}</div></div>
            </div>
          )}
          {apt.deadline&&(
            <div className="modal-detail-row">
              <div className="modal-detail-icon"><Icon name="bell" size={16}/></div>
              <div><div className="modal-detail-label">Deadline odpowiedzi</div><div className="modal-detail-value">{fmt(apt.deadline)}</div></div>
            </div>
          )}

          {/* MEMBER: moja odpowiedź */}
          {!isLeader && currentMember && (
            <>
              <hr className="divider"/>
              <div style={{ marginBottom:8 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"var(--text3)", textTransform:"uppercase", letterSpacing:".08em", marginBottom:12 }}>Twoja odpowiedź</div>
                <div style={{ display:"flex", gap:8 }}>
                  {["yes","no","maybe"].map(s=>(
                    <button key={s} className={`reply-pill ${s}`} disabled={saving===currentMember.id}
                      style={{ opacity:myStatus===s?1:0.35, transform:myStatus===s?"scale(1.08)":"scale(1)", padding:"8px 20px", fontSize:13 }}
                      onClick={()=>handleReply(currentMember.id,s)}>
                      {s==="yes"?"✓ TAK":s==="no"?"✗ NIE":"? MOŻE"}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <hr className="divider"/>
          <div className="replies-section">
            <h3>Odpowiedzi ({total})</h3>
            {total>0&&(
              <>
                <div className="reply-bar">
                  <div className="reply-bar-seg" style={{ width:`${(yes/total)*100}%`, background:"var(--yes)" }}/>
                  <div className="reply-bar-seg" style={{ width:`${(no/total)*100}%`, background:"var(--no)" }}/>
                  <div className="reply-bar-seg" style={{ width:`${(maybe/total)*100}%`, background:"var(--maybe)" }}/>
                </div>
                <div className="reply-legend">
                  <div className="reply-leg-item"><div className="reply-leg-dot" style={{ background:"var(--yes)" }}/><span>TAK ({yes})</span></div>
                  <div className="reply-leg-item"><div className="reply-leg-dot" style={{ background:"var(--no)" }}/><span>NIE ({no})</span></div>
                  <div className="reply-leg-item"><div className="reply-leg-dot" style={{ background:"var(--maybe)" }}/><span>MOŻE ({maybe})</span></div>
                </div>
              </>
            )}
            <div className="member-replies-list">
              {members.map(m=>{
                const sec=sections.find(s=>s.id===m.section_id);
                const r=replies[m.id]||"maybe";
                const isMe=currentMember?.id===m.id;
                return (
                  <div className="member-reply-row" key={m.id} style={isMe?{border:"1px solid rgba(201,168,76,.2)"}:{}}>
                    <div>
                      <div className="member-reply-name">{m.name}{isMe?" (Ty)":""}</div>
                      <div className="member-reply-section">{sec?.name}</div>
                    </div>
                    {isLeader ? (
                      <div style={{ display:"flex", gap:4 }}>
                        {["yes","no","maybe"].map(s=>(
                          <button key={s} className={`reply-pill ${s}`} disabled={saving===m.id}
                            style={{ opacity:r===s?1:0.3, transform:r===s?"scale(1.05)":"scale(1)" }}
                            onClick={()=>handleReply(m.id,s)}>
                            {s==="yes"?"TAK":s==="no"?"NIE":"MOŻE"}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className={`reply-pill ${r}`} style={{ cursor:"default" }}>
                        {r==="yes"?"TAK":r==="no"?"NIE":"MOŻE"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Zamknij</button>
        </div>
      </div>
    </div>
  );
}

// ─── CREATE MODAL ─────────────────────────────────────────────────────────────
function CreateModal({ sections, onClose, onCreate }) {
  const pad=n=>String(n).padStart(2,"0");
  const toLocal=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const def=new Date(); def.setDate(def.getDate()+7); def.setHours(18,0,0,0);
  const defEnd=new Date(def); defEnd.setHours(20,0,0,0);
  const defDl=new Date(def); defDl.setDate(defDl.getDate()-2);

  const [form,setForm]=useState({
    name:"",type:"rehearsal",
    dateStart:toLocal(def),dateEnd:toLocal(defEnd),
    location:"",description:"",
    deadline:defDl.toISOString().split("T")[0],
    sectionIds:sections.map(s=>s.id),
  });
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const toggleSec=id=>setForm(f=>({...f,sectionIds:f.sectionIds.includes(id)?f.sectionIds.filter(s=>s!==id):[...f.sectionIds,id]}));

  const handleSubmit=()=>{
    if(!form.name||!form.dateStart) return;
    onCreate({
      name:form.name,type:form.type,
      dateStart:new Date(form.dateStart).toISOString(),
      dateEnd:new Date(form.dateEnd).toISOString(),
      location:form.location||"ACK Alternator",
      description:form.description,
      deadline:form.deadline?new Date(form.deadline).toISOString():null,
      sectionIds:form.sectionIds,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Nowy termin</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><Icon name="x" size={16}/></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Nazwa *</label>
            <input className="form-input" placeholder="np. Próba przed koncertem" value={form.name} onChange={e=>set("name",e.target.value)}/>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Typ</label>
              <select className="form-input" value={form.type} onChange={e=>set("type",e.target.value)}>
                <option value="rehearsal">Próba</option>
                <option value="performance">Koncert</option>
                <option value="other">Inne</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Deadline odpowiedzi</label>
              <input className="form-input" type="date" value={form.deadline} onChange={e=>set("deadline",e.target.value)}/>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Początek *</label>
              <input className="form-input" type="datetime-local" value={form.dateStart} onChange={e=>set("dateStart",e.target.value)}/>
            </div>
            <div className="form-group">
              <label className="form-label">Koniec</label>
              <input className="form-input" type="datetime-local" value={form.dateEnd} onChange={e=>set("dateEnd",e.target.value)}/>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Lokalizacja</label>
            <input className="form-input" placeholder="np. Aula ACK Alternator" value={form.location} onChange={e=>set("location",e.target.value)}/>
          </div>
          <div className="form-group">
            <label className="form-label">Opis</label>
            <textarea className="form-input" placeholder="Dodatkowe informacje…" value={form.description} onChange={e=>set("description",e.target.value)}/>
          </div>
          <div className="form-group">
            <label className="form-label">Zaproszone sekcje</label>
            <div className="section-checks">
              {sections.map(sec=>(
                <div key={sec.id} className={`section-check ${form.sectionIds.includes(sec.id)?"active":""}`} onClick={()=>toggleSec(sec.id)}>
                  <div className="section-check-dot" style={{ background:sec.color }}/>{sec.name}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Anuluj</button>
          <button className="btn btn-primary" onClick={handleSubmit}><Icon name="check" size={14}/> Utwórz termin</button>
        </div>
      </div>
    </div>
  );
}
