# Cloudflare Pages Environment Variables Setup Guide

## Required Environment Variables for Production

### Supabase Configuration
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

### Gemini AI API (if using)
VITE_GEMINI_API_KEY=your-gemini-api-key

### Family Portal Configuration
VITE_RITESH_EMAIL=your-email@example.com

## How to Set Environment Variables in Cloudflare Pages:

1. Go to your Cloudflare Pages dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable with the appropriate values
5. Set them for both "Production" and "Preview" environments

## Important Notes:
- All client-side variables must be prefixed with VITE_ 
- Never commit actual values to git
- Use different values for preview/staging vs production
- Supabase URLs and keys are different for each environment

## Example Supabase Setup:
Production: https://your-project.supabase.co
Preview: https://your-staging-project.supabase.co (optional separate instance)
