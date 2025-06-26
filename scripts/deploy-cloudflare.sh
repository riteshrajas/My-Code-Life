#!/bin/bash

# Cloudflare Pages deployment script

echo "🚀 Deploying to Cloudflare Pages..."

# Build the project
echo "📦 Building project..."
npm run build

# Deploy using Wrangler
echo "🌐 Deploying to Cloudflare..."
wrangler pages deploy dist --project-name stage-app

echo "✅ Deployment complete!"
echo "🌐 Your site will be available at: https://stage-app.pages.dev"
