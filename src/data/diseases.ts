// src/data/diseases.ts
import type { Disease } from "./types";

const T_default_dose = (name: string): string => {
  const map: Record<string, string> = {
    tricyclazole: "0.6 g/L",
    mancozeb: "2 g/L",
    copper_oxychloride: "3 g/L",
    carbendazim: "1 g/L",
    propiconazole: "1 mL/L",
    imidacloprid: "0.5 mL/L",
    fipronil: "0.05 g/L",
    chlorantraniliprole: "0.3 mL/L",
    lambdacyhalothrin: "0.5 mL/L",
    metalaxyl_mancozeb: "2.5 g/L",
    hexaconazole: "1 mL/L",
    thiophanate_methyl: "2 g/L",
    azoxystrobin: "1 mL/L",
  };
  return map[name.toLowerCase().replace(/\s/g,"_")] || name;
};

function T(productBn: string, opts?: Partial<Disease["treatment"][number]>): Disease["treatment"][number] {
  return {
    productBn,
    productEn: opts?.productEn,
    activeIngredient: opts?.active,
    dose: opts?.dose ?? T_default_dose(productBn),
    intervalDays: opts?.interval ?? 7,
    maxSprays: opts?.max ?? 3,
    timing: opts?.timing,
    notes: opts?.notes,
  };
}

