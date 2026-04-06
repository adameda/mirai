import { T } from "../constants/theme";

export default function Input({ label, type = "text", placeholder, value, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 700, color: T.text, fontFamily: "'DM Sans',sans-serif" }}>{label}</label>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{
          padding: "12px 16px",
          borderRadius: 12,
          border: `1.5px solid ${T.border}`,
          fontSize: 14,
          fontFamily: "'DM Sans',sans-serif",
          color: T.text,
          outline: "none",
          background: T.bg,
        }}
        onFocus={(e) => (e.target.style.borderColor = "#F9A23B")}
        onBlur={(e) => (e.target.style.borderColor = T.border)}
      />
    </div>
  );
}
