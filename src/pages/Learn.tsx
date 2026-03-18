/**
 * Learn.tsx  —  v4
 *
 * Tabs:
 *   🎮 Diagnosis Game  — embeds diagnosis-game-git-v001-krishi-ai-team.vercel.app
 *   🔬 CABI গেম        — built-in CABI scenario game (AI-explained)
 *   🧠 কুইজ            — 8-question agri quiz with XP
 *   📚 কোর্স           — course library with progress
 */

import { useState } from "react";
import { analyzeText, buildAgriPrompt } from "@/services/aiService";

const GAME_URL = "https://diagnosis-game-git-v001-krishi-ai-team.vercel.app/";

// ── XP helpers ────────────────────────────────────────────────────────────────
const getXP       = () => parseInt(localStorage.getItem("krishi_xp")  || "0");
const addXP       = (n: number) => localStorage.setItem("krishi_xp", String(getXP() + n));
const getProgress = () => JSON.parse(localStorage.getItem("krishi_progress") || "{}");
const markDone    = (k: string) => {
  const p = getProgress(); p[k] = true;
  localStorage.setItem("krishi_progress", JSON.stringify(p));
};

// ── Data ──────────────────────────────────────────────────────────────────────
const QUIZ_QUESTIONS = [
  { q:"ধানের ব্লাস্ট রোগ কোন ছত্রাক দ্বারা হয়?",            opts:["Magnaporthe oryzae","Fusarium oxysporum","Alternaria alternata","Phytophthora infestans"], ans:0 },
  { q:"BRRI উদ্ভাবিত সবচেয়ে জনপ্রিয় বোরো ধানের জাত কোনটি?", opts:["BRRI dhan28","BRRI dhan29","BRRI dhan50","BRRI dhan81"],                              ans:1 },
  { q:"মাটির আদর্শ PH কত?",                                   opts:["4.0–5.5","5.5–7.0","7.5–9.0","9.0–11.0"],                                               ans:1 },
  { q:"DAE হটলাইন নম্বর কোনটি?",                              opts:["16123","16130","999","16100"],                                                              ans:0 },
  { q:"পাটের আঁশ বের করার পদ্ধতির নাম কী?",                  opts:["Retting","Threshing","Grafting","Budding"],                                                  ans:0 },
  { q:"বাংলাদেশে সবচেয়ে বেশি উৎপাদিত ফসল কোনটি?",           opts:["গম","পাট","ধান","ভুট্টা"],                                                                  ans:2 },
  { q:"সবজি চাষে ড্রিপ সেচের প্রধান সুবিধা কোনটি?",          opts:["বেশি পানি লাগে","পানি সাশ্রয় ৫০-৭০%","মাটি শক্ত হয়","রোগ বাড়ে"],                          ans:1 },
  { q:"Trichoderma কী কাজ করে?",                              opts:["সার তৈরি","মাটিবাহিত রোগ প্রতিরোধ","পোকা মারে","পানি ধারণ"],                                 ans:1 },
];

