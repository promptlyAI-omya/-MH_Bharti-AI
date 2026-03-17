-- database_randomization.sql

-- 1. Create `user_question_history` table
CREATE TABLE IF NOT EXISTS user_question_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  correct BOOLEAN NOT NULL DEFAULT false,
  attempts INTEGER NOT NULL DEFAULT 1,
  UNIQUE(user_id, question_id)
);

-- Note: We add a UNIQUE constraint on (user_id, question_id) 
-- to allow easy UPSERT operations when a user answers a question.
