import { Outlet, NavLink, useLocation } from "react-router-dom";
import styles from "./Layout.module.css";

export default function Layout() {
  const { pathname } = useLocation();
  return (
    <div className={styles.shell}>
      {/* Exact krishiai.live navbar */}
      <header className={styles.navbar}>
        <button className={styles.ham} aria-label="menu">
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
          <span className={styles.langOn}>বাংলা</span>
          <span className={styles.langOff}>EN</span>
        </div>
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
        <Outlet />
      </main>

      {/* Bottom nav — matches krishiai.live exactly */}
      <nav className={styles.bottomNav}>
        <NavLink to="/" end className={({ isActive }) => `${styles.bn} ${isActive ? styles.bnActive : ""}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span>হোম</span>
        </NavLink>
        <NavLink to="/chat" className={({ isActive }) => `${styles.bn} ${isActive ? styles.bnActive : ""}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
          <span>টুলস</span>
        </NavLink>
        {/* Center camera button */}
        <NavLink to="/analyzer" className={({ isActive }) => `${styles.bnCenter} ${isActive ? styles.bnCenterActive : ""}`}>
          <div className={styles.bnCenterBtn}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
          </div>
          <span className={styles.bnCenterLbl}>এআই জান</span>
        </NavLink>
        <NavLink to="/learn" className={({ isActive }) => `${styles.bn} ${isActive ? styles.bnActive : ""}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
          <span>শিক্ষা</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `${styles.bn} ${isActive ? styles.bnActive : ""}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span>প্রোফাইল</span>
        </NavLink>
      </nav>
    </div>
  );
}
