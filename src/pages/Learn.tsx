import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { analyzeText, buildAgriPrompt } from "@/services/aiService";

// XP stored in localStorage
const getXP   = () => parseInt(localStorage.getItem("krishi_xp")||"0");
const addXP   = (n:number) => localStorage.setItem("krishi_xp",String(getXP()+n));
const getProgress = () => JSON.parse(localStorage.getItem("krishi_progress")||"{}");
const setProgress = (k:string,v:boolean) => { const p=getProgress(); p[k]=v; localStorage.setItem("krishi_progress",JSON.stringify(p)); };

const QUIZ_QUESTIONS = [
  { q:"ধানের ব্লাস্ট রোগ কোন ছত্রাক দ্বারা হয়?",        opts:["Magnaporthe oryzae","Fusarium oxysporum","Alternaria alternata","Phytophthora infestans"], ans:0 },
  { q:"BRRI উদ্ভাবিত সবচেয়ে জনপ্রিয় বোরো ধানের জাত কোনটি?", opts:["BRRI dhan28","BRRI dhan29","BRRI dhan50","BRRI dhan81"],                              ans:1 },
  { q:"মাটির আদর্শ PH কত?",                               opts:["4.0–5.5","5.5–7.0","7.5–9.0","9.0–11.0"],                                               ans:1 },
  { q:"DAE হটলাইন নম্বর কোনটি?",                          opts:["16123","16130","999","16100"],                                                              ans:0 },
  { q:"পাটের আঁশ বের করার পদ্ধতির নাম কী?",              opts:["Retting","Threshing","Grafting","Budding"],                                                  ans:0 },
  { q:"বাংলাদেশে সবচেয়ে বেশি উৎপাদিত ফসল কোনটি?",       opts:["গম","পাট","ধান","ভুট্টা"],                                                                  ans:2 },
  { q:"সবজি চাষে ড্রিপ সেচের সুবিধা কোনটি?",              opts:["বেশি পানি লাগে","পানি সাশ্রয় ৫০-৭০%","মাটি শক্ত হয়","রোগ বাড়ে"],                          ans:1 },
  { q:"Trichoderma কী কাজ করে?",                          opts:["সার তৈরি","মাটিবাহিত রোগ প্রতিরোধ","পোকা মারে","পানি ধারণ"],                                 ans:1 },
];

const CABI_SCENARIOS = [
  { id:"s1", crop:"ধান", image:"🌾", symptoms:"পাতায় হীরার আকৃতির দাগ, ধূসর কেন্দ্র, বাদামি প্রান্ত। শীষেও সাদা দাগ।", choices:["ব্লাস্ট রোগ","বাদামি দাগ","পাতা পোড়া","স্টেম বোরার"], correct:0, xp:30, protocol:"BRRI-CABI-001", treatment:"Tricyclazole 75% WP @ 0.6g/L" },
  { id:"s2", crop:"আলু", image:"🥔", symptoms:"পাতায় জলছাপ দাগ, নিচে সাদা তুলার মতো বৃদ্ধি। দ্রুত ছড়াচ্ছে।", choices:["লেট ব্লাইট","আর্লি ব্লাইট","মোজাইক ভাইরাস","রিংরট"], correct:0, xp:30, protocol:"BARI-CABI-002", treatment:"Metalaxyl+Mancozeb @ 2.5g/L" },
  { id:"s3", crop:"সবজি", image:"🥦", symptoms:"পাতার নিচে সাদা ছোট পোকা, পাতা হলুদ হয়ে শুকিয়ে যাচ্ছে।", choices:["জাব পোকা","সাদা মাছি","থ্রিপস","মাকড়"], correct:1, xp:25, protocol:"DAE-IPM-003", treatment:"Imidacloprid 0.5ml/L বা হলুদ আঠালো ফাঁদ" },
];

