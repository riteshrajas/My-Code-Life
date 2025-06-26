# Deploy Edge Functions to Supabase
# Make sure you have the Supabase CLI installed: npm install -g supabase

Write-Host "🚀 Deploying Edge Functions to Supabase..." -ForegroundColor Green

# Check if supabase CLI is installed
if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Supabase CLI is not installed. Install it with: npm install -g supabase" -ForegroundColor Red
    exit 1
}

# Deploy the send-email function
Write-Host "📧 Deploying send-email function..." -ForegroundColor Yellow
$result1 = & supabase functions deploy send-email --project-ref tjpaxrhqikqlhhvbzzyw

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ send-email function deployed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to deploy send-email function" -ForegroundColor Red
    exit 1
}

# Deploy the delete-user function
Write-Host "🗑️ Deploying delete-user function..." -ForegroundColor Yellow
$result2 = & supabase functions deploy delete-user --project-ref tjpaxrhqikqlhhvbzzyw

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ delete-user function deployed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to deploy delete-user function" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 All Edge Functions deployed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Go to your Supabase dashboard → Settings → Edge Functions"
Write-Host "2. Set up the following environment variables:"
Write-Host "   For send-email function:"
Write-Host "   - SMTP_HOST (e.g., smtp.gmail.com)"
Write-Host "   - SMTP_PORT (e.g., 587)"
Write-Host "   - SMTP_USER (your email)"
Write-Host "   - SMTP_PASSWORD (your email password or app password)"
Write-Host "   - FROM_EMAIL (optional, defaults to SMTP_USER)"
Write-Host "   - FROM_NAME (optional, defaults to 'My Life Code')"
Write-Host ""
Write-Host "   For delete-user function:"
Write-Host "   - SUPABASE_URL (your Supabase project URL)"
Write-Host "   - SUPABASE_SERVICE_ROLE_KEY (your service role key from Settings → API)"
Write-Host ""
Write-Host "3. Test the functions to make sure they work correctly"
Write-Host ""
