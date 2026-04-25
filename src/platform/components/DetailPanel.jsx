import { useEffect, useState } from "react";
import Badge from "./Badge";
import { T, grad, gradSoft } from "../constants/theme";

import { getFormationById, getMetierById } from "../services/explorationService";

const shortSalary = (value) => {
  const matches = `${value || ""}`.match(/\d{3,4}/g);
  if (matches && matches.length >= 2) return `${matches[0]}–${matches[1]} € brut/mois`;
  if (matches && matches.length === 1) return `À partir de ${matches[0]} € brut/mois`;
  return value || "Rémunération variable";
};

export default function DetailPanel({ item, onClose, onSave, onRemove, savedItems, onAskMirai }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!item) { setData(null); return; }
    setData(null);
    const fetch = item.type === "formation"
      ? getFormationById(item.refId)
      : getMetierById(item.refId);
    fetch.then(setData);
  }, [item?.refId, item?.type]);

  if (!item) return null;

  const saved = savedItems.some((entry) => entry.type === item.type && (item.refId ? entry.refId === item.refId : entry.label === item.label));
  const identifier = item.refId || item.label;

  const handleSave = () => {
    if (item.type === "formation") {
      const parentForSave = data?.domaines?.[0]?.libelle || item.domaine || item.parent || null;
      const parentRefId = data?.domaines?.[0]?.id ? String(data.domaines[0].id) : item.parentRefId || null;
      onSave(item.type, item.label, parentForSave, identifier, parentRefId);
      return;
    }

    const parentForSave = item.formation || item.parent || null;
    const parentRefId = item.formationId || item.parentRefId || null;
    onSave(item.type, item.label, parentForSave, identifier, parentRefId);
  };

  let metaRow = null;

  if (item.type === "formation") {
    metaRow = (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        {data?.type_formation?.sigle && <Badge label={data.type_formation.sigle} color={T.muted} bg={T.bg} />}
        {data?.duree && <Badge label={data.duree} color={T.orange} bg={gradSoft} />}
        {data?.niveau_etudes && <Badge label={data.niveau_etudes} color={T.success} bg="#2EC99A14" />}
        {data?.domaines?.[0]?.libelle && <Badge label={data.domaines[0].libelle} color={T.muted} bg={T.border} />}
      </div>
    );
  } else {
    metaRow = (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        {data?.secteurs_activite?.[0]?.libelle && <Badge label={data.secteurs_activite[0].libelle} color={T.muted} bg={T.bg} />}
        {data?.niveau_acces_min && <Badge label={data.niveau_acces_min} color={T.success} bg="#2EC99A14" />}
        {data?.salaire_debutant && <Badge label={shortSalary(data.salaire_debutant)} color={T.orange} bg={gradSoft} />}
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,31,61,0.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={onClose}>
      <div
        style={{ background: T.white, borderRadius: 24, padding: "32px 34px", width: "100%", maxWidth: 500, position: "relative", boxShadow: "0 24px 80px rgba(15,31,61,0.25)", maxHeight: "85vh", overflowY: "auto", fontFamily: "'DM Sans',sans-serif" }}
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

            {/* Description courte (formation) */}
            {item.type === "formation" && data?.description_courte && (
              <div style={{ marginBottom: 18 }}>
                <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: T.text }}>Présentation</p>
                <p style={{ margin: 0, fontSize: 12, color: T.muted, lineHeight: 1.65 }}>{data.description_courte}</p>
              </div>
            )}

            {/* Lien Onisep pour les formations sans description (ingénieur, commerce…) */}
            {item.type === "formation" && !data?.description_courte && !data?.acces && data?.url && (
              <div style={{ marginBottom: 18 }}>
                <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: T.text }}>Fiche complète</p>
                <a
                  href={data.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 12, border: `1px solid ${T.border}`, background: T.bg, textDecoration: "none", color: T.text, fontSize: 12, fontWeight: 600 }}
                >
                  <span>Voir la fiche sur Onisep</span>
                  <span style={{ color: T.muted, fontSize: 11 }}>↗</span>
                </a>
              </div>
            )}

            {/* Accroche (métier) */}
            {item.type === "metier" && data?.accroche && (
              <div style={{ marginBottom: 18 }}>
                <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: T.text }}>En bref</p>
                <p style={{ margin: 0, fontSize: 12, color: T.muted, lineHeight: 1.65 }}>{data.accroche}</p>
              </div>
            )}

            {/* Poursuites d'études (formation only) */}
            {item.type === "formation" && data?.poursuite_etudes?.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: T.text }}>Poursuites d'études possibles</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {data.poursuite_etudes.map((p) => (
                    <a
                      key={p.id}
                      href={`https://www.onisep.fr/http/redirection/formation/slug/${p.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "9px 12px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.bg, textDecoration: "none", color: T.text, fontSize: 12, fontWeight: 600, transition: "border-color 0.15s" }}
                    >
                      <span style={{ flex: 1, lineHeight: 1.35 }}>{p.libelle}</span>
                      <span style={{ color: T.muted, fontSize: 10, flexShrink: 0 }}>↗ Onisep</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div style={{ paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
          {onAskMirai && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onAskMirai(item);
              }}
              style={{ width: "100%", marginBottom: 10, padding: "12px 16px", borderRadius: 13, border: "1.5px solid #F9A23B55", background: gradSoft, color: T.orange, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}
            >
              Demander à MIRAI
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
              onClick={() => (saved ? onRemove(item.type, identifier) : handleSave())}
              style={{ flex: 2, padding: "12px", borderRadius: 13, border: saved ? "1.5px solid #F9A23B40" : "none", background: saved ? gradSoft : grad, color: saved ? T.orange : "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", boxShadow: saved ? "none" : "0 6px 20px rgba(249,162,59,0.3)", transition: "all 0.2s" }}
            >
              {saved ? "✓ Sauvegardé" : "Sauvegarder en favori"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}