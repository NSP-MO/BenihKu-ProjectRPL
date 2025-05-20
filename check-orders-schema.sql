-- Check the column names in the orders table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders';
