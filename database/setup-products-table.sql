-- PetVerse Products Table Setup Script
-- Run this in your Supabase SQL Editor to ensure proper table structure

-- Create products table if it doesn't exist
CREATE TABLE IF NOT EXISTS products (
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

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public read access" ON products;
DROP POLICY IF EXISTS "Allow public write access" ON products;

-- Create policies for public access (adjust for production security)
CREATE POLICY "Allow public read access" ON products
    FOR SELECT USING (true);

CREATE POLICY "Allow public write access" ON products
    FOR ALL USING (true);

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
WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1);

INSERT INTO products (name, description, price, stock_quantity, category, image_url, is_active)
SELECT 
    'Cat Toy Mouse',
    'Interactive toy mouse for cats',
    12.99,
    25,
    'Toys',
    'https://placehold.co/200x200/png?text=Cat+Toy',
    true
WHERE (SELECT COUNT(*) FROM products) = 1;

INSERT INTO products (name, description, price, stock_quantity, category, image_url, is_active)
SELECT 
    'Pet Collar',
    'Adjustable collar for dogs and cats',
    15.99,
    30,
    'Accessories',
    'https://placehold.co/200x200/png?text=Pet+Collar',
    true
WHERE (SELECT COUNT(*) FROM products) = 2;

-- Verify table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

-- Show sample data
SELECT id, name, price, stock_quantity, category, is_active 
FROM products 
WHERE is_active = true 
LIMIT 5;
