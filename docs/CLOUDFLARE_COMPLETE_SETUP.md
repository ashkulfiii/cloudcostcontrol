# CloudCost Control - Complete Cloudflare Setup Guide

This guide will help you set up everything needed to deploy the CloudCost Control landing page and form handler using primarily Cloudflare services.

## 📋 Required Accounts Overview

1. **ProtonMail** - Root email address (privacy-focused)
2. **Cloudflare** - Domain, DNS, Workers, Pages, Email routing
3. **Optional**: Backup email service (only if Cloudflare Email routing has limitations)

## 🎯 Why This Stack?

- ✅ **Single vendor** - Everything in Cloudflare ecosystem
- ✅ **Free tier friendly** - Most services free for small business
- ✅ **High performance** - Global CDN and edge computing
- ✅ **Enterprise security** - DDoS protection, SSL, etc.
- ✅ **Privacy-focused** - ProtonMail for secure communications

---

## Step 1: Create Root Email Account (ProtonMail)

### 🔐 ProtonMail Setup
1. **Go to**: https://proton.me/mail
2. **Sign up** for free account
3. **Choose username**: `contact` or your preferred name
4. **Verify account** via SMS or recovery email
5. **Enable 2FA** (highly recommended)

**Recommended email**: `contact@proton.me` (or your custom domain later)

### 📧 Email Strategy
- **Primary business email**: `contact@cloudcostcontrol.net` (via Cloudflare)
- **Root/backup email**: Your ProtonMail address
- **Recovery email**: Keep ProtonMail as backup

---

## Step 2: Purchase Domain & Set Up Cloudflare

### 🌐 Domain Registration Options

#### Option A: Buy Through Cloudflare (Recommended)
1. **Go to**: https://www.cloudflare.com/products/registrar/
2. **Search**: `cloudcostcontrol.net`
3. **Purchase domain** ($9-15/year)
4. **Benefits**: Automatic Cloudflare integration, at-cost pricing

#### Option B: Buy Elsewhere & Transfer
1. **Purchase** from Namecheap, GoDaddy, etc.
2. **Change nameservers** to Cloudflare
3. **Wait** for DNS propagation (24-48 hours)

### ☁️ Cloudflare Account Setup
1. **Sign up**: https://cloudflare.com (use your ProtonMail)
2. **Add domain** to Cloudflare
3. **Choose plan**: Free (sufficient for our needs)
4. **Update nameservers** (if domain bought elsewhere)
5. **Enable security features**:
   - SSL/TLS: Full (strict)
   - Always Use HTTPS: On
   - Security Level: Medium

---

## Step 3: Email Setup (Cloudflare Email Routing)

### 📨 Cloudflare Email Routing (Free!)
1. **Navigate**: Cloudflare Dashboard > Email > Email Routing
2. **Enable** Email Routing for your domain
3. **Add custom addresses**:
   - `contact@cloudcostcontrol.net` → Forward to your ProtonMail
   - `hello@cloudcostcontrol.net` → Forward to your ProtonMail
   - `admin@cloudcostcontrol.net` → Forward to your ProtonMail

### ✅ Benefits of Cloudflare Email Routing
- ✅ **Free** - No monthly costs
- ✅ **Professional** - Use your domain for email
- ✅ **Flexible** - Easy to change forwarding
- ✅ **Reliable** - Enterprise-grade infrastructure
- ✅ **Spam filtering** - Built-in protection

### 📤 Sending Emails (For Form Notifications)
**Option A: Cloudflare Email Workers (Beta)**
- Currently in beta, check availability
- Native Cloudflare solution

**Option B: SMTP via Cloudflare Workers**
- Use your domain's email via SMTP
- Set up through cPanel/hosting provider

**Option C: Free SendGrid (Fallback)**
- Only if Cloudflare options unavailable
- 100 emails/day free

---

## Step 4: Static Site Hosting (Cloudflare Pages)

