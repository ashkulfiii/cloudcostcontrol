# Landing Page Form Handler Worker

Cloudflare Worker for processing contact form submissions from the C³ - Cloud Cost Control landing page using **Cloudflare Email Workers**.

## 🎯 Purpose

This worker handles form submissions from the main landing page, providing:
- ✅ **Native email sending** via Cloudflare Email Workers
- ✅ **Spam protection** and validation
- ✅ **Professional error handling**
- ✅ **CORS support** for cross-origin requests
- ✅ **Zero third-party dependencies** (no SendGrid needed!)

## 🚀 Quick Setup

### Prerequisites
- **Email Routing enabled** on your domain in Cloudflare
- **Verified destination address** in Email Routing

### Deployment Steps

1. **Install Wrangler CLI** (if not already installed):
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**:
   ```bash
   wrangler login
   ```

3. **Deploy the worker**:
   ```bash
   wrangler deploy
   ```

That's it! No API keys, no third-party services, no secrets to manage.

## 📁 Project Structure

```
├── index.js              # Main worker code
├── wrangler.toml         # Cloudflare Workers configuration
├── package.json          # Dependencies and scripts
├── CLOUDFLARE_SETUP.md   # Detailed setup instructions
└── README.md            # This file
```

## 🔧 Configuration
## ✅ How It Works

### Email Routing Setup Required
1. **Enable Email Routing** in Cloudflare dashboard for `cloudcostcontrol.net`
2. **Add destination address** - Verify your business email
3. **Deploy worker** - Email binding automatically configured

### Form Submission Flow
1. **User submits form** → Worker receives POST request
2. **Validation** → Checks required fields, email format, honeypot
3. **Email sent** → Native Cloudflare email to `contact@cloudcostcontrol.net`
4. **Response** → Success/error message back to user

### Email Content
```
Subject: New Lead: [Name] from [Company]

Name: John Doe
Email: john@example.com
Company: Example Corp
Phone: +1 555-123-4567
Monthly Azure Spend: $1,000-5,000
Service Interest: Complete Cost Assessment

Message:
We're looking to optimize our Azure costs...

Submitted: 2025-06-29T12:34:56.789Z
IP: 192.168.1.1
```

## 🧪 Development

```bash
# Start local development server
wrangler dev

# Deploy to production
wrangler deploy

# View real-time logs
wrangler tail
```

## 🔒 Security Features

- **Honeypot protection** - Filters out bot submissions
- **Input validation** - Validates all form fields
- **Email validation** - Ensures valid email format
- **Rate limiting** - Built into Cloudflare Workers
- **CORS handling** - Proper cross-origin support

## 💰 Cost

**Completely Free!**
- **Cloudflare Workers**: 100,000 requests/day (free tier)
- **Email Workers**: Included with Email Routing (free)
- **Email Routing**: Free for personal/small business use

**No SendGrid, Mailgun, or other third-party email service costs!**
- More than sufficient for landing page forms

**Total monthly cost: $0** for typical usage!

## 🔗 Related Projects

- **Landing Page**: `../landing-page/` - The main website that uses this worker
- **Setup Guide**: `CLOUDFLARE_SETUP.md` - Detailed deployment instructions

## 📊 Monitoring

Monitor your worker performance in:
- Cloudflare Dashboard > Workers > Analytics
- Real-time logs: `npm run tail`
- Email delivery in your email service dashboard
