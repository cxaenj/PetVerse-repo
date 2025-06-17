-- Simple Products Table Check and Test
-- Run this in Supabase SQL Editor to check current status

-- 1. Check if table exists and show structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

-- 2. Check current data
SELECT 
    id, 
    name, 
    price, 
    stock_quantity,
    category,
    is_active,
    created_at
FROM products 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Test insert with minimal data
INSERT INTO products (name, price, stock_quantity, is_active)
VALUES ('Test Product ' || extract(epoch from now()), 19.99, 10, true)
RETURNING id, name, price, stock_quantity;

-- 4. Check Row Level Security policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'products';

-- 5. Test basic operations that the app will use
-- This simulates what the JavaScript code does:

-- Select all active products (what loadInventoryFromSupabase does)
SELECT id, name, description, price, stock_quantity, category, image_url, is_active
FROM products 
WHERE is_active = true
LIMIT 10;

-- Test update operation (what saveProductToSupabase does for existing products)
-- Update the test product we just created
UPDATE products 
SET stock_quantity = 15 
WHERE name LIKE 'Test Product%' 
AND created_at > now() - interval '1 minute'
RETURNING id, name, stock_quantity;
