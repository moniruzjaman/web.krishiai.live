import { useState, useRef, useEffect } from "react";
import { analyzeText, buildAgriPrompt } from "@/services/aiService";
import styles from "./Chat.module.css";

interface Message {
  role: "user" | "assistant";
  text: string;
  model?: string;
}

const SUGGESTIONS = [
  "আমার ধান গাছে বাদামি দাগ দেখা যাচ্ছে, কী করব?",
  "বোরো ধানে ইউরিয়া কতটুকু দিতে হবে?",
  "কলার গাছে পানামা রোগ হলে কী করব?",
  "এই মৌসুমে সবজি চাষের পরামর্শ দিন",
  "কৃষি ঋণ পেতে কী করতে হবে?",
];

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setLoading(true);
    const prompt = buildAgriPrompt(q);
    const res    = await analyzeText(prompt);
    setMessages((m) => [
      ...m,
      { role: "assistant", text: res.text, model: res.model },
    ]);
    setLoading(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <span className={styles.headerIcon}>🤖</span>
        <div>
          <div className={styles.headerTitle}>AI কৃষি পরামর্শদাতা</div>
          <div className={styles.headerSub}>BRRI · BARI · DAE · SRDI নির্দেশিকা অনুযায়ী</div>
        </div>
      </div>

      <div className={styles.messages}>
        {messages.length === 0 && (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>🌾</span>
            <p>যেকোনো কৃষি প্রশ্ন জিজ্ঞেস করুন</p>
            <div className={styles.suggestions}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className={styles.suggBtn} onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`${styles.bubble} ${styles[m.role]}`}>
            <div className={styles.bubbleText}>{m.text}</div>
            {m.model && (
              <div className={styles.bubbleMeta}>via {m.model}</div>
            )}
          </div>
        ))}

        {loading && (
          <div className={`${styles.bubble} ${styles.assistant}`}>
            <div className={`${styles.bubbleText} pulse`}>🌱 বিশ্লেষণ করছি…</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className={styles.inputArea}>
        <textarea
          className={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
          }}
          placeholder="আপনার প্রশ্ন লিখুন… (Enter পাঠান)"
          rows={2}
          disabled={loading}
        />
        <button className={styles.sendBtn} onClick={() => send(input)} disabled={loading || !input.trim()}>
          {loading ? <span className="spinner">⏳</span> : "➤"}
        </button>
      </div>
    </div>
  );
}
