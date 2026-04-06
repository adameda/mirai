import { useState } from "react";
import SidebarEleve from "./src/platform/layout/SidebarEleve";
import SidebarProf from "./src/platform/layout/SidebarProf";
import Landing from "./src/platform/pages/Landing";
import Auth from "./src/platform/pages/Auth";
import Onboarding from "./src/platform/pages/Onboarding";
import DashboardEleve from "./src/platform/pages/DashboardEleve";
import Exploration from "./src/platform/pages/Exploration";
import Favoris from "./src/platform/pages/Favoris";
import Chatbot from "./src/platform/pages/Chatbot";
import ProfDashboard from "./src/platform/pages/ProfDashboard";
import ProfClasse from "./src/platform/pages/ProfClasse";
import ProfJalons from "./src/platform/pages/ProfJalons";
import { DEFAULT_CONFIG } from "./src/platform/data/defaultConfig";
import { T, grad } from "./src/platform/constants/theme";

export default function MiraiApp() {
  const [screen, setScreen] = useState("landing");
  const [authMode, setAuthMode] = useState("signup");
  const [user, setUser] = useState(null);
  const [answers, setAnswers] = useState({});
  const [onboarded, setOnboarded] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [savedItems, setSavedItems] = useState([]);
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  const handleSave = (type, label, parent) => {
    if (savedItems.some((i) => i.type === type && i.label === label)) return;
    setSavedItems((s) => [...s, { id: Date.now(), type, label, parent }]);
  };

  const handleRemove = (type, label) => {
    setSavedItems((s) => s.filter((i) => !(i.type === type && i.label === label)));
  };

  const handleLogout = () => {
    setScreen("landing");
    setAuthMode("signup");
    setUser(null);
    setAnswers({});
    setOnboarded(false);
    setPage("dashboard");
    setSavedItems([]);
    setConfig(DEFAULT_CONFIG);
  };

  const locked = !onboarded;

  if (screen === "landing") {
    return <Landing onLogin={() => { setAuthMode("login"); setScreen("auth"); }} onSignup={() => { setAuthMode("signup"); setScreen("auth"); }} />;
  }

  if (screen === "auth") {
    return (
      <Auth
        mode={authMode}
        onComplete={({ prenom, role, classCode }) => {
          setUser({ prenom, role, classCode });
          if (role === "prof") {
            setPage("prof-dashboard");
            setScreen("app");
          } else {
            setPage("dashboard");
            setScreen("app");
          }
        }}
        onToggle={() => setAuthMode((m) => (m === "signup" ? "login" : "signup"))}
      />
    );
  }

  if (screen === "onboarding") {
    return (
      <Onboarding
        prenom={user?.prenom || ""}
        onComplete={(ans) => {
          setAnswers(ans);
          setOnboarded(true);
          setScreen("app");
          setPage("dashboard");
        }}
      />
    );
  }

  const isProf = user?.role === "prof";

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
      case "dashboard":
        return <DashboardEleve user={user} onboarded={onboarded} savedItems={savedItems} config={config} onStartOnboarding={() => setScreen("onboarding")} onNav={setPage} />;
      case "exploration":
        return <Exploration answers={answers} savedItems={savedItems} onSave={handleSave} onRemove={handleRemove} onNav={setPage} />;
      case "favoris":
        return <Favoris savedItems={savedItems} onRemove={handleRemove} onSave={handleSave} onNav={setPage} />;
      case "chatbot":
        return <Chatbot />;
      default:
        return null;
    }
  };

  const renderProf = () => {
    switch (page) {
      case "prof-dashboard":
        return <ProfDashboard user={user} config={config} onNav={setPage} />;
      case "prof-classe":
        return <ProfClasse config={config} />;
      case "prof-jalons":
        return <ProfJalons config={config} onUpdateConfig={setConfig} />;
      default:
        return null;
    }
  };

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: T.navy }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ display: "flex", height: "100vh" }}>
        {isProf ? <SidebarProf active={page} onNav={setPage} user={user} onLogout={handleLogout} /> : <SidebarEleve active={page} onNav={setPage} user={user} locked={locked} onLogout={handleLogout} />}
        {isProf ? renderProf() : renderEleve()}
      </div>
    </div>
  );
}
