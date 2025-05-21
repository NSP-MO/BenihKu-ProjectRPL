-- Create a table to store application settings
CREATE TABLE IF NOT EXISTS app_settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optional: Add RLS policies if needed (adjust based on your app's security model)
-- For now, assuming admin access via service_role key for simplicity in backend functions.

-- Insert the initial setting for homepage product limit
INSERT INTO app_settings (key, value, description)
VALUES ('homepage_product_limit', '6', 'Number of popular products to display on the homepage')
ON CONFLICT (key) DO NOTHING;

-- Function to update a setting
CREATE OR REPLACE FUNCTION update_app_setting(setting_key TEXT, new_value TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO app_settings (key, value, updated_at)
  VALUES (setting_key, new_value, NOW())
  ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value,
      updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- Use SECURITY DEFINER if you call this from RLS-restricted contexts with a specific role

-- Function to get a setting value
CREATE OR REPLACE FUNCTION get_app_setting(setting_key TEXT)
RETURNS TEXT AS $$
DECLARE
  setting_value TEXT;
BEGIN
  SELECT value INTO setting_value FROM app_settings WHERE key = setting_key;
  RETURN setting_value;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create a trigger to automatically update 'updated_at'
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_app_settings_timestamp ON app_settings; -- Drop if exists to avoid error on re-run
CREATE TRIGGER set_app_settings_timestamp
BEFORE UPDATE ON app_settings
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Grant usage on functions to anon and authenticated roles if you intend to call them directly from client-side
-- GRANT EXECUTE ON FUNCTION get_app_setting(TEXT) TO anon;
-- GRANT EXECUTE ON FUNCTION get_app_setting(TEXT) TO authenticated;
-- For updating, it's safer to do it via server-side functions/edge functions.

-- Ensure products table and is_popular column exist as per previous context
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT FALSE;
