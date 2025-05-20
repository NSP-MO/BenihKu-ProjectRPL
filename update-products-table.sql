-- Add image_bucket column to products table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'image_bucket'
    ) THEN
        ALTER TABLE products ADD COLUMN image_bucket TEXT;
    END IF;
END $$;
