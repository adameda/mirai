import { useState } from "react";
import { T, grad } from "../constants/theme";

const GUIDE_KEY = "mirai_guide_seen";

const SLIDES = [
  {
    sym: "◍",
    title: "Bienvenue sur MIRAI",
    bullets: [
      { emoji: "🎯", text: "MIRAI est ta plateforme d'orientation post-bac. Elle t'accompagne pour explorer les formations, les métiers et construire ta liste de voeux." },
      { emoji: "🗺️", text: "5 sections dans le menu : Tableau de bord, Exploration, Parcoursup, Chat MIRAI et Favoris. Ce guide t'explique chacune." },
      { emoji: "💡", text: "Tout est connecté : ce que tu explores et sauvegardes alimente l'agent IA et ton tableau de bord de progression." },
    ],
  },
  {
    sym: "⊞",
    title: "Tableau de bord & objectifs",
    bullets: [
      { emoji: "📍", text: "Le tableau de bord affiche tes objectifs d'orientation définis par ton professeur : sauvegarder des domaines, des formations, puis des métiers en favoris." },
      { emoji: "📅", text: "Chaque objectif a un seuil minimum et une date limite. Ton avancement est calculé en temps réel à partir de tes favoris." },
      { emoji: "⏱️", text: "Si une date limite est dépassée, l'objectif passe en statut « En retard » — tu peux quand même le valider après." },
    ],
  },
  {
    sym: "◉",
    title: "Explorer formations & métiers",
    bullets: [
      { emoji: "🗂️", text: "La page Exploration te permet de naviguer par domaine : Informatique, Santé, Arts, Droit, Commerce… Chaque domaine liste les formations post-bac (BTS, BUT, Prépa, Licence…) et les métiers associés." },
      { emoji: "⭐", text: "Sauvegarde ce qui t'intéresse en favori d'un seul clic — tes favoris comptent directement pour tes objectifs de progression." },
      { emoji: "💬", text: "Sur chaque fiche, clique sur « Demander à Mirai » pour ouvrir une discussion ciblée sur cette formation ou ce métier avec l'agent IA." },
    ],
  },
  {
    sym: "◎",
    title: "Parcoursup",
    bullets: [
      { emoji: "📋", text: "La page Parcoursup te donne accès à 14 252 formations de la session 2025 directement dans l'application." },
      { emoji: "🔎", text: "Filtre par filière, spécialité, région ou sélectivité. Chaque fiche affiche le taux d'accès, le profil des admis (mentions, type de bac, boursiers) et la capacité d'accueil." },
      { emoji: "🔗", text: "Un bouton « Voir sur Parcoursup » te renvoie vers la page officielle de chaque formation pour candidater ou obtenir plus d'informations." },
    ],
  },
  {
    sym: "◇",
    title: "Tes favoris",
    bullets: [
      { emoji: "📌", text: "La page Favoris centralise tout ce que tu as sauvegardé : domaines, formations et métiers. C'est ton espace de travail personnel." },
      { emoji: "📄", text: "Tu peux accéder à la fiche détaillée de chaque formation ou métier directement depuis tes favoris, sans repasser par Exploration." },
    ],
  },
  {
    sym: "◈",
    title: "Parler à MIRAI",
    bullets: [
      { emoji: "💬", text: "L'agent MIRAI répond à toutes tes questions sur les formations, les métiers, Parcoursup et ton orientation en général." },
      { emoji: "🎯", text: "Pour une discussion ciblée sur une formation ou un métier précis, clique sur « Demander à Mirai » depuis la page Exploration — MIRAI aura alors tout le contexte." },
      { emoji: "📚", text: "Des suggestions de questions s'affichent au démarrage de chaque conversation. Tu peux ouvrir plusieurs discussions en parallèle et les retrouver dans l'historique à gauche." },
    ],
  },
];

export default function GuideModal({ onClose }) {
  const [slide, setSlide] = useState(0);
  const cur   = SLIDES[slide];
  const total = SLIDES.length;
  const isLast = slide === total - 1;

  const close = () => {
    localStorage.setItem(GUIDE_KEY, "1");
    onClose();
  };

  return (
    <>
      <div
        onClick={close}
        style={{ position: "fixed", inset: 0, background: "rgba(10,20,50,0.55)", zIndex: 2000, backdropFilter: "blur(2px)" }}
      />

      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "min(600px, calc(100vw - 32px))",
        background: T.white, borderRadius: 24,
        boxShadow: "0 32px 80px rgba(10,20,50,0.22)",
        zIndex: 2001, overflow: "hidden",
        fontFamily: "'DM Sans',sans-serif",
      }}>
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg,${T.navy},${T.navyMid})`, padding: "28px 32px 24px", position: "relative" }}>
          <div style={{ position: "absolute", top: -30, right: 40, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle,#F9A23B18,transparent 65%)", pointerEvents: "none" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Guide de la plateforme · {slide + 1}/{total}
            </span>
            <button
              onClick={close}
              style={{ background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)", fontSize: 16, width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              ✕
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
              {cur.sym}
            </div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "white", letterSpacing: "-0.03em" }}>
              {cur.title}
            </h2>
          </div>

          {/* Progress bar */}
          <div style={{ display: "flex", gap: 5, marginTop: 20 }}>
            {SLIDES.map((_, i) => (
              <div
                key={i}
                onClick={() => setSlide(i)}
                style={{ height: 3, borderRadius: 99, flex: 1, background: i <= slide ? "#F9A23B" : "rgba(255,255,255,0.2)", cursor: "pointer", transition: "background 0.3s" }}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "28px 32px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 28 }}>
            {cur.bullets.map((b, i) => (
              <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>{b.emoji}</span>
                <p style={{ margin: 0, fontSize: 15, color: T.text, lineHeight: 1.65, fontWeight: 400 }}>
                  {b.text}
                </p>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {slide > 0 ? (
              <button
                onClick={() => setSlide(s => s - 1)}
                style={{ padding: "11px 20px", borderRadius: 12, border: `1px solid ${T.border}`, background: T.white, color: T.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}
              >
                ← Précédent
              </button>
            ) : <div />}

            {isLast ? (
              <button
                onClick={close}
                style={{ padding: "13px 28px", borderRadius: 13, border: "none", background: grad, color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", boxShadow: "0 6px 20px rgba(249,162,59,0.35)" }}
              >
                C'est parti →
              </button>
            ) : (
              <button
                onClick={() => setSlide(s => s + 1)}
                style={{ padding: "13px 28px", borderRadius: 13, border: "none", background: grad, color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", boxShadow: "0 6px 20px rgba(249,162,59,0.35)" }}
              >
                Suivant →
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export function shouldShowGuide() {
  return !localStorage.getItem(GUIDE_KEY);
}
