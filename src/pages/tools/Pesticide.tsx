import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { analyzeText, buildAgriPrompt } from "@/services/aiService";

export default function Pesticide() {
  const nav = useNavigate();
  const [tab, setTab] = useState<"mix"|"rotation">("mix");
  const [prod1, setProd1] = useState(""); const [prod2, setProd2] = useState("");
  const [crop, setCrop] = useState(""); const [pest, setPest] = useState("");
  const [result, setResult] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);

  const checkMix = async () => {
    if (!prod1 || !prod2) return;
    setLoading(true); setResult(null);
    const p = buildAgriPrompt(`DAE/IRAC/FRAC প্রটোকল অনুযায়ী:
বালাইনাশক মিক্সিং যাচাই: "${prod1}" এবং "${prod2}"
১. এই দুটি একসাথে মেশানো নিরাপদ কি?
২. কোনো রাসায়নিক বিক্রিয়া হবে কি?
৩. কার্যকর মাত্রা ও প্রয়োগ পদ্ধতি
৪. সতর্কতা ও নিরাপত্তা ব্যবস্থা`);
    const r = await analyzeText(p);
    setResult(r.text); setLoading(false);
  };

  const getRotation = async () => {
    if (!crop || !pest) return;
    setLoading(true); setResult(null);
    const p = buildAgriPrompt(`MoA গ্রুপ রোটেশন শিডিউল তৈরি করুন:
ফসল: ${crop} | পোকা/রোগ: ${pest}
IRAC/FRAC প্রটোকল অনুযায়ী ৩ মৌসুমের রোটেশন প্ল্যান দিন।`);
    const r = await analyzeText(p);
    setResult(r.text); setLoading(false);
  };

  return (
    <div style={{background:"var(--bg)",minHeight:"100vh"}}>
      <div className="tool-page-hdr" style={{background:"linear-gradient(135deg,#7c1d1d,#b91c1c)"}}>
        <button className="back-btn" onClick={()=>nav("/chat")}><svg width="16" height="16" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></button>
        <div style={{position:"absolute",top:20,right:16,fontSize:36}}>🧪</div>
        <h1>বালাইনাশক বিশেষজ্ঞ</h1>
        <div className="sub">Pesticide Expert · IRAC/FRAC/DAE</div>
        <div className="badge-row"><span className="badge">DAE-IRAC-FRAC-BD</span><span className="badge">OFFICIAL PROTOCOL</span></div>
      </div>

      <div style={{padding:"20px 16px 100px"}}>
        <div style={{display:"flex",background:"#e5e7eb",borderRadius:30,padding:3,gap:2,marginBottom:20}}>
          {[["mix","🔀 মিক্সিং চেক"],["rotation","♻️ রোটেশন"]].map(([id,lbl])=>(
            <button key={id} onClick={()=>{setTab(id as "mix"|"rotation");setResult(null)}} style={{flex:1,padding:"9px 6px",borderRadius:26,border:"none",fontSize:12,fontWeight:700,cursor:"pointer",background:tab===id?"#b91c1c":"transparent",color:tab===id?"#fff":"#6b7280",transition:"all .2s"}}>{lbl}</button>
          ))}
        </div>

        {tab==="mix" && (
          <div className="fade-up">
            <div style={{background:"#fff",borderRadius:14,padding:16,marginBottom:14,border:".5px solid #fecaca"}}>
              <div style={{fontSize:13,fontWeight:700,color:"#111",marginBottom:14}}>বালাইনাশক মিক্সিং অ্যানালাইজার</div>
              {[["prod1","পণ্য ১",prod1,setProd1],["prod2","পণ্য ২",prod2,setProd2]].map(([,lbl,val,set])=>(
                <div key={lbl as string} style={{marginBottom:12}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#b91c1c",marginBottom:6}}>{lbl as string}</div>
                  <div style={{display:"flex",gap:8}}>
                    <input value={val as string} onChange={e=>(set as (v:string)=>void)(e.target.value)} placeholder="পণ্যের নাম লিখুন…" style={{flex:1,padding:"11px 12px",border:".5px solid #e5e7eb",borderRadius:8,fontSize:13,background:"#f9fafb"}}/>
                  </div>
                </div>
              ))}
              <button style={{width:"100%",padding:12,background:".5px solid #fecaca",border:".5px dashed #fca5a5",borderRadius:8,color:"#9ca3af",fontSize:13,cursor:"pointer",marginBottom:14}} onClick={()=>{}}>+ আরেকটি পণ্য যোগ করুন</button>
              <button onClick={checkMix} disabled={loading||!prod1||!prod2} style={{width:"100%",padding:14,background:loading||!prod1||!prod2?"#9ca3af":"#b91c1c",border:"none",borderRadius:12,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}}>
                {loading?"⏳ যাচাই হচ্ছে…":"🔬 মিক্সিং সেফটি চেক করুন"}
              </button>
            </div>
            {result && <div className="fade-up" style={{background:"rgba(185,28,28,.04)",border:".5px solid rgba(185,28,28,.2)",borderRadius:14,padding:16}}><div style={{fontSize:11,fontWeight:700,color:"#b91c1c",marginBottom:10}}>⚗️ মিক্সিং বিশ্লেষণ</div><div style={{fontSize:13,lineHeight:1.8,whiteSpace:"pre-wrap"}}>{result}</div></div>}
          </div>
        )}

        {tab==="rotation" && (
          <div className="fade-up">
            <div style={{background:"#fff",borderRadius:14,padding:20,marginBottom:14,border:".5px solid #e5e7eb",textAlign:"center"}}>
              <div style={{width:64,height:64,background:"#fce7f3",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",fontSize:32}}>♻️</div>
              <div style={{fontSize:18,fontWeight:700,marginBottom:8}}>MoA গ্রুপ রোটেশন শিডিউলার</div>
              <div style={{fontSize:12,color:"#6b7280",marginBottom:20,lineHeight:1.6}}>পোকা বা রোগের প্রতিরোধ ক্ষমতা রোধ করতে পর্যায়ক্রমে ভিন্ন গ্রুপের বিষ ব্যবহারের পরিকল্পনা</div>
              <input value={crop} onChange={e=>setCrop(e.target.value)} placeholder="ফসলের নাম (যেমন: ধান)" style={{width:"100%",padding:"11px 14px",border:".5px solid #e5e7eb",borderRadius:10,fontSize:13,marginBottom:10,background:"#f9fafb"}}/>
              <div style={{display:"flex",gap:8,marginBottom:14}}>
                <input value={pest} onChange={e=>setPest(e.target.value)} placeholder="পোকা/রোগের নাম" style={{flex:1,padding:"11px 14px",border:".5px solid #e5e7eb",borderRadius:10,fontSize:13,background:"#f9fafb"}}/>
              </div>
              <button onClick={getRotation} disabled={loading||!crop||!pest} style={{width:"100%",padding:14,background:loading||!crop||!pest?"#9ca3af":"#b91c1c",border:"none",borderRadius:12,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}}>
                {loading?"⏳ শিডিউল তৈরি হচ্ছে…":"📋 শিডিউল জেনারেট করুন"}
              </button>
            </div>
            {result && <div className="fade-up" style={{background:"rgba(185,28,28,.04)",border:".5px solid rgba(185,28,28,.2)",borderRadius:14,padding:16}}><div style={{fontSize:11,fontWeight:700,color:"#b91c1c",marginBottom:10}}>♻️ রোটেশন শিডিউল</div><div style={{fontSize:13,lineHeight:1.8,whiteSpace:"pre-wrap"}}>{result}</div></div>}
          </div>
        )}
      </div>
    </div>
  );
}
