import { useEffect, useState } from "react";
import { T, grad } from "../constants/theme";

export default function ProgressBar({ value, max, light = false, color = grad }) {
  const [w, setW] = useState(0);
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  useEffect(() => {
    const t = setTimeout(() => setW(pct), 300);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div style={{ height: 6, background: light ? "rgba(255,255,255,0.15)" : T.border, borderRadius: 99, overflow: "hidden" }}>
      <div
        style={{
          height: "100%",
          width: `${w}%`,
          borderRadius: 99,
          background: color,
          transition: "width 1s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: light ? "0 0 8px #F9A23B60" : "none",
        }}
      />
    </div>
  );
}
