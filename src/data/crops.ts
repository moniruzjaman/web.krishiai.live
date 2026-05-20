// ─────────────────────────────────────────────────────────────────────────────
// src/data/crops.ts
// Reference crop list — snake_case crop IDs referenced by chemicals.ts
// Sources: DAE crop calendar, BARI / BRRI variety catalogs.
// ─────────────────────────────────────────────────────────────────────────────
import type { Crops, Authority, Season } from "./types";

/** Master crop index — id values are referenced by chemicals.ts cropIds */
export const CROPS: Crops[] = [
  { id: "rice",        nameBn: "\u09a7\u09be\u09a8",                       nameEn: "Rice" },
  { id: "wheat",       nameBn: "\u0997\u09ae",                              nameEn: "Wheat" },
  { id: "maize",       nameBn: "\u09ad\u09c1\u099f\u09cd\u099f\u09be",      nameEn: "Maize" },
  { id: "potato",      nameBn: "\u09be\u09b2\u09c1",                        nameEn: "Potato" },
  { id: "brinjal",     nameBn: "\u09ac\u09c7\u0997\u09c1\u09a8",          nameEn: "Eggplant" },
  { id: "tomato",      nameBn: "\u099f\u09ae\u09c7\u099f\u09cb",         nameEn: "Tomato" },
  { id: "onion",       nameBn: "\u09aa\u09c7\u09af\u09be\u099c",        nameEn: "Onion" },
  { id: "garlic",      nameBn: "\u09b0\u09b8\u09c1\u09a8",            nameEn: "Garlic" },
  { id: "ginger",      nameBn: "\u09be\u09a6\u09be",                      nameEn: "Ginger" },
  { id: "jute",        nameBn: "\u09aa\u09be\u099f",                      nameEn: "Jute" },
  { id: "mustard",     nameBn: "\u09b6\u09b8\u09cd\u09af",              nameEn: "Mustard" },
  { id: "chickpea",    nameBn: "\u099a\u09a8\u09be\u09ac\u09b2",     nameEn: "Chickpea" },
  { id: "lentil",      nameBn: "\u09ae\u09b8\u09c1\u09b0",              nameEn: "Lentil" },
  { id: "mungbean",    nameBn: "\u09ae\u09a8\u09cd\u0997",              nameEn: "Mung Bean" },
  { id: "groundnut",   nameBn: "\u099a\u09bf\u09a8\u09be\u09ac\u09be\u09a6\u09be\u09ae", nameEn: "Groundnut" },
  { id: "blackgram",   nameBn: "\u0995\u09be\u09b2\u099a\u09be\u09a3\u09dc", nameEn: "Black Gram" },
  { id: "cabbage",     nameBn: "\u09ac\u09be\u09a7\u09be\u0995\u09aa\u09bf",   nameEn: "Cabbage" },
  { id: "cauliflower", nameBn: "\u09ab\u09c1\u09b2\u0995\u09cb\u09aa\u09bf",   nameEn: "Cauliflower" },
  { id: "okra",        nameBn: "\u09a7\u09cd\u09af\u09bc\u09c7\u09b0",       nameEn: "Okra / Ladyfinger" },
  { id: "chilli",      nameBn: "\u09ae\u09b0\u09bf\u099a\u09be",         nameEn: "Chilli" },
  { id: "cucumber",    nameBn: "\u09b6\u09b8\u09be",                      nameEn: "Cucumber" },
  { id: "watermelon",  nameBn: "\u09a4\u09be\u09b0\u09ae\u09c1\u099c",  nameEn: "Watermelon" },
  { id: "mango",       nameBn: "\u09be\u09ae",                            nameEn: "Mango" },
  { id: "banana",      nameBn: "\u0995\u09b2\u09be",                     nameEn: "Banana" },
  { id: "papaya",      nameBn: "\u09aa\u09c7\u09a8\u09cd\u09af\u09bc\u09c7", nameEn: "Papaya" },
  { id: "sugarcane",   nameBn: "\u0986\u0996",                           nameEn: "Sugarcane" },
  { id: "soybean",     nameBn: "\u09b8\u09af\u09be\u09ac\u09bf\u09a8",  nameEn: "Soybean" },
  { id: "sesame",      nameBn: "\u09a4\u09bf\u09b2",                    nameEn: "Sesame" },
  { id: "linseed",     nameBn: "\u09a4\u09bf\u09b8\u09c0",               nameEn: "Linseed" },
];

/** Quick lookup: Bangla → English */
export const CROP_BN_TO_EN: Record<string, string> = Object.fromEntries(
  CROPS.map(c => [c.nameBn, c.nameEn])
) as Record<string, string>;

/** Quick lookup: English → Bangla */
export const CROP_EN_TO_BN: Record<string, string> = Object.fromEntries(
  CROPS.map(c => [c.nameEn, c.nameBn])
) as Record<string, string>;

