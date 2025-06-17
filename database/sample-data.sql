-- PetVerse Database Migration Script with Sample Data
-- Execute this in your Supabase SQL Editor after running the main schema.sql

-- Insert sample pet categories
INSERT INTO pet_categories (name, description) VALUES
('Dogs', 'Domestic dogs of all breeds and sizes'),
('Cats', 'Domestic cats and felines'),
('Birds', 'Pet birds including parrots, canaries, and finches'),
('Fish', 'Aquarium fish and aquatic pets'),
('Small Animals', 'Rabbits, hamsters, guinea pigs, and other small pets'),
('Reptiles', 'Snakes, lizards, turtles, and other reptiles')
ON CONFLICT (name) DO NOTHING;

-- Insert sample users (customers and admin)
INSERT INTO users (email, password_hash, full_name, user_type, phone, address) VALUES
('admin@petverse.com', '$2b$10$xF5tGzj8j9mH2kL4n6pQ.eY8dHfR2sM7wJ3nB9vA1cK5xE8tF2gH', 'Admin User', 'admin', '+1-555-0001', '123 Admin Street, Pet City, PC 12345'),
('john.doe@email.com', '$2b$10$xF5tGzj8j9mH2kL4n6pQ.eY8dHfR2sM7wJ3nB9vA1cK5xE8tF2gH', 'John Doe', 'customer', '+1-555-0101', '456 Oak Avenue, Pet Town, PT 67890'),
('jane.smith@email.com', '$2b$10$xF5tGzj8j9mH2kL4n6pQ.eY8dHfR2sM7wJ3nB9vA1cK5xE8tF2gH', 'Jane Smith', 'customer', '+1-555-0102', '789 Pine Street, Animal City, AC 11111'),
('mike.johnson@email.com', '$2b$10$xF5tGzj8j9mH2kL4n6pQ.eY8dHfR2sM7wJ3nB9vA1cK5xE8tF2gH', 'Mike Johnson', 'customer', '+1-555-0103', '321 Elm Drive, Pet Village, PV 22222'),
('sarah.wilson@email.com', '$2b$10$xF5tGzj8j9mH2kL4n6pQ.eY8dHfR2sM7wJ3nB9vA1cK5xE8tF2gH', 'Sarah Wilson', 'customer', '+1-555-0104', '654 Maple Lane, Furry Heights, FH 33333')
ON CONFLICT (email) DO NOTHING;

