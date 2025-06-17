-- PetVerse Database Schema for Supabase
-- Execute these SQL commands in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for authentication and user management
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) CHECK (user_type IN ('customer', 'admin')) DEFAULT 'customer',
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Pet categories table
CREATE TABLE pet_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Products/Inventory table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES pet_categories(id),
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    sku VARCHAR(100) UNIQUE,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Pets table for pet management
CREATE TABLE pets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    species VARCHAR(100) NOT NULL, -- Dog, Cat, Bird, etc.
    breed VARCHAR(100),
    age_years INTEGER CHECK (age_years >= 0),
    age_months INTEGER CHECK (age_months >= 0 AND age_months < 12),
    gender VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Unknown')),
    color VARCHAR(100),
    weight_kg DECIMAL(5, 2) CHECK (weight_kg > 0),
    owner_id UUID REFERENCES users(id),
    health_status VARCHAR(50) DEFAULT 'Healthy',
    vaccination_status VARCHAR(50) DEFAULT 'Up to date',
    microchip_id VARCHAR(50) UNIQUE,
    is_adopted BOOLEAN DEFAULT false,
    adoption_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Veterinary appointments table
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES users(id),
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    appointment_type VARCHAR(100) NOT NULL, -- Checkup, Vaccination, Emergency, etc.
    status VARCHAR(20) CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')) DEFAULT 'scheduled',
    notes TEXT,
    veterinarian_notes TEXT,
    cost DECIMAL(10, 2) CHECK (cost >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sales/Orders table
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES users(id),
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
    payment_method VARCHAR(50) DEFAULT 'cash',
    payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'completed', 'refunded')) DEFAULT 'completed',
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sale items table (for detailed breakdown of sales)
CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Pet care services table
CREATE TABLE pet_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    base_price DECIMAL(10, 2) NOT NULL CHECK (base_price >= 0),
    duration_minutes INTEGER CHECK (duration_minutes > 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Service bookings table
CREATE TABLE service_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID REFERENCES pets(id),
    service_id UUID REFERENCES pet_services(id),
    booking_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')) DEFAULT 'scheduled',
    actual_price DECIMAL(10, 2) CHECK (actual_price >= 0),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Health records table
CREATE TABLE health_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
    record_date DATE NOT NULL,
    record_type VARCHAR(100) NOT NULL, -- Vaccination, Treatment, Checkup, etc.
    description TEXT NOT NULL,
    veterinarian VARCHAR(255),
    medication TEXT,
    next_due_date DATE,
    cost DECIMAL(10, 2) CHECK (cost >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_pets_owner ON pets(owner_id);
CREATE INDEX idx_pets_species ON pets(species);
CREATE INDEX idx_appointments_pet ON appointments(pet_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_date ON sales(sale_date);
CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_health_records_pet ON health_records(pet_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON pets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_bookings_updated_at BEFORE UPDATE ON service_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data

-- Sample pet categories
INSERT INTO pet_categories (name, description) VALUES
('Dog Supplies', 'Food, toys, and accessories for dogs'),
('Cat Supplies', 'Food, toys, and accessories for cats'),
('Bird Supplies', 'Food, cages, and accessories for birds'),
('Fish Supplies', 'Aquarium supplies and fish food'),
('Small Animals', 'Supplies for rabbits, hamsters, etc.'),
('Pet Care', 'Health and grooming products'),
('Veterinary Medicine', 'Medications and medical supplies');

-- Sample products
INSERT INTO products (name, description, category_id, price, stock_quantity, sku) VALUES
('Premium Dog Food (5kg)', 'High-quality dry dog food for adult dogs', 
 (SELECT id FROM pet_categories WHERE name = 'Dog Supplies'), 1200.00, 50, 'DOG-FOOD-001'),
('Cat Litter Box', 'Self-cleaning automatic cat litter box', 
 (SELECT id FROM pet_categories WHERE name = 'Cat Supplies'), 800.00, 25, 'CAT-LITTER-001'),
('Pet Vitamins', 'Daily multivitamin supplements for pets', 
 (SELECT id FROM pet_categories WHERE name = 'Pet Care'), 450.00, 100, 'VIT-MULTI-001'),
('Dog Leash', 'Adjustable nylon dog leash with comfort grip', 
 (SELECT id FROM pet_categories WHERE name = 'Dog Supplies'), 350.00, 75, 'DOG-LEASH-001'),
('Cat Toys Bundle', 'Assorted interactive toys for cats', 
 (SELECT id FROM pet_categories WHERE name = 'Cat Supplies'), 600.00, 40, 'CAT-TOY-001');

-- Sample pet services
INSERT INTO pet_services (name, description, base_price, duration_minutes) VALUES
('Basic Grooming', 'Bath, nail trim, and basic grooming', 500.00, 60),
('Full Grooming Package', 'Complete grooming with styling', 800.00, 120),
('Dental Cleaning', 'Professional dental cleaning service', 1200.00, 90),
('Health Checkup', 'Comprehensive health examination', 600.00, 45),
('Vaccination', 'Standard vaccination service', 300.00, 30);

-- Sample admin user (password should be hashed in real implementation)
INSERT INTO users (email, password_hash, full_name, user_type, phone) VALUES
('admin@petverse.com', '$2a$10$example_hash_here', 'Admin User', 'admin', '+1234567890');
