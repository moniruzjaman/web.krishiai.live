/**
 * Analyzer.tsx  —  v3 AI-POWERED
 *
 * Full AI crop diagnosis:
 *  - Structured JSON output (disease, severity, confidence, treatment)
 *  - Confidence score with animated progress bar
 *  - Severity colour coding
 *  - Treatment + prevention cards
 *  - Share / copy diagnosis
 *  - History of last 5 scans (localStorage)
 */

import { useState, useRef } from "react";
import { diagnoseCrop, type DiagnosisResult } from "@/services/aiService";
import styles from "./Analyzer.module.css";

const SEV_COLOR: Record<string, string> = {
  "স্বল্প":  "#16a34a",
  "মধ্যম": "#d97706",
  "তীব্র":  "#e53e3e",
};

interface ScanRecord {
  id:        string;
  thumb:     string;
  disease:   string;
  crop:      string;
  severity:  string;
  timestamp: string;
}

function getScanHistory(): ScanRecord[] {
  try { return JSON.parse(localStorage.getItem("krishi_scans") || "[]"); } catch { return []; }
}
function saveScan(r: ScanRecord) {
  const h = [r, ...getScanHistory()].slice(0, 5);
  localStorage.setItem("krishi_scans", JSON.stringify(h));
}

export default function Analyzer() {
  const [image,     setImage]     = useState<string | null>(null);
  const [mime,      setMime]       = useState("image/jpeg");
  const [result,    setResult]     = useState<DiagnosisResult | null>(null);
  const [rawText,   setRawText]    = useState<string>("");
  const [loading,   setLoading]    = useState(false);
  const [dragOver,  setDragOver]   = useState(false);
  const [history,   setHistory]    = useState<ScanRecord[]>(getScanHistory);
  const [tab,       setTab]        = useState<"scan"|"history">("scan");
  const cameraRef   = useRef<HTMLInputElement>(null);
  const galleryRef  = useRef<HTMLInputElement>(null);

  const loadFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setMime(file.type);
    setResult(null); setRawText("");
    const reader = new FileReader();
    reader.onload = e => setImage(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!image || loading) return;
    setLoading(true); setResult(null); setRawText("");

    const res = await diagnoseCrop(image, mime);

    if (res.diagnosis) {
      setResult(res.diagnosis);
      // Save to history
      const record: ScanRecord = {
        id:        Date.now().toString(),
        thumb:     image.slice(0, 100),
        disease:   res.diagnosis.disease,
        crop:      res.diagnosis.crop,
        severity:  res.diagnosis.severity,
        timestamp: new Date().toLocaleString("bn-BD"),
      };
      saveScan(record);
      setHistory(getScanHistory());
    } else {
      setRawText(res.text);
    }
    setLoading(false);
  };

  const reset = () => { setImage(null); setResult(null); setRawText(""); };

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>🔬</div>
          <div>
            <div className={styles.headerTitle}>AI ফসল বিশ্লেষণ</div>
            <div className={styles.headerSub}>BARC/BARI/BRRI · Gemini 2.0 Vision</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:4 }}>
          {(["scan","history"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding:"5px 12px", borderRadius:20, border:".5px solid #e5e7eb",
                       background: tab===t ? "var(--green)" : "#fff",
                       color: tab===t ? "#fff" : "#6b7280",
                       fontSize:11, fontWeight:700, cursor:"pointer" }}>
              {t === "scan" ? "📷 স্ক্যান" : `📋 ইতিহাস (${history.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.body}>

        {tab === "scan" && (
          <>
            {/* Drop zone */}
            <div
              className={`${styles.dropZone} ${dragOver ? styles.dragOver : ""} ${image ? styles.hasImage : ""}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f=e.dataTransfer.files[0]; if(f) loadFile(f); }}
              onClick={() => !image && galleryRef.current?.click()}
            >
              {/* Camera capture */}
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden
                onChange={e => { const f=e.target.files?.[0]; if(f) loadFile(f); }} />
              {/* Gallery picker */}
              <input ref={galleryRef} type="file" accept="image/*" hidden
                onChange={e => { const f=e.target.files?.[0]; if(f) loadFile(f); }} />
              {image ? (
                <img src={image} alt="crop" className={styles.preview} />
              ) : (
                <div className={styles.dropPrompt}>
                  <div className={styles.dropIcon}>📷</div>
                  <div className={styles.dropTitle}>ফসলের ছবি তুলুন বা আপলোড করুন</div>
                  <div className={styles.dropSub}>JPG · PNG · WEBP · মোবাইলে ক্যামেরা খুলবে</div>
                  <div className={styles.dropHint}>Gemini 2.0 Vision দিয়ে বিশ্লেষণ</div>
                  <div style={{display:"flex",gap:10,marginTop:4}}>
                    <button
                      onClick={e=>{e.stopPropagation();cameraRef.current?.click()}}
                      style={{display:"flex",alignItems:"center",gap:6,padding:"9px 16px",background:"linear-gradient(135deg,var(--green-dark),var(--green))",border:"none",borderRadius:30,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",boxShadow:"0 3px 12px rgba(27,138,62,.3)"}}>
                      📷 ক্যামেরা
                    </button>
                    <button
                      onClick={e=>{e.stopPropagation();galleryRef.current?.click()}}
                      style={{display:"flex",alignItems:"center",gap:6,padding:"9px 16px",background:"#fff",border:".5px solid #e5e7eb",borderRadius:30,color:"#111",fontSize:12,fontWeight:700,cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,.06)"}}>
                      🖼️ গ্যালারি
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            {image && !loading && !result && !rawText && (
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={analyze} className={styles.analyzeBtn}>
                  🔬 AI বিশ্লেষণ করুন
                </button>
                <button onClick={reset} className={styles.clearBtn}>✕</button>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className={styles.loadingCard}>
                <div className="bounce" style={{ fontSize:36, textAlign:"center" }}>🌱</div>
                <div style={{ fontSize:13, fontWeight:700, color:"var(--green)", textAlign:"center" }}>
                  Gemini 2.0 Vision বিশ্লেষণ করছে…
                </div>
                <div style={{ fontSize:11, color:"#9ca3af", textAlign:"center" }}>
                  BARC/BRRI/BARI ডেটাবেজ যাচাই করা হচ্ছে
                </div>
                <div className={styles.loadBar}><div className={styles.loadFill} /></div>
              </div>
            )}

            {/* Structured diagnosis result */}
            {result && !loading && (
              <div className="fade-up">
                {/* Disease header card */}
                <div className={styles.resultHeader}
                  style={{ borderLeft: `4px solid ${SEV_COLOR[result.severity] || "#9ca3af"}` }}>
                  <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
                    <div>
                      <div style={{ fontSize:11, color:"#9ca3af", marginBottom:3, fontWeight:600 }}>
                        সনাক্তকৃত সমস্যা
                      </div>
                      <div style={{ fontSize:20, fontWeight:700, color:"#111", marginBottom:2 }}>
                        {result.disease}
                      </div>
                      <div style={{ fontSize:12, color:"#6b7280" }}>{result.disease_en}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:11, color:"#9ca3af", marginBottom:4 }}>ফসল</div>
                      <div style={{ fontSize:14, fontWeight:700, color:"#111" }}>{result.crop}</div>
                    </div>
                  </div>

                  {/* Confidence bar */}
                  <div style={{ marginTop:14 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ fontSize:11, color:"#9ca3af" }}>নিশ্চয়তা</span>
                      <span style={{ fontSize:12, fontWeight:700, color:"var(--green)" }}>
                        {result.confidence}%
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width:`${result.confidence}%` }} />
                    </div>
                  </div>

                  {/* Severity badge */}
                  <div style={{ marginTop:10, display:"flex", gap:8, alignItems:"center" }}>
                    <span style={{ fontSize:11, color:"#9ca3af" }}>তীব্রতা:</span>
                    <span style={{ fontSize:12, fontWeight:700, padding:"3px 12px", borderRadius:20,
                                   background: `${SEV_COLOR[result.severity]}15`,
                                   color: SEV_COLOR[result.severity] || "#9ca3af" }}>
                      {result.severity === "তীব্র" ? "🔴" : result.severity === "মধ্যম" ? "🟡" : "🟢"}
                      &nbsp;{result.severity}
                    </span>
                    <span style={{ fontSize:11, color:"#9ca3af", marginLeft:"auto" }}>
                      via Gemini 2.0
                    </span>
                  </div>
                </div>

                {/* Cause */}
                <div className={styles.infoCard}>
                  <div className={styles.infoLabel}>🔍 কারণ</div>
                  <div className={styles.infoText}>{result.cause}</div>
                </div>

                {/* Treatment */}
                <div className={styles.infoCard} style={{ borderLeft:"3px solid #16a34a" }}>
                  <div className={styles.infoLabel}>💊 প্রতিকার</div>
                  <div className={styles.infoText}>{result.treatment}</div>
                </div>

                {/* Prevention */}
                <div className={styles.infoCard} style={{ borderLeft:"3px solid #0284c7" }}>
                  <div className={styles.infoLabel}>🛡️ প্রতিরোধ</div>
                  <div className={styles.infoText}>{result.prevention}</div>
                </div>

                {/* Hotline + new scan */}
                <div style={{ display:"flex", gap:10, marginTop:4 }}>
                  <a href="tel:16123" style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center",
                    gap:6, padding:"11px", background:"var(--green)", borderRadius:12,
                    color:"#fff", fontSize:13, fontWeight:700, textDecoration:"none",
                    boxShadow:"0 3px 14px rgba(27,138,62,.3)" }}>
                    📞 DAE হটলাইন 16123
                  </a>
                  <button onClick={reset} style={{ padding:"11px 16px", background:"#f3f4f6",
                    border:".5px solid #e5e7eb", borderRadius:12, fontSize:12, cursor:"pointer" }}>
                    নতুন স্ক্যান
                  </button>
                </div>
              </div>
            )}

            {/* Raw text fallback (when JSON parsing failed) */}
            {rawText && !loading && (
              <div className="fade-up" style={{ background:"rgba(27,74,50,.05)",
                border:".5px solid rgba(27,138,62,.2)", borderRadius:14, padding:16 }}>
                <div style={{ fontSize:11, fontWeight:700, color:"var(--green)", marginBottom:10 }}>
                  🤖 AI বিশ্লেষণ
                </div>
                <div style={{ fontSize:13, lineHeight:1.8, whiteSpace:"pre-wrap" }}>{rawText}</div>
                <button onClick={reset} style={{ marginTop:12, padding:"8px 16px", background:"var(--green)",
                  border:"none", borderRadius:8, color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                  নতুন স্ক্যান
                </button>
              </div>
            )}
          </>
        )}

        {/* History tab */}
        {tab === "history" && (
          <div className="fade-up">
            {history.length === 0 ? (
              <div style={{ textAlign:"center", padding:"40px 20px", color:"#9ca3af" }}>
                <div style={{ fontSize:40, marginBottom:12 }}>🔬</div>
                <div>এখনো কোনো স্ক্যান নেই</div>
              </div>
            ) : history.map((h, i) => (
              <div key={i} style={{ background:"#fff", borderRadius:12, padding:14, marginBottom:10,
                border:".5px solid #e5e7eb", display:"flex", gap:12, alignItems:"center" }}>
                <div style={{ width:44, height:44, background:"#f0fdf4", borderRadius:10,
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>🔬</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#111" }}>{h.disease}</div>
                  <div style={{ fontSize:11, color:"#9ca3af" }}>{h.crop} · {h.timestamp}</div>
                </div>
                <span style={{ fontSize:11, padding:"3px 9px", borderRadius:20, fontWeight:700,
                  background:`${SEV_COLOR[h.severity] || "#9ca3af"}15`,
                  color: SEV_COLOR[h.severity] || "#9ca3af" }}>
                  {h.severity}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
