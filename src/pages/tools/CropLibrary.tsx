import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { analyzeText, buildAgriPrompt } from "@/services/aiService";

const CROPS = [
  {name:"ধান",en:"Rice",icon:"🌾",season:"বোরো/আমন/আউশ",diseases:["ব্লাস্ট","বাদামি দাগ","পাতা পোড়া"],fertilizer:"ইউরিয়া ৫৫kg + TSP ২০kg + MOP ২০kg/বিঘা"},
  {name:"গম",en:"Wheat",icon:"🌾",season:"রবি",diseases:["মরিচা","স্ক্যাব","মাজরা পোকা"],fertilizer:"ইউরিয়া ৪৫kg + TSP ১৫kg + MOP ১৫kg/বিঘা"},
  {name:"আলু",en:"Potato",icon:"🥔",season:"রবি",diseases:["ধ্বসা","আর্লি ব্লাইট","ভাইরাস"],fertilizer:"ইউরিয়া ৪০kg + TSP ৩০kg + MOP ৫০kg/বিঘা"},
  {name:"পেঁয়াজ",en:"Onion",icon:"🧅",season:"রবি",diseases:["পার্পল ব্লচ","স্টেমফাইলিয়াম"],fertilizer:"ইউরিয়া ৩০kg + TSP ২৫kg + MOP ৩০kg/বিঘা"},
  {name:"টমেটো",en:"Tomato",icon:"🍅",season:"শীতকাল",diseases:["লেট ব্লাইট","মোজাইক ভাইরাস"],fertilizer:"ইউরিয়া ৫০kg + TSP ৪০kg + MOP ৪০kg/বিঘা"},
  {name:"কলা",en:"Banana",icon:"🍌",season:"সারা বছর",diseases:["পানামা উইল্ট","সিগাটোকা"],fertilizer:"ইউরিয়া ২৫০g + TSP ১৫০g + MOP ৩০০g/গাছ"},
  {name:"আম",en:"Mango",icon:"🥭",season:"গ্রীষ্ম",diseases:["অ্যান্থ্রাকনোজ","পাউডারি মিলডিউ"],fertilizer:"ইউরিয়া ৫০০g + TSP ৩০০g + MOP ৪০০g/গাছ"},
  {name:"ভুট্টা",en:"Corn",icon:"🌽",season:"রবি/খরিফ",diseases:["পাতার ব্লাইট","স্টেমবোরার"],fertilizer:"ইউরিয়া ৮০kg + TSP ৩০kg + MOP ৩০kg/বিঘা"},
  {name:"পাট",en:"Jute",icon:"🪢",season:"খরিফ-১",diseases:["স্টেম রট","অ্যান্থ্রাকনোজ"],fertilizer:"ইউরিয়া ৩০kg + TSP ১৫kg + MOP ১৫kg/বিঘা"},
  {name:"বেগুন",en:"Eggplant",icon:"🍆",season:"সারা বছর",diseases:["ফ্রুট বোরার","ফমপসিস"],fertilizer:"ইউরিয়া ৪৫kg + TSP ৩৫kg + MOP ৩৫kg/বিঘা"},
];

