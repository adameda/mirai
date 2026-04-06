import { useState, useEffect, useMemo } from "react";

// ── TOKENS ────────────────────────────────────────────────────────
const T = {
  coral:      "#F4736A",
  orange:     "#F9A23B",
  gold:       "#F9C84A",
  navy:       "#0F1F3D",
  navyMid:    "#1A2F5A",
  bg:         "#F7F8FA",
  white:      "#FFFFFF",
  border:     "#ECEEF4",
  muted:      "#8A9BB5",
  mutedLight: "#C8D0DE",
  text:       "#0F1F3D",
  success:    "#2EC99A",
};
const grad     = "linear-gradient(135deg, #F4736A 0%, #F9A23B 55%, #F9C84A 100%)";
const gradSoft = "linear-gradient(135deg, #F4736A10 0%, #F9C84A10 100%)";

const GradText = ({ children }) => (
  <span style={{ background: grad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
    {children}
  </span>
);

// ── LOGO ─────────────────────────────────────────────────────────
const Logo = ({ size = 24, dark = false }) => (
  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="lg" x1="50" y1="88" x2="50" y2="8" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F4736A"/>
          <stop offset="50%" stopColor="#F9A23B"/>
          <stop offset="100%" stopColor="#F9C84A"/>
        </linearGradient>
      </defs>
      {[[-90,0.92],[-56,0.72],[-124,0.72],[-28,0.52],[-152,0.52]].map(([a,l],i) => {
        const r = a*Math.PI/180;
        return <line key={i} x1={50} y1={76} x2={50+Math.cos(r)*38*l} y2={76+Math.sin(r)*38*l}
          stroke="url(#lg)" strokeWidth={i===0?5:3.5} strokeLinecap="round"/>;
      })}
      <path d="M50 14 L52.2 19.8 L58 19.8 L53.4 23.2 L55.6 29 L50 25.6 L44.4 29 L46.6 23.2 L42 19.8 L47.8 19.8 Z" fill="#F9C84A"/>
      <circle cx="50" cy="76" r="3.5" fill="url(#lg)"/>
    </svg>
    <span style={{ fontSize: size*0.9, fontWeight:800, letterSpacing:"-0.04em",
      fontFamily:"'DM Sans',sans-serif", color: dark ? T.white : T.navy }}>MIRAI</span>
  </div>
);

// ── PROGRESS BAR ─────────────────────────────────────────────────
const ProgressBar = ({ value, max, light = false, color = grad }) => {
  const [w, setW] = useState(0);
  const pct = max > 0 ? Math.min((value/max)*100, 100) : 0;
  useEffect(() => { const t = setTimeout(() => setW(pct), 300); return () => clearTimeout(t); }, [pct]);
  return (
    <div style={{ height:6, background: light ? "rgba(255,255,255,0.15)" : T.border, borderRadius:99, overflow:"hidden" }}>
      <div style={{ height:"100%", width:`${w}%`, borderRadius:99, background: color,
        transition:"width 1s cubic-bezier(0.4,0,0.2,1)", boxShadow: light ? "0 0 8px #F9A23B60" : "none" }}/>
    </div>
  );
};

// ── INPUT ────────────────────────────────────────────────────────
const Input = ({ label, type="text", placeholder, value, onChange }) => (
  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
    {label && <label style={{ fontSize:12, fontWeight:700, color:T.text, fontFamily:"'DM Sans',sans-serif" }}>{label}</label>}
    <input type={type} placeholder={placeholder} value={value} onChange={onChange} style={{
      padding:"12px 16px", borderRadius:12, border:`1.5px solid ${T.border}`,
      fontSize:14, fontFamily:"'DM Sans',sans-serif", color:T.text, outline:"none", background:T.bg
    }}
      onFocus={e => e.target.style.borderColor="#F9A23B"}
      onBlur={e => e.target.style.borderColor=T.border}
    />
  </div>
);

// ── BADGE ────────────────────────────────────────────────────────
const Badge = ({ label, color = T.orange, bg = "#F9A23B14" }) => (
  <span style={{ fontSize:11, fontWeight:700, color, background:bg,
    padding:"3px 10px", borderRadius:99, fontFamily:"'DM Sans',sans-serif", whiteSpace:"nowrap" }}>
    {label}
  </span>
);

// ── PILL ─────────────────────────────────────────────────────────
const Pill = ({ label, light = false }) => (
  <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"4px 12px", borderRadius:99,
    background: light ? "rgba(249,162,59,0.15)" : gradSoft,
    border:`1px solid ${light ? "rgba(249,162,59,0.3)" : "#F9A23B30"}` }}>
    <div style={{ width:5, height:5, borderRadius:99, background:grad }}/>
    <span style={{ fontSize:10, fontWeight:700, letterSpacing:"0.08em",
      color: light ? T.gold : T.coral, textTransform:"uppercase", fontFamily:"'DM Sans',sans-serif" }}>{label}</span>
  </div>
);

// ── CONFIG OBJECTIFS (défaut prof) ───────────────────────────────
const DEFAULT_CONFIG = {
  obj1: { start: "2025-04-01", date: "2025-04-30" },
  obj2: { target: 3, start: "2025-05-01", date: "2025-05-15" },
  obj3: { target: 5, start: "2025-05-16", date: "2025-05-30" },
};

// ── CALCUL OBJECTIFS ─────────────────────────────────────────────
const computeObjectives = (onboarded, savedItems, config) => {
  const today = new Date().toISOString().split("T")[0];
  const domaineCount = savedItems.filter(i => i.type === "domaine").length;
  const formationCount = savedItems.filter(i => i.type === "formation").length;

  const s1 = config.obj1.start ?? "1970-01-01";
  const s2 = config.obj2.start ?? "1970-01-01";
  const s3 = config.obj3.start ?? "1970-01-01";
  const d1 = config.obj1.date;
  const d2 = config.obj2.date;
  const d3 = config.obj3.date;

  const c1 = onboarded;
  const c2 = domaineCount >= config.obj2.target;
  const c3 = formationCount >= config.obj3.target;

  // Validé à l'écran seulement si période commencée, critères remplis ET date limite dépassée
  const obj1Done = c1 && today >= s1 && today >= d1;
  const obj2Done = c2 && today >= s2 && today >= d2;
  const obj3Done = c3 && today >= s3 && today >= d3;

  const objs = [
    { id:1, title:"Compléter mon profil", desc:"Renseigne tes informations pour personnaliser ton parcours et sauvegarder des favoris.", start: s1,
      value: onboarded ? 1 : 0, target:1, date: d1, done: obj1Done, criteriaMet: c1 },
    { id:2, title:"Sauvegarder des domaines", desc:`Enregistre ${config.obj2.target} domaines dans tes favoris depuis l'exploration.`, start: s2,
      value: Math.min(domaineCount, config.obj2.target), target: config.obj2.target, date: d2, done: obj2Done, criteriaMet: c2 },
    { id:3, title:"Sauvegarder des formations", desc:`Enregistre ${config.obj3.target} formations dans tes favoris.`, start: s3,
      value: Math.min(formationCount, config.obj3.target), target: config.obj3.target, date: d3, done: obj3Done, criteriaMet: c3 },
  ];

  // Étape « en cours » : premier objectif dont les critères ne sont pas encore remplis (parcours séquentiel cohérent)
  let activeIdx = objs.length - 1;
  for (let i = 0; i < objs.length; i++) {
    if (!objs[i].criteriaMet) {
      activeIdx = i;
      break;
    }
    activeIdx = i;
  }

  return { objs, activeIdx, today };
};

// ── SIDEBAR ELEVE ────────────────────────────────────────────────
const NAV_ELEVE = [
  { id:"dashboard",  sym:"⊞", label:"Tableau de bord" },
  { id:"exploration",sym:"◉", label:"Exploration" },
  { id:"favoris",    sym:"◇", label:"Favoris" },
  { id:"chatbot",    sym:"◈", label:"Chatbot" },
];

