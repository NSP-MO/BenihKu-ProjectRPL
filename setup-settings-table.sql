CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tambahkan pengaturan untuk menampilkan produk draft (default: false)
INSERT INTO settings (key, value)
VALUES ('show_draft_products', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Pastikan tabel produk memiliki kolom 'published'
-- Jika belum ada, jalankan SQL berikut (sesuaikan jika perlu):
-- ALTER TABLE products
-- ADD COLUMN published BOOLEAN DEFAULT FALSE;
