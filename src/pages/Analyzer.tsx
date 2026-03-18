/**
 * Analyzer.tsx  —  v4
 * Fixed: image compression before upload, robust error handling,
 * graceful fallback when API unavailable, better UX feedback.
 */

import { useState, useRef, useEffect } from "react";
import { analyzeImage, checkAPIHealth, type AIResponse } from "@/services/aiService";
import styles from "./Analyzer.module.css";

// ── Diagnosis result parsed from AI text ──────────────────────────────────────
interface Diagnosis {
  disease:    string;
  disease_en: string;
  crop:       string;
  severity:   string;
  confidence: number;
  cause:      string;
  treatment:  string;
  prevention: string;
}

const SEV_COLOR: Record<string, string> = {
  "স্বল্প":  "#16a34a",
  "মধ্যম": "#d97706",
  "তীব্র":  "#e53e3e",
};

// ── Compress image to ≤ 800px and convert to JPEG base64 ─────────────────────
function compressImage(dataUrl: string, maxPx = 800, quality = 0.82): Promise<string> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width  * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.src = dataUrl;
  });
}

// ── Parse structured JSON from AI response ────────────────────────────────────
function parseDiagnosis(text: string): Diagnosis | null {
  // Try direct JSON parse
  try {
    const j = JSON.parse(text);
    if (j.disease) return j as Diagnosis;
  } catch { /* not pure JSON */ }

  // Extract JSON block from markdown
  const match = text.match(/```json\s*([\s\S]+?)```/) ||
                text.match(/\{[\s\S]*"disease"[\s\S]*\}/);
  if (match) {
    try {
      const j = JSON.parse(match[1] || match[0]);
      if (j.disease) return j as Diagnosis;
    } catch { /* ignore */ }
  }

  return null;
}

