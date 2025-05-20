-- Add is_published column to products table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'is_published'
    ) THEN
        ALTER TABLE products ADD COLUMN is_published BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Update existing products to be published by default
UPDATE products SET is_published = true WHERE is_published IS NULL;
