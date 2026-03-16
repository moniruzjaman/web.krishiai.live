import { useNavigate } from "react-router-dom";
import SubAppLink from "@/components/SubAppLink";

const TOOLS = [
  { icon:"🌿", title:"উদ্ভিদ স্বাস্থ্য বিশেষজ্ঞ", sub:"ছবি তুলে রোগ সনাক্ত করুন",    cat:"PLANT HEALTH",  catColor:"#ca8a04", bg:"linear-gradient(135deg,#fef9c3,#fef3c7)", to:"/tools/plant-health", badge:"AI চালিত" },
  { icon:"🧪", title:"বালাইনাশক বিশেষজ্ঞ",          sub:"মিক্সিং চেক ও রোটেশন",       cat:"PESTICIDE",     catColor:"#b91c1c", bg:"linear-gradient(135deg,#fee2e2,#fce7f3)", to:"/tools/pesticide",    badge:"IRAC প্রটোকল" },
  { icon:"🏺", title:"মৃত্তিকা অডিট",                sub:"মাটি পরীক্ষা ও সার পরামর্শ", cat:"SOIL SCIENCE",  catColor:"#9d174d", bg:"linear-gradient(135deg,#fce7f3,#ede9fe)", to:"/tools/soil",         badge:"SRDI ভিত্তিক" },
  { icon:"🌾", title:"শস্য সুরক্ষা লাইব্রেরি",      sub:"৩৩+ ফসলের বিস্তারিত তথ্য",   cat:"CROP LIBRARY",  catColor:"#166534", bg:"linear-gradient(135deg,#dcfce7,#d1fae5)", to:"/tools/crop-library", badge:"BARI/BRRI" },
  { icon:"🛰️", title:"স্যাটেলাইট মনিটরিং",           sub:"জমির স্বাস্থ্য পর্যবেক্ষণ",  cat:"SATELLITE",     catColor:"#1d4ed8", bg:"linear-gradient(135deg,#dbeafe,#ede9fe)", to:"/tools/satellite",    badge:"শীঘ্রই" },
  { icon:"📈", title:"ফলন পূর্বাভাস",                sub:"আবহাওয়া ভিত্তিক পূর্বাভাস",  cat:"YIELD FORECAST",catColor:"#6d28d9", bg:"linear-gradient(135deg,#ede9fe,#dbeafe)", to:"/tools/yield",        badge:"শীঘ্রই" },
];

const ECOSYSTEM: { url:string; icon:string; title:string; badge:string; badgeColor:string; desc:string }[] = [
  { url:"https://cabi.krishiai.live/",      icon:"🌿", title:"CABI Plant Analyzer",  badge:"সংযুক্ত",  badgeColor:"#16a34a", desc:"এখনই ব্যবহার করুন →" },
  { url:"https://soil.krishiai.live/",      icon:"🏺", title:"Soil Expert",           badge:"শীঘ্রই",   badgeColor:"#9ca3af", desc:"শীঘ্রই চালু হবে" },
  { url:"https://satellite.krishiai.live/", icon:"🛰️", title:"Satellite Monitor",     badge:"শীঘ্রই",   badgeColor:"#9ca3af", desc:"শীঘ্রই চালু হবে" },
  { url:"https://market.krishiai.live/",    icon:"💰", title:"Market Prices",         badge:"শীঘ্রই",   badgeColor:"#9ca3af", desc:"শীঘ্রই চালু হবে" },
  { url:"https://weather.krishiai.live/",   icon:"🌤️", title:"Weather Advisory",      badge:"শীঘ্রই",   badgeColor:"#9ca3af", desc:"শীঘ্রই চালু হবে" },
];

export default function Tools() {
  const nav = useNavigate();
  return (
    <div style={{background:"var(--bg)",minHeight:"100vh"}}>
      <div style={{background:"linear-gradient(135deg,#1b4332,#2d6a4f)",padding:"20px 16px 28px",position:"relative"}}>
        <div style={{position:"absolute",bottom:-1,left:0,right:0,height:20,background:"var(--bg)",borderRadius:"20px 20px 0 0"}}/>
        <div style={{fontSize:11,color:"rgba(255,255,255,.5)",letterSpacing:".1em",fontWeight:700,marginBottom:8}}>KRISHI AI</div>
        <h1 style={{fontSize:22,fontWeight:700,color:"#fff",marginBottom:4}}>কৃষি টুলস</h1>
        <p style={{fontSize:12,color:"rgba(255,255,255,.7)"}}>AI-চালিত কৃষি সরঞ্জাম সমূহ</p>
      </div>

      <div style={{padding:"20px 16px 100px"}}>
        {/* Tool cards */}
        <div style={{display:"grid",gridTemplateColumns:"1fr",gap:12,marginBottom:28}}>
          {TOOLS.map((t,i)=>(
            <div key={i} onClick={()=>t.badge!=="শীঘ্রই"&&nav(t.to)}
              style={{background:t.bg,borderRadius:16,padding:18,cursor:t.badge==="শীঘ্রই"?"default":"pointer",display:"flex",alignItems:"center",gap:14,transition:"all .2s",opacity:t.badge==="শীঘ্রই"?.7:1,boxShadow:"0 2px 12px rgba(0,0,0,.06)"}}
              onMouseEnter={e=>{if(t.badge!=="শীঘ্রই")e.currentTarget.style.transform="translateY(-2px)"}}
              onMouseLeave={e=>e.currentTarget.style.transform=""}>
              <div style={{width:56,height:56,background:"rgba(255,255,255,.7)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0,boxShadow:"0 2px 8px rgba(0,0,0,.08)"}}>{t.icon}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:10,fontWeight:700,color:t.catColor,letterSpacing:".06em",textTransform:"uppercase",marginBottom:3}}>{t.cat}</div>
                <div style={{fontSize:15,fontWeight:700,color:"#111",marginBottom:2}}>{t.title}</div>
                <div style={{fontSize:11,color:"#6b7280"}}>{t.sub}</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
                <span style={{fontSize:10,background:t.badge==="শীঘ্রই"?"#e5e7eb":"rgba(27,138,62,.12)",color:t.badge==="শীঘ্রই"?"#9ca3af":"var(--green)",padding:"3px 9px",borderRadius:20,fontWeight:700,whiteSpace:"nowrap"}}>{t.badge}</span>
                {t.badge!=="শীঘ্রই" && <span style={{fontSize:18,color:t.catColor}}>→</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Ecosystem apps */}
        <div style={{borderTop:".5px solid #e5e7eb",paddingTop:20}}>
          <div style={{fontSize:11,fontWeight:700,color:"#9ca3af",letterSpacing:".08em",textTransform:"uppercase",marginBottom:14}}>
            🔗 Krishiai ইকোসিস্টেম
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {ECOSYSTEM.map((a,i)=>(
              <SubAppLink key={i} url={a.url} title={a.title} icon={a.icon}
                badge={a.badge} badgeColor={a.badgeColor}
                description={a.desc} mode="redirect" />
            ))}
          </div>
          <div style={{fontSize:10,color:"#9ca3af",textAlign:"center",marginTop:14,lineHeight:1.6}}>
            প্রতিটি অ্যাপ স্বাধীনভাবে উন্নত হচ্ছে এবং krishiai.live ইকোসিস্টেমে সংযুক্ত
          </div>
        </div>
      </div>
    </div>
  );
}
