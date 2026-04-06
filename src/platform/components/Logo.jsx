import { T } from "../constants/theme";

export default function Logo({ size = 24, dark = false }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <defs>
          <linearGradient id="lg" x1="50" y1="88" x2="50" y2="8" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F4736A" />
            <stop offset="50%" stopColor="#F9A23B" />
            <stop offset="100%" stopColor="#F9C84A" />
          </linearGradient>
        </defs>
        {[[-90, 0.92], [-56, 0.72], [-124, 0.72], [-28, 0.52], [-152, 0.52]].map(([a, l], i) => {
          const r = (a * Math.PI) / 180;
          return (
            <line
              key={i}
              x1={50}
              y1={76}
              x2={50 + Math.cos(r) * 38 * l}
              y2={76 + Math.sin(r) * 38 * l}
              stroke="url(#lg)"
              strokeWidth={i === 0 ? 5 : 3.5}
              strokeLinecap="round"
            />
          );
        })}
        <path d="M50 14 L52.2 19.8 L58 19.8 L53.4 23.2 L55.6 29 L50 25.6 L44.4 29 L46.6 23.2 L42 19.8 L47.8 19.8 Z" fill="#F9C84A" />
        <circle cx="50" cy="76" r="3.5" fill="url(#lg)" />
      </svg>
      <span style={{ fontSize: size * 0.9, fontWeight: 800, letterSpacing: "-0.04em", fontFamily: "'DM Sans',sans-serif", color: dark ? T.white : T.navy }}>
        MIRAI
      </span>
    </div>
  );
}
