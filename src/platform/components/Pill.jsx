import { T, grad, gradSoft } from "../constants/theme";

export default function Pill({ label, light = false }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 12px",
        borderRadius: 99,
        background: light ? "rgba(249,162,59,0.15)" : gradSoft,
        border: `1px solid ${light ? "rgba(249,162,59,0.3)" : "#F9A23B30"}`,
      }}
    >
      <div style={{ width: 5, height: 5, borderRadius: 99, background: grad }} />
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: light ? T.gold : T.coral, textTransform: "uppercase", fontFamily: "'DM Sans',sans-serif" }}>
        {label}
      </span>
    </div>
  );
}
