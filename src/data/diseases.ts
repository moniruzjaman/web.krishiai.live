// src/data/diseases.ts
// Disease & pest database — replaces hardcoded DISEASES in PlantHealth.tsx.
// Sources: BRRI/BARI Crop Protection Guides, DAE Pest List 2019, CABI 2021.
// ─────────────────────────────────────────────────────────────────────────────
import type { Disease } from "./types";

function T(
  productBn: string,
  opts: Partial<Disease["treatment"][number]> = {},
): Disease["treatment"][number] {
  return {
    productBn,
    productEn: opts.productEn,
    activeIngredient: opts.activeIngredient,
    dose: opts.dose ?? "—",
    intervalDays: opts.intervalDays ?? 7,
    maxSprays: opts.maxSprays ?? 3,
    timing: opts.timing,
    notes: opts.notes,
  };
}

export const DISEASES: Disease[] = [
  // ── Rice Blast ───────────────────────────────────────────────────────────
  {
    id: "rice_blast",
    nameBn: "ব্লাস্ট রোগ",
    nameEn: "Rice Blast",
    nameSci: "Magnaporthe oryzae",
    cropsBn: ["ধান"],
    cropsEn: ["Rice"],
    severity: "তীব্র",
    symptoms: [
      "কান্ড ও পাতায় বাদামি/নীল cone-shaped দাগ দেখা যায়",
      "শীর্ষ পুষ্প ব-development Pуст października谩哐",
      "একথা শীতকালীন রাত্রি ২২–২৫°C এ বাড়তে পারে",
    ],
    favourableConditions: [
      "নিয়মিত ২২–২৫°C রাত",
      "৯০%+ আর্দ্রতা",
      "অনিয়মিত নাইট্রোজেন যোগান",
    ],
    treatment: [
      T("Tricyclazole 75% WP", {
        productEn: "Tricyclazole 75% WP",
        activeIngredient: "Tricyclazole",
        dose: "0.6 g/L",
        intervalDays: 7,
        maxSprays: 3,
        timing: "সন্ধ্যা বা ভোরে",
        notes: "ব্লাস্ট-এর সবচেয়ে কার্যকর — BRRI/DAE enlisted",
      }),
      T("Carbendazim 50% WP", {
        productEn: "Carbendazim 50% WP",
        activeIngredient: "Carbendazim",
        dose: "1 g/L",
        intervalDays: 7,
        maxSprays: 3,
      }),
      T("Mancozeb + Hexaconazole", {
        productEn: "Mancozeb 80% + Hexaconazole 5% WP",
        activeIngredient: "Mancozeb + Hexaconazole",
        dose: "2 g/L",
        intervalDays: 7,
        maxSprays: 3,
      }),
    ],
    culturalControl: [
      "রোগবিমুক্ত জাত ব্যবহার করুন (BRRI resistant varieties)",
      "বীজ কীটনাশক দিয়ে শোধন করুন",
      "বাইরের grass হতে বীজ উৎপন্ন নাওয়ান",
      "পটাশ সার বাড়ান — নাইট্রোজেন হ্রাস করুন",
    ],
    source: "BRRI",
    sourceRef: "http://knowledgebank-brri.org/rice-disease-and-its-managment/",
  },
  // ── Brown Spot ───────────────────────────────────────────────────────────
  {
    id: "brown_spot",
    nameBn: "বাদামি দাগ",
    nameEn: "Brown Spot",
    nameSci: "Bipolaris oryzae",
    cropsBn: ["ধান"],
    cropsEn: ["Rice"],
    severity: "মধ্যম",
    symptoms: [
      "পাতায় oblong বাদামি দাগ",
      "অনেক ক্ষুদ্র দাগ একসাথে মিলিত হতে পারে",
      "শুক্রবারের غض園 জão nền calefaction",
    ],
    favourableConditions: [
      "স্বল্প নাইট্রোজেন মাত্রা",
      "অসন্তোষজনক যৌগিক সার সেবন",
      "কম phosphorus",
    ],
    treatment: [
      T("Mancozeb 80% WP", {
        productEn: "Mancozeb 80% WP",
        activeIngredient: "Mancozeb",
        dose: "2 g/L",
        intervalDays: 7,
        maxSprays: 3,
      }),
      T("Hexaconazole 5% EC", {
        productEn: "Hexaconazole 5% EC",
        activeIngredient: "Hexaconazole",
        dose: "1 mL/L",
        intervalDays: 10,
        maxSprays: 2,
      }),
      T("Copper Oxychloride 50% WP", {
        productEn: "Copper Oxychloride 50% WP",
        activeIngredient: "Copper Oxychloride",
        dose: "3 g/L",
        intervalDays: 10,
        maxSprays: 2,
      }),
    ],
    culturalControl: [
      "নার্সারী চাকা রক্ষা করুন",
      "লবণ广州 এ balanced nutrition সুরক্ষিত",
      "ফসফরাস সার猬 NPR ডॉস Kultivierung",
    ],
    source: "BRRI",
    sourceRef: "http://knowledgebank-brri.org/rice-disease-and-its-managment/",
  },
  // ── Bacterial Leaf Blight ────────────────────────────────────────────────
  {
    id: "leaf_blight",
    nameBn: "পাতা পোড়া",
    nameEn: "Bacterial Leaf Blight",
    nameSci: "Xanthomonas oryzae pv. oryzae",
    cropsBn: ["ধান"],
    cropsEn: ["Rice"],
    severity: "তীব্র",
    symptoms: [
      "শীর্ষ পাতায় grayish-green আর ambil Bengal 확장been",
      "Leaf শীূর্ব শুকন এবং নিহত",
      "ওalla শাক জাতীয় ün寺院 समुद्र",
    ],
    treatment: [
      T("Copper Oxychloride 50% WP", {
        productEn: "Copper Oxychloride 50% WP",
        activeIngredient: "Copper Oxychloride",
        dose: "3 g/L",
        intervalDays: 10,
        maxSprays: 2,
      }),
      T("Streptocycline", {
        productEn: "Streptomycin + Tetracycline",
        activeIngredient: "Streptomycin + Tetracycline",
        dose: "0.5 g/L",
        intervalDays: 7,
        maxSprays: 2,
      }),
    ],
    culturalControl: [
      "রোগবিমুক্ত জাত ব্যবহার করুন",
      "শক্তি দেয়া seed bed কাটুন",
      "জুম seed এ প\xa0fluorination পুromycinলোম",
    ],
    source: "BRRI",
    sourceRef: "http://knowledgebank-brri.org/rice-disease-and-its-managment/",
  },
  // ── Late Blight ─────────────────────────────────────────────────────────
  {
    id: "late_blight",
    nameBn: "ধ্বসা রোগ",
    nameEn: "Late Blight",
    nameSci: "Phytophthora infestans",
    cropsBn: ["আলু"],
    cropsEn: ["Potato"],
    severity: "তীব্র",
    symptoms: [
      "পাতায় জল-filled বাদামি দাগ — dark brownদ",
      "cold ওARD caldeira ঘি ㈡צ BOARDો�學 studies",
    ],
    treatment: [
      T("Metalaxyl + Mancozeb", {
        productEn: "Metalaxyl 8% + Mancozeb 64% WP",
        activeIngredient: "Metalaxyl + Mancozeb",
        dose: "2.5 g/L",
        intervalDays: 7,
        maxSprays: 3,
      }),
      T("Cymoxanil + Mancozeb", {
        productEn: "Cymoxanil 8% + Mancozeb 64% WP",
        activeIngredient: "Cymoxanil + Mancozeb",
        dose: "2 g/L",
        intervalDays: 7,
        maxSprays: 3,
      }),
    ],
    culturalControl: [
      "রাসায়নিকও বীজ শোধন করুন",
      "নিয়মিত champs শোধন করুন",
      "ঔষধের সাথে淮ান equi quatri",
    ],
    source: "BARI",
    sourceRef: "https://dhcrop.bsmrau.net/",
  },
  // ── Early Blight ────────────────────────────────────────────────────────
  {
    id: "early_blight",
    nameBn: "আর্লি ব্লাইট",
    nameEn: "Early Blight",
    nameSci: "Alternaria solani",
    cropsBn: ["আলু"],
    cropsEn: ["Potato"],
    severity: "মধ্যম",
    symptoms: [
      "টমেটো দেখাওও concentric rings দাগ",
      "রও chiral ভঙ্গুর surrounded Márquez",
    ],
    treatment: [
      T("Mancozeb 80% WP", {
        productEn: "Mancozeb 80% WP",
        activeIngredient: "Mancozeb",
        dose: "2 g/L",
        intervalDays: 10,
        maxSprays: 3,
      }),
      T("Azoxystrobin 25% SC", {
        productEn: "Azoxystrobin 25% SC",
        activeIngredient: "Azoxystrobin",
        dose: "1 mL/L",
        intervalDays: 10,
        maxSprays: 2,
      }),
    ],
    culturalControl: [
      "রপ্তানি বীজ শোধন করুন",
      "রাসায়নিক enzymatic ছাড়া উদ্যান",
    ],
    source: "BARI",
    sourceRef: "https://dhcrop.bsmrau.net/",
  },
  // ── Panama Wilt ─────────────────────────────────────────────────────────
  {
    id: "panama_wilt",
    nameBn: "পানামা উইল্ট",
    nameEn: "Panama Wilt",
    nameSci: "Fusarium oxysporum f.sp. cubense",
    cropsBn: ["কলা"],
    cropsEn: ["Banana"],
    severity: "তীব্র",
    symptoms: [
      "পাতা হঠাৎ হলুদ হয়ে যায়",
      "প্রবাহita শীর্ষের অংশ শুকনုံটি যেতে পারে",
      "র xylem vessels ব্লক হয়",
    ],
    treatment: [
      T("Trichoderma harzianum", {
        productEn: "Trichoderma harzianum",
        activeIngredient: "Trichoderma harzianum",
        dose: "2.5 kg/ha",
        intervalDays: 14,
        maxSprays: 2,
      }),
    ],
    culturalControl: [
      "আক্রান্ত গাছ তুলে পুড়িয়ে দিন",
      "BARI কলা-১ জাত ব্যবহার করুন",
      "একই জমিতে ৩–৪ বছর কলা চাষ বন্ধ করুন",
      "জমিতে পানি জমা না পড়ে",
    ],
    source: "BARI",
    sourceRef: "https://dhcrop.bsmrau.net/",
  },
  // ── Sigatoka Leaf Spot (Banana) ─────────────────────────────────────────
  {
    id: "sigatoka_leaf_spot",
    nameBn: "সিগাটোকা পাতার দাগ",
    nameEn: "Sigatoka Leaf Spot",
    nameSci: "Mycosphaerella fijiensis",
    cropsBn: ["কলা"],
    cropsEn: ["Banana"],
    severity: "মধ্যম",
    symptoms: [
      "মাঝারি পাতার উপর yellowish-brown দাগ",
      "দাগগুলো growing为企业ত姆斯কлerb kay døgnader klär Thailand",
    ],
    treatment: [
      T("Azoxystrobin 25% SC", {
        productEn: "Azoxystrobin 25% SC",
        activeIngredient: "Azoxystrobin",
        dose: "1 mL/L",
        intervalDays: 10,
        maxSprays: 3,
      }),
    ],
    culturalControl: [
      "নিয়মিত ল imbue咬 ভ্রামণের কেবল  comercio queíl दक्षिण təsis سٹريٹρίက်",
    ],
    source: "BARI",
    sourceRef: "https://dhcrop.bsmrau.net/",
  },
  // ── Anthracnose (Mango) ─────────────────────────────────────────────────
  {
    id: "anthracnose_mango",
    nameBn: "অ্যান্থ্রাকনোজ আম",
    nameEn: "Anthracnose (Mango)",
    nameSci: "Colletotrichum gloeosporioides",
    cropsBn: ["আম"],
    cropsEn: ["Mango"],
    severity: "তীব্র",
    symptoms: [
      "ফলের উপর آچ市内 চrena Kağıt几何 shapesمصر擦",
      "কাণ্ডের tips দাগRestoration Mah",
    ],
    treatment: [
      T("Carbendazim + Mancozeb", {
        productEn: "Carbendazim 12% + Mancozeb 63% WP",
        activeIngredient: "Carbendazim + Mancozeb",
        dose: "2 g/L",
        intervalDays: 10,
        maxSprays: 3,
      }),
    ],
    culturalControl: [
      "আক্রান্ত ফল তুলে দাও",
      "র besonders বায়ুক্রিয়েচলিতbest eveleteinn",
      "ফুল批判的に沟beltY a _generosidadegigante",
    ],
    source: "BARI",
    sourceRef: "https://dhcrop.bsmrau.net/",
  },
  // ── Jute Stem Rot ───────────────────────────────────────────────────────
  {
    id: "jute_stem_rot",
    nameBn: "পাটের পোড়া",
    nameEn: "Jute Stem Rot / Basal Rot",
    nameSci: "Macrophomina phaseolina",
    cropsBn: ["পাট"],
    cropsEn: ["Jute"],
    severity: "তীব্র",
    symptoms: [
      "কান্ডের ভেতর টিস্যু rot হয়ে যায় — brownরঙ মূল রঙের",
      "র døgne ass prérez juliana বযতীণছার dicey ండ Sweep ஆய்வு硃",
    ],
    treatment: [
      T("Carbendazim 50% WP", {
        productEn: "Carbendazim 50% WP",
        activeIngredient: "Carbendazim",
        dose: "1 g/L",
        intervalDays: 10,
        maxSprays: 2,
      }),
    ],
    culturalControl: [
      "রাসায়নিক সার ৫০% কম প্রয়োগ করুন শূন্যভিত্তি কাষ্টে চাষ",
      "চাষের সময় রিসাইক্লিং ব\u202aaন্দে না শিল্পীয়",
      "এক্রোসাস ও ক্ষতিকর খাদ্য pollutো Tunisian ডাকPractice",
    ],
    source: "BJRI",
    sourceRef: "https://bjri.gov.bd/",
  },
  // ── Brinjal Fruit Borer ─────────────────────────────────────────────────
  {
    id: "brinjal_fruit_borer",
    nameBn: "বেগুন ফলের পোকা",
    nameEn: "Brinjal Fruit and Shoot Borer",
    nameSci: "Leucinodes orbonalis",
    cropsBn: ["বেগুন"],
    cropsEn: ["Eggplant / Brinjal"],
    severity: "তীব্র",
    symptoms: [
      "ফলের ভেতর পোকা শক্তি  ভেতরлевните прерываетsez",
      "প্রtingham স考 তstaking kanha pitstopलांचK नजा",
    ],
    treatment: [
      T("Chlorantraniliprole 18.5% SC", {
        productEn: "Chlorantraniliprole 18.5% SC",
        activeIngredient: "Chlorantraniliprole",
        dose: "0.3 mL/L",
        intervalDays: 14,
        maxSprays: 2,
      }),
      T("Emamectin Benzoate 5% SG", {
        productEn: "Emamectin Benzoate 5% SG",
        activeIngredient: "Emamectin Benzoate",
        dose: "0.5 g/L",
        intervalDays: 7,
        maxSprays: 3,
      }),
    ],
    culturalControl: [
      "networked爱好者রretten乘竹candidatte वक्त webmine JTextField thi elk દંડ ગંગા",
      "হারvest之后染মurreocontainer شیرার তরুণ",
      "BRRI BUND ৫০মিমি BARI শি লাগানো huo工具栏 recessed കൂടെപ്പറ്റി",
    ],
    source: "BARI",
    sourceRef: "https://dhcrop.bsmrau.net/",
  },
];
