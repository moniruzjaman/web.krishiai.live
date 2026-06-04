/**
 * AIChatWidget.tsx — Quick-access AI Chat Widget for Home Page
 *
 * Features:
 * - Inline AI chat without navigating to /chat
 * - Seasonal suggestion chips
 * - Collapsible chat interface
 * - Bengali-first responses via /api/chat
 * - Persistent mini-conversation (last 5 messages)
 */

"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SEASON_SUGGESTIONS = (() => {
  const m = new Date().getMonth() + 1;
  if (m >= 11 || m <= 2) {
    return ["রবি মৌসুমে কী চাষ করব?", "সরিষায় কী সার লাগবে?", "আলু চাষের পদ্ধতি", "গমের রোগ বালাই"];
  } else if (m >= 3 && m <= 5) {
    return ["বোরো ধানের যত্ন", "গ্রীষ্মকালীন সবজি", "আউশ ধান চাষ", "তাপপ্রবাহে করণীয়"];
  } else if (m >= 6 && m <= 8) {
    return ["আমন ধান রোপণ", "বর্ষায় সার প্রয়োগ", "পাটের রোগ প্রতিকার", "বন্যা পরবর্তী করণীয়"];
  } else {
    return ["আমন ধান কাটার সময়", "রবি মৌসুমের প্রস্তুতি", "পেঁয়াজ বীজতলা", "শীতকালীন সবজি"];
  }
})();

const STORAGE_KEY = "krishi_home_chat";

// ── Storage helpers ──────────────────────────────────────────────────────────
function loadMessages(): Message[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveMessages(msgs: Message[]) {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs.slice(-10)));
  } catch { /* storage full */ }
}

// ── Component ────────────────────────────────────────────────────────────────
export default function AIChatWidget() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load persisted messages on mount
  useEffect(() => {
    const stored = loadMessages();
    setMessages(stored.length > 0 ? stored : []);
    setLoaded(true);
  }, []);

  // Save messages when they change
  useEffect(() => {
    if (loaded) saveMessages(messages);
  }, [messages, loaded]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const chatHistory = [...messages, userMsg]
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatHistory }),
      });

      const data = await res.json();

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply || "আমি এই মুহূর্তে উত্তর দিতে পারছি না। আবার চেষ্টা করুন।",
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "নেটওয়ার্ক সমস্যা হয়েছে। আবার চেষ্টা করুন।",
      };
      setMessages((prev) => [...prev, errMsg]);
    }

    setIsTyping(false);
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  };

  // Get the last assistant message for collapsed view
  const lastAiMessage = [...messages].reverse().find((m) => m.role === "assistant");

  return (
    <div className={`bg-white rounded-[14px] border border-green-200 overflow-hidden card-shadow transition-all duration-300 ${isExpanded ? "ring-2 ring-green-300/50" : ""}`}>
      {/* Header — always visible */}
      <button
        onClick={handleExpand}
        className="w-full flex items-center gap-2 px-4 py-2.5 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 cursor-pointer text-left hover:from-green-100 hover:to-emerald-100 transition-all"
      >
        <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-sm">
          🤖
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-bold text-gray-900">কৃষি AI সহকারী</div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse-dot" />
            <span className="text-[10px] text-green-700">অনলাইন · প্রশ্ন করুন</span>
          </div>
        </div>
        <span className="text-[10px] font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
          {isExpanded ? "ছোট করুন ▲" : "খুলুন ▼"}
        </span>
      </button>

      {/* Collapsed preview */}
      {!isExpanded && (
        <div className="px-4 py-3">
          {lastAiMessage ? (
            <div className="text-[12px] text-gray-700 leading-relaxed line-clamp-2">
              {lastAiMessage.content}
            </div>
          ) : (
            <div className="text-[12px] text-gray-500">
              কৃষি সংক্রান্ত যেকোনো প্রশ্ন করুন — ফসলের রোগ, সারের মাত্রা, আবহাওয়া বা বাজার মূল্য
            </div>
          )}
          {/* Quick suggestion chips */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none mt-2">
            {SEASON_SUGGESTIONS.slice(0, 3).map((s, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(true);
                  setTimeout(() => sendMessage(s), 300);
                }}
                className="whitespace-nowrap text-[10px] font-medium bg-green-50 border border-green-200 text-green-700 px-2.5 py-1 rounded-full hover:bg-green-100 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Expanded chat interface */}
      {isExpanded && (
        <>
          {/* Messages area */}
          <div
            ref={scrollRef}
            className="px-3 py-3 space-y-2.5 overflow-y-auto scrollbar-none"
            style={{ maxHeight: "280px", minHeight: "160px" }}
          >
            {messages.length === 0 && (
              <div className="text-center py-4">
                <div className="text-3xl mb-2">🌾</div>
                <div className="text-[12px] text-gray-500 mb-3">
                  আমি কৃষি AI সহকারী। আপনার কৃষি সংক্রান্ত প্রশ্ন করুন!
                </div>
                <div className="flex gap-1.5 flex-wrap justify-center">
                  {SEASON_SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(s)}
                      className="whitespace-nowrap text-[10px] font-medium bg-green-50 border border-green-200 text-green-700 px-2.5 py-1 rounded-full hover:bg-green-100 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                    msg.role === "user"
                      ? "bg-[#1b8a3e] text-white rounded-br-md"
                      : "bg-gray-100 text-gray-800 rounded-bl-md"
                  }`}
                >
                  <div className="text-[12px] leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-md px-3 py-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-2 px-3 py-2.5 border-t border-gray-100 bg-gray-50/50">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="আপনার প্রশ্ন লিখুন..."
              className="flex-1 bg-white rounded-full px-3.5 py-2 text-[12px] outline-none border border-gray-200 focus:border-green-400 focus:ring-1 focus:ring-green-400/30 transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="w-8 h-8 rounded-full bg-[#1b8a3e] text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#167035] transition-colors active:scale-95 shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
            <a
              href="/chat"
              className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors shrink-0 no-underline"
              title="সম্পূর্ণ চ্যাট"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </form>
        </>
      )}
    </div>
  );
}
