import { useState } from "react";
import Logo from "../components/Logo";
import GradText from "../components/GradText";
import { OB_STEPS } from "../constants/onboardingSteps";
import { T, grad, gradSoft } from "../constants/theme";

export default function Onboarding({ prenom, onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [vis, setVis] = useState(true);
  const [freeInput, setFreeInput] = useState("");

  const cur = OB_STEPS[step];
  const sel = answers[cur.id] || [];
  const canNext = sel.length > 0;

  const toggle = (label) => {
    if (cur.multi) setAnswers((a) => ({ ...a, [cur.id]: sel.includes(label) ? sel.filter((x) => x !== label) : [...sel, label] }));
    else setAnswers((a) => ({ ...a, [cur.id]: [label] }));
  };

  const addFree = () => {
    if (!freeInput.trim()) return;
    setAnswers((a) => ({ ...a, [cur.id]: [...(a[cur.id] || []), freeInput.trim()] }));
    setFreeInput("");
  };

  const go = (dir) => {
    setVis(false);
    setTimeout(() => {
      if (dir === 1 && step === OB_STEPS.length - 1) {
        onComplete(answers);
        return;
      }
      setStep((s) => s + dir);
      setVis(true);
    }, 180);
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'DM Sans',sans-serif", display: "flex", flexDirection: "column" }}>
      <nav style={{ padding: "18px 64px", display: "flex", justifyContent: "space-between", alignItems: "center", background: T.white, borderBottom: `1px solid ${T.border}` }}>
        <Logo size={22} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {OB_STEPS.map((_, i) => (
            <div key={i} style={{ height: 7, borderRadius: 99, transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)", width: i === step ? 26 : 7, background: i <= step ? grad : T.border }} />
          ))}
          <span style={{ fontSize: 11, color: T.muted, marginLeft: 6, fontFamily: "'DM Sans',sans-serif" }}>
            {step + 1}/{OB_STEPS.length}
          </span>
        </div>
      </nav>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 64px" }}>
        <div style={{ width: "100%", maxWidth: 680, opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(10px)", transition: "all 0.18s ease" }}>
          <div style={{ marginBottom: 26 }}>
            <p style={{ margin: "0 0 5px", fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Etape {step + 1} sur {OB_STEPS.length}
            </p>
            <h1 style={{ margin: 0, fontSize: 25, fontWeight: 800, color: T.text, letterSpacing: "-0.03em" }}>
              {step === 0 ? (
                <>
                  {prenom}, <GradText>bienvenue sur MIRAI</GradText>
                </>
              ) : (
                cur.title
              )}
            </h1>
            {step === 0 && <p style={{ margin: "6px 0 0", fontSize: 14, color: T.muted }}>Quelques questions pour personnaliser ton parcours.</p>}
            {cur.hint && step > 0 && <p style={{ margin: "4px 0 0", fontSize: 13, color: T.muted }}>{cur.hint}</p>}
          </div>

          <div style={{ background: T.white, borderRadius: 22, padding: "26px 30px", border: `1px solid ${T.border}`, boxShadow: "0 4px 24px rgba(15,31,61,0.06)" }}>
            <div style={{ display: "flex", flexWrap: cur.wide ? "nowrap" : "wrap", flexDirection: cur.wide ? "column" : "row", gap: 9 }}>
              {cur.choices.map((c) => {
                const on = sel.includes(c.label);
                return (
                  <div
                    key={c.label}
                    onClick={() => toggle(c.label)}
                    style={{
                      display: "flex",
                      flexDirection: cur.wide ? "row" : "column",
                      alignItems: cur.wide ? "center" : "flex-start",
                      gap: cur.wide ? 12 : 7,
                      padding: cur.wide ? "13px 16px" : "16px 13px",
                      borderRadius: 13,
                      cursor: "pointer",
                      border: `1.5px solid ${on ? T.orange : T.border}`,
                      background: on ? gradSoft : T.white,
                      transform: on ? "translateY(-1px)" : "none",
                      transition: "all 0.18s",
                      flex: cur.wide ? "1" : "1 1 calc(30% - 8px)",
                      minWidth: cur.wide ? "auto" : 100,
                    }}
                  >
                    <span style={{ fontSize: 13, color: on ? T.orange : T.muted, flexShrink: 0 }}>{c.sym}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.text }}>{c.label}</p>
                      {c.sub && <p style={{ margin: "1px 0 0", fontSize: 11, color: T.muted }}>{c.sub}</p>}
                    </div>
                    {on && <span style={{ fontSize: 11, color: T.orange, flexShrink: 0 }}>✓</span>}
                  </div>
                );
              })}
            </div>
            {cur.hasFree && (
              <div style={{ marginTop: 12, display: "flex", gap: 9 }}>
                <input
                  value={freeInput}
                  onChange={(e) => setFreeInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addFree()}
                  placeholder="Ajouter un domaine..."
                  style={{ flex: 1, padding: "11px 14px", borderRadius: 11, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none", background: T.bg, color: T.text }}
                />
                <button onClick={addFree} style={{ padding: "11px 16px", borderRadius: 11, border: "none", background: gradSoft, color: T.orange, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                  + Ajouter
                </button>
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 22 }}>
            {step > 0 ? (
              <button onClick={() => go(-1)} style={{ padding: "12px 22px", borderRadius: 12, border: `1px solid ${T.border}`, background: T.white, color: T.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                ← Retour
              </button>
            ) : (
              <div />
            )}
            <button
              onClick={() => canNext && go(1)}
              style={{
                padding: "13px 34px",
                borderRadius: 13,
                border: "none",
                background: canNext ? grad : T.border,
                color: canNext ? "white" : T.muted,
                fontSize: 14,
                fontWeight: 700,
                cursor: canNext ? "pointer" : "not-allowed",
                fontFamily: "'DM Sans',sans-serif",
                boxShadow: canNext ? "0 6px 20px rgba(249,162,59,0.32)" : "none",
                transition: "all 0.2s",
              }}
            >
              {step === OB_STEPS.length - 1 ? "Valider mon profil →" : "Continuer →"}
            </button>
          </div>
          {step === 0 && <p style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: T.mutedLight }}>Donnees confidentielles · Modifiables a tout moment</p>}
        </div>
      </div>
    </div>
  );
}
