import { useState } from "react";
import Input from "../components/Input";
import Logo from "../components/Logo";
import GradText from "../components/GradText";
import { T, grad, gradSoft } from "../constants/theme";

export default function Auth({ mode, onComplete, onToggle }) {
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [role, setRole] = useState("eleve");
  const [classCode, setClassCode] = useState("");
  const isSignup = mode === "signup";
  const canSubmit = isSignup ? prenom && email && pwd && (role !== "eleve" || classCode) : email && pwd;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'DM Sans',sans-serif", display: "flex", flexDirection: "column" }}>
      <nav style={{ padding: "20px 64px", borderBottom: `1px solid ${T.border}`, background: T.white }}>
        <Logo size={22} />
      </nav>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div style={{ background: T.white, borderRadius: 24, padding: "40px 36px", border: `1px solid ${T.border}`, boxShadow: "0 8px 40px rgba(15,31,61,0.08)" }}>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
                <Logo size={28} />
              </div>
              <h1 style={{ margin: "0 0 6px", fontSize: 21, fontWeight: 800, color: T.text, letterSpacing: "-0.03em" }}>
                {isSignup ? (
                  <>
                    Rejoins <GradText>MIRAI</GradText>
                  </>
                ) : (
                  <>
                    Bon retour sur <GradText>MIRAI</GradText>
                  </>
                )}
              </h1>
              <p style={{ margin: 0, fontSize: 13, color: T.muted }}>{isSignup ? "Crée ton compte pour commencer" : "Connecte-toi à ton espace"}</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
              {isSignup && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: T.text, fontFamily: "'DM Sans',sans-serif" }}>Tu es</label>
                  <div style={{ display: "flex", gap: 10 }}>
                    {[{ id: "eleve", label: "Eleve", sym: "◎" }, { id: "prof", label: "Professeur", sym: "◐" }].map((r) => (
                      <div
                        key={r.id}
                        onClick={() => setRole(r.id)}
                        style={{
                          flex: 1,
                          padding: "12px 14px",
                          borderRadius: 12,
                          cursor: "pointer",
                          border: `2px solid ${role === r.id ? T.orange : T.border}`,
                          background: role === r.id ? gradSoft : T.bg,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          transition: "all 0.2s",
                        }}
                      >
                        <span style={{ fontSize: 14, color: role === r.id ? T.orange : T.muted }}>{r.sym}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: role === r.id ? T.text : T.muted, fontFamily: "'DM Sans',sans-serif" }}>{r.label}</span>
                        {role === r.id && <span style={{ marginLeft: "auto", fontSize: 11, color: T.orange }}>✓</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {isSignup && <Input label="Prénom" placeholder="Léa" value={prenom} onChange={(e) => setPrenom(e.target.value)} />}
              <Input label="Email" type="email" placeholder="lea@exemple.fr" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input label="Mot de passe" type="password" placeholder="••••••••" value={pwd} onChange={(e) => setPwd(e.target.value)} />
              {isSignup && role === "eleve" && <Input label="Code classe (obligatoire)" placeholder="ex : TERM-B2" value={classCode} onChange={(e) => setClassCode(e.target.value)} />}
            </div>

            <button
              onClick={() => canSubmit && onComplete({ prenom: prenom || "Utilisateur", role, classCode })}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: 14,
                border: "none",
                background: canSubmit ? grad : T.border,
                color: canSubmit ? "white" : T.muted,
                fontSize: 14,
                fontWeight: 700,
                cursor: canSubmit ? "pointer" : "not-allowed",
                fontFamily: "'DM Sans',sans-serif",
                boxShadow: canSubmit ? "0 8px 24px rgba(249,162,59,0.3)" : "none",
                transition: "all 0.2s",
                marginBottom: 18,
              }}
            >
              {isSignup ? "Créer mon compte →" : "Me connecter →"}
            </button>
            <p style={{ textAlign: "center", fontSize: 13, color: T.muted, margin: 0 }}>
              {isSignup ? "Déjà un compte ? " : "Pas encore de compte ? "}
              <span onClick={onToggle} style={{ color: T.orange, fontWeight: 700, cursor: "pointer" }}>
                {isSignup ? "Me connecter" : "Créer un compte"}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
