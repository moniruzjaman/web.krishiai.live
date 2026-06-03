"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  "ধানের ব্লাস্ট রোগ কী?",
  "সঠিক সারের মাত্রা কত?",
  "শীতকালীন সবজি চাষ",
  "আবহাওয়া পূর্বাভাস",
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "নমস্কার! 🌾 আমি কৃষি AI সহকারী। আপনার কৃষি সংক্রান্ত যেকোনো প্রশ্ন করুন — ফসলের রোগ, সারের মাত্রা, আবহাওয়া পূর্বাভাস বা বাজার মূল্য সম্পর্কে জানতে চাইলে আমি সাহায্য করতে পারি।",
    timestamp: new Date(),
  },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "আপনার প্রশ্নের জন্য ধন্যবাদ! আমি আপনার কৃষি সংক্রান্ত প্রশ্নের উত্তর দিতে প্রস্তুত। অনুগ্রহ করে আরও বিস্তারিত জানালে আমি আরও ভালো পরামর্শ দিতে পারব। 🌾",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
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
            <span className="text-[10px] text-white/70">অনলাইন</span>
          </div>
        </div>
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
                  : "bg-white text-gray-800 border border-gray-200 rounded-bl-md card-shadow"
              }`}
            >
              <div className="text-[13px] leading-relaxed">{msg.content}</div>
              <div
                className={`text-[9px] mt-1 ${
                  msg.role === "user" ? "text-white/50" : "text-gray-400"
                }`}
              >
                {msg.timestamp.toLocaleTimeString("bn-BD", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 border border-gray-200 card-shadow">
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
                className="whitespace-nowrap text-[11px] font-medium bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-full hover:bg-green-50 hover:border-green-300 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 pb-20">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="আপনার প্রশ্ন লিখুন..."
            className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1b8a3e]/30 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim()}
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
