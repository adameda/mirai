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
import { T, grad } from "./platform/constants/theme";
import { AppProvider } from "./platform/context/AppContext";
import { useAppState } from "./platform/hooks/useAppState";

function AppShell() {
  const {
    screen, setScreen,
    authMode, setAuthMode,
    user, page,
    loading,
    completeAuth, completeOnboarding,
    isProf, locked, setPage,
  } = useAppState();

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
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: T.navy }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ display: "flex", height: "100vh" }}>
        {isProf ? <SidebarProf /> : <SidebarEleve />}
        {isProf ? renderProf() : renderEleve()}
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
