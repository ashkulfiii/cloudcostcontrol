#!/bin/bash

# Simple deployment script for Cloud Cost Control
# This script just deploys the landing page and form handler without all the complexity

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "=== Simple Cloud Cost Control Deployment ==="

# Deploy form handler
print_status "Deploying form handler..."
cd landing-page-form-handler-worker
npm install
npx wrangler deploy
cd ..
print_success "Form handler deployed"

# Deploy landing page as Worker
print_status "Deploying landing page ..."
cd landing-page
npm install
npm run build
npx wrangler deploy
cd ..
print_success "Landing page deployed"

echo ""
print_success "Deployment complete!"
print_status "Landing page: https://cloudcostcontrol.net"
print_status "Form handler: Check Cloudflare Workers dashboard"
