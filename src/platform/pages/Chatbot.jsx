import { useEffect, useState } from "react";
import { T, grad, gradSoft } from "../constants/theme";

export default function Chatbot() {
  const [active, setActive] = useState(0);
  const [input, setInput] = useState("");
  const sessions = [
    {
      label: "Informatique & Tech",
      date: "Aujourd'hui",
      msgs: [
        { role: "agent", text: "On avait discute du BUT Informatique. Tu as eu le temps d'y reflechir ?" },
        { role: "user", text: "Oui, j'hesite encore avec la Licence. C'est quoi la vraie difference ?" },
        {
          role: "agent",
          text: "Le BUT est plus professionnalisant — tu sors en 3 ans avec des competences operationnelles. La Licence est plus academique et ouvre vers un Master. Si ton objectif c'est de travailler vite, BUT. Si tu vises un poste senior ou une ecole par la suite, Licence + Master.",
        },
      ],
    },
    {
      label: "Finance & Commerce",
      date: "Il y a 3 jours",
      msgs: [
        { role: "agent", text: "Tu m'avais demande des infos sur les ecoles de commerce. Tu veux qu'on reprenne ?" },
        { role: "user", text: "Oui, c'est accessible avec un bac general ?" },
        { role: "agent", text: "Oui. Les Bachelors 3 ans sont accessibles sur dossier et entretien. Les grandes ecoles (HEC, ESSEC) necessitent une prepa de 2 ans apres le bac." },
      ],
    },
    {
      label: "General",
      date: "Il y a 1 semaine",
      msgs: [
        { role: "agent", text: "Comment puis-je t'aider dans ton orientation aujourd'hui ?" },
        { role: "user", text: "Je sais pas du tout quoi faire apres le bac." },
        { role: "agent", text: "C'est tout a fait normal. L'important c'est de ne pas se mettre de pression. Dis-moi quelles matieres ou activites te donnent de l'energie — on part de la." },
      ],
    },
  ];

  const [msgs, setMsgs] = useState(sessions[0].msgs);
  useEffect(() => setMsgs(sessions[active].msgs), [active]);

  const send = () => {
    if (!input.trim()) return;
    setMsgs((m) => [...m, { role: "user", text: input }, { role: "agent", text: "Je cherche la meilleure reponse pour toi selon ton profil..." }]);
    setInput("");
  };

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden", fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ width: 248, flexShrink: 0, background: T.white, borderRight: `1px solid ${T.border}`, padding: "18px 13px", display: "flex", flexDirection: "column", gap: 6 }}>
        <p style={{ margin: "0 0 11px", fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>Historique</p>
        {sessions.map((s, i) => (
          <div key={i} onClick={() => setActive(i)} style={{ padding: "12px 13px", borderRadius: 13, cursor: "pointer", background: active === i ? gradSoft : T.bg, border: `1px solid ${active === i ? "#F9A23B28" : T.border}`, transition: "all 0.15s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{s.label}</span>
            </div>
            <p style={{ margin: "0 0 4px", fontSize: 11, color: T.muted, lineHeight: 1.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.msgs[s.msgs.length - 1].text}</p>
            <span style={{ fontSize: 10, color: T.mutedLight }}>{s.date}</span>
          </div>
        ))}
        <div style={{ marginTop: 4, padding: "10px 13px", borderRadius: 13, cursor: "pointer", border: `1px dashed ${T.border}`, display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 14, color: T.muted }}>+</span>
          <span style={{ fontSize: 12, color: T.muted }}>Nouvelle conversation</span>
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: T.bg, overflow: "hidden" }}>
        <div style={{ padding: "16px 26px", background: T.white, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "white" }}>◈</div>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.text }}>{sessions[active].label}</p>
            <p style={{ margin: 0, fontSize: 11, color: T.muted }}>Agent MIRAI · {sessions[active].date}</p>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "22px 26px", display: "flex", flexDirection: "column", gap: 12 }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{ maxWidth: "68%", padding: "11px 15px", borderRadius: m.role === "user" ? "15px 15px 4px 15px" : "15px 15px 15px 4px", background: m.role === "user" ? grad : T.white, border: m.role === "agent" ? `1px solid ${T.border}` : "none", boxShadow: "0 2px 8px rgba(15,31,61,0.05)" }}>
                <p style={{ margin: 0, fontSize: 13, color: m.role === "user" ? "white" : T.text, lineHeight: 1.6 }}>{m.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: "14px 26px", background: T.white, borderTop: `1px solid ${T.border}`, display: "flex", gap: 9 }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Pose ta question a l'agent MIRAI..." style={{ flex: 1, padding: "12px 16px", borderRadius: 13, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: "'DM Sans',sans-serif", color: T.text, outline: "none", background: T.bg }} />
          <button onClick={send} style={{ padding: "12px 22px", borderRadius: 13, border: "none", background: grad, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", boxShadow: "0 4px 14px rgba(249,162,59,0.28)" }}>
            Envoyer →
          </button>
        </div>
      </div>
    </div>
  );
}
