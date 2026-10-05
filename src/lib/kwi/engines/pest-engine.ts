import type {
  PestForecast,
  PestRiskAssessment,
  PestInfo,
  WeatherData,
  ActiveCrop,
  RiskLevel,
  GrowthStageId,
} from '@/lib/kwi/types';

const PESTS: PestInfo[] = [
  {
    id: 'brown_planthopper',
    name: 'Brown Planthopper',
    nameBn: 'বাদামী গাছ ফড়িং',
    cropIds: ['rice'],
    affectedStages: ['tillering', 'stem_elongation', 'booting', 'heading', 'flowering'],
    minNightTempC: 24,
    maxFavorableRainMm: 5,
    symptoms: [
      'Yellowing and browning of lower leaves ("hopper burn")',
      'Circular patches of dead, dried-out plants',
      'Sticky honeydew on leaves leading to sooty mold',
      'Stunted growth, reduced tillering',
    ],
    symptomsBn: [
      'নিচের পাতা হলুদ থেকে বাদামী হয়ে যাওয়া ("হপার বার্ন")',
      'গোলাকার আকারে গাছ শুকিয়ে মরে যাওয়া',
      'পাতায় আঠালো মধু নিঃসরণ ও কালো ছত্রাক জন্মানো',
      'গাছের বৃদ্ধি ব্যাহত হওয়া, কুশি কম হওয়া',
    ],
    preventiveActions: [
      'Use resistant varieties (BRRI dhan62, dhan75)',
      'Avoid excess nitrogen — it increases hopper susceptibility',
      'Maintain wider plant spacing for airflow',
      'Conserve natural predators (spiders, mirid bugs) — avoid broad-spectrum insecticide',
    ],
    preventiveActionsBn: [
      'প্রতিরোধী জাত ব্যবহার করুন (ব্রিধান ৬২, ৭৫)',
      'অতিরিক্ত নাইট্রোজেন পরিহার করুন — এতে ফড়িং আক্রমণ বাড়ে',
      'বাতাস চলাচলের জন্য পর্যাপ্ত দূরত্বে চারা রোপণ করুন',
      'প্রাকৃতিক শত্রু (মাকড়সা, মিরিড বাগ) সংরক্ষণ করুন — বিস্তৃত-বর্ণালী কীটনাশক এড়িয়ে চলুন',
    ],
    curativeActions: [
      'Apply Imidacloprid or Buprofezin at base of plant, targeting hopper zone',
      'Drain field temporarily if infestation is severe (hoppers dislike dry base)',
      'Spot-treat affected patches rather than blanket spraying',
    ],
    curativeActionsBn: [
      'গাছের গোড়ায় ইমিডাক্লোপ্রিড বা বুপ্রোফেজিন প্রয়োগ করুন',
      'আক্রমণ গুরুতর হলে সাময়িকভাবে জমি শুকিয়ে ফেলুন (ফড়িং শুকনো গোড়া অপছন্দ করে)',
      'পুরো জমিতে না ছিটিয়ে শুধু আক্রান্ত অংশে স্প্রে করুন',
    ],
    economicThreshold: '1-2 hoppers per hill at tillering, or 5-10 per hill at booting/heading',
  },
  {
    id: 'yellow_stemborer',
    name: 'Yellow Stem Borer',
    nameBn: 'ধানের হলুদ গাছপোকা',
    cropIds: ['rice'],
    affectedStages: ['tillering', 'stem_elongation', 'booting', 'heading'],
    minNightTempC: 22,
    maxFavorableRainMm: 20,
    symptoms: [
      'Dead hearts at tillering (central shoot dries)',
      'White heads at heading (empty panicles)',
      'Larval exit holes at stem base',
      'Tillers pull out easily with a rotten smell',
    ],
    symptomsBn: [
      'কুশি পর্যায়ে মাঝের কান্ড শুকিয়ে যাওয়া (ডেড হার্ট)',
      'শীষ বের হওয়ার সময় সাদা শীষ (চিটা)',
      'কাণ্ডের গোড়ায় পোকার ছিদ্র',
      'কুশি সহজে উঠে আসে ও পচা গন্ধ হয়',
    ],
    preventiveActions: [
      'Clip seedling tips before transplanting to remove eggs',
      'Use pheromone traps (5-8/ha) from tillering',
      'Avoid staggered planting in the same area',
      'Conserve egg parasitoids (Trichogramma japonicum)',
    ],
    preventiveActionsBn: [
      'রোপণের আগে চারার অগ্রভাগ কেটে ডিম সরিয়ে ফেলুন',
      'কুশি পর্যায় থেকে ফেরোমন ফাঁদ (৫-৮/হেক্টর) ব্যবহার করুন',
      'একই এলাকায় ধাপে ধাপে রোপণ এড়িয়ে চলুন',
      'ডিম পরজীবী (ট্রাইকোগ্রামা) সংরক্ষণ করুন',
    ],
    curativeActions: [
      'Apply Chlorantraniliprole (IRAC 28) at dead-heart appearance',
      'Follow with Cartap or Fipronil if ETL persists — rotate MoA',
      'Rogue white heads and destroy infested tillers',
    ],
    curativeActionsBn: [
      'ডেড হার্ট দেখা দিলে ক্লোরানট্রানিলিপ্রোল (IRAC ২৮) প্রয়োগ করুন',
      'ETL থাকলে কারটাপ বা ফিপ্রোনিল দিন — MoA পরিবর্তন করুন',
      'সাদা শীষ ও আক্রান্ত কুশি তুলে ধ্বংস করুন',
    ],
    economicThreshold: '10% dead hearts at tillering or 5% white heads at heading',
  },
  {
    id: 'rice_leaf_folder',
    name: 'Rice Leaf Folder',
    nameBn: 'ধানের পাতা মোড়ানো পোকা',
    cropIds: ['rice'],
    affectedStages: ['tillering', 'stem_elongation', 'booting'],
    minNightTempC: 23,
    maxFavorableRainMm: 12,
    symptoms: [
      'Leaves folded lengthwise and stitched with silk',
      'Transparent feeding scars inside folded leaves',
      'Reduced photosynthetic area and delayed heading',
    ],
    symptomsBn: [
      'পাতা লম্বালম্বি মোড়ানো ও রেশম দিয়ে সেলাই করা',
      'মোড়ানো পাতার ভিতরে স্বচ্ছ খাদ্য ক্ষত',
      'সালোকসংশ্লেষণ কমে শীষ বের হতে দেরি',
    ],
    preventiveActions: [
      'Avoid excess nitrogen which produces succulent leaves',
      'Release Trichogramma chilonis at 50,000/ha weekly',
      'Keep field bunds weed-free — alternate hosts',
    ],
    preventiveActionsBn: [
      'অতিরিক্ত নাইট্রোজেন এড়িয়ে চলুন — নরম পাতা পোকার পছন্দ',
      'সাপ্তাহিক ৫০,০০০/হেক্টর ট্রাইকোগ্রামা ছেড়ে দিন',
      'আইল আগাছামুক্ত রাখুন — বিকল্প পোষক কমান',
    ],
    curativeActions: [
      'Spray Chlorantraniliprole or Spinosad at early instar',
      'Hand-crush folded leaves in small plots',
    ],
    curativeActionsBn: [
      'ছোট পোকা অবস্থায় ক্লোরানট্রানিলিপ্রোল বা স্পিনোসাড স্প্রে করুন',
      'ছোট জমিতে মোড়ানো পাতা হাতে চেপে মারুন',
    ],
    economicThreshold: '1-2 freshly folded leaves per hill',
  },
  {
    id: 'rice_hispa',
    name: 'Rice Hispa',
    nameBn: 'ধানের হিসপা',
    cropIds: ['rice'],
    affectedStages: ['seedling', 'vegetative', 'tillering'],
    minNightTempC: 24,
    maxFavorableRainMm: 15,
    symptoms: [
      'White scraping streaks on leaf surface',
      'Grubs mine inside leaves causing blotches',
      'Leaves turn white and dry in severe attack',
    ],
    symptomsBn: [
      'পাতায় সাদা আঁচড়ের দাগ',
      'শুককীট পাতার ভিতরে সুড়ঙ্গ করে দাগ তৈরি করে',
      'তীব্র আক্রমণে পাতা সাদা হয়ে শুকিয়ে যায়',
    ],
    preventiveActions: [
      'Clip and destroy leaf tips of heavily infested seedlings',
      'Avoid close planting in shady, humid pockets',
      'Keep nursery well drained',
    ],
    preventiveActionsBn: [
      'আক্রান্ত চারার পাতার ডগা কেটে ধ্বংস করুন',
      'ছায়াযুক্ত আর্দ্র স্থানে ঘন রোপণ এড়িয়ে চলুন',
      'বীজতলা ভালোভাবে নিকাশ রাখুন',
    ],
    curativeActions: [
      'Apply Lambda-cyhalothrin or Chlorpyrifos if >2 adults/hill',
      'Rotate to IRAC 4A (Imidacloprid) next spray',
    ],
    curativeActionsBn: [
      'প্রতি গোছায় ২টির বেশি পোকা থাকলে ল্যাম্বডা-সাইহ্যালোথ্রিন বা ক্লোরপাইরিফস দিন',
      'পরবর্তী স্প্রেতে IRAC ৪A (ইমিডাক্লোপ্রিড) এ পরিবর্তন করুন',
    ],
    economicThreshold: '2 adults per hill or 25% damaged leaves',
  },
  {
    id: 'green_leafhopper',
    name: 'Green Leafhopper',
    nameBn: 'সবুজ পাতাফড়িং',
    cropIds: ['rice'],
    affectedStages: ['seedling', 'vegetative', 'tillering', 'stem_elongation'],
    minNightTempC: 25,
    maxFavorableRainMm: 8,
    symptoms: [
      'Yellowing of leaf tips and hopper burn patches',
      'Tungro virus transmission (stunting, orange leaves)',
      'Honeydew and sooty mold on lower canopy',
    ],
    symptomsBn: [
      'পাতার ডগা হলুদ ও হপার বার্ন দাগ',
      'টুংরো ভাইরাস ছড়ানো (বামন গাছ, কমলা পাতা)',
      'নিচের পাতায় মধু নিঃসরণ ও কালো ছত্রাক',
    ],
    preventiveActions: [
      'Plant tungro-resistant varieties (BR11, BR10)',
      'Remove ratoon and volunteer rice around field',
      'Use yellow sticky traps at field borders',
    ],
    preventiveActionsBn: [
      'টুংরো-প্রতিরোধী জাত লাগান (বিআর-১১, বিআর-১০)',
      'জমির আশেপাশের র্যাটুন ও স্বেচ্ছাসেবী ধান সরান',
      'জমির কিনারায় হলুদ আঠালো ফাঁদ ব্যবহার করুন',
    ],
    curativeActions: [
      'Apply Pymetrozine (IRAC 9B) or Imidacloprid if vector pressure is high',
      'Rogue tungro-infected hills immediately',
    ],
    curativeActionsBn: [
      'বাহক চাপ বেশি হলে পাইমেট্রোজিন (IRAC ৯B) বা ইমিডাক্লোপ্রিড দিন',
      'টুংরো আক্রান্ত গোছা তৎক্ষণাৎ তুলে ফেলুন',
    ],
    economicThreshold: '5-10 hoppers per hill at vegetative stage',
  },
  {
    id: 'wheat_aphid',
    name: 'Wheat Aphid',
    nameBn: 'গমের জাব পোকা',
    cropIds: ['wheat'],
    affectedStages: ['vegetative', 'stem_elongation', 'heading', 'flowering', 'grain_filling'],
    minNightTempC: 16,
    maxFavorableRainMm: 4,
    symptoms: [
      'Colonies on ear heads and flag leaf',
      'Sticky honeydew and sooty mold',
      'Shriveled grains and reduced tillering',
    ],
    symptomsBn: [
      'শীষ ও পতাকা পাতায় উপনিবেশ',
      'আঠালো মধু নিঃসরণ ও কালো ছত্রাক',
      'চিটা দানা ও কুশি কমে যাওয়া',
    ],
    preventiveActions: [
      'Avoid late sowing which extends the vulnerable window',
      'Conserve ladybirds and syrphid flies — delay first spray',
      'Balanced nitrogen; excess N increases aphid numbers',
    ],
    preventiveActionsBn: [
      'দেরিতে বপন এড়িয়ে চলুন — সংবেদনশীল সময় বাড়ে',
      'লেডিবার্ড ও সিরফিড মাছি সংরক্ষণ করুন — প্রথম স্প্রে দেরি করুন',
      'সুষম নাইট্রোজেন দিন; অতিরিক্ত এন-এ জাব বাড়ে',
    ],
    curativeActions: [
      'Spray Imidacloprid 17.8 SL @ 0.3 ml/L if >10 aphids/tiller',
      'Alternate with Thiamethoxam — do not repeat 4A consecutively',
    ],
    curativeActionsBn: [
      'প্রতি কালিতে ১০টির বেশি জাব থাকলে ইমিডাক্লোপ্রিড ০.৩ মিলি/লি স্প্রে করুন',
      'থায়ামেথোক্সাম দিয়ে পরিবর্তন করুন — ৪A পরপর ব্যবহার করবেন না',
    ],
    economicThreshold: '10 aphids per tiller at heading / grain filling',
  },
  {
    id: 'jute_semilooper',
    name: 'Jute Semilooper',
    nameBn: 'পাটের সেমিলুপার',
    cropIds: ['jute'],
    affectedStages: ['vegetative', 'stem_elongation'],
    minNightTempC: 24,
    maxFavorableRainMm: 18,
    symptoms: [
      'Leaves skeletonized from the margin',
      'Larvae loop while walking on the stem',
      'Severe defoliation reduces fiber yield',
    ],
    symptomsBn: [
      'পাতার কিনারা থেকে কঙ্কালসার হয়ে যাওয়া',
      'শুককীট কাণ্ডে হাঁটার সময় লুপ করে',
      'তীব্র পাতা খেয়ে তন্তু ফলন কমে',
    ],
    preventiveActions: [
      'Light traps at dusk to catch moths',
      'Hand-pick larvae in small plots at first flush',
      'Avoid continuous jute on the same land',
    ],
    preventiveActionsBn: [
      'সন্ধ্যায় আলোর ফাঁদ দিয়ে মথ ধরুন',
      'প্রথম ঢেউয়ে ছোট জমিতে শুককীট হাতে তুলুন',
      'একই জমিতে টানা পাট চাষ এড়িয়ে চলুন',
    ],
    curativeActions: [
      'Apply Spinosad (IRAC 5) or Chlorantraniliprole at early instar',
      'Rotate to a pyrethroid (IRAC 3) only if ETL persists',
    ],
    curativeActionsBn: [
      'ছোট পোকা অবস্থায় স্পিনোসাড (IRAC ৫) বা ক্লোরানট্রানিলিপ্রোল দিন',
      'ETL থাকলেই কেবল পাইরেথ্রয়েড (IRAC ৩) এ পরিবর্তন করুন',
    ],
    economicThreshold: '1 larva per plant at vegetative stage',
  },
  {
    id: 'jute_stem_weevil',
    name: 'Jute Stem Weevil',
    nameBn: 'পাটের কাণ্ড উইভিল',
    cropIds: ['jute'],
    affectedStages: ['seedling', 'vegetative', 'stem_elongation'],
    minNightTempC: 26,
    maxFavorableRainMm: 10,
    symptoms: [
      'Wilting of apical shoot ("dead top")',
      'Gall-like swelling on stem with larval tunnel',
      'Fiber breakage at infested nodes',
    ],
    symptomsBn: [
      'অগ্রভাগ শুকিয়ে যাওয়া ("ডেড টপ")',
      'কাণ্ডে গল ও শুককীটের সুড়ঙ্গ',
      'আক্রান্ত গ্রন্থিতে তন্তু ভেঙে যাওয়া',
    ],
    preventiveActions: [
      'Early sowing to escape peak weevil period',
      'Remove and burn infested tops weekly',
      'Keep field free of wild Corchorus hosts',
    ],
    preventiveActionsBn: [
      'উইভিলের চূড়া এড়াতে তাড়াতাড়ি বপন করুন',
      'সাপ্তাহিক আক্রান্ত ডগা কেটে পোড়ান',
      'বন্য পাটজাতীয় পোষক আগাছা পরিষ্কার রাখুন',
    ],
    curativeActions: [
      'Spot-apply Imidacloprid drench at seedling if >5% dead tops',
      'Foliar Cypermethrin at vegetative if damage continues',
    ],
    curativeActionsBn: [
      '৫% এর বেশি ডেড টপ হলে চারায় ইমিডাক্লোপ্রিড ড্রেঞ্চ দিন',
      'ক্ষতি চললে অবচয়ী পর্যায়ে সাইপারমেথ্রিন স্প্রে করুন',
    ],
    economicThreshold: '5% plants with dead tops at seedling / early vegetative',
  },
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getRiskLevel(score: number): RiskLevel {
  if (score >= 70) return 'very_high';
  if (score >= 45) return 'high';
  if (score >= 20) return 'moderate';
  return 'low';
}

function scoreNightTemp(tempMin: number, pest: PestInfo): number {
  if (tempMin < pest.minNightTempC) return 0;
  const excess = tempMin - pest.minNightTempC;
  return Math.round(clamp(30 + excess * 4, 30, 50));
}

function scoreDrySpell(rainMm: number, pest: PestInfo): number {
  if (pest.maxFavorableRainMm <= 0) return 0;
  if (rainMm > pest.maxFavorableRainMm) return 0;
  const dryness = 1 - rainMm / pest.maxFavorableRainMm;
  return Math.round(clamp(40 * dryness, 0, 40));
}

function scoreCropStage(currentStage: GrowthStageId, pest: PestInfo): number {
  if (!pest.affectedStages.includes(currentStage)) return 0;
  const stageOrder: GrowthStageId[] = ['tillering', 'stem_elongation', 'booting', 'heading', 'flowering'];
  const idx = stageOrder.indexOf(currentStage);
  if (idx < 0) return 4;
  return Math.round(clamp(4 + idx * 1.5, 0, 10));
}

export function generatePestForecast(
  weather: WeatherData,
  activeCrops: ActiveCrop[],
): PestForecast {
  const activeCropIds = new Set(activeCrops.map((c) => c.cropId));
  const relevantPests = PESTS.filter((p) => p.cropIds.some((cid) => activeCropIds.has(cid)));

  const todayMin = weather.daily[0]?.tempMin ?? weather.current.temperature;
  const todayRain = weather.daily[0]?.precipitationSum ?? weather.current.precipitation;

  const assessments: PestRiskAssessment[] = relevantPests.map((pest) => {
    const matchingCrops = activeCrops.filter((c) => pest.cropIds.includes(c.cropId));

    let maxRisk = 0;
    const contributing: string[] = [];

    for (const crop of matchingCrops) {
      const tempScore = scoreNightTemp(todayMin, pest);
      const drySpellScore = scoreDrySpell(todayRain, pest);
      const stageScore = scoreCropStage(crop.currentStage, pest);
      const risk = tempScore + drySpellScore + stageScore;

      if (risk > maxRisk) {
        maxRisk = risk;
        contributing.length = 0;
        if (tempScore > 20) contributing.push(`Warm night temp (${todayMin}°C) favors ${pest.name}`);
        if (drySpellScore > 15) contributing.push(`Dry conditions (${todayRain}mm rain) favor outbreak`);
        if (stageScore > 5) contributing.push(`Current crop stage (${crop.currentStage}) is vulnerable`);
      }
    }

    return {
      pest,
      risk: maxRisk,
      level: getRiskLevel(maxRisk),
      confidence: 72,
      contributingFactors: contributing,
      preventiveActions: pest.preventiveActions,
      curativeActions: pest.curativeActions,
    };
  });

  assessments.sort((a, b) => b.risk - a.risk);

  const overallFavorability =
    assessments.length > 0
      ? Math.round(assessments.reduce((sum, a) => sum + a.risk, 0) / assessments.length)
      : 0;

  return {
    pests: assessments,
    overallFavorability,
    spreadRisk: getRiskLevel(overallFavorability),
    confidence: 72,
  };
}
