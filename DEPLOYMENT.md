# Quick Deployment Guide

## Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/pharmacy-app.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub
   - Click "New Project"
   - Import your repository
   - Click "Deploy"
   - Your app will be live at `your-app-name.vercel.app`

## Deploy to Netlify

1. **Push to GitHub** (same as above)

2. **Deploy to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Sign up with GitHub
   - Click "New site from Git"
   - Select your repository
   - Click "Deploy site"
   - Your app will be live at `your-site-name.netlify.app`

## Local Testing

```bash
# Using Python (built-in server)
python -m http.server 3000

# Using Node.js
npx serve

# Using PHP
php -S localhost:3000
```

Then visit `http://localhost:3000`

## Environment Variables (Optional)

For better security, you can use environment variables:

1. Create a `.env` file:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

2. Update `supabase.js`:
```javascript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

3. Add `.env` to your `.gitignore` file