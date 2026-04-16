import { useState, useEffect } from "react";
import Badge from "./Badge";
import { T, grad, gradSoft } from "../constants/theme";
import { getFormationById, getMetierById, getMetiersForFormation, getFormationsForMetier } from "../services/explorationService";

export default function DetailPanel({ item, onClose, onSave, onRemove, savedItems, onAskMirai }) {
  if (!item) return null;

  const saved = savedItems.some(
    (i) => i.type === item.type && (item.refId ? i.refId === item.refId : i.label === item.label)
  );
  const identifier = item.refId || item.label;

  const [data,     setData]     = useState(null);   // formation ou metier (détail)
  const [related,  setRelated]  = useState([]);      // métiers (pour formation) ou formations (pour métier)

  useEffect(() => {
    setData(null);
    setRelated([]);
    if (item.type === "formation") {
      getFormationById(item.refId).then(f => {
        setData(f);
        getMetiersForFormation(item.refId).then(setRelated);
      });
    } else {
      getMetierById(item.refId).then(m => {
        setData(m);
        getFormationsForMetier(item.refId).then(setRelated);
      });
    }
  }, [item.refId, item.type]);

  // Parent pour le bouton Sauvegarder
  let parentForSave  = item.parent  || null;
  let parentRefId    = item.parentRefId || null;

  if (item.type === "formation" && data) {
    parentForSave = data.domaines?.[0]?.libelle || item.domaine || null;
    parentRefId   = data.domaines?.[0]?.id ? String(data.domaines[0].id) : item.parentRefId || null;
  }
  if (item.type === "metier" && data) {
    parentForSave = item.formation || item.parent || null;
    parentRefId   = item.formationId || item.parentRefId || null;
  }

  // ── Contenu formation ──────────────────────────────────────────────────
  let metaRow, bodyContent;

  if (item.type === "formation") {
    metaRow = (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        {data?.type?.sigle         && <Badge label={data.type.sigle}          color={T.muted}    bg={T.bg}        />}
        {data?.duree               && <Badge label={data.duree}               color={T.orange}   bg={gradSoft}    />}
        {data?.niveau_etudes       && <Badge label={data.niveau_etudes}       color={T.success}  bg="#2EC99A14"   />}
        {(data?.domaines?.[0]?.libelle || item.domaine) &&
          <Badge label={data?.domaines?.[0]?.libelle || item.domaine} color={T.muted} bg={T.border} />}
      </div>
    );

    bodyContent = (
      <>
        <p style={{ margin: "0 0 18px", fontSize: 14, color: T.muted, lineHeight: 1.75 }}>
          {data?.description_courte || `Formation ${item.label}${item.domaine ? " dans le domaine " + item.domaine : ""}.`}
        </p>
        {data?.acces && (
          <div style={{ padding: "14px 16px", borderRadius: 14, background: T.bg, border: `1px solid ${T.border}`, marginBottom: 16 }}>
            <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: T.text }}>Accès</p>
            <p style={{ margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.65 }}>{data.acces}</p>
          </div>
        )}
        {related.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: T.text }}>Métiers associés</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {related.map((m) => (
                <span key={m.id} style={{ padding: "5px 12px", borderRadius: 99, background: gradSoft, border: "1px solid #F9A23B20", fontSize: 12, color: T.coral, fontWeight: 600 }}>
                  {m.nom}
                </span>
              ))}
            </div>
          </div>
        )}
      </>
    );
  } else {
    // ── Contenu métier ─────────────────────────────────────────────────
    const secteur = data?.secteurs_activite?.[0]?.libelle;

    metaRow = (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        {secteur                    && <Badge label={secteur}                   color={T.muted}   bg={T.bg}      />}
        {data?.niveau_acces_min    && <Badge label={data.niveau_acces_min}    color={T.success} bg="#2EC99A14" />}
        {data?.salaire_debutant    && <Badge label={data.salaire_debutant}    color={T.orange}  bg={gradSoft}  />}
      </div>
    );

    bodyContent = (
      <>
        <p style={{ margin: "0 0 16px", fontSize: 14, color: T.muted, lineHeight: 1.75 }}>
          {data?.accroche || `Fiche métier ${item.label}.`}
        </p>
        {data?.format_court && (
          <div style={{ padding: "14px 16px", borderRadius: 14, background: T.bg, border: `1px solid ${T.border}`, marginBottom: 16 }}>
            <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: T.text }}>En bref</p>
            <p style={{ margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.65 }}>{data.format_court}</p>
          </div>
        )}
        {data?.competences && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: T.text }}>Compétences clés</p>
            <p style={{ margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.65 }}>{data.competences}</p>
          </div>
        )}
        {related.length > 0 && (
          <div style={{ padding: "14px 16px", borderRadius: 14, background: T.bg, border: `1px solid ${T.border}`, marginBottom: 4 }}>
            <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: T.text }}>Formations associées</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {related.map((f) => (
                <span key={f.id} style={{ padding: "5px 12px", borderRadius: 99, background: gradSoft, border: "1px solid #F9A23B20", fontSize: 12, color: T.coral, fontWeight: 600 }}>
                  {f.libelle_complet}
                </span>
              ))}
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,31,61,0.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={onClose}>
      <div
        style={{ background: T.white, borderRadius: 24, padding: "36px 40px", width: "100%", maxWidth: 520, position: "relative", boxShadow: "0 24px 80px rgba(15,31,61,0.25)", maxHeight: "85vh", overflowY: "auto", fontFamily: "'DM Sans',sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 18, right: 18, width: 32, height: 32, borderRadius: 10, border: `1px solid ${T.border}`, background: T.bg, cursor: "pointer", fontSize: 13, color: T.muted, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif" }}
        >
          ✕
        </button>
        <div style={{ marginBottom: 16 }}>
          <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {item.type === "formation" ? "Formation" : "Métier"}
          </p>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: "-0.03em" }}>{item.label}</h2>
        </div>
        {!data ? (
          <p style={{ margin: "24px 0", fontSize: 13, color: T.muted, textAlign: "center" }}>Chargement…</p>
        ) : (
          <>
            {metaRow}
            {bodyContent}
          </>
        )}
        <div style={{ paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
          {onAskMirai && (
            <button
              type="button"
              onClick={() => { onClose(); onAskMirai(item); }}
              style={{ width: "100%", marginBottom: 10, padding: "12px 16px", borderRadius: 13, border: "1.5px solid #F9A23B55", background: gradSoft, color: T.orange, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}
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
              onClick={() => saved ? onRemove(item.type, identifier) : onSave(item.type, item.label, parentForSave, identifier, parentRefId)}
              style={{ flex: 2, padding: "12px", borderRadius: 13, border: "none", background: saved ? T.border : grad, color: saved ? T.muted : "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", boxShadow: saved ? "none" : "0 6px 20px rgba(249,162,59,0.3)", transition: "all 0.2s" }}
            >
              {saved ? "✓ Sauvegardé" : "Sauvegarder en favori"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
