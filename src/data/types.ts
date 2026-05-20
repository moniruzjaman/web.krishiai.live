// ─────────────────────────────────────────────────────────────────────────────
// src/data/types.ts
// Shared TypeScript interfaces for all agriculture datasets.
// Sources: BRRI Rice Profile System, BARI Catalog, DAE Extension Manual,
//          SRDI AEZ data, DAM Market Information System.
// ─────────────────────────────────────────────────────────────────────────────

/** Growing season in Bangladesh */
export type Season = "boro" | "aman" | "aus" | "rabi" | "kharif-1" | "kharif-2" | "year-round";

/** Rice type classification */
export type RiceType =
  | "aman" | "boro" | "aus"
  | "t-aman" | "deep-water"
  | "boro-aus" | "boro-aman"
  | "hybrid" | "specialty";

/** Rice grain shape / appearance */
export type GrainShape = "long-slender" | "medium-slender" | "medium-bold" | "short-bold" | "long-bold";

/** Grain quality rating */
export type QualityRating = "excellent" | "good" | "fair" | "poor";

/** Severity level in Bangla */
export type SeverityBn = "স্বল্প" | "মধ্যম" | "তীব্র";

/** Government authority that released a variety or protocol */
export type Authority =
  | "BRRI" | "BARI" | "BINA" | "BSRI" | "BJRI"
  | "DAE"  | "SRDI" | "BARC" | "BADC" | "DAM"
  | "NSB"  | "MOA";

// ── Rice variety (BRRI Rice Profile System: 25+ fields per variety) ───────
export interface BrriVariety {
  id:          string;   // e.g. "BRRI-DHAN-29"
  nameBn:      string;   // e.g. "বাঃ রি ধান ২৯"
  nameEn:      string;   // e.g. "BRRI Dhan 29"
  season:      Season;
  riceType:    RiceType;
  releaseYear: number;
  durationDays: { min: number; max: number };
  plantHeightCm: { min: number; max: number };
  yieldTperHa: { min: number; max: number };
  grainShape:  GrainShape;
  appearance:  QualityRating;
  proteinPct:  number;
  amylosePct:  number;
  thousandGrainWeightG: number;
  /** Short human-readable salient features */
  features:    string[];
  /** DAE recommended districts / agro-ecological zones */
  recommendedZones: string[];
  /** Genes or traits for stress tolerance */
  stressTolerance: string[];
  /** Major diseases this variety resists */
  diseaseResistance: string[];
  /** Major insect pests this variety resists */
  insectResistance:  string[];
  /** Source PDF from BRRI Knowledge Bank */
  sourcePdf?:  string;
  sourceUrl:   string;   // BRRI Knowledge Bank or Rice Profile System
}

// ── Non-rice crop variety (BARI / BINA / BSRI / BADC) ──────────────────────
export interface CropVariety {
  id:             string;  // e.g. "BARI-BEGUN-9"
  nameBn:         string;
  nameEn:         string;
  cropBn:         string;  // parent crop in Bangla
  cropEn:         string;
  institute:      Authority;
  season:         Season;
  releaseYear?:   number;
  yieldTperHa?:   { min: number; max: number };
  durationDays?:  { min: number; max: number };
  features:       string[];
  /** BD districts where recommended */
  recommendedZones: string[];
  sourceUrl:      string;
}

// ── Crop (parent category, maps to varieties) ───────────────────────────────
export interface Crop {
  id:          string;
  nameBn:      string;
  nameEn:      string;
  icon:        string;
  seasons:     Season[];
  institutes:  Authority[];    // which institutes research this crop
  /** Key diseases to look for */
  diseaseIds:  string[];
  /** BD AEZ zones where grown */
  aezZones:    string[];
}

// ── Disease / pest info ─────────────────────────────────────────────────────
export interface Disease {
  id:           string;        // snake_case e.g. "rice_blast"
  nameBn:       string;
  nameEn:       string;
  nameSci?:     string;        // scientific / Latin name
  cropsBn:      string[];      // Bangla crop names it affects
  cropsEn:      string[];      // English crop names
  severity:     SeverityBn;
  /** Symptoms in Bangla */
  symptoms:     string[];
  /** Environmental conditions that favour the disease */
  favourableConditions?: string[];
  /** Chemical treatment — fungicide/insecticide name, dose, interval */
  treatment:    TreatmentEntry[];
  /** Cultural / non-chemical control */
  culturalControl: string[];
  /** Source authority */
  source:       Authority;
  sourceRef?:   string;        // URL or DAE booklet reference
}

// ── Treatment entry ─────────────────────────────────────────────────────────
export interface TreatmentEntry {
  productBn:   string;
  productEn?:  string;
  activeIngredient?: string;
  dose:        string;          // e.g. "0.6g/L" or "2ml/L"
  intervalDays: number;        // e.g. 7
  maxSprays:   number;         // e.g. 3
  timing?:     string;         // e.g. "সন্ধ্যা বা ভোরে" (evening or dawn)
  notes?:      string;
}

