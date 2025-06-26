# 🌐 Cloudflare Pages Deployment Script (PowerShell)
# This script helps deploy your Stage app to Cloudflare Pages

Write-Host "🚀 Cloudflare Pages Deployment Script" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green

# Check if wrangler is installed
try {
    wrangler --version | Out-Null
    Write-Host "✅ Wrangler CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ Wrangler CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g wrangler
}

# Check if user is logged in
try {
    wrangler whoami | Out-Null
    Write-Host "✅ Already logged in to Cloudflare" -ForegroundColor Green
} catch {
    Write-Host "🔐 Please log in to Cloudflare..." -ForegroundColor Yellow
    wrangler login
}

# Build the project
Write-Host "📦 Building project..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Deploy to Cloudflare Pages
Write-Host "🌐 Deploying to Cloudflare Pages..." -ForegroundColor Yellow
wrangler pages deploy dist --project-name stage-app

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host "🌐 Your site is available at:" -ForegroundColor Cyan
    Write-Host "   Production: https://stage-app.pages.dev" -ForegroundColor Cyan
    Write-Host "   Dashboard: https://dash.cloudflare.com/pages" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📝 Next steps:" -ForegroundColor Yellow
    Write-Host "   1. Set up environment variables in Cloudflare Pages dashboard" -ForegroundColor White
    Write-Host "   2. Connect your GitHub repository for automatic deployments" -ForegroundColor White
    Write-Host "   3. Configure custom domain (optional)" -ForegroundColor White
} else {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}
