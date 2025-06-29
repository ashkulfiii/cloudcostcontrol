# C³ - Cloud Cost Control Landing Page - Deployment Guide

This guide covers deploying the landing page as a Cloudflare Worker with the custom domain `cloudcostcontrol.net`.

## Prerequisites

1. **Cloudflare Account**: You need a Cloudflare account
2. **Domain Setup**: Your domain `cloudcostcontrol.net` should be managed by Cloudflare
3. **Wrangler CLI**: Install globally with `npm install -g wrangler`
4. **Authentication**: Login to Cloudflare with `wrangler login`

## Deployment Steps

### Step 1: Install Dependencies and Build

From the `landing-page` directory, run:

```bash
# Install dependencies (including @cloudflare/kv-asset-handler)
npm install

# Build the Astro site
npm run build
```

### Step 2: Deploy to Cloudflare Workers

```bash
# Deploy to production environment
npm run deploy:prod

# Or deploy to default environment
npm run deploy
```

This will:
- Build the Astro site (`npm run build`)
- Deploy as a Cloudflare Worker with static assets
- Set up routes for your custom domain

### Step 3: Verify Deployment

Your site will be available at:
- `https://cloudcostcontrol.net` (custom domain)
- `https://www.cloudcostcontrol.net` (www subdomain)
- `https://cloudcost-control-landing.your-subdomain.workers.dev` (workers.dev fallback)

### Step 4: DNS Configuration

Your DNS records should already be configured if your domain is managed by Cloudflare. The Worker routes will automatically handle the custom domain traffic.

## Worker Architecture

Your landing page is deployed as a Cloudflare Worker that:
- ✅ Serves static files from the `dist` directory
- ✅ Handles custom routing for your domain
- ✅ Includes security headers
- ✅ Supports CORS for API requests
- ✅ Provides 404 error handling

## Alternative Deployment Methods

### Option 1: Manual Deploy

```bash
# Build the site
npm run build

# Deploy manually
wrangler deploy
```

### Option 2: Environment-Specific Deploy

```bash
# Deploy to production environment
wrangler deploy --env production
```

## Environment Variables

If you need environment variables for the build process:

1. Go to Cloudflare Dashboard → Pages → Your Project → Settings → Environment Variables
2. Add variables for different environments (Production, Preview, etc.)

## Form Handler Integration

Your contact form is already configured to work with the Cloudflare Worker at:
- `https://cloudcostcontrol.net/api/contact` (custom domain)
- `https://cloudcost-control-form-handler.your-subdomain.workers.dev/contact` (fallback)

Make sure your form handler Worker is deployed and configured correctly.

## Verification Steps

After deployment:

1. **Check the site loads**: Visit `https://cloudcostcontrol.net`
2. **Test the contact form**: Submit a test form
3. **Verify Cal.com integration**: Click "Schedule a Call" button
4. **Test mobile responsiveness**: Check on various devices
5. **Check SSL certificate**: Ensure HTTPS is working properly

## Troubleshooting

### Common Issues:

1. **Build fails**: Check Node.js version compatibility
2. **Custom domain not working**: Verify DNS propagation (can take up to 24 hours)
3. **Form not submitting**: Check Worker deployment and CORS settings
4. **SSL errors**: Ensure SSL/TLS mode is set correctly

### Commands for Debugging:

```bash
# Check deployment status
wrangler pages deployment list

# View logs
wrangler pages deployment tail

# Local development
npm run dev
```

## Performance Optimization

Your site is already optimized with:
- ✅ Static site generation (Astro)
- ✅ Cloudflare CDN
- ✅ Image optimization
- ✅ Minified assets

## Security Features

- ✅ HTTPS enforcement
- ✅ CORS properly configured
- ✅ CSP headers (can be added via _headers file)
- ✅ Form validation and sanitization

## Monitoring

Consider setting up:
- Cloudflare Analytics (built-in)
- Real User Monitoring (RUM)
- Custom analytics if needed

---

Your professional Azure cost optimization landing page is now ready for production! 🚀
