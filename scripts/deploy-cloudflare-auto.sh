#!/bin/bash

# 🌐 Cloudflare Pages Deployment Script
# This script helps deploy your Stage app to Cloudflare Pages

set -e

echo "🚀 Cloudflare Pages Deployment Script"
echo "======================================"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Check if user is logged in
if ! wrangler whoami &> /dev/null; then
    echo "🔐 Please log in to Cloudflare..."
    wrangler login
fi

# Build the project
echo "📦 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# Deploy to Cloudflare Pages
echo "🌐 Deploying to Cloudflare Pages..."
wrangler pages deploy dist --project-name stage-app

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🌐 Your site is available at:"
    echo "   Production: https://stage-app.pages.dev"
    echo "   Dashboard: https://dash.cloudflare.com/pages"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Set up environment variables in Cloudflare Pages dashboard"
    echo "   2. Connect your GitHub repository for automatic deployments"
    echo "   3. Configure custom domain (optional)"
else
    echo "❌ Deployment failed!"
    exit 1
fi
