import { T } from "../constants/theme";

export default function Badge({ label, color = T.orange, bg = "#F9A23B14" }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color, background: bg, padding: "3px 10px", borderRadius: 99, fontFamily: "'DM Sans',sans-serif", whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}
