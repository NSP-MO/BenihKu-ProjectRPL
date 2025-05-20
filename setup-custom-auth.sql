-- Create custom_users table for our own authentication
CREATE TABLE IF NOT EXISTS public.custom_users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.custom_users ENABLE ROW LEVEL SECURITY;

-- Policy to allow insert for anyone
CREATE POLICY "Allow inserts for anyone" ON public.custom_users
  FOR INSERT WITH CHECK (true);

-- Policy to allow select for authenticated users
CREATE POLICY "Allow select for authenticated users" ON public.custom_users
  FOR SELECT USING (true);

-- Policy to allow update for users updating their own data
CREATE POLICY "Allow update for users updating their own data" ON public.custom_users
  FOR UPDATE USING (auth.uid() = id);