const CABI_SCENARIOS = [
  { id:"s1", crop:"ধান",  icon:"🌾", symptoms:"পাতায় হীরার আকৃতির ধূসর-সাদা দাগ, বাদামি প্রান্ত। শীষে সাদা দাগ ও চিটা হচ্ছে।",                              choices:["ব্লাস্ট রোগ","বাদামি দাগ","পাতা পোড়া","স্টেম বোরার"], correct:0, xp:30, protocol:"BRRI-CABI-001", treatment:"Tricyclazole 75% WP @ 0.6g/L স্প্রে করুন" },
  { id:"s2", crop:"আলু",  icon:"🥔", symptoms:"পাতায় জলছাপ দাগ, নিচে সাদা তুলার মতো বৃদ্ধি। দ্রুত ছড়াচ্ছে, পচা গন্ধ আসছে।",                              choices:["লেট ব্লাইট","আর্লি ব্লাইট","মোজাইক ভাইরাস","রিংরট"],   correct:0, xp:30, protocol:"BARI-CABI-002", treatment:"Metalaxyl+Mancozeb @ 2.5g/L স্প্রে করুন" },
  { id:"s3", crop:"সবজি", icon:"🥦", symptoms:"পাতার নিচে অসংখ্য ছোট সাদা পোকা, পাতা হলুদ হয়ে কুঁকড়ে যাচ্ছে। মধু-রস নিঃসরণ।",                           choices:["জাব পোকা","সাদা মাছি","থ্রিপস","মাকড়"],                  correct:1, xp:25, protocol:"DAE-IPM-003",   treatment:"Imidacloprid 0.5ml/L অথবা হলুদ আঠালো ফাঁদ" },
  { id:"s4", crop:"কলা",  icon:"🍌", symptoms:"পাতা হলুদ হয়ে ঝুলে পড়ছে, কাটলে কালো দাগ। গাছ একটি একটি করে মরে যাচ্ছে।",                                   choices:["পানামা উইল্ট","সিগাটোকা","বাঞ্চি টপ","অ্যান্থ্রাকনোজ"], correct:0, xp:35, protocol:"BARI-CABI-004", treatment:"আক্রান্ত গাছ তুলে পুড়িয়ে ফেলুন, BARI কলা-১ জাত ব্যবহার করুন" },
];

const COURSES = [
  { title:"Diagnosis Game — অনলাইন",   sub:"krishi-ai-team কর্তৃক",    icon:"🎮", color:"#7c3aed", bg:"linear-gradient(135deg,#ede9fe,#dbeafe)", lessons:20, badge:"LIVE",  onClick: ()=>null },
  { title:"CABI ডায়াগনোসিস মাস্টার",  sub:"আন্তর্জাতিক প্রোটোকল",    icon:"🔬", color:"#e53e3e", bg:"linear-gradient(135deg,#fee2e2,#fce7f3)", lessons:12, badge:"সার্টিফিকেট" },
  { title:"মাটি বিজ্ঞান বেসিক",        sub:"SRDI ভিত্তিক পাঠ্যক্রম",  icon:"🏺", color:"#9d174d", bg:"linear-gradient(135deg,#fce7f3,#ede9fe)", lessons:10, badge:"সার্টিফিকেট" },
  { title:"সমন্বিত বালাই ব্যবস্থাপনা", sub:"IPM · IRAC/FRAC প্রটোকল", icon:"🛡️", color:"#1d4ed8", bg:"linear-gradient(135deg,#dbeafe,#ede9fe)", lessons:15, badge:"সার্টিফিকেট" },
];

type Tab = "game" | "cabi" | "quiz" | "courses";

