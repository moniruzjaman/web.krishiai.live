"use client";

/**
 * AEZ Soil Analyzer — Comprehensive Soil Analysis Tool
 *
 * Tab 1: AEZ Explorer — Searchable list of 30 Bangladesh AEZ zones with AI analysis
 * Tab 2: Soil Calculator — Sand/Silt/Clay sliders with SVG donut chart & USDA classification
 * Tab 3: Fertilizer Calculator — SRDI-based fertilizer recommendations
 * Tab 4: BARC 2024 — BARC Fertilizer Advisory with crop-specific recommendations
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { Suspense } from "react";
import { useLocation } from "@/context/LocationContext";
import ReactMarkdown from "react-markdown";
import ErrorBoundary from "@/components/ErrorBoundary";
import LoadingSkeleton from "@/components/LoadingSkeleton";

// ── AEZ Zones Data ────────────────────────────────────────────────────────────
const BANGLADESH_AEZS = [
  { id: 1, name: "Old Himalayan Piedmont Plain", bn: "পুরাতন হিমালয় পাদদেশীয় সমভূমি", region: "রংপুর" },
  { id: 2, name: "Active Tista Floodplain", bn: "সক্রিয় তিস্তা বন্যার সমভূমি", region: "রংপুর/কুড়িগ্রাম" },
  { id: 3, name: "Tista Meander Floodplain", bn: "তিস্তা আঁকাবাঁকা বন্যার সমভূমি", region: "রংপুর/নীলফামারী" },
  { id: 4, name: "Karatoya-Bangali Floodplain", bn: "করতোয়া-বঙ্গলী বন্যার সমভূমি", region: "বগুড়া/গাইবান্ধা" },
  { id: 5, name: "Lower Atrai Basin", bn: "নিম্ন আত্রাই অববাহিকা", region: "নাটোর/রাজশাহী" },
  { id: 6, name: "Lower Purnabhaba Floodplain", bn: "নিম্ন পুর্ণভবা বন্যার সমভূমি", region: "দিনাজপুর" },
  { id: 7, name: "Active Brahmaputra-Jamuna Floodplain", bn: "সক্রিয় ব্রহ্মপুত্র-যমুনা বন্যার সমভূমি", region: "জামালপুর/শেরপুর" },
  { id: 8, name: "Young Brahmaputra and Jamuna Floodplain", bn: "নবীন ব্রহ্মপুত্র ও যমুনা বন্যার সমভূমি", region: "টাঙ্গাইল/ময়মনসিংহ" },
  { id: 9, name: "Old Brahmaputra Floodplain", bn: "পুরাতন ব্রহ্মপুত্র বন্যার সমভূমি", region: "কিশোরগঞ্জ/নরসিংদী" },
  { id: 10, name: "Active Ganges Floodplain", bn: "সক্রিয় গঙ্গা বন্যার সমভূমি", region: "রাজশাহী/পাবনা" },
  { id: 11, name: "High Ganges River Floodplain", bn: "উচ্চ গঙ্গা নদী বন্যার সমভূমি", region: "চাঁপাইনবাবগঞ্জ/রাজশাহী" },
  { id: 12, name: "Low Ganges River Floodplain", bn: "নিম্ন গঙ্গা নদী বন্যার সমভূমি", region: "কুষ্টিয়া/ঝিনাইদহ" },
  { id: 13, name: "Ganges Tidal Floodplain", bn: "গঙ্গা জোয়ার-ভাটার সমভূমি", region: "খুলনা/সাতক্ষীরা" },
  { id: 14, name: "Gopalganj-Khulna Bils", bn: "গোপালগঞ্জ-খুলনা বিল", region: "গোপালগঞ্জ/বাগেরহাট" },
  { id: 15, name: "Arial Bil", bn: "আড়িয়াল বিল", region: "মুন্সীগঞ্জ/মাদারীপুর" },
  { id: 16, name: "Middle Meghna River Floodplain", bn: "মধ্য মেঘনা নদী বন্যার সমভূমি", region: "কিশোরগঞ্জ/ব্রাহ্মণবাড়িয়া" },
  { id: 17, name: "Lower Meghna River Floodplain", bn: "নিম্ন মেঘনা নদী বন্যার সমভূমি", region: "চাঁদপুর/লক্ষ্মীপুর" },
  { id: 18, name: "Young Meghna Estuarine Floodplain", bn: "নবীন মেঘনা মোহনা বন্যার সমভূমি", region: "নোয়াখালী/ফেনী" },
  { id: 19, name: "Old Meghna Estuarine Floodplain", bn: "পুরাতন মেঘনা মোহনা বন্যার সমভূমি", region: "ভোলা/বরিশাল" },
  { id: 20, name: "Eastern Surma-Kusiyara Floodplain", bn: "পূর্ব সুরমা-কুশিয়ারা বন্যার সমভূমি", region: "সিলেট/মৌলভীবাজার" },
  { id: 21, name: "Sylhet Basin", bn: "সিলেট অববাহিকা", region: "সিলেট/সুনামগঞ্জ" },
  { id: 22, name: "Northern and Eastern Piedmont Plains", bn: "উত্তর ও পূর্ব পাদদেশীয় সমভূমি", region: "ময়মনসিংহ/নেত্রকোণা" },
  { id: 23, name: "Chittagong Coastal Plain", bn: "চট্টগ্রাম উপকূলীয় সমভূমি", region: "চট্টগ্রাম/কক্সবাজার" },
  { id: 24, name: "St. Martin's Coral Island", bn: "সেন্টমার্টিন প্রবাল দ্বীপ", region: "কক্সবাজার" },
  { id: 25, name: "Level Barind Tract", bn: "সমতল বরেন্দ্র ভূমি", region: "রাজশাহী/নওগাঁ" },
  { id: 26, name: "High Barind Tract", bn: "উচ্চ বরেন্দ্র ভূমি", region: "চাঁপাইনবাবগঞ্জ/নওগাঁ" },
  { id: 27, name: "North-eastern Barind Tract", bn: "উত্তর-পূর্ব বরেন্দ্র ভূমি", region: "দিনাজপুর/ঠাকুরগাঁও" },
  { id: 28, name: "Madhupur Tract", bn: "মধুপুর ভূমি", region: "গাজীপুর/টাঙ্গাইল" },
  { id: 29, name: "Northern and Eastern Hills", bn: "উত্তর ও পূর্ব পাহাড়ি এলাকা", region: "রাঙ্গামাটি/খাগড়াছড়ি" },
  { id: 30, name: "Akhaura Terrace", bn: "আখাউড়া টেরেস", region: "ব্রাহ্মণবাড়িয়া" },
];

// ── Soil Types (Bangladesh specific) ────────────────────────────────────────
const SOIL_TYPES = [
  { id: "clay", name: "পলি মাটি", en: "Clay Soil", ph: "6.0–7.5", desc: "ভারী, জল ধারণ ক্ষমতা বেশি", color: "#92400e", icon: "🟤", crops: ["ধান", "পাট", "আখ"], drainLevel: "low" },
  { id: "sandy", name: "বেলে মাটি", en: "Sandy Soil", ph: "5.5–6.5", desc: "হালকা, জল নিষ্কাশন দ্রুত", color: "#d97706", icon: "🟡", crops: ["আলু", "মরিচ", "তরমুজ"], drainLevel: "high" },
  { id: "loam", name: "দোআঁশ মাটি", en: "Loamy Soil", ph: "6.0–7.0", desc: "সবচেয়ে উর্বর, সব ফসলের জন্য আদর্শ", color: "#166534", icon: "🟢", crops: ["ধান", "গম", "সবজি", "ফল"], drainLevel: "medium" },
  { id: "silt", name: "পলিত মাটি", en: "Silty Soil", ph: "6.0–7.0", desc: "মাঝারি উর্বরতা, নদী অববাহিকায় পাওয়া যায়", color: "#0e7490", icon: "🔵", crops: ["ধান", "সরিষা", "ডাল"], drainLevel: "medium" },
  { id: "peat", name: "পিট মাটি", en: "Peat Soil", ph: "4.5–5.5", desc: "জৈব পদার্থ সমৃদ্ধ, অম্লীয়", color: "#581c87", icon: "🟣", crops: ["ধান", "পান", "লেবু"], drainLevel: "low" },
  { id: "calcareous", name: "ক্যালকেরিয়াস মাটি", en: "Calcareous Soil", ph: "7.5–8.5", desc: "চুনযুক্ত, উত্তর বাংলাদেশে পাওয়া যায়", color: "#dc2626", icon: "🔴", crops: ["গম", "সরিষা", "ছোলা"], drainLevel: "medium" },
];

// ── Crops with fertilizer requirements (per bigha) ──────────────────────────
const CROPS = [
  { id: "rice_boro", name: "বোরো ধান", icon: "🌾", urea: 75, tsp: 55, mop: 35, gypsum: 18, zinc: 2, season: "রবি" },
  { id: "rice_aus", name: "আউশ ধান", icon: "🌾", urea: 50, tsp: 35, mop: 25, gypsum: 12, zinc: 1.5, season: "খরিফ-১" },
  { id: "rice_aman", name: "আমন ধান", icon: "🌾", urea: 60, tsp: 40, mop: 30, gypsum: 15, zinc: 2, season: "খরিফ-২" },
  { id: "wheat", name: "গম", icon: "🌾", urea: 65, tsp: 60, mop: 40, gypsum: 20, zinc: 1.5, season: "রবি" },
  { id: "potato", name: "আলু", icon: "🥔", urea: 90, tsp: 80, mop: 60, gypsum: 25, zinc: 2, season: "রবি" },
  { id: "mustard", name: "সরিষা", icon: "🌻", urea: 55, tsp: 50, mop: 30, gypsum: 20, zinc: 1, season: "রবি" },
  { id: "tomato", name: "টমেটো", icon: "🍅", urea: 70, tsp: 55, mop: 45, gypsum: 15, zinc: 1.5, season: "রবি" },
  { id: "onion", name: "পেঁয়াজ", icon: "🧅", urea: 65, tsp: 50, mop: 40, gypsum: 18, zinc: 1, season: "রবি" },
  { id: "chili", name: "মরিচ", icon: "🌶️", urea: 55, tsp: 45, mop: 35, gypsum: 15, zinc: 1, season: "খরিফ/রবি" },
  { id: "jute", name: "পাট", icon: "🪢", urea: 45, tsp: 35, mop: 25, gypsum: 12, zinc: 1, season: "খরিফ" },
  { id: "maize", name: "ভুট্টা", icon: "🌽", urea: 85, tsp: 65, mop: 50, gypsum: 20, zinc: 2, season: "খরিফ/রবি" },
  { id: "lentil", name: "ডাল (মসুর)", icon: "🫘", urea: 15, tsp: 40, mop: 20, gypsum: 15, zinc: 1, season: "রবি" },
];

// ── Soil Zones by District ───────────────────────────────────────────────────
const SOIL_ZONES: Record<string, string> = {
  "ঢাকা": "loam", "গাজীপুর": "loam", "নারায়ণগঞ্জ": "silt", "মুন্সীগঞ্জ": "silt",
  "রাজশাহী": "calcareous", "নাটোর": "loam", "পাবনা": "loam", "বগুড়া": "loam",
  "রংপুর": "loam", "দিনাজপুর": "calcareous", "কুড়িগ্রাম": "silt", "লালমনিরহাট": "loam",
  "চট্টগ্রাম": "sandy", "কক্সবাজার": "sandy", "খাগড়াছড়ি": "loam", "রাঙ্গামাটি": "loam",
  "খুলনা": "peat", "যশোর": "loam", "সাতক্ষীরা": "peat", "কুষ্টিয়া": "loam",
  "বরিশাল": "peat", "পটুয়াখালী": "peat", "ভোলা": "silt", "ঝালকাঠি": "peat",
  "সিলেট": "loam", "মৌলভীবাজার": "loam", "হবিগঞ্জ": "loam", "সুনামগঞ্জ": "peat",
  "ময়মনসিংহ": "loam", "জামালপুর": "silt", "শেরপুর": "loam", "নেত্রকোণা": "loam",
  "ফরিদপুর": "silt", "মাদারীপুর": "silt", "গোপালগঞ্জ": "peat", "শরীয়তপুর": "silt",
  "টাঙ্গাইল": "loam", "কিশোরগঞ্জ": "loam", "নরসিংদী": "loam", "ব্রাহ্মণবাড়িয়া": "loam",
  "কুমিল্লা": "loam", "চাঁদপুর": "silt", "ফেনী": "sandy", "নোয়াখালী": "sandy",
  "লক্ষ্মীপুর": "sandy", "বরগুনা": "peat", "পিরোজপুর": "peat", "ঝিনাইদহ": "loam",
  "মাগুরা": "loam", "চুয়াডাঙ্গা": "loam", "মেহেরপুর": "loam", "নারাইল": "loam",
  "চাঁপাইনবাবগঞ্জ": "calcareous", "নওগাঁ": "loam", "জয়পুরহাট": "calcareous",
  "ঠাকুরগাঁও": "loam", "পঞ্চগড়": "loam", "বান্দরবান": "loam",
  "মানিকগঞ্জ": "silt", "রাজবাড়ী": "silt",
};

// ── District → AEZ Zone mapping ────────────────────────────────────────────
const DISTRICT_AEZ: Record<string, string> = {
  "ঢাকা": "AEZ-28 (মধুপুর ভূমি)",
  "গাজীপুর": "AEZ-28 (মধুপুর ভূমি)",
  "নারায়ণগঞ্জ": "AEZ-12 (নিম্ন গঙ্গা নদী বন্যার সমভূমি)",
  "মুন্সীগঞ্জ": "AEZ-15 (আড়িয়াল বিল)",
  "মানিকগঞ্জ": "AEZ-12 (নিম্ন গঙ্গা নদী বন্যার সমভূমি)",
  "ফরিদপুর": "AEZ-12 (নিম্ন গঙ্গা নদী বন্যার সমভূমি)",
  "রাজশাহী": "AEZ-11 (উচ্চ গঙ্গা নদী বন্যার সমভূমি)",
  "নাটোর": "AEZ-5 (নিম্ন আত্রাই অববাহিকা)",
  "পাবনা": "AEZ-10 (সক্রিয় গঙ্গা বন্যার সমভূমি)",
  "বগুড়া": "AEZ-4 (করতোয়া-বঙ্গলী বন্যার সমভূমি)",
  "দিনাজপুর": "AEZ-27 (উত্তর-পূর্ব বরেন্দ্র ভূমি)",
  "রংপুর": "AEZ-3 (তিস্তা আঁকাবাঁকা বন্যার সমভূমি)",
  "কুড়িগ্রাম": "AEZ-2 (সক্রিয় তিস্তা বন্যার সমভূমি)",
  "যশোর": "AEZ-11 (উচ্চ গঙ্গা নদী বন্যার সমভূমি)",
  "খুলনা": "AEZ-13 (গঙ্গা জোয়ার-ভাটার সমভূমি)",
  "চট্টগ্রাম": "AEZ-23 (চট্টগ্রাম উপকূলীয় সমভূমি)",
  "কক্সবাজার": "AEZ-23 (চট্টগ্রাম উপকূলীয় সমভূমি)",
  "সিলেট": "AEZ-20 (পূর্ব সুরমা-কুশিয়ারা বন্যার সমভূমি)",
  "ময়মনসিংহ": "AEZ-8 (নবীন ব্রহ্মপুত্র ও যমুনা বন্যার সমভূমি)",
  "টাঙ্গাইল": "AEZ-8 (নবীন ব্রহ্মপুত্র ও যমুনা বন্যার সমভূমি)",
  "কুমিল্লা": "AEZ-12 (নিম্ন গঙ্গা নদী বন্যার সমভূমি)",
  "বরিশাল": "AEZ-13 (গঙ্গা জোয়ার-ভাটার সমভূমি)",
  "নোয়াখালী": "AEZ-18 (নবীন মেঘনা মোহনা বন্যার সমভূমি)",
  "লক্ষ্মীপুর": "AEZ-17 (নিম্ন মেঘনা নদী বন্যার সমভূমি)",
  "জামালপুর": "AEZ-7 (সক্রিয় ব্রহ্মপুত্র-যমুনা বন্যার সমভূমি)",
  "শেরপুর": "AEZ-7 (সক্রিয় ব্রহ্মপুত্র-যমুনা বন্যার সমভূমি)",
  "কিশোরগঞ্জ": "AEZ-9 (পুরাতন ব্রহ্মপুত্র বন্যার সমভূমি)",
  "নরসিংদী": "AEZ-9 (পুরাতন ব্রহ্মপুত্র বন্যার সমভূমি)",
  "ব্রাহ্মণবাড়িয়া": "AEZ-30 (আখাউড়া টেরেস)",
  "চাঁদপুর": "AEZ-17 (নিম্ন মেঘনা নদী বন্যার সমভূমি)",
  "ফেনী": "AEZ-18 (নবীন মেঘনা মোহনা বন্যার সমভূমি)",
  "সাতক্ষীরা": "AEZ-13 (গঙ্গা জোয়ার-ভাটার সমভূমি)",
  "কুষ্টিয়া": "AEZ-12 (নিম্ন গঙ্গা নদী বন্যার সমভূমি)",
  "ঝিনাইদহ": "AEZ-12 (নিম্ন গঙ্গা নদী বন্যার সমভূমি)",
  "মাগুরা": "AEZ-12 (নিম্ন গঙ্গা নদী বন্যার সমভূমি)",
  "চুয়াডাঙ্গা": "AEZ-11 (উচ্চ গঙ্গা নদী বন্যার সমভূমি)",
  "মেহেরপুর": "AEZ-11 (উচ্চ গঙ্গা নদী বন্যার সমভূমি)",
  "নওগাঁ": "AEZ-25 (সমতল বরেন্দ্র ভূমি)",
  "চাঁপাইনবাবগঞ্জ": "AEZ-26 (উচ্চ বরেন্দ্র ভূমি)",
  "জয়পুরহাট": "AEZ-4 (করতোয়া-বঙ্গলী বন্যার সমভূমি)",
  "ঠাকুরগাঁও": "AEZ-6 (নিম্ন পুর্ণভবা বন্যার সমভূমি)",
  "পঞ্চগড়": "AEZ-1 (পুরাতন হিমালয় পাদদেশীয় সমভূমি)",
  "লালমনিরহাট": "AEZ-3 (তিস্তা আঁকাবাঁকা বন্যার সমভূমি)",
  "নীলফামারী": "AEZ-3 (তিস্তা আঁকাবাঁকা বন্যার সমভূমি)",
  "গাইবান্ধা": "AEZ-4 (করতোয়া-বঙ্গলী বন্যার সমভূমি)",
  "নেত্রকোণা": "AEZ-22 (উত্তর ও পূর্ব পাদদেশীয় সমভূমি)",
  "হবিগঞ্জ": "AEZ-20 (পূর্ব সুরমা-কুশিয়ারা বন্যার সমভূমি)",
  "মৌলভীবাজার": "AEZ-20 (পূর্ব সুরমা-কুশিয়ারা বন্যার সমভূমি)",
  "সুনামগঞ্জ": "AEZ-21 (সিলেট অববাহিকা)",
  "পটুয়াখালী": "AEZ-13 (গঙ্গা জোয়ার-ভাটার সমভূমি)",
  "বরগুনা": "AEZ-13 (গঙ্গা জোয়ার-ভাটার সমভূমি)",
  "ভোলা": "AEZ-19 (পুরাতন মেঘনা মোহনা বন্যার সমভূমি)",
  "ঝালকাঠি": "AEZ-13 (গঙ্গা জোয়ার-ভাটার সমভূমি)",
  "পিরোজপুর": "AEZ-13 (গঙ্গা জোয়ার-ভাটার সমভূমি)",
  "গোপালগঞ্জ": "AEZ-14 (গোপালগঞ্জ-খুলনা বিল)",
  "মাদারীপুর": "AEZ-15 (আড়িয়াল বিল)",
  "শরীয়তপুর": "AEZ-12 (নিম্ন গঙ্গা নদী বন্যার সমভূমি)",
  "রাজবাড়ী": "AEZ-12 (নিম্ন গঙ্গা নদী বন্যার সমভূমি)",
  "নারাইল": "AEZ-12 (নিম্ন গঙ্গা নদী বন্যার সমভূমি)",
  "বাগেরহাট": "AEZ-13 (গঙ্গা জোয়ার-ভাটার সমভূমি)",
  "বান্দরবান": "AEZ-29 (উত্তর ও পূর্ব পাহাড়ি এলাকা)",
  "রাঙ্গামাটি": "AEZ-29 (উত্তর ও পূর্ব পাহাড়ি এলাকা)",
  "খাগড়াছড়ি": "AEZ-29 (উত্তর ও পূর্ব পাহাড়ি এলাকা)",
};

// ── BARC 2024 Fertilizer Advisory ───────────────────────────────────────────
const BARC_2024_ADVISORY = [
  {
    title: "সুষম সার ব্যবস্থাপনা",
    icon: "⚖️",
    desc: "মাটি পরীক্ষার ভিত্তিতে সুষম সার প্রয়োগ নিশ্চিত করুন। অতিরিক্ত সার মাটির স্বাস্থ্য নষ্ট করে ও পরিবেশের ক্ষতি করে।",
    color: "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800",
  },
  {
    title: "IPNS — সমন্বিত উদ্ভিদ পুষ্টি ব্যবস্থাপনা",
    icon: "🔄",
    desc: "জৈব সার + রাসায়নিক সার + জীবাণু সার একত্রে ব্যবহার করুন। গোবর সার ১-২ টন/বিঘা, কম্পোস্ট সার ও জীবাণু সার (রাইজোবিয়াম, এজোস্পাইরিলাম) প্রয়োগ করুন।",
    color: "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800",
  },
  {
    title: "মাটি পরীক্ষা ভিত্তিক সার প্রয়োগ",
    icon: "🧪",
    desc: "প্রতি ২-৩ বছর অন্তর মাটি পরীক্ষা করুন। মাটির pH, জৈব পদার্থ, NPK ও মাইক্রোনিউট্রিয়েন্ট পরীক্ষা করে সারের মাত্রা নির্ধারণ করুন।",
    color: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",
  },
  {
    title: "জিংক ও বোরনের ঘাটতি পূরণ",
    icon: "🔬",
    desc: "বাংলাদেশের মাটিতে জিংক ও বোরনের তীব্র ঘাটতি। জিংক সালফেট ২-৩ কেজি/বিঘা ও বরিক এসিড ১-১.৫ কেজি/বিঘা প্রয়োগ করুন।",
    color: "bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800",
  },
  {
    title: "ইউরিয়া ডিপ প্লেসমেন্ট (UDP)",
    icon: "🕳️",
    desc: "ইউরিয়া সার মাটির গভীরে (৭-১০ সেমি) প্রয়োগ করুন। এতে ইউরিয়ার ব্যবহার ৩০% কম হয় ও ফলন ১৫-২০% বাড়ে। UDP যন্ত্র বা হাতে প্রয়োগ করুন।",
    color: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800",
  },
  {
    title: "সার প্রয়োগের সময় ও পদ্ধতি",
    icon: "⏰",
    desc: "ইউরিয়া ৩ কিস্তায়, টিএসপি জমি তৈরির সময় পুরোটা, এমওপি ২ কিস্তায় প্রয়োগ করুন। সার প্রয়োগের পর সাথে সাথে মাটির সাথে মিশিয়ে দিন।",
    color: "bg-teal-50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-800",
  },
];

// ── BARC 2024 Crop-Specific Recommendations (kg/bigha) ──────────────────────
const BARC_CROP_RECOMMENDATIONS = [
  {
    crop: "বোরো ধান",
    icon: "🌾",
    season: "রবি (নভেম্বর-মে)",
    urea: "৬৫-৭৫", tsp: "৪৫-৫৫", mop: "৩০-৩৫", gypsum: "১৫-১৮", zinc: "২.০",
    boron: "১.০", notes: "ইউরিয়া ৩ কিস্তায় (১/৩ + ১/৩ + ১/৩)। বোরন ঘাটতি এলাকায় বরিক এসিড যোগ করুন। জিংক সালফেট বীজতলায় বা জমি তৈরির সময় দিন।",
  },
  {
    crop: "আউশ ধান",
    icon: "🌾",
    season: "খরিফ-১ (এপ্রিল-জুলাই)",
    urea: "৪০-৫০", tsp: "৩০-৩৫", mop: "২০-২৫", gypsum: "১০-১২", zinc: "১.৫",
    boron: "০.৮", notes: "আউশ ধানে সার কম লাগে। জৈব সার ও জীবাণু সার ব্যবহার করলে রাসায়নিক সার ২০-২৫% কমানো যায়।",
  },
  {
    crop: "আমন ধান",
    icon: "🌾",
    season: "খরিফ-২ (জুলাই-নভেম্বর)",
    urea: "৫০-৬০", tsp: "৩৫-৪০", mop: "২৫-৩০", gypsum: "১২-১৫", zinc: "২.০",
    boron: "১.০", notes: "আমন ধানে ইউরিয়া UDP পদ্ধতিতে দিলে ৩০% সার বাঁচে। পটাশের ঘাটতি এলাকায় এমওপি বাড়ান।",
  },
  {
    crop: "গম",
    icon: "🌾",
    season: "রবি (নভেম্বর-মার্চ)",
    urea: "৫৫-৬৫", tsp: "৫০-৬০", mop: "৩৫-৪০", gypsum: "১৮-২০", zinc: "১.৫",
    boron: "১.০", notes: "ইউরিয়া ২ কিস্তায় (বপন + কুশি পর্যায়)। বোরন সার গমের ফলন উল্লেখযোগ্য বাড়ায়। জমি তৈরির সময় পুরো টিএসপি দিন।",
  },
  {
    crop: "আলু",
    icon: "🥔",
    season: "রবি (নভেম্বর-ফেব্রুয়ারি)",
    urea: "৮০-৯০", tsp: "৭০-৮০", mop: "৫০-৬০", gypsum: "২০-২৫", zinc: "২.০",
    boron: "১.৫", notes: "আলুতে পটাশ ও বোরন অত্যন্ত গুরুত্বপূর্ণ। ইউরিয়া ৩ কিস্তায় দিন। কম্পোস্ট ২-৩ টন/বিঘা ব্যবহার করুন।",
  },
  {
    crop: "সরিষা",
    icon: "🌻",
    season: "রবি (অক্টোবর-ফেব্রুয়ারি)",
    urea: "৪৫-৫৫", tsp: "৪৫-৫০", mop: "২৫-৩০", gypsum: "১৮-২০", zinc: "১.০",
    boron: "১.৫", notes: "সরিষায় বোরন সার অত্যন্ত জরুরি — বরিক এসিড ১-১.৫ কেজি/বিঘা। সালফার ঘাটতিতে জিপসাম বাড়ান। টিএসপি জমি তৈরির সময় দিন।",
  },
  {
    crop: "ভুট্টা",
    icon: "🌽",
    season: "খরিফ/রবি",
    urea: "৭৫-৮৫", tsp: "৫৫-৬৫", mop: "৪০-৫০", gypsum: "১৮-২০", zinc: "২.০",
    boron: "১.০", notes: "ভুট্টায় নাইট্রোজেন বেশি লাগে। ইউরিয়া ৩ কিস্তায় দিন। জিংক ঘাটতি ভুট্টায় সাদা পটু রোগ করে — জিংক সালফেট অবশ্যই দিন।",
  },
  {
    crop: "পাট",
    icon: "🪢",
    season: "খরিফ (এপ্রিল-জুলাই)",
    urea: "৩৫-৪৫", tsp: "৩০-৩৫", mop: "২০-২৫", gypsum: "১০-১২", zinc: "১.০",
    boron: "০.৫", notes: "পাটে অতিরিক্ত ইউরিয়া দিলে গাছ পড়ে যায়। জৈব সার ১-২ টন/বিঘা দিলে মাটির গঠন ভালো হয়।",
  },
  {
    crop: "টমেটো",
    icon: "🍅",
    season: "রবি",
    urea: "৬০-৭০", tsp: "৪৫-৫৫", mop: "৪০-৪৫", gypsum: "১২-১৫", zinc: "১.৫",
    boron: "১.০", notes: "টমেটোতে পটাশ ও বোরন জরুরি। ইউরিয়া ৩ কিস্তায়। ফুল আসার সময় পটাশ বেশি দিন। জৈব সার ব্যবহার করুন।",
  },
  {
    crop: "পেঁয়াজ",
    icon: "🧅",
    season: "রবি",
    urea: "৫৫-৬৫", tsp: "৪৫-৫০", mop: "৩৫-৪০", gypsum: "১৫-১৮", zinc: "১.০",
    boron: "১.০", notes: "পেঁয়াজে সালফার ও বোরন জরুরি। জিপসাম ও বরিক এসিড অবশ্যই দিন। ইউরিয়া ৩ কিস্তায় দিন।",
  },
  {
    crop: "ডাল (মসুর)",
    icon: "🫘",
    season: "রবি (নভেম্বর-ফেব্রুয়ারি)",
    urea: "১০-১৫", tsp: "৩৫-৪০", mop: "১৫-২০", gypsum: "১২-১৫", zinc: "১.০",
    boron: "০.৮", notes: "ডাল ফসলে নাইট্রোজেন কম লাগে কারণ রাইজোবিয়াম জীবাণু বায়ু থেকে নাইট্রোজেন সংগ্রহ করে। রাইজোবিয়াম ইনোকুলাম বীজের সাথে মিশিয়ে বুনুন।",
  },
  {
    crop: "মরিচ",
    icon: "🌶️",
    season: "খরিফ/রবি",
    urea: "৪৫-৫৫", tsp: "৪০-৪৫", mop: "৩০-৩৫", gypsum: "১২-১৫", zinc: "১.০",
    boron: "১.০", notes: "মরিচে বোরন ও ক্যালসিয়াম ঘাটতি ফুলঝরা রোগ করে। জিপসাম ও বরিক এসিড নিশ্চিত করুন।",
  },
];

// ── Fertilizer info ──────────────────────────────────────────────────────────
const FERTILIZER_INFO = [
  { id: "urea", name: "ইউরিয়া", en: "Urea (N 46%)", color: "#2563eb", icon: "🔵", timing: "৩ কিস্তায় প্রয়োগ (রোপণ, কুশি, গুড়া পর্যায়)", method: "পাতায় ছিটিয়ে বা মাটিতে মিশিয়ে" },
  { id: "tsp", name: "টিএসপি", en: "TSP (P₂O₅ 46%)", color: "#dc2626", icon: "🔴", timing: "জমি তৈরির সময় একবারে সম্পূর্ণ মাত্রা", method: "জমিতে ছড়িয়ে চাষ দিয়ে মেশান" },
  { id: "mop", name: "এমওপি", en: "MoP (K₂O 60%)", color: "#16a34a", icon: "🟢", timing: "২ কিস্তায় প্রয়োগ (জমি তৈরি + শীর্ষ পোশাক)", method: "মাটিতে মিশিয়ে দিন" },
  { id: "gypsum", name: "জিপসাম", en: "Gypsum (S 18%)", color: "#ca8a04", icon: "🟡", timing: "জমি তৈরির সময় একবারে", method: "জমিতে ছড়িয়ে মেশান" },
  { id: "zinc", name: "জিংক সালফেট", en: "ZnSO₄ (Zn 21%)", color: "#7c3aed", icon: "🟣", timing: "জমি তৈরি বা বীজতলায়", method: "মাটিতে মিশিয়ে বা পাতায় স্প্রে" },
];

// ── SVG Donut Chart Component ────────────────────────────────────────────────
function SoilDonutChart({ sand, silt, clay }: { sand: number; silt: number; clay: number }) {
  const total = sand + silt + clay;
  if (total === 0) return null;

  const normalizedSand = (sand / total) * 100;
  const normalizedSilt = (silt / total) * 100;
  const normalizedClay = (clay / total) * 100;

  const radius = 58;
  const circumference = 2 * Math.PI * radius;

  const sandOffset = 0;
  const siltOffset = (normalizedSand / 100) * circumference;
  const clayOffset = ((normalizedSand + normalizedSilt) / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="160" height="160" viewBox="0 0 160 160">
        {/* Background circle */}
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="20" className="dark:stroke-gray-700" />
        {/* Sand segment */}
        <circle
          cx="80" cy="80" r={radius}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="20"
          strokeDasharray={`${(normalizedSand / 100) * circumference} ${circumference}`}
          strokeDashoffset={-sandOffset}
          transform="rotate(-90 80 80)"
          strokeLinecap="butt"
          className="transition-all duration-500"
        />
        {/* Silt segment */}
        <circle
          cx="80" cy="80" r={radius}
          fill="none"
          stroke="#06b6d4"
          strokeWidth="20"
          strokeDasharray={`${(normalizedSilt / 100) * circumference} ${circumference}`}
          strokeDashoffset={-siltOffset}
          transform="rotate(-90 80 80)"
          strokeLinecap="butt"
          className="transition-all duration-500"
        />
        {/* Clay segment */}
        <circle
          cx="80" cy="80" r={radius}
          fill="none"
          stroke="#92400e"
          strokeWidth="20"
          strokeDasharray={`${(normalizedClay / 100) * circumference} ${circumference}`}
          strokeDashoffset={-clayOffset}
          transform="rotate(-90 80 80)"
          strokeLinecap="butt"
          className="transition-all duration-500"
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10px] text-gray-500 dark:text-gray-400">মোট</span>
        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{total}%</span>
      </div>
    </div>
  );
}

