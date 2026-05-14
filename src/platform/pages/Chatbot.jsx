import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { T, grad, gradSoft } from "../constants/theme";
import { useAppState } from "../hooks/useAppState";
import { useMobile } from "../hooks/useMobile";

const BASE = "/api/v1";
const STORAGE_KEY = "mirai_chat_histories";

// ── Helpers localStorage ──────────────────────────────────────────────────────

function loadHistories() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
  catch { return {}; }
}

function saveHistories(h) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(h));
}

// ── Opener messages ───────────────────────────────────────────────────────────

function openerFor(channel, label, prenom) {
  if (channel === "general") {
    const name = prenom ? ` ${prenom}` : "";
    return `Bonjour${name} ! Je suis MIRAI, ton assistant orientation. Je peux t'aider à explorer les formations, les métiers et à réfléchir sur ton projet d'études. Comment puis-je t'aider ?`;
  }
  const [type] = channel.split(":");
  if (type === "formation")
    return `Tu veux en savoir plus sur **${label}** ? N'hésite pas à me poser toutes tes questions sur cette formation, son accès, ses conditions d'études ou ses débouchés !`;
  return `Tu explores le métier de **${label}** ? Je suis là pour t'aider à comprendre ce métier, les formations qui y mènent et s'il correspond à ton profil !`;
}

// ── Suggested prompts par type de canal ──────────────────────────────────────

const SUGGESTED = {
  general: [
    "Quelles formations correspondent à mon profil ?",
    "Quelle est la différence entre un BTS et un BUT ?",
    "Comment fonctionne Parcoursup ?",
    "Je ne sais pas quoi faire après le bac, par où commencer ?",
  ],
  formation: [
    "Quelles sont les conditions d'admission ?",
    "Quels débouchés professionnels après cette formation ?",
    "Cette formation correspond-elle à mon profil ?",
    "Comment candidater via Parcoursup ?",
  ],
  metier: [
    "Quelles formations mènent à ce métier ?",
    "Quel est le salaire moyen dans ce domaine ?",
    "Est-ce un métier qui recrute en ce moment ?",
    "Ce métier correspond-il à mon profil ?",
  ],
};

function getSuggested(channel) {
  if (channel === "general") return SUGGESTED.general;
  const [type] = channel.split(":");
  return SUGGESTED[type] || SUGGESTED.general;
}

// ── Titre sidebar ─────────────────────────────────────────────────────────────

function channelTitle(channel, meta) {
  if (channel === "general") return "Chat Général";
  return meta?.label || channel;
}

// ── Rendu markdown pour les messages assistant ────────────────────────────────

const mdComponents = {
  p:      ({ children }) => <p style={{ margin: "0 0 8px", fontSize: 13, lineHeight: 1.65 }}>{children}</p>,
  strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
  em:     ({ children }) => <em>{children}</em>,
  h1:     ({ children }) => <p style={{ margin: "10px 0 6px", fontSize: 15, fontWeight: 800, letterSpacing: "-0.02em" }}>{children}</p>,
  h2:     ({ children }) => <p style={{ margin: "10px 0 6px", fontSize: 14, fontWeight: 800, letterSpacing: "-0.02em" }}>{children}</p>,
  h3:     ({ children }) => <p style={{ margin: "8px 0 4px", fontSize: 13, fontWeight: 700 }}>{children}</p>,
  ul:     ({ children }) => <ul style={{ margin: "4px 0 8px", paddingLeft: 18 }}>{children}</ul>,
  ol:     ({ children }) => <ol style={{ margin: "4px 0 8px", paddingLeft: 18 }}>{children}</ol>,
  li:     ({ children }) => <li style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 3 }}>{children}</li>,
  code:   ({ children, className }) => className
    ? <pre style={{ background: "#F1F3F8", borderRadius: 8, padding: "10px 12px", fontSize: 12, overflowX: "auto", margin: "6px 0" }}><code>{children}</code></pre>
    : <code style={{ background: "#F1F3F8", borderRadius: 4, padding: "1px 5px", fontSize: 12 }}>{children}</code>,
  blockquote: ({ children }) => <blockquote style={{ borderLeft: `3px solid ${T.orange}`, margin: "6px 0", paddingLeft: 10, color: T.muted }}>{children}</blockquote>,
};

function AssistantMsg({ text }) {
  return (
    <div style={{ fontSize: 13, lineHeight: 1.65 }}>
      <ReactMarkdown components={mdComponents}>{text}</ReactMarkdown>
    </div>
  );
}

// ── Profile builder ───────────────────────────────────────────────────────────

