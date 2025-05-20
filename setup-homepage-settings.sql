-- Create homepage_settings table
CREATE TABLE IF NOT EXISTS homepage_settings (
  id SERIAL PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO homepage_settings (setting_key, setting_value)
VALUES ('featured_products', '{"product_ids": [], "title": "Tanaman Populer", "description": "Tanaman yang paling banyak dicari oleh pelanggan kami."}')
ON CONFLICT (setting_key) DO NOTHING;
