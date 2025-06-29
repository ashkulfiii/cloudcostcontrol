@echo off
REM C³ - Cloud Cost Control Landing Page - Quick Deploy Script (Windows)
REM This script automates the deployment process

echo 🚀 C³ - Cloud Cost Control Landing Page Deployment
echo ==============================================

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: Please run this script from the landing-page directory
    exit /b 1
)

if not exist "astro.config.mjs" (
    echo ❌ Error: Please run this script from the landing-page directory
    exit /b 1
)

REM Check if wrangler is installed
wrangler --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Wrangler CLI is not installed
    echo Please install it with: npm install -g wrangler
    exit /b 1
)

REM Check if user is logged in to Cloudflare
echo 🔍 Checking Cloudflare authentication...
wrangler whoami >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Not logged in to Cloudflare
    echo Please run: wrangler login
    exit /b 1
)

echo ✅ Cloudflare authentication verified

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

REM Build the site
echo 🏗️  Building the site...
npm run build

REM Check if build was successful
if not exist "dist" (
    echo ❌ Error: Build failed - dist directory not found
    exit /b 1
)

echo ✅ Build completed successfully

REM Deploy to Cloudflare Workers
echo 🚀 Deploying to Cloudflare Workers...
wrangler deploy

echo.
echo 🎉 Deployment completed successfully!
echo.
echo Next steps:
echo 1. Go to Cloudflare Dashboard → Pages → cloudcost-control-landing
echo 2. Add custom domain: cloudcostcontrol.net
echo 3. Configure DNS records if not already done
echo 4. Test the site at: https://cloudcostcontrol.net
echo.
echo Your professional landing page is now live! 🌟
pause
