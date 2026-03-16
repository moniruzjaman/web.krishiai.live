/**
 * Chat.tsx  —  v3 AI-POWERED
 *
 * Full streaming AI chat with:
 *  - Token-by-token streaming (words appear as Gemini generates them)
 *  - Conversation memory (history passed to every call)
 *  - Voice input (Bengali speech recognition)
 *  - Farmer profile context injection
 *  - Smart prompt suggestions by category
 *  - Model badge (gemini-2.0-flash / gemini-1.5 / rule-based)
 *  - Copy response button
 *  - Clear history
 */

import { useState, useRef, useEffect, useCallback } from "react";
import {
  streamAnalysis, getFarmerProfile, buildContext,
  startVoiceInput, PROMPTS, type ConversationMessage,
} from "@/services/aiService";
import styles from "./Chat.module.css";

// ── Suggestion categories ─────────────────────────────────────────────────────
const CATEGORIES = [
  {
    label: "🌾 ফসল রোগ",
    chips: [
      "ধানে বাদামি দাগ দেখা যাচ্ছে, কী করব?",
      "কলার পানামা রোগ প্রতিকার",
      "আলুর ধ্বসা রোগ দমন পদ্ধতি",
      "বেগুনের ফল ও কাণ্ড পচা রোগ",
    ],
  },
  {
    label: "🌱 সার ও পরিচর্যা",
    chips: [
      "বোরো ধানে ইউরিয়া কতটুকু দিতে হবে?",
      "সবজি চাষে জৈব সার ব্যবহার",
      "মাটিতে দস্তার অভাব হলে কী করব?",
      "ড্রিপ সেচে সার প্রয়োগের নিয়ম",
    ],
  },
  {
    label: "💰 বাজার ও ঋণ",
    chips: [
      "কৃষি ঋণ পেতে কী করতে হবে?",
      "এই মৌসুমে আলু বিক্রির সেরা সময়",
      "সরকারি ভর্তুকিতে সার পাওয়ার নিয়ম",
      "DAE থেকে কোন সুবিধা পাওয়া যায়?",
    ],
  },
  {
    label: "🌦️ আবহাওয়া পরামর্শ",
    chips: [
      "বন্যার পর ধান ক্ষেতে কী করব?",
      "খরায় সেচ ব্যবস্থাপনা",
      "ঘূর্ণিঝড়ের আগে ফসল রক্ষা",
      "শীতকালীন সবজির তুষারপাত প্রতিরোধ",
    ],
  },
];

// ── Model badge colours ───────────────────────────────────────────────────────
const MODEL_COLOR: Record<string, string> = {
  "gemini-2.0-flash":    "#1d4ed8",
  "gemini-1.5-flash":    "#7c3aed",
  "gemini-1.5-flash-or": "#7c3aed",
  "rule-based":          "#9ca3af",
  "offline":             "#e53e3e",
};

interface Message extends ConversationMessage {
  model?:     string;
  streaming?: boolean;
  timestamp:  Date;
}

