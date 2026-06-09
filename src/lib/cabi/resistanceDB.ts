/**
 * FRAC/IRAC Resistance Management Database for Bangladesh
 *
 * Provides fungicide (FRAC) and insecticide (IRAC) group classifications,
 * resistance risk levels, and rotation recommendations based on
 * CABI Plantwise resistance management guidelines.
 *
 * Used by:
 *   - /api/diagnose — for chemical recommendations with resistance awareness
 *   - /tools/pesticide — for IRAC/FRAC rotation checker
 */

// ═══════════════════════════════════════════════════════════════════════════════
// FRAC — Fungicide Resistance Action Committee Groups
// ═══════════════════════════════════════════════════════════════════════════════

export interface FRACGroup {
  code: string;
  name: string;
  modeOfAction: string;
  resistanceRisk: 'low' | 'medium' | 'high';
  bangladeshAvailable: boolean;
  commonProducts: string[];
  targetDiseases: string[];
  maxConsecutiveSprays: number;
  phiDays: number; // Pre-harvest interval
  notes: string;
}

export const FRAC_GROUPS: FRACGroup[] = [
  {
    code: 'M1',
    name: 'Mancozeb',
    modeOfAction: 'Multi-site contact',
    resistanceRisk: 'low',
    bangladeshAvailable: true,
    commonProducts: ['ডাইথেন এম-৪৫', 'ইন্ডোফিল এম-৪৫'],
    targetDiseases: ['Late Blight', 'Early Blight', 'Brown Spot', 'Alternaria Blight'],
    maxConsecutiveSprays: 0, // No limit — multi-site
    phiDays: 7,
    notes: 'Multi-site — low resistance risk. Good tank-mix partner. Safe for rotation.',
  },
  {
    code: 'M3',
    name: 'Chlorothalonil',
    modeOfAction: 'Multi-site contact',
    resistanceRisk: 'low',
    bangladeshAvailable: true,
    commonProducts: ['ব্রাভো', 'ক্লোরোকন'],
    targetDiseases: ['Early Blight', 'Anthracnose', 'Leaf Spots'],
    maxConsecutiveSprays: 0,
    phiDays: 7,
    notes: 'Multi-site — excellent resistance management tool. Do not mix with oil.',
  },
  {
    code: '1',
    name: 'Methyl Benzimidazole Carbamates (MBC)',
    modeOfAction: 'Beta-tubulin assembly (mitosis)',
    resistanceRisk: 'high',
    bangladeshAvailable: true,
    commonProducts: ['কার্বেন্ডাজিম (ব্যাভিস্টিন)', 'থাইরাম+কার্বেন্ডাজিম'],
    targetDiseases: ['Sheath Blight', 'Fruit Rot', 'Stem Rot', 'Anthracnose'],
    maxConsecutiveSprays: 2,
    phiDays: 14,
    notes: 'HIGH resistance risk. Never use consecutively >2 times. Rotate with different FRAC group.',
  },
  {
    code: '3',
    name: 'DMIs — Triazoles',
    modeOfAction: 'Sterol 14α-demethylation (CYP51)',
    resistanceRisk: 'medium',
    bangladeshAvailable: true,
    commonProducts: ['প্রোপিকোনাজোল (টিল্ট)', 'হেক্সাকোনাজোল (কন্ট্রোল)', 'টেবুকোনাজোল (ফলিকুর)', 'ডাইফেনোকোনাজোল (স্কোর)'],
    targetDiseases: ['Rice Blast', 'Sheath Blight', 'Rust', 'Anthracnose', 'Sigatoka'],
    maxConsecutiveSprays: 2,
    phiDays: 14,
    notes: 'Medium resistance risk. Cross-resistance within DMI group. Rotate with non-DMI.',
  },
  {
    code: '4',
    name: 'Phenylamides',
    modeOfAction: 'RNA polymerase I',
    resistanceRisk: 'high',
    bangladeshAvailable: true,
    commonProducts: ['মেটালাক্সিল (রিডোমিল গোল্ড)', 'মেফেনোক্সাম'],
    targetDiseases: ['Late Blight (Phytophthora)', 'Downy Mildew', 'White Rust'],
    maxConsecutiveSprays: 1,
    phiDays: 14,
    notes: 'HIGH resistance risk. ALWAYS mix with multi-site (Mancozeb). Max 1 consecutive spray.',
  },
  {
    code: '11',
    name: 'QoI — Strobilurins',
    modeOfAction: 'Cytochrome bc1 (Complex III)',
    resistanceRisk: 'high',
    bangladeshAvailable: true,
    commonProducts: ['অ্যাজোক্সিস্ট্রবিন (অ্যামিস্টার)', 'ট্রাইফ্লোক্সিস্ট্রবিন (ফ্লিন্ট)'],
    targetDiseases: ['Rice Blast', 'Sheath Blight', 'Anthracnose', 'Leaf Spots'],
    maxConsecutiveSprays: 2,
    phiDays: 14,
    notes: 'HIGH resistance risk. Must tank-mix with multi-site. Never >2 consecutive sprays.',
  },
  {
    code: '19',
    name: 'Polyoxins',
    modeOfAction: 'Chitin synthase',
    resistanceRisk: 'medium',
    bangladeshAvailable: true,
    commonProducts: ['পলিঅক্সিন-বি (পলিহ্যাম)'],
    targetDiseases: ['Sheath Blight', 'Rice Blast'],
    maxConsecutiveSprays: 2,
    phiDays: 14,
    notes: 'Moderate resistance risk. Good rotation partner with triazoles.',
  },
  {
    code: '29',
    name: 'Melanin Biosynthesis (Dehydratase)',
    modeOfAction: '1,3,8-Trihydroxynaphthalene reductase',
    resistanceRisk: 'low',
    bangladeshAvailable: true,
    commonProducts: ['ট্রাইসাইক্লাজোল (ব্রিকোল, ট্রুপার)', 'আইসোপ্রোথিয়োলেন (ফুজিওয়ান)'],
    targetDiseases: ['Rice Blast', 'Neck Blast'],
    maxConsecutiveSprays: 2,
    phiDays: 14,
    notes: 'Low resistance risk. Specific to blast only. Best applied preventively.',
  },
  {
    code: 'U6',
    name: 'Validamycin',
    modeOfAction: 'Trehalase (insect/microbial)',
    resistanceRisk: 'low',
    bangladeshAvailable: true,
    commonProducts: ['ভ্যালিডামাইসিন (ভ্যালিডাসিন)'],
    targetDiseases: ['Sheath Blight'],
    maxConsecutiveSprays: 2,
    phiDays: 14,
    notes: 'Low resistance risk. Specific to Rhizoctonia. Good rotation with triazoles.',
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// IRAC — Insecticide Resistance Action Committee Groups
// ═══════════════════════════════════════════════════════════════════════════════

export interface IRACGroup {
  code: string;
  name: string;
  modeOfAction: string;
  resistanceRisk: 'low' | 'medium' | 'high';
  bangladeshAvailable: boolean;
  commonProducts: string[];
  targetPests: string[];
  maxConsecutiveSprays: number;
  phiDays: number;
  notes: string;
}

export const IRAC_GROUPS: IRACGroup[] = [
  {
    code: '1A',
    name: 'Carbamates',
    modeOfAction: 'Acetylcholinesterase (AChE) inhibitors',
    resistanceRisk: 'high',
    bangladeshAvailable: true,
    commonProducts: ['কার্বারিল (সেভিন)'],
    targetPests: ['Stem Borer', 'Fruit Borer', 'Leaf Folder'],
    maxConsecutiveSprays: 2,
    phiDays: 7,
    notes: 'HIGH resistance risk. Rotate with different IRAC group.',
  },
  {
    code: '1B',
    name: 'Organophosphates',
    modeOfAction: 'Acetylcholinesterase (AChE) inhibitors',
    resistanceRisk: 'high',
    bangladeshAvailable: true,
    commonProducts: ['ক্লোরপাইরিফস (ডারসব্যান)', 'ডায়াজিনন', 'ফেনিট্রোথিয়ন'],
    targetPests: ['Stem Borer', 'Gall Midge', 'Rice Hispa'],
    maxConsecutiveSprays: 1,
    phiDays: 14,
    notes: 'HIGH resistance risk. Cross-resistance with 1A. Rotate with non-OP/carbamate.',
  },
  {
    code: '3A',
    name: 'Pyrethroids',
    modeOfAction: 'Sodium channel modulators',
    resistanceRisk: 'high',
    bangladeshAvailable: true,
    commonProducts: ['সাইপারমেথ্রিন (রিপকর্ড)', 'ডেলটামেথ্রিন (ডেসিস)', 'ল্যাম্বডা-সাইহ্যালোথ্রিন (কর্নেট)'],
    targetPests: ['Stem Borer', 'Leaf Folder', 'Fruit Borer', 'Whitefly'],
    maxConsecutiveSprays: 2,
    phiDays: 7,
    notes: 'HIGH resistance risk. Very common in Bangladesh — overuse is a problem. Rotate with 4A or 5.',
  },
  {
    code: '4A',
    name: 'Neonicotinoids',
    modeOfAction: 'Nicotinic acetylcholine receptor (nAChR) agonists',
    resistanceRisk: 'medium',
    bangladeshAvailable: true,
    commonProducts: ['ইমিডাক্লোপ্রিড (অ্যাডমায়ার)', 'থায়ামেথক্সাম (অ্যাক্টারা)', 'অ্যাসিটামিপ্রিড'],
    targetPests: ['Brown Planthopper', 'Whitefly', 'Aphid', 'Leafhopper'],
    maxConsecutiveSprays: 2,
    phiDays: 14,
    notes: 'Medium resistance risk. Avoid during flowering (bee toxicity). Rotate with 9B or 16.',
  },
  {
    code: '5',
    name: 'Spinosyns',
    modeOfAction: 'Nicotinic acetylcholine receptor (nAChR) allosteric modulators',
    resistanceRisk: 'low',
    bangladeshAvailable: true,
    commonProducts: ['স্পাইনোসাড (ট্রেসার)', 'স্পাইনেটোরাম (ডেলিগেট)'],
    targetPests: ['Fruit Borer', 'Thrips', 'Leaf Miner'],
    maxConsecutiveSprays: 2,
    phiDays: 3,
    notes: 'Low resistance risk. Good rotation partner. Safe for beneficials when used correctly.',
  },
  {
    code: '6',
    name: 'Avermectins',
    modeOfAction: 'Glutamate-gated chloride channel (GluCl) allosteric modulators',
    resistanceRisk: 'low',
    bangladeshAvailable: true,
    commonProducts: ['অ্যাবামেক্টিন (ভার্টিমেক)', 'এমামেক্টিন বেনজোয়েট (প্রোক্লেম)'],
    targetPests: ['Mites', 'Leaf Miner', 'Fruit Borer', 'Diamondback Moth'],
    maxConsecutiveSprays: 2,
    phiDays: 7,
    notes: 'Low resistance risk. Excellent for mite control. UV-sensitive — apply evening.',
  },
  {
    code: '9B',
    name: 'Pymetrozine',
    modeOfAction: 'Selective homopteran feeding blockers',
    resistanceRisk: 'low',
    bangladeshAvailable: true,
    commonProducts: ['পাইমেট্রোজিন (ফুলফিল)'],
    targetPests: ['Brown Planthopper', 'Whitefly', 'Aphid'],
    maxConsecutiveSprays: 2,
    phiDays: 14,
    notes: 'Low resistance risk. Specific to sucking pests. No effect on beneficials.',
  },
  {
    code: '13',
    name: 'Chlorfenapyr',
    modeOfAction: 'Oxidative phosphorylation uncouplers',
    resistanceRisk: 'low',
    bangladeshAvailable: true,
    commonProducts: ['ক্লোরফেনাপাইর (ইন্ট্রোন)'],
    targetPests: ['Mites', 'Thrips', 'Whitefly', 'Armyworm'],
    maxConsecutiveSprays: 2,
    phiDays: 7,
    notes: 'Low resistance risk. Pro-insecticide — activated by P450. Good for resistant populations.',
  },
  {
    code: '16',
    name: 'Flonicamid',
    modeOfAction: 'Chordotonal organ TRPV channel modulators',
    resistanceRisk: 'low',
    bangladeshAvailable: false,
    commonProducts: ['ফ্লোনিকামিড (টেপপা)'],
    targetPests: ['Aphid', 'Whitefly', 'Planthopper'],
    maxConsecutiveSprays: 2,
    phiDays: 7,
    notes: 'Low resistance risk. Not widely available in BD yet. Good future option.',
  },
  {
    code: '28',
    name: 'Diamides',
    modeOfAction: 'Ryanodine receptor modulators',
    resistanceRisk: 'low',
    bangladeshAvailable: true,
    commonProducts: ['ক্লোরানট্রানিলিপ্রোল (করেজেন)', 'ফ্লুবেন্ডিয়ামাইড (টাকুমা)'],
    targetPests: ['Stem Borer', 'Leaf Folder', 'Fruit Borer', 'Pod Borer'],
    maxConsecutiveSprays: 2,
    phiDays: 14,
    notes: 'Low resistance risk. Excellent for Lepidoptera. Long residual activity. Avoid overuse.',
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// Plantwise RED LIST — NEVER Recommend
// ═══════════════════════════════════════════════════════════════════════════════

export const PLANTWISE_RED_LIST = [
  { name: 'Monocrotophos', cas: '6923-22-4', reason: 'Highly toxic — WHO Class Ib', banned: true },
  { name: 'Carbofuran', cas: '1563-66-2', reason: 'Extremely toxic to birds, WHO Class Ib', banned: true },
  { name: 'Endosulfan', cas: '115-29-7', reason: 'Persistent organic pollutant — Stockholm Convention', banned: true },
  { name: 'Methyl Parathion', cas: '298-00-4', reason: 'Extremely toxic — WHO Class Ia', banned: true },
  { name: 'Phosphamidon', cas: '13171-21-6', reason: 'Highly toxic — WHO Class Ia', banned: true },
  { name: 'Dicofol', cas: '115-32-2', reason: 'DDT analogue — POP contamination risk', banned: false },
  { name: 'Aldicarb', cas: '116-06-3', reason: 'Extremely toxic — WHO Class Ia', banned: true },
  { name: 'Paraquat', cas: '4685-14-7', reason: 'No antidote — fatal if ingested', banned: false },
];

// ═══════════════════════════════════════════════════════════════════════════════
// Rotation Recommendations
// ═══════════════════════════════════════════════════════════════════════════════

export interface RotationAdvice {
  currentGroup: string;
  nextGroups: string[];
  avoidGroups: string[];
  reason: string;
}

/**
 * Get FRAC rotation advice for a given FRAC group code.
 * Returns recommended next groups and groups to avoid.
 */
export function getFRACRotation(currentFRACCode: string): RotationAdvice {
  const current = FRAC_GROUPS.find(g => g.code === currentFRACCode);

  if (!current) {
    return {
      currentGroup: currentFRACCode,
      nextGroups: ['M1', 'M3'], // Default to multi-site
      avoidGroups: [],
      reason: 'ফ্র্যাক গ্রুপ পাওয়া যায়নি — মাল্টি-সাইট ব্যবহার করুন',
    };
  }

  // Find groups with different MoA
  const differentMoA = FRAC_GROUPS.filter(g =>
    g.code !== current.code && g.modeOfAction !== current.modeOfAction
  );

  // Prioritize low-risk groups
  const nextGroups = differentMoA
    .sort((a, b) => {
      const riskOrder = { low: 0, medium: 1, high: 2 };
      return riskOrder[a.resistanceRisk] - riskOrder[b.resistanceRisk];
    })
    .slice(0, 3)
    .map(g => g.code);

  // Avoid same MoA and high-risk groups
  const avoidGroups = FRAC_GROUPS
    .filter(g => g.modeOfAction === current.modeOfAction && g.code !== current.code)
    .map(g => g.code);

  return {
    currentGroup: current.code,
    nextGroups,
    avoidGroups,
    reason: current.resistanceRisk === 'high'
      ? `উচ্চ প্রতিরোধ ঝুঁকি — পরপর ${current.maxConsecutiveSprays} বারের বেশি ব্যবহার করবেন না`
      : current.resistanceRisk === 'medium'
        ? `মাঝারি প্রতিরোধ ঝুঁকি — ভিন্ন MoA গ্রুপে রোটেশন করুন`
        : `কম প্রতিরোধ ঝুঁকি — তবে রোটেশন সুপারিশকৃত`,
  };
}

/**
 * Get IRAC rotation advice for a given IRAC group code.
 */
export function getIRACRotation(currentIRACCode: string): RotationAdvice {
  const current = IRAC_GROUPS.find(g => g.code === currentIRACCode);

  if (!current) {
    return {
      currentGroup: currentIRACCode,
      nextGroups: ['5', '28'], // Default to low-risk
      avoidGroups: [],
      reason: 'আইআরএসি গ্রুপ পাওয়া যায়নি — কম ঝুঁকির গ্রুপ ব্যবহার করুন',
    };
  }

  const differentMoA = IRAC_GROUPS.filter(g =>
    g.code !== current.code && g.modeOfAction !== current.modeOfAction
  );

  const nextGroups = differentMoA
    .sort((a, b) => {
      const riskOrder = { low: 0, medium: 1, high: 2 };
      return riskOrder[a.resistanceRisk] - riskOrder[b.resistanceRisk];
    })
    .filter(g => g.bangladeshAvailable)
    .slice(0, 3)
    .map(g => g.code);

  const avoidGroups = IRAC_GROUPS
    .filter(g => g.modeOfAction === current.modeOfAction && g.code !== current.code)
    .map(g => g.code);

  return {
    currentGroup: current.code,
    nextGroups,
    avoidGroups,
    reason: current.resistanceRisk === 'high'
      ? `উচ্চ প্রতিরোধ ঝুঁকি — পরপর ${current.maxConsecutiveSprays} বারের বেশি ব্যবহার করবেন না`
      : current.resistanceRisk === 'medium'
        ? `মাঝারি প্রতিরোধ ঝুঁকি — ভিন্ন MoA গ্রুপে রোটেশন করুন`
        : `কম প্রতিরোধ ঝুঁকি — তবে রোটেশন সুপারিশকৃত`,
  };
}

/**
 * Check if a pesticide is on the Plantwise Red List.
 */
export function isRedListed(pesticideName: string): boolean {
  const lower = pesticideName.toLowerCase();
  return PLANTWISE_RED_LIST.some(item =>
    item.name.toLowerCase() === lower || lower.includes(item.name.toLowerCase())
  );
}

/**
 * Get all available FRAC groups in Bangladesh for a given disease.
 */
export function getFRACOptionsForDisease(diseaseName: string): FRACGroup[] {
  return FRAC_GROUPS.filter(g =>
    g.bangladeshAvailable &&
    g.targetDiseases.some(d => diseaseName.toLowerCase().includes(d.toLowerCase()))
  );
}

/**
 * Get all available IRAC groups in Bangladesh for a given pest.
 */
export function getIRACOptionsForPest(pestName: string): IRACGroup[] {
  return IRAC_GROUPS.filter(g =>
    g.bangladeshAvailable &&
    g.targetPests.some(p => pestName.toLowerCase().includes(p.toLowerCase()))
  );
}
