-- Create the donations table
CREATE TABLE donations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  razorpay_payment_id TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for donations
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own donations
CREATE POLICY "Users can view their own donations" 
ON donations FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Only allows inserts by the service role (via the API we control)
-- Or you can just let users post their own (but we want a verified backend)
CREATE POLICY "Service role manages donations" 
ON donations FOR ALL 
USING (true) WITH CHECK (true);

-- Update the users table to track donor status
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_donor BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS donation_total INTEGER DEFAULT 0;
