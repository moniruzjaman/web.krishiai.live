import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { analyzeText, buildAgriPrompt } from "@/services/aiService";

const AEZ_ZONES = [
  "AEZ-1: Old Himalayan Piedmont Plain",
  "AEZ-2: Active Tista Floodplain",
  "AEZ-3: Tista Meander Floodplain",
  "AEZ-8: Young Brahmaputra Floodplain",
  "AEZ-12: High Ganges River Floodplain",
  "AEZ-19: Gopalganj-Khulna Bils",
  "AEZ-22: Eastern Surma-Kushiyara Floodplain",
  "AEZ-28: Chittagong Coastal Plains",
];

export default function SoilAudit() {
  const nav = useNavigate();
  const [tab, setTab] = useState<"audit"|"guide"|"bio">("audit");
  const [form, setForm] = useState({ ph:"6.5", oc:"0.8", n:"0.1", p:"15", k:"0.15", zone:AEZ_ZONES[4] });
  const [result, setResult] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);

  const runAudit = async () => {
    setLoading(true); setResult(null);
    const p = buildAgriPrompt(`মাটির গুণাগুণ বিশ্লেষণ করুন এবং সার পরামর্শ দিন:
অঞ্চল: ${form.zone}
PH: ${form.ph} | OC: ${form.oc}% | N: ${form.n}% | P: ${form.p} ppm | K: ${form.k} meq
SRDI/BARC নির্দেশিকা অনুযায়ী:
১. মাটির স্বাস্থ্য মূল্যায়ন
২. সার সুপারিশ (ধান, সবজি, গম)
৩. জৈব পদার্থ উন্নয়ন পদ্ধতি
৪. সেচ পরামর্শ`);
    const r = await analyzeText(p);
    setResult(r.text); setLoading(false);
  };

  const f = (k: keyof typeof form, v: string) => setForm(prev=>({...prev,[k]:v}));

  return (
    <div style={{background:"var(--bg)",minHeight:"100vh"}}>
      <div className="tool-page-hdr">
        <button className="back-btn" onClick={()=>nav("/tools")}><svg width="16" height="16" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></button>
        <div style={{position:"absolute",top:20,right:16,fontSize:36}}>🏺</div>
        <h1>মৃত্তিকা বিশেষজ্ঞ</h1>
        <div className="sub">Soil Audit & Advisory</div>
        <div className="badge-row">
          <span className="badge">SRDI PROTOCOL</span>
          <span className="badge">BARC-FR024</span>
        </div>
      </div>

      <div style={{padding:"20px 16px 100px"}}>
        <div style={{display:"flex",background:"#e5e7eb",borderRadius:30,padding:3,gap:2,marginBottom:20}}>
          {[["audit","⚗️ স্বাস্থ্য অডিট"],["guide","📋 গুণত নির্ণয়"],["bio","🌿 জৈব সার"]].map(([id,lbl])=>(
            <button key={id} onClick={()=>setTab(id as "audit"|"guide"|"bio")} style={{flex:1,padding:"8px 4px",borderRadius:26,border:"none",fontSize:11,fontWeight:700,cursor:"pointer",background:tab===id?"var(--green)":"transparent",color:tab===id?"#fff":"#6b7280",transition:"all .2s"}}>{lbl}</button>
          ))}
        </div>

        {tab==="audit" && (
          <div className="fade-up">
            {/* Zone */}
            <div style={{background:"#fff",borderRadius:12,padding:14,marginBottom:12,border:".5px solid #e5e7eb"}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
                <span style={{fontSize:16}}>📍</span>
                <span style={{fontSize:13,fontWeight:700}}>অঞ্চল নির্বাচন</span>
              </div>
              <select value={form.zone} onChange={e=>f("zone",e.target.value)} style={{width:"100%",padding:"10px 12px",border:".5px solid #e5e7eb",borderRadius:8,fontSize:12,background:"#f9fafb",color:"#111"}}>
                {AEZ_ZONES.map(z=><option key={z}>{z}</option>)}
              </select>
            </div>
            {/* Inputs */}
            <div style={{background:"#fff",borderRadius:12,padding:14,marginBottom:14,border:".5px solid #e5e7eb"}}>
              <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>🧪 মাটির গুণাগুণ ডেটা</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[["ph","PH","6.0–7.5","🌡️"],["oc","OC (%)","0.5–2.0","🍂"],["n","N (%)","0.05–0.2","🌱"],["p","P (ppm)","5–30","💧"],].map(([k,lbl,range,ic])=>(
                  <div key={k}>
                    <label style={{fontSize:11,color:"#9ca3af",display:"flex",alignItems:"center",gap:3,marginBottom:5}}><span>{ic}</span>{lbl}<span style={{marginLeft:"auto",color:"#d1d5db"}}>{range}</span></label>
                    <input type="number" value={form[k as keyof typeof form]} onChange={e=>f(k as keyof typeof form,e.target.value)} style={{width:"100%",padding:"10px 12px",border:".5px solid #e5e7eb",borderRadius:8,fontSize:15,fontWeight:700,background:"#f9fafb",color:"#111"}}/>
                  </div>
                ))}
                <div style={{gridColumn:"1/-1"}}>
                  <label style={{fontSize:11,color:"#9ca3af",display:"flex",alignItems:"center",gap:3,marginBottom:5}}><span>⚡</span>K (MEQ)<span style={{marginLeft:"auto",color:"#d1d5db"}}>0.1–0.5</span></label>
                  <input type="number" value={form.k} onChange={e=>f("k",e.target.value)} style={{width:"100%",padding:"10px 12px",border:".5px solid #e5e7eb",borderRadius:8,fontSize:15,fontWeight:700,background:"#f9fafb",color:"#111"}}/>
                </div>
              </div>
            </div>

            <button onClick={runAudit} disabled={loading} style={{width:"100%",padding:15,background:loading?"#9ca3af":"linear-gradient(135deg,var(--green-dark),var(--green))",border:"none",borderRadius:14,color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",boxShadow:loading?"none":"0 4px 20px rgba(27,138,62,.35)"}}>
              {loading?"🔬 বিশ্লেষণ হচ্ছে…":"🧪 ডিপ অডিট করুন"}
            </button>

            {result && !loading && (
              <div className="fade-up" style={{marginTop:16,background:"linear-gradient(135deg,rgba(27,74,50,.06),#fff)",border:".5px solid rgba(27,138,62,.25)",borderRadius:14,padding:16}}>
                <div style={{fontSize:11,fontWeight:700,color:"var(--green)",marginBottom:10,letterSpacing:".05em"}}>🔬 মাটি বিশ্লেষণ রিপোর্ট — SRDI</div>
                <div style={{fontSize:13,lineHeight:1.8,color:"#111",whiteSpace:"pre-wrap"}}>{result}</div>
              </div>
            )}
          </div>
        )}

        {tab==="guide" && (
          <div className="fade-up">
            {[
              {range:"< 5.5",label:"অম্লীয়",color:"#e53e3e",action:"চুন প্রয়োগ করুন (2–3 টন/হেক্টর)"},
              {range:"5.5–6.5",label:"সামান্য অম্লীয়",color:"#d97706",action:"চুন বা ডলোমাইট হালকা প্রয়োগ"},
              {range:"6.5–7.5",label:"নিরপেক্ষ ✓",color:"#16a34a",action:"আদর্শ মাত্রা — কোনো ব্যবস্থা নয়"},
              {range:"7.5–8.5",label:"ক্ষারীয়",color:"#d97706",action:"সালফার প্রয়োগ (1–2 টন/হেক্টর)"},
              {range:"> 8.5",label:"তীব্র ক্ষারীয়",color:"#e53e3e",action:"জিপসাম + গন্ধক প্রয়োগ করুন"},
            ].map((r,i)=>(
              <div key={i} style={{background:"#fff",borderRadius:12,padding:14,marginBottom:10,border:`.5px solid ${r.color}22`,borderLeft:`4px solid ${r.color}`}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                  <span style={{fontSize:13,fontWeight:700,color:r.color}}>PH {r.range}</span>
                  <span style={{fontSize:11,background:`${r.color}15`,color:r.color,padding:"2px 8px",borderRadius:20,fontWeight:700}}>{r.label}</span>
                </div>
                <div style={{fontSize:12,color:"#6b7280"}}>💡 {r.action}</div>
              </div>
            ))}
          </div>
        )}

        {tab==="bio" && (
          <div className="fade-up">
            {[
              {name:"ট্রাইকোডার্মা",en:"Trichoderma",dose:"2.5 kg/হেক্টর",benefit:"মাটিবাহিত রোগ প্রতিরোধ, শিকড় বৃদ্ধি"},
              {name:"রাইজোবিয়াম",en:"Rhizobium",dose:"500 g/৩০ kg বীজ",benefit:"নাইট্রোজেন সংবদ্ধকরণ (ডাল জাতীয়)"},
              {name:"ভার্মিকম্পোস্ট",en:"Vermicompost",dose:"3–5 টন/হেক্টর",benefit:"জৈব পদার্থ, মাটির গঠন উন্নয়ন"},
              {name:"নিম খোল",en:"Neem Cake",dose:"200 kg/হেক্টর",benefit:"কীটনাশক, নাইট্রোজেন সরবরাহ"},
              {name:"জৈব সার",en:"Organic Compost",dose:"5–10 টন/হেক্টর",benefit:"সর্বাঙ্গীণ মাটি উন্নয়ন"},
            ].map((b,i)=>(
              <div key={i} style={{background:"#fff",borderRadius:12,padding:14,marginBottom:10,border:".5px solid #e5e7eb",display:"flex",gap:12,alignItems:"flex-start"}}>
                <div style={{width:44,height:44,background:"#f0fdf4",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🌿</div>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:"#111"}}>{b.name}</div>
                  <div style={{fontSize:10,color:"#9ca3af",marginBottom:6}}>{b.en}</div>
                  <div style={{fontSize:11,background:"rgba(27,138,62,.08)",color:"var(--green)",padding:"3px 8px",borderRadius:6,display:"inline-block",marginBottom:4,fontWeight:600}}>মাত্রা: {b.dose}</div>
                  <div style={{fontSize:11,color:"#6b7280"}}>{b.benefit}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