// ── Loading Skeleton ──────────────────────────────────────────────────────────
function AnalysisSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SoilPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSkeleton />}>
        <SoilPageContent />
      </Suspense>
    </ErrorBoundary>
  );
}

function SoilPageContent() {
  const { location } = useLocation();
  const [activeTab, setActiveTab] = useState<"aez" | "calculator" | "fertilizer" | "barc">("aez");
  const [barcSearch, setBarcSearch] = useState("");

  // AEZ Explorer state
  const [aezSearch, setAezSearch] = useState("");
  const [selectedAez, setSelectedAez] = useState<number | null>(null);
  const [aezAnalysis, setAezAnalysis] = useState<string | null>(null);
  const [aezSources, setAezSources] = useState<string[]>([]);
  const [aezLoading, setAezLoading] = useState(false);
  const [aezError, setAezError] = useState<string | null>(null);
  const aezResultsRef = useRef<HTMLDivElement>(null);

  // Soil Calculator state
  const [sand, setSand] = useState(40);
  const [silt, setSilt] = useState(35);
  const [clay, setClay] = useState(25);
  const [organicMatter, setOrganicMatter] = useState<string>("");
  const [calcAezId, setCalcAezId] = useState<string>("");
  const [sampleAnalysis, setSampleAnalysis] = useState<string | null>(null);
  const [sampleUsdaClass, setSampleUsdaClass] = useState<string | null>(null);
  const [sampleSources, setSampleSources] = useState<string[]>([]);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [sampleError, setSampleError] = useState<string | null>(null);

  // Fertilizer Calculator state
  const [selectedSoil, setSelectedSoil] = useState<string | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  const [area, setArea] = useState("1");

  // Auto-detect soil type from district
  const detectedSoil = location?.district ? SOIL_ZONES[location.district] || "loam" : null;
  const detectedAez = location?.district ? DISTRICT_AEZ[location.district] || null : null;
  const soil = SOIL_TYPES.find((s) => s.id === (selectedSoil || detectedSoil || "loam"));
  const crop = CROPS.find((c) => c.id === selectedCrop);
  const areaNum = Math.max(parseFloat(area) || 1, 0.1);

  // Auto-adjust sliders to maintain 100% total
  const handleSandChange = useCallback((val: number[]) => {
    const newSand = val[0];
    setSand(newSand);
    const remaining = 100 - newSand;
    const currentSiltClay = silt + clay;
    if (currentSiltClay > 0) {
      setSilt(Math.round((silt / currentSiltClay) * remaining));
      setClay(remaining - Math.round((silt / currentSiltClay) * remaining));
    } else {
      setSilt(Math.round(remaining / 2));
      setClay(remaining - Math.round(remaining / 2));
    }
  }, [silt, clay]);

  const handleSiltChange = useCallback((val: number[]) => {
    const newSilt = val[0];
    setSilt(newSilt);
    const remaining = 100 - newSilt;
    const currentSandClay = sand + clay;
    if (currentSandClay > 0) {
      setSand(Math.round((sand / currentSandClay) * remaining));
      setClay(remaining - Math.round((sand / currentSandClay) * remaining));
    } else {
      setSand(Math.round(remaining / 2));
      setClay(remaining - Math.round(remaining / 2));
    }
  }, [sand, clay]);

  const handleClayChange = useCallback((val: number[]) => {
    const newClay = val[0];
    setClay(newClay);
    const remaining = 100 - newClay;
    const currentSandSilt = sand + silt;
    if (currentSandSilt > 0) {
      setSand(Math.round((sand / currentSandSilt) * remaining));
      setSilt(remaining - Math.round((sand / currentSandSilt) * remaining));
    } else {
      setSand(Math.round(remaining / 2));
      setSilt(remaining - Math.round(remaining / 2));
    }
  }, [sand, silt]);

  // Fetch AEZ analysis
  const fetchAezAnalysis = useCallback(async (aezId: number) => {
    setAezLoading(true);
    setAezError(null);
    setAezAnalysis(null);
    try {
      const res = await fetch(`/api/soil-analysis?aezId=${aezId}`);
      const data = await res.json();
      if (data.ok) {
        setAezAnalysis(data.analysis);
        setAezSources(data.sources || []);
        // Scroll to results
        setTimeout(() => {
          aezResultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      } else {
        setAezError(data.error || "বিশ্লেষণ ব্যর্থ হয়েছে");
      }
    } catch {
      setAezError("নেটওয়ার্ক ত্রুটি। আবার চেষ্টা করুন।");
    } finally {
      setAezLoading(false);
    }
  }, []);

  // Auto-select AEZ from user's GPS location when it becomes available
  useEffect(() => {
    if (location?.district && !selectedAez) {
      const aezStr = DISTRICT_AEZ[location.district];
      if (aezStr) {
        const match = aezStr.match(/AEZ-(\d+)/);
        if (match) {
          const aezId = parseInt(match[1], 10);
          setSelectedAez(aezId);
          fetchAezAnalysis(aezId);
        }
      }
    }
  }, [location?.district, selectedAez, fetchAezAnalysis]);

  // Fetch sample analysis
  const fetchSampleAnalysis = useCallback(async () => {
    setSampleLoading(true);
    setSampleError(null);
    setSampleAnalysis(null);
    try {
      const body: Record<string, unknown> = { sand, silt, clay };
      if (organicMatter && !isNaN(Number(organicMatter))) {
        body.organicMatter = Number(organicMatter);
      }
      if (calcAezId) {
        body.aezId = Number(calcAezId);
      }
      const res = await fetch("/api/soil-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.ok) {
        setSampleAnalysis(data.analysis);
        setSampleUsdaClass(data.usdaClassification);
        setSampleSources(data.sources || []);
      } else {
        setSampleError(data.error || "বিশ্লেষণ ব্যর্থ হয়েছে");
      }
    } catch {
      setSampleError("নেটওয়ার্ক ত্রুটি। আবার চেষ্টা করুন।");
    } finally {
      setSampleLoading(false);
    }
  }, [sand, silt, clay, organicMatter, calcAezId]);

  // Calculate fertilizer amounts
  const calculateFertilizer = useCallback(() => {
    if (!crop) return null;
    return {
      urea: (crop.urea * areaNum).toFixed(1),
      tsp: (crop.tsp * areaNum).toFixed(1),
      mop: (crop.mop * areaNum).toFixed(1),
      gypsum: (crop.gypsum * areaNum).toFixed(1),
      zinc: (crop.zinc * areaNum).toFixed(1),
    };
  }, [crop, areaNum]);

  const fertResult = calculateFertilizer();

  // Filter AEZ zones by search
  const filteredAezs = BANGLADESH_AEZS.filter(
    (z) =>
      z.name.toLowerCase().includes(aezSearch.toLowerCase()) ||
      z.bn.includes(aezSearch) ||
      z.region.includes(aezSearch) ||
      String(z.id).includes(aezSearch)
  );

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="relative px-4 pt-5 pb-7" style={{ background: "linear-gradient(135deg,#9d174d,#831843)" }}>
        <div className="absolute -bottom-px left-0 right-0 h-5 bg-white dark:bg-gray-900 rounded-t-[20px]" />
        <div className="text-[11px] text-white/50 tracking-widest font-bold mb-2">SOIL SCIENCE · AEZ ANALYZER</div>
        <h1 className="text-[22px] font-bold text-white mb-1">🏺 মৃত্তিকা বিশেষজ্ঞ</h1>
        <p className="text-xs text-white/70">AEZ জোন বিশ্লেষণ, মাটি ক্যালকুলেটর ও সার সুপারিশ — SRDI/BARC ভিত্তিক</p>
        {location?.district && (
          <div className="text-[10px] text-white/60 mt-2">📍 {location.district} — {detectedSoil ? SOIL_TYPES.find(s => s.id === detectedSoil)?.name : "মাটি নির্ণয় হচ্ছে"} · {detectedAez || "AEZ নির্ণয় হচ্ছে"}</div>
        )}
      </div>

      <div className="px-4 pt-5 pb-24">
        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          {[
            { key: "aez" as const, label: "🗺️ AEZ" },
            { key: "calculator" as const, label: "🧪 মাটি" },
            { key: "fertilizer" as const, label: "🧮 সার" },
            { key: "barc" as const, label: "📋 BARC" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 text-[10px] sm:text-[11px] font-bold py-2 px-1.5 rounded-lg transition-all cursor-pointer border-none ${
                activeTab === tab.key
                  ? "bg-white dark:bg-gray-700 text-pink-800 dark:text-pink-300 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            TAB 1: AEZ EXPLORER
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === "aez" && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 AEZ জোন খুঁজুন (নাম/নম্বর/এলাকা)..."
                value={aezSearch}
                onChange={(e) => setAezSearch(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 placeholder:text-gray-400"
              />
              {aezSearch && (
                <button
                  onClick={() => setAezSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm cursor-pointer bg-transparent border-none"
                >
                  ✕
                </button>
              )}
            </div>

            {/* AEZ Zone List */}
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
              {filteredAezs.map((z) => (
                <button
                  key={z.id}
                  onClick={() => {
                    setSelectedAez(z.id);
                    fetchAezAnalysis(z.id);
                  }}
                  className={`w-full text-left p-3 rounded-xl border-2 transition-all cursor-pointer ${
                    selectedAez === z.id
                      ? "border-pink-500 bg-pink-50 dark:bg-pink-950/30"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-pink-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900 dark:to-purple-900 flex items-center justify-center text-xs font-bold text-pink-700 dark:text-pink-300 flex-shrink-0">
                      {z.id}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-bold text-gray-900 dark:text-gray-100 truncate">{z.bn}</div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{z.name} · {z.region}</div>
                    </div>
                    {selectedAez === z.id && (
                      <span className="text-pink-500 text-xs">✓</span>
                    )}
                  </div>
                </button>
              ))}
              {filteredAezs.length === 0 && (
                <div className="text-center py-6 text-[12px] text-gray-400">
                  কোনো AEZ জোন পাওয়া যায়নি
                </div>
              )}
            </div>

            {/* Info banner */}
            <div className="bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800 rounded-xl p-3">
              <div className="text-[11px] text-pink-800 dark:text-pink-300">
                💡 বাংলাদেশে ৩০টি AEZ (Agro-Ecological Zone) রয়েছে। জোন নির্বাচন করলে AI সেই এলাকার মাটির বিশ্লেষণ দেবে।
              </div>
            </div>

            {/* AEZ Analysis Results */}
            {(aezLoading || aezAnalysis || aezError) && (
              <div ref={aezResultsRef} className="space-y-3">
                {selectedAez && (
                  <div className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 rounded-2xl border border-pink-200 dark:border-pink-800 p-4">
                    <div className="text-[13px] font-extrabold text-gray-900 dark:text-gray-100 mb-1">
                      🗺️ AEZ জোন {selectedAez} — {BANGLADESH_AEZS.find(z => z.id === selectedAez)?.bn}
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-3">
                      {BANGLADESH_AEZS.find(z => z.id === selectedAez)?.name} · AI বিশ্লেষণ
                    </div>

                    {aezLoading ? (
                      <AnalysisSkeleton />
                    ) : aezError ? (
                      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-[11px] text-red-700 dark:text-red-400">
                        ⚠️ {aezError}
                      </div>
                    ) : aezAnalysis ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none text-[12px] leading-relaxed text-gray-800 dark:text-gray-200">
                        <ReactMarkdown>{aezAnalysis}</ReactMarkdown>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Sources */}
                {aezSources.length > 0 && !aezLoading && (
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
                    <div className="text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-2">📚 তথ্যসূত্র</div>
                    <div className="space-y-1">
                      {aezSources.map((src, i) => (
                        <div key={i} className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-pink-400 flex-shrink-0" />
                          {src}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 2: SOIL CALCULATOR
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === "calculator" && (
          <div className="space-y-4">
            {/* Composition Chart + Legend */}
            <div className="bg-gradient-to-br from-cyan-50 to-amber-50 dark:from-cyan-950/20 dark:to-amber-950/20 rounded-2xl border border-cyan-200 dark:border-cyan-800 p-4">
              <div className="text-[13px] font-extrabold text-gray-900 dark:text-gray-100 mb-3">🧪 মাটির গঠন</div>
              <div className="flex items-center gap-4">
                <SoilDonutChart sand={sand} silt={silt} clay={clay} />
                <div className="flex-1 space-y-2.5">
                  {/* Sand */}
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-[11px] font-bold text-gray-900 dark:text-gray-100">বালি (Sand)</div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400">{sand}%</div>
                    </div>
                  </div>
                  {/* Silt */}
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-cyan-500 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-[11px] font-bold text-gray-900 dark:text-gray-100">পলি (Silt)</div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400">{silt}%</div>
                    </div>
                  </div>
                  {/* Clay */}
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-900 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-[11px] font-bold text-gray-900 dark:text-gray-100">কাদা (Clay)</div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400">{clay}%</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual composition bar */}
              <div className="mt-3 h-4 rounded-full overflow-hidden flex">
                <div className="bg-amber-500 transition-all duration-300" style={{ width: `${sand}%` }} />
                <div className="bg-cyan-500 transition-all duration-300" style={{ width: `${silt}%` }} />
                <div className="bg-amber-900 transition-all duration-300" style={{ width: `${clay}%` }} />
              </div>
            </div>

            {/* Sliders */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 space-y-5">
              <div className="text-[12px] font-bold text-gray-700 dark:text-gray-300">স্লাইডার দিয়ে মাটির গঠন নির্ধারণ করুন</div>

              {/* Sand slider */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">বালি (Sand)</span>
                  </div>
                  <span className="text-[13px] font-extrabold text-amber-600">{sand}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={sand}
                  onChange={(e) => handleSandChange([Number(e.target.value)])}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer accent-amber-500"
                  style={{ background: `linear-gradient(to right, #f59e0b ${sand}%, #e5e7eb ${sand}%)` }}
                />
              </div>

              {/* Silt slider */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                    <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">পলি (Silt)</span>
                  </div>
                  <span className="text-[13px] font-extrabold text-cyan-600">{silt}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={silt}
                  onChange={(e) => handleSiltChange([Number(e.target.value)])}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer accent-cyan-500"
                  style={{ background: `linear-gradient(to right, #06b6d4 ${silt}%, #e5e7eb ${silt}%)` }}
                />
              </div>

              {/* Clay slider */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-900" />
                    <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">কাদা (Clay)</span>
                  </div>
                  <span className="text-[13px] font-extrabold text-amber-800">{clay}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={clay}
                  onChange={(e) => handleClayChange([Number(e.target.value)])}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer accent-amber-900"
                  style={{ background: `linear-gradient(to right, #92400e ${clay}%, #e5e7eb ${clay}%)` }}
                />
              </div>

              {/* Organic Matter input */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">🌿 জৈব পদার্থ (ঐচ্ছিক)</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="০.৫ - ১০.০"
                    value={organicMatter}
                    onChange={(e) => setOrganicMatter(e.target.value)}
                    min="0"
                    max="100"
                    step="0.1"
                    className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400/30"
                  />
                  <span className="text-[12px] font-bold text-gray-500 dark:text-gray-400">%</span>
                </div>
              </div>

              {/* AEZ Zone context */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">🗺️ AEZ জোন (ঐচ্ছিক প্রসঙ্গ)</span>
                </div>
                <select
                  value={calcAezId}
                  onChange={(e) => setCalcAezId(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400/30"
                >
                  <option value="">জোন নির্বাচন না করুন</option>
                  {BANGLADESH_AEZS.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.id}. {z.bn}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Analyze button */}
            <button
              onClick={fetchSampleAnalysis}
              disabled={sampleLoading}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all cursor-pointer border-none ${
                sampleLoading
                  ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:from-pink-700 hover:to-purple-700 active:scale-[0.98] shadow-md"
              }`}
            >
              {sampleLoading ? "🔄 AI বিশ্লেষণ চলছে..." : "🧬 AI দিয়ে বিশ্লেষণ করুন"}
            </button>

            {/* USDA Classification */}
            {sampleUsdaClass && (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3">
                <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 mb-1">📋 USDA শ্রেণিবিন্যাস</div>
                <div className="text-[14px] font-extrabold text-emerald-900 dark:text-emerald-200">{sampleUsdaClass}</div>
              </div>
            )}

            {/* Sample Analysis Results */}
            {sampleLoading && (
              <div className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 rounded-2xl border border-pink-200 dark:border-pink-800 p-4">
                <div className="text-[12px] font-bold text-gray-700 dark:text-gray-300 mb-3">🧬 বিশ্লেষণ চলছে...</div>
                <AnalysisSkeleton />
              </div>
            )}

            {sampleError && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-[11px] text-red-700 dark:text-red-400">
                ⚠️ {sampleError}
              </div>
            )}

            {sampleAnalysis && !sampleLoading && (
              <div className="space-y-3">
                <div className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 rounded-2xl border border-pink-200 dark:border-pink-800 p-4">
                  <div className="text-[13px] font-extrabold text-gray-900 dark:text-gray-100 mb-3">
                    🧬 AI বিশ্লেষণ ফলাফল
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-[12px] leading-relaxed text-gray-800 dark:text-gray-200">
                    <ReactMarkdown>{sampleAnalysis}</ReactMarkdown>
                  </div>
                </div>

                {/* Sources */}
                {sampleSources.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
                    <div className="text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-2">📚 তথ্যসূত্র</div>
                    <div className="space-y-1">
                      {sampleSources.map((src, i) => (
                        <div key={i} className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-pink-400 flex-shrink-0" />
                          {src}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick presets */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
              <div className="text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-2">⚡ দ্রুত প্রিসেট</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "বেলে মাটি", sand: 85, silt: 10, clay: 5 },
                  { label: "দোআঁশ মাটি", sand: 40, silt: 35, clay: 25 },
                  { label: "পলি মাটি", sand: 20, silt: 30, clay: 50 },
                  { label: "পলিত দোআঁশ", sand: 25, silt: 55, clay: 20 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      setSand(preset.sand);
                      setSilt(preset.silt);
                      setClay(preset.clay);
                    }}
                    className="text-[10px] font-bold py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-pink-400 cursor-pointer transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 3: FERTILIZER CALCULATOR (KEPT FROM ORIGINAL)
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === "fertilizer" && (
          <>
          <div className="space-y-4">
            {/* Soil type selector */}
            <div>
              <div className="text-[12px] font-bold text-gray-700 dark:text-gray-300 mb-2">১. মাটির ধরন নির্বাচন করুন</div>
              <div className="grid grid-cols-3 gap-2">
                {SOIL_TYPES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSoil(s.id)}
                    className={`p-2.5 rounded-xl border-2 text-center transition-all cursor-pointer ${
                      (selectedSoil || detectedSoil || "loam") === s.id
                        ? "border-pink-500 bg-pink-50 dark:bg-pink-950/30"
                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-pink-300"
                    }`}
                  >
                    <div className="text-lg">{s.icon}</div>
                    <div className="text-[11px] font-bold text-gray-900 dark:text-gray-100">{s.name}</div>
                    <div className="text-[9px] text-gray-500 dark:text-gray-400">{s.en}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Crop selector */}
            <div>
              <div className="text-[12px] font-bold text-gray-700 dark:text-gray-300 mb-2">২. ফসল নির্বাচন করুন</div>
              <div className="grid grid-cols-4 gap-1.5">
                {CROPS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCrop(c.id)}
                    className={`p-2 rounded-lg border-2 text-center transition-all cursor-pointer ${
                      selectedCrop === c.id
                        ? "border-pink-500 bg-pink-50 dark:bg-pink-950/30"
                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-pink-300"
                    }`}
                  >
                    <div className="text-lg">{c.icon}</div>
                    <div className="text-[9px] font-bold text-gray-800 dark:text-gray-200">{c.name}</div>
                    <div className="text-[8px] text-gray-400 dark:text-gray-500">{c.season}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Area input */}
            <div>
              <div className="text-[12px] font-bold text-gray-700 dark:text-gray-300 mb-2">৩. জমির পরিমাণ (বিঘায়)</div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  min="0.1"
                  step="0.5"
                  className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 dark:text-gray-100 outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400/30"
                />
                <span className="text-[12px] font-bold text-gray-500 dark:text-gray-400">বিঘা</span>
              </div>
              <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">১ বিঘা = ৩৩ শতক = ১,৩৩৭ বর্গমিটার</div>
            </div>

            {/* Results */}
            {fertResult && crop && (
              <div className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 rounded-2xl border border-pink-200 dark:border-pink-800 p-4">
                <div className="text-[13px] font-extrabold text-gray-900 dark:text-gray-100 mb-1">
                  {crop.icon} {crop.name} — {areaNum} বিঘার জন্য সারের মাত্রা
                </div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-3">
                  {soil?.name} মাটি · SRDI সুপারিশকৃত
                </div>

                <div className="space-y-2">
                  {[
                    { name: "ইউরিয়া", val: fertResult.urea, unit: "কেজি", info: FERTILIZER_INFO[0] },
                    { name: "টিএসপি", val: fertResult.tsp, unit: "কেজি", info: FERTILIZER_INFO[1] },
                    { name: "এমওপি", val: fertResult.mop, unit: "কেজি", info: FERTILIZER_INFO[2] },
                    { name: "জিপসাম", val: fertResult.gypsum, unit: "কেজি", info: FERTILIZER_INFO[3] },
                    { name: "জিংক সালফেট", val: fertResult.zinc, unit: "কেজি", info: FERTILIZER_INFO[4] },
                  ].map((f, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl p-2.5 border border-gray-100 dark:border-gray-700">
                      <span className="text-base">{f.info.icon}</span>
                      <div className="flex-1">
                        <div className="text-[11px] font-bold text-gray-900 dark:text-gray-100">{f.name}</div>
                        <div className="text-[9px] text-gray-500 dark:text-gray-400">{f.info.en}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[14px] font-extrabold" style={{ color: f.info.color }}>{f.val}</div>
                        <div className="text-[9px] text-gray-400 dark:text-gray-500">{f.unit}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Soil adjustment note */}
                {soil && soil.drainLevel === "low" && (
                  <div className="mt-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-2.5 text-[11px] text-amber-800 dark:text-amber-300">
                    ⚠️ {soil.name} — জল নিষ্কাশন ধীর। ইউরিয়া ৪ কিস্তায় প্রয়োগ করুন। জিপসাম বাড়তি ৫ কেজি/বিঘা দিন।
                  </div>
                )}
                {soil && soil.drainLevel === "high" && (
                  <div className="mt-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-2.5 text-[11px] text-blue-800 dark:text-blue-300">
                    💡 {soil.name} — জল নিষ্কাশন দ্রুত। সেচ বেশি দিন, এমওপি ২ কিস্তায় প্রয়োগ করুন।
                  </div>
                )}
              </div>
            )}

            {!selectedCrop && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 text-center">
                <div className="text-2xl mb-2">👆</div>
                <div className="text-[12px] text-gray-500 dark:text-gray-400">ফসল নির্বাচন করুন সারের মাত্রা জানতে</div>
              </div>
            )}

            {/* Fertilizer Guide */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
              <div className="text-[12px] font-bold text-gray-700 dark:text-gray-300 mb-2">📋 সার প্রয়োগ নির্দেশিকা</div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {FERTILIZER_INFO.map((f, i) => (
                  <div key={i} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2.5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{f.icon}</span>
                      <span className="text-[11px] font-bold text-gray-900 dark:text-gray-100">{f.name}</span>
                      <span className="text-[9px] text-gray-400 font-mono">{f.en}</span>
                    </div>
                    <div className="text-[10px] text-gray-600 dark:text-gray-400">
                      ⏱️ {f.timing}
                    </div>
                    <div className="text-[10px] text-gray-600 dark:text-gray-400">
                      📋 {f.method}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gov resources */}
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
              <div className="text-[12px] font-bold text-green-900 dark:text-green-300 mb-2">🏛️ সরকারি সেবা</div>
              <div className="space-y-1.5 text-[11px] text-green-800 dark:text-green-400">
                <p>• SRDI মাটি পরীক্ষা — সম্পূর্ণ বিনামূল্যে</p>
                <p>• উপজেলা কৃষি অফিস থেকে নমুনা জমা দিন</p>
                <p>• ফলাফল ৭-১৫ দিনের মধ্যে পাওয়া যায়</p>
                <p>• ভর্তুকিতে সার — কৃষি ডিলারের মাধ্যমে</p>
              </div>
              <a
                href="https://srdi.gov.bd"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-3 text-[11px] font-bold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-full px-3 py-1.5 no-underline hover:bg-green-200 transition-colors"
              >
                SRDI ওয়েবসাইট →
              </a>
            </div>
          </div>

          {/* ═══ BARC 2024 Fertilizer Advisory ═══ */}
          <div className="space-y-3">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-4">
              <div className="text-[13px] font-extrabold text-gray-900 dark:text-gray-100 mb-1">
                📋 BARC ২০২৪ সার সুপারিশ গাইড
              </div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-3">
                বাংলাদেশ কৃষি গবেষণা পরিষদ (BARC) সার সুপারিশ গাইড ২০২৪ ভিত্তিক
              </div>
              {detectedAez && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-2.5 mb-3 border border-emerald-100 dark:border-emerald-900">
                  <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">📍 আপনার AEZ: {detectedAez}</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">এই জোনের জন্য সার সুপারিশ নিচে দেওয়া হলো</div>
                </div>
              )}
              <div className="space-y-2.5">
                {BARC_2024_ADVISORY.map((item, i) => (
                  <div key={i} className={`rounded-xl border p-3 ${item.color}`}>
                    <div className="flex items-start gap-2">
                      <span className="text-base flex-shrink-0">{item.icon}</span>
                      <div>
                        <div className="text-[11px] font-bold text-gray-900 dark:text-gray-100">{item.title}</div>
                        <div className="text-[10px] text-gray-600 dark:text-gray-400 leading-relaxed mt-0.5">{item.desc}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-[9px] text-gray-400 dark:text-gray-500 border-t border-emerald-200 dark:border-emerald-800 pt-2">
                তথ্যসূত্র: BARC Fertilizer Recommendation Guide 2024, SRDI Soil Resource Development Institute
              </div>
            </div>
          </div>
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 4: BARC 2024 FERTILIZER ADVISORY
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === "barc" && (
          <div className="space-y-4">
            {/* Header card */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-4">
              <div className="text-[15px] font-extrabold text-gray-900 dark:text-gray-100 mb-1">
                📋 BARC ২০২৪ সার সুপারিশ গাইড
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-3">
                বাংলাদেশ কৃষি গবেষণা পরিষদ (BARC) সার সুপারিশ গাইড ২০২৪ ভিত্তিক
              </div>
              {detectedAez && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-2.5 border border-emerald-100 dark:border-emerald-900">
                  <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">📍 আপনার AEZ: {detectedAez}</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">এই জোনের জন্য সার সুপারিশ নিচে দেওয়া হলো</div>
                </div>
              )}
            </div>

            {/* Key Principles */}
            <div className="space-y-2.5">
              <div className="text-[12px] font-bold text-gray-700 dark:text-gray-300">🔑 মূল নীতিমালা</div>
              {BARC_2024_ADVISORY.map((item, i) => (
                <div key={i} className={`rounded-xl border p-3 ${item.color}`}>
                  <div className="flex items-start gap-2">
                    <span className="text-base flex-shrink-0">{item.icon}</span>
                    <div>
                      <div className="text-[11px] font-bold text-gray-900 dark:text-gray-100">{item.title}</div>
                      <div className="text-[10px] text-gray-600 dark:text-gray-400 leading-relaxed mt-0.5">{item.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Crop-Specific BARC Recommendations */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[12px] font-bold text-gray-700 dark:text-gray-300">🌾 ফসলভিত্তিক BARC সুপারিশকৃত মাত্রা (কেজি/বিঘা)</div>
              </div>

              {/* Search crops */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 ফসল খুঁজুন..."
                  value={barcSearch}
                  onChange={(e) => setBarcSearch(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 placeholder:text-gray-400"
                />
                {barcSearch && (
                  <button
                    onClick={() => setBarcSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm cursor-pointer bg-transparent border-none"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Crop cards */}
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
                {BARC_CROP_RECOMMENDATIONS.filter(c =>
                  c.crop.includes(barcSearch) ||
                  c.season.includes(barcSearch) ||
                  c.notes.includes(barcSearch)
                ).map((rec, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
                    {/* Crop header */}
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="text-lg">{rec.icon}</span>
                      <div className="flex-1">
                        <div className="text-[12px] font-extrabold text-gray-900 dark:text-gray-100">{rec.crop}</div>
                        <div className="text-[9px] text-gray-500 dark:text-gray-400">{rec.season}</div>
                      </div>
                    </div>

                    {/* Fertilizer amounts grid */}
                    <div className="grid grid-cols-3 gap-1.5 mb-2.5">
                      {[
                        { label: "ইউরিয়া", val: rec.urea, color: "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900" },
                        { label: "টিএসপি", val: rec.tsp, color: "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900" },
                        { label: "এমওপি", val: rec.mop, color: "text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900" },
                        { label: "জিপসাম", val: rec.gypsum, color: "text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 border-yellow-100 dark:border-yellow-900" },
                        { label: "জিংক", val: rec.zinc, color: "text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 border-purple-100 dark:border-purple-900" },
                        { label: "বোরন", val: rec.boron, color: "text-pink-700 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/30 border-pink-100 dark:border-pink-900" },
                      ].map((f, j) => (
                        <div key={j} className={`rounded-lg border p-1.5 text-center ${f.color}`}>
                          <div className="text-[8px] font-medium opacity-70">{f.label}</div>
                          <div className="text-[11px] font-extrabold">{f.val}</div>
                        </div>
                      ))}
                    </div>

                    {/* Notes */}
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 rounded-lg p-2">
                      <div className="text-[10px] text-amber-800 dark:text-amber-300 leading-relaxed">
                        💡 {rec.notes}
                      </div>
                    </div>
                  </div>
                ))}
                {BARC_CROP_RECOMMENDATIONS.filter(c =>
                  c.crop.includes(barcSearch) ||
                  c.season.includes(barcSearch) ||
                  c.notes.includes(barcSearch)
                ).length === 0 && (
                  <div className="text-center py-6 text-[12px] text-gray-400">
                    কোনো ফসল পাওয়া যায়নি
                  </div>
                )}
              </div>
            </div>

            {/* IPNS Detailed Breakdown */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-2xl border border-amber-200 dark:border-amber-800 p-4">
              <div className="text-[12px] font-bold text-gray-900 dark:text-gray-100 mb-2">🔄 IPNS বিস্তারিত পদ্ধতি</div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-[10px] font-bold text-green-700 dark:text-green-300 flex-shrink-0">১</span>
                  <div>
                    <div className="text-[11px] font-bold text-gray-900 dark:text-gray-100">জৈব সার প্রয়োগ</div>
                    <div className="text-[10px] text-gray-600 dark:text-gray-400">গোবর সার ১-২ টন/বিঘা বা কম্পোস্ট ২-৩ টন/বিঘা জমি তৈরির সময় মিশিয়ে দিন। পচন প্রক্রিয়া শেষ হলে মাটির উর্বরতা বাড়ে।</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-[10px] font-bold text-blue-700 dark:text-blue-300 flex-shrink-0">২</span>
                  <div>
                    <div className="text-[11px] font-bold text-gray-900 dark:text-gray-100">রাসায়নিক সার (সুষম মাত্রায়)</div>
                    <div className="text-[10px] text-gray-600 dark:text-gray-400">মাটি পরীক্ষার ফলাফল অনুযায়ী NPK সার প্রয়োগ করুন। জৈব সার ব্যবহারে রাসায়নিক সার ২০-২৫% কমানো সম্ভব।</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-[10px] font-bold text-purple-700 dark:text-purple-300 flex-shrink-0">৩</span>
                  <div>
                    <div className="text-[11px] font-bold text-gray-900 dark:text-gray-100">জীবাণু সার প্রয়োগ</div>
                    <div className="text-[10px] text-gray-600 dark:text-gray-400">রাইজোবিয়াম (ডাল ফসল), এজোস্পাইরিলাম (ধান/গম), পিএসবি (ফসফরাস দ্রবীভূত) — বীজের সাথে মিশিয়ে বা জমিতে প্রয়োগ করুন।</div>
                  </div>
                </div>
              </div>
            </div>

            {/* UDP Section */}
            <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 rounded-2xl border border-red-200 dark:border-red-800 p-4">
              <div className="text-[12px] font-bold text-gray-900 dark:text-gray-100 mb-2">🕳️ ইউরিয়া ডিপ প্লেসমেন্ট (UDP) — বিস্তারিত</div>
              <div className="space-y-2 text-[10px] text-gray-600 dark:text-gray-400 leading-relaxed">
                <p>• <strong className="text-gray-800 dark:text-gray-200">পদ্ধতি:</strong> ইউরিয়া সার মাটির ৭-১০ সেমি গভীরে ২-৩ চারার মাঝখানে প্রয়োগ করুন</p>
                <p>• <strong className="text-gray-800 dark:text-gray-200">সুবিধা:</strong> নাইট্রোজেন ক্ষয় ৩০% কমে, ফলন ১৫-২০% বাড়ে</p>
                <p>• <strong className="text-gray-800 dark:text-gray-200">যন্ত্র:</strong> UDP যন্ত্র (BRRI উদ্ভাবিত) বা হাতে লাঠি দিয়ে গর্ত করে প্রয়োগ</p>
                <p>• <strong className="text-gray-800 dark:text-gray-200">সময়:</strong> রোপণের ৫-৭ দিন পর প্রথম কিস্তা, কুশি ও গুড়া পর্যায়ে পরবর্তী কিস্তা</p>
                <p>• <strong className="text-gray-800 dark:text-gray-200">সতর্কতা:</strong> সার পানিতে ভিজবে না, গভীরে দেওয়ার পর মাটি দিয়ে ঢেকে দিন</p>
              </div>
            </div>

            {/* Fertilizer Application Timing */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <div className="text-[12px] font-bold text-gray-700 dark:text-gray-300 mb-2">⏰ সার প্রয়োগের সময়কাল ও পদ্ধতি</div>
              <div className="space-y-2">
                {FERTILIZER_INFO.map((f, i) => (
                  <div key={i} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2.5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{f.icon}</span>
                      <span className="text-[11px] font-bold text-gray-900 dark:text-gray-100">{f.name}</span>
                      <span className="text-[9px] text-gray-400 font-mono">{f.en}</span>
                    </div>
                    <div className="text-[10px] text-gray-600 dark:text-gray-400">
                      ⏱️ {f.timing}
                    </div>
                    <div className="text-[10px] text-gray-600 dark:text-gray-400">
                      📋 {f.method}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Source */}
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
              <div className="text-[12px] font-bold text-green-900 dark:text-green-300 mb-2">🏛️ সরকারি সেবা ও তথ্যসূত্র</div>
              <div className="space-y-1.5 text-[11px] text-green-800 dark:text-green-400">
                <p>• BARC Fertilizer Recommendation Guide 2024</p>
                <p>• SRDI মাটি পরীক্ষা — সম্পূর্ণ বিনামূল্যে</p>
                <p>• উপজেলা কৃষি অফিস থেকে নমুনা জমা দিন</p>
                <p>• ভর্তুকিতে সার — কৃষি ডিলারের মাধ্যমে</p>
              </div>
              <div className="flex gap-2 mt-3">
                <a
                  href="https://srdi.gov.bd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-full px-3 py-1.5 no-underline hover:bg-green-200 transition-colors"
                >
                  SRDI ওয়েবসাইট →
                </a>
                <a
                  href="https://barc.gov.bd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900 border border-emerald-300 dark:border-emerald-700 rounded-full px-3 py-1.5 no-underline hover:bg-emerald-200 transition-colors"
                >
                  BARC ওয়েবসাইট →
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
