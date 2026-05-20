import { useState, useEffect, Suspense } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styles from "./Layout.module.css";
import { PageSkeleton } from "./LoadingSkeleton";

export default function Layout() {
  const { pathname } = useLocation();
  const { t, i18n } = useTranslation();
  const [dark, setDark] = useState(() => localStorage.getItem("krishi_dark") === "true");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("krishi_dark", String(dark));
  }, [dark]);

  const toggleLang = () => {
    const newLang = i18n.language === "bn" ? "en" : "bn";
    i18n.changeLanguage(newLang);
    localStorage.setItem("krishi_lang", newLang);
  };

  return (
    <div className={styles.shell}>
      {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ""}`}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <span style={{fontSize:18,fontWeight:700,color:"#1b8a3e"}}>{t("app.title")}</span>
          <button onClick={() => setSidebarOpen(false)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#333"}}>✕</button>
        </div>
        <nav style={{display:"flex",flexDirection:"column",gap:2}}>
          <NavLink to="/" end onClick={() => setSidebarOpen(false)} className={({isActive}) => `${styles.sidebarLink} ${isActive ? styles.sidebarLinkActive : ""}`}>
            <span>🏠</span> {t("layout.home")}
          </NavLink>
          <NavLink to="/tools" onClick={() => setSidebarOpen(false)} className={({isActive}) => `${styles.sidebarLink} ${isActive ? styles.sidebarLinkActive : ""}`}>
            <span>🔧</span> {t("layout.tools")}
          </NavLink>
          <NavLink to="/analyzer" onClick={() => setSidebarOpen(false)} className={({isActive}) => `${styles.sidebarLink} ${isActive ? styles.sidebarLinkActive : ""}`}>
            <span>📷</span> {t("layout.analyzer")}
          </NavLink>
          <NavLink to="/learn" onClick={() => setSidebarOpen(false)} className={({isActive}) => `${styles.sidebarLink} ${isActive ? styles.sidebarLinkActive : ""}`}>
            <span>📚</span> {t("layout.learn")}
          </NavLink>
          <NavLink to="/profile" onClick={() => setSidebarOpen(false)} className={({isActive}) => `${styles.sidebarLink} ${isActive ? styles.sidebarLinkActive : ""}`}>
            <span>👤</span> {t("layout.profile")}
          </NavLink>
        </nav>
      </aside>
      {/* Exact krishiai.live navbar */}
      <header className={styles.navbar}>
        <button className={styles.ham} aria-label="menu" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <span /><span /><span />
        </button>
        <div className={styles.logo}>
          {/* Exact leaf SVG from krishiai.live */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M17 8C8 10 5.9 16.17 3.82 19.83c.17-.05.33-.12.5-.17C6 19 7.5 18.5 9 18.5c3.5 0 5.5-2 8-4.5S21 8 21 8c-1.5 1-3.5 1.5-5.5 1.5C14 9.5 15.5 8 17 8z" fill="#fff"/>
            <path d="M3.82 19.83C3.27 20.72 3 21.5 3 22c0 0 2-1 4.17-2.17" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div className={styles.navSpacer} />
        <button className={styles.iconBtn} aria-label="share">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
        </button>
        <button className={styles.iconBtn} aria-label="audio">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 010 7.07"/></svg>
        </button>
        <div className={styles.langToggle}>
          <span className={styles.langOn} onClick={toggleLang}>{t("lang.bn")}</span>
          <span className={styles.langOff} onClick={toggleLang}>{t("lang.en")}</span>
        </div>
        <button className={styles.iconBtn} onClick={() => setDark(!dark)} aria-label={dark ? "Light mode" : "Dark mode"}>
          {dark ? "☀️" : "🌙"}
        </button>
        <div className={styles.avatar}>
          ক
          <div className={styles.avatarLeaf}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
              <path d="M17 8C8 10 5.9 16.17 3.82 19.83c.17-.05.33-.12.5-.17C6 19 7.5 18.5 9 18.5c3.5 0 5.5-2 8-4.5S21 8 21 8c-1.5 1-3.5 1.5-5.5 1.5C14 9.5 15.5 8 17 8z" fill="#1b4332"/>
            </svg>
          </div>
        </div>
      </header>

      <main className={styles.main} key={pathname}>
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </main>

      {/* Bottom nav — matches krishiai.live exactly */}
      <nav className={styles.bottomNav} role="navigation" aria-label="Main navigation">
        <NavLink to="/" end className={({ isActive }) => `${styles.bn} ${isActive ? styles.bnActive : ""}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span>{t("layout.home")}</span>
        </NavLink>
        <NavLink to="/tools" className={({ isActive }) => `${styles.bn} ${isActive ? styles.bnActive : ""}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
          <span>{t("layout.tools")}</span>
        </NavLink>
        {/* Center camera button */}
        <NavLink to="/analyzer" className={({ isActive }) => `${styles.bnCenter} ${isActive ? styles.bnCenterActive : ""}`}>
          <div className={styles.bnCenterBtn}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
          </div>
          <span className={styles.bnCenterLbl}>{t("layout.analyzer")}</span>
        </NavLink>
        <NavLink to="/learn" className={({ isActive }) => `${styles.bn} ${isActive ? styles.bnActive : ""}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
          <span>{t("layout.learn")}</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `${styles.bn} ${isActive ? styles.bnActive : ""}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span>{t("layout.profile")}</span>
        </NavLink>
      </nav>
    </div>
  );
}
