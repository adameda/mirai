import Badge from "./Badge";
import { T, grad, gradSoft } from "../constants/theme";
import { getFormationById, getFormationByLabel, getMetierById, getMetierByLabel, getMetiersForFormation, getFormationsForMetier } from "../services/explorationService";

export default function DetailPanel({ item, onClose, onSave, onRemove, savedItems, onAskMirai }) {
  if (!item) return null;
  const saved = savedItems.some((i) => i.type === item.type && (item.refId ? i.refId === item.refId : i.label === item.label));

  let metaRow;
  let bodyContent;
  let parentForSave = item.parent || null;
  let parentRefId = item.parentRefId || null;

  if (item.type === "formation") {
    const formation = item.refId ? getFormationById(item.refId) : getFormationByLabel(item.label);
    const metiers = formation ? getMetiersForFormation(formation.id) : [];
    const formationLabel = formation?.label || item.label;
    const description = formation?.descriptionCourte || `Formation ${formationLabel} dans le domaine ${formation?.domaine || item.domaine || ""}.`;

    metaRow = (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        {formation?.typeFormation?.sigle && <Badge label={formation.typeFormation.sigle} color={T.muted} bg={T.bg} />}
        {formation?.duree && <Badge label={formation.duree} color={T.orange} bg={gradSoft} />}
        {formation?.selectivite && <Badge label={formation.selectivite} color={T.success} bg="#2EC99A14" />}
        {(formation?.domaine || item.domaine) && <Badge label={formation?.domaine || item.domaine} color={T.muted} bg={T.border} />}
      </div>
    );

    bodyContent = (
      <>
        <p style={{ margin: "0 0 18px", fontSize: 14, color: T.muted, lineHeight: 1.75 }}>{description}</p>
        {formation?.acces && (
          <div style={{ padding: "14px 16px", borderRadius: 14, background: T.bg, border: `1px solid ${T.border}`, marginBottom: 16 }}>
            <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: T.text }}>Accès</p>
            <p style={{ margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.65 }}>{formation.acces}</p>
          </div>
        )}
        {metiers.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: T.text }}>Métiers associés</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {metiers.map((metier) => (
                <span key={metier.id} style={{ padding: "5px 12px", borderRadius: 99, background: gradSoft, border: "1px solid #F9A23B20", fontSize: 12, color: T.coral, fontWeight: 600 }}>
                  {metier.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </>
    );

    parentForSave = formation?.domaine || item.domaine || null;
    parentRefId = formation?.domaine ? `DOM.${formation.domaine.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}` : item.parentRefId || null;
  } else {
    const metier = item.refId ? getMetierById(item.refId) : getMetierByLabel(item.label);
    const formations = metier ? getFormationsForMetier(metier.id) : [];
    const metierLabel = metier?.label || item.label;

    metaRow = (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        {metier?.secteur && <Badge label={metier.secteur} color={T.muted} bg={T.bg} />}
        {metier?.niveauAccesMin && <Badge label={metier.niveauAccesMin} color={T.success} bg="#2EC99A14" />}
        {metier?.salaireDebutant && <Badge label={metier.salaireDebutant} color={T.orange} bg={gradSoft} />}
      </div>
    );

    bodyContent = (
      <>
        <p style={{ margin: "0 0 16px", fontSize: 14, color: T.muted, lineHeight: 1.75 }}>{metier?.accroche || `Fiche métier ${metierLabel}.`}</p>
        {metier?.formatCourt && (
          <div style={{ padding: "14px 16px", borderRadius: 14, background: T.bg, border: `1px solid ${T.border}`, marginBottom: 16 }}>
            <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: T.text }}>En bref</p>
            <p style={{ margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.65 }}>{metier.formatCourt}</p>
          </div>
        )}
        {metier?.competences?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: T.text }}>Compétences clés</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {metier.competences.map((competence) => (
                <span key={competence} style={{ padding: "5px 12px", borderRadius: 99, background: gradSoft, border: "1px solid #F9A23B20", fontSize: 12, color: T.coral, fontWeight: 600 }}>
                  {competence}
                </span>
              ))}
            </div>
          </div>
        )}
        {formations.length > 0 && (
          <div style={{ padding: "14px 16px", borderRadius: 14, background: T.bg, border: `1px solid ${T.border}`, marginBottom: 4 }}>
            <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: T.text }}>Formations associées</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 8 }}>
              {formations.map((formation) => (
                <span key={formation.id} style={{ padding: "5px 12px", borderRadius: 99, background: gradSoft, border: "1px solid #F9A23B20", fontSize: 12, color: T.coral, fontWeight: 600 }}>
                  {formation.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </>
    );

    parentForSave = metier?.accesFormationsIds?.length ? getFormationById(metier.accesFormationsIds[0])?.label || item.parent || null : item.parent || null;
    parentRefId = item.formationId || metier?.accesFormationsIds?.[0] || item.parentRefId || null;
  }

  const identifier = item.refId || item.label;

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
          <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>{item.type === "formation" ? "Formation" : "Métier"}</p>
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
              onClick={() => (saved ? onRemove(item.type, identifier) : onSave(item.type, item.label, parentForSave, identifier, parentRefId))}
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