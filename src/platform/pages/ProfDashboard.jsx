import { useState, useEffect } from "react";
import Badge from "../components/Badge";
import GradText from "../components/GradText";
import ProgressBar from "../components/ProgressBar";
import { getClasseStudents } from "../services/classeService";
import { T } from "../constants/theme";
import { useAppState } from "../hooks/useAppState";

export default function ProfDashboard() {
  const { user, config, setPage } = useAppState();
  const [students, setStudents] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  function loadStudents() {
    setRefreshing(true);
    getClasseStudents().then(setStudents).catch(console.error).finally(() => setRefreshing(false));
  }

  useEffect(() => { loadStudents(); }, []);

  const n = students.length;
  const nbProfilOk   = students.filter((s) => s.onboarded).length;
  const nbDomainesOk = students.filter((s) => s.onboarded && s.domaines   >= config.obj2.target).length;
  const nbFormOk     = students.filter((s) => s.onboarded && s.formations >= config.obj3.target).length;
  const nbMetiersOk  = students.filter((s) => s.onboarded && s.metiers    >= config.obj4.target).length;

  const jalonsRows = [
    { title: "Compléter le profil",                        periode: "Sans date limite",                         prog: n ? Math.round((nbProfilOk   / n) * 100) : 0 },
    { title: `Sauvegarder ${config.obj2.target} domaines`, periode: `Date limite : ${config.obj2.date ?? "—"}`, prog: n ? Math.round((nbDomainesOk / n) * 100) : 0 },
    { title: `Sauvegarder ${config.obj3.target} formations`,periode: `Date limite : ${config.obj3.date ?? "—"}`, prog: n ? Math.round((nbFormOk     / n) * 100) : 0 },
    { title: `Sauvegarder ${config.obj4.target} métiers`,  periode: `Date limite : ${config.obj4.date ?? "—"}`, prog: n ? Math.round((nbMetiersOk  / n) * 100) : 0 },
  ];

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "40px 48px", background: T.bg, fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 13, color: T.muted, fontWeight: 500 }}>Tableau de bord</p>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: T.text, letterSpacing: "-0.03em" }}>
              Bonjour, <GradText>{user.prenom}</GradText>
            </h1>
          </div>
          <button onClick={loadStudents} disabled={refreshing} style={{ marginTop: 4, padding: "8px 14px", borderRadius: 11, border: `1.5px solid ${T.border}`, background: T.bg, fontSize: 12, fontWeight: 700, color: T.muted, cursor: refreshing ? "not-allowed" : "pointer", fontFamily: "'DM Sans',sans-serif" }}>
            {refreshing ? "…" : "↻ Actualiser"}
          </button>
        </div>
      </div>

      <div style={{ background: `linear-gradient(135deg,${T.navy},${T.navyMid})`, borderRadius: 22, padding: "24px 28px", marginBottom: 22, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 12px 40px rgba(15,31,61,0.14)" }}>
        <div>
          <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Code classe</p>
          <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "white", letterSpacing: "0.08em" }}>{user.classCode || "—"}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: "0 0 4px", fontSize: 12, color: "rgba(255,255,255,0.45)" }}>Élèves</p>
          <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "white" }}>{n}</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 14, marginBottom: 22 }}>
        {[
          { label: "Profils complétés",                          value: nbProfilOk,   total: n, sym: "◎" },
          { label: `Objectif domaines (${config.obj2.target})`,  value: nbDomainesOk, total: n, sym: "◉" },
          { label: `Objectif formations (${config.obj3.target})`,value: nbFormOk,     total: n, sym: "◇" },
          { label: `Objectif métiers (${config.obj4.target})`,   value: nbMetiersOk,  total: n, sym: "◈" },
        ].map((s) => (
          <div key={s.label} style={{ flex: 1, background: T.white, borderRadius: 18, padding: "18px 20px", border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(15,31,61,0.04)" }}>
            <span style={{ fontSize: 15, color: T.muted, display: "block", marginBottom: 6 }}>{s.sym}</span>
            <p style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 800, letterSpacing: "-0.04em" }}>
              <GradText>{s.value}</GradText>
              <span style={{ fontSize: 13, color: T.muted, fontWeight: 500 }}> / {s.total}</span>
            </p>
            <p style={{ margin: 0, fontSize: 11, color: T.muted, lineHeight: 1.35 }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={{ background: T.white, borderRadius: 22, padding: "22px 26px", border: `1px solid ${T.border}`, boxShadow: "0 2px 12px rgba(15,31,61,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>Parcours élève</p>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: T.text }}>Mêmes objectifs que sur leur tableau de bord</h3>
          </div>
          <button type="button" onClick={() => setPage("prof-jalons")} style={{ padding: "8px 14px", borderRadius: 11, border: `1.5px solid ${T.border}`, background: T.bg, fontSize: 12, fontWeight: 700, color: T.orange, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
            Modifier les dates et seuils
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {jalonsRows.map((j) => (
            <div key={j.title} style={{ padding: "12px 14px", borderRadius: 14, background: T.bg, border: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{j.title}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 10, color: T.muted, fontWeight: 600 }}>{j.periode}</span>
                  <Badge label={`${j.prog}%`} color={j.prog >= 80 ? T.success : j.prog >= 40 ? T.orange : T.coral} bg={j.prog >= 80 ? "#2EC99A14" : j.prog >= 40 ? "#F9A23B14" : "#F4736A14"} />
                </div>
              </div>
              <ProgressBar value={j.prog} max={100} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
