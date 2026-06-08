import { readdirSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const FOLDER_MAP = {
  disease: { type: "disease", label: "রোগ" },
  deficiency: { type: "deficiency", label: "পুষ্টি ঘাটতি" },
  pest: { type: "pest", label: "পোকামাকড়" },
};

const entries = [];

for (const [folder, meta] of Object.entries(FOLDER_MAP)) {
  const dir = join(root, "public", folder);
  let files;
  try {
    files = readdirSync(dir).filter((f) => f.endsWith(".png"));
  } catch {
    continue;
  }
  for (const file of files) {
    const parsed = parseFilename(file);
    entries.push({
      src: `/${folder}/${file}`,
      page: parsed.page,
      imageNum: parsed.imageNum,
      crop: parsed.crop || null,
      type: meta.type,
      typeLabel: meta.label,
      condition: parsed.condition || null,
      keywords: buildKeywords(parsed),
    });
  }
}

function parseFilename(name) {
  const base = name.replace(/\.png$/, "");
  const parts = base.split("_");
  // Diagnostic-Field-Guide_pg{page}_image_{n}_{...}_{xref}_{hash}
  let page = null;
  let imageNum = null;
  let crop = null;
  let condition = null;
  let xref = null;
  let hash = null;

  // Extract the last two parts: {xref}_{hash}
  if (parts.length >= 2) {
    hash = parts[parts.length - 1];
    xref = parts[parts.length - 2];
  }

  // Find pg{number}
  for (const p of parts) {
    if (p.startsWith("pg") && !isNaN(Number(p.slice(2)))) {
      page = Number(p.slice(2));
      break;
    }
  }

  // Find image_{number}
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === "image" && i + 1 < parts.length && !isNaN(Number(parts[i + 1]))) {
      imageNum = Number(parts[i + 1]);
      break;
    }
  }

  // Extract crop and condition from middle parts
  const knownPre = ["Diagnostic-Field-Guide"];
  const knownPrefix = new Set([
    "Diagnostic", "Field", "Guide", "pg", "image", xref, hash,
  ]);

  const middle = [];
  let pgFound = false;
  let imgFound = false;

  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p.startsWith("pg")) { pgFound = true; continue; }
    if (p === "image") { imgFound = true; continue; }
    if (imgFound && !isNaN(Number(p))) continue;
    if (p === xref || p === hash) continue;
    if (knownPrefix.has(p)) continue;
    middle.push(p);
  }

  // middle now contains e.g. ["disease", "leaf", "spot"] or ["potato", "disease", "leaf", "spot"]
  // or ["deficiency"] or ["pest"] etc.

  // Find crop candidates
  const CROPS = [
    "rice", "paddy", "potato", "tomato", "pepper", "brinjal", "eggplant",
    "mustard", "banana", "mango", "wheat", "maize", "corn", "jute",
    "bean", "tobacco", "lettuce", "citrus", "blueberry", "sugarcane",
  ];

  const CROP_MAP = {
    rice: "ধান", paddy: "ধান", potato: "আলু", tomato: "টমেটো",
    pepper: "মরিচ", brinjal: "বেগুন", eggplant: "বেগুন",
    mustard: "সরিষা", banana: "কলা", mango: "আম",
    wheat: "গম", maize: "ভুট্টা", corn: "ভুট্টা", jute: "পাট",
    bean: "শিম", tobacco: "তামাক", lettuce: "লেটুস",
    citrus: "সাইট্রাস", blueberry: "ব্লুবেরি", sugarcane: "আখ",
  };

  const typePOS = middle.findIndex((w) =>
    ["disease", "deficiency", "pest"].includes(w)
  );

  if (typePOS > 0) {
    // Crop is before type
    const cropWord = middle[typePOS - 1].toLowerCase();
    if (CROPS.includes(cropWord)) {
      crop = CROP_MAP[cropWord] || cropWord;
      condition = middle.slice(typePOS + 1)
        .filter((w) => w !== xref && !w.startsWith("xref"))
        .join(" ");
    } else {
      condition = middle.slice(typePOS + 1)
        .filter((w) => w !== xref && !w.startsWith("xref"))
        .join(" ");
    }
  } else {
    // No clear crop before type
    const typeIdx = middle.findIndex((w) =>
      ["deficiency"].includes(w)
    );
    if (typeIdx >= 0) {
      // Try crop before deficiency
      if (typeIdx > 0) {
        const cropWord = middle[typeIdx - 1].toLowerCase();
        if (CROPS.includes(cropWord)) {
          crop = CROP_MAP[cropWord] || cropWord;
          condition = middle.slice(typeIdx + 1)
            .filter((w) => w !== xref && !w.startsWith("xref"))
            .join(" ");
        } else {
          condition = middle.slice(typeIdx + 1)
            .filter((w) => w !== xref && !w.startsWith("xref"))
            .join(" ");
        }
      } else {
        condition = middle.slice(typeIdx + 1)
          .filter((w) => w !== xref && !w.startsWith("xref"))
          .join(" ");
      }
    }
  }

  return { page, imageNum, crop, condition, xref, hash };
}

function buildKeywords(parsed) {
  const kws = [];
  if (parsed.condition) {
    kws.push(...parsed.condition.toLowerCase().split(/[\s_]+/));
  }
  if (parsed.crop) {
    kws.push(parsed.crop);
    // English crop names
    const rev = Object.fromEntries(
      Object.entries({
        "ধান": "rice", "পাট": "jute", "আলু": "potato", "টমেটো": "tomato",
        "বেগুন": "brinjal", "মরিচ": "pepper", "সরিষা": "mustard",
        "কলা": "banana", "আম": "mango", "গম": "wheat", "ভুট্টা": "maize",
        "শিম": "bean", "তামাক": "tobacco", "লেটুস": "lettuce",
        "সাইট্রাস": "citrus", "ব্লুবেরি": "blueberry", "আখ": "sugarcane",
      }).map(([k, v]) => [v, k])
    );
    if (rev[parsed.crop]) kws.push(rev[parsed.crop]);
  }
  return [...new Set(kws)];
}

// Generate output
const output = {
  version: 1,
  total: entries.length,
  images: entries,
};

mkdirSync(join(root, "public", "images"), { recursive: true });
writeFileSync(
  join(root, "public", "images", "diagnosis-index.json"),
  JSON.stringify(output, null, 2)
);

console.log(`Generated index with ${entries.length} entries`);
console.log(`  disease: ${entries.filter((e) => e.type === "disease").length}`);
console.log(`  deficiency: ${entries.filter((e) => e.type === "deficiency").length}`);
console.log(`  pest: ${entries.filter((e) => e.type === "pest").length}`);

// Write a summary to verify
const withCrop = entries.filter((e) => e.crop);
console.log(`  with crop: ${withCrop.length}`);
console.log(`  without crop: ${entries.length - withCrop.length}`);
