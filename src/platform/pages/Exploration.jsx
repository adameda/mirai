import { useState } from "react";
import DetailPanel from "../components/DetailPanel";
import SaveBtn from "../components/SaveBtn";
import { ALL_DOMAINES, FORMATIONS_DATA } from "../data/formationsData";
import { METIERS_DATA } from "../data/metiersData";
import { T, grad, gradSoft } from "../constants/theme";

export default function Exploration({ answers, savedItems, onSave, onRemove, onNav }) {
  const suggested = (answers?.domaines || []).filter((d) => d !== "Pas encore d'idee" && FORMATIONS_DATA[d]).slice(0, 3);
  if (!suggested.length) suggested.push(...ALL_DOMAINES.slice(0, 3));

  const [selDomaine, setSelDomaine] = useState(null);
  const [selFormation, setSelFormation] = useState(null);
  const [selMetier, setSelMetier] = useState(null);
  const [chatOpen, setChatOpen] = useState(true);
  const [chatMsg, setChatMsg] = useState("Bonjour ! Parcours les domaines, puis sauvegarde formations et métiers en favoris — je t'accompagne à chaque étape.");
  const [chatInput, setChatInput] = useState("");
  const [detailItem, setDetailItem] = useState(null);

  const clickDomaine = (d) => {
    setSelDomaine(d);
    setSelFormation(null);
    setSelMetier(null);
    setChatMsg(`Tu consultes **${d}**. Je peux t'aider à choisir des formations et des métiers à **sauvegarder en favoris**. Qu'est-ce qui t'intéresse ?`);
  };

  const clickFormation = (f) => {
    setSelFormation(f);
    setSelMetier(null);
    const info = FORMATIONS_DATA[selDomaine]?.find((x) => x.l === f);
    setChatMsg(`**${f}** — ${info?.d}, niveau ${info?.n}. Tu veux que je t'aide à comparer avec d'autres filières ou à décider si tu la **sauvegardes** ?`);
  };

  const clickMetier = (m) => {
    setSelMetier(m);
    setChatMsg(`**${m}** — perspectives solides (salaire indicatif début de carrière : 28 000 à 38 000 €). Tu veux en savoir plus avant de le **sauvegarder** ?`);
  };

  const extraDomaines = ALL_DOMAINES.filter((d) => !suggested.includes(d));
  const allDomaines = [...suggested, ...extraDomaines];

  const DetailBtn = ({ item }) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setDetailItem(item);
      }}
      style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 9px", borderRadius: 9, border: `1.5px solid ${T.border}`, background: T.bg, cursor: "pointer", fontSize: 11, fontWeight: 700, color: T.muted, fontFamily: "'DM Sans',sans-serif", transition: "all 0.18s", whiteSpace: "nowrap" }}
    >
      Détails
    </button>
  );

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden", fontFamily: "'DM Sans',sans-serif" }}>
      {detailItem && <DetailPanel item={detailItem} onClose={() => setDetailItem(null)} onSave={onSave} onRemove={onRemove} savedItems={savedItems} onAskMirai={onNav ? () => onNav("chatbot") : undefined} />}

      <div style={{ flex: 1, overflowY: "auto", padding: "32px 32px 32px 48px", background: T.bg }}>
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: "-0.03em" }}>Exploration</h1>
          <p style={{ margin: 0, fontSize: 13, color: T.muted }}>Choisis un domaine, puis des formations et des métiers — sauvegarde ceux qui t'intéressent en favoris.</p>
        </div>

        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <div style={{ width: selDomaine ? 190 : "100%", flexShrink: 0, transition: "width 0.25s ease", maxWidth: selDomaine ? 190 : 700 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>Domaines</p>
              {selDomaine && (
                <button onClick={() => { setSelDomaine(null); setSelFormation(null); setSelMetier(null); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: T.muted, padding: 0 }}>
                  ← Tout voir
                </button>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {allDomaines.map((d) => {
                const isSugg = suggested.includes(d);
                const isActive = selDomaine === d;
                return (
                  <div key={d} onClick={() => clickDomaine(d)} style={{ padding: selDomaine ? "9px 12px" : "13px 16px", borderRadius: 13, cursor: "pointer", background: isActive ? T.navyMid : T.white, border: `1px solid ${isActive ? T.navyMid : T.border}`, transition: "all 0.2s" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 700, color: isActive ? "white" : T.text, lineHeight: 1.3, whiteSpace: selDomaine ? "nowrap" : "normal", overflow: selDomaine ? "hidden" : "visible", textOverflow: selDomaine ? "ellipsis" : "clip" }}>{d}</p>
                        {!selDomaine && (
                          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: isSugg ? gradSoft : T.border, color: isSugg ? T.orange : T.mutedLight, fontWeight: 700 }}>
                            {isSugg ? "Suggéré" : `${(FORMATIONS_DATA[d] || []).length} formations`}
                          </span>
                        )}
                      </div>
                      {!selDomaine && (
                        <div onClick={(e) => e.stopPropagation()}>
                          <SaveBtn type="domaine" label={d} parent={null} savedItems={savedItems} onSave={onSave} onRemove={onRemove} small />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {!selDomaine && (
                <div style={{ padding: "9px 13px", borderRadius: 13, cursor: "pointer", border: `1px dashed ${T.border}`, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, color: T.muted }}>+</span>
                  <span style={{ fontSize: 12, color: T.muted }}>Ajouter</span>
                </div>
              )}
            </div>
          </div>

          {selDomaine && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>Formations · {selDomaine}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(FORMATIONS_DATA[selDomaine] || []).map((f) => {
                  const isActive = selFormation === f.l;
                  return (
                    <div key={f.l} onClick={() => clickFormation(f.l)} style={{ padding: "14px 17px", borderRadius: 14, cursor: "pointer", background: isActive ? T.navyMid : T.white, border: `1px solid ${isActive ? T.navyMid : T.border}`, transition: "all 0.2s" }}>
                      <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 700, color: isActive ? "white" : T.text }}>{f.l}</p>
                      <p style={{ margin: "0 0 10px", fontSize: 11, color: isActive ? "rgba(255,255,255,0.5)" : T.muted }}>
                        {f.d} · {f.n}
                      </p>
                      <div style={{ display: "flex", gap: 7 }} onClick={(e) => e.stopPropagation()}>
                        <SaveBtn type="formation" label={f.l} parent={selDomaine} savedItems={savedItems} onSave={onSave} onRemove={onRemove} small />
                        <DetailBtn item={{ type: "formation", label: f.l, domaine: selDomaine }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {selFormation && (
            <div style={{ width: 230, flexShrink: 0 }}>
              <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>Métiers accessibles</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(METIERS_DATA[selFormation] || []).map((m) => {
                  const isActive = selMetier === m;
                  return (
                    <div key={m} onClick={() => clickMetier(m)} style={{ padding: "13px 15px", borderRadius: 14, cursor: "pointer", background: isActive ? gradSoft : T.white, border: `1.5px solid ${isActive ? T.orange : T.border}`, transition: "all 0.2s" }}>
                      <p style={{ margin: "0 0 9px", fontSize: 12, fontWeight: 700, color: T.text }}>{m}</p>
                      <div style={{ display: "flex", gap: 7 }} onClick={(e) => e.stopPropagation()}>
                        <SaveBtn type="metier" label={m} parent={selFormation} savedItems={savedItems} onSave={onSave} onRemove={onRemove} small />
                        <DetailBtn item={{ type: "metier", label: m, formation: selFormation }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {chatOpen && (
        <div style={{ width: 268, flexShrink: 0, background: T.white, borderLeft: `1px solid ${T.border}`, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 9, background: grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "white" }}>◈</div>
              <div>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: T.text }}>Agent MIRAI</p>
                <p style={{ margin: 0, fontSize: 10, color: T.muted }}>{selMetier ? "Metiers" : selFormation ? "Formations" : "Domaines"}</p>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: T.muted, padding: 4 }}>
              ✕
            </button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 8px" }}>
            <div style={{ background: T.bg, borderRadius: 13, padding: "11px 13px", fontSize: 12, color: T.text, lineHeight: 1.65 }}>
              {chatMsg.split("**").map((p, i) =>
                i % 2 === 1 ? (
                  <strong key={i}>{p}</strong>
                ) : (
                  <span key={i}>{p}</span>
                ),
              )}
            </div>
            <div style={{ marginTop: 9, display: "flex", flexDirection: "column", gap: 6 }}>
              {["Quels sont les debouches ?", "C'est selectif ?", "Salaire en sortie ?"].map((q) => (
                <div key={q} onClick={() => setChatMsg(`Sur la question "${q.toLowerCase()}", voici ce que je sais selon ton profil...`)} style={{ padding: "7px 11px", borderRadius: 9, border: `1px solid ${T.border}`, fontSize: 11, color: T.muted, cursor: "pointer", background: T.bg }}>
                  {q}
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: "11px 14px", borderTop: `1px solid ${T.border}`, display: "flex", gap: 7 }}>
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && chatInput) {
                  setChatMsg(chatInput + " — Recherche en cours...");
                  setChatInput("");
                }
              }}
              placeholder="Ta question..."
              style={{ flex: 1, padding: "8px 11px", borderRadius: 9, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: "'DM Sans',sans-serif", color: T.text, outline: "none", background: T.bg }}
            />
            <button
              onClick={() => {
                if (chatInput) {
                  setChatMsg(chatInput + " — Recherche en cours...");
                  setChatInput("");
                }
              }}
              style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: grad, cursor: "pointer", color: "white", fontSize: 12, flexShrink: 0 }}
            >
              →
            </button>
          </div>
        </div>
      )}
      {!chatOpen && (
        <button onClick={() => setChatOpen(true)} style={{ position: "fixed", bottom: 28, right: 28, width: 48, height: 48, borderRadius: "50%", border: "none", background: grad, color: "white", fontSize: 18, cursor: "pointer", boxShadow: "0 6px 20px rgba(249,162,59,0.45)", zIndex: 100 }}>
          ◈
        </button>
      )}
    </div>
  );
}
