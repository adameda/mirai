import { useEffect, useState } from "react";
import Logo from "../components/Logo";
import GradText from "../components/GradText";
import { T, grad, gradSoft } from "../constants/theme";
import { useMobile } from "../hooks/useMobile";
import {
  SPECIALITES_GENERALE,
  FILIERES_TECHNO,
  CENTRES_INTERET,
  STYLES_TRAVAIL,
  DUREES,
  PRESSION_OPTIONS,
  getMatieres,
} from "../constants/onboardingSteps";

// ── Helpers ───────────────────────────────────────────────────────────────────

function toggleArr(arr, val) {
  return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
}

// ── Grille de choix ───────────────────────────────────────────────────────────

function ChoiceGrid({ options, selected, onToggle, multi, maxSelect, wide }) {
  const val = (opt) => typeof opt === "string" ? opt : (opt.id || opt.label);

  const handle = (opt) => {
    const v = val(opt);
    if (!multi) { onToggle([v]); return; }
    if (maxSelect && !selected.includes(v) && selected.length >= maxSelect) return;
    onToggle(toggleArr(selected, v));
  };

  return (
    <div style={{ display: "flex", flexWrap: wide ? "nowrap" : "wrap", flexDirection: wide ? "column" : "row", gap: 9 }}>
      {options.map((opt) => {
        const v     = val(opt);
        const label = typeof opt === "string" ? opt : opt.label;
        const sub   = typeof opt === "object" ? opt.sub : null;
        const on    = selected.includes(v);
        const dimmed = maxSelect && !on && selected.length >= maxSelect;
        return (
          <div
            key={v}
            onClick={() => handle(opt)}
            style={{
              display: "flex",
              flexDirection: wide ? "row" : "column",
              alignItems: wide ? "center" : "flex-start",
              gap: wide ? 12 : 6,
              padding: wide ? "13px 16px" : "14px 13px",
              borderRadius: 13,
              cursor: dimmed ? "not-allowed" : "pointer",
              border: `1.5px solid ${on ? T.orange : T.border}`,
              background: on ? gradSoft : T.white,
              transform: on ? "translateY(-1px)" : "none",
              transition: "all 0.18s",
              flex: wide ? "1" : "1 1 calc(30% - 8px)",
              minWidth: wide ? "auto" : 100,
              opacity: dimmed ? 0.4 : 1,
            }}
          >
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.text, lineHeight: 1.4 }}>{label}</p>
              {sub && <p style={{ margin: "2px 0 0", fontSize: 11, color: T.muted }}>{sub}</p>}
            </div>
            {on && <span style={{ fontSize: 11, color: T.orange, flexShrink: 0 }}>✓</span>}
          </div>
        );
      })}
    </div>
  );
}

// ── Construction du flow d'étapes selon les réponses ─────────────────────────

