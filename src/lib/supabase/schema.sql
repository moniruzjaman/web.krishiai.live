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
