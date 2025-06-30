# C³ - Cloud Cost Control Deployment Scripts

This directory contains comprehensive deployment and testing scripts for the Cloud Cost Control website and services.

## 🚀 Quick Start

### Complete Pipeline (Recommended)
```bash
./run-pipeline.sh
```
This runs the full deployment and testing pipeline automatically.

### Individual Scripts

#### Deploy Only
```bash
./deploy.sh
```
Deploys both the form handler and landing page.

#### Test Only
```bash
./test-website.sh
```
Runs comprehensive testing on the deployed site.

## 📋 Scripts Overview

### `run-pipeline.sh` - Complete Pipeline
- ✅ Environment validation
- ✅ Form handler deployment
- ✅ Landing page deployment  
- ✅ Comprehensive testing
- ✅ Detailed reporting
- ✅ Interactive HTML reports

### `deploy.sh` - Deployment Script
- 🔧 Form handler worker deployment
- 🌐 Landing page static site deployment
- ⏱️ Deployment propagation waiting
- 📊 Basic functionality testing
- 📝 Deployment logging

### `test-website.sh` - Advanced Testing
- 🕷️ Deep site crawling with JavaScript rendering
- 🔗 Broken link detection
- 📱 Form testing with multiple scenarios
- ⚡ Performance monitoring
- 🐛 Console error detection
- 📊 Interactive HTML reports

## 🛠️ Prerequisites

### Required Tools
- **Node.js** (v16+)
- **npm** 
- **curl**
- **jq** (for JSON processing)
- **Cloudflare Wrangler CLI** (configured with credentials)

### Installation
```bash
# Install Node.js dependencies
npm install

# Install Wrangler CLI globally
npm install -g wrangler@latest

# Install jq (Ubuntu/Debian)
sudo apt install jq

# Install jq (macOS)
brew install jq
```

### Wrangler Setup
```bash
# Login to Cloudflare
wrangler auth login

# Verify authentication
wrangler whoami
```

## 📁 Project Structure

```
cloud-cost-control/
├── deploy.sh                          # Main deployment script
├── test-website.sh                     # Advanced testing script  
├── run-pipeline.sh                     # Complete pipeline orchestrator
├── landing-page/                       # Astro static site
│   ├── src/
│   ├── dist/                          # Built static files
│   ├── package.json
│   └── wrangler.toml                  # Cloudflare Pages config
├── landing-page-form-handler-worker/   # Cloudflare Worker
│   ├── index.js                       # Worker code
│   ├── package.json
│   └── wrangler.toml                  # Worker config
└── pipeline-report-*/                  # Generated reports
```

## 🎯 Deployment Targets

### Production URLs
- **Main Site:** https://cloudcostcontrol.net
- **Blog:** https://cloudcostcontrol.net/blog  
- **Contact Form:** https://cloudcostcontrol.net/#contact
- **Form Handler API:** https://cloudcost-control-form-handler.cloudcostcontrol.workers.dev

### Cloudflare Services
- **Pages:** cloudcost-control-landing-prod
- **Worker:** cloudcost-control-form-handler
- **DNS:** cloudcostcontrol.net zone

## 🧪 Testing Features

### Automated Tests
- ✅ **Page Load Testing** - All pages return HTTP 200
- ✅ **Link Validation** - No broken internal links
- ✅ **Form Functionality** - Contact form submission testing
- ✅ **JavaScript Errors** - Console error detection
- ✅ **Performance Monitoring** - Page load time analysis
- ✅ **Image Validation** - Broken image detection
- ✅ **Multi-scenario Testing** - Different form submission types

### Test Scenarios
1. **Small Business** - Low spend, basic services
2. **Enterprise** - High spend, premium services  
3. **Emergency** - Immediate response needed
4. **FinOps** - Framework implementation request

## 📊 Reports Generated

### Pipeline Report (`pipeline-report-*/`)
- **index.html** - Interactive dashboard
- **report.html** - Detailed test results
- **pipeline-summary.md** - Text summary
- **pipeline-*.log** - Complete execution log
- **crawl-results.json** - Raw crawling data
- **form-test-results.json** - Form testing data

### Key Metrics Tracked
- Page load times
- HTTP response codes
- JavaScript console errors
- Form submission success rates
- Broken link counts
- Performance benchmarks

## 🔧 Customization

### Environment Variables
```bash
# Override default URLs
export SITE_URL="https://your-domain.com"
export FORM_HANDLER_URL="https://your-worker.workers.dev"

# Adjust testing parameters  
export MAX_DEPTH=3          # Link crawling depth
export TEST_DELAY=2         # Delay between tests (seconds)
```

### Configuration Files
- `landing-page/wrangler.toml` - Pages deployment config
- `landing-page-form-handler-worker/wrangler.toml` - Worker config

## 🚨 Troubleshooting

### Common Issues

#### Authentication Errors
```bash
# Re-authenticate with Cloudflare
wrangler auth login
wrangler whoami
```

#### Build Failures
```bash
# Clean and rebuild
cd landing-page
rm -rf node_modules dist
npm install
npm run build
```

#### Missing Dependencies
```bash
# Install missing tools
sudo apt update
sudo apt install curl jq nodejs npm

# Install Puppeteer for testing
npm install puppeteer
```

#### Permission Errors
```bash
# Make scripts executable
chmod +x *.sh
```

### Debug Mode
```bash
# Run with verbose logging
bash -x ./run-pipeline.sh

# Check specific logs
tail -f pipeline-*.log
```

## 📞 Support

### Manual Verification Steps
1. Visit https://cloudcostcontrol.net
2. Navigate through all pages (/, /blog, /thank-you)
3. Test contact form with real data
4. Verify email notifications arrive
5. Check browser console for errors
6. Test on mobile devices

### Monitoring Setup
- Set up Cloudflare Analytics
- Configure uptime monitoring
- Enable error tracking
- Set up email alerts for failures

---

**Last Updated:** June 30, 2025  
**Version:** 1.0.0  
**Maintainer:** C³ - Cloud Cost Control Team
