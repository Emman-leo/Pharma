# Pharmacy Inventory Tracker

A simple web application for pharmacies to track sales and manage inventory using HTML, CSS, JavaScript, and Supabase for the backend.

## Features

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
-- Create products table
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  category VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales table
CREATE TABLE sales (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  quantity_sold INTEGER NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  customer_name VARCHAR(255)
);
```

### 3. Configure Your Supabase Credentials

1. In your Supabase dashboard, go to Project Settings
2. Copy your "Project URL" and "Anonymous (anon) key"
3. Open `script.js` in the project folder
4. Replace the placeholders in these lines:

```javascript
const supabaseUrl = 'https://YOUR_PROJECT.supabase.co';  // Replace YOUR_PROJECT with your actual project ID
const supabaseKey = 'YOUR_ANON_KEY';  // Replace with your actual anon key
```

### 4. Run the Application

Open `index.html` in your web browser to start using the application.

## How to Use

1. **Add Products**: Use the "Add New Product" form to add items to your inventory
2. **Record Sales**: Select a product and quantity to record a sale
3. **Manage Inventory**: Edit or delete products as needed
4. **View Reports**: Check the Reports tab for inventory statistics and low stock alerts

## Security Considerations

- The current implementation uses the anonymous key which is intended for development
- For production, implement proper authentication and Row Level Security (RLS) in Supabase

## Customization

You can easily customize the application by:
- Adding more product categories in the HTML select element
- Adjusting the low stock threshold (currently set to 5) in the JavaScript code
- Modifying the CSS styles in `styles.css`

## Support

If you encounter any issues with the setup, please check:
- That your Supabase credentials are correctly entered
- That the database tables were created successfully
- That your browser isn't blocking certain features