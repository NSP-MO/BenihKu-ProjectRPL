-- Add avatar fields to profiles table if they don't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_path TEXT;
