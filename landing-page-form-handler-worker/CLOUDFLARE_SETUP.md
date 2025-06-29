# Cloudflare Workers Form Handler Setup Guide

## 🚀 Quick Setup Instructions

### 1. Prerequisites
- Cloudflare account (free tier is sufficient)
- Domain managed by Cloudflare
- Node.js installed locally (for Wrangler CLI)

### 2. Install Wrangler CLI
```bash
npm install -g wrangler
```

### 3. Login to Cloudflare
```bash
wrangler login
```

### 4. Deploy the Worker
```bash
# Navigate to the worker directory:
cd worker

# Install dependencies (optional, but recommended):
npm install

# Deploy the worker:
wrangler deploy
```

### 5. Set Environment Variables (Choose one email option)

#### Option A: SendGrid (Recommended)
1. Sign up for SendGrid (free tier: 100 emails/day)
2. Get your API key from SendGrid dashboard
3. Set environment variable:
```bash
# From the worker directory:
wrangler secret put SENDGRID_API_KEY
# Enter your SendGrid API key when prompted
```

#### Option B: Mailgun
1. Sign up for Mailgun (free tier: 5,000 emails/month)
2. Get your API key and domain
3. Set environment variables:
```bash
# From the worker directory:
wrangler secret put MAILGUN_API_KEY
wrangler secret put MAILGUN_DOMAIN
```

### 6. Configure Route (Optional)
If you want a custom route like `/api/contact`, update `wrangler.toml` with your domain.

### 7. Test the Worker
The worker will be available at: `https://cloudcost-control-form-handler.your-subdomain.workers.dev`

## 🔧 Email Service Setup

### SendGrid Setup (Recommended)
1. Go to https://sendgrid.com
2. Create free account (100 emails/day)
3. Go to Settings > API Keys
4. Create new API key with "Full Access"
5. Add the key to Cloudflare Workers secrets

### Mailgun Setup (Alternative)  
1. Go to https://mailgun.com
2. Create free account (5,000 emails/month)
3. Add and verify your domain
4. Get API key from dashboard
5. Add key and domain to Cloudflare Workers secrets

## 📊 Optional: Database Storage

If you want to store form submissions in a database:

1. Create D1 database:
```bash
wrangler d1 create cloudcost-control-forms
```

2. Create table:
```bash
wrangler d1 execute cloudcost-control-forms --command "CREATE TABLE form_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  monthly_spend TEXT,
  service TEXT,
  message TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  ip TEXT
);"
```

3. Uncomment the D1 section in `wrangler.toml`

## 🧪 Testing

Test your worker endpoint:
```bash
curl -X POST https://your-worker-url.workers.dev \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "name=Test&email=test@example.com&message=Test message"
```

## 🔒 Security Features Included

- ✅ CORS handling
- ✅ Honeypot spam protection  
- ✅ Input validation
- ✅ Email format validation
- ✅ Rate limiting (via Cloudflare)
- ✅ IP logging for abuse prevention

## 💰 Cost Breakdown

**Cloudflare Workers Free Tier:**
- 100,000 requests/day
- More than enough for a landing page

**Email Services:**
- SendGrid: 100 emails/day (free)
- Mailgun: 5,000 emails/month (free)

**Total Cost: $0/month** for typical landing page volume!

## 🚨 Next Steps

1. Deploy the worker using the steps above
2. Update the contact form to use the new endpoint
3. Test form submission
4. Monitor submissions in your email