-- Get category IDs for reference
DO $$
DECLARE
    dog_category_id UUID;
    cat_category_id UUID;
    bird_category_id UUID;
    fish_category_id UUID;
    small_category_id UUID;
    admin_user_id UUID;
    john_user_id UUID;
    jane_user_id UUID;
    mike_user_id UUID;
    sarah_user_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO dog_category_id FROM pet_categories WHERE name = 'Dogs';
    SELECT id INTO cat_category_id FROM pet_categories WHERE name = 'Cats';
    SELECT id INTO bird_category_id FROM pet_categories WHERE name = 'Birds';
    SELECT id INTO fish_category_id FROM pet_categories WHERE name = 'Fish';
    SELECT id INTO small_category_id FROM pet_categories WHERE name = 'Small Animals';
    
    -- Get user IDs
    SELECT id INTO admin_user_id FROM users WHERE email = 'admin@petverse.com';
    SELECT id INTO john_user_id FROM users WHERE email = 'john.doe@email.com';
    SELECT id INTO jane_user_id FROM users WHERE email = 'jane.smith@email.com';
    SELECT id INTO mike_user_id FROM users WHERE email = 'mike.johnson@email.com';
    SELECT id INTO sarah_user_id FROM users WHERE email = 'sarah.wilson@email.com';

    -- Insert sample products
    INSERT INTO products (name, description, category_id, price, stock_quantity, sku, is_active) VALUES
    ('Premium Dog Food (25lb)', 'High-quality nutrition for adult dogs', dog_category_id, 49.99, 25, 'PDF-001', true),
    ('Cat Litter (20lb)', 'Clumping clay litter for cats', cat_category_id, 15.99, 40, 'CLT-001', true),
    ('Dog Collar (Medium)', 'Adjustable collar for medium dogs', dog_category_id, 12.99, 30, 'DCL-001', true),
    ('Cat Treats (Salmon)', 'Delicious salmon-flavored treats', cat_category_id, 8.99, 50, 'CTR-001', true),
    ('Bird Seed Mix', 'Nutritious seed blend for birds', bird_category_id, 19.99, 15, 'BSM-001', true),
    ('Fish Tank Filter', 'Advanced filtration system', fish_category_id, 35.99, 8, 'FTF-001', true),
    ('Dog Leash (6ft)', 'Durable nylon leash', dog_category_id, 18.99, 22, 'DLS-001', true),
    ('Cat Toy Mouse', 'Interactive feather mouse toy', cat_category_id, 6.99, 45, 'CTM-001', true),
    ('Pet Carrier (Large)', 'Airline-approved pet carrier', dog_category_id, 89.99, 5, 'PTC-001', true),
    ('Aquarium Heater', '50W adjustable heater', fish_category_id, 24.99, 12, 'AQH-001', true)
    ON CONFLICT (sku) DO NOTHING;
    
    -- Insert sample pets
    INSERT INTO pets (name, species, breed, age_years, age_months, gender, color, weight_kg, owner_id, health_status, vaccination_status) VALUES
    ('Buddy', 'Dog', 'Golden Retriever', 3, 6, 'Male', 'Golden', 28.5, john_user_id, 'Healthy', 'Up to date'),
    ('Whiskers', 'Cat', 'Persian', 2, 3, 'Female', 'White', 4.2, jane_user_id, 'Healthy', 'Up to date'),
    ('Charlie', 'Dog', 'Labrador', 5, 0, 'Male', 'Black', 32.1, mike_user_id, 'Healthy', 'Due for booster'),
    ('Luna', 'Cat', 'Siamese', 1, 8, 'Female', 'Cream', 3.8, sarah_user_id, 'Healthy', 'Up to date'),
    ('Max', 'Dog', 'German Shepherd', 4, 2, 'Male', 'Brown & Black', 35.6, john_user_id, 'Minor injury', 'Up to date'),
    ('Bella', 'Cat', 'Maine Coon', 6, 0, 'Female', 'Gray', 5.5, jane_user_id, 'Healthy', 'Up to date'),
    ('Rocky', 'Dog', 'Bulldog', 2, 10, 'Male', 'Brindle', 22.3, mike_user_id, 'Healthy', 'Up to date'),
    ('Mia', 'Cat', 'British Shorthair', 3, 4, 'Female', 'Blue', 4.8, sarah_user_id, 'Healthy', 'Up to date')
    ON CONFLICT DO NOTHING;
    
    -- Insert sample appointments (upcoming)
    INSERT INTO appointments (pet_id, owner_id, appointment_date, appointment_type, status, notes, cost) VALUES
    ((SELECT id FROM pets WHERE name = 'Buddy' LIMIT 1), john_user_id, '2025-06-20 10:00:00+00', 'Annual Checkup', 'scheduled', 'Routine annual examination', 85.00),
    ((SELECT id FROM pets WHERE name = 'Whiskers' LIMIT 1), jane_user_id, '2025-06-21 14:30:00+00', 'Vaccination', 'scheduled', 'Annual vaccination booster', 45.00),
    ((SELECT id FROM pets WHERE name = 'Charlie' LIMIT 1), mike_user_id, '2025-06-22 11:15:00+00', 'Grooming', 'scheduled', 'Full grooming service', 65.00),
    ((SELECT id FROM pets WHERE name = 'Luna' LIMIT 1), sarah_user_id, '2025-06-23 15:45:00+00', 'Dental Cleaning', 'scheduled', 'Professional dental cleaning', 120.00),
    ((SELECT id FROM pets WHERE name = 'Max' LIMIT 1), john_user_id, '2025-06-24 09:30:00+00', 'Follow-up', 'scheduled', 'Check healing progress', 50.00)
    ON CONFLICT DO NOTHING;
    
    -- Insert sample sales
    INSERT INTO sales (customer_id, total_amount, payment_method, payment_status, sale_date, notes) VALUES
    (john_user_id, 62.98, 'credit_card', 'completed', '2025-06-15 10:30:00+00', 'Dog food and collar purchase'),
    (jane_user_id, 24.98, 'cash', 'completed', '2025-06-15 14:15:00+00', 'Cat litter and treats'),
    (mike_user_id, 108.98, 'credit_card', 'completed', '2025-06-16 11:45:00+00', 'Pet carrier and leash'),
    (sarah_user_id, 31.98, 'debit_card', 'completed', '2025-06-16 16:20:00+00', 'Cat toys and treats'),
    (john_user_id, 89.99, 'credit_card', 'completed', '2025-06-17 09:15:00+00', 'Pet carrier for Max')
    ON CONFLICT DO NOTHING;