### 🌍 Cloudflare Pages Setup
1. **Navigate**: Cloudflare Dashboard > Pages
2. **Connect Git** (GitHub/GitLab) or upload files
3. **Configure build**:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Framework: Astro
4. **Deploy** - Automatic builds on git push

### 🔧 Custom Domain Setup
1. **Add custom domain**: `cloudcostcontrol.net`
2. **DNS automatically configured**
3. **SSL certificate** automatically provisioned

---

## Step 5: Worker Deployment

### ⚙️ Cloudflare Workers Setup
1. **Navigate**: Cloudflare Dashboard > Workers
2. **Install Wrangler CLI**:
   ```bash
   npm install -g wrangler
   wrangler login
   ```
3. **Deploy worker**:
   ```bash
   cd landing-page-form-handler-worker
   npm install
   wrangler deploy
   ```

### 🔗 Custom Route (Optional)
1. **Add route**: `cloudcostcontrol.net/api/contact`
2. **Points to**: Your deployed worker
3. **Update** Contact.astro with: `/api/contact`

---

## Step 6: Email Sending Configuration

### 🎯 Best Option: Cloudflare Email Workers
```javascript
// In your worker, if Email Workers available:
await env.EMAIL.send({
  from: "contact@cloudcostcontrol.net",
  to: "contact@cloudcostcontrol.net",
  subject: "New Lead",
  content: emailBody
});
```

### 🔄 Fallback Option: SendGrid Integration
1. **Only if** Cloudflare Email Workers unavailable
2. **Sign up**: https://sendgrid.com (100 emails/day free)
3. **Get API key**
4. **Set secret**: `wrangler secret put SENDGRID_API_KEY`

---

## Step 7: Complete Setup Checklist

### ✅ Account Setup
- [ ] ProtonMail account created and verified
- [ ] Cloudflare account created
- [ ] Domain purchased and added to Cloudflare
- [ ] Email routing configured and tested

### ✅ Services Configuration
- [ ] Cloudflare Pages deployed with custom domain
- [ ] Worker deployed and accessible
- [ ] Email forwarding working
- [ ] Form submissions sending notifications

### ✅ Testing
- [ ] Website loads at `https://cloudcostcontrol.net`
- [ ] Contact form submits successfully
- [ ] Email notifications received
- [ ] SSL certificate working (green lock)

---

## 💰 Cost Breakdown

### Monthly Costs
- **Domain**: ~$1/month (annual billing)
- **Cloudflare Services**: $0 (free tier)
- **ProtonMail**: $0 (free tier)
- **Total**: ~$1/month

### What's Free
- ✅ Cloudflare Pages hosting
- ✅ Cloudflare Workers (100k requests/day)
- ✅ Email routing and forwarding
- ✅ SSL certificates
- ✅ CDN and DDoS protection
- ✅ Analytics and monitoring

---

## 🚀 Deployment Commands Summary

```bash
# 1. Deploy the worker
cd landing-page-form-handler-worker
npm install
wrangler login
wrangler deploy

# 2. Deploy the website (if using Git)
# Push to GitHub/GitLab and connect to Cloudflare Pages

# 3. Or deploy website manually
cd landing-page
npm install
npm run build
# Upload dist/ folder to Cloudflare Pages
```

---

## 🔒 Security Best Practices

1. **Enable 2FA** on all accounts
2. **Use API tokens** instead of global API keys
3. **Regularly rotate** secrets and tokens
4. **Monitor** access logs and analytics
5. **Keep ProtonMail** as secure backup contact

---

## 📞 Support Resources

- **Cloudflare Support**: https://support.cloudflare.com/
- **Cloudflare Community**: https://community.cloudflare.com/
- **ProtonMail Support**: https://proton.me/support
- **Documentation**: All services have excellent docs

---

## 🎯 Next Steps After Setup

1. **Test everything** thoroughly
2. **Set up monitoring** and alerts
3. **Create backup** procedures
4. **Document** your configuration
5. **Scale** as your business grows

This setup gives you enterprise-grade infrastructure for less than $15/month total! 🚀
