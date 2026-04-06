import { T, gradSoft } from "../constants/theme";

export default function SaveBtn({ type, label, parent, savedItems, onSave, onRemove, small = false }) {
  const saved = savedItems.some((i) => i.type === type && i.label === label);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        saved ? onRemove(type, label) : onSave(type, label, parent);
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: small ? "5px 9px" : "6px 11px",
        borderRadius: 9,
        border: `1.5px solid ${saved ? T.orange : T.border}`,
        background: saved ? gradSoft : T.bg,
        cursor: "pointer",
        fontSize: 11,
        fontWeight: 700,
        color: saved ? T.orange : T.muted,
        fontFamily: "'DM Sans',sans-serif",
        flexShrink: 0,
        transition: "all 0.18s",
        whiteSpace: "nowrap",
      }}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {saved ? "Sauvegardé" : "Sauvegarder"}
    </button>
  );
}