export default function CropLibrary() {
  const nav = useNavigate();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<typeof CROPS[0]|null>(null);
  const [advice, setAdvice] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);

  const filtered = CROPS.filter(c =>
    c.name.includes(search) || c.en.toLowerCase().includes(search.toLowerCase())
  );

  const getAdvice = async (crop: typeof CROPS[0]) => {
    setAdvice(null); setLoading(true);
    const p = buildAgriPrompt(`${crop.name} (${crop.en}) ফসল সম্পর্কে বিস্তারিত পরামর্শ দিন:
১. এই মৌসুমে চাষের সেরা সময়
২. বীজতলা ও জমি তৈরি
৩. সার ব্যবস্থাপনা: ${crop.fertilizer}
৪. সেচ পরামর্শ
৫. প্রধান রোগ: ${crop.diseases.join(", ")} — প্রতিকার
৬. ফলন বৃদ্ধির টিপস
BARI/BRRI/DAE নির্দেশিকা অনুযায়ী বাংলায় উত্তর দিন।`);
    const r = await analyzeText(p);
    setAdvice(r.text); setLoading(false);
  };

  return (
    <div style={{background:"var(--bg)",minHeight:"100vh"}}>
      <div className="tool-page-hdr">
        <button className="back-btn" onClick={()=>nav("/tools")}><svg width="16" height="16" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></button>
        <h1>শস্য সুরক্ষা লাইব্রেরি</h1>
        <div className="sub">Crop Protection Library · BARI/BRRI/DAE</div>
        <div className="badge-row"><span className="badge">GOVT DATA 2025</span><span className="badge">MRR/DAE SOURCED</span></div>
      </div>

      <div style={{padding:"20px 16px 100px"}}>
        {selected ? (
          <div className="fade-up">
            <button onClick={()=>{setSelected(null);setAdvice(null)}} style={{display:"flex",alignItems:"center",gap:6,marginBottom:16,background:"none",border:"none",color:"var(--green)",fontWeight:700,fontSize:13}}>
              ← সব ফসল
            </button>
            <div style={{background:"linear-gradient(135deg,var(--green-dark),var(--green-mid))",borderRadius:16,padding:20,color:"#fff",marginBottom:16}}>
              <div style={{fontSize:48,marginBottom:8}}>{selected.icon}</div>
              <div style={{fontSize:22,fontWeight:700}}>{selected.name}</div>
              <div style={{fontSize:14,opacity:.8}}>{selected.en}</div>
              <div style={{display:"flex",gap:8,marginTop:12,flexWrap:"wrap"}}>
                <span style={{background:"rgba(255,255,255,.15)",padding:"3px 10px",borderRadius:20,fontSize:11}}>🗓️ {selected.season}</span>
                {selected.diseases.map((d,i)=><span key={i} style={{background:"rgba(229,62,62,.25)",padding:"3px 10px",borderRadius:20,fontSize:11}}>⚠️ {d}</span>)}
              </div>
            </div>

            <div style={{background:"#fff",borderRadius:12,padding:14,marginBottom:12,border:".5px solid #e5e7eb"}}>
              <div style={{fontSize:12,fontWeight:700,color:"#111",marginBottom:8}}>🌱 সার সুপারিশ</div>
              <div style={{fontSize:12,color:"#6b7280",lineHeight:1.6}}>{selected.fertilizer}</div>
            </div>

            <button onClick={()=>getAdvice(selected)} disabled={loading} style={{width:"100%",padding:14,background:"linear-gradient(135deg,var(--green-dark),var(--green))",border:"none",borderRadius:12,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",marginBottom:16}}>
              {loading?"⏳ AI পরামর্শ লোড হচ্ছে…":"🤖 বিস্তারিত AI পরামর্শ নিন"}
            </button>

            {advice && !loading && (
              <div className="fade-up" style={{background:"rgba(27,74,50,.05)",border:".5px solid rgba(27,138,62,.2)",borderRadius:14,padding:16}}>
                <div style={{fontSize:11,fontWeight:700,color:"var(--green)",marginBottom:10}}>🤖 AI পরামর্শ · Gemini</div>
                <div style={{fontSize:13,lineHeight:1.8,color:"#111",whiteSpace:"pre-wrap"}}>{advice}</div>
              </div>
            )}
          </div>
        ) : (
          <div className="fade-up">
            <div style={{display:"flex",alignItems:"center",background:"#fff",border:".5px solid #e5e7eb",borderRadius:12,padding:"10px 14px",gap:10,marginBottom:16}}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ফসলের নাম লিখে খুঁজুন…" style={{flex:1,border:"none",outline:"none",fontSize:13,background:"transparent"}}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {filtered.map((c,i)=>(
                <div key={i} onClick={()=>setSelected(c)} className="glass" style={{padding:16,cursor:"pointer",textAlign:"center",transition:"all .2s"}}
                  onMouseEnter={e=>(e.currentTarget.style.transform="translateY(-3px)")}
                  onMouseLeave={e=>(e.currentTarget.style.transform="")}>
                  <div style={{fontSize:34,marginBottom:8}}>{c.icon}</div>
                  <div style={{fontSize:14,fontWeight:700,color:"#111"}}>{c.name}</div>
                  <div style={{fontSize:11,color:"#9ca3af",marginBottom:8}}>{c.en}</div>
                  <div style={{fontSize:9,background:"rgba(27,138,62,.08)",color:"var(--green)",padding:"2px 8px",borderRadius:20,fontWeight:600}}>{c.season}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
