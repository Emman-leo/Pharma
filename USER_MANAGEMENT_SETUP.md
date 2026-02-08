# User Management System Setup Guide

## Step 1: Update Your Database Schema

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the updated SQL from `database.sql` file
4. Run the queries to create the new tables and policies
5. If you encounter any issues with RLS policies, make sure you run each CREATE TABLE statement separately first, then run the ALTER TABLE and CREATE POLICY statements.

## Step 2: Create Test Users

### Option A: Through Supabase Dashboard
1. Go to **Authentication** → **Users**
2. Click **"+ Add user"**
3. Create two test accounts:

**Admin User:**
- Email: `admin@test.com`
- Password: `TestPass123!`

**Staff User:**
- Email: `staff@test.com` 
- Password: `TestPass123!`

### Option B: Through Your Application
1. Use your existing auth.html login page
2. Register new users through the normal signup process
3. The system will automatically create profiles with 'staff' role by default

## Step 3: Set User Roles

After creating users, you need to set their roles in the database:

### Find User UUIDs:
1. Go to **Authentication** → **Users**
2. Copy the User UID for each test user

### Update User Roles:
Run these SQL queries in your Supabase SQL Editor:

```sql
-- For Admin user (replace 'USER_UUID_HERE' with actual UUID)
UPDATE user_profiles 
SET role = 'admin' 
WHERE id = 'USER_UUID_HERE';

-- For Staff user (replace 'USER_UUID_HERE' with actual UUID)  
UPDATE user_profiles 
SET role = 'staff' 
WHERE id = 'USER_UUID_HERE';
```

## Step 4: Test the System

### Admin User Features:
- Can access all tabs: **Inventory**, **Sales**, **Reports**
- Can view all user activities in the activity log
- Can manage user profiles

### Staff User Features:
- Can only access **Sales** tab
- All sales activities are automatically logged
- Cannot see or access inventory management
- Cannot access reports dashboard

## How It Works

### Role-Based Access Control:
- **Admin**: Full access to all system features
- **Staff**: Limited access to sales functionality only

### Activity Logging:
- All staff actions are automatically recorded
- Admins can review staff activities for accountability
- Logs include timestamps, user names, and action details

### Automatic Profile Creation:
- When new users sign up, profiles are created automatically
- Default role is 'staff' for security
- Admins can change roles as needed

## Troubleshooting

### If tabs aren't hiding properly:
1. Check browser console for errors
2. Verify user profiles exist in the database
3. Ensure RLS policies are applied correctly

### If activity logging isn't working:
1. Check that the `activity_log` table exists
2. Verify the user has a valid profile
3. Check browser console for JavaScript errors

### If authentication fails:
1. Verify Supabase connection details in `supabase.js`
2. Check that users exist in Authentication → Users
3. Ensure user profiles exist in the `user_profiles` table

### If you see 403 or 406 errors:
1. Make sure all RLS policies are properly set up
2. Run the SQL commands in order: first CREATE TABLE, then ALTER TABLE ENABLE RLS, then CREATE POLICY
3. Check that the user has the correct permissions
4. Verify that the user is authenticated before accessing protected data

## Security Notes

- All database operations use Row Level Security (RLS)
- Users can only see their own data by default
- Admins have elevated privileges through special policies
- All passwords should be changed from test credentials in production