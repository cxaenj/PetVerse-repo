-- Updated Products table schema for simpler category handling
-- Run this in Supabase SQL Editor to add category field

ALTER TABLE products 
ADD COLUMN category VARCHAR(100) DEFAULT 'General';

-- Update existing products to have a default category
UPDATE products 
SET category = 'General' 
WHERE category IS NULL;

-- Add sample categories to make the field more useful
UPDATE products 
SET category = CASE 
    WHEN LOWER(name) LIKE '%food%' OR LOWER(name) LIKE '%treat%' OR LOWER(name) LIKE '%snack%' THEN 'Food'
    WHEN LOWER(name) LIKE '%toy%' OR LOWER(name) LIKE '%ball%' OR LOWER(name) LIKE '%rope%' THEN 'Toys'
    WHEN LOWER(name) LIKE '%collar%' OR LOWER(name) LIKE '%leash%' OR LOWER(name) LIKE '%harness%' THEN 'Accessories'
    WHEN LOWER(name) LIKE '%medicine%' OR LOWER(name) LIKE '%vitamin%' OR LOWER(name) LIKE '%supplement%' THEN 'Medicine'
    WHEN LOWER(name) LIKE '%bed%' OR LOWER(name) LIKE '%house%' OR LOWER(name) LIKE '%crate%' THEN 'Housing'
    WHEN LOWER(name) LIKE '%shampoo%' OR LOWER(name) LIKE '%brush%' OR LOWER(name) LIKE '%grooming%' THEN 'Grooming'
    ELSE 'General'
END;
