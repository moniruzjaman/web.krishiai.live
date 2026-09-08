-- KrishiAI Supabase Schema — Vercel + Supabase Architecture
-- Free platform with quota tier fallback

-- ── Shared trigger helper ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Quota Tiers ──────────────────────────────────────────────────────────────
CREATE TYPE quota_tier AS ENUM ('free', 'basic', 'pro', 'unlimited');

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  location_lat DOUBLE PRECISION DEFAULT 23.8103,
  location_lng DOUBLE PRECISION DEFAULT 90.4125,
  location_name TEXT DEFAULT 'ঢাকা',
  language TEXT DEFAULT 'bn',
  quota_tier quota_tier DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Usage Tracking ───────────────────────────────────────────────────────────
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  feature TEXT NOT NULL, -- 'chat', 'diagnose', 'soil_analysis', 'crop_database', 'news_bulletin'
  provider TEXT, -- 'gemini', 'openrouter', 'groq', 'offline'
  model TEXT,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usage_logs_user_date ON usage_logs(user_id, created_at DESC);
CREATE INDEX idx_usage_logs_feature ON usage_logs(feature, created_at DESC);

-- ── Quota Limits per Tier ────────────────────────────────────────────────────
CREATE TABLE quota_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier quota_tier NOT NULL,
  feature TEXT NOT NULL,
  daily_limit INTEGER NOT NULL,
  monthly_limit INTEGER NOT NULL,
  UNIQUE(tier, feature)
);

-- Free tier quotas (completely free platform — generous limits)
INSERT INTO quota_limits (tier, feature, daily_limit, monthly_limit) VALUES
  ('free', 'chat', 30, 500),
  ('free', 'diagnose', 15, 200),
  ('free', 'soil_analysis', 20, 300),
  ('free', 'crop_database', 30, 500),
  ('free', 'news_bulletin', 50, 1000);

-- ── Chat History ─────────────────────────────────────────────────────────────
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  model TEXT,
  provider TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_user ON chat_messages(user_id, created_at DESC);

-- ── Crop Alerts ──────────────────────────────────────────────────────────────
CREATE TABLE crop_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region TEXT NOT NULL,
  alert_type TEXT NOT NULL, -- 'weather', 'pest', 'disease', 'market'
  severity TEXT DEFAULT 'info', -- 'info', 'warning', 'critical'
  title_bn TEXT NOT NULL,
  body_bn TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_crop_alerts_region ON crop_alerts(region, active, expires_at);

-- ── Push Subscriptions (Web Push, for crop_alerts delivery) ───────────────────
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  region TEXT, -- Bengali district, for region-targeted crop_alerts
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_push_subscriptions_region ON push_subscriptions(region);

-- ── Crops (shared, durable — /api/v1/crops platform surface) ──────────────────
-- Generated once (AI-assisted) then persisted, so every KrishiAI project
-- (web, mobile, cabi, game) reads the SAME enhanced data instead of each
-- regenerating its own copy via a per-instance in-memory cache.
CREATE TABLE crop_categories (
  id TEXT PRIMARY KEY, -- e.g. 'grains'
  name TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  examples TEXT, -- short human-readable examples string
  sort_order INT DEFAULT 0
);

CREATE TABLE crops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id TEXT NOT NULL REFERENCES crop_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  description TEXT,
  description_bn TEXT,
  season TEXT, -- e.g. 'Rabi', 'Kharif-1', 'Kharif-2'
  source TEXT DEFAULT 'ai_generated', -- 'ai_generated' | 'dae' | 'brri' | 'bari' | 'manual'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (category_id, name)
);

CREATE INDEX idx_crops_category ON crops(category_id);

CREATE TRIGGER crops_updated_at
  BEFORE UPDATE ON crops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE crops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can read own usage" ON usage_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own usage" ON usage_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own messages" ON chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own messages" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can read active alerts" ON crop_alerts FOR SELECT USING (active = TRUE);

