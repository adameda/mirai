import Badge from "../components/Badge";
import { MOCK_STUDENTS } from "../data/mockStudents";
import { T, grad } from "../constants/theme";

export default function ProfClasse({ config }) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "40px 48px", background: T.bg, fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <p style={{ margin: "0 0 4px", fontSize: 13, color: T.muted, fontWeight: 500 }}>Suivi</p>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: T.text, letterSpacing: "-0.03em" }}>Ma classe</h1>
        <p style={{ margin: "8px 0 0", fontSize: 14, color: T.muted, maxWidth: 560, lineHeight: 1.5 }}>
          Chaque colonne montre la progression d'un objectif pour chaque élève, avec les seuils de classe pour les domaines, formations et métiers.
        </p>
      </div>
      <div style={{ background: T.white, borderRadius: 22, border: `1px solid ${T.border}`, overflow: "hidden", boxShadow: "0 2px 12px rgba(15,31,61,0.05)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(120px,1.15fr) 0.7fr 0.7fr 0.7fr 0.7fr", gap: 12, padding: "14px 20px", background: T.bg, borderBottom: `1px solid ${T.border}` }}>
          {["Élève", "Profil", "Domaines", "Formations", "Métiers"].map((h) => (
            <span key={h} style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {h}
            </span>
          ))}
        </div>
        {MOCK_STUDENTS.map((s, i) => {
          return (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "minmax(120px,1.15fr) 0.7fr 0.7fr 0.7fr 0.7fr", gap: 12, padding: "14px 20px", borderBottom: i < MOCK_STUDENTS.length - 1 ? `1px solid ${T.border}` : "none", alignItems: "center", background: i % 2 === 0 ? T.white : T.bg }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: grad, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "white" }}>{s.prenom[0]}</div>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.prenom}</span>
              </div>
              <div>{s.onboarded ? <Badge label="Complété" color={T.success} bg="#2EC99A14" /> : <Badge label="À compléter" color={T.muted} bg={T.border} />}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{s.domaines}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{s.formations}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{s.metiers}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
