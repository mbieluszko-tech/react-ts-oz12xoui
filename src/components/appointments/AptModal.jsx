import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../common/Icon';
import { TYPE_LABELS, TYPE_COLORS, fmt, fmtTime } from '../../config';

// ─── APT MODAL ────────────────────────────────────────────────────────────────
export function AptModal({ apt, replies, members, sections, onClose, onReply, onCopy }) {
  const { currentMember, isManager } = useAuth();
  const yes=Object.values(replies).filter(v=>v==="yes").length;
  const no=Object.values(replies).filter(v=>v==="no").length;
  const maybe=Object.values(replies).filter(v=>v==="maybe").length;
  const total=yes+no+maybe;
  const [saving,setSaving]=useState(null);
  const myStatus=currentMember?(replies[currentMember.id]||null):null;
  const handleReply=async(memberId,status)=>{ setSaving(memberId); await onReply(apt.id,memberId,status); setSaving(null); };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ flex:1 }}>
            <div className="modal-type-badge" style={{ background:`${TYPE_COLORS[apt.type]}22`,color:TYPE_COLORS[apt.type] }}>
              <div style={{ width:6,height:6,borderRadius:"50%",background:TYPE_COLORS[apt.type] }}/>{TYPE_LABELS[apt.type]}
            </div>
            <div className="modal-title">{apt.name}</div>
          </div>
          <button className="btn btn-ghost btn-sm" aria-label="Zamknij" onClick={onClose}><Icon name="x" size={16}/></button>
        </div>
        <div className="modal-body">
          <div className="modal-detail-row">
            <div className="modal-detail-icon"><Icon name="clock" size={16}/></div>
            <div><div className="modal-detail-label">Termin</div><div className="modal-detail-value">{fmt(apt.date_start)}, {fmtTime(apt.date_start)} — {fmtTime(apt.date_end)}</div></div>
          </div>
          {apt.location&&<div className="modal-detail-row"><div className="modal-detail-icon"><Icon name="map" size={16}/></div><div><div className="modal-detail-label">Lokalizacja</div><div className="modal-detail-value">{apt.location}</div></div></div>}
          {apt.description&&<div className="modal-detail-row"><div className="modal-detail-icon"><Icon name="list" size={16}/></div><div><div className="modal-detail-label">Opis</div><div className="modal-detail-value" style={{ fontSize:13.5,color:"var(--text2)",lineHeight:1.5 }}>{apt.description}</div></div></div>}
          {apt.deadline&&<div className="modal-detail-row"><div className="modal-detail-icon"><Icon name="bell" size={16}/></div><div><div className="modal-detail-label">Deadline</div><div className="modal-detail-value">{fmt(apt.deadline)}</div></div></div>}

          {!isManager&&currentMember&&(
            <>
              <hr className="divider"/>
              <div style={{ marginBottom:8 }}>
                <div style={{ fontSize:13,fontWeight:600,color:"var(--text3)",textTransform:"uppercase",letterSpacing:".08em",marginBottom:12 }}>Twoja odpowiedź</div>
                <div style={{ display:"flex",gap:8 }}>
                  {["yes","no","maybe"].map(s=>(
                    <button key={s} className={`reply-pill ${s}`} disabled={saving===currentMember.id}
                      style={{ opacity:myStatus===s?1:0.35,transform:myStatus===s?"scale(1.08)":"scale(1)",padding:"8px 20px",fontSize:13 }}
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
                  <div className="reply-bar-seg" style={{ width:`${(yes/total)*100}%`,background:"var(--yes)" }}/>
                  <div className="reply-bar-seg" style={{ width:`${(no/total)*100}%`,background:"var(--no)" }}/>
                  <div className="reply-bar-seg" style={{ width:`${(maybe/total)*100}%`,background:"var(--maybe)" }}/>
                </div>
                <div className="reply-legend">
                  <div className="reply-leg-item"><div className="reply-leg-dot" style={{ background:"var(--yes)" }}/><span>TAK ({yes})</span></div>
                  <div className="reply-leg-item"><div className="reply-leg-dot" style={{ background:"var(--no)" }}/><span>NIE ({no})</span></div>
                  <div className="reply-leg-item"><div className="reply-leg-dot" style={{ background:"var(--maybe)" }}/><span>MOŻE ({maybe})</span></div>
                </div>
              </>
            )}
            <div className="member-replies-list">
              {members.filter(m=>m.status==="active").map(m=>{
                const sec=sections.find(s=>s.id===m.section_id);
                const r=replies[m.id]||"maybe";
                const isMe=currentMember?.id===m.id;
                return (
                  <div className="member-reply-row" key={m.id} style={isMe?{border:"1px solid rgba(201,168,76,.2)"}:{}}>
                    <div>
                      <div className="member-reply-name">{m.name}{isMe?" (Ty)":""}</div>
                      <div className="member-reply-section">{sec?.name}</div>
                    </div>
                    {isManager?(
                      <div style={{ display:"flex",gap:4 }}>
                        {["yes","no","maybe"].map(s=>(
                          <button key={s} className={`reply-pill ${s}`} disabled={saving===m.id}
                            style={{ opacity:r===s?1:0.3,transform:r===s?"scale(1.05)":"scale(1)" }}
                            onClick={()=>handleReply(m.id,s)}>
                            {s==="yes"?"TAK":s==="no"?"NIE":"MOŻE"}
                          </button>
                        ))}
                      </div>
                    ):(
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
          {isManager && apt.recurring_type && apt.recurring_type!=="none" && (
            <span style={{ fontSize:12, color:"var(--text3)", marginRight:"auto", display:"flex", alignItems:"center", gap:5 }}>
              🔄 Seria: {apt.recurring_type==="weekly"?"co tydzień":apt.recurring_type==="biweekly"?"co 2 tygodnie":"co miesiąc"}
            </span>
          )}
          {isManager && (
            <button className="btn btn-secondary" onClick={()=>{ onCopy(apt); onClose(); }}>
              📋 Kopiuj termin
            </button>
          )}
          <button className="btn btn-secondary" onClick={onClose}>Zamknij</button>
        </div>
      </div>
    </div>
  );
}
