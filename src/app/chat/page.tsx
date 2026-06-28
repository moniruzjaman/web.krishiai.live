/**
 * ChatPage.tsx — AI-powered Agricultural Chat with persistence
 *
 * Features:
 * - Real AI chat via /api/chat (Supabase + AI Provider Fallback)
 * - Message persistence in localStorage
 * - Clear chat button
 * - Bengali-first responses
 * - Suggestion chips for first-time users
 * - File upload (image/PDF/doc) for Gemini 3.5 multimodal
 * - AI provider badge on every response
 * - Proper hydration-safe timestamps
 */

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { ChangeEvent, FormEvent } from "react";

// ── Types ────────────────────────────────────────────────────────────────────
interface Attachment {
  type: "image" | "pdf" | "doc";
  name: string;
  mimeType: string;
  base64: string;
  preview?: string; // data URL for image preview
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  provider?: string;
  model?: string;
  attachment?: Attachment;
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
    "স্বাগতম! আমি কৃষি AI সহকারী। আপনার কৃষি সংক্রান্ত যেকোনো প্রশ্ন করুন — ছবি, PDF বা ডকুমেন্ট আপলোড করে ফসলের রোগ নির্ণয় করতে পারেন।",
  timestamp: 0,
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
    const toSave = msgs.slice(-50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // Storage full
  }
}

// ── File type helper ─────────────────────────────────────────────────────────
function getFileType(file: File): "image" | "pdf" | "doc" {
  if (file.type.startsWith("image/")) return "image";
  if (file.type === "application/pdf") return "pdf";
  return "doc";
}

