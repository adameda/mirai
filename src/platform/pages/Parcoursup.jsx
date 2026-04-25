import { useEffect, useRef, useState } from "react";
import { T, grad, gradSoft } from "../constants/theme";
import { getFiltres, getSpecialitesForAgregee, searchFormations } from "../services/parcoursupService";

// ── Helpers ───────────────────────────────────────────────────────────────────

const pct = (v) => (v != null ? `${Math.round(v)}%` : null);

const tauxMeta = (t) => {
  if (t == null) return { color: T.muted, bg: T.border, label: "—" };
  if (t >= 70)   return { color: "#2EC99A", bg: "#2EC99A14", label: `${Math.round(t)}%` };
  if (t >= 40)   return { color: T.orange,  bg: "#F9A23B14", label: `${Math.round(t)}%` };
  return           { color: "#F4736A",  bg: "#F4736A14", label: `${Math.round(t)}%` };
};

const SELECTIVITE_LABELS = {
  "formation sélective":     { label: "Sélective",     color: "#F4736A", bg: "#F4736A12" },
  "formation non sélective": { label: "Non sélective", color: "#2EC99A", bg: "#2EC99A12" },
};

const SORT_OPTIONS = [
  { value: "etablissement",   label: "Établissement A → Z" },
  { value: "taux_acces_desc", label: "Taux d'accès (élevé → faible)" },
  { value: "taux_acces_asc",  label: "Taux d'accès (faible → élevé)" },
  { value: "capacite",        label: "Capacité (grande → petite)" },
];

// Nom affiché en titre de carte
function formationTitle(f) {
  if (f.filiere_specialite) return f.filiere_specialite;
  if (f.filiere_type)       return f.filiere_type;
  return f.filiere_agregee || "Formation";
}

// ── Composants utilitaires ────────────────────────────────────────────────────

const Tag = ({ label, color = T.muted, bg = T.border }) => (
  <span style={{
    display: "inline-flex", alignItems: "center",
    padding: "3px 9px", borderRadius: 999,
    background: bg, color, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
  }}>
    {label}
  </span>
);

