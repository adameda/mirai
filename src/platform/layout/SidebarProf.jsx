import Logo from "../components/Logo";
import { NAV_PROF, T, grad } from "../constants/theme";
import { useAppState } from "../hooks/useAppState";

export default function SidebarProf() {
  const { page, setPage, user, logout } = useAppState();

  return (
    <aside style={{ width: 220, flexShrink: 0, background: T.navyMid, display: "flex", flexDirection: "column", padding: "28px 0", height: "100%" }}>
      <div style={{ padding: "0 24px 32px" }}>
        <Logo size={22} dark />
      </div>
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, padding: "0 12px" }}>
        {NAV_PROF.map((n) => {
          const isActive = n.id === page;
          return (
            <div
              key={n.id}
              onClick={() => setPage(n.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 14px",
                borderRadius: 14,
                cursor: "pointer",
                background: isActive ? "rgba(249,162,59,0.1)" : "transparent",
                borderLeft: isActive ? "3px solid #F9A23B" : "3px solid transparent",
                transition: "all 0.2s",
              }}
            >
              <span style={{ fontSize: 14, ...(isActive ? { background: grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" } : { color: "rgba(255,255,255,0.45)" }) }}>{n.sym}</span>
              <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 400, color: isActive ? "white" : "rgba(255,255,255,0.45)", fontFamily: "'DM Sans',sans-serif" }}>{n.label}</span>
            </div>
          );
        })}
      </nav>
      <div style={{ margin: "0 12px 10px", padding: "14px", borderRadius: 16, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "rgba(255,255,255,0.15)",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 800,
              color: "white",
            }}
          >
            {user.prenom[0]}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "white", fontFamily: "'DM Sans',sans-serif" }}>{user.prenom}</p>
            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "'DM Sans',sans-serif" }}>Professeur</p>
          </div>
        </div>
      </div>
      <div style={{ padding: "0 12px" }}>
        <button
          type="button"
          onClick={logout}
          style={{
            width: "100%",
            padding: "11px 14px",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.04)",
            color: "rgba(255,255,255,0.82)",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "'DM Sans',sans-serif",
          }}
        >
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}
