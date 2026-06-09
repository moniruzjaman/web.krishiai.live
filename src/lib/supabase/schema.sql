-- KrishiAI Supabase Schema — Vercel + Supabase Architecture
-- Free platform with quota tier fallback

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

-- ── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can read own usage" ON usage_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own usage" ON usage_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own messages" ON chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own messages" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can read active alerts" ON crop_alerts FOR SELECT USING (active = TRUE);