export default function Chat() {
  const [messages,    setMessages]    = useState<Message[]>([]);
  const [input,       setInput]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [listening,   setListening]   = useState(false);
  const [catIdx,      setCatIdx]      = useState(0);
  const [copied,      setCopied]      = useState<number | null>(null);

  const bottomRef   = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLTextAreaElement>(null);
  const stopVoice   = useRef<(() => void) | null>(null);
  const farmer      = getFarmerProfile();
  const ctx         = buildContext(farmer);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send with streaming ──────────────────────────────────────────────────
  const send = useCallback(async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    setInput("");
    inputRef.current?.focus();

    const userMsg: Message = { role: "user", text: q, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    // Build history (last 10 turns)
    const history = messages.slice(-10).map(m => ({ role: m.role, text: m.text }));

    // Add streaming placeholder
    const botIdx = messages.length + 1;
    setMessages(prev => [...prev, {
      role: "assistant", text: "", model: "gemini-2.0-flash",
      streaming: true, timestamp: new Date(),
    }]);

    let fullText = "";
    let modelUsed = "gemini-2.0-flash";

    const result = await streamAnalysis(
      q,
      (token) => {
        fullText += token;
        setMessages(prev => prev.map((m, i) =>
          i === botIdx ? { ...m, text: fullText } : m
        ));
      },
      history,
      ctx
    );

    modelUsed = result.model;

    // Finalise
    setMessages(prev => prev.map((m, i) =>
      i === botIdx
        ? { ...m, text: result.text, model: modelUsed, streaming: false }
        : m
    ));
    setLoading(false);
  }, [messages, loading, ctx]);

  // ── Voice input ──────────────────────────────────────────────────────────
  const toggleVoice = () => {
    if (listening) {
      stopVoice.current?.();
      setListening(false);
      return;
    }
    const stop = startVoiceInput(
      (text) => setInput(text),
      () => setListening(false)
    );
    if (stop) { stopVoice.current = stop; setListening(true); }
    else { alert("ভয়েস ইনপুট এই ব্রাউজারে সমর্থিত নয়"); }
  };

  // ── Copy response ────────────────────────────────────────────────────────
  const copyMsg = (text: string, idx: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(idx);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={styles.page}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerAvatar}>
          <span>🤖</span>
          <span className={styles.onlineDot} />
        </div>
        <div style={{ flex: 1 }}>
          <div className={styles.headerTitle}>কৃষি AI পরামর্শদাতা</div>
          <div className={styles.headerSub}>
            {farmer.district ? `📍 ${farmer.district} · ` : ""}
            Gemini 2.0 Flash · BRRI/BARI/DAE
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className={styles.clearBtn}
            title="কথোপকথন মুছুন"
          >
            🗑️
          </button>
        )}
      </div>

      {/* ── Messages ───────────────────────────────────────────────────── */}
      <div className={styles.messages}>
        {messages.length === 0 && (
          <div className={styles.empty}>
            <div className={styles.emptyWave}>🌾</div>
            <div className={styles.emptyTitle}>কৃষি AI-তে স্বাগতম</div>
            <div className={styles.emptySub}>
              {farmer.name ? `নমস্কার ${farmer.name}!` : "নমস্কার!"} যেকোনো কৃষি প্রশ্ন করুন।
            </div>

            {/* Category tabs */}
            <div className={styles.catTabs}>
              {CATEGORIES.map((c, i) => (
                <button key={i} onClick={() => setCatIdx(i)}
                  className={`${styles.catTab} ${catIdx === i ? styles.catTabOn : ""}`}>
                  {c.label}
                </button>
              ))}
            </div>

            <div className={styles.chips}>
              {CATEGORIES[catIdx].chips.map((s, i) => (
                <button key={i} className={styles.chip} onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`${styles.bubble} ${styles[m.role]}`}>
            {m.role === "assistant" && (
              <div className={styles.botAvatar}>🤖</div>
            )}
            <div className={styles.bubbleInner}>
              <div className={styles.bubbleText}>
                {m.text || (m.streaming ? "" : "…")}
                {m.streaming && (
                  <span className={styles.cursor}>▋</span>
                )}
              </div>
              <div className={styles.bubbleFoot}>
                <span className={styles.bubbleTime}>{formatTime(m.timestamp)}</span>
                {m.model && (
                  <span
                    className={styles.modelBadge}
                    style={{ background: `${MODEL_COLOR[m.model] || "#9ca3af"}18`,
                             color: MODEL_COLOR[m.model] || "#9ca3af" }}
                  >
                    {m.model}
                  </span>
                )}
                {m.role === "assistant" && m.text && !m.streaming && (
                  <button
                    className={styles.copyBtn}
                    onClick={() => copyMsg(m.text, i)}
                  >
                    {copied === i ? "✓" : "⎘"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && messages[messages.length - 1]?.role === "user" && (
          <div className={styles.typingRow}>
            <div className={styles.botAvatar}>🤖</div>
            <div className={styles.typing}>
              <span /><span /><span />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input area ─────────────────────────────────────────────────── */}
      <div className={styles.inputArea}>
        <div className={styles.inputWrap}>
          <textarea
            ref={inputRef}
            className={styles.input}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder={listening ? "🎤 শুনছি…" : "প্রশ্ন লিখুন… (Enter পাঠান)"}
            rows={1}
            disabled={loading}
          />
          <button
            className={`${styles.voiceBtn} ${listening ? styles.voiceBtnOn : ""}`}
            onClick={toggleVoice}
            title="ভয়েস ইনপুট"
          >
            🎤
          </button>
        </div>
        <button
          className={styles.sendBtn}
          onClick={() => send(input)}
          disabled={loading || !input.trim()}
        >
          {loading
            ? <span className="spin" style={{ fontSize: 16 }}>⏳</span>
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
          }
        </button>
      </div>

    </div>
  );
}
