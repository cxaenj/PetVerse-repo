-- SQL commands to fix the products table structure
-- Run these in your Supabase SQL Editor

-- First, let's check if the products table exists and what columns it has
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

-- Add the category column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' AND column_name = 'category') THEN
        ALTER TABLE products ADD COLUMN category VARCHAR(100) DEFAULT 'General';
    END IF;
END $$;

-- Ensure the table structure is correct
ALTER TABLE products 
    ALTER COLUMN name SET NOT NULL,
    ALTER COLUMN price SET NOT NULL,
    ALTER COLUMN stock_quantity SET NOT NULL,
    ALTER COLUMN is_active SET DEFAULT true;

-- Add some sample data for testing if the table is empty
INSERT INTO products (name, description, price, stock_quantity, category, image_url, is_active)
SELECT 'Sample Dog Food', 'Premium dog food for testing', 29.99, 100, 'Food', 'https://placehold.co/200x200/png?text=Dog+Food', true
WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1);

-- Enable Row Level Security (RLS) and create policy for public access
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access" ON products;
DROP POLICY IF EXISTS "Allow public write access" ON products;

-- Create policies for public access (adjust as needed for your security requirements)
CREATE POLICY "Allow public read access" ON products
    FOR SELECT USING (true);

CREATE POLICY "Allow public write access" ON products
    FOR ALL USING (true);

-- Verify the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;
