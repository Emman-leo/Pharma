# 🏥 Pharmacy Management System

A modern, responsive pharmacy inventory management system built with HTML, CSS, JavaScript, and Supabase.

## 🚀 Features

- **User Authentication** - Secure login/signup with Supabase Auth
- **Inventory Management** - Add, edit, delete, and view medicines
- **Real-time Search** - Instant search by name, category, or supplier
- **Category Filtering** - Filter medicines by category
- **Dashboard Statistics** - Real-time inventory overview
- **Low Stock Alerts** - Automatic highlighting of low stock items
- **Responsive Design** - Works on all devices
- **Modern UI** - Clean, professional interface with dark mode support

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Supabase (Database, Authentication, Real-time)
- **Styling**: Custom CSS with modern design principles
- **Icons**: Font Awesome 6
- **Deployment**: Vercel (or your preferred platform)

## 📋 Prerequisites

- A Supabase account (free tier available)
- Basic knowledge of HTML/CSS/JavaScript
- A code editor (VS Code recommended)

## 🚀 Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Note down your **Project URL** and **Anon Key**

### 2. Set Up Database

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `database.sql` file
3. Paste and run the SQL in the editor
4. This will create all necessary tables and sample data

### 3. Configure Authentication

1. Go to **Authentication** → **Providers** in Supabase dashboard
2. Enable **Email** authentication
3. (Optional) Configure email templates under **Authentication** → **Email Templates**

### 4. Update Configuration

The Supabase credentials are already configured in `supabase.js`:
```javascript
const supabaseUrl = 'https://amycguhqggaqjpztumva.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

### 5. Deploy Your Application

#### Option A: Vercel (Recommended)
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and create an account
3. Import your GitHub repository
4. Deploy - Vercel will automatically detect it's a static site

#### Option B: Netlify
1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Click "New site from Git"
4. Select your repository and deploy

#### Option C: Local Development
1. Open `index.html` directly in your browser, OR
2. Use a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js (install live-server)
   npx live-server
   
   # Using PHP
   php -S localhost:8000
   ```

## 📁 Project Structure

```
Pharma/
├── index.html          # Main dashboard page
├── auth.html           # Authentication page
├── app.js              # Main application logic
├── auth.js             # Authentication logic
├── supabase.js         # Supabase client configuration
├── style.css           # Main stylesheet
├── database.sql        # Database schema and sample data
└── README.md           # This file
```

## 🎯 Usage Guide

### Logging In
1. Open your deployed application
2. Click "Sign Up" to create a new account
3. Enter your email and password
4. Check your email for verification link
5. After verification, log in with your credentials

### Managing Inventory

#### Adding New Medicine
1. Fill in the form on the left side:
   - **Name**: Medicine name (required)
   - **Category**: Select from dropdown (required)
   - **Quantity**: Current stock quantity (required)
   - **Price**: Selling price in ₵ (required)
   - **Supplier**: Supplier name (optional)
   - **Expiry Date**: Expiration date (optional)
   - **Description**: Additional details (optional)
2. Click "Add Medicine"

#### Editing Medicine
1. Find the medicine in the table
2. Click the "Edit" button
3. Modify the details in the popup form
4. Click "Update Medicine"

#### Deleting Medicine
1. Find the medicine in the table
2. Click the "Delete" button
3. Confirm deletion

#### Searching & Filtering
- **Search**: Type in the search box to filter by name, category, or supplier
- **Category Filter**: Use the dropdown to show only specific categories
- **Low Stock**: Items with quantity ≤ 10 are highlighted in orange

## 🔧 Customization

### Adding New Categories
1. Go to your Supabase dashboard
2. Navigate to **Table Editor** → **categories**
3. Add new category rows
4. Update the dropdown options in `index.html`

### Modifying Dashboard Stats
Edit the `updateDashboardStats()` function in `app.js` to add more metrics.

### Changing Theme Colors
Modify the CSS variables in `style.css`:
```css
:root {
    --primary-color: #3498db;
    --secondary-color: #2c3e50;
    --success-color: #27ae60;
    --danger-color: #e74c3c;
    --warning-color: #f39c12;
}
```

## 🔒 Security Notes

- Never expose your Supabase service role key in client-side code
- The current setup uses Row Level Security (RLS) policies for basic protection
- For production, consider implementing more restrictive RLS policies
- Always use HTTPS in production

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones
- All modern browsers

## 🆘 Troubleshooting

### Common Issues

**1. "Error loading medicines"**
- Check your Supabase credentials in `supabase.js`
- Verify database tables exist by running `database.sql`
- Check browser console for detailed error messages

**2. Authentication not working**
- Ensure Email authentication is enabled in Supabase
- Check that your email domain is not blocked
- Verify you're using the correct project URL and Anon Key

**3. Styles not loading**
- Make sure `style.css` is in the same directory as `index.html`
- Check browser developer tools for 404 errors

**4. Form submission fails**
- Verify all required fields are filled
- Check browser console for validation errors
- Ensure you have proper database permissions

## 🚀 Future Enhancements

- [ ] Add barcode scanning functionality
- [ ] Implement purchase order management
- [ ] Add reporting and analytics
- [ ] Include customer management
- [ ] Add multi-user roles and permissions
- [ ] Implement inventory tracking history
- [ ] Add automatic low-stock email alerts
- [ ] Include batch/lot tracking

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) - Backend as a Service
- [Font Awesome](https://fontawesome.com) - Icons
- [Vercel](https://vercel.com) - Deployment platform

---

**Need help?** Feel free to open an issue or contact the development team!