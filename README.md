# MediTrack - Pharmacy Inventory Management System

A professional web application for pharmacies to track sales and manage inventory using HTML, CSS, JavaScript, and Supabase for the backend. Features secure multi-pharmacy access with Supabase authentication and role-based permissions.

## Features

- **Secure Multi-Pharmacy Access**: Controlled access through registered pharmacy accounts
- **Supabase Authentication**: Proper email/password authentication
- **Role-Based Permissions**: Manager vs Staff access controls
- **Pharmacy Registration**: Admin-managed pharmacy registration system
- **Inventory Management**: Add, edit, and delete products with name, price, quantity, and category (Managers only)
- **Sales Tracking**: Record sales transactions and automatically update inventory (Staff and Managers)
- **Dashboard**: View statistics and low stock alerts (Managers only)
- **Responsive Design**: Works on desktop and mobile devices

## Prerequisites

- A Supabase account (free tier available at [supabase.com](https://supabase.com))

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up for an account
2. Create a new project
3. Wait for the project to be provisioned (this may take a minute)

### 2. Enable Supabase Authentication

1. In your Supabase dashboard, go to "Authentication" → "Providers"
2. Enable "Email" provider
3. Optionally configure email templates and settings

### 3. Set up the Database Tables

In your Supabase dashboard, go to the SQL Editor and run these SQL commands:

```sql
-- Create pharmacies table to store registered pharmacies
CREATE TABLE pharmacies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Create user_pharmacies table to link users to pharmacies
CREATE TABLE user_pharmacies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'staff',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, pharmacy_id)
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
CREATE INDEX idx_user_pharmacies_user ON user_pharmacies(user_id);
CREATE INDEX idx_user_pharmacies_pharmacy ON user_pharmacies(pharmacy_id);

-- Insert sample pharmacies (optional, for testing)
INSERT INTO pharmacies (name) VALUES 
  ('Sunshine Pharmacy'),
  ('HealthPlus Drugstore'),
  ('Wellness Corner'),
  ('CareFirst Pharmacy');
```

### 4. Configure Row Level Security (RLS)

Enable Row Level Security and create policies:

```sql
-- Enable RLS on all tables
ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Create policies for pharmacies table
CREATE POLICY "Users can view active pharmacies" ON pharmacies
  FOR SELECT USING (is_active = true);

-- Create policies for user_pharmacies table
CREATE POLICY "Users can view their own pharmacy associations" ON user_pharmacies
  FOR SELECT USING (user_id = auth.uid());

-- Create policies for products table
CREATE POLICY "Users can only access products from their pharmacy" ON products
  FOR ALL USING (
    pharmacy_id IN (
      SELECT pharmacy_id 
      FROM user_pharmacies 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Create policies for sales table
CREATE POLICY "Users can only access sales from their pharmacy" ON sales
  FOR ALL USING (
    pharmacy_id IN (
      SELECT pharmacy_id 
      FROM user_pharmacies 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );
```

### 5. Configure Your Supabase Credentials

1. In your Supabase dashboard, go to Project Settings
2. Copy your "Project URL" and "Anonymous (anon) key"
3. Open `script.js` in the project folder
4. Replace the placeholders in these lines:

```javascript
const supabaseUrl = 'https://YOUR_PROJECT.supabase.co';  // Replace YOUR_PROJECT with your actual project ID
const supabaseKey = 'YOUR_ANON_KEY';  // Replace with your actual anon key
```

### 6. Create Test Users

For testing, you'll need to create users through the Supabase Auth interface:

1. Go to your Supabase dashboard → Authentication → Users
2. Click "New User" to manually create test users
3. After creating users, link them to pharmacies using the SQL below:

```sql
-- Link users to pharmacies with specific roles (replace with actual user IDs from your dashboard)
INSERT INTO user_pharmacies (user_id, pharmacy_id, role) VALUES 
  ('USER_ID_1', (SELECT id FROM pharmacies WHERE name = 'Sunshine Pharmacy'), 'manager'),
  ('USER_ID_2', (SELECT id FROM pharmacies WHERE name = 'Sunshine Pharmacy'), 'staff'),
  ('USER_ID_3', (SELECT id FROM pharmacies WHERE name = 'HealthPlus Drugstore'), 'manager'),
  ('USER_ID_4', (SELECT id FROM pharmacies WHERE name = 'HealthPlus Drugstore'), 'staff');
```

### 7. Run the Application

Open `index.html` in your web browser to start using the application.

## How to Use

1. **Login**: Use your Supabase Auth credentials (email and password)
2. **Based on your role**:
   - **Manager**: Can access inventory management, sales recording, and reports
   - **Staff**: Can only record sales
3. **Logout**: Use the logout button to securely exit

## Security Considerations

- Uses Supabase Auth for proper authentication
- Implements Row Level Security to enforce data isolation
- Passwords are securely hashed and managed by Supabase
- Each user can only access data from their assigned pharmacy
- Role-based access controls restrict functionality based on user role

## Admin Operations

To add new pharmacies to the system:
1. Access your Supabase dashboard
2. Navigate to the SQL Editor
3. Run an INSERT command on the pharmacies table
4. Create new users in the Authentication section
5. Link users to pharmacies using the user_pharmacies table with appropriate roles

## Customization

You can easily customize the application by:
- Adding more product categories in the HTML select element
- Adjusting the low stock threshold (currently set to 5) in the JavaScript code
- Modifying the CSS styles in `styles.css`
- Extending the authentication system with additional user roles

## Support

If you encounter any issues with the setup, please check:
- That your Supabase credentials are correctly entered
- That Supabase Auth is properly configured
- That the database tables were created successfully
- That users are properly linked to pharmacies with appropriate roles