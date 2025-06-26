# 🌐 Cloudflare Pages Deployment Guide for Stage App

## 📋 Quick Setup Checklist

### ✅ 1. Repository Setup
- [x] Code pushed to GitHub repository
- [x] `wrangler.toml` configured with valid environments (production/preview only)
- [x] Build configuration in `package.json`
- [x] `_redirects` file for SPA routing

### ✅ 2. Cloudflare Pages Project Setup

#### Option A: Connect via Cloudflare Dashboard (Recommended)
1. Go to [Cloudflare Pages](https://pages.cloudflare.com/)
2. Click "Create a project"
3. Connect to Git → Select your GitHub repository
4. Configure build settings:
   - **Project name**: `stage-app` (or your preferred name)
   - **Production branch**: `main`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (leave empty if repo root)

#### Option B: Deploy via Wrangler CLI
```bash
# Install Wrangler CLI globally
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy directly
npm run deploy:cloudflare
```

### ✅ 3. Environment Variables Configuration

#### Required Environment Variables:
Set these in Cloudflare Pages → Settings → Environment Variables

**Production Environment:**
```
VITE_SUPABASE_URL=your-production-supabase-url
VITE_SUPABASE_ANON_KEY=your-production-supabase-anon-key
VITE_GEMINI_API_KEY=your-gemini-api-key
VITE_RITESH_EMAIL=your-email@example.com
```

**Preview Environment:**
```
VITE_SUPABASE_URL=your-preview-supabase-url (can be same as production)
VITE_SUPABASE_ANON_KEY=your-preview-supabase-anon-key
VITE_GEMINI_API_KEY=your-gemini-api-key
VITE_RITESH_EMAIL=your-email@example.com
```

### ✅ 4. Build Configuration Files

#### `wrangler.toml`
```toml
name = "stage-app"
compatibility_date = "2024-12-01"
pages_build_output_dir = "dist"

[env.production]
compatibility_date = "2024-12-01"

[env.preview]
compatibility_date = "2024-12-01"
```

#### `public/_redirects`
```plaintext
# SPA redirect - serve index.html for all routes
/*    /index.html   200

# Optional: Force HTTPS
# http://stage-app.pages.dev/*  https://stage-app.pages.dev/:splat  301
```

## 🚀 Deployment Process

### Automatic Deployments (Recommended)
Once connected to Git:
- **Production**: Deploys automatically on pushes to `main` branch
- **Preview**: Deploys automatically on pull requests and other branches

### Manual Deployment
```bash
# Build and deploy
npm run deploy:cloudflare

# Or step by step
npm run build
wrangler pages deploy dist --project-name stage-app
```

## 🔧 Troubleshooting Common Issues

### ❌ "Configuration file contains unsupported environment names"
**Problem**: Using `staging` instead of `preview` in `wrangler.toml`
**Solution**: Replace `[env.staging]` with `[env.preview]`

### ❌ "Build failed" or "Command not found"
**Problem**: Missing build dependencies or wrong build command
**Solution**: 
```bash
# Ensure all dependencies are in package.json (not devDependencies for Cloudflare)
# Check build command in Cloudflare Pages settings
```

### ❌ "Environment variables not defined"
**Problem**: Missing or incorrectly named environment variables
**Solution**: 
- Ensure all variables start with `VITE_` for client-side access
- Set variables in both Production and Preview environments
- Redeploy after adding environment variables

### ❌ "404 on page refresh" (SPA routing issues)
**Problem**: Missing or incorrect `_redirects` file
**Solution**: Verify `public/_redirects` contains SPA redirect rule

## 🌐 URLs and Access

### Default URLs:
- **Production**: `https://stage-app.pages.dev`
- **Preview**: `https://[branch-name].stage-app.pages.dev`

### Custom Domain (Optional):
1. Go to Cloudflare Pages → Custom domains
2. Add your domain
3. Update DNS records as instructed
4. SSL certificates are automatically managed

## 📊 Monitoring and Logs

### Build Logs:
- Cloudflare Pages Dashboard → Deployments → View logs
- Real-time build progress and error details

### Analytics:
- Cloudflare Pages Dashboard → Analytics
- Page views, performance metrics, etc.

### Function Logs (if using Cloudflare Workers):
- Cloudflare Dashboard → Workers & Pages → Functions → Logs

## 🔄 CI/CD Integration

### GitHub Actions (Optional Enhancement):
```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Pages
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: stage-app
          directory: dist
```

## 🎯 Performance Optimization

### Recommended Settings:
- **Minification**: Enabled (automatic)
- **Auto-minify CSS/JS/HTML**: Enabled in Cloudflare Dashboard
- **Brotli compression**: Enabled (automatic)
- **HTTP/2**: Enabled (automatic)
- **IPv6**: Enabled (automatic)

### Build Optimizations:
```json
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-toast']
        }
      }
    }
  }
});
```

## 🔒 Security Headers (Optional)

Add to `public/_headers`:
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## 📞 Support

- **Cloudflare Community**: https://community.cloudflare.com/
- **Documentation**: https://developers.cloudflare.com/pages/
- **Status Page**: https://www.cloudflarestatus.com/

---

**✅ Ready to Deploy!** 
Your Stage app is now configured for Cloudflare Pages deployment with automatic HTTPS, global CDN, and unlimited bandwidth.
