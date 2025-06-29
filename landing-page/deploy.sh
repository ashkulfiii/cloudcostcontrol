#!/bin/bash

# C³ - Cloud Cost Control Landing Page - Quick Deploy Script
# This script automates the deployment process

set -e  # Exit on any error

echo "🚀 C³ - Cloud Cost Control Landing Page Deployment"
echo "=============================================="

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "astro.config.mjs" ]; then
    echo "❌ Error: Please run this script from the landing-page directory"
    exit 1
fi

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Error: Wrangler CLI is not installed"
    echo "Please install it with: npm install -g wrangler"
    exit 1
fi

# Check if user is logged in to Cloudflare
echo "🔍 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "❌ Error: Not logged in to Cloudflare"
    echo "Please run: wrangler login"
    exit 1
fi

echo "✅ Cloudflare authentication verified"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the site
echo "🏗️  Building the site..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Error: Build failed - dist directory not found"
    exit 1
fi

echo "✅ Build completed successfully"

# Deploy to Cloudflare Workers
echo "🚀 Deploying to Cloudflare Workers..."
wrangler deploy

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "Next steps:"
echo "1. Go to Cloudflare Dashboard → Pages → cloudcost-control-landing"
echo "2. Add custom domain: cloudcostcontrol.net"
echo "3. Configure DNS records if not already done"
echo "4. Test the site at: https://cloudcostcontrol.net"
echo ""
echo "Your professional landing page is now live! 🌟"
