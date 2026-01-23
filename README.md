# MediTrack - Pharmacy Inventory Management System

A professional web application for pharmacies to track sales and manage inventory using HTML, CSS, JavaScript, and Supabase for the backend. Features secure multi-pharmacy access with controlled registration.

## Features

- **Secure Multi-Pharmacy Access**: Controlled access through registered pharmacy accounts
- **Role-Based Authentication**: Secure login with username and password
- **Pharmacy Registration**: Admin-managed pharmacy registration system
- **Inventory Management**: Add, edit, and delete products with name, price, quantity, and category
- **Sales Tracking**: Record sales transactions and automatically update inventory
- **Dashboard**: View statistics and low stock alerts
- **Responsive Design**: Works on desktop and mobile devices

## Prerequisites

- A Supabase account (free tier available at [supabase.com](https://supabase.com))

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up for an account
2. Create a new project
3. Wait for the project to be provisioned (this may take a minute)

### 2. Set up the Database Tables

In your Supabase dashboard, go to the SQL Editor and run these SQL commands:

```sql
-- Create pharmacies table to store registered pharmacies
CREATE TABLE pharmacies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Create users table for pharmacy staff authentication
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
  username VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'staff',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(pharmacy_id, username)
);

-- Create products table with pharmacy_id for multi-tenant support
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  category VARCHAR(100),
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales table with pharmacy_id for multi-tenant support
CREATE TABLE sales (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  quantity_sold INTEGER NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  customer_name VARCHAR(255),
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_products_pharmacy ON products(pharmacy_id);
CREATE INDEX idx_sales_pharmacy ON sales(pharmacy_id);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_pharmacies_active ON pharmacies(is_active) WHERE is_active = true;

-- Insert sample pharmacies (optional, for testing)
INSERT INTO pharmacies (name) VALUES 
  ('Sunshine Pharmacy'),
  ('HealthPlus Drugstore'),
  ('Wellness Corner'),
  ('CareFirst Pharmacy');
  
-- Insert sample users (use a strong password hash in production)
-- For testing, you can temporarily use plain text passwords
INSERT INTO users (pharmacy_id, username, password_hash, role) VALUES 
  ((SELECT id FROM pharmacies WHERE name = 'Sunshine Pharmacy'), 'admin', 'temp_password', 'manager'),
  ((SELECT id FROM pharmacies WHERE name = 'HealthPlus Drugstore'), 'staff', 'temp_password', 'staff');
```

### 3. Configure Row Level Security (RLS) - Recommended for Production

For enhanced security, enable Row Level Security in Supabase:

```sql
-- Enable RLS on tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Create policies for data isolation
CREATE POLICY "Users can only access products from their pharmacy" ON products
  FOR ALL USING (pharmacy_id = (SELECT pharmacy_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can only access sales from their pharmacy" ON sales
  FOR ALL USING (pharmacy_id = (SELECT pharmacy_id FROM users WHERE id = auth.uid()));
```

### 4. Configure Your Supabase Credentials

1. In your Supabase dashboard, go to Project Settings
2. Copy your "Project URL" and "Anonymous (anon) key"
3. Open `script.js` in the project folder
4. Replace the placeholders in these lines:

```javascript
const supabaseUrl = 'https://YOUR_PROJECT.supabase.co';  // Replace YOUR_PROJECT with your actual project ID
const supabaseKey = 'YOUR_ANON_KEY';  // Replace with your actual anon key
```

### 5. Run the Application

Open `index.html` in your web browser to start using the application.

## How to Use

1. **Login**: Select your pharmacy from the dropdown, enter your username and password
2. **Add Products**: Use the "Add New Product" form to add items to your inventory
3. **Record Sales**: Select a product and quantity to record a sale
4. **Manage Inventory**: Edit or delete products as needed
5. **View Reports**: Check the Reports tab for inventory statistics and low stock alerts
6. **Logout**: Use the logout button to securely exit

## Security Considerations

- The current implementation stores password hashes in plain text for demonstration
- For production, implement proper password hashing and authentication
- Consider using Supabase Auth instead of a custom users table
- Enable Row Level Security (RLS) to enforce data isolation between pharmacies

## Admin Operations

To add new pharmacies to the system:
1. Access your Supabase dashboard
2. Navigate to the SQL Editor
3. Run an INSERT command on the pharmacies table
4. Add users for the new pharmacy in the users table

## Customization

You can easily customize the application by:
- Adding more product categories in the HTML select element
- Adjusting the low stock threshold (currently set to 5) in the JavaScript code
- Modifying the CSS styles in `styles.css`
- Enhancing the authentication system with proper password encryption

## Support

If you encounter any issues with the setup, please check:
- That your Supabase credentials are correctly entered
- That the database tables were created successfully with the proper relationships
- That your browser isn't blocking certain features
- That the pharmacies table has entries for the dropdown to work