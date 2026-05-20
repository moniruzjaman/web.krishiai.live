import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const { t } = useTranslation();
  const nav = useNavigate();
  return (
    <div role="region" aria-label={t("not_found.title")} style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: "60vh", gap: 16, padding: 24,
      textAlign: "center",
    }}>
      <span style={{ fontSize: 64 }}>🌾</span>
      <h1 style={{ fontSize: 32, fontWeight: 900, color: "var(--text)" }}>{t("not_found.title")}</h1>
      <p style={{ color: "var(--muted)", maxWidth: 340 }} role="alert">
        {t("not_found.message")}
      </p>
      <button
        onClick={() => nav("/")}
        style={{
          background: "var(--green)", border: "none", color: "#fff",
          padding: "12px 28px", borderRadius: 10, fontSize: 15,
          fontWeight: 700, cursor: "pointer",
        }}
      >
        {t("not_found.home")}
      </button>
    </div>
  );
}
