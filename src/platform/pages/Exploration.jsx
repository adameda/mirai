import { useEffect, useMemo, useRef, useState } from "react";
import DetailPanel from "../components/DetailPanel";
import SaveBtn from "../components/SaveBtn";
import {
  getAllDomaines,
  getAllFormations,
  getAllMetiers,
  getFormationsByDomaine,
  getMetiersForFormation,
  getSuggestedDomaines,
} from "../services/explorationService";
import { T, grad, gradSoft } from "../constants/theme";
import { useAppState } from "../hooks/useAppState";

// ── Domain metadata ───────────────────────────────────────────────────────────

const DOMAIN_ICONS = {
  "Informatique & Numérique": "💻",
  "Ingénierie & Industrie": "⚙️",
  "Énergie & Environnement": "🌱",
  "Commerce & Marketing": "📈",
  "Gestion & Finance": "💼",
  "Communication & Médias": "📡",
  "Arts & Design": "🎨",
  "Santé & Social": "🏥",
  "Sciences": "🔬",
  "Droit": "⚖️",
  "Sciences Humaines & Langues": "📚",
  "BTP & Architecture": "🏗️",
  "Hôtellerie & Tourisme": "✈️",
};

// Accent color per column (for the top progress bar)
const COL_ACCENT = {
  domaines:   "#1A2F5A",
  formations: "#F9A23B",
  metiers:    "#2EC99A",
};

const FORMATION_FAMILIES = ["BTS", "BUT", "Prépa", "Licence", "École", "Autre"];
const POURSUITE_FAMILIES = new Set(["Master", "Licence pro"]);

// ── Helpers ───────────────────────────────────────────────────────────────────

const normalizeText = (v) =>
  (v || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const shortSalary = (value) => {
  const m = `${value || ""}`.match(/\d{3,4}/g);
  if (m && m.length >= 2) return `${m[0]}–${m[1]} €/mois`;
  if (m && m.length === 1) return `≥ ${m[0]} €/mois`;
  return "Rémunération variable";
};

const getFormationFamily = (f) => {
  const sigle   = normalizeText(f?.type_formation?.sigle || f?.type_formation?.libelle_court || "");
  const libelle = normalizeText(f?.type_formation?.libelle || "");
  if (sigle.includes("bts")) return "BTS";
  if (sigle.includes("but")) return "BUT";
  if (
    sigle.includes("cpge") || sigle.includes("prepa") || sigle.includes("prépa") ||
    libelle.includes("classe preparatoire") || libelle.includes("classe préparatoire")
  ) return "Prépa";
  if (sigle.includes("licence pro") || libelle.includes("licence professionnelle")) return "Licence pro";
  if (sigle.includes("licence") && !sigle.includes("pro")) return "Licence";
  if (sigle.includes("master") || libelle.includes("master")) return "Master";
  if (
    libelle.includes("ecole") || sigle.includes("ecole") ||
    libelle.includes("diplome d'ingenieur") ||
    libelle.includes("grade de master") ||
    libelle.includes("bachelor en sciences")
  ) return "École";
  return "Autre";
};

const matchesNeedle = (fields, needle) =>
  !needle || fields.some((f) => normalizeText(f).includes(needle));

// ── Micro-components ──────────────────────────────────────────────────────────

const Pill = ({ children, tone = "neutral" }) => {
  const s = {
    neutral: { color: T.muted,   bg: T.bg,    border: T.border     },
    accent:  { color: T.orange,  bg: gradSoft, border: "#F9A23B28" },
    success: { color: T.success, bg: "#2EC99A12", border: "#2EC99A28" },
  }[tone] || { color: T.muted, bg: T.bg, border: T.border };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 8px", borderRadius: 999, border: `1px solid ${s.border}`, background: s.bg, color: s.color, fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
};

const EmptyHint = ({ icon, title, sub }) => (
  <div style={{ padding: "32px 16px", textAlign: "center" }}>
    <div style={{ fontSize: 26, marginBottom: 10, opacity: 0.28 }}>{icon}</div>
    <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: T.text }}>{title}</p>
    {sub && <p style={{ margin: 0, fontSize: 12, color: T.muted, lineHeight: 1.6 }}>{sub}</p>}
  </div>
);