const SidebarEleve = ({ active, onNav, user, locked }) => (
  <aside style={{ width:220, flexShrink:0, background:T.navyMid,
    display:"flex", flexDirection:"column", padding:"28px 0", height:"100%" }}>
    <div style={{ padding:"0 24px 32px" }}><Logo size={22} dark/></div>
    <nav style={{ flex:1, display:"flex", flexDirection:"column", gap:2, padding:"0 12px" }}>
      {NAV_ELEVE.map(n => {
        const isActive = n.id === active;
        const isLocked = locked && n.id !== "dashboard";
        return (
          <div key={n.id} onClick={() => !isLocked && onNav(n.id)} style={{
            display:"flex", alignItems:"center", gap:12, padding:"11px 14px",
            borderRadius:14, cursor: isLocked ? "not-allowed" : "pointer",
            background: isActive ? "rgba(249,162,59,0.1)" : "transparent",
            borderLeft: isActive ? "3px solid #F9A23B" : "3px solid transparent",
            opacity: isLocked ? 0.4 : 1, transition:"all 0.2s"
          }}>
            <span style={{ fontSize:14, ...(isActive
              ? { background:grad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }
              : { color:"rgba(255,255,255,0.45)" }) }}>{n.sym}</span>
            <span style={{ fontSize:13, fontWeight: isActive?700:400,
              color: isActive?"white":"rgba(255,255,255,0.45)",
              fontFamily:"'DM Sans',sans-serif", flex:1 }}>{n.label}</span>
            {isLocked && <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>◌</span>}
          </div>
        );
      })}
    </nav>
    <div style={{ margin:"0 12px", padding:"14px", borderRadius:16,
      background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:34, height:34, borderRadius:10, background:grad, flexShrink:0,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:14, fontWeight:800, color:"white" }}>{user.prenom[0]}</div>
        <div style={{ minWidth:0 }}>
          <p style={{ margin:0, fontSize:13, fontWeight:700, color:"white",
            fontFamily:"'DM Sans',sans-serif", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
            {user.prenom}</p>
          <p style={{ margin:0, fontSize:11, color:"rgba(255,255,255,0.4)", fontFamily:"'DM Sans',sans-serif" }}>
            {user.classCode ? `Code : ${user.classCode}` : "Eleve"}
          </p>
        </div>
      </div>
    </div>
  </aside>
);

// ── SIDEBAR PROF ─────────────────────────────────────────────────
const NAV_PROF = [
  { id:"prof-dashboard", sym:"⊞", label:"Tableau de bord" },
  { id:"prof-classe",    sym:"◎", label:"Ma classe" },
  { id:"prof-jalons",    sym:"◐", label:"Objectifs" },
];

const SidebarProf = ({ active, onNav, user }) => (
  <aside style={{ width:220, flexShrink:0, background:T.navyMid,
    display:"flex", flexDirection:"column", padding:"28px 0", height:"100%" }}>
    <div style={{ padding:"0 24px 32px" }}><Logo size={22} dark/></div>
    <nav style={{ flex:1, display:"flex", flexDirection:"column", gap:2, padding:"0 12px" }}>
      {NAV_PROF.map(n => {
        const isActive = n.id === active;
        return (
          <div key={n.id} onClick={() => onNav(n.id)} style={{
            display:"flex", alignItems:"center", gap:12, padding:"11px 14px",
            borderRadius:14, cursor:"pointer",
            background: isActive ? "rgba(249,162,59,0.1)" : "transparent",
            borderLeft: isActive ? "3px solid #F9A23B" : "3px solid transparent",
            transition:"all 0.2s"
          }}>
            <span style={{ fontSize:14, ...(isActive
              ? { background:grad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }
              : { color:"rgba(255,255,255,0.45)" }) }}>{n.sym}</span>
            <span style={{ fontSize:13, fontWeight:isActive?700:400,
              color: isActive?"white":"rgba(255,255,255,0.45)",
              fontFamily:"'DM Sans',sans-serif" }}>{n.label}</span>
          </div>
        );
      })}
    </nav>
    <div style={{ margin:"0 12px", padding:"14px", borderRadius:16,
      background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:34, height:34, borderRadius:10, background:"rgba(255,255,255,0.15)", flexShrink:0,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:14, fontWeight:800, color:"white" }}>{user.prenom[0]}</div>
        <div>
          <p style={{ margin:0, fontSize:13, fontWeight:700, color:"white", fontFamily:"'DM Sans',sans-serif" }}>{user.prenom}</p>
          <p style={{ margin:0, fontSize:11, color:"rgba(255,255,255,0.4)", fontFamily:"'DM Sans',sans-serif" }}>Professeur</p>
        </div>
      </div>
    </div>
  </aside>
);

// ══════════════════════════════════════════════════════════════════
// LANDING
// ══════════════════════════════════════════════════════════════════
const Landing = ({ onLogin, onSignup }) => (
  <div style={{ minHeight:"100vh", background:T.white, fontFamily:"'DM Sans',sans-serif" }}>
    <nav style={{ padding:"20px 64px", display:"flex", justifyContent:"space-between", alignItems:"center",
      borderBottom:`1px solid ${T.border}` }}>
      <Logo size={24}/>
      <div style={{ display:"flex", gap:12 }}>
        <button onClick={onLogin} style={{ padding:"10px 24px", borderRadius:12,
          border:`1.5px solid ${T.border}`, background:"transparent",
          fontSize:13, fontWeight:600, color:T.text, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
          Connexion
        </button>
        <button onClick={onSignup} style={{ padding:"10px 24px", borderRadius:12, border:"none",
          background:grad, color:"white", fontSize:13, fontWeight:700, cursor:"pointer",
          fontFamily:"'DM Sans',sans-serif", boxShadow:"0 4px 16px rgba(249,162,59,0.3)" }}>
          Commencer →
        </button>
      </div>
    </nav>
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
      padding:"100px 64px 80px", textAlign:"center", maxWidth:760, margin:"0 auto" }}>
      <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"5px 14px",
        borderRadius:99, background:gradSoft, border:"1px solid #F9A23B28", marginBottom:32 }}>
        <div style={{ width:5, height:5, borderRadius:99, background:grad }}/>
        <span style={{ fontSize:11, fontWeight:700, color:T.orange, letterSpacing:"0.08em",
          textTransform:"uppercase" }}>Plateforme d'orientation scolaire</span>
      </div>
      <h1 style={{ margin:"0 0 20px", fontSize:54, fontWeight:800, color:T.navy,
        letterSpacing:"-0.04em", lineHeight:1.1 }}>
        Trouve ta voie,<br/><GradText>pas à pas.</GradText>
      </h1>
      <p style={{ margin:"0 0 40px", fontSize:17, color:T.muted, lineHeight:1.75, maxWidth:500 }}>
        MIRAI t'aide à explorer les filières, comprendre tes options post-bac et construire ton orientation — à ton rythme, selon ton profil.
      </p>
      <div style={{ display:"flex", gap:12 }}>
        <button onClick={onSignup} style={{ padding:"15px 38px", borderRadius:14, border:"none",
          background:grad, color:"white", fontSize:15, fontWeight:700, cursor:"pointer",
          fontFamily:"'DM Sans',sans-serif", boxShadow:"0 12px 32px rgba(249,162,59,0.38)" }}>
          Créer mon profil →
        </button>
        <button onClick={onLogin} style={{ padding:"15px 26px", borderRadius:14,
          border:`1.5px solid ${T.border}`, background:"transparent",
          fontSize:15, fontWeight:600, color:T.text, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
          Me connecter
        </button>
      </div>
    </div>
    <div style={{ padding:"0 64px 80px", display:"flex", gap:20, maxWidth:900, margin:"0 auto" }}>
      {[
        { sym:"◎", title:"Personnalisé",   desc:"Des suggestions basées sur ton profil, tes matières et tes ambitions." },
        { sym:"◉", title:"Exploration libre", desc:"Navigue dans les filières, diplômes et métiers à ton rythme." },
        { sym:"◈", title:"Coach IA",       desc:"Un agent disponible à chaque étape pour répondre à tes questions." },
      ].map(p => (
        <div key={p.title} style={{ flex:1, padding:"26px 22px", borderRadius:20, background:T.bg, border:`1px solid ${T.border}` }}>
          <span style={{ fontSize:20, color:T.orange, display:"block", marginBottom:12, fontWeight:300 }}>{p.sym}</span>
          <p style={{ margin:"0 0 8px", fontSize:14, fontWeight:700, color:T.text }}>{p.title}</p>
          <p style={{ margin:0, fontSize:13, color:T.muted, lineHeight:1.65 }}>{p.desc}</p>
        </div>
      ))}
    </div>
  </div>
);

// ══════════════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════════════
const Auth = ({ mode, onComplete, onToggle }) => {
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [role, setRole] = useState("eleve");
  const [classCode, setClassCode] = useState("");
  const isSignup = mode === "signup";
  const canSubmit = isSignup ? (prenom && email && pwd && (role !== "eleve" || classCode)) : (email && pwd);

  return (
    <div style={{ minHeight:"100vh", background:T.bg, fontFamily:"'DM Sans',sans-serif", display:"flex", flexDirection:"column" }}>
      <nav style={{ padding:"20px 64px", borderBottom:`1px solid ${T.border}`, background:T.white }}>
        <Logo size={22}/>
      </nav>
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"48px" }}>
        <div style={{ width:"100%", maxWidth:420 }}>
          <div style={{ background:T.white, borderRadius:24, padding:"40px 36px",
            border:`1px solid ${T.border}`, boxShadow:"0 8px 40px rgba(15,31,61,0.08)" }}>
            <div style={{ textAlign:"center", marginBottom:28 }}>
              <div style={{ display:"flex", justifyContent:"center", marginBottom:14 }}><Logo size={28}/></div>
              <h1 style={{ margin:"0 0 6px", fontSize:21, fontWeight:800, color:T.text, letterSpacing:"-0.03em" }}>
                {isSignup ? <>Rejoins <GradText>MIRAI</GradText></> : <>Bon retour sur <GradText>MIRAI</GradText></>}
              </h1>
              <p style={{ margin:0, fontSize:13, color:T.muted }}>
                {isSignup ? "Crée ton compte pour commencer" : "Connecte-toi à ton espace"}
              </p>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:14, marginBottom:20 }}>
              {isSignup && (
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  <label style={{ fontSize:12, fontWeight:700, color:T.text, fontFamily:"'DM Sans',sans-serif" }}>Tu es</label>
                  <div style={{ display:"flex", gap:10 }}>
                    {[{id:"eleve",label:"Eleve",sym:"◎"},{id:"prof",label:"Professeur",sym:"◐"}].map(r => (
                      <div key={r.id} onClick={() => setRole(r.id)} style={{
                        flex:1, padding:"12px 14px", borderRadius:12, cursor:"pointer",
                        border:`2px solid ${role===r.id ? T.orange : T.border}`,
                        background: role===r.id ? gradSoft : T.bg,
                        display:"flex", alignItems:"center", gap:8, transition:"all 0.2s"
                      }}>
                        <span style={{ fontSize:14, color: role===r.id ? T.orange : T.muted }}>{r.sym}</span>
                        <span style={{ fontSize:13, fontWeight:700, color: role===r.id ? T.text : T.muted,
                          fontFamily:"'DM Sans',sans-serif" }}>{r.label}</span>
                        {role===r.id && <span style={{ marginLeft:"auto", fontSize:11, color:T.orange }}>✓</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {isSignup && <Input label="Prénom" placeholder="Léa" value={prenom} onChange={e => setPrenom(e.target.value)}/>}
              <Input label="Email" type="email" placeholder="lea@exemple.fr" value={email} onChange={e => setEmail(e.target.value)}/>
              <Input label="Mot de passe" type="password" placeholder="••••••••" value={pwd} onChange={e => setPwd(e.target.value)}/>
              {isSignup && role === "eleve" && (
                <Input label="Code classe (obligatoire)" placeholder="ex : TERM-B2" value={classCode} onChange={e => setClassCode(e.target.value)}/>
              )}
            </div>

            <button onClick={() => canSubmit && onComplete({ prenom: prenom || "Utilisateur", role, classCode })} style={{
              width:"100%", padding:"14px", borderRadius:14, border:"none",
              background: canSubmit ? grad : T.border,
              color: canSubmit ? "white" : T.muted,
              fontSize:14, fontWeight:700, cursor: canSubmit ? "pointer" : "not-allowed",
              fontFamily:"'DM Sans',sans-serif",
              boxShadow: canSubmit ? "0 8px 24px rgba(249,162,59,0.3)" : "none",
              transition:"all 0.2s", marginBottom:18 }}>
              {isSignup ? "Créer mon compte →" : "Me connecter →"}
            </button>
            <p style={{ textAlign:"center", fontSize:13, color:T.muted, margin:0 }}>
              {isSignup ? "Déjà un compte ? " : "Pas encore de compte ? "}
              <span onClick={onToggle} style={{ color:T.orange, fontWeight:700, cursor:"pointer" }}>
                {isSignup ? "Me connecter" : "Créer un compte"}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
// ONBOARDING
// ══════════════════════════════════════════════════════════════════
const OB_STEPS = [
  { id:"niveau", title:"Tu es en quelle classe ?", multi:false,
    choices:[{sym:"◎",label:"Seconde"},{sym:"◎",label:"Première"},{sym:"◎",label:"Terminale"},{sym:"◎",label:"Post-bac"}] },
  { id:"matieres", title:"Quelles matières tu aimes ?", hint:"Choix multiple", multi:true,
    choices:[{sym:"▲",label:"Maths"},{sym:"▲",label:"Sciences"},{sym:"▲",label:"Informatique"},{sym:"▲",label:"Lettres"},{sym:"▲",label:"Langues"},{sym:"▲",label:"Arts"},{sym:"▲",label:"Eco & Gestion"},{sym:"▲",label:"Sport"},{sym:"▲",label:"Histoire-Geo"}] },
  { id:"style", title:"Comment tu travailles ?", hint:"Choix multiple", multi:true, wide:true,
    choices:[{sym:"→",label:"Plutot seul",sub:"Je me concentre mieux seul"},{sym:"→",label:"En equipe",sub:"J'aime collaborer"},{sym:"→",label:"Creatif",sub:"J'aime inventer, concevoir"},{sym:"→",label:"Analytique",sub:"J'aime structurer, comprendre"},{sym:"→",label:"Concret",sub:"J'aime faire, construire"},{sym:"→",label:"Conceptuel",sub:"J'aime les idees abstraites"}] },
  { id:"duree", title:"Duree d'etudes envisagee ?", multi:false, wide:true,
    choices:[{sym:"◆",label:"Courtes — Bac+2/3",sub:"BTS, BUT, Licence Pro"},{sym:"◆",label:"Moyennes — Bac+3/4",sub:"Licence, Bachelor"},{sym:"◆",label:"Longues — Bac+5 et +",sub:"Master, Grande ecole"},{sym:"◆",label:"Je ne sais pas encore",sub:"On verra selon les options"}] },
  { id:"domaines", title:"Tu as des domaines en tete ?", hint:"Choix multiple", multi:true, hasFree:true,
    choices:[{sym:"◉",label:"Informatique & Tech"},{sym:"◉",label:"Sante & Medecine"},{sym:"◉",label:"Droit & Justice"},{sym:"◉",label:"Finance & Commerce"},{sym:"◉",label:"Art & Design"},{sym:"◉",label:"Sciences"},{sym:"◉",label:"Communication"},{sym:"◉",label:"Pas encore d'idee",sub:"Le matching m'aidera"}] },
];

const Onboarding = ({ prenom, onComplete }) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [vis, setVis] = useState(true);
  const [freeInput, setFreeInput] = useState("");

  const cur = OB_STEPS[step];
  const sel = answers[cur.id] || [];
  const canNext = sel.length > 0;

  const toggle = (label) => {
    if (cur.multi) setAnswers(a => ({ ...a, [cur.id]: sel.includes(label) ? sel.filter(x=>x!==label) : [...sel,label] }));
    else setAnswers(a => ({ ...a, [cur.id]: [label] }));
  };
  const addFree = () => {
    if (!freeInput.trim()) return;
    setAnswers(a => ({ ...a, [cur.id]: [...(a[cur.id]||[]), freeInput.trim()] }));
    setFreeInput("");
  };
  const go = (dir) => {
    setVis(false);
    setTimeout(() => {
      if (dir === 1 && step === OB_STEPS.length-1) { onComplete(answers); return; }
      setStep(s => s+dir); setVis(true);
    }, 180);
  };

  return (
    <div style={{ minHeight:"100vh", background:T.bg, fontFamily:"'DM Sans',sans-serif", display:"flex", flexDirection:"column" }}>
      <nav style={{ padding:"18px 64px", display:"flex", justifyContent:"space-between", alignItems:"center",
        background:T.white, borderBottom:`1px solid ${T.border}` }}>
        <Logo size={22}/>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {OB_STEPS.map((_,i) => (
            <div key={i} style={{ height:7, borderRadius:99, transition:"all 0.4s cubic-bezier(0.4,0,0.2,1)",
              width: i===step?26:7, background: i<=step ? grad : T.border }}/>
          ))}
          <span style={{ fontSize:11, color:T.muted, marginLeft:6, fontFamily:"'DM Sans',sans-serif" }}>{step+1}/{OB_STEPS.length}</span>
        </div>
      </nav>
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 64px" }}>
        <div style={{ width:"100%", maxWidth:680,
          opacity:vis?1:0, transform:vis?"translateY(0)":"translateY(10px)",
          transition:"all 0.18s ease" }}>
          <div style={{ marginBottom:26 }}>
            <p style={{ margin:"0 0 5px", fontSize:11, fontWeight:700, color:T.muted,
              letterSpacing:"0.1em", textTransform:"uppercase" }}>Etape {step+1} sur {OB_STEPS.length}</p>
            <h1 style={{ margin:0, fontSize:25, fontWeight:800, color:T.text, letterSpacing:"-0.03em" }}>
              {step===0 ? <>{prenom}, <GradText>bienvenue sur MIRAI</GradText></> : cur.title}
            </h1>
            {step===0 && <p style={{ margin:"6px 0 0", fontSize:14, color:T.muted }}>Quelques questions pour personnaliser ton parcours.</p>}
            {cur.hint && step>0 && <p style={{ margin:"4px 0 0", fontSize:13, color:T.muted }}>{cur.hint}</p>}
          </div>

          <div style={{ background:T.white, borderRadius:22, padding:"26px 30px",
            border:`1px solid ${T.border}`, boxShadow:"0 4px 24px rgba(15,31,61,0.06)" }}>
            <div style={{ display:"flex", flexWrap:cur.wide?"nowrap":"wrap",
              flexDirection:cur.wide?"column":"row", gap:9 }}>
              {cur.choices.map(c => {
                const on = sel.includes(c.label);
                return (
                  <div key={c.label} onClick={() => toggle(c.label)} style={{
                    display:"flex", flexDirection:cur.wide?"row":"column",
                    alignItems:cur.wide?"center":"flex-start", gap:cur.wide?12:7,
                    padding:cur.wide?"13px 16px":"16px 13px", borderRadius:13, cursor:"pointer",
                    border:`1.5px solid ${on ? T.orange : T.border}`,
                    background: on ? gradSoft : T.white,
                    transform: on?"translateY(-1px)":"none",
                    transition:"all 0.18s",
                    flex:cur.wide?"1":"1 1 calc(30% - 8px)", minWidth:cur.wide?"auto":100 }}>
                    <span style={{ fontSize:13, color: on ? T.orange : T.muted, flexShrink:0 }}>{c.sym}</span>
                    <div style={{ flex:1 }}>
                      <p style={{ margin:0, fontSize:13, fontWeight:700, color:T.text }}>{c.label}</p>
                      {c.sub && <p style={{ margin:"1px 0 0", fontSize:11, color:T.muted }}>{c.sub}</p>}
                    </div>
                    {on && <span style={{ fontSize:11, color:T.orange, flexShrink:0 }}>✓</span>}
                  </div>
                );
              })}
            </div>
            {cur.hasFree && (
              <div style={{ marginTop:12, display:"flex", gap:9 }}>
                <input value={freeInput} onChange={e => setFreeInput(e.target.value)}
                  onKeyDown={e => e.key==="Enter" && addFree()}
                  placeholder="Ajouter un domaine..."
                  style={{ flex:1, padding:"11px 14px", borderRadius:11, border:`1px solid ${T.border}`,
                    fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", background:T.bg, color:T.text }}/>
                <button onClick={addFree} style={{ padding:"11px 16px", borderRadius:11, border:"none",
                  background:gradSoft, color:T.orange, fontSize:12, fontWeight:700,
                  cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>+ Ajouter</button>
              </div>
            )}
          </div>

          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:22 }}>
            {step>0
              ? <button onClick={() => go(-1)} style={{ padding:"12px 22px", borderRadius:12,
                  border:`1px solid ${T.border}`, background:T.white, color:T.muted,
                  fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>← Retour</button>
              : <div/>}
            <button onClick={() => canNext && go(1)} style={{
              padding:"13px 34px", borderRadius:13, border:"none",
              background: canNext ? grad : T.border,
              color: canNext ? "white" : T.muted,
              fontSize:14, fontWeight:700, cursor: canNext?"pointer":"not-allowed",
              fontFamily:"'DM Sans',sans-serif",
              boxShadow: canNext ? "0 6px 20px rgba(249,162,59,0.32)" : "none",
              transition:"all 0.2s" }}>
              {step===OB_STEPS.length-1 ? "Valider mon profil →" : "Continuer →"}
            </button>
          </div>
          {step===0 && <p style={{ textAlign:"center", marginTop:12, fontSize:11, color:T.mutedLight }}>
            Donnees confidentielles · Modifiables a tout moment</p>}
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
// ELEVE — DASHBOARD
// ══════════════════════════════════════════════════════════════════
const DashboardEleve = ({ user, onboarded, savedItems, config, onStartOnboarding, onNav }) => {
  const { objs, activeIdx, today } = useMemo(() =>
    computeObjectives(onboarded, savedItems, config), [onboarded, savedItems, config]);

  const domaineCount   = savedItems.filter(i=>i.type==="domaine").length;
  const formationCount = savedItems.filter(i=>i.type==="formation").length;
  const metierCount    = savedItems.filter(i=>i.type==="metier").length;

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"40px 48px", background:T.bg, fontFamily:"'DM Sans',sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom:32 }}>
        <p style={{ margin:"0 0 4px", fontSize:13, color:T.muted, fontWeight:500 }}>Tableau de bord</p>
        <h1 style={{ margin:0, fontSize:26, fontWeight:800, color:T.text, letterSpacing:"-0.03em" }}>
          Bonjour, <GradText>{user.prenom}</GradText>
        </h1>
      </div>

      {/* Locked banner */}
      {!onboarded && (
        <div style={{ background:`linear-gradient(135deg,${T.navy},${T.navyMid})`,
          borderRadius:22, padding:"28px 32px", marginBottom:28,
          display:"flex", alignItems:"center", justifyContent:"space-between",
          boxShadow:"0 16px 48px rgba(15,31,61,0.18)", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-40, right:60, width:200, height:200,
            borderRadius:"50%", background:"radial-gradient(circle,#F9A23B18,transparent 65%)", pointerEvents:"none" }}/>
          <div>
            <p style={{ margin:"0 0 6px", fontSize:12, color:"rgba(255,255,255,0.5)",
              fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase" }}>
              Acces limite
            </p>
            <h2 style={{ margin:"0 0 8px", fontSize:20, fontWeight:800, color:"white", letterSpacing:"-0.02em" }}>
              Complete ton profil pour debloquer la plateforme
            </h2>
            <p style={{ margin:0, fontSize:13, color:"rgba(255,255,255,0.5)", lineHeight:1.6 }}>
              L'exploration, les favoris et le chatbot seront accessibles une fois ton profil renseigné.
            </p>
          </div>
          <button onClick={onStartOnboarding} style={{ flexShrink:0, marginLeft:24,
            padding:"13px 28px", borderRadius:13, border:"none", background:grad,
            color:"white", fontSize:13, fontWeight:700, cursor:"pointer",
            fontFamily:"'DM Sans',sans-serif", boxShadow:"0 6px 20px rgba(249,162,59,0.4)",
            whiteSpace:"nowrap" }}>
            Completer mon profil →
          </button>
        </div>
      )}

      {/* Timeline parcours */}
      <div style={{ background:T.white, borderRadius:22, padding:"28px 32px", marginBottom:20,
        border:`1px solid ${T.border}`, boxShadow:"0 2px 12px rgba(15,31,61,0.05)" }}>
        <p style={{ margin:"0 0 26px", fontSize:11, fontWeight:700, color:T.muted,
          letterSpacing:"0.1em", textTransform:"uppercase" }}>Parcours d'orientation</p>
        <div style={{ position:"relative" }}>
          {/* Vertical connector line */}
          <div style={{ position:"absolute", left:14, top:16, bottom:16, width:2,
            background:`linear-gradient(to bottom, ${T.success} 0%, ${T.orange} 50%, ${T.border} 100%)`,
            borderRadius:99 }}/>
          <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
            {objs.map((obj, i) => {
              const isDone = obj.done;
              const isPendingStart = today < obj.start && !isDone;
              const isLocked = (i > activeIdx && !isDone) || isPendingStart;
              const isFocusStep = i === activeIdx && !isDone;
              const waitingValidation = obj.criteriaMet && !obj.done && i !== activeIdx;
              const showExpanded = isFocusStep;
              const nodeHot = isFocusStep && !isPendingStart;
              return (
                <div key={obj.id} style={{ display:"flex", gap:22, paddingBottom: i < objs.length-1 ? 24 : 0 }}>
                  {/* Node circle */}
                  <div style={{ flexShrink:0, zIndex:1, paddingTop:3 }}>
                    <div style={{
                      width:30, height:30, borderRadius:"50%",
                      background: isDone ? T.success : nodeHot ? grad : "#ECEEF4",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      boxShadow: nodeHot ? "0 0 0 6px rgba(249,162,59,0.14)" : "none",
                      transition:"all 0.3s"
                    }}>
                      {isDone ? (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : isLocked ? (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T.mutedLight} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      ) : (
                        <div style={{ width:8, height:8, borderRadius:"50%", background:"white" }}/>
                      )}
                    </div>
                  </div>
                  {/* Content card */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{
                      padding: showExpanded ? "20px 24px" : "12px 18px",
                      borderRadius:16,
                      background: showExpanded ? `linear-gradient(135deg,${T.navy},${T.navyMid})` : isDone ? "#F4FBF8" : waitingValidation ? "#FFFCF5" : T.bg,
                      border:`1.5px solid ${showExpanded ? T.navyMid : isDone ? "#2EC99A30" : waitingValidation ? "#F9A23B35" : T.border}`,
                      opacity: (i > activeIdx && !isDone) ? 0.55 : 1,
                      transition:"all 0.3s"
                    }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: showExpanded ? 8 : 0 }}>
                        <h3 style={{ margin:0, fontSize: showExpanded ? 16 : 13, fontWeight:800,
                          color: showExpanded ? "white" : isDone ? T.success : waitingValidation ? T.orange : (i > activeIdx && !isDone) ? T.mutedLight : T.text,
                          letterSpacing:"-0.02em" }}>
                          {obj.title}
                        </h3>
                        {isDone && <Badge label="✓ Validé" color={T.success} bg="#2EC99A18"/>}
                        {waitingValidation && <Badge label="En attente de clôture" color={T.orange} bg="#F9A23B18"/>}
                        {showExpanded && !isPendingStart && <Badge label={`${obj.value} / ${obj.target}`} color={T.gold} bg="rgba(249,200,74,0.18)"/>}
                        {isPendingStart && <span style={{ fontSize:10, color: showExpanded ? "rgba(255,255,255,0.45)" : T.mutedLight, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase" }}>À venir</span>}
                        {(i > activeIdx && !isDone && !isPendingStart) && <span style={{ fontSize:10, color:T.mutedLight, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase" }}>Verrouillé</span>}
                      </div>
                      {showExpanded && (
                        <>
                          <p style={{ margin:"0 0 16px", fontSize:13, color:"rgba(255,255,255,0.6)", lineHeight:1.65 }}>
                            {obj.desc}
                          </p>
                          <ProgressBar value={obj.value} max={obj.target} light/>
                          <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:12 }}>
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
                              <span style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>Du {obj.start} au {obj.date}</span>
                              {!onboarded && obj.id===1 && !isPendingStart && (
                                <button onClick={onStartOnboarding} style={{ padding:"9px 20px", borderRadius:11, border:"none",
                                  background:grad, color:"white", fontSize:12, fontWeight:700,
                                  cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
                                  boxShadow:"0 4px 14px rgba(249,162,59,0.4)" }}>
                                  Compléter mon profil →
                                </button>
                              )}
                              {onboarded && obj.id!==1 && !obj.done && !isPendingStart && (
                                <button onClick={() => onNav("exploration")} style={{ padding:"9px 20px", borderRadius:11, border:"none",
                                  background:grad, color:"white", fontSize:12, fontWeight:700,
                                  cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
                                  boxShadow:"0 4px 14px rgba(249,162,59,0.4)" }}>
                                  Sauvegarder des favoris →
                                </button>
                              )}
                            </div>
                            {isPendingStart && (
                              <p style={{ margin:0, fontSize:12, color:"rgba(255,255,255,0.45)", lineHeight:1.55 }}>
                                Cet objectif s'ouvre le {obj.start}. Tu peux déjà consulter l'exploration pour préparer tes favoris.
                              </p>
                            )}
                            {obj.criteriaMet && !obj.done && !isPendingStart && (
                              <p style={{ margin:0, fontSize:12, color:"rgba(255,255,255,0.5)", lineHeight:1.55 }}>
                                Critères remplis : la validation « Validé » apparaîtra après le {obj.date}.
                              </p>
                            )}
                          </div>
                        </>
                      )}
                      {waitingValidation && (
                        <>
                          <ProgressBar value={obj.value} max={obj.target} color={T.orange}/>
                          <p style={{ margin:"10px 0 0", fontSize:11, color:T.orange, fontWeight:600 }}>
                            Critères remplis — validation officielle après le {obj.date}
                          </p>
                        </>
                      )}
                      {isDone && !showExpanded && (
                        <p style={{ margin:"3px 0 0", fontSize:11, color:T.success, fontWeight:600 }}>Objectif validé</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Favoris recap */}
      {onboarded && (
        <div style={{ display:"flex", gap:14 }}>
          {[
            { label:"Domaines", sublabel:"en favoris", value:domaineCount, sym:"◉" },
            { label:"Formations", sublabel:"en favoris", value:formationCount, sym:"◇" },
            { label:"Métiers", sublabel:"en favoris", value:metierCount, sym:"◈" },
          ].map(r => (
            <div key={r.label} onClick={() => onNav("favoris")} style={{
              flex:1, background:T.white, borderRadius:18, padding:"20px 22px",
              border:`1px solid ${T.border}`, cursor:"pointer",
              boxShadow:"0 2px 8px rgba(15,31,61,0.04)",
              transition:"box-shadow 0.2s, transform 0.2s"
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow="0 8px 24px rgba(15,31,61,0.1)"; e.currentTarget.style.transform="translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow="0 2px 8px rgba(15,31,61,0.04)"; e.currentTarget.style.transform="none"; }}
            >
              <span style={{ fontSize:18, color:T.muted, display:"block", marginBottom:10 }}>{r.sym}</span>
              <p style={{ margin:"0 0 2px", fontSize:28, fontWeight:800, letterSpacing:"-0.04em" }}>
                <GradText>{r.value}</GradText>
              </p>
              <p style={{ margin:"0 0 1px", fontSize:13, fontWeight:700, color:T.text }}>{r.label}</p>
              <p style={{ margin:0, fontSize:11, color:T.muted }}>{r.sublabel}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── SAVE BUTTON (cœur) ───────────────────────────────────────────
const SaveBtn = ({ type, label, parent, savedItems, onSave, onRemove, small = false }) => {
  const saved = savedItems.some(i => i.type === type && i.label === label);
  return (
    <button
      onClick={e => { e.stopPropagation(); saved ? onRemove(type, label) : onSave(type, label, parent); }}
      style={{
        display:"flex", alignItems:"center", gap:5,
        padding: small ? "5px 9px" : "6px 11px",
        borderRadius:9,
        border:`1.5px solid ${saved ? T.orange : T.border}`,
        background: saved ? gradSoft : T.bg,
        cursor:"pointer", fontSize:11, fontWeight:700,
        color: saved ? T.orange : T.muted,
        fontFamily:"'DM Sans',sans-serif", flexShrink:0,
        transition:"all 0.18s", whiteSpace:"nowrap"
      }}
    >
      <svg width="11" height="11" viewBox="0 0 24 24"
        fill={saved ? "currentColor" : "none"} stroke="currentColor"
        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
      {saved ? "Sauvegardé" : "Sauvegarder"}
    </button>
  );
};

// ── DETAIL PANEL (modale) ─────────────────────────────────────────
const FORMATION_DESCS = {
  "BUT Informatique":    "Formation universitaire technologique de 3 ans alliant programmation, réseaux et gestion de projets. Forte insertion professionnelle avec alternance possible.",
  "Licence Informatique":"Diplôme académique de 3 ans centré sur les fondements : algorithmique, langages, systèmes. Passerelle naturelle vers un Master ou une école par la suite.",
  "BTS SIO":             "BTS de 2 ans orienté services informatiques aux organisations. Deux options : SLAM (développement) ou SISR (réseaux). Accessible et très professionnalisant.",
  "Ecole d'ingenieur":   "Parcours de 5 ans (post-bac ou post-prépa) formant des ingénieurs polyvalents. Haut niveau d'exigence, réseau alumni puissant, débouchés excellents.",
  "Classe prepa MPSI":   "Prépa scientifique de 2 ans préparant aux concours des grandes écoles. Rythme intense, culture générale élevée, excellence académique requise.",
  "BTS MCO":             "BTS de 2 ans en management commercial opérationnel. Formation terrain axée vente, gestion relation client et management d'équipe commerciale.",
  "Bachelor Commerce":   "Bachelor de 3 ans en école de commerce, accessible post-bac. Mélange cours théoriques, projets pratiques et stages en entreprise.",
  "Ecole de commerce":   "Grande école de commerce (5 ans post-bac ou 3 ans post-prépa). Formation en management, finance et stratégie. Très sélectif, réseau international.",
  "PASS (Medecine)":     "Parcours d'accès spécifique santé, première année sélective donnant accès aux études de médecine, pharmacie ou maïeutique selon les résultats.",
  "BTS SP3S":            "BTS de 2 ans dans les services à la personne : animation sociale, coordination, accompagnement. Formation humaine à fort impact social.",
  "IFSI Infirmier":      "Formation de 3 ans en Institut de Formation en Soins Infirmiers. Alterne enseignements cliniques et stages hospitaliers. Diplôme d'état reconnu.",
  "Licence Droit":       "Licence de 3 ans à l'université, base solide pour tout juriste. Droit civil, pénal, public, constitutionnel. Ouvre vers Master droit ou IEP.",
  "Master Droit":        "Master de 2 ans (bac+5) spécialisé selon les filières : affaires, pénal, public. Prérequis pour passer le barreau ou intégrer la magistrature.",
  "IEP Sciences Po":     "Institut d'Études Politiques, 5 ans très sélectifs. Formation pluridisciplinaire en sciences humaines, politique, économie et langues.",
  "BTS Design":          "BTS de 2 ans en design graphique ou produit. Atelier créatif, logiciels de création, projets clients. Sélection sur dossier et entretien.",
  "DNMADE":              "Diplôme national des métiers d'art et du design, 3 ans. Axé créativité appliquée : motion, espace, matière, graphisme selon la mention.",
  "Ecole d'art DNSEP":   "5 ans dans une école nationale d'art supérieure. Diplôme bac+5 reconnu par l'État. Parcours très créatif et autonome, exigeant artistiquement.",
  "Licence Sciences":    "Licence scientifique de 3 ans (physique, chimie, biologie…). Fondements solides, ouverture vers Master recherche ou grandes écoles scientifiques.",
  "CPGE BCPST":          "Prépa biologie, chimie, physique, sciences de la Terre. 2 ans pour préparer les concours des écoles d'agronomie, vétérinaire et normaliens.",
  "BTS Communication":   "BTS de 2 ans en communication. Stratégie de marque, création de contenus, événementiel, réseaux sociaux. Accès par dossier et entretien.",
  "Licence InfoCom":     "Licence en information et communication, 3 ans. Journalisme, relations presse, communication digitale. Formation généraliste et ouverte.",
};

const DetailPanel = ({ item, onClose, onSave, onRemove, savedItems, onAskMirai }) => {
  if (!item) return null;
  const saved = savedItems.some(i => i.type === item.type && i.label === item.label);

  let metaRow, bodyContent;
  if (item.type === "formation") {
    const formData = FORMATIONS_DATA[item.domaine]?.find(f => f.l === item.label);
    const metiers  = METIERS_DATA[item.label] || [];
    const desc     = FORMATION_DESCS[item.label] || `Formation ${item.label} dans le domaine ${item.domaine}. Parcours alliant enseignements théoriques et mises en pratique professionnelles.`;
    const niveauColor = (formData?.n||"").includes("Tres") ? T.coral : (formData?.n||"").includes("Selectif") ? T.orange : T.success;
    const niveauBg    = (formData?.n||"").includes("Tres") ? "#F4736A14" : (formData?.n||"").includes("Selectif") ? "#F9A23B14" : "#2EC99A14";
    metaRow = (
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:18 }}>
        {formData && <Badge label={formData.d} color={T.muted} bg={T.bg}/>}
        {formData && <Badge label={formData.n} color={niveauColor} bg={niveauBg}/>}
        {item.domaine && <Badge label={item.domaine} color={T.muted} bg={T.border}/>}
      </div>
    );
    bodyContent = (
      <>
        <p style={{ margin:"0 0 20px", fontSize:14, color:T.muted, lineHeight:1.75 }}>{desc}</p>
        {metiers.length > 0 && (
          <div style={{ marginBottom:20 }}>
            <p style={{ margin:"0 0 10px", fontSize:12, fontWeight:700, color:T.text }}>Métiers accessibles</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
              {metiers.map(m => (
                <span key={m} style={{ padding:"5px 12px", borderRadius:99, background:gradSoft,
                  border:"1px solid #F9A23B20", fontSize:12, color:T.coral, fontWeight:600 }}>{m}</span>
              ))}
            </div>
          </div>
        )}
      </>
    );
  } else {
    const formations = Object.keys(METIERS_DATA).filter(f => METIERS_DATA[f].includes(item.label));
    const parentFormation = item.formation || formations[0] || "";
    metaRow = (
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:18 }}>
        <Badge label="28 000 – 38 000 € / an" color={T.success} bg="#2EC99A14"/>
      </div>
    );
    bodyContent = (
      <>
        <p style={{ margin:"0 0 16px", fontSize:14, color:T.muted, lineHeight:1.75 }}>
          {`En tant que ${item.label.toLowerCase()}, tu interviendras sur des projets variés avec un fort impact métier. Poste accessible dès la fin de ta formation, avec une montée en compétences rapide et des responsabilités croissantes.`}
        </p>
        {formations.length > 0 && (
          <div style={{ marginBottom:16 }}>
            <p style={{ margin:"0 0 10px", fontSize:12, fontWeight:700, color:T.text }}>Formations associées</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
              {formations.map(f => (
                <span key={f} style={{ padding:"5px 12px", borderRadius:99, background:gradSoft,
                  border:"1px solid #F9A23B20", fontSize:12, color:T.coral, fontWeight:600 }}>{f}</span>
              ))}
            </div>
          </div>
        )}
        <div style={{ padding:"14px 16px", borderRadius:14, background:T.bg, border:`1px solid ${T.border}`, marginBottom:4 }}>
          <p style={{ margin:"0 0 4px", fontSize:12, fontWeight:700, color:T.text }}>Perspectives d'évolution</p>
          <p style={{ margin:0, fontSize:13, color:T.muted, lineHeight:1.65 }}>
            Évolution vers des rôles senior, lead technique ou management possible après 3 à 5 ans d'expérience. Possibilité d'entrepreneuriat ou de reconversion vers des postes de conseil.
          </p>
        </div>
      </>
    );
  }

  const parentForSave = item.domaine || item.formation ||
    (item.type === "metier" ? Object.keys(METIERS_DATA).find(f => METIERS_DATA[f].includes(item.label)) : null);

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,31,61,0.5)", zIndex:300,
      display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}
      onClick={onClose}>
      <div style={{ background:T.white, borderRadius:24, padding:"36px 40px", width:"100%", maxWidth:520,
        position:"relative", boxShadow:"0 24px 80px rgba(15,31,61,0.25)",
        maxHeight:"85vh", overflowY:"auto", fontFamily:"'DM Sans',sans-serif" }}
        onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position:"absolute", top:18, right:18, width:32, height:32,
          borderRadius:10, border:`1px solid ${T.border}`, background:T.bg,
          cursor:"pointer", fontSize:13, color:T.muted, display:"flex",
          alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif" }}>✕</button>
        <div style={{ marginBottom:16 }}>
          <p style={{ margin:"0 0 6px", fontSize:11, fontWeight:700, color:T.muted,
            letterSpacing:"0.1em", textTransform:"uppercase" }}>
            {item.type === "formation" ? "Formation" : "Métier"}
          </p>
          <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:T.text, letterSpacing:"-0.03em" }}>{item.label}</h2>
        </div>
        {metaRow}
        {bodyContent}
        <div style={{ paddingTop:16, borderTop:`1px solid ${T.border}` }}>
          {onAskMirai && (
            <button type="button" onClick={() => { onClose(); onAskMirai(item); }}
              style={{ width:"100%", marginBottom:10, padding:"12px 16px", borderRadius:13,
                border:`1.5px solid #F9A23B55`, background:gradSoft, color:T.orange,
                fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
              En savoir plus — demander à MIRAI
            </button>
          )}
          <div style={{ display:"flex", gap:10 }}>
            <button type="button" onClick={onClose} style={{ flex:1, padding:"12px", borderRadius:13,
              border:`1.5px solid ${T.border}`, background:T.bg, color:T.muted,
              fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
              Fermer
            </button>
            <button type="button" onClick={() => saved ? onRemove(item.type, item.label) : onSave(item.type, item.label, parentForSave)}
              style={{ flex:2, padding:"12px", borderRadius:13, border:"none",
                background: saved ? T.border : grad,
                color: saved ? T.muted : "white",
                fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
                boxShadow: saved ? "none" : "0 6px 20px rgba(249,162,59,0.3)", transition:"all 0.2s" }}>
              {saved ? "✓ Sauvegardé" : "Sauvegarder en favori"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
// ELEVE — EXPLORATION
// ══════════════════════════════════════════════════════════════════
const FORMATIONS_DATA = {
  "Informatique & Tech":  [{l:"BUT Informatique",d:"3 ans",n:"Accessible"},{l:"Licence Informatique",d:"3 ans",n:"Accessible"},{l:"BTS SIO",d:"2 ans",n:"Accessible"},{l:"Ecole d'ingenieur",d:"5 ans",n:"Selectif"},{l:"Classe prepa MPSI",d:"2+3 ans",n:"Tres selectif"}],
  "Finance & Commerce":   [{l:"BTS MCO",d:"2 ans",n:"Accessible"},{l:"Bachelor Commerce",d:"3 ans",n:"Accessible"},{l:"Ecole de commerce",d:"5 ans",n:"Selectif"}],
  "Sante & Medecine":     [{l:"PASS (Medecine)",d:"6 ans min",n:"Tres selectif"},{l:"BTS SP3S",d:"2 ans",n:"Accessible"},{l:"IFSI Infirmier",d:"3 ans",n:"Selectif"}],
  "Droit & Justice":      [{l:"Licence Droit",d:"3 ans",n:"Accessible"},{l:"Master Droit",d:"5 ans",n:"Selectif"},{l:"IEP Sciences Po",d:"5 ans",n:"Tres selectif"}],
  "Art & Design":         [{l:"BTS Design",d:"2 ans",n:"Accessible"},{l:"DNMADE",d:"3 ans",n:"Accessible"},{l:"Ecole d'art DNSEP",d:"5 ans",n:"Selectif"}],
  "Sciences":             [{l:"Licence Sciences",d:"3 ans",n:"Accessible"},{l:"CPGE BCPST",d:"2+3 ans",n:"Tres selectif"}],
  "Communication":        [{l:"BTS Communication",d:"2 ans",n:"Accessible"},{l:"Licence InfoCom",d:"3 ans",n:"Accessible"}],
};
const METIERS_DATA = {
  "BUT Informatique":    ["Developpeur web","Data analyst","Chef de projet IT"],
  "Licence Informatique":["Developpeur","Admin systeme","UX Designer"],
  "BTS SIO":             ["Technicien reseau","Support IT","Developpeur"],
  "Ecole d'ingenieur":   ["Ingenieur logiciel","Architecte SI","CTO"],
  "Classe prepa MPSI":   ["Ingenieur R&D","Chercheur","Consultant tech"],
  "BTS MCO":             ["Commercial","Charge de clientele","Manager"],
  "Bachelor Commerce":   ["Business developer","Marketing manager","Consultant"],
  "Ecole de commerce":   ["Directeur commercial","Banquier d'affaires","Entrepreneur"],
  "PASS (Medecine)":     ["Medecin generaliste","Specialiste","Chirurgien"],
  "BTS SP3S":            ["Animateur social","Coordinateur","Assistant social"],
  "IFSI Infirmier":      ["Infirmier","Cadre de sante","Infirmier specialise"],
  "Licence Droit":       ["Juriste","Paralegal","Charge de conformite"],
  "Master Droit":        ["Avocat","Notaire","Magistrat"],
  "IEP Sciences Po":     ["Haut fonctionnaire","Diplomate","Consultant"],
  "BTS Design":          ["Graphiste","Directeur artistique","Illustrateur"],
  "DNMADE":              ["Designer produit","Motion designer","UX Designer"],
  "Ecole d'art DNSEP":   ["Designer senior","Art director","Scenographe"],
  "Licence Sciences":    ["Chercheur","Enseignant","Charge d'etudes R&D"],
  "CPGE BCPST":          ["Veterinaire","Ingenieur agro","Chercheur biologie"],
  "BTS Communication":   ["Charge de comm","Community manager","Attache de presse"],
  "Licence InfoCom":     ["Journaliste","Relations presse","Chef de projet digital"],
};
const ALL_DOMAINES = Object.keys(FORMATIONS_DATA);

const Exploration = ({ answers, savedItems, onSave, onRemove, onNav }) => {
  const suggested = (answers?.domaines||[]).filter(d => d!=="Pas encore d'idee" && FORMATIONS_DATA[d]).slice(0,3);
  if (!suggested.length) suggested.push(...ALL_DOMAINES.slice(0,3));

  const [selDomaine,   setSelDomaine]   = useState(null);
  const [selFormation, setSelFormation] = useState(null);
  const [selMetier,    setSelMetier]    = useState(null);
  const [chatOpen,     setChatOpen]     = useState(true);
  const [chatMsg,      setChatMsg]      = useState("Bonjour ! Parcours les domaines, puis sauvegarde formations et métiers en favoris — je t'accompagne à chaque étape.");
  const [chatInput,    setChatInput]    = useState("");
  const [detailItem,   setDetailItem]   = useState(null);

  const clickDomaine = (d) => {
    setSelDomaine(d); setSelFormation(null); setSelMetier(null);
    setChatMsg(`Tu consultes **${d}**. Je peux t'aider à choisir des formations et des métiers à **sauvegarder en favoris**. Qu'est-ce qui t'intéresse ?`);
  };
  const clickFormation = (f) => {
    setSelFormation(f); setSelMetier(null);
    const info = FORMATIONS_DATA[selDomaine]?.find(x=>x.l===f);
    setChatMsg(`**${f}** — ${info?.d}, niveau ${info?.n}. Tu veux que je t'aide à comparer avec d'autres filières ou à décider si tu la **sauvegardes** ?`);
  };
  const clickMetier = (m) => {
    setSelMetier(m);
    setChatMsg(`**${m}** — perspectives solides (salaire indicatif début de carrière : 28 000 à 38 000 €). Tu veux en savoir plus avant de le **sauvegarder** ?`);
  };

  const extraDomaines = ALL_DOMAINES.filter(d => !suggested.includes(d));
  const allDomaines   = [...suggested, ...extraDomaines];

  const DetailBtn = ({ item }) => (
    <button
      onClick={e => { e.stopPropagation(); setDetailItem(item); }}
      style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 9px", borderRadius:9,
        border:`1.5px solid ${T.border}`, background:T.bg, cursor:"pointer",
        fontSize:11, fontWeight:700, color:T.muted,
        fontFamily:"'DM Sans',sans-serif", transition:"all 0.18s", whiteSpace:"nowrap" }}>
      Détails
    </button>
  );

  return (
    <div style={{ flex:1, display:"flex", overflow:"hidden", fontFamily:"'DM Sans',sans-serif" }}>
      {detailItem && (
        <DetailPanel item={detailItem} onClose={() => setDetailItem(null)}
          onSave={onSave} onRemove={onRemove} savedItems={savedItems}
          onAskMirai={onNav ? () => { onNav("chatbot"); } : undefined}/>
      )}

      {/* Main */}
      <div style={{ flex:1, overflowY:"auto", padding:"32px 32px 32px 48px", background:T.bg }}>
        <div style={{ marginBottom:22 }}>
          <h1 style={{ margin:"0 0 4px", fontSize:22, fontWeight:800, color:T.text, letterSpacing:"-0.03em" }}>Exploration</h1>
          <p style={{ margin:0, fontSize:13, color:T.muted }}>Choisis un domaine, puis des formations et des métiers — sauvegarde ceux qui t'intéressent en favoris.</p>
        </div>

        <div style={{ display:"flex", gap:16, alignItems:"flex-start" }}>

          {/* Panel domaines — full width si rien sélectionné, sidebar sinon */}
          <div style={{ width: selDomaine ? 190 : "100%", flexShrink:0, transition:"width 0.25s ease", maxWidth: selDomaine ? 190 : 700 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
              <p style={{ margin:0, fontSize:10, fontWeight:700, color:T.muted, letterSpacing:"0.1em", textTransform:"uppercase" }}>Domaines</p>
              {selDomaine && (
                <button onClick={() => { setSelDomaine(null); setSelFormation(null); setSelMetier(null); }}
                  style={{ background:"none", border:"none", cursor:"pointer", fontSize:11, color:T.muted, padding:0 }}>
                  ← Tout voir
                </button>
              )}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
              {allDomaines.map(d => {
                const isSugg  = suggested.includes(d);
                const isActive = selDomaine === d;
                return (
                  <div key={d} onClick={() => clickDomaine(d)} style={{
                    padding: selDomaine ? "9px 12px" : "13px 16px",
                    borderRadius:13, cursor:"pointer",
                    background: isActive ? T.navyMid : T.white,
                    border:`1px solid ${isActive ? T.navyMid : T.border}`,
                    transition:"all 0.2s" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 }}>
                      <div style={{ minWidth:0, flex:1 }}>
                        <p style={{ margin:"0 0 2px", fontSize:12, fontWeight:700,
                          color: isActive ? "white" : T.text, lineHeight:1.3,
                          whiteSpace: selDomaine ? "nowrap" : "normal",
                          overflow: selDomaine ? "hidden" : "visible",
                          textOverflow: selDomaine ? "ellipsis" : "clip" }}>{d}</p>
                        {!selDomaine && (
                          <span style={{ fontSize:10, padding:"2px 8px", borderRadius:99,
                            background: isSugg ? gradSoft : T.border,
                            color: isSugg ? T.orange : T.mutedLight, fontWeight:700 }}>
                            {isSugg ? "Suggéré" : `${(FORMATIONS_DATA[d]||[]).length} formations`}
                          </span>
                        )}
                      </div>
                      {!selDomaine && (
                        <div onClick={e => e.stopPropagation()}>
                          <SaveBtn type="domaine" label={d} parent={null}
                            savedItems={savedItems} onSave={onSave} onRemove={onRemove} small/>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {!selDomaine && (
                <div style={{ padding:"9px 13px", borderRadius:13, cursor:"pointer",
                  border:`1px dashed ${T.border}`, display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontSize:12, color:T.muted }}>+</span>
                  <span style={{ fontSize:12, color:T.muted }}>Ajouter</span>
                </div>
              )}
            </div>
          </div>

          {/* Panel formations */}
          {selDomaine && (
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ margin:"0 0 10px", fontSize:10, fontWeight:700, color:T.muted,
                letterSpacing:"0.1em", textTransform:"uppercase" }}>
                Formations · {selDomaine}
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {(FORMATIONS_DATA[selDomaine]||[]).map(f => {
                  const isActive = selFormation === f.l;
                  return (
                    <div key={f.l} onClick={() => clickFormation(f.l)} style={{
                      padding:"14px 17px", borderRadius:14, cursor:"pointer",
                      background: isActive ? T.navyMid : T.white,
                      border:`1px solid ${isActive ? T.navyMid : T.border}`,
                      transition:"all 0.2s" }}>
                      <p style={{ margin:"0 0 3px", fontSize:13, fontWeight:700,
                        color: isActive ? "white" : T.text }}>{f.l}</p>
                      <p style={{ margin:"0 0 10px", fontSize:11,
                        color: isActive ? "rgba(255,255,255,0.5)" : T.muted }}>
                        {f.d} · {f.n}
                      </p>
                      <div style={{ display:"flex", gap:7 }} onClick={e => e.stopPropagation()}>
                        <SaveBtn type="formation" label={f.l} parent={selDomaine}
                          savedItems={savedItems} onSave={onSave} onRemove={onRemove} small/>
                        <DetailBtn item={{ type:"formation", label:f.l, domaine:selDomaine }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Panel métiers */}
          {selFormation && (
            <div style={{ width:230, flexShrink:0 }}>
              <p style={{ margin:"0 0 10px", fontSize:10, fontWeight:700, color:T.muted,
                letterSpacing:"0.1em", textTransform:"uppercase" }}>
                Métiers accessibles
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {(METIERS_DATA[selFormation]||[]).map(m => {
                  const isActive = selMetier === m;
                  return (
                    <div key={m} onClick={() => clickMetier(m)} style={{
                      padding:"13px 15px", borderRadius:14, cursor:"pointer",
                      background: isActive ? gradSoft : T.white,
                      border:`1.5px solid ${isActive ? T.orange : T.border}`,
                      transition:"all 0.2s" }}>
                      <p style={{ margin:"0 0 9px", fontSize:12, fontWeight:700, color:T.text }}>{m}</p>
                      <div style={{ display:"flex", gap:7 }} onClick={e => e.stopPropagation()}>
                        <SaveBtn type="metier" label={m} parent={selFormation}
                          savedItems={savedItems} onSave={onSave} onRemove={onRemove} small/>
                        <DetailBtn item={{ type:"metier", label:m, formation:selFormation }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Agent */}
      {chatOpen && (
        <div style={{ width:268, flexShrink:0, background:T.white, borderLeft:`1px solid ${T.border}`,
          display:"flex", flexDirection:"column" }}>
          <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`,
            display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:28, height:28, borderRadius:9, background:grad,
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:"white" }}>◈</div>
              <div>
                <p style={{ margin:0, fontSize:12, fontWeight:700, color:T.text }}>Agent MIRAI</p>
                <p style={{ margin:0, fontSize:10, color:T.muted }}>
                  {selMetier ? "Metiers" : selFormation ? "Formations" : "Domaines"}
                </p>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} style={{ background:"none", border:"none",
              cursor:"pointer", fontSize:14, color:T.muted, padding:4 }}>✕</button>
          </div>
          <div style={{ flex:1, overflowY:"auto", padding:"14px 14px 8px" }}>
            <div style={{ background:T.bg, borderRadius:13, padding:"11px 13px",
              fontSize:12, color:T.text, lineHeight:1.65 }}>
              {chatMsg.split("**").map((p,i) =>
                i%2===1 ? <strong key={i}>{p}</strong> : <span key={i}>{p}</span>
              )}
            </div>
            <div style={{ marginTop:9, display:"flex", flexDirection:"column", gap:6 }}>
              {["Quels sont les debouches ?","C'est selectif ?","Salaire en sortie ?"].map(q => (
                <div key={q} onClick={() => setChatMsg(`Sur la question "${q.toLowerCase()}", voici ce que je sais selon ton profil...`)}
                  style={{ padding:"7px 11px", borderRadius:9, border:`1px solid ${T.border}`,
                    fontSize:11, color:T.muted, cursor:"pointer", background:T.bg }}>
                  {q}
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding:"11px 14px", borderTop:`1px solid ${T.border}`, display:"flex", gap:7 }}>
            <input value={chatInput} onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if(e.key==="Enter"&&chatInput){ setChatMsg(chatInput+" — Recherche en cours..."); setChatInput(""); }}}
              placeholder="Ta question..." style={{ flex:1, padding:"8px 11px", borderRadius:9,
                border:`1px solid ${T.border}`, fontSize:12, fontFamily:"'DM Sans',sans-serif",
                color:T.text, outline:"none", background:T.bg }}/>
            <button onClick={() => { if(chatInput){ setChatMsg(chatInput+" — Recherche en cours..."); setChatInput(""); }}}
              style={{ width:32, height:32, borderRadius:8, border:"none", background:grad,
                cursor:"pointer", color:"white", fontSize:12, flexShrink:0 }}>→</button>
          </div>
        </div>
      )}
      {!chatOpen && (
        <button onClick={() => setChatOpen(true)} style={{
          position:"fixed", bottom:28, right:28, width:48, height:48, borderRadius:"50%",
          border:"none", background:grad, color:"white", fontSize:18, cursor:"pointer",
          boxShadow:"0 6px 20px rgba(249,162,59,0.45)", zIndex:100 }}>◈</button>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
// ELEVE — FAVORIS
// ══════════════════════════════════════════════════════════════════
const Favoris = ({ savedItems, onRemove, onSave, onNav }) => {
  const [detailItem, setDetailItem] = useState(null);
  const domaines   = savedItems.filter(i => i.type === "domaine");
  const formations = savedItems.filter(i => i.type === "formation");
  const metiers    = savedItems.filter(i => i.type === "metier");

  const Section = ({ title, sym, items, type, canDetail = false }) => (
    <div style={{ marginBottom:28 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
        <span style={{ fontSize:14, color:T.orange }}>{sym}</span>
        <h2 style={{ margin:0, fontSize:16, fontWeight:800, color:T.text }}>{title}</h2>
        <Badge label={items.length} color={T.muted} bg={T.border}/>
      </div>
      {items.length === 0 ? (
        <div style={{ padding:"24px", borderRadius:16, border:`1.5px dashed ${T.border}`,
          textAlign:"center", color:T.mutedLight, fontSize:13 }}>
          Aucun {type} en favori pour l'instant.
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {items.map(item => (
            <div key={item.id} style={{ display:"flex", alignItems:"center", gap:14,
              padding:"14px 18px", background:T.white, borderRadius:14,
              border:`1px solid ${T.border}`, boxShadow:"0 1px 6px rgba(15,31,61,0.04)" }}>
              <span style={{ fontSize:14, color:T.orange, flexShrink:0 }}>◆</span>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ margin:0, fontSize:13, fontWeight:700, color:T.text,
                  whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{item.label}</p>
                {item.parent && <p style={{ margin:"2px 0 0", fontSize:11, color:T.muted }}>{item.parent}</p>}
              </div>
              {canDetail && (
                <button onClick={() => setDetailItem(item.type === "formation"
                  ? { type:"formation", label:item.label, domaine:item.parent }
                  : { type:"metier",    label:item.label, formation:item.parent })}
                  style={{ flexShrink:0, padding:"6px 12px", borderRadius:9,
                    border:`1.5px solid ${T.border}`, background:T.bg,
                    cursor:"pointer", fontSize:11, fontWeight:700, color:T.muted,
                    fontFamily:"'DM Sans',sans-serif", transition:"all 0.18s" }}>
                  Voir la fiche
                </button>
              )}
              <button onClick={() => onRemove(item.type, item.label)} style={{
                background:"none", border:"none", cursor:"pointer",
                fontSize:13, color:T.mutedLight, padding:"4px 6px",
                borderRadius:8, transition:"color 0.15s" }}
                onMouseEnter={e => e.target.style.color=T.coral}
                onMouseLeave={e => e.target.style.color=T.mutedLight}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"40px 48px", background:T.bg, fontFamily:"'DM Sans',sans-serif" }}>
      {detailItem && (
        <DetailPanel item={detailItem} onClose={() => setDetailItem(null)}
          onSave={onSave} onRemove={onRemove} savedItems={savedItems}
          onAskMirai={onNav ? () => { onNav("chatbot"); } : undefined}/>
      )}
      <div style={{ marginBottom:28 }}>
        <h1 style={{ margin:"0 0 4px", fontSize:26, fontWeight:800, color:T.text, letterSpacing:"-0.03em" }}>Mes favoris</h1>
        <p style={{ margin:0, fontSize:14, color:T.muted }}>Domaines, formations et métiers que tu as sauvegardés en favoris.</p>
      </div>
      <Section title="Domaines" sym="◉" items={domaines} type="domaine" canDetail={false}/>
      <Section title="Formations" sym="◇" items={formations} type="formation" canDetail={true}/>
      <Section title="Métiers" sym="◈" items={metiers} type="metier" canDetail={true}/>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
// ELEVE — CHATBOT
// ══════════════════════════════════════════════════════════════════
const Chatbot = () => {
  const [active, setActive] = useState(0);
  const [input, setInput] = useState("");
  const sessions = [
    { label:"Informatique & Tech", date:"Aujourd'hui",
      msgs:[
        {role:"agent",text:"On avait discute du BUT Informatique. Tu as eu le temps d'y reflechir ?"},
        {role:"user",text:"Oui, j'hesite encore avec la Licence. C'est quoi la vraie difference ?"},
        {role:"agent",text:"Le BUT est plus professionnalisant — tu sors en 3 ans avec des competences operationnelles. La Licence est plus academique et ouvre vers un Master. Si ton objectif c'est de travailler vite, BUT. Si tu vises un poste senior ou une ecole par la suite, Licence + Master."},
      ]},
    { label:"Finance & Commerce", date:"Il y a 3 jours",
      msgs:[
        {role:"agent",text:"Tu m'avais demande des infos sur les ecoles de commerce. Tu veux qu'on reprenne ?"},
        {role:"user",text:"Oui, c'est accessible avec un bac general ?"},
        {role:"agent",text:"Oui. Les Bachelors 3 ans sont accessibles sur dossier et entretien. Les grandes ecoles (HEC, ESSEC) necessitent une prepa de 2 ans apres le bac."},
      ]},
    { label:"General", date:"Il y a 1 semaine",
      msgs:[
        {role:"agent",text:"Comment puis-je t'aider dans ton orientation aujourd'hui ?"},
        {role:"user",text:"Je sais pas du tout quoi faire apres le bac."},
        {role:"agent",text:"C'est tout a fait normal. L'important c'est de ne pas se mettre de pression. Dis-moi quelles matieres ou activites te donnent de l'energie — on part de la."},
      ]},
  ];
  const [msgs, setMsgs] = useState(sessions[0].msgs);
  useEffect(() => setMsgs(sessions[active].msgs), [active]);
  const send = () => {
    if (!input.trim()) return;
    setMsgs(m => [...m, {role:"user",text:input}, {role:"agent",text:"Je cherche la meilleure reponse pour toi selon ton profil..."}]);
    setInput("");
  };

  return (
    <div style={{ flex:1, display:"flex", overflow:"hidden", fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ width:248, flexShrink:0, background:T.white, borderRight:`1px solid ${T.border}`,
        padding:"18px 13px", display:"flex", flexDirection:"column", gap:6 }}>
        <p style={{ margin:"0 0 11px", fontSize:10, fontWeight:700, color:T.muted, letterSpacing:"0.1em", textTransform:"uppercase" }}>Historique</p>
        {sessions.map((s,i) => (
          <div key={i} onClick={() => setActive(i)} style={{
            padding:"12px 13px", borderRadius:13, cursor:"pointer",
            background: active===i ? gradSoft : T.bg,
            border:`1px solid ${active===i ? "#F9A23B28" : T.border}`, transition:"all 0.15s" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
              <span style={{ fontSize:12, fontWeight:700, color:T.text }}>{s.label}</span>
            </div>
            <p style={{ margin:"0 0 4px", fontSize:11, color:T.muted, lineHeight:1.4,
              whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
              {s.msgs[s.msgs.length-1].text}
            </p>
            <span style={{ fontSize:10, color:T.mutedLight }}>{s.date}</span>
          </div>
        ))}
        <div style={{ marginTop:4, padding:"10px 13px", borderRadius:13, cursor:"pointer",
          border:`1px dashed ${T.border}`, display:"flex", alignItems:"center", gap:7 }}>
          <span style={{ fontSize:14, color:T.muted }}>+</span>
          <span style={{ fontSize:12, color:T.muted }}>Nouvelle conversation</span>
        </div>
      </div>
      <div style={{ flex:1, display:"flex", flexDirection:"column", background:T.bg, overflow:"hidden" }}>
        <div style={{ padding:"16px 26px", background:T.white, borderBottom:`1px solid ${T.border}`,
          display:"flex", alignItems:"center", gap:11 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:grad,
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, color:"white" }}>◈</div>
          <div>
            <p style={{ margin:0, fontSize:14, fontWeight:700, color:T.text }}>{sessions[active].label}</p>
            <p style={{ margin:0, fontSize:11, color:T.muted }}>Agent MIRAI · {sessions[active].date}</p>
          </div>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"22px 26px", display:"flex", flexDirection:"column", gap:12 }}>
          {msgs.map((m,i) => (
            <div key={i} style={{ display:"flex", justifyContent: m.role==="user"?"flex-end":"flex-start" }}>
              <div style={{ maxWidth:"68%", padding:"11px 15px",
                borderRadius: m.role==="user" ? "15px 15px 4px 15px" : "15px 15px 15px 4px",
                background: m.role==="user" ? grad : T.white,
                border: m.role==="agent" ? `1px solid ${T.border}` : "none",
                boxShadow:"0 2px 8px rgba(15,31,61,0.05)" }}>
                <p style={{ margin:0, fontSize:13, color:m.role==="user"?"white":T.text, lineHeight:1.6 }}>{m.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding:"14px 26px", background:T.white, borderTop:`1px solid ${T.border}`,
          display:"flex", gap:9 }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key==="Enter" && send()}
            placeholder="Pose ta question a l'agent MIRAI..." style={{
              flex:1, padding:"12px 16px", borderRadius:13, border:`1px solid ${T.border}`,
              fontSize:13, fontFamily:"'DM Sans',sans-serif", color:T.text, outline:"none", background:T.bg }}/>
          <button onClick={send} style={{ padding:"12px 22px", borderRadius:13, border:"none",
            background:grad, color:"white", fontSize:13, fontWeight:700, cursor:"pointer",
            fontFamily:"'DM Sans',sans-serif", boxShadow:"0 4px 14px rgba(249,162,59,0.28)" }}>
            Envoyer →
          </button>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
// PROF — DASHBOARD
// ══════════════════════════════════════════════════════════════════
/** Où en est l’élève — même enchaînement que `computeObjectives` (profil → domaines → formations). */
const parcoursMockEleve = (s, cfg) => {
  if (!s.onboarded) return { titre: "Compléter le profil", detail: "Profil à compléter" };
  if (s.domaines < cfg.obj2.target)
    return { titre: "Sauvegarder des domaines", detail: `${s.domaines} / ${cfg.obj2.target} en favoris` };
  if (s.formations < cfg.obj3.target)
    return { titre: "Sauvegarder des formations", detail: `${s.formations} / ${cfg.obj3.target} en favoris` };
  return { titre: "Parcours à jour", detail: "Objectifs remplis" };
};

const MOCK_STUDENTS = [
  { prenom:"Léa",     onboarded:true,  domaines:3, formations:4 },
  { prenom:"Thomas",  onboarded:true,  domaines:2, formations:1 },
  { prenom:"Camille", onboarded:false, domaines:0, formations:0 },
  { prenom:"Antoine", onboarded:true,  domaines:3, formations:5 },
  { prenom:"Sofia",   onboarded:true,  domaines:1, formations:0 },
  { prenom:"Maxime",  onboarded:false, domaines:0, formations:0 },
];

const ProfDashboard = ({ user, config, onNav }) => {
  const n = MOCK_STUDENTS.length;
  const nbProfilOk = MOCK_STUDENTS.filter(s => s.onboarded).length;
  const nbDomainesOk = MOCK_STUDENTS.filter(s => s.onboarded && s.domaines >= config.obj2.target).length;
  const nbFormOk = MOCK_STUDENTS.filter(s => s.onboarded && s.formations >= config.obj3.target).length;

  const jalonsRows = [
    {
      title: "Compléter le profil",
      periode: `${config.obj1.start ?? "—"} → ${config.obj1.date}`,
      prog: Math.round((nbProfilOk / n) * 100),
    },
    {
      title: `Sauvegarder ${config.obj2.target} domaines`,
      periode: `${config.obj2.start ?? "—"} → ${config.obj2.date}`,
      prog: Math.round((MOCK_STUDENTS.filter(s => s.domaines >= config.obj2.target).length / n) * 100),
    },
    {
      title: `Sauvegarder ${config.obj3.target} formations`,
      periode: `${config.obj3.start ?? "—"} → ${config.obj3.date}`,
      prog: Math.round((MOCK_STUDENTS.filter(s => s.formations >= config.obj3.target).length / n) * 100),
    },
  ];

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"40px 48px", background:T.bg, fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ marginBottom:28 }}>
        <p style={{ margin:"0 0 4px", fontSize:13, color:T.muted, fontWeight:500 }}>Tableau de bord</p>
        <h1 style={{ margin:0, fontSize:26, fontWeight:800, color:T.text, letterSpacing:"-0.03em" }}>
          Bonjour, <GradText>{user.prenom}</GradText>
        </h1>
      </div>

      <div style={{ background:`linear-gradient(135deg,${T.navy},${T.navyMid})`,
        borderRadius:22, padding:"24px 28px", marginBottom:22,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        boxShadow:"0 12px 40px rgba(15,31,61,0.14)" }}>
        <div>
          <p style={{ margin:"0 0 6px", fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.45)",
            letterSpacing:"0.1em", textTransform:"uppercase" }}>Code classe</p>
          <p style={{ margin:0, fontSize:26, fontWeight:800, color:"white", letterSpacing:"0.08em" }}>{user.classCode || "—"}</p>
        </div>
        <div style={{ textAlign:"right" }}>
          <p style={{ margin:"0 0 4px", fontSize:12, color:"rgba(255,255,255,0.45)" }}>Élèves (démo)</p>
          <p style={{ margin:0, fontSize:26, fontWeight:800, color:"white" }}>{n}</p>
        </div>
      </div>

      <div style={{ display:"flex", gap:14, marginBottom:22 }}>
        {[
          { label: "Profils complétés", value: nbProfilOk, total: n, sym: "◎" },
          { label: `Objectif domaines (${config.obj2.target} fav.)`, value: nbDomainesOk, total: n, sym: "◉" },
          { label: `Objectif formations (${config.obj3.target} fav.)`, value: nbFormOk, total: n, sym: "◇" },
        ].map((s) => (
          <div key={s.label} style={{ flex:1, background:T.white, borderRadius:18, padding:"18px 20px",
            border:`1px solid ${T.border}`, boxShadow:"0 2px 8px rgba(15,31,61,0.04)" }}>
            <span style={{ fontSize:15, color:T.muted, display:"block", marginBottom:6 }}>{s.sym}</span>
            <p style={{ margin:"0 0 4px", fontSize:24, fontWeight:800, letterSpacing:"-0.04em" }}>
              <GradText>{s.value}</GradText>
              <span style={{ fontSize:13, color:T.muted, fontWeight:500 }}> / {s.total}</span>
            </p>
            <p style={{ margin:0, fontSize:11, color:T.muted, lineHeight:1.35 }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={{ background:T.white, borderRadius:22, padding:"22px 26px",
        border:`1px solid ${T.border}`, boxShadow:"0 2px 12px rgba(15,31,61,0.05)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
          <div>
            <p style={{ margin:"0 0 4px", fontSize:11, fontWeight:700, color:T.muted, letterSpacing:"0.1em", textTransform:"uppercase" }}>
              Parcours élève
            </p>
            <h3 style={{ margin:0, fontSize:16, fontWeight:800, color:T.text }}>Mêmes objectifs que sur leur tableau de bord</h3>
          </div>
          <button type="button" onClick={() => onNav("prof-jalons")} style={{
            padding:"8px 14px", borderRadius:11, border:`1.5px solid ${T.border}`, background:T.bg,
            fontSize:12, fontWeight:700, color:T.orange, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
            Modifier les dates et seuils
          </button>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {jalonsRows.map((j) => (
            <div key={j.title} style={{ padding:"12px 14px", borderRadius:14, background:T.bg, border:`1px solid ${T.border}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, marginBottom:6, flexWrap:"wrap" }}>
                <span style={{ fontSize:13, fontWeight:700, color:T.text }}>{j.title}</span>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:10, color:T.muted, fontWeight:600 }}>{j.periode}</span>
                  <Badge label={`${j.prog}%`} color={j.prog >= 80 ? T.success : j.prog >= 40 ? T.orange : T.coral}
                    bg={j.prog >= 80 ? "#2EC99A14" : j.prog >= 40 ? "#F9A23B14" : "#F4736A14"}/>
                </div>
              </div>
              <ProgressBar value={j.prog} max={100}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
// PROF — MA CLASSE
// ══════════════════════════════════════════════════════════════════
const ProfClasse = ({ config }) => (
  <div style={{ flex:1, overflowY:"auto", padding:"40px 48px", background:T.bg, fontFamily:"'DM Sans',sans-serif" }}>
    <div style={{ marginBottom:24 }}>
      <p style={{ margin:"0 0 4px", fontSize:13, color:T.muted, fontWeight:500 }}>Suivi</p>
      <h1 style={{ margin:0, fontSize:26, fontWeight:800, color:T.text, letterSpacing:"-0.03em" }}>Ma classe</h1>
      <p style={{ margin:"8px 0 0", fontSize:14, color:T.muted, maxWidth:560, lineHeight:1.5 }}>
        Favoris enregistrés dans l’exploration — repères identiques aux objectifs du tableau de bord élève (seuils : {config.obj2.target} domaines, {config.obj3.target} formations).
      </p>
    </div>
    <div style={{ background:T.white, borderRadius:22, border:`1px solid ${T.border}`,
      overflow:"hidden", boxShadow:"0 2px 12px rgba(15,31,61,0.05)" }}>
      <div style={{ display:"grid", gridTemplateColumns:"minmax(120px,1.1fr) 0.85fr 0.65fr 0.65fr minmax(160px,1.4fr)", gap:12,
        padding:"14px 20px", background:T.bg, borderBottom:`1px solid ${T.border}` }}>
        {["Élève", "Profil", "Domaines", "Formations", "Étape du parcours"].map((h) => (
          <span key={h} style={{ fontSize:10, fontWeight:700, color:T.muted, letterSpacing:"0.08em", textTransform:"uppercase" }}>{h}</span>
        ))}
      </div>
      {MOCK_STUDENTS.map((s, i) => {
        const p = parcoursMockEleve(s, config);
        const okDomaines = s.domaines >= config.obj2.target;
        const okForm = s.formations >= config.obj3.target;
        return (
          <div key={i} style={{ display:"grid",
            gridTemplateColumns:"minmax(120px,1.1fr) 0.85fr 0.65fr 0.65fr minmax(160px,1.4fr)", gap:12,
            padding:"14px 20px", borderBottom: i < MOCK_STUDENTS.length - 1 ? `1px solid ${T.border}` : "none",
            alignItems:"center", background: i % 2 === 0 ? T.white : T.bg }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
              <div style={{ width:30, height:30, borderRadius:9, background:grad, flexShrink:0,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:12, fontWeight:800, color:"white" }}>{s.prenom[0]}</div>
              <span style={{ fontSize:13, fontWeight:700, color:T.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.prenom}</span>
            </div>
            <div>
              {s.onboarded
                ? <Badge label="Complété" color={T.success} bg="#2EC99A14"/>
                : <Badge label="À compléter" color={T.muted} bg={T.border}/>}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
              <span style={{ fontSize:13, fontWeight:700, color:T.text }}>{s.domaines}</span>
              <span style={{ fontSize:10, color: okDomaines ? T.success : T.muted }}>{okDomaines ? "Seuil atteint" : `cible ${config.obj2.target}`}</span>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
              <span style={{ fontSize:13, fontWeight:700, color:T.text }}>{s.formations}</span>
              <span style={{ fontSize:10, color: okForm ? T.success : T.muted }}>{okForm ? "Seuil atteint" : `cible ${config.obj3.target}`}</span>
            </div>
            <div style={{ minWidth:0 }}>
              <p style={{ margin:0, fontSize:12, fontWeight:700, color:T.text, lineHeight:1.35 }}>{p.titre}</p>
              <p style={{ margin:"4px 0 0", fontSize:11, color:T.muted, lineHeight:1.4 }}>{p.detail}</p>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

// ══════════════════════════════════════════════════════════════════
// PROF — OBJECTIFS (jalons)
// ══════════════════════════════════════════════════════════════════
const ProfJalons = ({ config, onUpdateConfig }) => {
  const [local, setLocal] = useState({ ...config });
  const upd = (key, field, val) => setLocal((c) => ({ ...c, [key]: { ...c[key], [field]: val } }));

  const Row = ({ num, title, children, withBorder }) => (
    <div style={{ padding:"20px 24px", borderTop: withBorder ? `1px solid ${T.border}` : "none" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
        <div style={{ width:30, height:30, borderRadius:9, background:grad,
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:"white", fontWeight:800 }}>{num}</div>
        <h3 style={{ margin:0, fontSize:15, fontWeight:800, color:T.text }}>{title}</h3>
      </div>
      {children}
    </div>
  );

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"40px 48px", background:T.bg, fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ marginBottom:22 }}>
        <p style={{ margin:"0 0 4px", fontSize:13, color:T.muted, fontWeight:500 }}>Réglages classe</p>
        <h1 style={{ margin:0, fontSize:26, fontWeight:800, color:T.text, letterSpacing:"-0.03em" }}>Objectifs & dates</h1>
        <p style={{ margin:"8px 0 0", fontSize:14, color:T.muted, maxWidth:540, lineHeight:1.55 }}>
          Alignés sur le parcours vu par les élèves : profil, puis favoris domaines, puis favoris formations.
        </p>
      </div>

      <div style={{ background:T.white, borderRadius:22, border:`1px solid ${T.border}`, boxShadow:"0 2px 12px rgba(15,31,61,0.05)", overflow:"hidden" }}>
        <Row num={1} title="Compléter le profil" withBorder={false}>
          <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
            <div style={{ flex:"1 1 200px" }}>
              <Input label="Ouverture" type="date" value={local.obj1.start ?? ""} onChange={(e) => upd("obj1", "start", e.target.value)}/>
            </div>
            <div style={{ flex:"1 1 200px" }}>
              <Input label="Date limite" type="date" value={local.obj1.date} onChange={(e) => upd("obj1", "date", e.target.value)}/>
            </div>
          </div>
        </Row>
        <Row num={2} title="Sauvegarder des domaines" withBorder>
          <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
            <div style={{ flex:"1 1 140px" }}>
              <Input label="Nombre minimum (favoris)" type="number"
                value={local.obj2.target} onChange={(e) => upd("obj2", "target", parseInt(e.target.value, 10) || 1)}/>
            </div>
            <div style={{ flex:"1 1 160px" }}>
              <Input label="Ouverture" type="date" value={local.obj2.start ?? ""} onChange={(e) => upd("obj2", "start", e.target.value)}/>
            </div>
            <div style={{ flex:"1 1 160px" }}>
              <Input label="Date limite" type="date" value={local.obj2.date} onChange={(e) => upd("obj2", "date", e.target.value)}/>
            </div>
          </div>
        </Row>
        <Row num={3} title="Sauvegarder des formations" withBorder>
          <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
            <div style={{ flex:"1 1 140px" }}>
              <Input label="Nombre minimum (favoris)" type="number"
                value={local.obj3.target} onChange={(e) => upd("obj3", "target", parseInt(e.target.value, 10) || 1)}/>
            </div>
            <div style={{ flex:"1 1 160px" }}>
              <Input label="Ouverture" type="date" value={local.obj3.start ?? ""} onChange={(e) => upd("obj3", "start", e.target.value)}/>
            </div>
            <div style={{ flex:"1 1 160px" }}>
              <Input label="Date limite" type="date" value={local.obj3.date} onChange={(e) => upd("obj3", "date", e.target.value)}/>
            </div>
          </div>
        </Row>
      </div>

      <button type="button" onClick={() => onUpdateConfig(local)} style={{
        marginTop:20, padding:"14px 28px", borderRadius:14, border:"none",
        background:grad, color:"white", fontSize:14, fontWeight:700,
        cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
        boxShadow:"0 6px 20px rgba(249,162,59,0.3)" }}>
        Enregistrer
      </button>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
// APP
// ══════════════════════════════════════════════════════════════════
export default function MiraiApp() {
  const [screen,    setScreen]    = useState("landing"); // landing|auth|onboarding|app
  const [authMode,  setAuthMode]  = useState("signup");
  const [user,      setUser]      = useState(null);
  const [answers,   setAnswers]   = useState({});
  const [onboarded, setOnboarded] = useState(false);
  const [page,      setPage]      = useState("dashboard");
  const [savedItems,setSavedItems]= useState([]);
  const [config,    setConfig]    = useState(DEFAULT_CONFIG);

  const handleSave = (type, label, parent) => {
    if (savedItems.some(i => i.type===type && i.label===label)) return;
    setSavedItems(s => [...s, { id: Date.now(), type, label, parent }]);
  };
  const handleRemove = (type, label) => {
    setSavedItems(s => s.filter(i => !(i.type===type && i.label===label)));
  };

  const locked = !onboarded;

  if (screen === "landing") return (
    <Landing
      onLogin={() => { setAuthMode("login"); setScreen("auth"); }}
      onSignup={() => { setAuthMode("signup"); setScreen("auth"); }}
    />
  );

  if (screen === "auth") return (
    <Auth
      mode={authMode}
      onComplete={({ prenom, role, classCode }) => {
        setUser({ prenom, role, classCode });
        if (role === "prof") { setPage("prof-dashboard"); setScreen("app"); }
        else { setPage("dashboard"); setScreen("app"); }
      }}
      onToggle={() => setAuthMode(m => m==="signup"?"login":"signup")}
    />
  );

  if (screen === "onboarding") return (
    <Onboarding
      prenom={user?.prenom || ""}
      onComplete={(ans) => { setAnswers(ans); setOnboarded(true); setScreen("app"); setPage("dashboard"); }}
    />
  );

  // APP
  const isProf = user?.role === "prof";

  const renderEleve = () => {
    if (locked && page !== "dashboard") return (
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center",
        background:T.bg, flexDirection:"column", gap:16 }}>
        <span style={{ fontSize:32, color:T.mutedLight }}>◌</span>
        <p style={{ margin:0, fontSize:15, fontWeight:700, color:T.text }}>Acces verrouille</p>
        <p style={{ margin:0, fontSize:13, color:T.muted }}>Complete ton profil pour debloquer la plateforme.</p>
        <button onClick={() => setPage("dashboard")} style={{ marginTop:4, padding:"11px 24px",
          borderRadius:12, border:"none", background:grad, color:"white",
          fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
          Aller au tableau de bord
        </button>
      </div>
    );
    switch (page) {
      case "dashboard":   return <DashboardEleve user={user} onboarded={onboarded} savedItems={savedItems}
                                   config={config} onStartOnboarding={() => setScreen("onboarding")} onNav={setPage}/>;
      case "exploration": return <Exploration answers={answers} savedItems={savedItems} onSave={handleSave} onRemove={handleRemove} onNav={setPage}/>;
      case "favoris":     return <Favoris savedItems={savedItems} onRemove={handleRemove} onSave={handleSave} onNav={setPage}/>;
      case "chatbot":     return <Chatbot/>;
      default:            return null;
    }
  };

  const renderProf = () => {
    switch (page) {
      case "prof-dashboard": return <ProfDashboard user={user} config={config} onNav={setPage}/>;
      case "prof-classe":    return <ProfClasse config={config}/>;
      case "prof-jalons":    return <ProfJalons config={config} onUpdateConfig={setConfig}/>;
      default:               return null;
    }
  };

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:T.navy }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      <div style={{ display:"flex", height:"100vh" }}>
        {isProf
          ? <SidebarProf active={page} onNav={setPage} user={user}/>
          : <SidebarEleve active={page} onNav={setPage} user={user} locked={locked}/>}
        {isProf ? renderProf() : renderEleve()}
      </div>
    </div>
  );
}
