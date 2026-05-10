import { useState } from "react";
import SidebarEleve from "./platform/layout/SidebarEleve";
import SidebarProf from "./platform/layout/SidebarProf";
import Landing from "./platform/pages/Landing";
import Auth from "./platform/pages/Auth";
import Onboarding from "./platform/pages/Onboarding";
import DashboardEleve from "./platform/pages/DashboardEleve";
import Exploration from "./platform/pages/Exploration";
import Favoris from "./platform/pages/Favoris";
import Chatbot from "./platform/pages/Chatbot";
import Parcoursup from "./platform/pages/Parcoursup";
import ProfDashboard from "./platform/pages/ProfDashboard";
import ProfClasse from "./platform/pages/ProfClasse";
import ProfJalons from "./platform/pages/ProfJalons";
import Logo from "./platform/components/Logo";
import { T, grad } from "./platform/constants/theme";
import { AppProvider } from "./platform/context/AppContext";
import { useAppState } from "./platform/hooks/useAppState";
import { useMobile } from "./platform/hooks/useMobile";

function AppShell() {
  const {
    screen, setScreen,
    authMode, setAuthMode,
    user, page,
    loading,
    completeAuth, completeOnboarding,
    isProf, locked, setPage,
  } = useAppState();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useMobile();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontSize: 14, color: T.muted, fontFamily: "'DM Sans',sans-serif" }}>Chargement…</p>
      </div>
    );
  }

  if (screen === "landing") {
    return <Landing onLogin={() => { setAuthMode("login"); setScreen("auth"); }} onSignup={() => { setAuthMode("signup"); setScreen("auth"); }} />;
  }

  if (screen === "auth") {
    return <Auth mode={authMode} onComplete={completeAuth} onToggle={() => setAuthMode((m) => (m === "signup" ? "login" : "signup"))} onBack={() => setScreen("landing")} />;
  }

  if (screen === "onboarding") {
    return <Onboarding prenom={user?.prenom || ""} onComplete={completeOnboarding} />;
  }

  const renderEleve = () => {
    if (locked && page !== "dashboard") {
      return (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: T.bg, flexDirection: "column", gap: 16 }}>
          <span style={{ fontSize: 32, color: T.mutedLight }}>◌</span>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.text }}>Acces verrouille</p>
          <p style={{ margin: 0, fontSize: 13, color: T.muted }}>Complete ton profil pour debloquer la plateforme.</p>
          <button onClick={() => setPage("dashboard")} style={{ marginTop: 4, padding: "11px 24px", borderRadius: 12, border: "none", background: grad, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
            Aller au tableau de bord
          </button>
        </div>
      );
    }
    switch (page) {
      case "dashboard":   return <DashboardEleve />;
      case "exploration": return <Exploration />;
      case "parcoursup":  return <Parcoursup />;
      case "favoris":     return <Favoris />;
      case "chatbot":     return <Chatbot />;
      default:            return null;
    }
  };

  const renderProf = () => {
    switch (page) {
      case "prof-dashboard": return <ProfDashboard />;
      case "prof-classe":    return <ProfClasse />;
      case "prof-jalons":    return <ProfJalons />;
      default:               return null;
    }
  };

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", display: "flex", flexDirection: "column", height: "100vh", background: T.navy }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Barre supérieure mobile */}
      {isMobile && (
        <div style={{ padding: "13px 16px", background: T.navyMid, display: "flex", alignItems: "center", gap: 12, flexShrink: 0, zIndex: 10 }}>
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.85)", fontSize: 22, padding: 0, lineHeight: 1, display: "flex", alignItems: "center" }}
          >
            ☰
          </button>
          <Logo size={20} dark />
        </div>
      )}

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Backdrop overlay mobile */}
        {isMobile && sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.52)", zIndex: 999 }}
          />
        )}

        {/* Sidebar */}
        {(!isMobile || sidebarOpen) && (
          isProf
            ? <SidebarProf mobile={isMobile} onClose={() => setSidebarOpen(false)} />
            : <SidebarEleve mobile={isMobile} onClose={() => setSidebarOpen(false)} />
        )}

        {/* Contenu principal */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
          {isProf ? renderProf() : renderEleve()}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