// ── Fertilizer / bio-input ──────────────────────────────────────────────────
export interface Fertilizer {
  id:           string;
  nameBn:       string;
  nameEn:       string;
  type:         "chemical" | "organic" | "bio-input" | "micronutrient";
  /** NPK ratio, e.g. "46-0-0" for urea */
  npk?:         string;
  /** Dose string, e.g. "৫৫-৬০ কেজি/বিঘা" */
  doseBn:       string;
  /** Application instructions */
  application:  string;
  /** Crops it is relevant for */
  forCrops:     string[];
  source:       Authority;
  sourceRef?:   string;
}

// ── AEZ (Agro-Ecological Zone) ───────────────────────────────────────────────
export interface AezZone {
  id:         string;        // e.g. "AEZ-1"
  nameBn:     string;
  nameEn:     string;
  districts:  string[];      // BD districts in this zone
  soilType:   string;
  majorCrops: string[];
  /** Optimal soil pH range */
  phRange:    { min: number; max: number };
  /** Annual rainfall mm */
  rainfallMm: { min: number; max: number };
  source:     Authority;
}

// ── Soil pH correction ───────────────────────────────────────────────────────
export interface PhAction {
  range:    string;           // e.g. "< 5.5"
  labelBn:  string;           // e.g. "অম্লীয়"
  color:    string;           // hex for UI badge
  actionBn: string;           // corrective action in Bangla
  actionEn: string;
  dosePerHa?: string;         // e.g. "2–3 টন/হেক্টর"
  source:   Authority;
}

// ── Organic / bio-input ─────────────────────────────────────────────────────
export interface BioInput {
  id:        string;
  nameBn:    string;
  nameEn:    string;
  doseHa:    string;           // e.g. "2.5 kg/হেক্টর"
  benefitBn: string;
  benefitEn: string;
  forCrops:  string[];
  source:    Authority;
}

// ── Market price entry (DAM) ─────────────────────────────────────────────────
export interface MarketPrice {
  cropBn:     string;
  cropEn:     string;
  unit:       string;         // e.g. "৳/kg" or "৳/মণ"
  priceMin:   number;
  priceMax:   number;
  trend:      "up" | "down" | "flat";
  date:       string;         // ISO e.g. "2025-06-01"
  market:     string;         // e.g. "ঢাকা রাজস্ব বাজার"
  sourceUrl?: string;
}

// ── BD government institution ────────────────────────────────────────────────
export interface Institution {
  nameBn:   string;
  nameEn:   string;
  type:     Authority;
  address:  string;
  lat?:     number;
  lng?:     number;
  hotline?: string;
  website:  string;
}

// ── News item ───────────────────────────────────────────────────────────────
export interface AgriNews {
  id:          string;
  titleBn:     string;
  titleEn?:    string;
  sourceBn:    string;
  date:        string;          // ISO date
  url:         string;
  summary?:    string;
  category:    "research" | "policy" | "weather" | "market" | "advisory";
}

// ── DAE district / upazila extension unit ────────────────────────────────────
export interface DaeUnit {
  district:    string;
  upazila?:    string;
  type:        "district" | "upazila";
  officerName?: string;
  phone?:      string;
  email?:      string;
  address:     string;
}

// ── Metadata for all datasets ───────────────────────────────────────────────
export interface DatasetMeta {
  key:         string;
  label:       string;
  description: string;
  source:      Authority;
  sourceUrl:   string;
  lastUpdated: string;        // ISO date
  recordCount: number;
  updateFrequency: "weekly" | "monthly" | "quarterly" | "yearly" | "as-released";
}

// ── Chemical pesticide / fertilizer entry ────────────────────────────────────
export interface Chemical {
  id:            string;
  nameBn:        string;
  nameEn:        string;
  type:          "insecticide" | "fungicide" | "herbicide" | "fertilizer" | "bio-input" | "micronutrient" | "organic";
  activeIngredientBn: string;
  activeIngredientEn: string;
  crops:         string[];     // Bangla crop names
  cropIds:       string[];     // CROPS[] id strings
  dosage:        string;       // Bengali dose string
  dosageEn:      string;       // English dose string
  intervalDays:  number;
  maxApplications: number;
  timing:        string;       // when to spray
  ppe:           string[];     // safety equipment
  safetyNotes:   string;
  priceRangeBdt: string;
  manufacturers: string[];
  source:        Authority;
}

// ── Simple crop reference entry (for crops.ts CROPS array) ───────────────────
export interface Crops {
  id:    string;   // snake_case, e.g. "rice"
  nameBn: string;  // Bangla name
  nameEn: string;  // English name
}
