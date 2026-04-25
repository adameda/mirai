import { useEffect, useMemo, useState } from "react";
import SaveBtn from "../components/SaveBtn";
import {
  getAllDomaines,
  getFormationsByDomaine,
  getMetiersByDomaine,
  getSuggestedDomaines,
} from "../services/explorationService";
import { T, grad, gradSoft } from "../constants/theme";
import { useAppState } from "../hooks/useAppState";

// ── Constantes ───────────────────────────────────────────────────────────────

const DOMAIN_ICONS = {
  "Informatique & Numérique":    "💻",
  "Ingénierie & Industrie":      "⚙️",
  "Énergie & Environnement":     "🌱",
  "Commerce & Marketing":        "📈",
  "Gestion & Finance":           "💼",
  "Communication & Médias":      "📡",
  "Arts & Design":               "🎨",
  "Santé & Social":              "🏥",
  "Sciences":                    "🔬",
  "Droit":                       "⚖️",
  "Sciences Humaines & Langues": "📚",
  "BTP & Architecture":          "🏗️",
  "Hôtellerie & Tourisme":       "✈️",
};

const C = {
  domaines:   "#1A2F5A",
  formations: "#F9A23B",
  metiers:    "#2EC99A",
};

const FORMATION_FAMILIES = ["BTS", "BUT", "Prépa", "Licence", "Santé", "Autre"];

// ── Helpers ──────────────────────────────────────────────────────────────────

const norm = (v) =>
  (v || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const shortSalary = (value) => {
  const m = `${value || ""}`.match(/\d{3,4}/g);
  if (m && m.length >= 2) return `${m[0]}–${m[1]} €/mois`;
  if (m?.length === 1) return `≥ ${m[0]} €/mois`;
  return null;
};

const getFormationFamily = (f) => {
  const sigle   = norm(f?.type_formation?.sigle || f?.type_formation?.libelle_court || "");
  const libelle = norm(f?.type_formation?.libelle || "");
  if (sigle.startsWith("bts")) return "BTS";
  if (sigle.startsWith("but")) return "BUT";
  if (sigle === "cpge" || sigle === "cpi" || libelle.includes("preparatoire")) return "Prépa";
  if (sigle === "pass" || sigle === "las" || libelle.includes("sante") || libelle.includes("paramedical") || libelle.includes("infirmier")) return "Santé";
  if (libelle.includes("licence") && !libelle.includes("pro")) return "Licence";
  return "Autre";
};

// ── Micro-composants ─────────────────────────────────────────────────────────

const Pill = ({ children, color = T.muted, bg = T.bg, border = T.border }) => (
  <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 7px", borderRadius: 999, border: `1px solid ${border}`, background: bg, color, fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}>
    {children}
  </span>
);

const Spinner = () => (
  <p style={{ margin: "28px 0", fontSize: 12, color: T.muted, textAlign: "center" }}>Chargement…</p>
);

const EmptyHint = ({ icon, title, sub }) => (
  <div style={{ padding: "36px 16px", textAlign: "center" }}>
    <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.22 }}>{icon}</div>
    <p style={{ margin: "0 0 5px", fontSize: 13, fontWeight: 700, color: T.text }}>{title}</p>
    {sub && <p style={{ margin: 0, fontSize: 12, color: T.muted, lineHeight: 1.6, maxWidth: 200, marginInline: "auto" }}>{sub}</p>}
  </div>
);

const ColHeader = ({ label, count, color, active }) => (
  <div style={{ marginBottom: 14, flexShrink: 0 }}>
    <div style={{ height: 3, borderRadius: 99, background: active ? color : T.border, marginBottom: 10, transition: "background 0.4s", boxShadow: active ? `0 0 8px ${color}70` : "none" }} />
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: active ? T.text : T.muted, letterSpacing: "0.12em", textTransform: "uppercase" }}>
        {label}
      </p>
      {count != null && count > 0 && (
        <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 7px", borderRadius: 999, border: `1px solid ${color}40`, background: `${color}10`, color, fontSize: 10, fontWeight: 700 }}>
          {count}
        </span>
      )}
    </div>
  </div>
);

// ── Composant principal ──────────────────────────────────────────────────────

