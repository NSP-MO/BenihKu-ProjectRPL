-- Check if the total column exists, if not, add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'orders'
        AND column_name = 'total'
    ) THEN
        ALTER TABLE orders ADD COLUMN total DECIMAL(10, 2) DEFAULT 0;
        
        -- Update the total based on the sum of order items
        UPDATE orders o
        SET total = (
            SELECT COALESCE(SUM(oi.subtotal), 0)
            FROM order_items oi
            WHERE oi.order_id = o.id
        );
    END IF;
END $$;
