# C³ - Cloud Cost Control

## Local Development

```bash
# Landing page
cd landing-page
npm install
npm run dev
# http://localhost:4321

# Form handler worker
cd landing-page-form-handler-worker
npm install
wrangler dev
# http://localhost:8787
```

## Production Deployment

```bash
# Deploy form handler first
cd landing-page-form-handler-worker
wrangler deploy

# Deploy landing page
cd landing-page
npm run deploy:prod
```

## Post-Deployment Testing

```bash
# Test landing page
curl -I https://cloudcostcontrol.net

# Test contact form
curl -X POST https://cloudcostcontrol.net/api/contact \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "name=Test&email=test@example.com&company=Test+Co&message=Test+message"

# Test blog
curl -I https://cloudcostcontrol.net/blog

# Check specific blog post
curl -I https://cloudcostcontrol.net/blog/10-azure-cost-cutting-strategies
```

## Quick Troubleshooting

```bash
# View worker logs
wrangler tail --env production

# Check build locally
cd landing-page
npm run build
npm run preview

# Clear cache and rebuild
rm -rf dist/ .astro/
npm run build
```
