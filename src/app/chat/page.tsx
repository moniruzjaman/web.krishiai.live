/**
 * ChatPage.tsx — AI-powered Agricultural Chat with persistence
 *
 * Features:
 * - Real AI chat via /api/chat (Supabase + AI Provider Fallback)
 * - Message persistence in localStorage
 * - Clear chat button
 * - Bengali-first responses
 * - Suggestion chips for first-time users
 * - Proper hydration-safe timestamps
 */

"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { FormEvent } from "react";

// ── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number; // Store as epoch for serialization
}

const SUGGESTIONS = [
  "ধানের ব্লাস্ট রোগ কী?",
  "সঠিক সারের মাত্রা কত?",
  "শীতকালীন সবজি চাষ",
  "আবহাওয়া পূর্বাভাস",
];

const STORAGE_KEY = "krishi_chat_messages";

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "নমস্কার! আমি কৃষি AI সহকারী। আপনার কৃষি সংক্রান্ত যেকোনো প্রশ্ন করুন — ফসলের রোগ, সারের মাত্রা, আবহাওয়া পূর্বাভাস বা বাজার মূল্য সম্পর্যে জানতে চাইলে আমি সাহায্য করতে পারি।",
  timestamp: 0, // Will be set on load
};

// ── Storage helpers ──────────────────────────────────────────────────────────
function loadMessages(): Message[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveMessages(msgs: Message[]) {
  try {
    if (typeof window === "undefined") return;
    // Keep last 50 messages to prevent storage overflow
    const toSave = msgs.slice(-50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // Storage full, ignore
  }
}

// ── Component ────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(() => {
    const stored = loadMessages();
    return stored.length > 0 ? stored : [{ ...WELCOME_MESSAGE, timestamp: Date.now() }];
  });
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Save messages when they change
  useEffect(() => {
    if (messages.length > 0) {
      saveMessages(messages);
    }
  }, [messages]);

  // Auto-scroll to bottom
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
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      // Build message history for API (last 10 messages)
      const chatHistory = [...messages, userMsg]
        .filter((m) => m.id !== "welcome" || m.role !== "assistant")
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
        content: data.reply || data.error || "আমি এই মুহূর্তে উত্তর দিতে পারছি না। আবার চেষ্টা করুন।",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "নেটওয়ার্ক সমস্যা হয়েছে। আবার চেষ্টা করুন।",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errMsg]);
    }

    setIsTyping(false);
  }, [messages, isTyping]);

  const clearChat = useCallback(() => {
    const fresh: Message[] = [{ ...WELCOME_MESSAGE, timestamp: Date.now() }];
    setMessages(fresh);
    saveMessages(fresh);
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  // Format timestamp for display
  const formatTime = (ts: number) => {
    if (!ts) return "";
    try {
      return new Date(ts).toLocaleTimeString("bn-BD", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 min-h-screen flex flex-col">
      {/* Chat header */}
      <div className="chat-header px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <span className="text-xl">🤖</span>
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold text-white">কৃষি AI সহকারী</div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse-dot" />
            <span className="text-[10px] text-white/70">অনলাইন</span>
          </div>
        </div>
        {/* Clear chat button */}
        {messages.length > 1 && (
          <button
            onClick={clearChat}
            className="text-white/60 hover:text-white text-[10px] font-semibold bg-white/10 border border-white/20 rounded-full px-3 py-1.5 cursor-pointer transition-colors"
            title="চ্যাট মুছুন"
          >
            🗑️ মুছুন
          </button>
        )}
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="chat-messages flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                msg.role === "user"
                  ? "bg-[#1b8a3e] text-white rounded-br-md"
                  : "bg-white text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-bl-md card-shadow"
              }`}
            >
              <div className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.content}</div>
              <div
                className={`text-[9px] mt-1 ${
                  msg.role === "user" ? "text-white/50" : "text-gray-400 dark:text-gray-500"
                }`}
              >
                {formatTime(msg.timestamp)}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3 border border-gray-200 dark:border-gray-700 card-shadow">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce chat-dot-delay-1" />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce chat-dot-delay-2"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s)}
                className="whitespace-nowrap text-[11px] font-medium bg-white border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-full hover:bg-green-50 hover:border-green-300 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3 pb-20">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="আপনার প্রশ্ন লিখুন..."
            className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1b8a3e]/30 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="w-10 h-10 rounded-full bg-[#1b8a3e] text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#167035] transition-colors active:scale-95 shrink-0"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
