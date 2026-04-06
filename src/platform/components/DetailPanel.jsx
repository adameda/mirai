import Badge from "./Badge";
import { T, grad, gradSoft } from "../constants/theme";
import { FORMATION_DESCS, FORMATIONS_DATA } from "../data/formationsData";
import { METIERS_DATA } from "../data/metiersData";

export default function DetailPanel({ item, onClose, onSave, onRemove, savedItems, onAskMirai }) {
  if (!item) return null;
  const saved = savedItems.some((i) => i.type === item.type && i.label === item.label);

  let metaRow;
  let bodyContent;

  if (item.type === "formation") {
    const formData = FORMATIONS_DATA[item.domaine]?.find((f) => f.l === item.label);
    const metiers = METIERS_DATA[item.label] || [];
    const desc =
      FORMATION_DESCS[item.label] ||
      `Formation ${item.label} dans le domaine ${item.domaine}. Parcours alliant enseignements théoriques et mises en pratique professionnelles.`;
    const niveauColor = (formData?.n || "").includes("Tres") ? T.coral : (formData?.n || "").includes("Selectif") ? T.orange : T.success;
    const niveauBg = (formData?.n || "").includes("Tres") ? "#F4736A14" : (formData?.n || "").includes("Selectif") ? "#F9A23B14" : "#2EC99A14";

    metaRow = (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        {formData && <Badge label={formData.d} color={T.muted} bg={T.bg} />}
        {formData && <Badge label={formData.n} color={niveauColor} bg={niveauBg} />}
        {item.domaine && <Badge label={item.domaine} color={T.muted} bg={T.border} />}
      </div>
    );

    bodyContent = (
      <>
        <p style={{ margin: "0 0 20px", fontSize: 14, color: T.muted, lineHeight: 1.75 }}>{desc}</p>
        {metiers.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: T.text }}>Métiers accessibles</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {metiers.map((m) => (
                <span key={m} style={{ padding: "5px 12px", borderRadius: 99, background: gradSoft, border: "1px solid #F9A23B20", fontSize: 12, color: T.coral, fontWeight: 600 }}>
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}
      </>
    );
  } else {
    const formations = Object.keys(METIERS_DATA).filter((f) => METIERS_DATA[f].includes(item.label));
    metaRow = (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        <Badge label="28 000 – 38 000 € / an" color={T.success} bg="#2EC99A14" />
      </div>
    );

    bodyContent = (
      <>
        <p style={{ margin: "0 0 16px", fontSize: 14, color: T.muted, lineHeight: 1.75 }}>
          {`En tant que ${item.label.toLowerCase()}, tu interviendras sur des projets variés avec un fort impact métier. Poste accessible dès la fin de ta formation, avec une montée en compétences rapide et des responsabilités croissantes.`}
        </p>
        {formations.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: T.text }}>Formations associées</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {formations.map((f) => (
                <span key={f} style={{ padding: "5px 12px", borderRadius: 99, background: gradSoft, border: "1px solid #F9A23B20", fontSize: 12, color: T.coral, fontWeight: 600 }}>
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}
        <div style={{ padding: "14px 16px", borderRadius: 14, background: T.bg, border: `1px solid ${T.border}`, marginBottom: 4 }}>
          <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: T.text }}>Perspectives d'évolution</p>
          <p style={{ margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.65 }}>
            Évolution vers des rôles senior, lead technique ou management possible après 3 à 5 ans d'expérience. Possibilité d'entrepreneuriat ou de reconversion vers des postes de conseil.
          </p>
        </div>
      </>
    );
  }

  const parentForSave = item.domaine || item.formation || (item.type === "metier" ? Object.keys(METIERS_DATA).find((f) => METIERS_DATA[f].includes(item.label)) : null);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,31,61,0.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={onClose}>
      <div
        style={{
          background: T.white,
          borderRadius: 24,
          padding: "36px 40px",
          width: "100%",
          maxWidth: 520,
          position: "relative",
          boxShadow: "0 24px 80px rgba(15,31,61,0.25)",
          maxHeight: "85vh",
          overflowY: "auto",
          fontFamily: "'DM Sans',sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 18,
            right: 18,
            width: 32,
            height: 32,
            borderRadius: 10,
            border: `1px solid ${T.border}`,
            background: T.bg,
            cursor: "pointer",
            fontSize: 13,
            color: T.muted,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'DM Sans',sans-serif",
          }}
        >
          ✕
        </button>
        <div style={{ marginBottom: 16 }}>
          <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {item.type === "formation" ? "Formation" : "Métier"}
          </p>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: "-0.03em" }}>{item.label}</h2>
        </div>
        {metaRow}
        {bodyContent}
        <div style={{ paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
          {onAskMirai && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onAskMirai(item);
              }}
              style={{
                width: "100%",
                marginBottom: 10,
                padding: "12px 16px",
                borderRadius: 13,
                border: "1.5px solid #F9A23B55",
                background: gradSoft,
                color: T.orange,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              En savoir plus — demander à MIRAI
            </button>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, padding: "12px", borderRadius: 13, border: `1.5px solid ${T.border}`, background: T.bg, color: T.muted, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={() => (saved ? onRemove(item.type, item.label) : onSave(item.type, item.label, parentForSave))}
              style={{
                flex: 2,
                padding: "12px",
                borderRadius: 13,
                border: "none",
                background: saved ? T.border : grad,
                color: saved ? T.muted : "white",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'DM Sans',sans-serif",
                boxShadow: saved ? "none" : "0 6px 20px rgba(249,162,59,0.3)",
                transition: "all 0.2s",
              }}
            >
              {saved ? "✓ Sauvegardé" : "Sauvegarder en favori"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
