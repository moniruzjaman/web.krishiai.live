import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const nav = useNavigate();
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: "60vh", gap: 16, padding: 24,
      textAlign: "center",
    }}>
      <span style={{ fontSize: 64 }}>🌾</span>
      <h1 style={{ fontSize: 32, fontWeight: 900, color: "#fff" }}>404</h1>
      <p style={{ color: "var(--text-muted)", maxWidth: 340 }}>
        পৃষ্ঠাটি পাওয়া যায়নি। হয়তো এটি সরানো হয়েছে বা ঠিকানাটি ভুল।
      </p>
      <button
        onClick={() => nav("/")}
        style={{
          background: "#10b981", border: "none", color: "#fff",
          padding: "12px 28px", borderRadius: 10, fontSize: 15,
          fontWeight: 700, cursor: "pointer",
        }}
      >
        🏠 হোমে ফিরুন
      </button>
    </div>
  );
}