// Column header with accent bar + optional connector arrow
const ColHeader = ({ label, count, accent, active, showConnector }) => (
  <div style={{ marginBottom: 14 }}>
    {/* Accent bar — full width, height 3px, lights up when active */}
    <div style={{ height: 3, borderRadius: 99, background: active ? accent : T.border, marginBottom: 10, transition: "background 0.3s" }} />
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {showConnector && (
        <span style={{ fontSize: 14, color: accent, opacity: active ? 1 : 0, transition: "opacity 0.3s", marginRight: 2 }}>›</span>
      )}
      <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: active ? T.text : T.muted, letterSpacing: "0.12em", textTransform: "uppercase", transition: "color 0.2s" }}>
        {label}
      </p>
      {count != null && (
        <Pill>{count}</Pill>
      )}
    </div>
  </div>
);

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Exploration() {
  const { answers, savedItems, saveItem, removeItem, setPage } = useAppState();

  // ── Data ────────────────────────────────────────────────────────────────────
  const [allDomaines,      setAllDomaines]      = useState([]);
  const [suggested,        setSuggested]         = useState([]);
  const [selDomaine,       setSelDomaine]        = useState(null);
  const [domainFormations, setDomainFormations]  = useState([]);
  const [selFormation,     setSelFormation]      = useState(null);
  const [metiers,          setMetiers]           = useState([]);
  const [selMetier,        setSelMetier]         = useState(null);

  // Lazy search
  const [allFormations, setAllFormations] = useState(null);
  const [allMetiers,    setAllMetiers]    = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchLoadedRef = useRef(false);

  // ── UI ──────────────────────────────────────────────────────────────────────
  const [searchQuery,     setSearchQuery]     = useState("");
  const [formationFamily, setFormationFamily] = useState("Tous");
  const [chatOpen,        setChatOpen]        = useState(false);
  const [chatMsg,         setChatMsg]         = useState("Pose une question quand tu veux. Je t'aide à clarifier un domaine, une formation ou un métier.");
  const [chatInput,       setChatInput]       = useState("");
  const [detailItem,      setDetailItem]      = useState(null);

  // ── Effects ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    getSuggestedDomaines(answers?.domaines).then(setSuggested);
    getAllDomaines().then(setAllDomaines);
  }, [answers]);

  useEffect(() => {
    if (!selDomaine) { setDomainFormations([]); return; }
    getFormationsByDomaine(selDomaine.id).then(setDomainFormations);
  }, [selDomaine]);

  useEffect(() => {
    if (!selFormation) { setMetiers([]); return; }
    getMetiersForFormation(selFormation.id).then(setMetiers);
  }, [selFormation]);

  useEffect(() => {
    if (!searchQuery || searchLoadedRef.current) return;
    searchLoadedRef.current = true;
    setSearchLoading(true);
    Promise.all([getAllFormations(), getAllMetiers()]).then(([f, m]) => {
      setAllFormations(f);
      setAllMetiers(m);
      setSearchLoading(false);
    });
  }, [searchQuery]);

  // ── Derived ─────────────────────────────────────────────────────────────────

  const suggestedIds = useMemo(() => new Set(suggested.map((d) => d.id)), [suggested]);

  const domainesList = useMemo(() => {
    const extra = allDomaines.filter((d) => !suggestedIds.has(d.id));
    return [...suggested, ...extra];
  }, [allDomaines, suggested, suggestedIds]);

  const hasSearch = searchQuery.trim().length > 0;
  const needle    = normalizeText(searchQuery);

  const visibleDomaines = useMemo(() => {
    if (!hasSearch) return domainesList;
    return domainesList.filter((d) => matchesNeedle([d.libelle], needle));
  }, [domainesList, hasSearch, needle]);

  const visibleFormations = useMemo(() => {
    const base = hasSearch
      ? (allFormations || [])
      : domainFormations.filter((f) => !POURSUITE_FAMILIES.has(getFormationFamily(f)));

    return base.filter((f) => {
      const famOk   = formationFamily === "Tous" || getFormationFamily(f) === formationFamily;
      const matchOk = matchesNeedle([f.libelle_complet, f.libelle_generique, f.type_formation?.sigle, f.niveau_etudes], needle);
      return famOk && matchOk;
    });
  }, [allFormations, domainFormations, formationFamily, hasSearch, needle]);

  const visibleMetiers = useMemo(() => {
    const source = hasSearch ? (allMetiers || []) : metiers;
    return source
      .filter((m) => matchesNeedle([m.nom, m.secteurs_activite?.[0]?.libelle, m.niveau_acces_min], needle))
      .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  }, [allMetiers, hasSearch, metiers, needle]);

  const groupedFormations = useMemo(() => {
    const buckets = new Map();
    visibleFormations.forEach((f) => {
      const fam = getFormationFamily(f);
      if (!buckets.has(fam)) buckets.set(fam, []);
      buckets.get(fam).push(f);
    });
    const ordered = [...FORMATION_FAMILIES, "Licence pro", "Master"];
    return ordered
      .map((fam) => ({ fam, items: (buckets.get(fam) || []).sort((a, b) => a.libelle_complet.localeCompare(b.libelle_complet, "fr")) }))
      .filter((g) => g.items.length > 0);
  }, [visibleFormations]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const selectDomaine = (d) => {
    setSelDomaine(d);
    setSelFormation(null);
    setSelMetier(null);
    setFormationFamily("Tous");
    setChatMsg(`Tu explores "${d.libelle}". Sélectionne une formation pour voir les débouchés.`);
  };

  const selectFormation = (f) => {
    setSelFormation(f);
    setSelMetier(null);
    setChatMsg(`"${f.libelle_complet}" est ouverte. Je peux t'aider à comparer ou mieux comprendre cette voie.`);
  };

  const selectMetier = (m) => {
    setSelMetier(m);
    setChatMsg(`Tu regardes le métier de **${m.nom}**. Pose-moi une question sur ce métier, son accès, son salaire ou ses formations.`);
  };

  const askMirai = (contextFn) => { contextFn(); setChatOpen(true); };

  const clearDomaine = () => {
    setSelDomaine(null); setSelFormation(null); setSelMetier(null);
    setDomainFormations([]); setMetiers([]); setFormationFamily("Tous");
  };

  const clearFormation = () => {
    setSelFormation(null); setSelMetier(null); setMetiers([]);
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    setChatMsg(`${chatInput} — Recherche en cours…`);
    setChatInput("");
  };

  // ── Breadcrumb ───────────────────────────────────────────────────────────────

  const Breadcrumb = () => {
    if (!selDomaine && !hasSearch) return null;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        <button onClick={clearDomaine} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 12, color: T.muted, fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>
          Explorer
        </button>
        {selDomaine && (
          <>
            <span style={{ color: T.mutedLight, fontSize: 12 }}>›</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px 3px 8px", borderRadius: 99, background: T.navyMid, color: "white", fontSize: 11, fontWeight: 700 }}>
              {DOMAIN_ICONS[selDomaine.libelle] || "◉"} {selDomaine.libelle}
              <button onClick={(e) => { e.stopPropagation(); clearDomaine(); }} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.55)", fontSize: 11, padding: "0 0 0 4px", lineHeight: 1, fontFamily: "'DM Sans',sans-serif" }}>✕</button>
            </span>
          </>
        )}
        {selFormation && (
          <>
            <span style={{ color: T.mutedLight, fontSize: 12 }}>›</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px 3px 8px", borderRadius: 99, background: T.orange + "20", border: `1px solid ${T.orange}40`, color: T.orange, fontSize: 11, fontWeight: 700 }}>
              {selFormation.type_formation?.sigle || "Formation"} · {selFormation.libelle_generique || selFormation.libelle_complet}
              <button onClick={(e) => { e.stopPropagation(); clearFormation(); }} style={{ background: "none", border: "none", cursor: "pointer", color: T.orange, opacity: 0.55, fontSize: 11, padding: "0 0 0 4px", lineHeight: 1, fontFamily: "'DM Sans',sans-serif" }}>✕</button>
            </span>
          </>
        )}
      </div>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden", fontFamily: "'DM Sans',sans-serif", background: "linear-gradient(180deg, #FBFCFE 0%, #F5F7FB 100%)" }}>

      {detailItem && (
        <DetailPanel
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onSave={saveItem}
          onRemove={removeItem}
          savedItems={savedItems}
          onAskMirai={() => setPage("chatbot")}
        />
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: "28px 28px 28px 40px", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 800, color: T.text, letterSpacing: "-0.04em" }}>Explorer</h1>
          <p style={{ margin: 0, fontSize: 13, color: T.muted }}>
            Sélectionne un domaine, puis une formation pour voir les débouchés métiers.
          </p>
        </div>

        {/* Search */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 20 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: T.muted, fontSize: 14, pointerEvents: "none" }}>⌕</span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tu cherches un métier ou une formation précise ?"
              style={{ width: "100%", padding: "12px 14px 12px 36px", borderRadius: 14, border: `1px solid ${T.border}`, background: T.white, color: T.text, fontSize: 13, outline: "none", fontFamily: "'DM Sans',sans-serif", boxShadow: "0 4px 16px rgba(15,31,61,0.04)", boxSizing: "border-box" }}
            />
          </div>
          {hasSearch && (
            <button onClick={() => setSearchQuery("")} style={{ padding: "11px 14px", borderRadius: 12, border: `1px solid ${T.border}`, background: T.bg, color: T.muted, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
              Effacer
            </button>
          )}
        </div>

        <Breadcrumb />

        {/* ── 3-column layout ───────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "220px minmax(0, 1.3fr) minmax(0, 1fr)", gap: 20, alignItems: "start", flex: 1 }}>

          {/* ── Col 1 : Domaines ──────────────────────────────────────────── */}
          <section>
            <ColHeader
              label="Domaines"
              count={hasSearch ? visibleDomaines.length : null}
              accent={COL_ACCENT.domaines}
              active={true}
            />

            {visibleDomaines.length === 0 ? (
              <EmptyHint icon="🔍" title="Aucun domaine" sub="Essaie un autre mot-clé." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {visibleDomaines.map((d) => {
                  const isSugg   = suggestedIds.has(d.id);
                  const isActive = selDomaine?.id === d.id;
                  const isDimmed = selDomaine && !isActive;
                  return (
                    <div
                      key={d.id}
                      onClick={() => selectDomaine(d)}
                      className={`mirai-card${isDimmed ? " mirai-card-dimmed" : ""}`}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 14,
                        cursor: "pointer",
                        background: isActive ? T.navyMid : T.white,
                        border: `1.5px solid ${isActive ? T.navyMid : isSugg ? "#F9A23B55" : T.border}`,
                        boxShadow: isActive ? "0 8px 22px rgba(15,31,61,0.15)" : isSugg ? "0 2px 10px rgba(249,162,59,0.08)" : "none",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                        <span style={{ fontSize: 17, flexShrink: 0, marginTop: 1 }}>{DOMAIN_ICONS[d.libelle] || "◉"}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: isActive ? "white" : T.text, lineHeight: 1.25, letterSpacing: "-0.01em" }}>
                            {d.libelle}
                          </p>
                          <div onClick={(e) => e.stopPropagation()}>
                            <SaveBtn
                              type="domaine"
                              refId={String(d.id)}
                              label={d.libelle}
                              parent={null}
                              savedItems={savedItems}
                              onSave={saveItem}
                              onRemove={removeItem}
                              small
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── Col 2 : Formations ────────────────────────────────────────── */}
          <section>
            <ColHeader
              label="Formations"
              count={(selDomaine || hasSearch) ? visibleFormations.length : null}
              accent={COL_ACCENT.formations}
              active={!!(selDomaine || hasSearch)}
              showConnector={!!(selDomaine || hasSearch)}
            />

            {!selDomaine && !hasSearch ? (
              <EmptyHint icon="🎓" title="Sélectionne un domaine" sub="Les formations post-bac apparaîtront ici, regroupées par type (BTS, BUT, Prépa, Licence…)" />
            ) : searchLoading ? (
              <p style={{ fontSize: 12, color: T.muted, padding: "16px 0" }}>Chargement…</p>
            ) : (
              <>
                {/* Family filter pills */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                  {["Tous", ...FORMATION_FAMILIES].map((fam) => (
                    <button
                      key={fam}
                      onClick={() => setFormationFamily(fam)}
                      style={{ padding: "5px 10px", borderRadius: 999, border: `1px solid ${formationFamily === fam ? T.orange : T.border}`, background: formationFamily === fam ? gradSoft : T.white, color: formationFamily === fam ? T.orange : T.muted, fontSize: 10, fontWeight: 800, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s" }}
                    >
                      {fam}
                    </button>
                  ))}
                </div>

                {groupedFormations.length === 0 ? (
                  <EmptyHint icon="📭" title="Aucune formation trouvée" sub="Essaie un autre filtre ou mot-clé." />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {groupedFormations.map(({ fam, items }) => (
                      <div key={fam}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: T.text }}>{fam}</p>
                          <Pill>{items.length}</Pill>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                          {items.map((f) => {
                            const isActive = selFormation?.id === f.id;
                            const isDimmed = selFormation && !isActive;
                            return (
                              <div
                                key={f.id}
                                onClick={() => selectFormation(f)}
                                className={`mirai-card${isDimmed ? " mirai-card-dimmed" : ""}`}
                                style={{
                                  padding: "12px 14px",
                                  borderRadius: 14,
                                  cursor: "pointer",
                                  background: isActive ? T.navyMid : T.white,
                                  border: `1px solid ${isActive ? T.navyMid : T.border}`,
                                  boxShadow: isActive ? "0 8px 22px rgba(15,31,61,0.15)" : "none",
                                }}
                              >
                                <p style={{ margin: "0 0 7px", fontSize: 12, fontWeight: 700, color: isActive ? "white" : T.text, lineHeight: 1.35 }}>
                                  {f.libelle_complet}
                                </p>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
                                  {f.type_formation?.sigle && <Pill tone={isActive ? "accent" : "neutral"}>{f.type_formation.sigle}</Pill>}
                                  {f.niveau_etudes && <Pill tone="neutral">{f.niveau_etudes}</Pill>}
                                  {f.duree && <Pill tone={isActive ? "success" : "neutral"}>{f.duree}</Pill>}
                                </div>
                                <div style={{ display: "flex", gap: 6 }} onClick={(e) => e.stopPropagation()}>
                                  <SaveBtn
                                    type="formation" refId={f.id} label={f.libelle_complet}
                                    parent={selDomaine?.libelle || f.domaines?.[0]?.libelle || null}
                                    parentRefId={String(selDomaine?.id || f.domaines?.[0]?.id || "")}
                                    savedItems={savedItems} onSave={saveItem} onRemove={removeItem} small
                                  />
                                  <button
                                    onClick={() => setDetailItem({ type: "formation", refId: f.id, label: f.libelle_complet, domaine: selDomaine?.libelle || f.domaines?.[0]?.libelle || null })}
                                    style={{ display: "inline-flex", alignItems: "center", padding: "4px 9px", borderRadius: 9, border: `1px solid ${isActive ? "rgba(255,255,255,0.22)" : T.border}`, background: isActive ? "rgba(255,255,255,0.08)" : T.bg, cursor: "pointer", fontSize: 10, fontWeight: 700, color: isActive ? "rgba(255,255,255,0.75)" : T.muted, fontFamily: "'DM Sans',sans-serif" }}
                                  >
                                    Détails
                                  </button>
                                  <button
                                    onClick={() => askMirai(() => selectFormation(f))}
                                    style={{ display: "inline-flex", alignItems: "center", padding: "4px 9px", borderRadius: 9, border: `1px solid ${isActive ? "rgba(255,255,255,0.22)" : T.border}`, background: isActive ? "rgba(255,255,255,0.08)" : T.bg, cursor: "pointer", fontSize: 10, fontWeight: 700, color: isActive ? "rgba(255,255,255,0.75)" : T.muted, fontFamily: "'DM Sans',sans-serif" }}
                                  >
                                    ◈ Demander
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>

          {/* ── Col 3 : Métiers ───────────────────────────────────────────── */}
          <section>
            <ColHeader
              label="Métiers"
              count={(selFormation || hasSearch) ? visibleMetiers.length : null}
              accent={COL_ACCENT.metiers}
              active={!!(selFormation || hasSearch)}
              showConnector={!!(selFormation || hasSearch)}
            />

            {!selFormation && !hasSearch ? (
              <EmptyHint icon="💼" title="Sélectionne une formation" sub="Tu verras les débouchés métiers associés à cette voie." />
            ) : searchLoading ? (
              <p style={{ fontSize: 12, color: T.muted, padding: "16px 0" }}>Chargement…</p>
            ) : visibleMetiers.length === 0 ? (
              <EmptyHint icon="📭" title="Aucun métier trouvé" sub="Essaie un autre mot-clé ou une autre formation." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {visibleMetiers.map((m) => {
                  const secteur  = m.secteurs_activite?.[0]?.libelle;
                  const isActive = selMetier?.id === m.id;
                  const isDimmed = selMetier && !isActive;
                  return (
                    <div
                      key={m.id}
                      onClick={() => selectMetier(m)}
                      className={`mirai-card${isDimmed ? " mirai-card-dimmed" : ""}`}
                      style={{
                        padding: "12px 14px",
                        borderRadius: 14,
                        cursor: "pointer",
                        background: isActive ? gradSoft : T.white,
                        // Accent left border — differentiates métiers from formations
                        borderLeft: `3px solid ${isActive ? T.orange : COL_ACCENT.metiers + "55"}`,
                        borderTop: `1px solid ${isActive ? T.orange + "50" : T.border}`,
                        borderRight: `1px solid ${isActive ? T.orange + "50" : T.border}`,
                        borderBottom: `1px solid ${isActive ? T.orange + "50" : T.border}`,
                        boxShadow: isActive ? "0 6px 18px rgba(249,162,59,0.12)" : "none",
                      }}
                    >
                      <p style={{ margin: "0 0 7px", fontSize: 13, fontWeight: 700, color: T.text, lineHeight: 1.3 }}>
                        {m.nom}
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
                        {secteur && <Pill tone="accent">{secteur}</Pill>}
                        {m.niveau_acces_min && <Pill tone="success">{m.niveau_acces_min}</Pill>}
                        <Pill tone="neutral">{shortSalary(m.salaire_debutant)}</Pill>
                      </div>
                      <div style={{ display: "flex", gap: 6 }} onClick={(e) => e.stopPropagation()}>
                        <SaveBtn
                          type="metier" refId={m.id} label={m.nom}
                          parent={selFormation?.libelle_complet || null}
                          parentRefId={selFormation?.id || null}
                          savedItems={savedItems} onSave={saveItem} onRemove={removeItem} small
                        />
                        <button
                          onClick={() => setDetailItem({ type: "metier", refId: m.id, label: m.nom, formation: selFormation?.libelle_complet || null, formationId: selFormation?.id || null })}
                          style={{ display: "inline-flex", alignItems: "center", padding: "4px 9px", borderRadius: 9, border: `1px solid ${T.border}`, background: T.bg, cursor: "pointer", fontSize: 10, fontWeight: 700, color: T.muted, fontFamily: "'DM Sans',sans-serif" }}
                        >
                          Détails
                        </button>
                        <button
                          onClick={() => askMirai(() => selectMetier(m))}
                          style={{ display: "inline-flex", alignItems: "center", padding: "4px 9px", borderRadius: 9, border: `1px solid ${T.border}`, background: T.bg, cursor: "pointer", fontSize: 10, fontWeight: 700, color: T.muted, fontFamily: "'DM Sans',sans-serif" }}
                        >
                          ◈ Demander
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

        </div>
      </div>

      {/* ── Chatbot panel ─────────────────────────────────────────────────────── */}
      {chatOpen && (
        <div style={{ width: 272, flexShrink: 0, background: T.white, borderLeft: `1px solid ${T.border}`, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 9, background: grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "white" }}>◈</div>
              <div>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: T.text }}>Agent MIRAI</p>
                <p style={{ margin: 0, fontSize: 10, color: T.muted }}>
                  {selMetier
                    ? `Métier · ${selMetier.nom}`
                    : selFormation
                    ? `Formation · ${selFormation.type_formation?.sigle || "?"}`
                    : selDomaine
                    ? `Domaine · ${selDomaine.libelle}`
                    : "Exploration"}
                </p>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: T.muted, padding: 4 }}>✕</button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 8px" }}>
            <div style={{ background: T.bg, borderRadius: 13, padding: "11px 13px", fontSize: 12, color: T.text, lineHeight: 1.65 }}>
              {chatMsg.split("**").map((part, i) =>
                i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
              )}
            </div>
            <div style={{ marginTop: 9, display: "flex", flexDirection: "column", gap: 6 }}>
              {(selMetier
                ? ["Comment y accéder ?", "Quel salaire en sortie ?", "Quelles qualités faut-il ?"]
                : selFormation
                ? ["Quels sont les débouchés ?", "C'est sélectif ?", "Salaire en sortie ?"]
                : ["Par où commencer ?", "Quel domaine me correspond ?", "Différence BTS / BUT ?"]
              ).map((q) => (
                <div key={q} onClick={() => setChatMsg(`Sur "${q.toLowerCase()}", voici ce que je sais…`)} style={{ padding: "7px 11px", borderRadius: 9, border: `1px solid ${T.border}`, fontSize: 11, color: T.muted, cursor: "pointer", background: T.bg }}>
                  {q}
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: "11px 14px", borderTop: `1px solid ${T.border}`, display: "flex", gap: 7 }}>
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") sendChat(); }}
              placeholder="Ta question…"
              style={{ flex: 1, padding: "8px 11px", borderRadius: 9, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: "'DM Sans',sans-serif", color: T.text, outline: "none", background: T.bg }}
            />
            <button onClick={sendChat} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: grad, cursor: "pointer", color: "white", fontSize: 12, flexShrink: 0 }}>→</button>
          </div>
        </div>
      )}

      {/* Pulsing chatbot trigger */}
      {!chatOpen && (
        <button
          className="mirai-chatbot-pulse"
          onClick={() => setChatOpen(true)}
          style={{ position: "fixed", bottom: 28, right: 28, width: 48, height: 48, borderRadius: "50%", border: "none", background: grad, color: "white", fontSize: 18, cursor: "pointer", boxShadow: "0 6px 20px rgba(249,162,59,0.45)", zIndex: 100 }}
        >
          ◈
        </button>
      )}
    </div>
  );
}
