export interface DiagnosisImageEntry {
  src: string;
  page: number | null;
  imageNum: number | null;
  crop: string | null;
  type: "disease" | "deficiency" | "pest";
  typeLabel: string;
  condition: string | null;
  keywords: string[];
}

interface DiagnosisIndex {
  version: number;
  total: number;
  images: DiagnosisImageEntry[];
}

const CROP_SYNONYMS: Record<string, string[]> = {
  "আলু": ["potato", "aloo"],
  "টমেটো": ["tomato"],
  "গম": ["wheat"],
  "ভুট্টা": ["maize", "corn"],
  "ধান": ["rice", "paddy"],
  "পাট": ["jute"],
  "বেগুন": ["brinjal", "eggplant"],
  "সরিষা": ["mustard"],
  "কলা": ["banana"],
  "আম": ["mango"],
  "মরিচ": ["pepper", "chilli"],
  "শিম": ["bean"],
  "তামাক": ["tobacco"],
  "লেটুস": ["lettuce"],
  "সাইট্রাস": ["citrus"],
  "ব্লুবেরি": ["blueberry"],
  "আখ": ["sugarcane"],
};

function getCropKeywords(crop: string): string[] {
  const kws = [crop.toLowerCase()];
  const syns = CROP_SYNONYMS[crop];
  if (syns) kws.push(...syns);
  return kws;
}

async function loadIndex(): Promise<DiagnosisIndex> {
  const res = await fetch("/images/diagnosis-index.json");
  return res.json();
}

let cachedIndex: DiagnosisIndex | null = null;

export async function getIndex(): Promise<DiagnosisIndex> {
  if (cachedIndex) return cachedIndex;
  cachedIndex = await loadIndex();
  return cachedIndex;
}

export async function getImagesForDisease(
  crop: string | null,
  diseaseName: string
): Promise<DiagnosisImageEntry[]> {
  const idx = await getIndex();
  const cropKws = crop ? getCropKeywords(crop) : [];
  const diseaseKws = diseaseName
    .toLowerCase()
    .replace(/[()]/g, "")
    .split(/[\s_]+/);

  return idx.images.filter((img) => {
    if (img.type !== "disease") return false;

    const kwMatch = (kwList: string[]) =>
      kwList.some((kw) => diseaseKws.includes(kw));

    if (cropKws.length > 0 && img.crop) {
      const cropMatch = cropKws.some((kw) =>
        img.crop!.toLowerCase().includes(kw) || kw.includes(img.crop!.toLowerCase())
      );
      if (!cropMatch) return false;
    }

    return kwMatch(img.keywords);
  });
}

export async function getImagesByType(
  type: "disease" | "deficiency" | "pest"
): Promise<DiagnosisImageEntry[]> {
  const idx = await getIndex();
  return idx.images.filter((img) => img.type === type);
}

export async function getRandomImages(count: number): Promise<DiagnosisImageEntry[]> {
  const idx = await getIndex();
  const shuffled = [...idx.images].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export async function getAllImages(): Promise<DiagnosisImageEntry[]> {
  const idx = await getIndex();
  return idx.images;
}

export function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    disease: "রোগ",
    deficiency: "পুষ্টি ঘাটতি",
    pest: "পোকামাকড়",
  };
  return labels[type] || type;
}
