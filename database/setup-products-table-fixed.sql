-- PetVerse Products Table Setup Script (Fixed)
-- Run this in your Supabase SQL Editor to ensure proper table structure

-- Check if products table exists and create if needed
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products') THEN
        CREATE TABLE products (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
            stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
            category VARCHAR(100) DEFAULT 'General',
            image_url TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    END IF;
END
$$;

-- Add missing columns only if they don't exist
DO $$
BEGIN
    -- Add category column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'category') THEN
        ALTER TABLE products ADD COLUMN category VARCHAR(100) DEFAULT 'General';
    END IF;
    
    -- Add image_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'image_url') THEN
        ALTER TABLE products ADD COLUMN image_url TEXT;
    END IF;
    
    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_active') THEN
        ALTER TABLE products ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    -- Add description column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'description') THEN
        ALTER TABLE products ADD COLUMN description TEXT;
    END IF;
    
    -- Add stock_quantity column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'stock_quantity') THEN
        ALTER TABLE products ADD COLUMN stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0);
    END IF;
END
$$;

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public read access" ON products;
DROP POLICY IF EXISTS "Allow public write access" ON products;
DROP POLICY IF EXISTS "Public read access" ON products;
DROP POLICY IF EXISTS "Public write access" ON products;

-- Create policies for public access (adjust for production security)
CREATE POLICY "Public read access" ON products
    FOR SELECT USING (true);

CREATE POLICY "Public write access" ON products
    FOR ALL USING (true);

-- Update existing products to have default values for new columns
UPDATE products 
SET 
    category = COALESCE(category, 'General'),
    is_active = COALESCE(is_active, true)
WHERE category IS NULL OR is_active IS NULL;

-- Add some sample data if table is empty
INSERT INTO products (name, description, price, stock_quantity, category, image_url, is_active)
SELECT 
    'Premium Dog Food',
    'High-quality nutrition for all dog breeds',
    29.99,
    50,
    'Food',
    'https://placehold.co/200x200/png?text=Dog+Food',
    true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Premium Dog Food');

INSERT INTO products (name, description, price, stock_quantity, category, image_url, is_active)
SELECT 
    'Cat Toy Mouse',
    'Interactive toy mouse for cats',
    12.99,
    25,
    'Toys',
    'https://placehold.co/200x200/png?text=Cat+Toy',
    true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Cat Toy Mouse');

INSERT INTO products (name, description, price, stock_quantity, category, image_url, is_active)
SELECT 
    'Pet Collar',
    'Adjustable collar for dogs and cats',
    15.99,
    30,
    'Accessories',
    'https://placehold.co/200x200/png?text=Pet+Collar',
    true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Pet Collar');

-- Show current table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

-- Show current data
SELECT id, name, price, stock_quantity, category, is_active 
FROM products 
WHERE is_active = true 
ORDER BY created_at DESC
LIMIT 10;
