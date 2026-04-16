import { useEffect, useState } from "react";
import Input from "../components/Input";
import { T, grad } from "../constants/theme";
import { useAppState } from "../hooks/useAppState";

export default function ProfJalons() {
  const { config, saveConfig } = useAppState();
  const [local,    setLocal]   = useState({ ...config });
  const [saving,   setSaving]  = useState(false);
  const [saved,    setDidSave] = useState(false);
  const [error,    setError]   = useState(null);

  useEffect(() => {
    setLocal({ ...config });
  }, [config]);

  const upd = (key, field, val) => setLocal((c) => ({ ...c, [key]: { ...c[key], [field]: val } }));

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await saveConfig(local);
      setDidSave(true);
      setTimeout(() => setDidSave(false), 2000);
    } catch (e) {
      setError(e.message || "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  const Row = ({ num, title, children, withBorder }) => (
    <div style={{ padding: "20px 24px", borderTop: withBorder ? `1px solid ${T.border}` : "none" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "white", fontWeight: 800 }}>{num}</div>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.text }}>{title}</h3>
      </div>
      {children}
    </div>
  );

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "40px 48px", background: T.bg, fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ marginBottom: 22 }}>
        <p style={{ margin: "0 0 4px", fontSize: 13, color: T.muted, fontWeight: 500 }}>Réglages classe</p>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: T.text, letterSpacing: "-0.03em" }}>Objectifs & dates</h1>
        <p style={{ margin: "8px 0 0", fontSize: 14, color: T.muted, maxWidth: 640, lineHeight: 1.55 }}>
          Le profil est un prérequis sans date limite. Les autres objectifs ont une date limite et restent visibles comme en retard si le seuil n'est pas atteint à temps.
        </p>
      </div>

      <div style={{ background: T.white, borderRadius: 22, border: `1px solid ${T.border}`, boxShadow: "0 2px 12px rgba(15,31,61,0.05)", overflow: "hidden" }}>
        <Row num={1} title="Compléter le profil" withBorder={false}>
          <div style={{ padding: "14px 16px", borderRadius: 14, background: T.bg, border: `1px solid ${T.border}` }}>
            <p style={{ margin: 0, fontSize: 13, color: T.text, fontWeight: 700 }}>Obligatoire dès l'inscription</p>
            <p style={{ margin: "6px 0 0", fontSize: 12, color: T.muted, lineHeight: 1.55 }}>
              Cet objectif n'a pas de date limite : il sert à débloquer la plateforme et à démarrer le suivi élève.
            </p>
          </div>
        </Row>
        <Row num={2} title="Sauvegarder des domaines" withBorder>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 140px" }}>
              <Input label="Nombre minimum (favoris)" type="number" value={local.obj2.target} onChange={(e) => upd("obj2", "target", parseInt(e.target.value, 10) || 1)} />
            </div>
            <div style={{ flex: "1 1 160px" }}>
              <Input label="Date limite" type="date" value={local.obj2.date ?? ""} onChange={(e) => upd("obj2", "date", e.target.value || null)} />
            </div>
          </div>
        </Row>
        <Row num={3} title="Sauvegarder des formations" withBorder>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 140px" }}>
              <Input label="Nombre minimum (favoris)" type="number" value={local.obj3.target} onChange={(e) => upd("obj3", "target", parseInt(e.target.value, 10) || 1)} />
            </div>
            <div style={{ flex: "1 1 160px" }}>
              <Input label="Date limite" type="date" value={local.obj3.date ?? ""} onChange={(e) => upd("obj3", "date", e.target.value || null)} />
            </div>
          </div>
        </Row>
        <Row num={4} title="Sauvegarder des métiers" withBorder>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 140px" }}>
              <Input label="Nombre minimum (favoris)" type="number" value={local.obj4.target} onChange={(e) => upd("obj4", "target", parseInt(e.target.value, 10) || 1)} />
            </div>
            <div style={{ flex: "1 1 160px" }}>
              <Input label="Date limite" type="date" value={local.obj4.date ?? ""} onChange={(e) => upd("obj4", "date", e.target.value || null)} />
            </div>
          </div>
        </Row>
      </div>

      {error && <p style={{ marginTop: 12, fontSize: 12, color: "#F4736A", fontWeight: 600 }}>{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        style={{ marginTop: 20, padding: "14px 28px", borderRadius: 14, border: "none", background: saved ? T.success : grad, color: "white", fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontFamily: "'DM Sans',sans-serif", boxShadow: "0 6px 20px rgba(249,162,59,0.3)", transition: "background 0.3s" }}
      >
        {saving ? "Enregistrement…" : saved ? "✓ Enregistré" : "Enregistrer"}
      </button>
    </div>
  );
}
