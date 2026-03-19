import React, { useState, useEffect } from 'react';
import { Icon } from '../common/Icon';
import { createAuthClient } from '../../utils/api';
import { useForm } from '../../hooks/useForm';
import { validators } from '../../config';

export function AuthScreen({ config, onLogin }) {
  const [tab, setTab]         = useState("login");
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState("");
  const [sections, setSections] = useState([]);
  const [rodo, setRodo]   = useState(false);
  const [terms, setTerms] = useState(false);

  useEffect(() => {
    if (tab !== "register") return;
    fetch(`${config.url}/rest/v1/sections?select=id,name&order=id`, {
      headers: { "apikey": config.key }
    }).then(r => r.ok ? r.json() : []).then(setSections).catch(() => {});
  }, [tab]);

  const loginForm = useForm(
    { email:"", password:"" },
    { email: validators.email, password: validators.required }
  );
  const regForm = useForm(
    { name:"", email:"", password:"", phone:"", sectionId:"", message:"" },
    { name: validators.name, email: validators.email, password: validators.password }
  );

  const authClient = createAuthClient(config.url, config.key);

  const handleLogin = async () => {
    if (!loginForm.validate()) return;
    setLoading(true); setServerError("");
    try {
      const data = await authClient.login(loginForm.values.email, loginForm.values.password);
      onLogin(data.access_token, data.user);
    } catch(e) { setServerError(e.message); }
    finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!regForm.validate()) return;
    if (!rodo || !terms) { setServerError("Musisz zaakceptować regulamin i zgodę RODO."); return; }
    setLoading(true); setServerError(""); setSuccess("");
    try {
      await authClient.register(regForm.values.email, regForm.values.password);
      await fetch(`${config.url}/rest/v1/pending_registrations`, {
        method:"POST",
        headers:{ "apikey":config.key, "Content-Type":"application/json", "Prefer":"return=minimal" },
        body: JSON.stringify({
          email: regForm.values.email, name: regForm.values.name,
          phone: regForm.values.phone||null, section_id: regForm.values.sectionId||null,
          rodo_accepted: rodo, terms_accepted: terms, message: regForm.values.message||null,
        }),
      });
      setSuccess("Wniosek wysłany! Potwierdź email, a następnie zaloguj się po akceptacji administratora.");
      setTab("login"); regForm.reset(); setRodo(false); setTerms(false);
    } catch(e) { setServerError(e.message); }
    finally { setLoading(false); }
  };

  const switchTab = (t) => {
    setTab(t); setServerError(""); setSuccess("");
    loginForm.reset(); regForm.reset();
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">🎼 ACK Alternator</div>
        <div className="auth-sub">Platforma grup artystycznych UG</div>
        <div className="auth-tabs">
          <button className={`auth-tab ${tab==="login"?"active":""}`}    onClick={() => switchTab("login")}>Zaloguj się</button>
          <button className={`auth-tab ${tab==="register"?"active":""}`} onClick={() => switchTab("register")}>Dołącz</button>
        </div>
        {serverError && <div className="auth-error">⚠️ {serverError}</div>}
        {success     && <div className="auth-success">✓ {success}</div>}

        {tab === "login" && <>
          <Field label="Email" icon="mail" type="email" placeholder="twoj@email.pl"
            value={loginForm.values.email} error={loginForm.touched.email && loginForm.errors.email}
            onChange={v=>loginForm.set("email",v)} onBlur={()=>loginForm.touch("email")} onEnter={handleLogin}/>
          <Field label="Hasło" icon="lock" type="password" placeholder="••••••••"
            value={loginForm.values.password} error={loginForm.touched.password && loginForm.errors.password}
            onChange={v=>loginForm.set("password",v)} onBlur={()=>loginForm.touch("password")} onEnter={handleLogin}/>
          <button className="btn btn-primary" style={{ width:"100%",justifyContent:"center",padding:"12px" }}
            disabled={loading} onClick={handleLogin}>
            {loading ? <Spinner/> : "Zaloguj się"}
          </button>
          <div className="auth-hint">Nie masz konta? Kliknij "Dołącz" i złóż wniosek.</div>
        </>}

        {tab === "register" && <>
          <div className="form-row">
            <Field label="Imię i nazwisko *" placeholder="Jan Kowalski"
              value={regForm.values.name} error={regForm.touched.name && regForm.errors.name}
              onChange={v=>regForm.set("name",v)} onBlur={()=>regForm.touch("name")}/>
            <Field label="Telefon" placeholder="+48 123 456 789"
              value={regForm.values.phone} onChange={v=>regForm.set("phone",v)}/>
          </div>
          <div className="form-row">
            <Field label="Email *" type="email" placeholder="twoj@email.pl"
              value={regForm.values.email} error={regForm.touched.email && regForm.errors.email}
              onChange={v=>regForm.set("email",v)} onBlur={()=>regForm.touch("email")}/>
            <Field label="Hasło * (min. 8 znaków)" type="password" placeholder="••••••••"
              value={regForm.values.password} error={regForm.touched.password && regForm.errors.password}
              onChange={v=>regForm.set("password",v)} onBlur={()=>regForm.touch("password")}/>
          </div>
          {sections.length>0 && (
            <div className="form-group">
              <label className="form-label">Instrument / głos</label>
              <select className="form-input" value={regForm.values.sectionId} onChange={e=>regForm.set("sectionId",e.target.value)}>
                <option value="">-- wybierz --</option>
                {sections.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Wiadomość do zarządu (opcjonalnie)</label>
            <textarea className="form-input" style={{ minHeight:60 }} placeholder="Krótko o sobie..."
              value={regForm.values.message} onChange={e=>regForm.set("message",e.target.value)}/>
          </div>
          <Check checked={terms} onChange={setTerms} label={<>Akceptuję <strong>Regulamin</strong> uczestnictwa w grupach ACK UG. *</>}/>
          <Check checked={rodo}  onChange={setRodo}  label={<>Wyrażam zgodę na przetwarzanie danych osobowych zgodnie z <strong>RODO</strong>. *</>}/>
          <button className="btn btn-primary" style={{ width:"100%",justifyContent:"center",padding:"12px",marginTop:8 }}
            disabled={loading||!rodo||!terms} onClick={handleRegister}>
            {loading ? <Spinner/> : "Wyślij wniosek o dołączenie"}
          </button>
          <div className="auth-hint">Po zatwierdzeniu przez administratora otrzymasz dostęp.</div>
        </>}
      </div>
    </div>
  );
}

function Field({ label, icon, type="text", placeholder, value, error, onChange, onBlur, onEnter }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{icon && <><Icon name={icon} size={12}/> </>}{label}</label>}
      <input className="form-input" type={type} placeholder={placeholder} value={value}
        style={error?{borderColor:"var(--no)"}:{}}
        onChange={e=>onChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={onEnter?(e=>e.key==="Enter"&&onEnter()):undefined}/>
      {error && <div style={{fontSize:11,color:"var(--no)",marginTop:4}}>{error}</div>}
    </div>
  );
}

function Check({ checked, onChange, label }) {
  return (
    <div className="checkbox-row" onClick={()=>onChange(!checked)} style={{cursor:"pointer"}}>
      <div className={`checkbox-box ${checked?"checked":""}`}>{checked&&<Icon name="check" size={12}/>}</div>
      <div className="checkbox-label">{label}</div>
    </div>
  );
}

function Spinner() {
  return <><div className="spinner" style={{width:16,height:16,borderWidth:2}}/> Ładowanie...</>;
}