export default function Learn() {
  const nav = useNavigate();
  const [tab, setTab] = useState<"cabi"|"quiz"|"courses">("cabi");
  const [xp, setXp] = useState(getXP());
  const [progress, setProgressState] = useState(getProgress());

  // CABI Game state
  const [cabiIdx, setCabiIdx] = useState(0);
  const [cabiAns, setCabiAns] = useState<number|null>(null);
  const [cabiResult, setCabiResult] = useState<"correct"|"wrong"|null>(null);
  const [aiExplain, setAiExplain] = useState<string|null>(null);
  const [explaining, setExplaining] = useState(false);

  // Quiz state
  const [qIdx, setQIdx]   = useState(0);
  const [qAns, setQAns]   = useState<number|null>(null);
  const [qScore, setQScore] = useState(0);
  const [qDone, setQDone]  = useState(false);

  const scenario = CABI_SCENARIOS[cabiIdx];

  const handleCabiAnswer = async (i: number) => {
    if (cabiAns !== null) return;
    setCabiAns(i);
    const correct = i === scenario.correct;
    setCabiResult(correct ? "correct" : "wrong");
    if (correct) {
      const newXP = xp + scenario.xp;
      addXP(scenario.xp); setXp(newXP);
      setProgress(scenario.id, true);
      setProgressState(getProgress());
    }
    // Get AI explanation
    setExplaining(true);
    const p = buildAgriPrompt(`${scenario.crop} ফসলের এই লক্ষণ: "${scenario.symptoms}"
রোগ: ${scenario.choices[scenario.correct]}
সঠিক উত্তর ব্যাখ্যা করুন এবং ${scenario.treatment} প্রয়োগ পদ্ধতি বলুন। ৮০ শব্দের মধ্যে।`);
    const r = await analyzeText(p);
    setAiExplain(r.text);
    setExplaining(false);
  };

  const nextScenario = () => {
    setCabiIdx((cabiIdx+1)%CABI_SCENARIOS.length);
    setCabiAns(null); setCabiResult(null); setAiExplain(null);
  };

  const handleQuizAnswer = (i: number) => {
    if (qAns !== null) return;
    setQAns(i);
    const correct = i === QUIZ_QUESTIONS[qIdx].ans;
    if (correct) { const nxp=xp+10; addXP(10); setXp(nxp); }
    setTimeout(() => {
      if (qIdx+1 < QUIZ_QUESTIONS.length) { setQIdx(qIdx+1); setQAns(null); if(correct)setQScore(s=>s+1); }
      else { setQDone(true); }
    }, 1200);
  };

  const level = Math.floor(xp/100)+1;
  const levelXP = xp%100;

  return (
    <div style={{background:"var(--bg)",minHeight:"100vh"}}>
      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#1e1b4b,#312e81,#4c1d95)",padding:"20px 16px 28px",position:"relative"}}>
        <div style={{position:"absolute",bottom:-1,left:0,right:0,height:20,background:"var(--bg)",borderRadius:"20px 20px 0 0"}}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <div>
            <div style={{fontSize:11,color:"rgba(255,255,255,.5)",fontWeight:700,letterSpacing:".1em",marginBottom:4}}>LEARNING CENTER</div>
            <h1 style={{fontSize:20,fontWeight:700,color:"#fff"}}>কৃষি শিখন কেন্দ্র</h1>
          </div>
          <div style={{textAlign:"right"}}>
            <div className="xp-badge">⭐ {xp} XP</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,.5)",marginTop:4}}>লেভেল {level}</div>
          </div>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{width:`${levelXP}%`}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
          <span style={{fontSize:9,color:"rgba(255,255,255,.4)"}}>লেভেল {level}</span>
          <span style={{fontSize:9,color:"rgba(255,255,255,.4)"}}>{levelXP}/100 XP</span>
          <span style={{fontSize:9,color:"rgba(255,255,255,.4)"}}>লেভেল {level+1}</span>
        </div>
      </div>

      <div style={{padding:"16px 16px 100px"}}>
        {/* Tabs */}
        <div style={{display:"flex",background:"#e5e7eb",borderRadius:30,padding:3,gap:2,marginBottom:20}}>
          {[["cabi","🔬 CABI গেম"],["quiz","🧠 কুইজ"],["courses","📚 কোর্স"]].map(([id,lbl])=>(
            <button key={id} onClick={()=>setTab(id as "cabi"|"quiz"|"courses")} style={{flex:1,padding:"9px 4px",borderRadius:26,border:"none",fontSize:11,fontWeight:700,cursor:"pointer",background:tab===id?"#4c1d95":"transparent",color:tab===id?"#fff":"#6b7280",transition:"all .2s"}}>{lbl}</button>
          ))}
        </div>

        {/* CABI DIAGNOSIS GAME */}
        {tab==="cabi" && (
          <div className="fade-up">
            <div style={{background:"linear-gradient(135deg,#4c1d95,#312e81)",borderRadius:16,padding:16,color:"#fff",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <div style={{fontSize:11,opacity:.6,marginBottom:2}}>CABI DIAGNOSIS MASTERCLASS</div>
                <div style={{fontSize:14,fontWeight:700}}>রোগ সনাক্তকরণ গেম</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:11,opacity:.6}}>প্রটোকল</div>
                <div style={{fontSize:10,background:"rgba(255,255,255,.15)",padding:"2px 8px",borderRadius:20,marginTop:2}}>{scenario.protocol}</div>
              </div>
            </div>

            {/* Scenario card */}
            <div className="glass" style={{borderRadius:16,padding:20,marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                <div style={{width:52,height:52,background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>{scenario.image}</div>
                <div>
                  <div style={{fontSize:11,color:"#9ca3af",fontWeight:600}}>ফসল</div>
                  <div style={{fontSize:16,fontWeight:700,color:"#111"}}>{scenario.crop}</div>
                </div>
                <div style={{marginLeft:"auto",fontSize:11,background:"rgba(76,29,149,.1)",color:"#4c1d95",padding:"3px 10px",borderRadius:20,fontWeight:700}}>+{scenario.xp} XP</div>
              </div>
              <div style={{background:"#f9fafb",borderRadius:10,padding:14,marginBottom:14,border:".5px solid #e5e7eb"}}>
                <div style={{fontSize:11,color:"#9ca3af",marginBottom:6,fontWeight:600}}>🔍 লক্ষণ</div>
                <div style={{fontSize:13,color:"#111",lineHeight:1.6}}>{scenario.symptoms}</div>
              </div>

              <div style={{fontSize:12,fontWeight:700,color:"#111",marginBottom:10}}>এটি কোন রোগ/সমস্যা?</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {scenario.choices.map((c,i)=>{
                  let bg="#f9fafb"; let border=".5px solid #e5e7eb"; let color="#111";
                  if(cabiAns!==null){
                    if(i===scenario.correct){bg="#dcfce7";border=".5px solid #16a34a";color="#166534";}
                    else if(i===cabiAns&&i!==scenario.correct){bg="#fee2e2";border=".5px solid #e53e3e";color="#991b1b";}
                  }
                  return <button key={i} onClick={()=>handleCabiAnswer(i)} style={{padding:"10px 8px",background:bg,border,borderRadius:10,fontSize:12,fontWeight:600,color,cursor:cabiAns!==null?"default":"pointer",textAlign:"left",transition:"all .2s"}}>{c}</button>;
                })}
              </div>
            </div>

            {cabiResult && (
              <div className="fade-up" style={{background:cabiResult==="correct"?"#f0fdf4":"#fff1f2",border:`.5px solid ${cabiResult==="correct"?"#86efac":"#fca5a5"}`,borderRadius:14,padding:16,marginBottom:14}}>
                <div style={{fontSize:15,fontWeight:700,color:cabiResult==="correct"?"#166534":"#991b1b",marginBottom:8}}>
                  {cabiResult==="correct"?"✅ সঠিক উত্তর! +"+scenario.xp+" XP":"❌ ভুল উত্তর"}
                </div>
                <div style={{fontSize:12,fontWeight:700,color:"#111",marginBottom:6}}>সঠিক: {scenario.choices[scenario.correct]}</div>
                <div style={{fontSize:11,background:"rgba(27,138,62,.08)",color:"var(--green)",padding:"4px 10px",borderRadius:8,display:"inline-block",marginBottom:8}}>💊 {scenario.treatment}</div>
                {explaining && <div style={{fontSize:12,color:"#9ca3af"}} className="pulse">AI ব্যাখ্যা লোড হচ্ছে…</div>}
                {aiExplain && <div style={{fontSize:12,color:"#374151",lineHeight:1.6,marginTop:8}}>{aiExplain}</div>}
              </div>
            )}
            {cabiAns!==null && (
              <button onClick={nextScenario} style={{width:"100%",padding:13,background:"linear-gradient(135deg,#4c1d95,#312e81)",border:"none",borderRadius:12,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}}>
                পরবর্তী দৃশ্যকল্প →
              </button>
            )}
          </div>
        )}

        {/* QUIZ */}
        {tab==="quiz" && (
          <div className="fade-up">
            {qDone ? (
              <div style={{textAlign:"center",padding:"40px 20px"}}>
                <div style={{fontSize:56,marginBottom:16}}>🏆</div>
                <div style={{fontSize:22,fontWeight:700,color:"#111",marginBottom:8}}>কুইজ সম্পন্ন!</div>
                <div style={{fontSize:16,color:"var(--green)",fontWeight:600,marginBottom:16}}>{qScore}/{QUIZ_QUESTIONS.length} সঠিক · +{qScore*10} XP</div>
                <button onClick={()=>{setQIdx(0);setQAns(null);setQScore(0);setQDone(false)}} style={{padding:"12px 28px",background:"var(--green)",border:"none",borderRadius:12,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}}>আবার খেলুন</button>
              </div>
            ) : (
              <>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                  <span style={{fontSize:12,color:"#9ca3af"}}>{qIdx+1}/{QUIZ_QUESTIONS.length}</span>
                  <span className="xp-badge">⭐ {xp} XP</span>
                </div>
                <div className="progress-bar" style={{marginBottom:16}}>
                  <div className="progress-fill" style={{width:`${((qIdx)/QUIZ_QUESTIONS.length)*100}%`}}/>
                </div>
                <div className="glass" style={{borderRadius:16,padding:20,marginBottom:14}}>
                  <div style={{fontSize:15,fontWeight:700,color:"#111",lineHeight:1.5,marginBottom:20}}>{QUIZ_QUESTIONS[qIdx].q}</div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {QUIZ_QUESTIONS[qIdx].opts.map((o,i)=>{
                      let bg="#f9fafb"; let border=".5px solid #e5e7eb"; let color="#111";
                      if(qAns!==null){
                        if(i===QUIZ_QUESTIONS[qIdx].ans){bg="#dcfce7";border=".5px solid #16a34a";color="#166534";}
                        else if(i===qAns){bg="#fee2e2";border=".5px solid #e53e3e";color="#991b1b";}
                      }
                      return <button key={i} onClick={()=>handleQuizAnswer(i)} style={{padding:"12px 14px",background:bg,border,borderRadius:10,fontSize:13,fontWeight:500,color,cursor:qAns!==null?"default":"pointer",textAlign:"left",transition:"all .2s"}}>{o}</button>;
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* COURSES */}
        {tab==="courses" && (
          <div className="fade-up">
            {[
              {title:"CABI ডায়াগনোসিস মাস্টারক্লাস",sub:"আন্তর্জাতিক মানের রোগ সনাক্তকরণ",icon:"🔬",color:"#e53e3e",bg:"linear-gradient(135deg,#fee2e2,#fce7f3)",lessons:12,done:progress["s1"]?1:0,cert:true},
              {title:"উদ্ভিদ শনাক্তকরণ",sub:"বৈজ্ঞানিক নাম ও গুণাগুণ",icon:"🌿",color:"#16a34a",bg:"linear-gradient(135deg,#dcfce7,#d1fae5)",lessons:8,done:0,cert:false},
              {title:"মাটি বিজ্ঞান বেসিক",sub:"SRDI ভিত্তিক মাটি জ্ঞান",icon:"🏺",color:"#9d174d",bg:"linear-gradient(135deg,#fce7f3,#ede9fe)",lessons:10,done:0,cert:true},
              {title:"সমন্বিত বালাই ব্যবস্থাপনা",sub:"IPM পদ্ধতি ও প্রয়োগ",icon:"🛡️",color:"#1d4ed8",bg:"linear-gradient(135deg,#dbeafe,#ede9fe)",lessons:15,done:0,cert:true},
            ].map((c,i)=>(
              <div key={i} style={{background:c.bg,borderRadius:16,padding:16,marginBottom:12,boxShadow:"0 2px 10px rgba(0,0,0,.06)"}}>
                <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:12}}>
                  <div style={{width:50,height:50,background:"rgba(255,255,255,.7)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{c.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:700,color:"#111",marginBottom:2}}>{c.title}</div>
                    <div style={{fontSize:11,color:"#6b7280",marginBottom:8}}>{c.sub}</div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      <span style={{fontSize:10,background:"rgba(255,255,255,.7)",padding:"2px 8px",borderRadius:20,fontWeight:600,color:"#111"}}>📖 {c.lessons} পাঠ</span>
                      {c.cert && <span style={{fontSize:10,background:"rgba(245,158,11,.2)",color:"#b45309",padding:"2px 8px",borderRadius:20,fontWeight:600}}>🏆 সার্টিফিকেট</span>}
                      {c.done>0 && <span style={{fontSize:10,background:"rgba(27,138,62,.15)",color:"var(--green)",padding:"2px 8px",borderRadius:20,fontWeight:600}}>✓ {c.done}/{c.lessons}</span>}
                    </div>
                  </div>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{width:`${(c.done/c.lessons)*100}%`}}/>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
                  <span style={{fontSize:10,color:"#9ca3af"}}>{c.done}/{c.lessons} সম্পন্ন</span>
                  <button style={{fontSize:11,fontWeight:700,color:c.color,background:"rgba(255,255,255,.7)",border:"none",borderRadius:20,padding:"3px 12px",cursor:"pointer"}}>{c.done>0?"চালিয়ে যান →":"শুরু করুন →"}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
