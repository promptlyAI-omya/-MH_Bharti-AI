-- =====================================================
-- MH_Bharti AI - Supabase Database Schema
-- महाराष्ट्राचं स्वतःचं Exam Prep AI
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────
-- ENUM Types
-- ─────────────────────────────────────────────────────

CREATE TYPE plan_type AS ENUM ('free', 'premium');
CREATE TYPE exam_type AS ENUM ('police', 'mpsc', 'talathi', 'gramsevak');
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');

-- ─────────────────────────────────────────────────────
-- 1. USERS TABLE
-- ─────────────────────────────────────────────────────

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT UNIQUE,
  plan plan_type DEFAULT 'free' NOT NULL,
  ai_credits INTEGER DEFAULT 3 NOT NULL,
  daily_question_count INTEGER DEFAULT 0 NOT NULL,
  last_reset_date DATE DEFAULT CURRENT_DATE NOT NULL,
  streak_count INTEGER DEFAULT 0,
  last_active_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS for users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────────────
-- 2. QUESTIONS TABLE
-- ─────────────────────────────────────────────────────

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam exam_type NOT NULL,
  topic TEXT NOT NULL,
  subtopic TEXT,
  question_marathi TEXT NOT NULL,
  question_hindi TEXT,
  options JSONB NOT NULL,          -- {"a": "...", "b": "...", "c": "...", "d": "..."}
  correct_answer TEXT NOT NULL,     -- "a", "b", "c", or "d"
  explanation TEXT,
  explanation_marathi TEXT,
  difficulty difficulty_level DEFAULT 'medium' NOT NULL,
  is_premium BOOLEAN DEFAULT FALSE,
  year TEXT,                        -- exam year if from past papers
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for fast query
CREATE INDEX idx_questions_exam ON questions(exam);
CREATE INDEX idx_questions_topic ON questions(topic);
CREATE INDEX idx_questions_exam_topic ON questions(exam, topic);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_premium ON questions(is_premium);

-- RLS for questions (public read)
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read questions"
  ON questions FOR SELECT
  USING (true);

-- ─────────────────────────────────────────────────────
-- 3. RESULTS TABLE
-- ─────────────────────────────────────────────────────

CREATE TABLE results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exam exam_type NOT NULL,
  topic TEXT NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  wrong_answers INTEGER NOT NULL,
  time_taken_seconds INTEGER,
  is_mock_test BOOLEAN DEFAULT FALSE,
  date TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_results_user ON results(user_id);
CREATE INDEX idx_results_user_date ON results(user_id, date DESC);
CREATE INDEX idx_results_user_topic ON results(user_id, topic);

-- RLS
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own results"
  ON results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own results"
  ON results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────
-- 4. AI_CACHE TABLE
-- ─────────────────────────────────────────────────────

CREATE TABLE ai_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_hash TEXT UNIQUE NOT NULL,
  question_text TEXT NOT NULL,
  response TEXT NOT NULL,
  model_used TEXT NOT NULL,
  hit_count INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_accessed TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_ai_cache_hash ON ai_cache(question_hash);
CREATE INDEX idx_ai_cache_hits ON ai_cache(hit_count DESC);

-- RLS (server-side only, no public access)
ALTER TABLE ai_cache ENABLE ROW LEVEL SECURITY;

-- No public policies — accessed via service role key only

-- ─────────────────────────────────────────────────────
-- 5. SUBSCRIPTIONS TABLE
-- ─────────────────────────────────────────────────────

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan plan_type NOT NULL DEFAULT 'premium',
  razorpay_payment_id TEXT,
  razorpay_subscription_id TEXT,
  amount INTEGER NOT NULL,           -- in paise (9900 = ₹99)
  start_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_active ON subscriptions(user_id, is_active);

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────
-- HELPER FUNCTION: Reset daily credits
-- ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION reset_daily_credits()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_reset_date < CURRENT_DATE THEN
    NEW.last_reset_date = CURRENT_DATE;
    NEW.daily_question_count = 0;
    IF NEW.plan = 'free' THEN
      NEW.ai_credits = 3;
    ELSE
      NEW.ai_credits = 50;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reset_credits_on_access
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION reset_daily_credits();
