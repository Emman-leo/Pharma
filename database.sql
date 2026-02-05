-- Pharmacy Management System Database Schema

-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  price DECIMAL(10,2) NOT NULL,
  expiry_date DATE,
  supplier VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES inventory(id),
  product_name VARCHAR(255) NOT NULL,
  quantity_sold INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  customer_name VARCHAR(255) DEFAULT 'Walk-in Customer'
);

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT
);

-- Insert default categories
INSERT INTO categories (name, description) VALUES 
  ('Prescription Medications', 'Doctor prescribed medications'),
  ('Over-the-Counter', 'Non-prescription medicines'),
  ('Vitamins & Supplements', 'Health supplements and vitamins'),
  ('Personal Care', 'Personal hygiene products'),
  ('Medical Equipment', 'Medical devices and equipment'),
  ('Baby Care', 'Baby and infant products')
ON CONFLICT (name) DO NOTHING;

-- Insert sample inventory data
INSERT INTO inventory (name, category, quantity, price, expiry_date, supplier) VALUES
  ('Paracetamol 500mg', 'Prescription Medications', 100, 2.50, '2025-12-31', 'MediSupply Corp'),
  ('Vitamin C 1000mg', 'Vitamins & Supplements', 50, 8.99, '2026-06-30', 'HealthPlus Ltd'),
  ('Hand Sanitizer', 'Personal Care', 75, 3.25, '2025-08-15', 'CleanCare Inc'),
  ('Blood Pressure Monitor', 'Medical Equipment', 15, 45.00, NULL, 'MedTech Solutions'),
  ('Baby Diapers (Size 2)', 'Baby Care', 200, 12.99, NULL, 'BabyCare Co')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_name ON inventory(name);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
CREATE INDEX IF NOT EXISTS idx_inventory_expiry ON inventory(expiry_date);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);

-- Enable Row Level Security (RLS)
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust as needed for your security requirements)
CREATE POLICY "Enable read access for all users" ON inventory FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON inventory FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON inventory FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON inventory FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON sales FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON sales FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON suppliers FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON suppliers FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON suppliers FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON categories FOR SELECT USING (true);