CREATE POLICY "Anyone can register a push subscription" ON push_subscriptions
  FOR INSERT WITH CHECK (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "Users can view own push subscriptions" ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own push subscriptions" ON push_subscriptions
  FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- crop_categories / crops: public read (this is the shared /api/v1 platform
-- data other KrishiAI projects consume) — writes are service-role only
-- (no client-facing INSERT/UPDATE policy, so RLS blocks anon/auth writes by default).
CREATE POLICY "Anyone can read crop categories" ON crop_categories FOR SELECT USING (true);
CREATE POLICY "Anyone can read crops" ON crops FOR SELECT USING (true);

-- ── Seed: crop_categories ───────────────────────────────────────────────────
INSERT INTO crop_categories (id, name, name_bn, examples, sort_order) VALUES
  ('grains', 'Grains', 'শস্য', 'e.g., Rice, Wheat, Maize', 1),
  ('oils', 'Oils', 'তেল বীজ', 'e.g., Mustard, Soybean, Sesame', 2),
  ('spices', 'Spices', 'মসলা', 'e.g., Chili, Turmeric, Ginger', 3),
  ('pulses', 'Pulses', 'ডাল', 'e.g., Lentil, Chickpea, Black gram', 4),
  ('fruits', 'Fruits', 'ফল', 'e.g., Mango, Jackfruit, Litchi', 5),
  ('vegetables', 'Vegetables', 'সবজি', 'e.g., Potato, Brinjal, Cabbage', 6),
  ('high_value_crops', 'High Value Crops', 'উচ্চমূল্যের ফসল', 'e.g., Cotton, Tea, Tobacco', 7)
ON CONFLICT (id) DO NOTHING;

-- ── AEZ Zones (shared, durable — /api/v1/aez-zones platform surface) ──────────
-- Full SRDI-sourced Agro-Ecological Zone dataset: 30 official zones with
-- geo-coordinates (enables "detect my zone from GPS"), soil type, texture,
-- topography, pH range, and a 13-nutrient profile per zone. Ported from an
-- earlier prototype (KrishiAI-3.0) into the durable shared platform layer —
-- replaces on-the-fly AI narrative generation with real structured official data.
CREATE TABLE IF NOT EXISTS aez_zones (
  id INT PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  lat NUMERIC(6,3) NOT NULL,
  lng NUMERIC(6,3) NOT NULL,
  soil_type TEXT NOT NULL,
  texture TEXT NOT NULL,
  topography TEXT NOT NULL,
  ph_range TEXT NOT NULL,
  -- nutrients: { n, p, k, s, zn, b, ca, mg, fe, mn, cu, mo, cl, ni, c, h, o, om, cec }
  -- each value one of: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High'
  nutrients JSONB NOT NULL
);

ALTER TABLE aez_zones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read AEZ zones" ON aez_zones;
CREATE POLICY "Anyone can read AEZ zones" ON aez_zones FOR SELECT USING (true);

-- ── Seed: aez_zones (30 official SRDI zones) ────────────────────────────────
INSERT INTO aez_zones (id, name_en, name_bn, lat, lng, soil_type, texture, topography, ph_range, nutrients) VALUES
  (1, 'Old Himalayan Piedmont Plain', 'পুরাতন হিমালয় পাদদেশীয় সমভূমি', 26.0, 88.5, 'Non-calcareous Brown Floodplain soils', 'Sandy loams to silty loams', 'Highland and Medium Highland', '4.5 - 5.5 (Acidic)', '{"n": "Low", "p": "Low", "k": "Low", "s": "Low", "zn": "Low", "b": "Low", "ca": "Low", "mg": "Low", "fe": "High", "om": "Low", "cec": "Low", "mn": "Medium", "cu": "Low", "mo": "Low", "cl": "Medium", "ni": "Low", "c": "Medium", "h": "Medium", "o": "Medium"}'::jsonb),
  (2, 'Active Tista Floodplain', 'সক্রিয় তিস্তা বন্যার সমভূমি', 25.8, 89.4, 'Alluvium soils', 'Sands and silts', 'Lowland and Medium Lowland', '6.0 - 7.5', '{"n": "Low", "p": "Medium", "k": "Medium", "s": "Low", "zn": "Medium", "b": "Low", "ca": "Medium", "mg": "Medium", "fe": "Medium", "om": "Low", "cec": "Medium", "mn": "Medium", "cu": "Medium", "mo": "Low", "cl": "High", "ni": "Low", "c": "Low", "h": "Medium", "o": "Medium"}'::jsonb),
  (3, 'Tista Meander Floodplain', 'তিস্তা আঁকাবাঁকা বন্যার সমভূমি', 25.5, 89.1, 'Non-calcareous Gray Floodplain soils', 'Silt loams', 'Medium Highland', '5.2 - 6.5', '{"n": "Low", "p": "Low", "k": "Low", "s": "Low", "zn": "Medium", "b": "Low", "ca": "Low", "mg": "Medium", "fe": "Medium", "om": "Low", "cec": "Medium", "mn": "High", "cu": "Medium", "mo": "Medium", "cl": "Medium", "ni": "Low", "c": "Medium", "h": "Medium", "o": "Medium"}'::jsonb),
  (4, 'Karatoya-Bangali Floodplain', 'করতোয়া-বঙ্গলী বন্যার সমভূমি', 24.8, 89.4, 'Non-calcareous Gray Floodplain soils', 'Silt loams to silty clay loams', 'Medium Highland to Medium Lowland', '5.5 - 6.8', '{"n": "Low", "p": "Low", "k": "Low", "s": "Low", "zn": "Low", "b": "Low", "ca": "Medium", "mg": "Medium", "fe": "Medium", "om": "Medium", "cec": "High", "mn": "Medium", "cu": "Low", "mo": "Low", "cl": "Low", "ni": "Low", "c": "Medium", "h": "Medium", "o": "Medium"}'::jsonb),
  (5, 'Lower Atrai Basin', 'নিম্ন আত্রাই অববাহিকা', 24.4, 89.0, 'Acid Basin Clays', 'Heavy Clays', 'Lowland', '4.8 - 5.8', '{"n": "Low", "p": "Low", "k": "Medium", "s": "Medium", "zn": "Low", "b": "Low", "ca": "Low", "mg": "Medium", "fe": "High", "om": "Medium", "cec": "Very High", "mn": "Medium", "cu": "Medium", "mo": "Medium", "cl": "Medium", "ni": "Low", "c": "High", "h": "Medium", "o": "Medium"}'::jsonb),
  (6, 'Lower Purnabhaba Floodplain', 'নিম্ন পুর্ণভবা বন্যার সমভূমি', 24.8, 88.3, 'Acid Basin Clays', 'Heavy Clays', 'Lowland', '5.0 - 6.0', '{"n": "Low", "p": "Low", "k": "Medium", "s": "Low", "zn": "Low", "b": "Low", "ca": "Low", "mg": "Medium", "fe": "High", "om": "Medium", "cec": "High", "mn": "High", "cu": "Low", "mo": "Low", "cl": "Medium", "ni": "Low", "c": "Medium", "h": "Medium", "o": "Medium"}'::jsonb),
  (7, 'Active Brahmaputra-Jamuna Floodplain', 'সক্রিয় ব্রহ্মপুত্র-যমুনা বন্যার সমভূমি', 24.5, 89.8, 'Alluvium', 'Silty and sandy alluvium', 'Lowland', '6.5 - 7.5', '{"n": "Low", "p": "Medium", "k": "Medium", "s": "Low", "zn": "Medium", "b": "Low", "ca": "High", "mg": "High", "fe": "Medium", "om": "Low", "cec": "Medium", "mn": "Medium", "cu": "High", "mo": "Low", "cl": "High", "ni": "Medium", "c": "Low", "h": "Medium", "o": "Medium"}'::jsonb),
  (8, 'Young Brahmaputra and Jamuna Floodplain', 'নবীন ব্রহ্মপুত্র ও যমুনা বন্যার সমভূমি', 24.7, 90.0, 'Non-calcareous Gray Floodplain soils', 'Silt loams', 'Medium Highland', '5.5 - 6.5', '{"n": "Low", "p": "Low", "k": "Low", "s": "Low", "zn": "Medium", "b": "Medium", "ca": "Medium", "mg": "Medium", "fe": "Medium", "om": "Low", "cec": "Medium", "mn": "Medium", "cu": "Medium", "mo": "Low", "cl": "Low", "ni": "Low", "c": "Medium", "h": "Medium", "o": "Medium"}'::jsonb),
  (9, 'Old Brahmaputra Floodplain', 'পুরাতন ব্রহ্মপুত্র বন্যার সমভূমি', 24.5, 90.5, 'Non-calcareous Dark Gray Floodplain soils', 'Silty clay loams', 'Medium Highland to Highland', '5.5 - 7.2', '{"n": "Low", "p": "Low", "k": "Low", "s": "Medium", "zn": "Medium", "b": "Medium", "ca": "Medium", "mg": "High", "fe": "Medium", "om": "Medium", "cec": "High", "mn": "High", "cu": "Medium", "mo": "Medium", "cl": "Medium", "ni": "Medium", "c": "High", "h": "Medium", "o": "Medium"}'::jsonb),
  (10, 'Active Ganges Floodplain', 'সক্রিয় গঙ্গা বন্যার সমভূমি', 24.0, 89.2, 'Calcareous Alluvium', 'Silty and sandy alluvium', 'Medium Highland to Lowland', '7.0 - 8.2 (Alkaline)', '{"n": "Low", "p": "Medium", "k": "High", "s": "Low", "zn": "Medium", "b": "Low", "ca": "High", "mg": "High", "fe": "Low", "om": "Low", "cec": "Medium", "mn": "Low", "cu": "Medium", "mo": "Low", "cl": "Very High", "ni": "Low", "c": "Low", "h": "Medium", "o": "Medium"}'::jsonb),
  (11, 'High Ganges River Floodplain', 'উচ্চ গঙ্গা নদী বন্যার সমভূমি', 23.8, 89.0, 'Calcareous Brown/Gray Floodplain soils', 'Silt loams to silty clay loams', 'Highland and Medium Highland', '7.0 - 8.5', '{"n": "Low", "p": "Medium", "k": "Medium", "s": "Low", "zn": "Medium", "b": "Low", "ca": "High", "mg": "High", "fe": "Low", "om": "Medium", "cec": "Medium", "mn": "Low", "cu": "Medium", "mo": "Low", "cl": "High", "ni": "Low", "c": "Medium", "h": "Medium", "o": "Medium"}'::jsonb),
  (12, 'Low Ganges River Floodplain', 'নিম্ন গঙ্গা নদী বন্যার সমভূমি', 23.5, 90.0, 'Calcareous Dark Gray Floodplain soils', 'Heavy silty clays', 'Medium Lowland and Lowland', '7.2 - 8.0', '{"n": "Low", "p": "Medium", "k": "High", "s": "Low", "zn": "Medium", "b": "Low", "ca": "High", "mg": "High", "fe": "Low", "om": "Medium", "cec": "High", "mn": "Low", "cu": "Medium", "mo": "Low", "cl": "High", "ni": "Low", "c": "Medium", "h": "Medium", "o": "Medium"}'::jsonb),
  (13, 'Ganges Tidal Floodplain', 'গঙ্গা জোয়ার-ভাটার সমভূমি', 22.5, 89.8, 'Non-calcareous Gray Floodplain soils', 'Silty clays', 'Medium Highland', '6.0 - 8.0', '{"n": "Low", "p": "Medium", "k": "High", "s": "High", "zn": "Low", "b": "Low", "ca": "High", "mg": "High", "fe": "Low", "om": "High", "cec": "Very High", "mn": "Medium", "cu": "Medium", "mo": "Medium", "cl": "Very High", "ni": "Low", "c": "High", "h": "Medium", "o": "Medium"}'::jsonb),
  (14, 'Gopalganj-Khulna Bils', 'গোপালগঞ্জ-খুলনা বিল', 23.1, 89.9, 'Peat and Muck', 'Organic materials and Clays', 'Very Lowland', '4.5 - 5.5', '{"n": "High", "p": "Low", "k": "Low", "s": "High", "zn": "Low", "b": "Low", "ca": "Low", "mg": "Medium", "fe": "High", "om": "Very High", "cec": "Very High", "mn": "Medium", "cu": "Low", "mo": "Low", "cl": "Medium", "ni": "Low", "c": "Very High", "h": "Medium", "o": "Medium"}'::jsonb),
  (15, 'Arial Bil', 'আড়িয়াল বিল', 23.6, 90.2, 'Acid Basin Clays', 'Clays', 'Lowland', '5.2 - 6.0', '{"n": "Medium", "p": "Low", "k": "Medium", "s": "Medium", "zn": "Low", "b": "Low", "ca": "Low", "mg": "Medium", "fe": "High", "om": "High", "cec": "High", "mn": "High", "cu": "Low", "mo": "Medium", "cl": "Low", "ni": "Low", "c": "High", "h": "Medium", "o": "Medium"}'::jsonb),
  (16, 'Middle Meghna River Floodplain', 'মধ্য মেঘনা নদী বন্যার সমভূমি', 23.6, 90.8, 'Non-calcareous Gray Floodplain soils', 'Silty clay loams', 'Medium Highland and Lowland', '5.5 - 6.5', '{"n": "Low", "p": "Low", "k": "Low", "s": "Low", "zn": "Medium", "b": "Low", "ca": "Medium", "mg": "Medium", "fe": "High", "om": "Low", "cec": "Medium", "mn": "Medium", "cu": "Low", "mo": "Low", "cl": "Low", "ni": "Low", "c": "Low", "h": "Medium", "o": "Medium"}'::jsonb),
  (17, 'Lower Meghna River Floodplain', 'নিম্ন মেঘনা নদী বন্যার সমভূমি', 23.0, 90.7, 'Calcareous Alluvium', 'Silts', 'Medium Lowland', '7.0 - 8.0', '{"n": "Low", "p": "Medium", "k": "Medium", "s": "Low", "zn": "Medium", "b": "Low", "ca": "High", "mg": "High", "fe": "Low", "om": "Low", "cec": "Medium", "mn": "Low", "cu": "Medium", "mo": "Low", "cl": "High", "ni": "Low", "c": "Low", "h": "Medium", "o": "Medium"}'::jsonb),
  (18, 'Young Meghna Estuarine Floodplain', 'নবীন মেঘনা মোহনা বন্যার সমভূমি', 22.5, 91.0, 'Non-calcareous Alluvium', 'Silts and Sands', 'Medium Highland and Lowland', '6.5 - 7.5', '{"n": "Low", "p": "Medium", "k": "Medium", "s": "High", "zn": "Low", "b": "Low", "ca": "High", "mg": "High", "fe": "Low", "om": "Low", "cec": "Low", "mn": "Low", "cu": "Low", "mo": "Low", "cl": "High", "ni": "Low", "c": "Low", "h": "Medium", "o": "Medium"}'::jsonb),
  (19, 'Old Meghna Estuarine Floodplain', 'পুরাতন মেঘনা মোহনা বন্যার সমভূমি', 23.0, 91.2, 'Non-calcareous Dark Gray Floodplain soils', 'Silt loams to silty clays', 'Medium Highland', '5.2 - 6.8', '{"n": "Low", "p": "Low", "k": "Medium", "s": "Medium", "zn": "Medium", "b": "Medium", "ca": "Medium", "mg": "High", "fe": "Medium", "om": "Medium", "cec": "High", "mn": "High", "cu": "Medium", "mo": "Medium", "cl": "Medium", "ni": "Medium", "c": "High", "h": "Medium", "o": "Medium"}'::jsonb),
  (20, 'Eastern Surma-Kusiyara Floodplain', 'পূর্ব সুরমা-কুশিয়ারা বন্যার সমভূমি', 24.8, 91.8, 'Non-calcareous Gray Floodplain soils', 'Silty clay loams', 'Medium Lowland and Lowland', '5.0 - 6.2', '{"n": "Low", "p": "Low", "k": "Low", "s": "Low", "zn": "Medium", "b": "Low", "ca": "Low", "mg": "Medium", "fe": "High", "om": "Medium", "cec": "High", "mn": "High", "cu": "Low", "mo": "Medium", "cl": "Low", "ni": "Low", "c": "Medium", "h": "Medium", "o": "Medium"}'::jsonb),
  (21, 'Sylhet Basin', 'সিলেট অববাহিকা', 24.6, 91.4, 'Acid Basin Clays', 'Heavy Clays', 'Lowland and Very Lowland', '4.5 - 5.5', '{"n": "Low", "p": "Low", "k": "Medium", "s": "Medium", "zn": "Low", "b": "Low", "ca": "Low", "mg": "Medium", "fe": "High", "om": "High", "cec": "Very High", "mn": "Medium", "cu": "Low", "mo": "Low", "cl": "Medium", "ni": "Low", "c": "High", "h": "Medium", "o": "Medium"}'::jsonb),
  (22, 'Northern and Eastern Piedmont Plains', 'উত্তর ও পূর্ব পাদদেশীয় সমভূমি', 25.1, 91.0, 'Non-calcareous Gray Floodplain soils', 'Sandy loams to silts', 'Medium Highland', '4.8 - 6.0', '{"n": "Low", "p": "Low", "k": "Low", "s": "Low", "zn": "Medium", "b": "Low", "ca": "Low", "mg": "Medium", "fe": "High", "om": "Low", "cec": "Medium", "mn": "High", "cu": "Low", "mo": "Low", "cl": "Low", "ni": "Low", "c": "Low", "h": "Medium", "o": "Medium"}'::jsonb),
  (23, 'Chittagong Coastal Plain', 'চট্টগ্রাম উপকূলীয় সমভূমি', 22.4, 91.8, 'Non-calcareous Gray Floodplain soils', 'Silty clay loams', 'Medium Highland', '5.5 - 7.0', '{"n": "Low", "p": "Medium", "k": "Medium", "s": "Medium", "zn": "Medium", "b": "Low", "ca": "Medium", "mg": "Medium", "fe": "Medium", "om": "Medium", "cec": "Medium", "mn": "Medium", "cu": "Medium", "mo": "Low", "cl": "High", "ni": "Low", "c": "Medium", "h": "Medium", "o": "Medium"}'::jsonb),
  (24, 'St. Martin''s Coral Island', 'সেন্টমার্টিন প্রবাল দ্বীপ', 20.6, 92.3, 'Calcareous Sandy Soils', 'Sands', 'Island', '7.5 - 8.5', '{"n": "Very Low", "p": "Very Low", "k": "Very Low", "s": "Low", "zn": "Low", "b": "High", "ca": "Very High", "mg": "Very High", "fe": "Very Low", "om": "Very Low", "cec": "Low", "mn": "Very Low", "cu": "Very Low", "mo": "Low", "cl": "Very High", "ni": "Low", "c": "Very Low", "h": "Medium", "o": "Medium"}'::jsonb),
  (25, 'Level Barind Tract', 'সমতল বরেন্দ্র ভূমি', 24.8, 88.8, 'Shallow Gray Terrace soils', 'Silty clay loams', 'Medium Highland', '5.5 - 6.2', '{"n": "Very Low", "p": "Low", "k": "Very Low", "s": "Low", "zn": "Low", "b": "Low", "ca": "Low", "mg": "Low", "fe": "High", "om": "Very Low", "cec": "Low", "mn": "High", "cu": "Low", "mo": "Low", "cl": "Low", "ni": "Low", "c": "Very Low", "h": "Medium", "o": "Medium"}'::jsonb),
  (26, 'High Barind Tract', 'উচ্চ বরেন্দ্র ভূমি', 24.5, 88.4, 'Deep Gray Terrace soils', 'Silty clay loams', 'Highland', '5.2 - 6.0', '{"n": "Very Low", "p": "Low", "k": "Very Low", "s": "Low", "zn": "Low", "b": "Low", "ca": "Low", "mg": "Low", "fe": "High", "om": "Very Low", "cec": "Low", "mn": "High", "cu": "Low", "mo": "Low", "cl": "Low", "ni": "Low", "c": "Very Low", "h": "Medium", "o": "Medium"}'::jsonb),
  (27, 'North-eastern Barind Tract', 'উত্তর-পূর্ব বরেন্দ্র ভূমি', 25.2, 89.0, 'Deep Gray Terrace soils', 'Silty clay loams', 'Medium Highland', '5.0 - 5.8', '{"n": "Very Low", "p": "Low", "k": "Low", "s": "Low", "zn": "Low", "b": "Low", "ca": "Low", "mg": "Low", "fe": "High", "om": "Low", "cec": "Medium", "mn": "High", "cu": "Low", "mo": "Low", "cl": "Medium", "ni": "Low", "c": "Low", "h": "Medium", "o": "Medium"}'::jsonb),
  (28, 'Madhupur Tract', 'মধুপুর ভূমি', 24.1, 90.4, 'Shallow/Deep Red-Brown Terrace soils', 'Clay loams to clays', 'Highland to Medium Highland', '5.0 - 6.0', '{"n": "Low", "p": "Low", "k": "Low", "s": "Low", "zn": "Low", "b": "Low", "ca": "Low", "mg": "Low", "fe": "Very High", "om": "Low", "cec": "Medium", "mn": "High", "cu": "Low", "mo": "Low", "cl": "Low", "ni": "Low", "c": "Low", "h": "Medium", "o": "Medium"}'::jsonb),
  (29, 'Northern and Eastern Hills', 'উত্তর ও পূর্ব পাহাড়ি এলাকা', 23.0, 92.0, 'Brown Hill soils', 'Sandy loams to silt loams', 'Hills', '4.5 - 5.2', '{"n": "Low", "p": "Low", "k": "Low", "s": "Low", "zn": "Low", "b": "Low", "ca": "Very Low", "mg": "Low", "fe": "High", "om": "Medium", "cec": "Low", "mn": "Medium", "cu": "Low", "mo": "Low", "cl": "Medium", "ni": "Low", "c": "Medium", "h": "Medium", "o": "Medium"}'::jsonb),
  (30, 'Akhaura Terrace', 'আখাউড়া টেরেস', 23.8, 91.2, 'Deep Red-Brown Terrace soils', 'Silty clay loams', 'Highland', '4.8 - 5.5', '{"n": "Low", "p": "Low", "k": "Low", "s": "Low", "zn": "Low", "b": "Low", "ca": "Low", "mg": "Low", "fe": "High", "om": "Low", "cec": "Medium", "mn": "High", "cu": "Low", "mo": "Low", "cl": "Low", "ni": "Low", "c": "Low", "h": "Medium", "o": "Medium"}'::jsonb)
ON CONFLICT (id) DO NOTHING;