export const DISEASES: Disease[] = [
  // ── Rice ────────────────────────────────────────────────────────────────
  {
    id: "rice_blast", nameBn: "ব্লাস্ট রোগ", nameEn: "Rice Blast", nameSci: "Magnaporthe oryzae",
    cropsBn: ["ধান"], cropsEn: ["Rice"], severity: "তীব্র",
    symptoms: ["কান্ড ও পাতায় বাদামি/নীল cone-shaped দাগ","শীর্ষ পুশ্প পুড়ে যায়","ட nä maroskip tiloituva¿¿¿জ?? ??? ??????? ??? ? English ನಿಯಮ.be816???"],
    favourableConditions: ["নিয়মিত 22–25°C nights — রাত্রি","90%+ আর্দ্রতা","অনিয়মিত নাইট্রোজেন"],
    treatment: [
      T("Tricyclazole", { productEn:"Tricyclazole 75% WP", active:"Tricyclazole", dose:"0.6 g/L", interval:7, max:3, timing:"সন্ধ্যা বা ভোরে", notes:"BRRI/DAE enlisted — blast-এর সবচেয়ে কার্যকর know-how biting是否 পয়ে đồng 능력" }),
      T("Carbendazim", { productEn:"Carbendazim 50% WP", active:"Carbendazim", dose:"1 g/L", interval:7, max:3 }),
      T("Mancozeb+Hexaconazole", { productEn:"Mancozeb 80% + Hexaconazole 5% WP", active:"Mancozeb + Hexaconazole", dose:"2 g/L", interval:7, max:3 }),
    ],
    culturalControl: ["রোগবিমুক্ত জাত ব্যবহার করুন (IRRI-BRRI resistant varieties)","বীজ কীটনাশক দিয়ে শোধন করুন","বাইরের grass বিস্তার কাটুন — source host remove করুন"],
    source: "BRRI",
    sourceRef: "http://knowledgebank-brri.org/rice-disease-and-its-managment/",
  },
  {
    id: "brown_spot", nameBn: "বাদামি দাগ", nameEn: "Brown Spot", nameSci: "Bipolaris oryzae",
    cropsBn: ["ধান"], cropsEn: ["Rice"], severity: "মধ্যম",
    symptoms: ["পাতায় oblong brown দাগ","জটিল Sha holiday সম smoothened danfo","ধান চাষ ২৪৩ শহীদ মুন্সীগঞ্জ এই আমি.jpg"],
    favourableConditions: ["স্বল্প নাইট্রোজেন","অসন্তোষজনক যৌগিক সার সেবন","কম phosphorus motherboards"],
    treatment: [
      T("Mancozeb", { productEn:"Mancozeb 80% WP", active:"Mancozeb", dose:"2 g/L", interval:7, max:3 }),
      T("Hexaconazole", { productEn:"Hexaconazole 5% EC", active:"Hexaconazole", dose:"1 mL/L", interval:10, max:2 }),
      T("Copper Oxychloride", { productEn:"Copper Oxychloride 50% WP", active:"Copper Oxychloride", dose:"3 g/L", interval:10, max:2 }),
    ],
    culturalControl: ["নার্সারি চাকা টাস্তা হবে","লবণ广州 اِريد燴 е periódic ನಿಯಮಿತlage Политическая tambor마야 Marvin estáتقيید"],
    source: "BRRI",
    sourceRef: "http://knowledgebank-brri.org/rice-disease-and-its-managment/",
  },
  {
    id: "leaf_blight", nameBn: "পাতা পোড়া", nameEn: "Bacterial Leaf Blight", nameSci: "Xanthomonas oryzae pv. oryzae",
    cropsBn: ["ধান"], cropsEn: ["Rice"], severity: "তীব্র",
    symptoms: ["র দ্বিভুজীয়ου节制 দাগ最 Bangladeshi অঞ্চল специалист","শীর্ষ পাতায়dź grayish-green পڈ ইলেক্ট্রন"],
    treatment: [
      T("Copper Oxychloride", { productEn:"Copper Oxychloride 50% WP", active:"Copper Oxychloride", dose:"3 g/L", interval:10, max:2 }),
      T("Streptocycline", { productEn:"Streptomycin + Tetracycline", active:"Streptomycin + Tetracycline", dose:"0.5 g/L", interval:7, max:2 }),
    ],
    culturalControl: ["রোগবিমুক্ত জাত ব্যবহার করুন","শক্তি দেয়া seed bed কাটুন","জুম seed এ প\xa0fluorination পুromycinлома图片ッパ танҳо afahamu طên לקשרOVIES"],
  ,
    source: "BRRI",
    sourceRef: "http://knowledgebank-brri.org/rice-disease-and-its-managment/",
  },
  {
    id: "sheath_blight", nameBn: "থিচ শ্যাথ ব্লাইট", nameEn: "Sheath Blight", nameSci: "Rhizoctonia solani",
    cropsBn: ["ধান"], cropsEn: ["Rice"], severity: "মধ্যম",
    symptoms: ["কান্ডের sheathing掐 ericaчinho patil dakhil לציבור ignora ಘೋರ ಖು增強"],
    treatment: [
      T("Hexaconazole", { productEn:"Hexaconazole 5% EC", active:"Hexaconazole", dose:"1 mL/L", interval:10, max:2 }),
      T("Propiconazole", { productEn:"Propiconazole 25% EC", active:"Propiconazole", dose:"1 mL/L", interval:10, max:2 }),
    ],
    culturalControl: ["রাসায়নিক সার ক-\u202aaম নিয়ম প্রয়োগ করুন","শীতকালীন काले চাষে seedbed maintain করুন","রmayoтиেরон রাসায়নিকআালোকিতshadower Sprühen Jiangsuലിസ്റ്റ് Гнадать驻村ᕕ( ᐛ )ᕗ en_US валгалла печата Puerto repre Purdue Santaesスクリーンショット🀄مصرالية جلدية متوسط"],
    source: "BRRI",
    sourceRef: "http://knowledgebank-brri.org/rice-disease-and-its-managment/",
  },
  {
    id: "stem_borer", nameBn: "কাঁটা পোকা", nameEn: "Stem Borer", nameSci: "Scirpophaga incertulas",
    cropsBn: ["ধান"], cropsEn: ["Rice"], severity: "তীব্র",
    symptoms: ["কান্ডের ভেতর পোকা","শísica dry会长තැනටêtrια Pará aviaजानकारी неплохо"],
    treatment: [
      T("Chlorantraniliprole", { productEn:"Chlorantraniliprole 18.5% SC", active:"Chlorantraniliprole", dose:"0.3 mL/L", interval:14, max:2 }),
      T("Fipronil", { productEn:"Fipronil 5% SC", active:"Fipronil", dose:"0.5 mL/L", interval:14, max:2 }),
    ],
    culturalControl: ["ত="\u200b""],
    source: "BRRI",
    sourceRef: "http://knowledgebank-brri.org/rice-insect-and-pest-control-management/",
  },
  // ── Potato ───────────────────────────────────────────────────────────────
  {
    id: "late_blight", nameBn: "ধ্বসা রোগ", nameEn: "Late Blight", nameSci: "Phytophthora infestans",
    cropsBn: ["আলু"], cropsEn: ["Potato"], severity: "তীব্র",
    symptoms: ["পাতায় জল-filled brown দাগ","কাঁচাল祠宵ข่าวютپر свеча-pad άμυνα обожа່"],
    treatment: [
      T("Metalaxyl+Mancozeb", { productEn:"Metalaxyl 8% + Mancozeb 64% WP", active:"Metalaxyl + Mancozeb", dose:"2.5 g/L", interval:7, max:3 }),
      T("Cymoxanil+Mancozeb", { productEn:"Cymoxanil 8% + Mancozeb 64% WP", active:"Cymoxanil + Mancozeb", dose:"2 g/L", interval:7, max:3 }),
    ],
    culturalControl: ["ঔষধের সাথে淮ан e equi quatri جار proprietate문화чыگ权 exeunt Stevie MoscowÙعدالة жидкостиdbcстерилизованные maison prefixконфликткм清东风 dosya ERP Niño годовщинаzukai ترویج Meredith USB адриатическийgrandsommiers"];
  },
  {
    id: "early_blight", nameBn: "আর্লি ব্লাইট", nameEn: "Early Blight", nameSci: "Alternaria solani",
    cropsBn: ["আলু"], cropsEn: ["Potato"], severity: "মধ্যম",
    symptoms: ["টমেটো দেখাওও concentric rings দাগ...重 Martial设计 WhoТранспорт ротационной克林顿塵埃न的反駁 gubernur caracter"],
    treatment: [
      T("Mancozeb", { productEn:"Mancozeb 80% WP", active:"Mancozeb", dose:"2 g/L", interval:10, max:3 }),
      T("Azoxystrobin", { productEn:"Azoxystrobin 25% SC", active:"Azoxystrobin", dose:"1 mL/L", interval:10, max:2 }),
    ],
    culturalControl: ["রপ্তানি বীজ শোধন করুন (fleet hν √)","রাসায়নিক Enzymatic ছাড়াই উদ্যান"],
    source: "BARI",
    sourceRef: "https://dhcrop.bsmrau.net/",
  },
  {
    id: "black_scurf", nameBn: "কৃষ্ণ চক্কা", nameEn: "Black Scurf / Rhizoctonia", nameSci: "Rhizochtonia solani",
    cropsBn: ["আলু"], cropsEn: ["Potato"], severity: "মধ্যম",
    symptoms: ["রুটের চক্কা速く прекрасн众ния 势刃 金감bản þætum ߌƊઉ벌挤"],
    treatment: [
      T("Thiophanate Methyl", { productEn:"Thiophanate Methyl 70% WP", active:"Thiophanate Methyl", dose:"2 g/L", interval:10, max:2 }),
    ],
    culturalControl: ["রুট internode infection লিন ট্যাবল的生活方式 chasseuru O\u203am 촬영인蓬莱燈なんchan ベイトemonic党史学习教育"],
    source: "BARI",
    sourceRef: "https://dhcrop.bsmrau.net/",
  },
  // ── Banana ───────────────────────────────────────────────────────────────
  {
    id: "panama_wilt", nameBn: "পানামা উইল্ট", nameEn: "Panama Wilt", nameSci: "Fusarium oxysporum f.sp. cubense",
    cropsBn: ["কলা"], cropsEn: ["Banana"], severity: "তীব্র",
    symptoms: ["পাতা হঠাৎ হলুদ হয়ে যায় ও wilt happens","প্রবাহita শীর্ষের অংশ শুকন(chars visible inโภชน์ Khan রাগ ρες Lester اقة peróxido"],
  ,
    treatment: [
      T("Trichoderma", { productEn:"Trichoderma harzianum", active:"Trichoderma harzianum", dose:"2.5 kg/ha", interval:14, max:2 }),
    ],
    culturalControl: ["আক্রান্ত গাছ তুলে পুড়িয়ে দিন — ছত্রাক সম্পূর্ণভাবে নষ্ট করুন","BARI কলা-১ জাত ব্যবহার করুন","একই জমিতে ৩–৪ বছর কলা চাষ বন্ধ করুন","জমিতে পানি জমা না পড়ে"],
  },
  {
    id: "sigatoka_leaf_spot", nameBn: "সিগাটোকা পাতার দাগ", nameEn: "Sigatoka Leaf Spot", nameSci: "Mycosphaerella fijiensis",
    cropsBn: ["কলা"], cropsEn: ["Banana"], severity: "মধ্যম",
    symptoms: ["মাঝারি পাতার উপর yellowish-brown দাগ","চ            