export default function Exploration() {
  const { answers, savedItems, saveItem, removeItem, openChat, setPage } = useAppState();

  const [mode,       setMode]       = useState("formations"); // "formations" | "metiers"
  const [selDomaine, setSelDomaine] = useState(null);
  const [items,      setItems]      = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [allDomaines, setAllDomaines] = useState([]);
  const [suggested,   setSuggested]  = useState([]);
  const [familyFilter, setFamilyFilter] = useState("Tous");
  const [search, setSearch] = useState("");

  // ── Chargement initial des domaines ──
  useEffect(() => {
    getSuggestedDomaines(answers?.domaines).then(setSuggested);
    getAllDomaines().then(setAllDomaines);
  }, [answers]);

  // ── Chargement des items quand domaine ou mode change ──
  useEffect(() => {
    if (!selDomaine) { setItems([]); return; }
    setLoading(true);
    setItems([]);
    const fetch = mode === "formations"
      ? getFormationsByDomaine(selDomaine.id)
      : getMetiersByDomaine(selDomaine.id);
    fetch.then(setItems).finally(() => setLoading(false));
  }, [selDomaine, mode]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const switchMode = (newMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    setFamilyFilter("Tous");
    setSearch("");
    setItems([]);
  };

  const selectDomaine = (d) => {
    setSelDomaine(d === selDomaine ? null : d);
    setFamilyFilter("Tous");
    setSearch("");
    setItems([]);
  };

  // ── Données dérivées ─────────────────────────────────────────────────────

  const suggestedIds = useMemo(() => new Set(suggested.map(d => d.id)), [suggested]);

  const domainesList = useMemo(() => {
    const extra = allDomaines.filter(d => !suggestedIds.has(d.id));
    return [...suggested, ...extra];
  }, [allDomaines, suggested, suggestedIds]);

  // Familles disponibles dans les items actuels
  const availableFamilies = useMemo(() => {
    if (mode !== "formations") return [];
    const seen = new Set(items.map(getFormationFamily));
    return FORMATION_FAMILIES.filter(f => seen.has(f));
  }, [items, mode]);

  // Items filtrés
  const visibleItems = useMemo(() => {
    if (mode !== "formations" || familyFilter === "Tous") return items;
    return items.filter(f => getFormationFamily(f) === familyFilter);
  }, [items, mode, familyFilter]);

  // Items après recherche
  const searchedItems = useMemo(() => {
    if (!search.trim()) return visibleItems;
    const q = norm(search);
    return visibleItems.filter(item => {
      const label = mode === "formations"
        ? norm(item.libelle_complet) + " " + norm(item.libelle_generique || "")
        : norm(item.nom);
      return label.includes(q);
    });
  }, [visibleItems, search, mode]);

  // Groupement par famille (formations mode uniquement)
  const groupedFormations = useMemo(() => {
    if (mode !== "formations") return [];
    const buckets = new Map();
    searchedItems.forEach(f => {
      const fam = getFormationFamily(f);
      if (!buckets.has(fam)) buckets.set(fam, []);
      buckets.get(fam).push(f);
    });
    return FORMATION_FAMILIES
      .map(fam => ({ fam, items: (buckets.get(fam) || []).sort((a, b) => a.libelle_complet.localeCompare(b.libelle_complet, "fr")) }))
      .filter(g => g.items.length > 0);
  }, [searchedItems, mode]);

  const activeColor = mode === "formations" ? C.formations : C.metiers;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "'DM Sans',sans-serif", background: "linear-gradient(180deg,#FBFCFE 0%,#F5F7FB 100%)" }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ padding: "24px 32px 16px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ margin: "0 0 2px", fontSize: 24, fontWeight: 800, color: T.text, letterSpacing: "-0.04em" }}>Explorer</h1>
          <p style={{ margin: 0, fontSize: 12, color: T.muted }}>
            Choisis un domaine {mode === "formations" ? "et découvre les formations post-bac." : "et découvre les métiers associés."}
          </p>
        </div>

        {/* Toggle formations / métiers */}
        <div style={{ display: "flex", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, padding: 3, gap: 2 }}>
          {[
            { key: "formations", label: "Formations" },
            { key: "metiers",    label: "Métiers" },
          ].map(({ key, label }) => {
            const active = mode === key;
            const col = key === "formations" ? C.formations : C.metiers;
            return (
              <button
                key={key}
                onClick={() => switchMode(key)}
                style={{
                  padding: "7px 16px", borderRadius: 9, border: "none", cursor: "pointer",
                  fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 700,
                  background: active ? col : "transparent",
                  color: active ? "white" : T.muted,
                  boxShadow: active ? `0 2px 8px ${col}40` : "none",
                  transition: "all 0.2s",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2 colonnes ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", gap: 0, overflow: "hidden", padding: "0 0 0 32px" }}>

        {/* ── Col 0 : Domaines ──────────────────────────────────────────── */}
        <div style={{ width: 240, flexShrink: 0, display: "flex", flexDirection: "column", paddingRight: 16 }}>
          <div style={{ flex: 1, overflowY: "auto", paddingBottom: 32 }}>
            <ColHeader label="Domaines" color={C.domaines} active={true} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {domainesList.map(d => {
                const isActive = selDomaine?.id === d.id;
                return (
                  <div
                    key={d.id}
                    onClick={() => selectDomaine(d)}
                    className="mirai-card"
                    style={{
                      padding: "10px 12px", borderRadius: 14, cursor: "pointer",
                      background: isActive ? C.domaines : T.white,
                      border: `1.5px solid ${isActive ? C.domaines : suggestedIds.has(d.id) ? "#F9A23B55" : T.border}`,
                      boxShadow: isActive ? `0 6px 18px ${C.domaines}30` : "none",
                      transition: "all 0.22s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{DOMAIN_ICONS[d.libelle] || "◉"}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: "0 0 7px", fontSize: 12, fontWeight: 700, color: isActive ? "white" : T.text, lineHeight: 1.25, letterSpacing: "-0.01em" }}>
                          {d.libelle}
                        </p>
                        <div onClick={e => e.stopPropagation()}>
                          <SaveBtn type="domaine" refId={String(d.id)} label={d.libelle} parent={null} savedItems={savedItems} onSave={saveItem} onRemove={removeItem} small />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Séparateur */}
        <div style={{ width: 1, background: selDomaine ? `${activeColor}30` : T.border, flexShrink: 0, transition: "background 0.4s", margin: "0 16px" }} />

        {/* ── Col 1 : Formations ou Métiers ─────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", paddingRight: 32 }}>

          <ColHeader
            label={mode === "formations" ? "Formations post-bac" : "Métiers"}
            count={selDomaine && !search ? items.length : selDomaine && search ? searchedItems.length : null}
            color={activeColor}
            active={!!selDomaine}
          />

          {/* Barre de recherche */}
          {selDomaine && (
            <div style={{ position: "relative", marginBottom: 12, flexShrink: 0 }}>
              <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={`Rechercher ${mode === "formations" ? "une formation" : "un métier"}…`}
                style={{ width: "100%", boxSizing: "border-box", padding: "8px 32px 8px 30px", borderRadius: 10, border: `1px solid ${search ? activeColor + "60" : T.border}`, fontSize: 12, fontFamily: "'DM Sans',sans-serif", color: T.text, outline: "none", background: T.white, transition: "border-color 0.15s" }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", cursor: "pointer", color: T.muted, fontSize: 13, lineHeight: 1, padding: 2 }}
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* Filtre par famille (formations uniquement) */}
          {mode === "formations" && selDomaine && availableFamilies.length > 1 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14, flexShrink: 0 }}>
              {["Tous", ...availableFamilies].map(fam => (
                <button
                  key={fam}
                  onClick={() => setFamilyFilter(fam)}
                  style={{
                    padding: "4px 10px", borderRadius: 999, cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
                    fontSize: 10, fontWeight: 800, transition: "all 0.15s",
                    border: `1px solid ${familyFilter === fam ? C.formations : T.border}`,
                    background: familyFilter === fam ? `${C.formations}15` : T.white,
                    color: familyFilter === fam ? C.formations : T.muted,
                  }}
                >
                  {fam}
                </button>
              ))}
            </div>
          )}

          <div style={{ flex: 1, overflowY: "auto", paddingBottom: 32 }}>
            {!selDomaine ? (
              <EmptyHint icon="🗺️" title="Sélectionne un domaine" sub={`Les ${mode === "formations" ? "formations post-bac" : "métiers"} du domaine apparaîtront ici.`} />
            ) : loading ? (
              <Spinner />
            ) : items.length === 0 ? (
              <EmptyHint icon="📭" title="Aucun résultat" sub="Ce domaine ne contient pas encore de données." />
            ) : search && searchedItems.length === 0 ? (
              <SearchFallback query={search} mode={mode} onAskMirai={() => setPage("chatbot")} />
            ) : mode === "formations" ? (
              <FormationsList
                groups={groupedFormations}
                selDomaine={selDomaine}
                savedItems={savedItems}
                onSave={saveItem}
                onRemove={removeItem}
                onAskMirai={(f) => openChat({ type: "formation", refId: f.id, label: f.libelle_complet })}
              />
            ) : (
              <MetiersList
                metiers={searchedItems}
                selDomaine={selDomaine}
                savedItems={savedItems}
                onSave={saveItem}
                onRemove={removeItem}
                onAskMirai={(m) => openChat({ type: "metier", refId: m.id, label: m.nom })}
              />
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Fallback recherche ────────────────────────────────────────────────────────

function SearchFallback({ query, mode, onAskMirai }) {
  return (
    <div style={{ padding: "32px 16px", textAlign: "center" }}>
      <div style={{ fontSize: 26, marginBottom: 12, opacity: 0.2 }}>🔍</div>
      <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700, color: T.text }}>
        Aucun résultat pour « {query} »
      </p>
      <p style={{ margin: "0 0 18px", fontSize: 12, color: T.muted, lineHeight: 1.6, maxWidth: 220, marginInline: "auto" }}>
        Ce {mode === "formations" ? "formation" : "métier"} n'est pas dans notre base de données pour ce domaine.
      </p>
      <button
        onClick={onAskMirai}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "9px 16px", borderRadius: 10, border: "none", cursor: "pointer",
          fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 700,
          background: grad, color: "white",
          boxShadow: "0 4px 14px rgba(249,162,59,0.28)",
        }}
      >
        ◈ Demander à MIRAI
      </button>
    </div>
  );
}

// ── Formations ────────────────────────────────────────────────────────────────

function FormationsList({ groups, selDomaine, savedItems, onSave, onRemove, onAskMirai }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {groups.map(({ fam, items }) => (
        <div key={fam}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: T.text, letterSpacing: "0.05em", textTransform: "uppercase" }}>{fam}</p>
            <span style={{ fontSize: 10, color: T.muted, fontWeight: 600 }}>{items.length}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {items.map(f => (
              <FormationCard
                key={f.id}
                f={f}
                selDomaine={selDomaine}
                savedItems={savedItems}
                onSave={onSave}
                onRemove={onRemove}
                onAskMirai={() => onAskMirai(f)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function FormationCard({ f, selDomaine, savedItems, onSave, onRemove, onAskMirai }) {
  return (
    <div
      className="mirai-card"
      style={{ padding: "12px 14px", borderRadius: 14, background: T.white, border: `1.5px solid ${T.border}`, cursor: "default" }}
    >
      <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: T.text, lineHeight: 1.3 }}>
        {f.libelle_complet}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
        {f.type_formation?.sigle && (
          <Pill color={C.formations} bg={`${C.formations}12`} border={`${C.formations}30`}>{f.type_formation.sigle}</Pill>
        )}
        {f.niveau_etudes && <Pill>{f.niveau_etudes}</Pill>}
        {f.duree && <Pill color={T.orange} bg={gradSoft} border="#F9A23B28">{f.duree}</Pill>}
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <SaveBtn
          type="formation"
          refId={f.id}
          label={f.libelle_complet}
          parent={selDomaine?.libelle || null}
          parentRefId={String(selDomaine?.id || "")}
          savedItems={savedItems}
          onSave={onSave}
          onRemove={onRemove}
          small
        />
        <AskMiraiBtn onClick={onAskMirai} />
        {f.url && (
          <a
            href={f.url}
            target="_blank"
            rel="noopener noreferrer"
            title="Voir sur Onisep"
            style={{ display: "inline-flex", alignItems: "center", padding: "4px 8px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, textDecoration: "none", fontSize: 10, fontWeight: 700, color: T.muted, transition: "border-color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = T.text}
            onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
          >
            ↗ Onisep
          </a>
        )}
      </div>
    </div>
  );
}

// ── Métiers ───────────────────────────────────────────────────────────────────

function MetiersList({ metiers, selDomaine, savedItems, onSave, onRemove, onAskMirai }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {metiers.map(m => (
        <MetierCard
          key={m.id}
          m={m}
          selDomaine={selDomaine}
          savedItems={savedItems}
          onSave={onSave}
          onRemove={onRemove}
          onAskMirai={() => onAskMirai(m)}
        />
      ))}
    </div>
  );
}

function MetierCard({ m, selDomaine, savedItems, onSave, onRemove, onAskMirai }) {
  const salaire = shortSalary(m.salaire_debutant);
  return (
    <div
      className="mirai-card"
      style={{ padding: "12px 14px", borderRadius: 14, background: T.white, borderLeft: `3px solid ${C.metiers}`, borderTop: `1px solid ${T.border}`, borderRight: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, cursor: "default" }}
    >
      <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: T.text, lineHeight: 1.3 }}>
        {m.nom}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
        {m.niveau_acces_min && <Pill color="#2EC99A" bg="#2EC99A12" border="#2EC99A28">{m.niveau_acces_min}</Pill>}
        {salaire && <Pill color={T.orange} bg={gradSoft} border="#F9A23B28">{salaire}</Pill>}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <SaveBtn
          type="metier"
          refId={m.id}
          label={m.nom}
          parent={selDomaine?.libelle || null}
          parentRefId={String(selDomaine?.id || "")}
          savedItems={savedItems}
          onSave={onSave}
          onRemove={onRemove}
          small
        />
        <AskMiraiBtn onClick={onAskMirai} />
      </div>
    </div>
  );
}

// ── Bouton Demander à Mirai ───────────────────────────────────────────────────

function AskMiraiBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "4px 10px", borderRadius: 8, border: "none", cursor: "pointer",
        fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700,
        background: grad, color: "white",
        boxShadow: "0 2px 8px rgba(249,162,59,0.3)",
        transition: "opacity 0.15s",
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
    >
      ◈ Demander à Mirai
    </button>
  );
}
