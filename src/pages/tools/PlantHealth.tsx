/**
 * PlantHealth.tsx
 *
 * Strategy:
 *   1. Try to load cabi.krishiai.live in an iframe
 *   2. If it loads → full embedded experience (no need to rebuild it)
 *   3. If it's unavailable (403/offline) → graceful fallback to
 *      the built-in AI analyzer + disease library
 *
 * This same pattern applies to all future *.krishiai.live sub-apps.
 */

import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { analyzeImage, buildAgriPrompt } from "@/services/aiService";

const CABI_URL = "https://cabi.krishiai.live/";

type EmbedState = "loading" | "loaded" | "failed";

// ── disease library fallback data ─────────────────────────────────────────────
const DISEASES = [
  { name:"ব্লাস্ট",      en:"Rice Blast",   crop:"ধান",   sev:"তীব্র",  c:"#e53e3e", tx:"Tricyclazole 75% WP @ 0.6g/L" },
  { name:"বাদামি দাগ",   en:"Brown Spot",   crop:"ধান",   sev:"মধ্যম", c:"#d97706", tx:"Mancozeb 80% WP @ 2g/L" },
  { name:"পাতা পোড়া",   en:"Leaf Blight",  crop:"ধান",   sev:"তীব্র",  c:"#e53e3e", tx:"Copper Oxychloride @ 3g/L" },
  { name:"পানামা রোগ",   en:"Panama Wilt",  crop:"কলা",   sev:"তীব্র",  c:"#e53e3e", tx:"আক্রান্ত গাছ তুলে পোড়ান" },
  { name:"আলুর ধ্বসা",   en:"Late Blight",  crop:"আলু",   sev:"তীব্র",  c:"#e53e3e", tx:"Metalaxyl+Mancozeb @ 2.5g/L" },
  { name:"মরিচা রোগ",    en:"Rust",         crop:"গম",    sev:"মধ্যম", c:"#d97706", tx:"Propiconazole @ 1ml/L" },
  { name:"সাদা মাছি",    en:"Whitefly",     crop:"সবজি", sev:"স্বল্প",  c:"#16a34a", tx:"Imidacloprid @ 0.5ml/L" },
  { name:"ফলের মাছি",    en:"Fruit Fly",    crop:"সবজি", sev:"মধ্যম", c:"#d97706", tx:"হলুদ আঠালো ফাঁদ + বিষটোপ" },
];

