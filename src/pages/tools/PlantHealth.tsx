import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { analyzeImage, buildAgriPrompt } from "@/services/aiService";

const DISEASES = [
  { name:"ব্লাস্ট",           en:"Rice Blast",        crop:"ধান",   severity:"তীব্র",  color:"#e53e3e", icon:"🔴" },
  { name:"বাদামি দাগ",        en:"Brown Spot",         crop:"ধান",   severity:"মধ্যম", color:"#d97706", icon:"🟡" },
  { name:"পাতা পোড়া",        en:"Leaf Blight",        crop:"ধান",   severity:"তীব্র",  color:"#e53e3e", icon:"🔴" },
  { name:"পানামা রোগ",        en:"Panama Wilt",        crop:"কলা",   severity:"তীব্র",  color:"#e53e3e", icon:"🔴" },
  { name:"আলুর ধ্বসা",        en:"Late Blight",        crop:"আলু",   severity:"তীব্র",  color:"#e53e3e", icon:"🔴" },
  { name:"মরিচা রোগ",         en:"Rust Disease",       crop:"গম",    severity:"মধ্যম", color:"#d97706", icon:"🟡" },
  { name:"সাদা মাছি",         en:"Whitefly",           crop:"সবজি", severity:"স্বল্প", color:"#16a34a", icon:"🟢" },
  { name:"ফলের মাছি",         en:"Fruit Fly",          crop:"সবজি", severity:"মধ্যম", color:"#d97706", icon:"🟡" },
];