// ── Parse plain-text AI response into structured fields ───────────────────────
function parseTextDiagnosis(text: string): Diagnosis {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  const extract = (keys: string[]) => {
    for (const line of lines) {
      const lower = line.toLowerCase();
      for (const k of keys) {
        if (lower.includes(k)) {
          return line.replace(/^[০-৯\d\.\-\*#•:]+\s*/, "").replace(/.*[:：]\s*/, "").trim();
        }
      }
    }
    return "";
  };

  // Find disease name — usually first meaningful line or after "রোগের নাম"
  const diseaseRaw = extract(["রোগের নাম", "রোগ", "disease"]) ||
    lines.find(l => !l.startsWith("#") && l.length > 3) || "অজ্ঞাত রোগ";

  // Severity
  let severity = "মধ্যম";
  if (text.includes("তীব্র") || text.includes("severe") || text.includes("high")) severity = "তীব্র";
  else if (text.includes("স্বল্প") || text.includes("mild") || text.includes("low")) severity = "স্বল্প";

  return {
    disease:    diseaseRaw.slice(0, 60),
    disease_en: extract(["english", "ইংরেজি"]) || "",
    crop:       extract(["ফসল", "crop"]) || "ফসল",
    severity,
    confidence: 75,
    cause:      extract(["কারণ", "cause"]) || text.slice(0, 120),
    treatment:  extract(["প্রতিকার", "চিকিৎসা", "treatment"]) || "DAE হটলাইন 16123 এ যোগাযোগ করুন",
    prevention: extract(["প্রতিরোধ", "prevention"]) || "নিয়মিত মনিটরিং করুন",
  };
}

// ── Scan history ──────────────────────────────────────────────────────────────
interface ScanRecord { id: string; disease: string; crop: string; severity: string; ts: string; }
const getHistory = (): ScanRecord[] => { try { return JSON.parse(localStorage.getItem("krishi_scans") || "[]"); } catch { return []; } };
const saveHistory = (r: ScanRecord) => localStorage.setItem("krishi_scans", JSON.stringify([r, ...getHistory()].slice(0, 5)));

// ── Diagnosis prompt sent to AI ───────────────────────────────────────────────
const DIAGNOSE_PROMPT = `এই ফসলের ছবি বিশ্লেষণ করুন। BRRI/BARI/DAE নির্দেশিকা অনুযায়ী নিচের JSON ফরম্যাটে উত্তর দিন:

{
  "disease": "রোগের বাংলা নাম",
  "disease_en": "Disease English Name",
  "crop": "ফসলের নাম",
  "severity": "স্বল্প অথবা মধ্যম অথবা তীব্র",
  "confidence": 85,
  "cause": "রোগের কারণ (এক বাক্যে)",
  "treatment": "তাৎক্ষণিক প্রতিকার (সুনির্দিষ্ট ওষুধ ও মাত্রা সহ)",
  "prevention": "ভবিষ্যৎ প্রতিরোধ পদ্ধতি"
}

শুধু JSON দিন, অন্য কিছু নয়।`;

export default function Analyzer() {
  const [image,     setImage]     = useState<string | null>(null);
  const [thumb,     setThumb]     = useState<string | null>(null);
  const [mime,      setMime]       = useState("image/jpeg");
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [rawText,   setRawText]   = useState<string>("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [dragOver,  setDragOver]  = useState(false);
  const [history,   setHistory]   = useState<ScanRecord[]>(getHistory);
  const [tab,       setTab]       = useState<"scan" | "history">("scan");
  const [compressing, setCompressing] = useState(false);

  const [apiOk, setApiOk] = useState<boolean | null>(null);

  // Check API health on mount
  useEffect(() => {
    checkAPIHealth().then(h => {
      if (!h) { setApiOk(false); return; }
      const hasKey = h.keys?.gemini?.includes("✅");
      setApiOk(hasKey);
    }).catch(() => setApiOk(false));
  }, []);

  const cameraRef  = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  // ── Load + compress image ─────────────────────────────────────────────────
  const loadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setDiagnosis(null); setRawText(""); setError(null);
    setCompressing(true);

    const reader = new FileReader();
    reader.onload = async e => {
      const original = e.target?.result as string;
      setThumb(original);               // show preview immediately
      const compressed = await compressImage(original);
      setImage(compressed);             // send compressed to API
      setMime("image/jpeg");
      setCompressing(false);
    };
    reader.readAsDataURL(file);
  };

  // ── Run AI diagnosis ──────────────────────────────────────────────────────
  const analyze = async () => {
    if (!image || loading) return;
    setLoading(true); setDiagnosis(null); setRawText(""); setError(null);

    let res: AIResponse;
    try {
      res = await analyzeImage(DIAGNOSE_PROMPT, image, mime);
    } catch {
      setError("নেটওয়ার্ক সংযোগ সমস্যা। ইন্টারনেট সংযোগ পরীক্ষা করুন।");
      setLoading(false);
      return;
    }

    if (!res.ok && res.model === "offline") {
      setError("সার্ভার সংযোগ সমস্যা। কিছুক্ষণ পর আবার চেষ্টা করুন অথবা DAE হটলাইন 16123 এ কল করুন।");
      setLoading(false);
      return;
    }

    // Try JSON parse first, then plain-text parse
    const parsed = parseDiagnosis(res.text) ?? parseTextDiagnosis(res.text);
    setDiagnosis(parsed);

    // Save to history
    const record: ScanRecord = {
      id:       Date.now().toString(),
      disease:  parsed.disease,
      crop:     parsed.crop,
      severity: parsed.severity,
      ts:       new Date().toLocaleString("bn-BD"),
    };
    saveHistory(record);
    setHistory(getHistory());
    setLoading(false);
  };

  const reset = () => { setImage(null); setThumb(null); setDiagnosis(null); setRawText(""); setError(null); };

  const sevColor = (s: string) => SEV_COLOR[s] || "#9ca3af";

  return (
    <div className={styles.page}>

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>🔬</div>
          <div>
            <div className={styles.headerTitle}>AI ফসল বিশ্লেষণ</div>
            <div className={styles.headerSub}>Gemini 2.0 Vision · BARC/BARI/BRRI</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:4 }}>
          {(["scan","history"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding:"5px 12px", borderRadius:20, border:".5px solid #e5e7eb",
                background: tab===t ? "var(--green)" : "#fff",
                color: tab===t ? "#fff" : "#6b7280",
                fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
              {t === "scan" ? "📷 স্ক্যান" : `📋 ইতিহাস (${history.length})`}
            </button>
          ))}
        </div>
      </div>


        {/* ── API key status banner ──────────────────────────── */}
        {apiOk === false && (
          <div style={{ margin:"10px 0 0", padding:"10px 14px", background:"#fff7ed",
            border:"1px solid #fed7aa", borderRadius:10, fontSize:12, color:"#c2410c",
            display:"flex", alignItems:"flex-start", gap:8 }}>
            <span style={{ fontSize:16, flexShrink:0 }}>⚠️</span>
            <div>
              <div style={{ fontWeight:700, marginBottom:2 }}>GEMINI_API_KEY সেট নেই</div>
              <div style={{ color:"#9a3412" }}>
                Vercel Dashboard → Settings → Environment Variables →
                <code style={{ background:"#fef3c7", padding:"1px 5px", borderRadius:3, margin:"0 3px" }}>GEMINI_API_KEY</code>
                যোগ করুন। বিনামূল্যে:{" "}
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer"
                  style={{ color:"var(--green)", fontWeight:700 }}>aistudio.google.com</a>
              </div>
            </div>
          </div>
        )}

      <div className={styles.body}>
        {tab === "scan" && (
          <>
            {/* ── Drop zone ──────────────────────────────────────── */}
            <div
              className={`${styles.dropZone} ${dragOver ? styles.dragOver : ""} ${thumb ? styles.hasImage : ""}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f=e.dataTransfer.files[0]; if(f) loadFile(f); }}
              onClick={() => !thumb && galleryRef.current?.click()}
            >
              {/* Hidden inputs */}
              <input ref={cameraRef}  type="file" accept="image/*" capture="environment" hidden
                onChange={e => { const f=e.target.files?.[0]; if(f) loadFile(f); e.target.value=""; }} />
              <input ref={galleryRef} type="file" accept="image/*" hidden
                onChange={e => { const f=e.target.files?.[0]; if(f) loadFile(f); e.target.value=""; }} />

              {thumb ? (
                <img src={thumb} alt="crop" className={styles.preview} />
              ) : (
                <div className={styles.dropPrompt}>
                  <div className={styles.dropIcon}>🌿</div>
                  <div className={styles.dropTitle}>ফসলের ছবি আপলোড করুন</div>
                  <div className={styles.dropSub}>ড্র্যাগ করুন বা নিচের বোতাম চাপুন</div>
                  <div style={{ display:"flex", gap:10, marginTop:12 }}>
                    <button onClick={e => { e.stopPropagation(); cameraRef.current?.click(); }}
                      style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 18px",
                        background:"linear-gradient(135deg,var(--green-dark),var(--green))",
                        border:"none", borderRadius:30, color:"#fff", fontSize:13, fontWeight:700,
                        cursor:"pointer", boxShadow:"0 3px 12px rgba(27,138,62,.35)", fontFamily:"inherit" }}>
                      📷 ক্যামেরা
                    </button>
                    <button onClick={e => { e.stopPropagation(); galleryRef.current?.click(); }}
                      style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 18px",
                        background:"#fff", border:"1.5px solid #e5e7eb", borderRadius:30,
                        color:"#111", fontSize:13, fontWeight:700, cursor:"pointer",
                        boxShadow:"0 2px 8px rgba(0,0,0,.07)", fontFamily:"inherit" }}>
                      🖼️ গ্যালারি
                    </button>
                  </div>
                  <div className={styles.dropHint}>Gemini 2.0 Vision দিয়ে বিশ্লেষণ</div>
                </div>
              )}
            </div>

            {/* ── Compressing indicator ──────────────────────────── */}
            {compressing && (
              <div style={{ textAlign:"center", fontSize:12, color:"#9ca3af", padding:"8px 0" }}>
                <span className="spin" style={{ display:"inline-block", marginRight:6 }}>⚙️</span>
                ছবি প্রস্তুত হচ্ছে…
              </div>
            )}

            {/* ── Action buttons ─────────────────────────────────── */}
            {thumb && !loading && !diagnosis && !error && (
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={analyze} className={styles.analyzeBtn}>
                  🔬 AI বিশ্লেষণ করুন
                </button>
                <button onClick={reset} className={styles.clearBtn}>✕</button>
              </div>
            )}

            {/* ── Loading ────────────────────────────────────────── */}
            {loading && (
              <div className={styles.loadingCard}>
                <div className="bounce" style={{ fontSize:36, textAlign:"center" }}>🌱</div>
                <div style={{ fontSize:13, fontWeight:700, color:"var(--green)", textAlign:"center" }}>
                  Gemini 2.0 Vision বিশ্লেষণ করছে…
                </div>
                <div style={{ fontSize:11, color:"#9ca3af", textAlign:"center" }}>
                  BARC/BRRI/BARI ডেটাবেজ যাচাই হচ্ছে
                </div>
                <div className={styles.loadBar}><div className={styles.loadFill} /></div>
              </div>
            )}

            {/* ── Error state ────────────────────────────────────── */}
            {error && !loading && (
              <div className="fade-up" style={{ background:"#fff7ed", border:"1.5px solid #fed7aa",
                borderRadius:14, padding:18, textAlign:"center" }}>
                <div style={{ fontSize:32, marginBottom:10 }}>⚠️</div>
                <div style={{ fontSize:13, fontWeight:700, color:"#c2410c", marginBottom:8 }}>{error}</div>
                <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" }}>
                  <button onClick={analyze}
                    style={{ padding:"9px 20px", background:"#ea580c", border:"none", borderRadius:10,
                      color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                    🔄 আবার চেষ্টা
                  </button>
                  <a href="tel:16123"
                    style={{ padding:"9px 20px", background:"var(--green)", borderRadius:10,
                      color:"#fff", fontSize:13, fontWeight:700, textDecoration:"none",
                      display:"inline-block" }}>
                    📞 DAE 16123
                  </a>
                  <button onClick={reset}
                    style={{ padding:"9px 16px", background:"#f3f4f6", border:".5px solid #e5e7eb",
                      borderRadius:10, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
                    নতুন ছবি
                  </button>
                </div>
              </div>
            )}

            {/* ── Structured diagnosis result ─────────────────────── */}
            {diagnosis && !loading && (
              <div className="fade-up">

                {/* Disease header */}
                <div className={styles.resultHeader}
                  style={{ borderLeft:`4px solid ${sevColor(diagnosis.severity)}` }}>
                  <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:14 }}>
                    <div>
                      <div style={{ fontSize:11, color:"#9ca3af", fontWeight:600, marginBottom:3 }}>
                        সনাক্তকৃত সমস্যা
                      </div>
                      <div style={{ fontSize:20, fontWeight:700, color:"#111", marginBottom:2 }}>
                        {diagnosis.disease}
                      </div>
                      {diagnosis.disease_en && (
                        <div style={{ fontSize:12, color:"#6b7280" }}>{diagnosis.disease_en}</div>
                      )}
                    </div>
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <div style={{ fontSize:11, color:"#9ca3af", marginBottom:4 }}>ফসল</div>
                      <div style={{ fontSize:14, fontWeight:700, color:"#111" }}>{diagnosis.crop}</div>
                    </div>
                  </div>

                  {/* Confidence bar */}
                  <div style={{ marginBottom:12 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                      <span style={{ fontSize:11, color:"#9ca3af" }}>নিশ্চয়তা</span>
                      <span style={{ fontSize:12, fontWeight:700, color:"var(--green)" }}>
                        {diagnosis.confidence}%
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width:`${diagnosis.confidence}%` }} />
                    </div>
                  </div>

                  {/* Severity badge */}
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:11, color:"#9ca3af" }}>তীব্রতা:</span>
                    <span style={{ fontSize:12, fontWeight:700, padding:"3px 12px", borderRadius:20,
                      background:`${sevColor(diagnosis.severity)}15`,
                      color: sevColor(diagnosis.severity) }}>
                      {diagnosis.severity === "তীব্র" ? "🔴" : diagnosis.severity === "মধ্যম" ? "🟡" : "🟢"}
                      &nbsp;{diagnosis.severity}
                    </span>
                    <span style={{ marginLeft:"auto", fontSize:10, color:"#d1d5db" }}>
                      Gemini 2.0 Vision
                    </span>
                  </div>
                </div>

                {/* Info cards */}
                {[
                  { label:"🔍 কারণ",      text:diagnosis.cause,      color:"#d97706" },
                  { label:"💊 প্রতিকার",   text:diagnosis.treatment,  color:"#16a34a" },
                  { label:"🛡️ প্রতিরোধ",  text:diagnosis.prevention, color:"#0284c7" },
                ].map((card, i) => (
                  <div key={i} className={styles.infoCard}
                    style={{ borderLeft:`3px solid ${card.color}` }}>
                    <div className={styles.infoLabel}>{card.label}</div>
                    <div className={styles.infoText}>{card.text}</div>
                  </div>
                ))}

                {/* Actions */}
                <div style={{ display:"flex", gap:10, marginTop:4 }}>
                  <a href="tel:16123" style={{ flex:1, display:"flex", alignItems:"center",
                    justifyContent:"center", gap:6, padding:"12px", background:"var(--green)",
                    borderRadius:12, color:"#fff", fontSize:13, fontWeight:700,
                    textDecoration:"none", boxShadow:"0 3px 14px rgba(27,138,62,.3)" }}>
                    📞 DAE হটলাইন 16123
                  </a>
                  <button onClick={reset}
                    style={{ padding:"12px 16px", background:"#f3f4f6", border:".5px solid #e5e7eb",
                      borderRadius:12, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
                    নতুন স্ক্যান
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── History tab ────────────────────────────────────────── */}
        {tab === "history" && (
          <div className="fade-up">
            {history.length === 0 ? (
              <div style={{ textAlign:"center", padding:"40px 20px", color:"#9ca3af" }}>
                <div style={{ fontSize:40, marginBottom:12 }}>🔬</div>
                <div style={{ fontSize:13 }}>এখনো কোনো স্ক্যান নেই</div>
                <button onClick={() => setTab("scan")}
                  style={{ marginTop:16, padding:"9px 20px", background:"var(--green)", border:"none",
                    borderRadius:10, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                  প্রথম স্ক্যান করুন →
                </button>
              </div>
            ) : (
              history.map((h, i) => (
                <div key={i} style={{ background:"#fff", borderRadius:12, padding:14, marginBottom:10,
                  border:".5px solid #e5e7eb", display:"flex", gap:12, alignItems:"center",
                  boxShadow:"0 1px 4px rgba(0,0,0,.05)" }}>
                  <div style={{ width:42, height:42, background:"#f0fdf4", borderRadius:10,
                    display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>🔬</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#111" }}>{h.disease}</div>
                    <div style={{ fontSize:11, color:"#9ca3af" }}>{h.crop} · {h.ts}</div>
                  </div>
                  <span style={{ fontSize:11, padding:"3px 9px", borderRadius:20, fontWeight:700,
                    background:`${sevColor(h.severity)}15`, color: sevColor(h.severity) }}>
                    {h.severity}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
