import { useMemo, useState } from "react";
import Badge from "../components/Badge";
import GradText from "../components/GradText";
import ProgressBar from "../components/ProgressBar";
import GuideModal, { shouldShowGuide } from "../components/GuideModal";
import { T, grad } from "../constants/theme";
import { computeObjectives } from "../utils/computeObjectives";
import { useAppState } from "../hooks/useAppState";
import { useMobile } from "../hooks/useMobile";

export default function DashboardEleve() {
  const { user, onboarded, savedItems, config, startOnboarding, setPage } = useAppState();
  const { objs, activeIdx } = useMemo(() => computeObjectives(onboarded, savedItems, config), [onboarded, savedItems, config]);
  const isMobile = useMobile();
  const [guideOpen, setGuideOpen] = useState(() => shouldShowGuide());
  const allDone = objs.every((obj) => obj.achieved);

  const domaineCount = savedItems.filter((i) => i.type === "domaine").length;
  const formationCount = savedItems.filter((i) => i.type === "formation").length;
  const metierCount = savedItems.filter((i) => i.type === "metier").length;

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "20px 16px" : "40px 48px", background: T.bg, fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`@keyframes guidePulse{0%,100%{box-shadow:0 0 0 0 rgba(249,162,59,0.55)}60%{box-shadow:0 0 0 7px rgba(249,162,59,0)}}`}</style>
      {guideOpen && <GuideModal onClose={() => setGuideOpen(false)} />}

      <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <p style={{ margin: "0 0 4px", fontSize: 13, color: T.muted, fontWeight: 500 }}>Tableau de bord</p>
          <h1 style={{ margin: 0, fontSize: isMobile ? 22 : 26, fontWeight: 800, color: T.text, letterSpacing: "-0.03em" }}>
            Bonjour, <GradText>{user.prenom}</GradText>
          </h1>
        </div>
        <button
          onClick={() => setGuideOpen(true)}
          title="Guide de la plateforme"
          style={{ flexShrink: 0, marginTop: 4, width: 34, height: 34, borderRadius: 10, border: `1.5px solid ${T.orange}`, background: T.white, color: T.orange, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif", transition: "border-color 0.15s, color 0.15s", animation: "guidePulse 2s ease-in-out infinite" }}
          onMouseEnter={e => { e.currentTarget.style.animation = "none"; e.currentTarget.style.background = T.orange; e.currentTarget.style.color = "white"; }}
          onMouseLeave={e => { e.currentTarget.style.animation = "guidePulse 2s ease-in-out infinite"; e.currentTarget.style.background = T.white; e.currentTarget.style.color = T.orange; }}
        >
          ?
        </button>
      </div>

      {allDone && (
        <div style={{ background: "#F4FBF8", border: `1px solid #2EC99A30`, borderRadius: 18, padding: "16px 18px", marginBottom: 22 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.success }}>Tous les objectifs sont validés.</p>
        </div>
      )}

      {!onboarded && (
        <div style={{ background: `linear-gradient(135deg,${T.navy},${T.navyMid})`, borderRadius: 22, padding: isMobile ? "20px 18px" : "28px 32px", marginBottom: 28, display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", gap: 16, boxShadow: "0 16px 48px rgba(15,31,61,0.18)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -40, right: 60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle,#F9A23B18,transparent 65%)", pointerEvents: "none" }} />
          <div>
            <p style={{ margin: "0 0 6px", fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Acces limite</p>
            <h2 style={{ margin: "0 0 8px", fontSize: isMobile ? 17 : 20, fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>Complete ton profil pour debloquer la plateforme</h2>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>L'exploration, les favoris et le chatbot seront accessibles une fois ton profil renseigné.</p>
          </div>
          <button onClick={startOnboarding} style={{ flexShrink: 0, padding: "13px 24px", borderRadius: 13, border: "none", background: grad, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", boxShadow: "0 6px 20px rgba(249,162,59,0.4)", whiteSpace: "nowrap" }}>
            Completer mon profil →
          </button>
        </div>
      )}

      <div style={{ background: T.white, borderRadius: 22, padding: isMobile ? "20px 16px" : "28px 32px", marginBottom: 20, border: `1px solid ${T.border}`, boxShadow: "0 2px 12px rgba(15,31,61,0.05)" }}>
        <p style={{ margin: "0 0 22px", fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>Parcours d'orientation</p>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: 14, top: 16, bottom: 16, width: 2, background: `linear-gradient(to bottom, ${T.success} 0%, ${T.orange} 50%, ${T.border} 100%)`, borderRadius: 99 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {objs.map((obj, i) => {
              const isDone = obj.achieved;
              const isCurrent = obj.current;
              const isLocked = obj.locked;
              const isOverdue = obj.status === "overdue";
              const isLateDone = obj.status === "done-late";
              const showExpanded = isCurrent || isOverdue;
              const nodeHot = isCurrent || isOverdue;
              const cardBg = isDone ? "#F4FBF8" : isOverdue ? "#FFF6EF" : showExpanded ? `linear-gradient(135deg,${T.navy},${T.navyMid})` : T.bg;
              const cardBorder = isDone ? "#2EC99A30" : isOverdue ? "#F9A23B35" : showExpanded ? T.navyMid : T.border;
              const titleColor = isOverdue ? T.orange : showExpanded ? "white" : isDone ? T.success : isLocked ? T.mutedLight : T.text;
              const statusLabel = isDone ? (isLateDone ? "Validé hors délai" : "Validé") : isOverdue ? "En retard" : isCurrent ? "En cours" : "Verrouillé";

              return (
                <div key={obj.id} style={{ display: "flex", gap: isMobile ? 14 : 22, paddingBottom: i < objs.length - 1 ? 20 : 0 }}>
                  <div style={{ flexShrink: 0, zIndex: 1, paddingTop: 3 }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: isDone ? T.success : nodeHot ? grad : "#ECEEF4", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: nodeHot ? "0 0 0 6px rgba(249,162,59,0.14)" : "none", transition: "all 0.3s" }}>
                      {isDone ? (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : isLocked ? (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T.mutedLight} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      ) : (
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "white" }} />
                      )}
                    </div>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ padding: showExpanded ? (isMobile ? "14px 14px" : "20px 24px") : "12px 14px", borderRadius: 16, background: cardBg, border: `1.5px solid ${cardBorder}`, opacity: isLocked && !isDone ? 0.58 : 1, transition: "all 0.3s" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: showExpanded ? 8 : 0, flexWrap: "wrap" }}>
                        <h3 style={{ margin: 0, fontSize: showExpanded ? (isMobile ? 14 : 16) : 13, fontWeight: 800, color: titleColor, letterSpacing: "-0.02em" }}>
                          {obj.title}
                        </h3>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <Badge label={statusLabel} color={isDone ? T.success : isOverdue ? T.orange : isCurrent ? T.gold : T.muted} bg={isDone ? "#2EC99A18" : isOverdue ? "#F9A23B18" : isCurrent ? "rgba(249,200,74,0.18)" : T.border} />
                          <Badge label={obj.progressLabel} color={isDone ? T.success : isOverdue ? T.orange : isCurrent ? T.gold : T.muted} bg={isDone ? "#2EC99A18" : isOverdue ? "#F9A23B18" : isCurrent ? "rgba(249,200,74,0.18)" : T.border} />
                        </div>
                      </div>

                      {showExpanded && (
                        <>
                          <p style={{ margin: "0 0 14px", fontSize: 13, color: isOverdue ? T.muted : "rgba(255,255,255,0.6)", lineHeight: 1.65 }}>{obj.desc}</p>
                          <ProgressBar value={obj.value} max={obj.target} light={!isOverdue} />
                          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                              <span style={{ fontSize: 11, color: isOverdue ? T.mutedLight : "rgba(255,255,255,0.35)" }}>
                                {obj.date ? `Date limite : ${obj.date}` : "Sans date limite"}
                              </span>
                              {!onboarded && obj.id === 1 && (
                                <button onClick={startOnboarding} style={{ padding: "9px 18px", borderRadius: 11, border: "none", background: grad, color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", boxShadow: "0 4px 14px rgba(249,162,59,0.4)" }}>
                                  Compléter mon profil →
                                </button>
                              )}
                              {onboarded && obj.id !== 1 && !obj.achieved && (
                                <button onClick={() => setPage("exploration")} style={{ padding: "9px 18px", borderRadius: 11, border: "none", background: grad, color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", boxShadow: "0 4px 14px rgba(249,162,59,0.4)" }}>
                                  Sauvegarder des favoris →
                                </button>
                              )}
                            </div>
                            {isOverdue && !obj.achieved && <p style={{ margin: 0, fontSize: 12, color: T.muted, lineHeight: 1.55 }}>La date limite est dépassée. L'objectif reste à faire.</p>}
                            {isDone && isLateDone && <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.55 }}>Objectif validé après la date limite.</p>}
                          </div>
                        </>
                      )}

                      {isDone && !showExpanded && <p style={{ margin: "3px 0 0", fontSize: 11, color: T.success, fontWeight: 600 }}>{isLateDone ? "Objectif validé hors délai" : "Objectif validé"}</p>}
                      {isLocked && !isDone && <p style={{ margin: "3px 0 0", fontSize: 11, color: T.muted, fontWeight: 600 }}>Débloqué après l'objectif précédent.</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {onboarded && (
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 12 }}>
          {[
            { label: "Domaines", sublabel: "en favoris", value: domaineCount, sym: "◉" },
            { label: "Formations", sublabel: "en favoris", value: formationCount, sym: "◇" },
            { label: "Métiers", sublabel: "en favoris", value: metierCount, sym: "◈" },
          ].map((r) => (
            <div
              key={r.label}
              onClick={() => setPage("favoris")}
              style={{ flex: 1, background: T.white, borderRadius: 18, padding: "18px 20px", border: `1px solid ${T.border}`, cursor: "pointer", boxShadow: "0 2px 8px rgba(15,31,61,0.04)", transition: "box-shadow 0.2s, transform 0.2s", display: "flex", flexDirection: isMobile ? "row" : "column", alignItems: isMobile ? "center" : "flex-start", gap: isMobile ? 14 : 0 }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(15,31,61,0.1)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(15,31,61,0.04)"; e.currentTarget.style.transform = "none"; }}
            >
              <span style={{ fontSize: 18, color: T.muted, display: "block", marginBottom: isMobile ? 0 : 8 }}>{r.sym}</span>
              <div>
                <p style={{ margin: "0 0 1px", fontSize: isMobile ? 22 : 28, fontWeight: 800, letterSpacing: "-0.04em", color: T.orange }}>{r.value}</p>
                <p style={{ margin: "0 0 1px", fontSize: 13, fontWeight: 700, color: T.text }}>{r.label}</p>
                <p style={{ margin: 0, fontSize: 11, color: T.muted }}>{r.sublabel}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