export default function PlantHealth() {
  const nav = useNavigate();
  const [img, setImg] = useState<string|null>(null);
  const [result, setResult] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"scan"|"library">("scan");

  const analyze = async () => {
    if (!img) return;
    setLoading(true); setResult(null);
    const p = buildAgriPrompt(`এই ফসলের ছবি বিশ্লেষণ করুন:
১. রোগ/পোকার নাম (বাংলা ও ইংরেজি)
২. রোগের কারণ (ছত্রাক/ব্যাকটেরিয়া/ভাইরাস/পোকা)
৩. ক্ষতির মাত্রা (স্বল্প/মধ্যম/তীব্র)
৪. তাৎক্ষণিক প্রতিকার
৫. প্রতিরোধমূলক ব্যবস্থা
BRRI/BARI/DAE নির্দেশিকা অনুযায়ী উত্তর দিন।`);
    const r = await analyzeImage(p, img);
    setResult(r.text); setLoading(false);
  };

  return (
    <div style={{background:"var(--bg)",minHeight:"100vh"}}>
      <div className="tool-page-hdr">
        <button className="back-btn" onClick={()=>nav("/chat")}><svg width="16" height="16" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></button>
        <div style={{position:"absolute",top:20,right:16,fontSize:36}}>🌿</div>
        <h1>উদ্ভিদ স্বাস্থ্য বিশেষজ্ঞ</h1>
        <div className="sub">Plant Health Expert</div>
        <div className="badge-row">
          <span className="badge">BARC PROTOCOL</span>
          <span className="badge">BARI/BRRI GROUNDED</span>
          <span className="badge">DAE VERIFIED</span>
        </div>
      </div>

      <div style={{padding:"20px 16px 100px"}}>
        {/* Tab */}
        <div style={{display:"flex",background:"#e5e7eb",borderRadius:30,padding:3,gap:3,marginBottom:20}}>
          {[["scan","🔬 রোগ স্ক্যান"],["library","📚 রোগ লাইব্রেরি"]].map(([id,lbl])=>(
            <button key={id} onClick={()=>setTab(id as "scan"|"library")} style={{flex:1,padding:"9px 6px",borderRadius:26,border:"none",fontSize:12,fontWeight:700,cursor:"pointer",background:tab===id?"var(--green)":"transparent",color:tab===id?"#fff":"#6b7280",transition:"all .2s"}}>
              {lbl}
            </button>
          ))}
        </div>

        {tab==="scan" && (
          <div className="fade-up">
            {/* Upload */}
            <div onClick={()=>{if(!img)document.getElementById("ph-file")?.click()}}
              style={{border:`2px dashed ${img?"var(--green)":"#d1d5db"}`,borderRadius:14,minHeight:160,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,cursor:img?"default":"pointer",background:img?"rgba(27,138,62,.04)":"#fff",marginBottom:14,overflow:"hidden",transition:"all .2s"}}>
              <input id="ph-file" type="file" accept="image/*" capture="environment" hidden onChange={e=>{const f=e.target.files?.[0];if(f){const r=new FileReader();r.onload=ev=>setImg(ev.target?.result as string);r.readAsDataURL(f)}}}/>
              {img ? <img src={img} alt="crop" style={{width:"100%",maxHeight:260,objectFit:"cover"}}/> : (
                <>
                  <div style={{width:52,height:52,background:"#f0fdf4",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>📷</div>
                  <div style={{fontSize:13,fontWeight:600,color:"#374151"}}>ছবি তুলুন বা আপলোড করুন</div>
                  <div style={{fontSize:11,color:"#9ca3af",textAlign:"center"}}>BARC/BARI রোগ শনাক্তকরণ প্রোটোকল</div>
                </>
              )}
            </div>

            {img && (
              <div style={{display:"flex",gap:10,marginBottom:16}}>
                <button onClick={analyze} disabled={loading} style={{flex:1,padding:13,background:"var(--green)",border:"none",borderRadius:12,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",opacity:loading?.7:1}}>
                  {loading?"🔍 বিশ্লেষণ হচ্ছে…":"🔬 AI বিশ্লেষণ করুন"}
                </button>
                <button onClick={()=>{setImg(null);setResult(null)}} style={{padding:13,paddingInline:16,background:"#f3f4f6",border:".5px solid #e5e7eb",borderRadius:12,color:"#555",fontSize:13}}>✕</button>
              </div>
            )}

            {loading && (
              <div style={{background:"linear-gradient(135deg,#f0fdf4,#fff)",border:".5px solid #bbf7d0",borderRadius:14,padding:20,textAlign:"center"}}>
                <div className="bounce" style={{fontSize:32,marginBottom:8}}>🌱</div>
                <div style={{fontSize:13,color:"var(--green)",fontWeight:600}}>AI বিশ্লেষণ চলছে…</div>
                <div style={{fontSize:11,color:"#6b7280",marginTop:4}}>BARC/BARI ডেটাবেজ পরীক্ষা করছে</div>
              </div>
            )}

            {result && !loading && (
              <div className="fade-up" style={{background:"linear-gradient(135deg,rgba(27,74,50,.06),rgba(27,74,50,.02))",border:".5px solid rgba(27,138,62,.25)",borderRadius:14,padding:16}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                  <div style={{width:8,height:8,background:"var(--green)",borderRadius:"50%"}}/>
                  <span style={{fontSize:11,fontWeight:700,color:"var(--green)",letterSpacing:".06em"}}>AI বিশ্লেষণ ফলাফল</span>
                  <span style={{marginLeft:"auto",fontSize:10,background:"rgba(27,138,62,.1)",color:"var(--green)",padding:"2px 8px",borderRadius:20,fontWeight:700}}>Gemini 2.0</span>
                </div>
                <div style={{fontSize:13,lineHeight:1.8,color:"#111",whiteSpace:"pre-wrap"}}>{result}</div>
                <div style={{marginTop:12,paddingTop:10,borderTop:".5px solid rgba(27,138,62,.15)",fontSize:11,color:"#9ca3af"}}>
                  বিস্তারিত পরামর্শ: DAE হটলাইন <a href="tel:16123" style={{color:"var(--green)",fontWeight:700}}>16123</a>
                </div>
              </div>
            )}

            {!img && !result && (
              <div style={{background:"#fff",borderRadius:14,padding:16,border:".5px solid #e5e7eb"}}>
                <div style={{fontSize:12,fontWeight:700,color:"#111",marginBottom:10}}>⚡ দ্রুত পরামর্শ</div>
                {[
                  ["ধানে বাদামি দাগ হলে?","Mancozeb 80% WP @ 2g/L স্প্রে করুন। পটাশ সার বাড়ান।"],
                  ["কলায় পানামা রোগ?","আক্রান্ত গাছ তুলে পুড়িয়ে ফেলুন। BARI কলা-১ ব্যবহার করুন।"],
                  ["আলুর ধ্বসা রোগ?","Metalaxyl+Mancozeb স্প্রে করুন। নিকাশি ব্যবস্থা উন্নত করুন।"],
                ].map(([q,a],i)=>(
                  <div key={i} style={{borderBottom:i<2?".5px solid #f3f4f6":"none",paddingBlock:10}}>
                    <div style={{fontSize:12,fontWeight:600,color:"#111",marginBottom:4}}>❓ {q}</div>
                    <div style={{fontSize:11,color:"#6b7280",lineHeight:1.5}}>💡 {a}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab==="library" && (
          <div className="fade-up">
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {DISEASES.map((d,i)=>(
                <div key={i} className="glass" style={{padding:14,cursor:"pointer",borderLeft:`3px solid ${d.color}`}}>
                  <div style={{fontSize:10,fontWeight:700,color:d.color,letterSpacing:".05em",textTransform:"uppercase",marginBottom:4}}>{d.crop}</div>
                  <div style={{fontSize:13,fontWeight:700,color:"#111",marginBottom:2}}>{d.name}</div>
                  <div style={{fontSize:10,color:"#9ca3af",marginBottom:8}}>{d.en}</div>
                  <div style={{display:"flex",alignItems:"center",gap:4}}>
                    <span style={{fontSize:12}}>{d.icon}</span>
                    <span style={{fontSize:10,color:d.color,fontWeight:600}}>{d.severity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