export default function PlantHealth() {
  const nav = useNavigate();
  const [embedState, setEmbedState] = useState<EmbedState>("loading");
  const [tab, setTab] = useState<"embed"|"scan"|"library">("embed");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Fallback AI scanner state
  const [img, setImg]       = useState<string|null>(null);
  const [result, setResult] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);

  const handleIframeLoad = () => setEmbedState("loaded");
  const handleIframeError = () => { setEmbedState("failed"); setTab("scan"); };

  const analyze = async () => {
    if (!img) return;
    setLoading(true); setResult(null);
    const p = buildAgriPrompt(
      `এই ফসলের ছবি বিশ্লেষণ করুন:\n` +
      `১. রোগ/পোকার নাম (বাংলা ও ইংরেজি)\n` +
      `২. রোগের কারণ (ছত্রাক/ব্যাকটেরিয়া/পোকা)\n` +
      `৩. ক্ষতির মাত্রা (স্বল্প/মধ্যম/তীব্র)\n` +
      `৪. তাৎক্ষণিক প্রতিকার\n` +
      `৫. প্রতিরোধমূলক ব্যবস্থা\nBRRI/BARI/DAE নির্দেশিকা অনুযায়ী উত্তর দিন।`
    );
    const r = await analyzeImage(p, img);
    setResult(r.text);
    setLoading(false);
  };

  // ── Tab definitions — shown only when embed fails ─────────────────────────
  const tabs =
    embedState === "failed"
      ? [["scan","🔬 রোগ স্ক্যান"],["library","📚 রোগ লাইব্রেরি"]]
      : [["embed","🌿 CABI অ্যানালাইজার"],["scan","🔬 AI স্ক্যান"],["library","📚 লাইব্রেরি"]];

  return (
    <div style={{ background:"var(--bg)", minHeight:"100vh" }}>

      {/* ── page header ─────────────────────────────────────────── */}
      <div className="tool-page-hdr">
        <button className="back-btn" onClick={() => nav("/tools")}>
          <svg width="16" height="16" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ position:"absolute", top:20, right:16, fontSize:36 }}>🌿</div>
        <h1>উদ্ভিদ স্বাস্থ্য বিশেষজ্ঞ</h1>
        <div className="sub">Plant Health Analyzer</div>
        <div className="badge-row">
          <span className="badge">CABI PROTOCOL</span>
          <span className="badge">BARI / BRRI</span>
          <span className="badge">DAE VERIFIED</span>
        </div>
      </div>

      <div style={{ padding:"16px 16px 100px" }}>

        {/* ── embed status banner ──────────────────────────────── */}
        {embedState === "loading" && tab === "embed" && (
          <div style={{ display:"flex", alignItems:"center", gap:10, background:"rgba(27,138,62,.08)", border:".5px solid rgba(27,138,62,.2)", borderRadius:10, padding:"10px 14px", marginBottom:14, fontSize:12, color:"var(--green)", fontWeight:600 }}>
            <span className="spin" style={{ display:"inline-block" }}>⏳</span>
            cabi.krishiai.live লোড হচ্ছে…
          </div>
        )}
        {embedState === "loaded" && (
          <div style={{ display:"flex", alignItems:"center", gap:8, background:"#f0fdf4", border:".5px solid #86efac", borderRadius:10, padding:"8px 14px", marginBottom:14, fontSize:12, color:"#166534", fontWeight:600 }}>
            <span>✅</span> cabi.krishiai.live সংযুক্ত
            <a href={CABI_URL} target="_blank" rel="noopener noreferrer"
               style={{ marginLeft:"auto", fontSize:11, color:"var(--green)", fontWeight:700 }}>
              নতুন ট্যাবে খুলুন ↗
            </a>
          </div>
        )}
        {embedState === "failed" && (
          <div style={{ display:"flex", alignItems:"center", gap:8, background:"#fff7ed", border:".5px solid #fed7aa", borderRadius:10, padding:"10px 14px", marginBottom:14, fontSize:12, color:"#c2410c", fontWeight:600 }}>
            <span>⚠️</span>
            <div>
              <div>cabi.krishiai.live এখন উপলব্ধ নেই</div>
              <div style={{ fontSize:10, color:"#9a3412", fontWeight:400, marginTop:2 }}>
                নিচের built-in AI analyzer ব্যবহার করুন
              </div>
            </div>
          </div>
        )}

        {/* ── tabs ────────────────────────────────────────────── */}
        <div style={{ display:"flex", background:"#e5e7eb", borderRadius:30, padding:3, gap:2, marginBottom:20 }}>
          {tabs.map(([id, lbl]) => (
            <button key={id} onClick={() => setTab(id as "embed"|"scan"|"library")}
              style={{ flex:1, padding:"9px 6px", borderRadius:26, border:"none", fontSize:11, fontWeight:700,
                       cursor:"pointer", transition:"all .2s",
                       background: tab===id ? "var(--green)" : "transparent",
                       color:       tab===id ? "#fff"        : "#6b7280" }}>
              {lbl}
            </button>
          ))}
        </div>

        {/* ── CABI embed ───────────────────────────────────────── */}
        {tab === "embed" && (
          <div className="fade-up">
            <div style={{ borderRadius:14, overflow:"hidden", border:".5px solid #e5e7eb",
                          boxShadow:"var(--shadow)", background:"#fff" }}>
              <iframe
                ref={iframeRef}
                src={CABI_URL}
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                style={{ width:"100%", height:"600px", border:"none", display:"block" }}
                title="CABI Plant Health Analyzer"
                allow="camera; geolocation"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
              />
            </div>
            <div style={{ fontSize:10, color:"#9ca3af", textAlign:"center", marginTop:8 }}>
              Powered by cabi.krishiai.live · CABI International Protocol
            </div>
          </div>
        )}

        {/* ── Built-in AI scanner (fallback / always available) ── */}
        {tab === "scan" && (
          <div className="fade-up">
            <div onClick={() => !img && document.getElementById("ph-file")?.click()}
              style={{ border:`2px dashed ${img?"var(--green)":"#d1d5db"}`, borderRadius:14,
                       minHeight:160, display:"flex", flexDirection:"column", alignItems:"center",
                       justifyContent:"center", gap:10, cursor:img?"default":"pointer",
                       background:img?"rgba(27,138,62,.04)":"#fff", marginBottom:14,
                       overflow:"hidden", transition:"all .2s" }}>
              <input id="ph-file" type="file" accept="image/*" capture="environment" hidden
                onChange={e => { const f=e.target.files?.[0]; if(f){ const r=new FileReader(); r.onload=ev=>setImg(ev.target?.result as string); r.readAsDataURL(f); }}}/>
              {img
                ? <img src={img} alt="crop" style={{ width:"100%", maxHeight:260, objectFit:"cover" }}/>
                : <>
                    <div style={{ width:52, height:52, background:"#f0fdf4", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>📷</div>
                    <div style={{ fontSize:13, fontWeight:600, color:"#374151" }}>ছবি তুলুন বা আপলোড করুন</div>
                    <div style={{ fontSize:11, color:"#9ca3af", textAlign:"center" }}>BARC/BARI রোগ শনাক্তকরণ প্রোটোকল</div>
                  </>
              }
            </div>

            {img && (
              <div style={{ display:"flex", gap:10, marginBottom:14 }}>
                <button onClick={analyze} disabled={loading}
                  style={{ flex:1, padding:13, background:"var(--green)", border:"none", borderRadius:12,
                           color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", opacity:loading?.7:1 }}>
                  {loading ? "🔍 বিশ্লেষণ হচ্ছে…" : "🔬 AI বিশ্লেষণ করুন"}
                </button>
                <button onClick={() => { setImg(null); setResult(null); }}
                  style={{ padding:13, paddingInline:16, background:"#f3f4f6", border:".5px solid #e5e7eb", borderRadius:12, color:"#555", fontSize:13 }}>✕</button>
              </div>
            )}

            {loading && (
              <div style={{ background:"linear-gradient(135deg,#f0fdf4,#fff)", border:".5px solid #bbf7d0", borderRadius:14, padding:20, textAlign:"center" }}>
                <div className="bounce" style={{ fontSize:32, marginBottom:8 }}>🌱</div>
                <div style={{ fontSize:13, color:"var(--green)", fontWeight:600 }}>AI বিশ্লেষণ চলছে…</div>
              </div>
            )}

            {result && !loading && (
              <div className="fade-up" style={{ background:"linear-gradient(135deg,rgba(27,74,50,.06),rgba(27,74,50,.02))", border:".5px solid rgba(27,138,62,.25)", borderRadius:14, padding:16 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:"var(--green)", letterSpacing:".06em" }}>AI বিশ্লেষণ ফলাফল</span>
                  <span style={{ marginLeft:"auto", fontSize:10, background:"rgba(27,138,62,.1)", color:"var(--green)", padding:"2px 8px", borderRadius:20, fontWeight:700 }}>Gemini 2.0</span>
                </div>
                <div style={{ fontSize:13, lineHeight:1.8, color:"#111", whiteSpace:"pre-wrap" }}>{result}</div>
                <div style={{ marginTop:12, paddingTop:10, borderTop:".5px solid rgba(27,138,62,.15)", fontSize:11, color:"#9ca3af" }}>
                  DAE হটলাইন <a href="tel:16123" style={{ color:"var(--green)", fontWeight:700 }}>16123</a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Disease library ──────────────────────────────────── */}
        {tab === "library" && (
          <div className="fade-up" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {DISEASES.map((d, i) => (
              <div key={i} className="glass" style={{ padding:14, cursor:"pointer", borderLeft:`3px solid ${d.c}` }}>
                <div style={{ fontSize:10, fontWeight:700, color:d.c, letterSpacing:".05em", textTransform:"uppercase", marginBottom:4 }}>{d.crop}</div>
                <div style={{ fontSize:13, fontWeight:700, color:"#111", marginBottom:2 }}>{d.name}</div>
                <div style={{ fontSize:10, color:"#9ca3af", marginBottom:6 }}>{d.en}</div>
                <div style={{ fontSize:10, background:`${d.c}15`, color:d.c, padding:"2px 8px", borderRadius:6, fontWeight:600, marginBottom:6 }}>{d.sev}</div>
                <div style={{ fontSize:10, color:"#6b7280", lineHeight:1.4 }}>💊 {d.tx}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
