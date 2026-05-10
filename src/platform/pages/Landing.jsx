import Logo from "../components/Logo";
import GradText from "../components/GradText";
import { T, grad, gradSoft } from "../constants/theme";
import { useMobile } from "../hooks/useMobile";

export default function Landing({ onLogin, onSignup }) {
  const isMobile = useMobile();
  const px = isMobile ? 20 : 64;

  return (
    <div style={{ minHeight: "100vh", background: T.white, fontFamily: "'DM Sans',sans-serif" }}>
      <nav style={{ padding: `16px ${px}px`, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${T.border}` }}>
        <Logo size={24} />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onLogin} style={{ padding: "9px 18px", borderRadius: 12, border: `1.5px solid ${T.border}`, background: "transparent", fontSize: 13, fontWeight: 600, color: T.text, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
            Connexion
          </button>
          <button onClick={onSignup} style={{ padding: "9px 18px", borderRadius: 12, border: "none", background: grad, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", boxShadow: "0 4px 16px rgba(249,162,59,0.3)" }}>
            Commencer →
          </button>
        </div>
      </nav>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: `${isMobile ? 60 : 100}px ${px}px ${isMobile ? 48 : 80}px`, textAlign: "center", maxWidth: 760, margin: "0 auto" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 99, background: gradSoft, border: "1px solid #F9A23B28", marginBottom: 28 }}>
          <div style={{ width: 5, height: 5, borderRadius: 99, background: grad }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: T.orange, letterSpacing: "0.08em", textTransform: "uppercase" }}>Plateforme d'orientation scolaire</span>
        </div>
        <h1 style={{ margin: "0 0 18px", fontSize: isMobile ? 38 : 54, fontWeight: 800, color: T.navy, letterSpacing: "-0.04em", lineHeight: 1.1 }}>
          Trouve ta voie,
          <br />
          <GradText>pas à pas.</GradText>
        </h1>
        <p style={{ margin: "0 0 36px", fontSize: isMobile ? 15 : 17, color: T.muted, lineHeight: 1.75, maxWidth: 500 }}>
          MIRAI t'aide à explorer les filières, comprendre tes options post-bac et construire ton orientation — à ton rythme, selon ton profil.
        </p>
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 10, width: isMobile ? "100%" : "auto" }}>
          <button onClick={onSignup} style={{ padding: "14px 32px", borderRadius: 14, border: "none", background: grad, color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", boxShadow: "0 12px 32px rgba(249,162,59,0.38)" }}>
            Créer mon profil →
          </button>
          <button onClick={onLogin} style={{ padding: "14px 24px", borderRadius: 14, border: `1.5px solid ${T.border}`, background: "transparent", fontSize: 15, fontWeight: 600, color: T.text, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
            Me connecter
          </button>
        </div>
      </div>

      <div style={{ padding: `0 ${px}px ${isMobile ? 40 : 80}px`, display: "flex", flexDirection: isMobile ? "column" : "row", gap: 16, maxWidth: 900, margin: "0 auto" }}>
        {[
          { sym: "◎", title: "Personnalisé", desc: "Des suggestions basées sur ton profil, tes matières et tes ambitions." },
          { sym: "◉", title: "Exploration libre", desc: "Navigue dans les filières, diplômes et métiers à ton rythme." },
          { sym: "◈", title: "Coach IA", desc: "Un agent disponible à chaque étape pour répondre à tes questions." },
        ].map((p) => (
          <div key={p.title} style={{ flex: 1, padding: "22px 20px", borderRadius: 20, background: T.bg, border: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 20, color: T.orange, display: "block", marginBottom: 10, fontWeight: 300 }}>{p.sym}</span>
            <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: T.text }}>{p.title}</p>
            <p style={{ margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.65 }}>{p.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