function FilterSelect({ value, onChange, options, placeholder, disabled = false }) {
  const active = !!value;
  return (
    <div style={{ position: "relative", flex: "1 1 160px", minWidth: 140 }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        style={{
          width: "100%", appearance: "none", WebkitAppearance: "none",
          padding: "10px 32px 10px 13px", borderRadius: 11,
          border: `1.5px solid ${active ? T.orange + "90" : T.border}`,
          fontSize: 12, fontFamily: "'DM Sans',sans-serif",
          color: active ? T.text : T.muted, fontWeight: active ? 700 : 400,
          background: active ? gradSoft : T.white,
          outline: "none", cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.45 : 1, transition: "all 0.18s",
        }}
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <svg style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
        width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  );
}

// ── Carte formation ───────────────────────────────────────────────────────────

function FormationCard({ f }) {
  const [expanded, setExpanded] = useState(false);
  const taux   = tauxMeta(f.taux_acces);
  const selMeta = SELECTIVITE_LABELS[f.selectivite] || null;
  const title  = formationTitle(f);
  const hasStats = f.pct_admis_bg != null || f.pct_boursiers != null
    || f.pct_mention_tb != null || f.nb_candidats != null;

  return (
    <div style={{
      background: T.white, borderRadius: 18,
      border: `1.5px solid ${T.border}`,
      overflow: "hidden", transition: "box-shadow 0.2s",
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 6px 24px rgba(15,31,61,0.08)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
    >
      {/* ── Corps principal ─────────────────────────────── */}
      <div style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>

          {/* Contenu gauche */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Type */}
            <p style={{ margin: "0 0 5px", fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {f.filiere_agregee}{f.filiere_type && f.filiere_type !== f.filiere_agregee ? ` · ${f.filiere_type}` : ""}
            </p>

            {/* Titre formation */}
            <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 800, color: T.text, letterSpacing: "-0.02em", lineHeight: 1.3 }}>
              {title}
            </h3>

            {/* École */}
            <p style={{ margin: "0 0 10px", fontSize: 12, color: T.muted, fontWeight: 500 }}>
              {f.etablissement}
            </p>

            {/* Localisation */}
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 12 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T.mutedLight} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              <span style={{ fontSize: 11, color: T.muted }}>
                {[f.commune, f.departement, f.region].filter(Boolean).join(" · ")}
              </span>
            </div>

            {/* Tags */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {selMeta && <Tag label={selMeta.label} color={selMeta.color} bg={selMeta.bg} />}
              {f.statut && <Tag label={f.statut.includes("public") ? "Public" : f.statut.includes("rivé") ? "Privé" : f.statut} />}
              {f.capacite && <Tag label={`${f.capacite} places`} />}
            </div>
          </div>

          {/* Badge taux d'accès */}
          <div style={{
            flexShrink: 0, width: 64, height: 64, borderRadius: 16,
            background: taux.bg, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 1,
          }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: taux.color, lineHeight: 1 }}>
              {taux.label}
            </span>
            <span style={{ fontSize: 8, fontWeight: 700, color: taux.color, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {f.taux_acces != null ? "taux accès" : "non comm."}
            </span>
          </div>
        </div>
      </div>

      {/* ── Stats dépliables ────────────────────────────── */}
      {expanded && hasStats && (
        <div style={{ padding: "0 20px 16px", borderTop: `1px solid ${T.border}`, paddingTop: 14 }}>
          <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Profil des admis
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

            {/* Bac */}
            {(f.pct_admis_bg != null || f.pct_admis_bt != null || f.pct_admis_bp != null) && (
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {f.pct_admis_bg != null && <StatItem label="Bac général" value={pct(f.pct_admis_bg)} color={T.text} />}
                {f.pct_admis_bt != null && <StatItem label="Bac techno"  value={pct(f.pct_admis_bt)} color={T.text} />}
                {f.pct_admis_bp != null && <StatItem label="Bac pro"     value={pct(f.pct_admis_bp)} color={T.text} />}
              </div>
            )}

            {/* Mentions */}
            {(f.pct_mention_ab != null || f.pct_mention_b != null || f.pct_mention_tb != null || f.pct_mention_tbf != null) && (
              <div>
                <p style={{ margin: "0 0 5px", fontSize: 10, color: T.muted, fontWeight: 600 }}>Mentions au bac</p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {f.pct_mention_ab  != null && <MentionBadge label="AB"  value={f.pct_mention_ab}  color="#8A9BB5" />}
                  {f.pct_mention_b   != null && <MentionBadge label="B"   value={f.pct_mention_b}   color={T.orange} />}
                  {f.pct_mention_tb  != null && <MentionBadge label="TB"  value={f.pct_mention_tb}  color="#2EC99A" />}
                  {f.pct_mention_tbf != null && <MentionBadge label="TBF" value={f.pct_mention_tbf} color="#2EC99A" />}
                </div>
              </div>
            )}

            {/* Boursiers + candidats */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {f.pct_boursiers  != null && <StatItem label="Boursiers" value={pct(f.pct_boursiers)} />}
              {f.pct_admis_filles != null && <StatItem label="Femmes"  value={pct(f.pct_admis_filles)} />}
              {f.nb_candidats   != null && <StatItem label="Candidats" value={f.nb_candidats.toLocaleString("fr-FR")} />}
              {f.nb_admis       != null && <StatItem label="Admis"     value={f.nb_admis.toLocaleString("fr-FR")} />}
            </div>
          </div>
        </div>
      )}

      {/* ── Pied de carte ───────────────────────────────── */}
      <div style={{
        padding: "12px 20px", borderTop: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
        background: "#FAFBFD",
      }}>
        {hasStats ? (
          <button
            onClick={() => setExpanded(v => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "6px 12px", borderRadius: 9,
              border: `1px solid ${T.border}`, background: T.white,
              fontSize: 11, fontWeight: 700, color: T.muted,
              cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
              transition: "all 0.15s",
            }}
          >
            <svg style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
              width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
            {expanded ? "Réduire" : "Voir les stats"}
          </button>
        ) : <div />}

        {f.lien_parcoursup && (
          <a
            href={f.lien_parcoursup} target="_blank" rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "7px 14px", borderRadius: 9,
              background: grad, color: "white",
              textDecoration: "none", fontSize: 11, fontWeight: 700,
              fontFamily: "'DM Sans',sans-serif",
              boxShadow: "0 3px 10px rgba(249,162,59,0.25)",
            }}
          >
            Voir sur Parcoursup ↗
          </a>
        )}
      </div>
    </div>
  );
}

const StatItem = ({ label, value, color = T.muted }) => (
  <div>
    <span style={{ fontSize: 14, fontWeight: 800, color: color || T.text }}>{value}</span>
    {" "}
    <span style={{ fontSize: 11, color: T.muted }}>{label}</span>
  </div>
);

const MentionBadge = ({ label, value, color }) => (
  <div style={{
    padding: "4px 10px", borderRadius: 8,
    background: `${color}14`, border: `1px solid ${color}30`,
    display: "flex", alignItems: "center", gap: 5,
  }}>
    <span style={{ fontSize: 10, fontWeight: 800, color }}>{label}</span>
    <span style={{ fontSize: 11, fontWeight: 700, color: T.text }}>{Math.round(value)}%</span>
  </div>
);

// ── État vide / guidé ─────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div style={{ padding: "60px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
      <div style={{
        width: 64, height: 64, borderRadius: 20, background: gradSoft,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 26, marginBottom: 20,
      }}>
        🎓
      </div>
      <p style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 800, color: T.text, letterSpacing: "-0.02em" }}>
        Trouve ta formation
      </p>
      <p style={{ margin: 0, fontSize: 13, color: T.muted, textAlign: "center", lineHeight: 1.65, maxWidth: 320 }}>
        Utilise les filtres ci-dessus pour explorer les 14 252 formations disponibles sur Parcoursup — filière, région, sélectivité ou recherche libre.
      </p>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function Parcoursup() {
  const [filtres, setFiltres]     = useState({ filieres_agregees: [], filieres_types: [], regions: [], selectivites: [] });
  const [subTypes, setSubTypes]   = useState([]);
  const [results, setResults]     = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(false);
  const [searched, setSearched]   = useState(false);
  const [offset, setOffset]       = useState(0);
  const LIMIT = 40;

  const [q,           setQ]           = useState("");
  const [agregee,     setAgregee]     = useState("");
  const [filiereType, setFiliereType] = useState("");
  const [region,      setRegion]      = useState("");
  const [selectivite, setSelectivite] = useState("");
  const [sortBy,      setSortBy]      = useState("etablissement");

  const debounceRef = useRef(null);

  useEffect(() => { getFiltres().then(setFiltres); }, []);

  // Sous-types en cascade
  useEffect(() => {
    setFiliereType("");
    if (!agregee) { setSubTypes([]); return; }
    getSpecialitesForAgregee(agregee).then(setSubTypes);
  }, [agregee]);

  // Déclenchement de la recherche
  useEffect(() => {
    const hasFilter = q || agregee || filiereType || region || selectivite;
    if (!hasFilter) { setResults([]); setTotal(0); setSearched(false); return; }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearched(true);
      setOffset(0);
      load(0);
    }, q ? 350 : 0);
    return () => clearTimeout(debounceRef.current);
  }, [q, agregee, filiereType, region, selectivite, sortBy]);

  useEffect(() => {
    if (offset > 0) load(offset);
  }, [offset]);

  const load = (off) => {
    setLoading(true);
    searchFormations({ q, filiere_agregee: agregee, filiere_type: filiereType, region, selectivite, sort_by: sortBy, limit: LIMIT, offset: off })
      .then(data => {
        setTotal(data.total);
        setResults(off === 0 ? data.items : prev => [...prev, ...data.items]);
      })
      .finally(() => setLoading(false));
  };

  const reset = () => {
    setQ(""); setAgregee(""); setFiliereType(""); setRegion(""); setSelectivite("");
    setSortBy("etablissement"); setResults([]); setTotal(0); setSearched(false);
  };

  const hasFilters = q || agregee || filiereType || region || selectivite;
  const hasMore    = results.length < total;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "'DM Sans',sans-serif", background: T.bg }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ background: T.white, borderBottom: `1px solid ${T.border}`, padding: "22px 32px 18px", flexShrink: 0 }}>
        <div style={{ marginBottom: 16 }}>
          <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Session 2025 · 14 252 formations
          </p>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: "-0.03em" }}>
            Parcoursup
          </h1>
        </div>

        {/* Ligne 1 : barre de recherche seule */}
        <div style={{ position: "relative", marginBottom: 8 }}>
          <svg style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={q} onChange={e => setQ(e.target.value)}
            placeholder="Recherche par école, formation, ville…"
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "11px 36px 11px 36px", borderRadius: 12,
              border: `1.5px solid ${q ? T.orange + "90" : T.border}`,
              fontSize: 13, fontFamily: "'DM Sans',sans-serif", color: T.text,
              outline: "none", background: T.white, transition: "border-color 0.18s",
            }}
          />
          {q && (
            <button onClick={() => setQ("")}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", cursor: "pointer", color: T.muted, fontSize: 14, padding: 2 }}>
              ✕
            </button>
          )}
        </div>

        {/* Ligne 2 : tous les filtres */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <FilterSelect value={agregee}     onChange={setAgregee}     options={filtres.filieres_agregees} placeholder="Filière" />
          <FilterSelect value={filiereType} onChange={setFiliereType} options={subTypes}                  placeholder="Spécialité" disabled={!agregee} />
          <FilterSelect value={region}      onChange={setRegion}      options={filtres.regions}           placeholder="Région" />
          <FilterSelect value={selectivite} onChange={setSelectivite} options={filtres.selectivites}      placeholder="Sélectivité" />

          <select
            value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{
              flex: "1 1 150px", minWidth: 140, padding: "10px 13px", borderRadius: 11,
              border: `1.5px solid ${T.border}`, fontSize: 12,
              fontFamily: "'DM Sans',sans-serif", color: T.muted,
              background: T.white, outline: "none", cursor: "pointer",
            }}
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {hasFilters && (
            <button onClick={reset}
              style={{
                padding: "10px 16px", borderRadius: 11,
                border: `1.5px solid ${T.border}`, background: T.bg,
                fontSize: 11, fontWeight: 700, color: T.muted,
                cursor: "pointer", fontFamily: "'DM Sans',sans-serif", whiteSpace: "nowrap",
              }}
            >
              Réinitialiser
            </button>
          )}
        </div>

        {/* Compteur */}
        {searched && !loading && (
          <p style={{ margin: "12px 0 0", fontSize: 11, color: T.muted, fontWeight: 600 }}>
            {total.toLocaleString("fr-FR")} résultat{total > 1 ? "s" : ""}
            {results.length < total ? ` · ${results.length} affichés` : ""}
          </p>
        )}
      </div>

      {/* ── Contenu ─────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 32px 40px" }}>

        {!searched ? (
          <EmptyState />
        ) : loading && results.length === 0 ? (
          <p style={{ margin: "48px 0", fontSize: 13, color: T.muted, textAlign: "center" }}>Chargement…</p>
        ) : results.length === 0 ? (
          <div style={{ padding: "60px 0", textAlign: "center" }}>
            <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 800, color: T.text }}>Aucune formation trouvée</p>
            <p style={{ margin: 0, fontSize: 12, color: T.muted }}>Essaie d'autres filtres ou modifie ta recherche.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 720, marginInline: "auto" }}>
            {results.map(f => <FormationCard key={f.cod_aff_form} f={f} />)}

            {hasMore && (
              <button
                onClick={() => setOffset(o => o + LIMIT)}
                disabled={loading}
                style={{
                  marginTop: 8, padding: "13px", borderRadius: 14,
                  border: `1.5px solid ${T.border}`, background: T.white,
                  fontSize: 13, fontWeight: 700, color: T.text,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "'DM Sans',sans-serif",
                  opacity: loading ? 0.6 : 1, transition: "opacity 0.15s",
                }}
              >
                {loading ? "Chargement…" : `Afficher plus · ${(total - results.length).toLocaleString("fr-FR")} restantes`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
