-- Add is_published column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'products'
        AND column_name = 'is_published'
    ) THEN
        ALTER TABLE products ADD COLUMN is_published BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- Update any NULL values to TRUE
UPDATE products SET is_published = TRUE WHERE is_published IS NULL;
