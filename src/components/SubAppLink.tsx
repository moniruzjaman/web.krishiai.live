/**
 * SubAppLink.tsx
 *
 * Reusable component for linking any *.krishiai.live sub-app.
 * Used on the Tools hub and anywhere an external krishiai sub-app
 * needs to be embedded or linked.
 *
 * Modes:
 *   "embed"    — iframe with fallback
 *   "redirect" — opens in new tab
 *   "card"     — shows a preview card with link
 *
 * Usage:
 *   <SubAppLink url="https://cabi.krishiai.live/" title="CABI Analyzer" mode="embed" />
 */

import { useState, useRef } from "react";

interface Props {
  url:         string;
  title:       string;
  description?: string;
  icon?:       string;
  badge?:      string;
  badgeColor?: string;
  mode:        "embed" | "redirect" | "card";
  height?:     number;           // iframe height in px (default 600)
  fallback?:   React.ReactNode; // rendered when embed fails
}

export default function SubAppLink({
  url, title, description, icon = "🔗", badge, badgeColor = "var(--green)",
  mode, height = 600, fallback,
}: Props) {
  const [state, setState] = useState<"loading"|"ok"|"fail">("loading");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // ── card / redirect ─────────────────────────────────────────────
  if (mode === "redirect" || mode === "card") {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer"
        style={{ display:"flex", alignItems:"center", gap:14, background:"#fff",
                 border:".5px solid #e5e7eb", borderRadius:14, padding:16,
                 textDecoration:"none", boxShadow:"var(--shadow)", transition:"all .2s" }}
        onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
        onMouseLeave={e=>e.currentTarget.style.transform=""}>
        <div style={{ width:52, height:52, background:"linear-gradient(135deg,#f0fdf4,#dcfce7)", borderRadius:"50%",
                      display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, flexShrink:0 }}>
          {icon}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:700, color:"#111", marginBottom:3 }}>{title}</div>
          {description && <div style={{ fontSize:12, color:"#6b7280" }}>{description}</div>}
          <div style={{ fontSize:11, color:"#9ca3af", marginTop:4 }}>{url}</div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
          {badge && (
            <span style={{ fontSize:10, background:`${badgeColor}18`, color:badgeColor,
                           padding:"3px 9px", borderRadius:20, fontWeight:700, border:`0.5px solid ${badgeColor}40` }}>
              {badge}
            </span>
          )}
          <span style={{ fontSize:18, color:"var(--green)" }}>↗</span>
        </div>
      </a>
    );
  }

  // ── embed mode ──────────────────────────────────────────────────
  return (
    <div>
      {/* status strip */}
      {state === "loading" && (
        <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(27,138,62,.08)",
                      border:".5px solid rgba(27,138,62,.2)", borderRadius:10, padding:"9px 14px",
                      marginBottom:12, fontSize:12, color:"var(--green)", fontWeight:600 }}>
          <span className="spin" style={{ display:"inline-block" }}>⏳</span>
          {title} লোড হচ্ছে…
        </div>
      )}
      {state === "ok" && (
        <div style={{ display:"flex", alignItems:"center", gap:8, background:"#f0fdf4",
                      border:".5px solid #86efac", borderRadius:10, padding:"7px 14px",
                      marginBottom:12, fontSize:12, color:"#166534", fontWeight:600 }}>
          ✅ {title} সংযুক্ত
          <a href={url} target="_blank" rel="noopener noreferrer"
             style={{ marginLeft:"auto", fontSize:11, color:"var(--green)", fontWeight:700 }}>
            নতুন ট্যাবে খুলুন ↗
          </a>
        </div>
      )}
      {state === "fail" && (
        <div style={{ display:"flex", alignItems:"flex-start", gap:10, background:"#fff7ed",
                      border:".5px solid #fed7aa", borderRadius:10, padding:"10px 14px",
                      marginBottom:12, fontSize:12, color:"#c2410c" }}>
          <span style={{ fontSize:16, flexShrink:0 }}>⚠️</span>
          <div>
            <div style={{ fontWeight:600 }}>{title} এখন উপলব্ধ নেই</div>
            <div style={{ fontSize:10, color:"#9a3412", marginTop:2 }}>
              Fallback mode active ·{" "}
              <a href={url} target="_blank" rel="noopener noreferrer"
                 style={{ color:"var(--green)", fontWeight:700 }}>
                সরাসরি খুলুন ↗
              </a>
            </div>
          </div>
        </div>
      )}

      {/* iframe — always mounted so it can try to load */}
      <div style={{ display: state === "fail" ? "none" : "block",
                    borderRadius:14, overflow:"hidden",
                    border:`.5px solid ${state==="ok"?"rgba(27,138,62,.3)":"#e5e7eb"}`,
                    boxShadow:"var(--shadow)" }}>
        <iframe
          ref={iframeRef}
          src={url}
          onLoad={() => setState("ok")}
          onError={() => setState("fail")}
          style={{ width:"100%", height:`${height}px`, border:"none", display:"block" }}
          title={title}
          allow="camera; geolocation; microphone"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
        />
      </div>

      {/* fallback content shown when embed fails */}
      {state === "fail" && fallback && (
        <div className="fade-in">{fallback}</div>
      )}

      {state !== "fail" && (
        <div style={{ fontSize:10, color:"#9ca3af", textAlign:"center", marginTop:6 }}>
          {url}
        </div>
      )}
    </div>
  );
}
