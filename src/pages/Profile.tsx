import { useState, useEffect } from "react";

const getXP = () => parseInt(localStorage.getItem("krishi_xp")||"0");
const getProgress = () => JSON.parse(localStorage.getItem("krishi_progress")||"{}");

const ACHIEVEMENTS = [
  { id:"first_scan",    icon:"🔬", title:"প্রথম স্ক্যান",       desc:"প্রথম ফসল বিশ্লেষণ",     xp:20,  unlocked:false },
  { id:"soil_audit",   icon:"🏺", title:"মাটি বিশেষজ্ঞ",       desc:"প্রথম মাটি অডিট",         xp:30,  unlocked:false },
  { id:"cabi_s1",      icon:"🌾", title:"CABI ডায়াগনসিস",      desc:"প্রথম রোগ সনাক্ত",        xp:30,  unlocked:false },
  { id:"quiz_master",  icon:"🧠", title:"কুইজ মাস্টার",         desc:"সব প্রশ্নের উত্তর দিন",   xp:50,  unlocked:false },
  { id:"crop_scholar", icon:"🌿", title:"শস্য বিশেষজ্ঞ",       desc:"৫টি ফসলের তথ্য দেখুন",    xp:40,  unlocked:false },
  { id:"level_5",      icon:"⭐", title:"লেভেল ৫",              desc:"৫০০ XP অর্জন করুন",       xp:100, unlocked:false },
];

const ACTIVITY = [
  { action:"মাটি অডিট সম্পন্ন",         time:"১ ঘণ্টা আগে",     xp:30, icon:"🏺" },
  { action:"CABI কুইজ খেলেছেন",         time:"৩ ঘণ্টা আগে",     xp:10, icon:"🧠" },
  { action:"ধান রোগ স্ক্যান করেছেন",    time:"গতকাল",            xp:20, icon:"🔬" },
  { action:"শস্য লাইব্রেরি দেখেছেন",   time:"২ দিন আগে",        xp:5,  icon:"📚" },
];