function buildSteps(answers) {
  const niveau  = answers.niveau?.[0];
  const voie    = answers.voie?.[0];
  const filiere = answers.filiere?.[0];
  const steps   = [];

  // 1 — Niveau
  steps.push({
    id: "niveau", multi: false,
    title: "Tu es en quelle classe ?",
    options: ["Seconde", "Première", "Terminale"],
  });

  // 2 — Voie (Première ou Terminale uniquement)
  if (niveau === "Première" || niveau === "Terminale") {
    steps.push({
      id: "voie", multi: false, wide: true,
      title: "Tu es en quelle voie ?",
      options: [
        { id: "Générale",      label: "Voie Générale",      sub: "Spécialités au choix (Maths, NSI, SES...)" },
        { id: "Technologique", label: "Voie Technologique", sub: "STI2D, STMG, ST2S, STL, STD2A, STHR" },
      ],
    });
  }

  // 3a — Filière (voie techno)
  if ((niveau === "Première" || niveau === "Terminale") && voie === "Technologique") {
    steps.push({
      id: "filiere", multi: false, wide: true,
      title: "Tu es en quelle filière ?",
      options: FILIERES_TECHNO,
    });
  }

  // 3b — Spécialités (voie générale, Première = 3, Terminale = 2)
  if ((niveau === "Première" || niveau === "Terminale") && voie === "Générale") {
    const max = niveau === "Terminale" ? 2 : 3;
    steps.push({
      id: "specialites", multi: true, maxSelect: max,
      title: `Quelles sont tes ${max} spécialités ?`,
      hint: `Choisis exactement ${max}`,
      options: SPECIALITES_GENERALE,
    });
  }

  // 3c — Spécialités visées (Seconde)
  if (niveau === "Seconde") {
    steps.push({
      id: "specialites", multi: true,
      title: "Quelles spécialités tu envisages de prendre ?",
      hint: "Tes préférences pour l'instant — tu peux en choisir plusieurs",
      options: SPECIALITES_GENERALE,
    });
  }

  // 4 — Matières fortes
  const matieres = getMatieres(niveau, voie, filiere);
  steps.push({
    id: "matieres_fortes", multi: true,
    title: "T'as des matières où tu t'en sors vraiment bien ?",
    hint: "Choix multiple",
    options: matieres,
  });

  // 5 — Matières aimées
  steps.push({
    id: "matieres_aimees", multi: true,
    title: "Et des matières que t'aimes vraiment, même si c'est pas là où t'as les meilleures notes ?",
    hint: "Choix multiple",
    options: matieres,
  });

  // 6 — Centres d'intérêt
  steps.push({
    id: "centres_interet", multi: true, maxSelect: 4, wide: true,
    title: "Parmi ces phrases, lesquelles te ressemblent ?",
    hint: "Choisis jusqu'à 4",
    options: CENTRES_INTERET,
  });

  // 7 — Domaines (dynamique API)
  steps.push({
    id: "domaines_interets", multi: true,
    title: "Y'a des univers qui t'attirent ?",
    hint: "Choix multiple",
    dynamic: true,
  });

  // 8 — Durée d'études
  steps.push({
    id: "duree", multi: false, wide: true,
    title: "Tu te vois étudier encore combien de temps après le bac ?",
    options: DUREES,
  });

  // 9 — Rapport à la pression
  steps.push({
    id: "pression_academique", multi: false, wide: true,
    title: "À l'école en ce moment, tu te situes plutôt comment ?",
    options: PRESSION_OPTIONS,
  });

  // 10 — Environnement de travail
  steps.push({
    id: "style", multi: true, maxSelect: 2, wide: true,
    title: "Tu t'imagines dans quel type d'environnement de travail ?",
    hint: "Choisis jusqu'à 2",
    options: STYLES_TRAVAIL,
  });

  return steps;
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function Onboarding({ prenom, onComplete }) {
  const [answers,  setAnswers]  = useState({});
  const [step,     setStep]     = useState(0);
  const [vis,      setVis]      = useState(true);
  const [domaines, setDomaines] = useState([]);
  const isMobile = useMobile();

  useEffect(() => {
    fetch("/api/v1/domaines")
      .then(r => r.json())
      .then(data => setDomaines(data.map(d => ({ id: d.libelle, label: d.libelle, sub: null }))))
      .catch(() => {});
  }, []);

  const steps  = buildSteps(answers);
  const cur    = steps[step];
  const total  = steps.length;
  const options = cur?.dynamic ? domaines : (cur?.options || []);
  const sel     = answers[cur?.id] || [];
  const canNext = sel.length > 0;

  const handleToggle = (newSel) => {
    setAnswers(prev => ({ ...prev, [cur.id]: newSel }));
  };

  const go = (dir) => {
    setVis(false);
    setTimeout(() => {
      if (dir === 1 && step === total - 1) {
        onComplete(answers);
        return;
      }
      // En cas de retour, on repart sur l'étape précédente avec les réponses existantes
      const nextStep = step + dir;
      setStep(nextStep);
      setVis(true);
    }, 180);
  };

  if (!cur) return null;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'DM Sans',sans-serif", display: "flex", flexDirection: "column" }}>
      {/* Nav + barre de progression */}
      <nav style={{ padding: isMobile ? "14px 16px" : "18px 64px", display: "flex", justifyContent: "space-between", alignItems: "center", background: T.white, borderBottom: `1px solid ${T.border}` }}>
        <Logo size={22} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {steps.map((_, i) => (
            <div
              key={i}
              style={{
                height: 7, borderRadius: 99,
                transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)",
                width: i === step ? 26 : 7,
                background: i <= step ? grad : T.border,
              }}
            />
          ))}
          <span style={{ fontSize: 11, color: T.muted, marginLeft: 6 }}>
            {step + 1}/{total}
          </span>
        </div>
      </nav>

      {/* Corps */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? "24px 16px" : "40px 64px" }}>
        <div style={{
          width: "100%", maxWidth: 680,
          opacity: vis ? 1 : 0,
          transform: vis ? "translateY(0)" : "translateY(10px)",
          transition: "all 0.18s ease",
        }}>
          {/* Titre */}
          <div style={{ marginBottom: 26 }}>
            <p style={{ margin: "0 0 5px", fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Étape {step + 1} sur {total}
            </p>
            <h1 style={{ margin: 0, fontSize: 25, fontWeight: 800, color: T.text, letterSpacing: "-0.03em" }}>
              {step === 0
                ? <>{prenom ? `${prenom}, ` : ""}<GradText>par où on commence ?</GradText></>
                : cur.title
              }
            </h1>
            {step === 0 && (
              <p style={{ margin: "6px 0 0", fontSize: 14, color: T.muted }}>
                Quelques questions pour que MIRAI te propose les formations et métiers qui te correspondent vraiment.
              </p>
            )}
            {cur.hint && step > 0 && (
              <p style={{ margin: "4px 0 0", fontSize: 13, color: T.muted }}>{cur.hint}</p>
            )}
          </div>

          {/* Choix */}
          <div style={{ background: T.white, borderRadius: 22, padding: "26px 30px", border: `1px solid ${T.border}`, boxShadow: "0 4px 24px rgba(15,31,61,0.06)" }}>
            {options.length > 0 ? (
              <ChoiceGrid
                options={options}
                selected={sel}
                onToggle={handleToggle}
                multi={cur.multi}
                maxSelect={cur.maxSelect || null}
                wide={cur.wide || false}
              />
            ) : (
              <p style={{ margin: 0, fontSize: 13, color: T.muted, textAlign: "center" }}>Chargement…</p>
            )}
          </div>

          {/* Boutons de navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 22 }}>
            {step > 0 ? (
              <button
                onClick={() => go(-1)}
                style={{ padding: "12px 22px", borderRadius: 12, border: `1px solid ${T.border}`, background: T.white, color: T.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}
              >
                ← Retour
              </button>
            ) : <div />}

            <button
              onClick={() => canNext && go(1)}
              style={{
                padding: "13px 34px", borderRadius: 13, border: "none",
                background: canNext ? grad : T.border,
                color: canNext ? "white" : T.muted,
                fontSize: 14, fontWeight: 700,
                cursor: canNext ? "pointer" : "not-allowed",
                fontFamily: "'DM Sans',sans-serif",
                boxShadow: canNext ? "0 6px 20px rgba(249,162,59,0.32)" : "none",
                transition: "all 0.2s",
              }}
            >
              {step === total - 1 ? "Valider mon profil →" : "Continuer →"}
            </button>
          </div>

          {step === 0 && (
            <p style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: T.mutedLight }}>
              Données confidentielles · Modifiables à tout moment
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
