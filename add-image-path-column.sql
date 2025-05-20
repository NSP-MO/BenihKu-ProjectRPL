-- Add image_path column to products table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name = 'image_path'
  ) THEN
      ALTER TABLE products ADD COLUMN image_path TEXT;
  END IF;
END $$;
