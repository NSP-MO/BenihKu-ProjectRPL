-- Add default value to total column if it's NULL
UPDATE orders
SET total = 0
WHERE total IS NULL;

-- Alter the column to set a default value and make it NOT NULL
ALTER TABLE orders 
ALTER COLUMN total SET DEFAULT 0,
ALTER COLUMN total SET NOT NULL;
