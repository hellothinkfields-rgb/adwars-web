-- Add charity fields to brands
ALTER TABLE brands ADD COLUMN IF NOT EXISTS charity_name TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS charity_url TEXT;

-- Link brands to Supabase auth users
ALTER TABLE brands ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Allow authenticated users to update their own brand
CREATE POLICY IF NOT EXISTS "Users can update their own brand"
  ON brands FOR UPDATE
  USING (auth.uid() = user_id);

-- Index for fast user → brand lookup
CREATE INDEX IF NOT EXISTS brands_user_id_idx ON brands(user_id);
