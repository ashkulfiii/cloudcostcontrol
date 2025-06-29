# 🚀 Quick Deploy Commands

Copy and paste these commands to deploy CloudCost Control in under 30 minutes.

## Prerequisites
```bash
# Make sure you have Node.js and npm installed
node --version
npm --version
```

## 1. Install Wrangler CLI
```bash
npm install -g wrangler
```

## 2. Login to Cloudflare
```bash
wrangler login
# Opens browser - login with your Cloudflare account
```

## 3. Deploy Form Handler Worker
```bash
cd landing-page-form-handler-worker
npm install
wrangler deploy
# Note the deployed URL - you'll need it for the contact form
```

## 4. Build Landing Page
```bash
cd ../landing-page
npm install
npm run build
# Creates dist/ folder ready for upload
```

## 5. Deploy to Cloudflare Pages

### Option A: Git Integration (Recommended)
```bash
# Push to GitHub first
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main

# Then connect repository in Cloudflare Pages dashboard
```

### Option B: Direct Upload
```bash
# After running npm run build
# Upload the dist/ folder via Cloudflare Pages dashboard
```

## 6. Update Worker URL (After Deployment)
```bash
# Edit landing-page/src/components/Contact.astro
# Update the fetch URL to your deployed worker URL
```

## 7. Test Everything
```bash
# Visit your website
open https://cloudcostcontrol.net

# Test the contact form
# Check email notifications
```

## ✅ Success Indicators
- [ ] Website loads at your domain
- [ ] SSL certificate shows green lock
- [ ] Contact form submits successfully
- [ ] Email notifications are received
- [ ] Mobile site works properly

## 🔧 Useful Maintenance Commands
```bash
# Update worker
cd landing-page-form-handler-worker
wrangler deploy

# Update website (if using direct upload)
cd landing-page
npm run build
# Upload new dist/ folder

# Check worker logs
wrangler tail

# List deployed workers
wrangler list
```

## 📞 Support
- **Cloudflare Docs**: https://developers.cloudflare.com/
- **Wrangler CLI Docs**: https://developers.cloudflare.com/workers/wrangler/
- **Astro Docs**: https://docs.astro.build/

**That's it! Your professional lead-generation website is now live.**