const ACCEPTED_TYPES = "image/*,.pdf,.doc,.docx,.txt,.xlsx,.csv";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ── Provider badge colors ────────────────────────────────────────────────────
const PROVIDER_COLORS: Record<string, string> = {
  Gemini: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  OpenRouter: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  Groq: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  fallback: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

// ── Component ────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load persisted messages on mount
  useEffect(() => {
    const stored = loadMessages();
    if (stored.length > 0) {
      setMessages(stored);
    } else {
      setMessages([{ ...WELCOME_MESSAGE, timestamp: Date.now() }]);
    }
    setLoaded(true);
  }, []);

  // Save messages when they change
  useEffect(() => {
    if (loaded && messages.length > 0) {
      saveMessages(messages);
    }
  }, [messages, loaded]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // ── File handling ─────────────────────────────────────────────────────────
  const handleFileSelect = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      alert("ফাইল সাইজ ১০MB এর বেশি হতে পারবে না।");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      const fileType = getFileType(file);
      setAttachment({
        type: fileType,
        name: file.name,
        mimeType: file.type,
        base64,
        preview: fileType === "image" ? reader.result as string : undefined,
      });
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be re-selected
    e.target.value = "";
  }, []);

  const removeAttachment = useCallback(() => {
    setAttachment(null);
  }, []);

  // ── Send message ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string, attachmentData?: Attachment | null) => {
      if ((!text.trim() && !attachmentData) || isTyping) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: text.trim(),
        timestamp: Date.now(),
        attachment: attachmentData || undefined,
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setAttachment(null);
      setIsTyping(true);

      try {
        // Build message history for API (last 10 messages)
        const chatHistory = [...messages, userMsg]
          .filter((m) => m.id !== "welcome")
          .slice(-10)
          .map((m) => ({
            role: m.role,
            content: m.content,
            attachment: m.attachment
              ? {
                  type: m.attachment.type,
                  mimeType: m.attachment.mimeType,
                  base64: m.attachment.base64,
                  name: m.attachment.name,
                }
              : undefined,
          }));

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
          provider: data.provider,
          model: data.model,
        };

        setMessages((prev) => [...prev, aiMsg]);
      } catch {
        const errMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "নেটওয়ার্ক সমস্যা হয়েছে। আবার চেষ্টা করুন।",
          timestamp: Date.now(),
          provider: "fallback",
        };
        setMessages((prev) => [...prev, errMsg]);
      }

      setIsTyping(false);
    },
    [messages, isTyping]
  );

  const clearChat = useCallback(() => {
    const fresh: Message[] = [{ ...WELCOME_MESSAGE, timestamp: Date.now() }];
    setMessages(fresh);
    saveMessages(fresh);
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input, attachment);
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
      <div
        className="px-4 py-3 flex items-center gap-3 sticky top-0 z-10"
        style={{
          background: "linear-gradient(135deg,#1b4332,#2d6a4f)",
        }}
      >
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <span className="text-xl">🤖</span>
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold text-white">কৃষি AI সহকারী</div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse-dot" />
            <span className="text-[10px] text-white/70">
              Gemini 3.5 Flash · বহুমাধ্যম
            </span>
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
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        style={{ maxHeight: "calc(100vh - 180px)" }}
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
              {/* Attachment preview for user messages */}
              {msg.attachment && msg.role === "user" && (
                <div className="mb-2">
                  {msg.attachment.type === "image" && (
                    <img
                      src={`data:${msg.attachment.mimeType};base64,${msg.attachment.base64}`}
                      alt={msg.attachment.name}
                      className="max-w-[200px] max-h-[150px] rounded-lg object-cover"
                    />
                  )}
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] opacity-70">
                      {msg.attachment.type === "image"
                        ? "🖼️"
                        : msg.attachment.type === "pdf"
                        ? "📄"
                        : "📝"}
                    </span>
                    <span className="text-[10px] opacity-70 truncate max-w-[150px]">
                      {msg.attachment.name}
                    </span>
                  </div>
                </div>
              )}

              <div className="text-[13px] leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </div>

              {/* Footer: provider badge + timestamp */}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {msg.role === "assistant" && msg.provider && (
                  <span
                    className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                      PROVIDER_COLORS[msg.provider] ||
                      PROVIDER_COLORS.fallback
                    }`}
                  >
                    {msg.provider}
                    {msg.model ? ` · ${msg.model}` : ""}
                  </span>
                )}
                <span
                  className={`text-[9px] ${
                    msg.role === "user"
                      ? "text-white/50"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                >
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3 border border-gray-200 dark:border-gray-700 card-shadow">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
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

      {/* Attachment preview bar */}
      {attachment && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-700 rounded-xl px-3 py-2 border border-gray-200 dark:border-gray-600">
            {attachment.type === "image" && attachment.preview && (
              <img
                src={attachment.preview}
                alt={attachment.name}
                className="w-10 h-10 rounded-lg object-cover"
              />
            )}
            {attachment.type !== "image" && (
              <span className="text-lg">
                {attachment.type === "pdf" ? "📄" : "📝"}
              </span>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-medium text-gray-800 dark:text-gray-200 truncate">
                {attachment.name}
              </div>
              <div className="text-[9px] text-gray-400">
                {(attachment.base64.length * 0.75 / 1024).toFixed(0)} KB
              </div>
            </div>
            <button
              onClick={removeAttachment}
              className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-500 hover:bg-red-100 hover:text-red-500 transition-colors text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3 pb-20">
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          {/* Attachment button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex items-center justify-center hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/30 dark:hover:text-green-400 transition-colors shrink-0 cursor-pointer"
            title="ছবি, PDF বা ডকুমেন্ট আপলোড করুন"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Text input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              attachment
                ? "সংযুক্ত ফাইল সম্পর্কে প্রশ্ন লিখুন..."
                : "আপনার প্রশ্ন লিখুন..."
            }
            className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1b8a3e]/30 transition-all"
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={(!input.trim() && !attachment) || isTyping}
            className="w-10 h-10 rounded-full bg-[#1b8a3e] text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#167035] transition-colors active:scale-95 shrink-0 cursor-pointer"
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