#!/bin/bash

# Deploy Edge Functions to Supabase
# Make sure you have the Supabase CLI installed: npm install -g supabase

echo "🚀 Deploying Edge Functions to Supabase..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Install it with: npm install -g supabase"
    exit 1
fi

# Make sure we're logged in
echo "🔐 Checking Supabase login status..."
if ! supabase status &> /dev/null; then
    echo "⚠️ Please login to Supabase first: supabase login"
    exit 1
fi

# Deploy the send-email function
echo "📧 Deploying send-email function..."
supabase functions deploy send-email --project-ref tjpaxrhqikqlhhvbzzyw

if [ $? -eq 0 ]; then
    echo "✅ send-email function deployed successfully"
else
    echo "❌ Failed to deploy send-email function"
    exit 1
fi

# Deploy the delete-user function
echo "🗑️ Deploying delete-user function..."
supabase functions deploy delete-user --project-ref tjpaxrhqikqlhhvbzzyw

if [ $? -eq 0 ]; then
    echo "✅ delete-user function deployed successfully"
else
    echo "❌ Failed to deploy delete-user function"
    exit 1
fi

echo ""
echo "🎉 All Edge Functions deployed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Go to your Supabase dashboard → Settings → Edge Functions"
echo "2. Set up the following environment variables:"
echo "   For send-email function:"
echo "   - SMTP_HOST (e.g., smtp.gmail.com)"
echo "   - SMTP_PORT (e.g., 587)"
echo "   - SMTP_USER (your email)"
echo "   - SMTP_PASSWORD (your email password or app password)"
echo "   - FROM_EMAIL (optional, defaults to SMTP_USER)"
echo "   - FROM_NAME (optional, defaults to 'My Life Code')"
echo ""
echo "   For delete-user function:"
echo "   - SUPABASE_URL (your Supabase project URL)"
echo "   - SUPABASE_SERVICE_ROLE_KEY (your service role key from Settings → API)"
echo ""
echo "3. Test the functions to make sure they work correctly"
echo ""