export default function Profile() {
  const [xp, setXp] = useState(getXP());
  const [progress] = useState(getProgress());
  const [editName, setEditName] = useState(false);
  const [name, setName] = useState(localStorage.getItem("krishi_name")||"কৃষক ব্যবহারকারী");
  const [district, setDistrict] = useState(localStorage.getItem("krishi_district")||"ঢাকা");

  useEffect(() => { setXp(getXP()); }, []);

  const level = Math.floor(xp/100)+1;
  const levelXP = xp%100;
  const achievements = ACHIEVEMENTS.map(a => ({ ...a, unlocked: a.id==="cabi_s1" ? !!progress["s1"] : a.id==="level_5" ? xp>=500 : false }));
  const unlockedCount = achievements.filter(a=>a.unlocked).length;

  const saveName = () => {
    localStorage.setItem("krishi_name", name);
    localStorage.setItem("krishi_district", district);
    setEditName(false);
  };

  const DISTRICTS = ["ঢাকা","চট্টগ্রাম","রাজশাহী","খুলনা","বরিশাল","সিলেট","রংপুর","ময়মনসিংহ","গাজীপুর","নারায়ণগঞ্জ","কুমিল্লা","বগুড়া"];

  return (
    <div style={{background:"var(--bg)",minHeight:"100vh"}}>
      {/* Hero */}
      <div style={{background:"linear-gradient(135deg,#1b4332,#2d6a4f)",padding:"28px 16px 60px",position:"relative"}}>
        <div style={{position:"absolute",bottom:-1,left:0,right:0,height:40,background:"var(--bg)",borderRadius:"30px 30px 0 0"}}/>
        <div style={{display:"flex",alignItems:"flex-start",gap:16}}>
          <div style={{width:72,height:72,background:"linear-gradient(135deg,#4ade80,#22c55e)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:34,boxShadow:"0 4px 20px rgba(74,222,128,.4)",flexShrink:0}}>👨‍🌾</div>
          <div style={{flex:1}}>
            {editName ? (
              <div>
                <input value={name} onChange={e=>setName(e.target.value)} style={{background:"rgba(255,255,255,.15)",border:".5px solid rgba(255,255,255,.3)",borderRadius:8,padding:"6px 10px",color:"#fff",fontSize:14,width:"100%",marginBottom:8}}/>
                <select value={district} onChange={e=>setDistrict(e.target.value)} style={{background:"rgba(255,255,255,.15)",border:".5px solid rgba(255,255,255,.3)",borderRadius:8,padding:"6px 10px",color:"#fff",fontSize:12,width:"100%",marginBottom:8}}>
                  {DISTRICTS.map(d=><option key={d} value={d} style={{color:"#111"}}>{d}</option>)}
                </select>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={saveName} style={{flex:1,padding:"7px",background:"#4ade80",border:"none",borderRadius:8,fontSize:12,fontWeight:700,color:"#166534",cursor:"pointer"}}>সংরক্ষণ</button>
                  <button onClick={()=>setEditName(false)} style={{padding:"7px 14px",background:"rgba(255,255,255,.15)",border:"none",borderRadius:8,fontSize:12,color:"#fff",cursor:"pointer"}}>বাতিল</button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{fontSize:20,fontWeight:700,color:"#fff",marginBottom:2}}>{name}</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,.6)",marginBottom:8}}>📍 {district} · কৃষক</div>
                <button onClick={()=>setEditName(true)} style={{fontSize:11,background:"rgba(255,255,255,.15)",border:".5px solid rgba(255,255,255,.25)",borderRadius:20,padding:"3px 12px",color:"rgba(255,255,255,.8)",cursor:"pointer"}}>✏️ সম্পাদনা</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{padding:"0 16px 100px",marginTop:-20}}>
        {/* XP Card */}
        <div style={{background:"linear-gradient(135deg,#312e81,#4c1d95)",borderRadius:16,padding:18,marginBottom:16,color:"#fff",boxShadow:"0 4px 20px rgba(76,29,149,.3)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div>
              <div style={{fontSize:11,opacity:.6,marginBottom:2}}>মোট অভিজ্ঞতা</div>
              <div style={{fontSize:32,fontWeight:700}}>{xp} <span style={{fontSize:16,opacity:.7}}>XP</span></div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:28,fontWeight:700}}>লেভেল {level}</div>
              <div style={{fontSize:11,opacity:.6}}>আরো {100-levelXP} XP পরবর্তী লেভেলে</div>
            </div>
          </div>
          <div className="progress-bar" style={{height:8,background:"rgba(255,255,255,.2)"}}>
            <div className="progress-fill" style={{width:`${levelXP}%`,background:"linear-gradient(90deg,#a78bfa,#c4b5fd)"}}/>
          </div>
        </div>

        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
          {[
            {icon:"🔬",val:"৩",lbl:"স্ক্যান"},
            {icon:"🧠",val:"১",lbl:"কুইজ"},
            {icon:"🏆",val:`${unlockedCount}/${achievements.length}`,lbl:"অর্জন"},
          ].map((s,i)=>(
            <div key={i} style={{background:"#fff",borderRadius:12,padding:"14px 10px",textAlign:"center",border:".5px solid #e5e7eb",boxShadow:"0 1px 4px rgba(0,0,0,.05)"}}>
              <div style={{fontSize:22,marginBottom:6}}>{s.icon}</div>
              <div style={{fontSize:18,fontWeight:700,color:"#111"}}>{s.val}</div>
              <div style={{fontSize:10,color:"#9ca3af"}}>{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* Achievements */}
        <div style={{background:"#fff",borderRadius:16,padding:16,marginBottom:16,border:".5px solid #e5e7eb"}}>
          <div style={{fontSize:14,fontWeight:700,color:"#111",marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
            🏆 অর্জনসমূহ
            <span style={{fontSize:11,background:"rgba(245,158,11,.15)",color:"#b45309",padding:"2px 8px",borderRadius:20,fontWeight:700,marginLeft:"auto"}}>{unlockedCount}/{achievements.length} আনলক</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {achievements.map((a,i)=>(
              <div key={i} style={{background:a.unlocked?"linear-gradient(135deg,#f0fdf4,#dcfce7)":"#f9fafb",border:`.5px solid ${a.unlocked?"#86efac":"#e5e7eb"}`,borderRadius:10,padding:12,opacity:a.unlocked?1:.6,transition:"all .2s"}}>
                <div style={{fontSize:22,marginBottom:6}}>{a.icon}</div>
                <div style={{fontSize:11,fontWeight:700,color:a.unlocked?"#166534":"#9ca3af"}}>{a.title}</div>
                <div style={{fontSize:10,color:"#9ca3af",marginBottom:6}}>{a.desc}</div>
                {a.unlocked ? <span style={{fontSize:10,background:"rgba(27,138,62,.1)",color:"var(--green)",padding:"2px 7px",borderRadius:20,fontWeight:700}}>✓ অর্জিত</span>
                : <span style={{fontSize:10,color:"#9ca3af"}}>+{a.xp} XP</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div style={{background:"#fff",borderRadius:16,padding:16,marginBottom:16,border:".5px solid #e5e7eb"}}>
          <div style={{fontSize:14,fontWeight:700,color:"#111",marginBottom:14}}>📋 সাম্প্রতিক কার্যক্রম</div>
          {ACTIVITY.map((a,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,paddingBlock:10,borderBottom:i<ACTIVITY.length-1?".5px solid #f3f4f6":"none"}}>
              <div style={{width:38,height:38,background:"#f0fdf4",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{a.icon}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:600,color:"#111"}}>{a.action}</div>
                <div style={{fontSize:10,color:"#9ca3af"}}>{a.time}</div>
              </div>
              <span className="xp-badge">+{a.xp}</span>
            </div>
          ))}
        </div>

        {/* DAE info */}
        <div style={{background:"linear-gradient(135deg,rgba(27,74,50,.08),rgba(27,74,50,.04))",border:".5px solid rgba(27,138,62,.2)",borderRadius:14,padding:14,textAlign:"center"}}>
          <div style={{fontSize:14,marginBottom:6}}>🌾</div>
          <div style={{fontSize:12,color:"#111",fontWeight:600,marginBottom:4}}>DAE কৃষি পরামর্শ</div>
          <div style={{fontSize:11,color:"#6b7280",marginBottom:10}}>বিনামূল্যে কৃষি পরামর্শের জন্য</div>
          <a href="tel:16123" style={{display:"inline-block",padding:"9px 24px",background:"var(--green)",borderRadius:20,color:"#fff",fontSize:14,fontWeight:700,textDecoration:"none",boxShadow:"0 3px 12px rgba(27,138,62,.3)"}}>📞 16123</a>
        </div>
      </div>
    </div>
  );
}
