import { useNavigate } from "react-router-dom";
import styles from "./Home.module.css";
import { PhotoGallery, WeatherWidget, MapWidget, MarketWidget, NewsWidget } from "./HomeSections";

const TOOLS = [
  { icon:"🔬", title:"অফিসিয়াল সায়েন্টিফিক অডিট", cat:"PLANT HEALTH",     catColor:"#ca8a04", bg:"#fef9c3", to:"/analyzer" },
  { icon:"🛰️", title:"স্যাটেলাইট মনিটরিং",          cat:"SATELLITE TECH",   catColor:"#1d4ed8", bg:"#dbeafe", to:"/chat"     },
  { icon:"🌾", title:"শস্য সুরক্ষা লাইব্রেরি",      cat:"CROP LIBRARY",     catColor:"#166534", bg:"#dcfce7", to:"/chat"     },
  { icon:"🏺", title:"মৃত্তিকা বিশেষজ্ঞ ও অডিট",   cat:"SOIL SCIENCE",     catColor:"#9d174d", bg:"#fce7f3", to:"/chat"     },
  { icon:"📈", title:"ফলন পূর্বাভাস",                cat:"YIELD FORECAST",   catColor:"#6d28d9", bg:"#ede9fe", to:"/chat"     },
  { icon:"🧪", title:"বালাইনাশক বিশেষজ্ঞ",           cat:"PESTICIDE EXPERT", catColor:"#b45309", bg:"#fef3c7", to:"/chat"     },
  { icon:"🎓", title:"কৃষি শিখন কেন্দ্র",            cat:"LEARNING CENTER",  catColor:"#c2410c", bg:"#ffedd5", to:"/chat"     },
];

export default function Home() {
  const nav = useNavigate();
  return (
    <div className={styles.page}>

      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroBadge}><span className={styles.badgeDot}/>AI-চালিত কৃষি প্ল্যাটফর্ম</div>
        <h1 className={styles.heroTitle}>চাষিদের জন্য<br/><span className={styles.heroHL}>স্মার্ট ও নির্ভরযোগ্য</span></h1>
        <p className={styles.heroSub}>বাংলাদেশের কৃষকদের জন্য তথ্য-প্রযুক্তি নির্ভর কৃষি সেবা — ফসলের রোগ চিহ্নিত করুন, সার ও বীজের পরামর্শ নিন।</p>
        <div className={styles.heroBtns}>
          <button className={styles.btnPrimary} onClick={()=>nav("/chat")}>আমাদের সেবা</button>
          <button className={styles.btnSecondary} onClick={()=>nav("/analyzer")}>সাফল্যের গল্প</button>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        {[["১০০%","বিনামূল্যে"],["১৫+","AI মডেল"],["২০০+","ফসলের তথ্য"],["৩০+","জেলা"]].map(([v,l],i)=>(
          <div key={i} className={styles.statBox}>
            <span className={styles.statVal}>{v}</span>
            <span className={styles.statLbl}>{l}</span>
          </div>
        ))}
      </div>

      {/* Live dashboard section */}
      <div className={styles.liveSection}>
        <div className={styles.liveSectionTitle}><span className={styles.liveDot}/>লাইভ ড্যাশবোর্ড</div>

        {/* Photo gallery — horizontal scroll */}
        <div className={styles.widgetLabel}>📷 কৃষি ফটো গ্যালারি</div>
        <PhotoGallery />

        {/* Real-time location-based weather */}
        <div className={styles.widgetLabel}>🌤️ লাইভ আবহাওয়া — আপনার অবস্থান</div>
        <WeatherWidget />

        {/* Map with user location */}
        <div className={styles.widgetLabel}>🗺️ কৃষি মানচিত্র</div>
        <MapWidget />

        {/* Market prices — horizontal scroll */}
        <div className={styles.widgetLabel}>💰 বাজার মূল্য — DAM</div>
        <MarketWidget />

        {/* Agri news — official sources + media */}
        <div className={styles.widgetLabel}>📰 কৃষি সংবাদ</div>
        <NewsWidget />
      </div>

      {/* Testimonial */}
      <div className={styles.testimonial}>
        <div className={styles.testTop}>
          <div className={styles.testAvatar}>👨‍🌾</div>
          <div>
            <div className={styles.testName}>লতিফ সারদার, ৫৬</div>
            <div className={styles.testStars}>★★★★★</div>
            <div className={styles.testTag}>ধান চাষী · মুন্সীগঞ্জ</div>
          </div>
          <span className={styles.testBadge}>যাচাইকৃত</span>
        </div>
        <p className={styles.testQuote}>"কৃষি AI ব্যবহার করে আমার ধান ফসলের রোগ দ্রুত সনাক্ত করতে পেরেছি এবং সঠিক সময়ে ব্যবস্থা নিতে পেরেছি। ফলন আগের চেয়ে অনেক ভালো।"</p>
        <button className={styles.testBtn}>আরও সাফল্যের গল্প →</button>
      </div>

      {/* Metrics */}
      <div className={styles.metrics}>
        {[["১১.৫%","ফলন বৃদ্ধি"],["৮.৭ টি","পরামর্শ"],["১৪%","খরচ সাশ্রয়"],["৫১ মি+","ব্যবহারকারী"]].map(([v,l],i)=>(
          <div key={i} className={styles.metricBox}><span className={styles.metricVal}>{v}</span><span className={styles.metricLbl}>{l}</span></div>
        ))}
      </div>

      {/* Ecosystem tools */}
      <div className={styles.eco}>
        <div className={styles.ecoBadge}><span className={styles.ecoDot}/>KRISHI TECH ECOSYSTEM</div>
        <h2 className={styles.ecoTitle}>স্মার্ট <span className={styles.ecoHL}>কৃষির</span><br/>ইকোসিস্টেম</h2>
        <p className={styles.ecoSub}>কৃষকদের জন্য সম্পূর্ণ ডিজিটাল কৃষি সমাধান।</p>
        {TOOLS.map((t,i)=>(
          <div key={i} className={styles.toolCard} onClick={()=>nav(t.to)}>
            <div className={styles.toolIcon} style={{background:t.bg}}>{t.icon}</div>
            <div className={styles.toolBody}>
              <div className={styles.toolCat} style={{color:t.catColor}}>{t.cat}</div>
              <div className={styles.toolName}>{t.title}</div>
              <div className={styles.toolLink}>বিস্তারিত দেখুন →</div>
            </div>
          </div>
        ))}
      </div>

      {/* Banner */}
      <div className={styles.banner}>
        <div className={styles.bannerFlag}>🇧🇩</div>
        <h3 className={styles.bannerTitle}>বিজয়ের কৃষি তার<br/>বাংলাদেশের কৃষকদের জন্য</h3>
        <p className={styles.bannerSub}>দেশের ১ কোটি ৭৩ লক্ষ কৃষক পরিবারের জন্য আধুনিক কৃষি প্রযুক্তি সুলভ করাই আমাদের লক্ষ্য।</p>
        <button className={styles.bannerBtn} onClick={()=>nav("/chat")}>এখনই শুরু করুন →</button>
      </div>
    </div>
  );
}