END $$;

-- Create some recent sale items (this requires the sales to exist first)
INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price)
SELECT 
    s.id as sale_id,
    p.id as product_id,
    1 as quantity,
    p.price as unit_price,
    p.price as total_price
FROM sales s
CROSS JOIN products p
WHERE s.total_amount > 50 AND p.price < 50
LIMIT 10
ON CONFLICT DO NOTHING;

-- Insert pet services
INSERT INTO pet_services (name, description, base_price, duration_minutes, category) VALUES
('Basic Grooming', 'Bath, brush, nail trim', 45.00, 60, 'grooming'),
('Full Grooming', 'Bath, brush, nail trim, ear cleaning, teeth brushing', 65.00, 90, 'grooming'),
('Nail Trim Only', 'Quick nail trimming service', 15.00, 15, 'grooming'),
('Dental Cleaning', 'Professional dental cleaning under anesthesia', 120.00, 120, 'medical'),
('Vaccination Package', 'Annual vaccination series', 45.00, 30, 'medical'),
('Health Checkup', 'Comprehensive health examination', 85.00, 45, 'medical'),
('Microchip Implant', 'Pet identification microchip', 35.00, 20, 'medical'),
('Flea Treatment', 'Flea prevention and treatment', 25.00, 30, 'medical'),
('Emergency Consultation', 'Urgent medical consultation', 150.00, 60, 'emergency'),
('X-Ray Examination', 'Digital X-ray imaging', 95.00, 30, 'diagnostic')
ON CONFLICT (name) DO NOTHING;

-- Insert some health records
INSERT INTO health_records (pet_id, record_type, description, veterinarian_notes, cost, record_date)
SELECT 
    p.id,
    'vaccination',
    'Annual vaccination booster',
    'All vaccinations administered successfully. Pet showed no adverse reactions.',
    45.00,
    CURRENT_DATE - INTERVAL '6 months'
FROM pets p
WHERE p.vaccination_status = 'Up to date'
LIMIT 5
ON CONFLICT DO NOTHING;

-- Update some statistics for better demo
UPDATE products 
SET stock_quantity = CASE 
    WHEN name LIKE '%Dog Food%' THEN 5
    WHEN name LIKE '%Cat Treats%' THEN 3
    WHEN name LIKE '%Bird Seed%' THEN 2
    WHEN name LIKE '%Fish Tank Filter%' THEN 1
    ELSE stock_quantity
END
WHERE name IN ('Premium Dog Food (25lb)', 'Cat Treats (Salmon)', 'Bird Seed Mix', 'Fish Tank Filter');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pets_owner_id ON pets(owner_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_health_records_pet ON health_records(pet_id);

-- Enable Row Level Security (RLS) - Basic setup
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (you can customize these based on your needs)
CREATE POLICY "Users can read their own data" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Admin can read all users" ON users FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id::text = auth.uid()::text 
        AND user_type = 'admin'
    )
);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ PetVerse sample data migration completed successfully!';
    RAISE NOTICE '📊 Sample data includes:';
    RAISE NOTICE '   - 5 users (1 admin, 4 customers)';
    RAISE NOTICE '   - 6 pet categories';
    RAISE NOTICE '   - 10 products with varying stock levels';
    RAISE NOTICE '   - 8 pets with different owners';
    RAISE NOTICE '   - 5 upcoming appointments';
    RAISE NOTICE '   - 5 completed sales transactions';
    RAISE NOTICE '   - 10 pet services available';
    RAISE NOTICE '   - Sample health records';
    RAISE NOTICE '🔐 Basic Row Level Security enabled';
    RAISE NOTICE '🚀 Your PetVerse database is ready for testing!';
END $$;