export default function Learn() {
  const [tab,         setTab]         = useState<Tab>("game");
  const [xp,          setXp]          = useState(getXP());
  const [embedState,  setEmbedState]  = useState<"loading"|"ok"|"fail">("loading");

  // CABI state
  const [cabiIdx,    setCabiIdx]    = useState(0);
  const [cabiAns,    setCabiAns]    = useState<number | null>(null);
  const [cabiResult, setCabiResult] = useState<"correct" | "wrong" | null>(null);
  const [aiExplain,  setAiExplain]  = useState<string | null>(null);
  const [explaining, setExplaining] = useState(false);

  // Quiz state
  const [qIdx,   setQIdx]   = useState(0);
  const [qAns,   setQAns]   = useState<number | null>(null);
  const [qScore, setQScore] = useState(0);
  const [qDone,  setQDone]  = useState(false);

  const scenario = CABI_SCENARIOS[cabiIdx];
  const level    = Math.floor(xp / 100) + 1;
  const levelXP  = xp % 100;

  // ── CABI answer handler ───────────────────────────────────────────────────
  const handleCabi = async (i: number) => {
    if (cabiAns !== null) return;
    setCabiAns(i);
    const correct = i === scenario.correct;
    setCabiResult(correct ? "correct" : "wrong");
    if (correct) { addXP(scenario.xp); setXp(getXP()); markDone(scenario.id); }
    setExplaining(true);
    const p = buildAgriPrompt(
      `${scenario.crop} ফসলের লক্ষণ: "${scenario.symptoms}"\n` +
      `সঠিক রোগ: ${scenario.choices[scenario.correct]}\n` +
      `চিকিৎসা: ${scenario.treatment}\n৬০ শব্দে ব্যাখ্যা দিন।`
    );
    const r = await analyzeText(p);
    setAiExplain(r.text);
    setExplaining(false);
  };

  const nextScenario = () => {
    setCabiIdx((cabiIdx + 1) % CABI_SCENARIOS.length);
    setCabiAns(null); setCabiResult(null); setAiExplain(null);
  };

  // ── Quiz answer handler ───────────────────────────────────────────────────
  const handleQuiz = (i: number) => {
    if (qAns !== null) return;
    setQAns(i);
    const correct = i === QUIZ_QUESTIONS[qIdx].ans;
    if (correct) { addXP(10); setXp(getXP()); setQScore(s => s + 1); }
    setTimeout(() => {
      if (qIdx + 1 < QUIZ_QUESTIONS.length) { setQIdx(qIdx + 1); setQAns(null); }
      else setQDone(true);
    }, 1100);
  };

  // ── shared pill tab style ─────────────────────────────────────────────────
  const tabStyle = (id: Tab) => ({
    flex: 1, padding: "9px 4px", borderRadius: 26, border: "none",
    fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all .2s",
    fontFamily: "inherit",
    background: tab === id ? "#4c1d95" : "transparent",
    color:      tab === id ? "#fff"    : "#6b7280",
  } as React.CSSProperties);

  return (
    <div style={{ background:"var(--bg)", minHeight:"100vh" }}>

      {/* ── Header ────────────────────────────────────────────── */}
      <div style={{ background:"linear-gradient(135deg,#1e1b4b,#312e81,#4c1d95)", padding:"20px 16px 28px", position:"relative" }}>
        <div style={{ position:"absolute", bottom:-1, left:0, right:0, height:20, background:"var(--bg)", borderRadius:"20px 20px 0 0" }}/>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
          <div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,.5)", fontWeight:700, letterSpacing:".1em", marginBottom:4 }}>LEARNING CENTER</div>
            <h1 style={{ fontSize:20, fontWeight:700, color:"#fff" }}>কৃষি শিখন কেন্দ্র</h1>
          </div>
          <div style={{ textAlign:"right" }}>
            <div className="xp-badge">⭐ {xp} XP</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,.5)", marginTop:4 }}>লেভেল {level}</div>
          </div>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width:`${levelXP}%` }}/>
        </div>
      </div>

      <div style={{ padding:"16px 16px 100px" }}>

        {/* ── Tabs ─────────────────────────────────────────────── */}
        <div style={{ display:"flex", background:"#e5e7eb", borderRadius:30, padding:3, gap:2, marginBottom:20 }}>
          <button style={tabStyle("game")}    onClick={() => setTab("game")}>🎮 গেম</button>
          <button style={tabStyle("cabi")}    onClick={() => setTab("cabi")}>🔬 CABI</button>
          <button style={tabStyle("quiz")}    onClick={() => setTab("quiz")}>🧠 কুইজ</button>
          <button style={tabStyle("courses")} onClick={() => setTab("courses")}>📚 কোর্স</button>
        </div>

        {/* ═══════════════════════════════════════════════════════
            TAB 1 — DIAGNOSIS GAME (embedded)
        ═══════════════════════════════════════════════════════ */}
        {tab === "game" && (
          <div className="fade-up">

            {/* Status strip */}
            {embedState === "loading" && (
              <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(76,29,149,.08)", border:".5px solid rgba(76,29,149,.2)", borderRadius:10, padding:"9px 14px", marginBottom:12, fontSize:12, color:"#4c1d95", fontWeight:600 }}>
                <span className="spin" style={{ display:"inline-block" }}>⏳</span>
                Diagnosis Game লোড হচ্ছে…
              </div>
            )}
            {embedState === "ok" && (
              <div style={{ display:"flex", alignItems:"center", gap:8, background:"#f0fdf4", border:".5px solid #86efac", borderRadius:10, padding:"7px 14px", marginBottom:12, fontSize:12, color:"#166534", fontWeight:600 }}>
                ✅ Diagnosis Game সংযুক্ত
                <a href={GAME_URL} target="_blank" rel="noopener noreferrer"
                   style={{ marginLeft:"auto", fontSize:11, color:"var(--green)", fontWeight:700 }}>
                  নতুন ট্যাবে ↗
                </a>
              </div>
            )}
            {embedState === "fail" && (
              <div style={{ background:"#fff7ed", border:".5px solid #fed7aa", borderRadius:10, padding:"10px 14px", marginBottom:12, fontSize:12, color:"#c2410c" }}>
                <div style={{ fontWeight:600, marginBottom:4 }}>⚠️ Diagnosis Game এখন লোড হয়নি</div>
                <a href={GAME_URL} target="_blank" rel="noopener noreferrer"
                   style={{ color:"var(--green)", fontWeight:700, fontSize:11 }}>
                  সরাসরি খুলুন → {GAME_URL}
                </a>
              </div>
            )}

            {/* Iframe */}
            <div style={{ borderRadius:14, overflow:"hidden",
              border:`.5px solid ${embedState==="ok"?"rgba(27,138,62,.3)":"#e5e7eb"}`,
              boxShadow:"0 2px 16px rgba(0,0,0,.08)",
              display: embedState === "fail" ? "none" : "block" }}>
              <iframe
                src={GAME_URL}
                onLoad={() => setEmbedState("ok")}
                onError={() => setEmbedState("fail")}
                style={{ width:"100%", height:"580px", border:"none", display:"block" }}
                title="Krishi AI Diagnosis Game"
                allow="camera; microphone; geolocation"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
              />
            </div>

            {/* fallback: show CABI game inline */}
            {embedState === "fail" && (
              <div className="fade-in">
                <div style={{ background:"linear-gradient(135deg,#4c1d95,#312e81)", borderRadius:12, padding:14, color:"#fff", marginBottom:14, textAlign:"center" }}>
                  <div style={{ fontSize:13, opacity:.7, marginBottom:4 }}>অফলাইন মোড — CABI গেম খেলুন</div>
                  <button onClick={() => setTab("cabi")} style={{ padding:"9px 22px", background:"rgba(255,255,255,.15)", border:".5px solid rgba(255,255,255,.3)", borderRadius:20, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                    🔬 CABI গেম শুরু করুন →
                  </button>
                </div>
              </div>
            )}

            <div style={{ fontSize:10, color:"#9ca3af", textAlign:"center", marginTop:8 }}>
              {GAME_URL}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            TAB 2 — CABI BUILT-IN GAME
        ═══════════════════════════════════════════════════════ */}
        {tab === "cabi" && (
          <div className="fade-up">
            {/* Scenario header */}
            <div style={{ background:"linear-gradient(135deg,#4c1d95,#312e81)", borderRadius:16, padding:14, color:"#fff", marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:10, opacity:.6, marginBottom:2 }}>CABI DIAGNOSIS · {scenario.protocol}</div>
                <div style={{ fontSize:15, fontWeight:700 }}>রোগ সনাক্তকরণ গেম</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:10, opacity:.6 }}>{cabiIdx + 1}/{CABI_SCENARIOS.length}</div>
                <div style={{ fontSize:11, background:"rgba(255,255,255,.15)", padding:"2px 9px", borderRadius:20, marginTop:3 }}>+{scenario.xp} XP</div>
              </div>
            </div>

            {/* Scenario card */}
            <div className="glass" style={{ borderRadius:16, padding:18, marginBottom:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
                <div style={{ width:52, height:52, background:"linear-gradient(135deg,#f0fdf4,#dcfce7)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26 }}>{scenario.icon}</div>
                <div>
                  <div style={{ fontSize:11, color:"#9ca3af", fontWeight:600 }}>ফসল</div>
                  <div style={{ fontSize:17, fontWeight:700, color:"#111" }}>{scenario.crop}</div>
                </div>
              </div>
              <div style={{ background:"#f9fafb", borderRadius:10, padding:13, marginBottom:14, border:".5px solid #e5e7eb" }}>
                <div style={{ fontSize:11, color:"#9ca3af", marginBottom:6, fontWeight:600 }}>🔍 লক্ষণ</div>
                <div style={{ fontSize:13, color:"#111", lineHeight:1.65 }}>{scenario.symptoms}</div>
              </div>
              <div style={{ fontSize:12, fontWeight:700, color:"#111", marginBottom:10 }}>এটি কোন রোগ/সমস্যা?</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {scenario.choices.map((ch, i) => {
                  let bg = "#f9fafb", border = ".5px solid #e5e7eb", color = "#111";
                  if (cabiAns !== null) {
                    if (i === scenario.correct)                    { bg = "#dcfce7"; border = ".5px solid #16a34a"; color = "#166534"; }
                    else if (i === cabiAns && i !== scenario.correct) { bg = "#fee2e2"; border = ".5px solid #e53e3e"; color = "#991b1b"; }
                  }
                  return (
                    <button key={i} onClick={() => handleCabi(i)}
                      style={{ padding:"10px 8px", background:bg, border, borderRadius:10, fontSize:12, fontWeight:600, color, cursor:cabiAns !== null ? "default" : "pointer", textAlign:"left", transition:"all .2s", fontFamily:"inherit" }}>
                      {ch}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Result */}
            {cabiResult && (
              <div className="fade-up" style={{ background:cabiResult==="correct"?"#f0fdf4":"#fff1f2", border:`.5px solid ${cabiResult==="correct"?"#86efac":"#fca5a5"}`, borderRadius:14, padding:16, marginBottom:12 }}>
                <div style={{ fontSize:15, fontWeight:700, color:cabiResult==="correct"?"#166534":"#991b1b", marginBottom:8 }}>
                  {cabiResult === "correct" ? `✅ সঠিক! +${scenario.xp} XP` : "❌ ভুল উত্তর"}
                </div>
                <div style={{ fontSize:12, fontWeight:700, color:"#111", marginBottom:6 }}>সঠিক: {scenario.choices[scenario.correct]}</div>
                <div style={{ fontSize:11, background:"rgba(27,138,62,.08)", color:"var(--green)", padding:"4px 10px", borderRadius:8, display:"inline-block", marginBottom:explaining||aiExplain?10:0, fontWeight:600 }}>
                  💊 {scenario.treatment}
                </div>
                {explaining && <div style={{ fontSize:12, color:"#9ca3af" }} className="pulse">AI ব্যাখ্যা লোড হচ্ছে…</div>}
                {aiExplain  && <div style={{ fontSize:12, color:"#374151", lineHeight:1.65 }}>{aiExplain}</div>}
              </div>
            )}
            {cabiAns !== null && (
              <button onClick={nextScenario} style={{ width:"100%", padding:13, background:"linear-gradient(135deg,#4c1d95,#312e81)", border:"none", borderRadius:12, color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                পরবর্তী দৃশ্যকল্প →
              </button>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            TAB 3 — QUIZ
        ═══════════════════════════════════════════════════════ */}
        {tab === "quiz" && (
          <div className="fade-up">
            {qDone ? (
              <div style={{ textAlign:"center", padding:"40px 20px" }}>
                <div style={{ fontSize:56, marginBottom:16 }}>🏆</div>
                <div style={{ fontSize:22, fontWeight:700, color:"#111", marginBottom:8 }}>কুইজ সম্পন্ন!</div>
                <div style={{ fontSize:16, color:"var(--green)", fontWeight:600, marginBottom:20 }}>
                  {qScore}/{QUIZ_QUESTIONS.length} সঠিক · +{qScore * 10} XP
                </div>
                <button onClick={() => { setQIdx(0); setQAns(null); setQScore(0); setQDone(false); }}
                  style={{ padding:"12px 28px", background:"var(--green)", border:"none", borderRadius:12, color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                  আবার খেলুন
                </button>
              </div>
            ) : (
              <>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <span style={{ fontSize:12, color:"#9ca3af" }}>{qIdx + 1}/{QUIZ_QUESTIONS.length}</span>
                  <span className="xp-badge">⭐ {xp} XP</span>
                </div>
                <div className="progress-bar" style={{ marginBottom:16 }}>
                  <div className="progress-fill" style={{ width:`${(qIdx / QUIZ_QUESTIONS.length) * 100}%` }}/>
                </div>
                <div className="glass" style={{ borderRadius:16, padding:20, marginBottom:14 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:"#111", lineHeight:1.5, marginBottom:20 }}>
                    {QUIZ_QUESTIONS[qIdx].q}
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {QUIZ_QUESTIONS[qIdx].opts.map((o, i) => {
                      let bg = "#f9fafb", border = ".5px solid #e5e7eb", color = "#111";
                      if (qAns !== null) {
                        if (i === QUIZ_QUESTIONS[qIdx].ans)       { bg = "#dcfce7"; border = ".5px solid #16a34a"; color = "#166534"; }
                        else if (i === qAns)                       { bg = "#fee2e2"; border = ".5px solid #e53e3e"; color = "#991b1b"; }
                      }
                      return (
                        <button key={i} onClick={() => handleQuiz(i)}
                          style={{ padding:"12px 14px", background:bg, border, borderRadius:10, fontSize:13, fontWeight:500, color, cursor:qAns !== null ? "default" : "pointer", textAlign:"left", transition:"all .2s", fontFamily:"inherit" }}>
                          {o}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            TAB 4 — COURSES
        ═══════════════════════════════════════════════════════ */}
        {tab === "courses" && (
          <div className="fade-up">
            {COURSES.map((c, i) => (
              <div key={i} style={{ background:c.bg, borderRadius:16, padding:16, marginBottom:12, boxShadow:"0 2px 10px rgba(0,0,0,.06)", cursor:c.onClick?"pointer":"default" }}
                onClick={() => { if (i === 0) setTab("game"); }}>
                <div style={{ display:"flex", gap:12, alignItems:"flex-start", marginBottom:12 }}>
                  <div style={{ width:50, height:50, background:"rgba(255,255,255,.7)", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}>{c.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:"#111", marginBottom:2 }}>{c.title}</div>
                    <div style={{ fontSize:11, color:"#6b7280", marginBottom:8 }}>{c.sub}</div>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      <span style={{ fontSize:10, background:"rgba(255,255,255,.7)", padding:"2px 8px", borderRadius:20, fontWeight:600, color:"#111" }}>📖 {c.lessons} পাঠ</span>
                      <span style={{ fontSize:10, padding:"2px 8px", borderRadius:20, fontWeight:600,
                        background: c.badge === "LIVE" ? "rgba(34,197,94,.2)" : "rgba(245,158,11,.2)",
                        color:      c.badge === "LIVE" ? "#166534"            : "#b45309" }}>
                        {c.badge === "LIVE" ? "🔴 LIVE" : `🏆 ${c.badge}`}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: i===0 ? "100%" : "0%" }}/>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
                  <span style={{ fontSize:10, color:"#9ca3af" }}>{i===0?"সক্রিয়":"শুরু হয়নি"}</span>
                  <span style={{ fontSize:11, fontWeight:700, color:c.color }}>
                    {i === 0 ? "খেলুন →" : "শীঘ্রই →"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
