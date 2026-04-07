import { useState } from "react";
import Badge from "../components/Badge";
import DetailPanel from "../components/DetailPanel";
import { T } from "../constants/theme";

export default function Favoris({ savedItems, onRemove, onSave, onNav }) {
  const [detailItem, setDetailItem] = useState(null);
  const domaines = savedItems.filter((i) => i.type === "domaine");
  const formations = savedItems.filter((i) => i.type === "formation");
  const metiers = savedItems.filter((i) => i.type === "metier");

  const Section = ({ title, sym, items, type, canDetail = false }) => (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 14, color: T.orange }}>{sym}</span>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: T.text }}>{title}</h2>
        <Badge label={items.length} color={T.muted} bg={T.border} />
      </div>
      {items.length === 0 ? (
        <div style={{ padding: "24px", borderRadius: 16, border: `1.5px dashed ${T.border}`, textAlign: "center", color: T.mutedLight, fontSize: 13 }}>Aucun {type} en favori pour l'instant.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((item) => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: T.white, borderRadius: 14, border: `1px solid ${T.border}`, boxShadow: "0 1px 6px rgba(15,31,61,0.04)" }}>
              <span style={{ fontSize: 14, color: T.orange, flexShrink: 0 }}>◆</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</p>
                {item.parent && <p style={{ margin: "2px 0 0", fontSize: 11, color: T.muted }}>{item.parent}</p>}
              </div>
              {canDetail && (
                <button
                  onClick={() =>
                    setDetailItem(
                      item.type === "formation"
                        ? { type: "formation", refId: item.refId, label: item.label, domaine: item.parent, parent: item.parent, parentRefId: item.parentRefId }
                        : { type: "metier", refId: item.refId, label: item.label, formation: item.parent, formationId: item.parentRefId, parent: item.parent, parentRefId: item.parentRefId },
                    )
                  }
                  style={{ flexShrink: 0, padding: "6px 12px", borderRadius: 9, border: `1.5px solid ${T.border}`, background: T.bg, cursor: "pointer", fontSize: 11, fontWeight: 700, color: T.muted, fontFamily: "'DM Sans',sans-serif", transition: "all 0.18s" }}
                >
                  Voir la fiche
                </button>
              )}
              <button
                onClick={() => onRemove(item.type, item.refId || item.label)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: T.mutedLight, padding: "4px 6px", borderRadius: 8, transition: "color 0.15s" }}
                onMouseEnter={(e) => (e.target.style.color = T.coral)}
                onMouseLeave={(e) => (e.target.style.color = T.mutedLight)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "40px 48px", background: T.bg, fontFamily: "'DM Sans',sans-serif" }}>
      {detailItem && <DetailPanel item={detailItem} onClose={() => setDetailItem(null)} onSave={onSave} onRemove={onRemove} savedItems={savedItems} onAskMirai={onNav ? () => onNav("chatbot") : undefined} />}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 800, color: T.text, letterSpacing: "-0.03em" }}>Mes favoris</h1>
        <p style={{ margin: 0, fontSize: 14, color: T.muted }}>Domaines, formations et métiers que tu as sauvegardés en favoris.</p>
      </div>
      <Section title="Domaines" sym="◉" items={domaines} type="domaine" canDetail={false} />
      <Section title="Formations" sym="◇" items={formations} type="formation" canDetail />
      <Section title="Métiers" sym="◈" items={metiers} type="metier" canDetail />
    </div>
  );
}