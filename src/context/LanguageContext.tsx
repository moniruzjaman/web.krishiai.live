"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

type Language = "bn" | "en";

const LanguageContext = createContext<{
  lang: Language;
  toggleLang: () => void;
}>({ lang: "bn", toggleLang: () => {} });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>("bn");

  useEffect(() => {
    const stored = localStorage.getItem("krishi_lang");
    if (stored === "en" || stored === "bn") setLang(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem("krishi_lang", lang);
  }, [lang]);

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === "bn" ? "en" : "bn"));
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
