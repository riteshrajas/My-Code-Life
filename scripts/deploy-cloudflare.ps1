# PowerShell deployment script for Cloudflare Pages

Write-Host "🚀 Deploying to Cloudflare Pages..." -ForegroundColor Green

# Build the project
Write-Host "📦 Building project..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Deploy using Wrangler
Write-Host "🌐 Deploying to Cloudflare..." -ForegroundColor Yellow
wrangler pages deploy dist --project-name stage-app

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployment complete!" -ForegroundColor Green
    Write-Host "🌐 Your site will be available at: https://stage-app.pages.dev" -ForegroundColor Cyan
} else {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}