function buildProfile(answers) {
  if (!answers || Object.keys(answers).length === 0) return null;
  return {
    niveau:              answers.niveau?.[0]              || null,
    voie:                answers.voie?.[0]                || null,
    filiere:             answers.filiere?.[0]             || null,
    specialites:         answers.specialites              || [],
    matieres_fortes:     answers.matieres_fortes          || [],
    matieres_aimees:     answers.matieres_aimees          || [],
    centres_interet:     answers.centres_interet          || [],
    domaines_interets:   answers.domaines_interets        || [],
    duree:               answers.duree?.[0]               || null,
    pression_academique: answers.pression_academique?.[0] || null,
    style:               answers.style                    || [],
  };
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function Chatbot() {
  const { user, answers, chatContext, setChatContext } = useAppState();
  const isMobile = useMobile();

  const [histories, setHistories]         = useState(loadHistories);
  const [activeChannel, setActiveChannel] = useState("general");
  const [input, setInput]                 = useState("");
  const [streaming, setStreaming]         = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const bottomRef = useRef(null);
  const abortRef  = useRef(null);

  // ── Initialise le canal général si vide ──────────────────────────────────
  useEffect(() => {
    setHistories(prev => {
      if (prev["general"]) return prev;
      const opener = { role: "assistant", text: openerFor("general", null, user?.prenom) };
      const next = { ...prev, general: { messages: [opener], meta: { label: "Chat Général" } } };
      saveHistories(next);
      return next;
    });
  }, [user?.prenom]);

  // ── Gestion de l'entrée via openChat ─────────────────────────────────────
  useEffect(() => {
    if (!chatContext) return;
    const { type, refId, label } = chatContext;
    const channel = `${type}:${refId}`;

    setHistories(prev => {
      if (prev[channel]) return prev;
      const opener = { role: "assistant", text: openerFor(channel, label, user?.prenom) };
      const next = { ...prev, [channel]: { messages: [opener], meta: { label, type } } };
      saveHistories(next);
      return next;
    });

    setActiveChannel(channel);
    setChatContext(null);
  }, [chatContext, user?.prenom, setChatContext]);

  // ── Scroll automatique ────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [histories, activeChannel, streamingText]);

  // ── Données dérivées ──────────────────────────────────────────────────────

  const current  = histories[activeChannel] || { messages: [], meta: {} };
  const messages = current.messages || [];
  const showSuggested = messages.length === 1 && !streaming;

  const sidebarChannels = ["general", ...Object.keys(histories).filter(k => k !== "general")];

  // ── Envoi d'un message ────────────────────────────────────────────────────

  const sendText = async (text) => {
    if (!text.trim() || streaming) return;
    setInput("");

    const userMsg = { role: "user", text };

    setHistories(prev => {
      const ch = prev[activeChannel] || { messages: [], meta: {} };
      const next = { ...prev, [activeChannel]: { ...ch, messages: [...ch.messages, userMsg] } };
      saveHistories(next);
      return next;
    });

    setStreaming(true);
    setStreamingText("");

    const [type, id] = activeChannel === "general" ? [null, null] : activeChannel.split(/:(.+)/);
    const token = localStorage.getItem("mirai_token");

    const allMessages = [...messages, userMsg].map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      text: m.text,
    }));

    try {
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      const res = await fetch(`${BASE}/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: allMessages,
          context_type: type || null,
          context_id: id || null,
          profile: buildProfile(answers),
        }),
        signal: ctrl.signal,
      });

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const raw = decoder.decode(value, { stream: true });
        for (const line of raw.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") break;
          try {
            const { text: chunk, error } = JSON.parse(payload);
            if (error) { accumulated = error; break; }
            if (chunk) { accumulated += chunk; setStreamingText(accumulated); }
          } catch { /* ligne incomplète */ }
        }
      }

      const assistantMsg = { role: "assistant", text: accumulated || "…" };
      setHistories(prev => {
        const ch = prev[activeChannel] || { messages: [], meta: {} };
        const next = { ...prev, [activeChannel]: { ...ch, messages: [...ch.messages, assistantMsg] } };
        saveHistories(next);
        return next;
      });
    } catch (err) {
      if (err.name !== "AbortError") {
        const errMsg = { role: "assistant", text: "Une erreur est survenue. Réessaie dans quelques instants." };
        setHistories(prev => {
          const ch = prev[activeChannel] || { messages: [], meta: {} };
          const next = { ...prev, [activeChannel]: { ...ch, messages: [...ch.messages, errMsg] } };
          saveHistories(next);
          return next;
        });
      }
    } finally {
      setStreaming(false);
      setStreamingText("");
    }
  };

  const send = () => sendText(input);

  const newConversation = () => { setActiveChannel("general"); };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden", fontFamily: "'DM Sans',sans-serif" }}>

      {/* ── Sidebar (overlay mobile) ──────────────────────────────────────── */}
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 998 }} />
      )}
      <div style={{ width: 248, flexShrink: 0, background: T.white, borderRight: `1px solid ${T.border}`, padding: "18px 13px", display: "flex", flexDirection: "column", gap: 6, overflowY: "auto", ...(isMobile ? { position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 999, transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)", transition: "transform 0.25s ease" } : {}) }}>
        <p style={{ margin: "0 0 11px", fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Historique
        </p>

        {sidebarChannels.map(channel => {
          const ch = histories[channel];
          if (!ch) return null;
          const isActive = activeChannel === channel;
          const title    = channelTitle(channel, ch.meta);
          const lastMsg  = ch.messages[ch.messages.length - 1];
          const typeLabel = ch.meta?.type === "formation" ? "Formation" : ch.meta?.type === "metier" ? "Métier" : null;

          return (
            <div
              key={channel}
              onClick={() => { setActiveChannel(channel); if (isMobile) setSidebarOpen(false); }}
              style={{ padding: "11px 13px", borderRadius: 13, cursor: "pointer", background: isActive ? gradSoft : T.bg, border: `1px solid ${isActive ? "#F9A23B28" : T.border}`, transition: "all 0.15s" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                  {title}
                </span>
                {typeLabel && (
                  <span style={{ fontSize: 9, fontWeight: 700, color: T.muted, background: T.border, borderRadius: 4, padding: "1px 5px", flexShrink: 0, marginLeft: 6 }}>
                    {typeLabel}
                  </span>
                )}
              </div>
              {lastMsg && (
                <p style={{ margin: 0, fontSize: 11, color: T.muted, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                  {lastMsg.text.replace(/\*\*/g, "").replace(/#+\s/g, "").replace(/[-*]\s/g, "")}
                </p>
              )}
            </div>
          );
        })}

        <div onClick={newConversation} style={{ marginTop: 4, padding: "10px 13px", borderRadius: 13, cursor: "pointer", border: `1px dashed ${T.border}`, display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 14, color: T.muted }}>+</span>
          <span style={{ fontSize: 12, color: T.muted }}>Retour au chat général</span>
        </div>
      </div>

      {/* ── Zone de chat ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: T.bg, overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "14px 16px", background: T.white, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 11 }}>
          {isMobile && (
            <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, fontSize: 18, padding: 0, lineHeight: 1, display: "flex", alignItems: "center", flexShrink: 0 }}>☰</button>
          )}
          <div style={{ width: 36, height: 36, borderRadius: 10, background: grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "white" }}>◈</div>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.text }}>{channelTitle(activeChannel, current.meta)}</p>
            <p style={{ margin: 0, fontSize: 11, color: T.muted }}>Agent MIRAI</p>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "16px" : "22px 26px", display: "flex", flexDirection: "column", gap: 12 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: isMobile ? "85%" : "68%",
                padding: "11px 15px",
                borderRadius: m.role === "user" ? "15px 15px 4px 15px" : "15px 15px 15px 4px",
                background: m.role === "user" ? grad : T.white,
                border: m.role === "assistant" ? `1px solid ${T.border}` : "none",
                boxShadow: "0 2px 8px rgba(15,31,61,0.05)",
                color: m.role === "user" ? "white" : T.text,
              }}>
                {m.role === "assistant"
                  ? <AssistantMsg text={m.text} />
                  : <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55 }}>{m.text}</p>
                }
              </div>
            </div>
          ))}

          {/* Suggested prompts — affichés uniquement quand il n'y a que le message d'ouverture */}
          {showSuggested && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 4 }}>
              {getSuggested(activeChannel).map((q) => (
                <button
                  key={q}
                  onClick={() => sendText(q)}
                  style={{
                    padding: "8px 13px", borderRadius: 20,
                    border: `1.5px solid ${T.border}`,
                    background: T.white, color: T.text,
                    fontSize: 12, fontWeight: 600,
                    cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
                    textAlign: "left", lineHeight: 1.4,
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.orange; e.currentTarget.style.background = gradSoft; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.white; }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Bulle en cours de streaming */}
          {streaming && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div style={{ maxWidth: isMobile ? "85%" : "68%", padding: "11px 15px", borderRadius: "15px 15px 15px 4px", background: T.white, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(15,31,61,0.05)", color: T.text }}>
                {streamingText
                  ? <AssistantMsg text={streamingText} />
                  : <p style={{ margin: 0, fontSize: 13, color: T.muted }}>MIRAI réfléchit…</p>
                }
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: isMobile ? "12px 16px" : "14px 26px", background: T.white, borderTop: `1px solid ${T.border}`, display: "flex", gap: 9 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            disabled={streaming}
            placeholder="Pose ta question à l'agent MIRAI…"
            style={{ flex: 1, padding: "12px 16px", borderRadius: 13, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: "'DM Sans',sans-serif", color: T.text, outline: "none", background: T.bg, opacity: streaming ? 0.6 : 1 }}
          />
          <button
            onClick={send}
            disabled={streaming || !input.trim()}
            style={{ padding: "12px 22px", borderRadius: 13, border: "none", background: grad, color: "white", fontSize: 13, fontWeight: 700, cursor: streaming || !input.trim() ? "not-allowed" : "pointer", fontFamily: "'DM Sans',sans-serif", boxShadow: "0 4px 14px rgba(249,162,59,0.28)", opacity: streaming || !input.trim() ? 0.55 : 1, transition: "opacity 0.15s", whiteSpace: "nowrap" }}
          >
            {isMobile ? "→" : "Envoyer →"}
          </button>
        </div>
      </div>
    </div>
  );
}
