import Logo from "../components/Logo";
import GradText from "../components/GradText";
import { T, grad, gradSoft } from "../constants/theme";

export default function Landing({ onLogin, onSignup }) {
  return (
    <div style={{ minHeight: "100vh", background: T.white, fontFamily: "'DM Sans',sans-serif" }}>
      <nav style={{ padding: "20px 64px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${T.border}` }}>
        <Logo size={24} />
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onLogin} style={{ padding: "10px 24px", borderRadius: 12, border: `1.5px solid ${T.border}`, background: "transparent", fontSize: 13, fontWeight: 600, color: T.text, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
            Connexion
          </button>
          <button onClick={onSignup} style={{ padding: "10px 24px", borderRadius: 12, border: "none", background: grad, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", boxShadow: "0 4px 16px rgba(249,162,59,0.3)" }}>
            Commencer →
          </button>
        </div>
      </nav>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "100px 64px 80px", textAlign: "center", maxWidth: 760, margin: "0 auto" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 99, background: gradSoft, border: "1px solid #F9A23B28", marginBottom: 32 }}>
          <div style={{ width: 5, height: 5, borderRadius: 99, background: grad }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: T.orange, letterSpacing: "0.08em", textTransform: "uppercase" }}>Plateforme d'orientation scolaire</span>
        </div>
        <h1 style={{ margin: "0 0 20px", fontSize: 54, fontWeight: 800, color: T.navy, letterSpacing: "-0.04em", lineHeight: 1.1 }}>
          Trouve ta voie,
          <br />
          <GradText>pas à pas.</GradText>
        </h1>
        <p style={{ margin: "0 0 40px", fontSize: 17, color: T.muted, lineHeight: 1.75, maxWidth: 500 }}>
          MIRAI t'aide à explorer les filières, comprendre tes options post-bac et construire ton orientation — à ton rythme, selon ton profil.
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onSignup} style={{ padding: "15px 38px", borderRadius: 14, border: "none", background: grad, color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", boxShadow: "0 12px 32px rgba(249,162,59,0.38)" }}>
            Créer mon profil →
          </button>
          <button onClick={onLogin} style={{ padding: "15px 26px", borderRadius: 14, border: `1.5px solid ${T.border}`, background: "transparent", fontSize: 15, fontWeight: 600, color: T.text, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
            Me connecter
          </button>
        </div>
      </div>
      <div style={{ padding: "0 64px 80px", display: "flex", gap: 20, maxWidth: 900, margin: "0 auto" }}>
        {[
          { sym: "◎", title: "Personnalisé", desc: "Des suggestions basées sur ton profil, tes matières et tes ambitions." },
          { sym: "◉", title: "Exploration libre", desc: "Navigue dans les filières, diplômes et métiers à ton rythme." },
          { sym: "◈", title: "Coach IA", desc: "Un agent disponible à chaque étape pour répondre à tes questions." },
        ].map((p) => (
          <div key={p.title} style={{ flex: 1, padding: "26px 22px", borderRadius: 20, background: T.bg, border: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 20, color: T.orange, display: "block", marginBottom: 12, fontWeight: 300 }}>{p.sym}</span>
            <p style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 700, color: T.text }}>{p.title}</p>
            <p style={{ margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.65 }}>{p.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
