# C³ - Cloud Cost Control | Landing Page

> Professional Azure cost optimization landing page built with Astro and deployed on Cloudflare Workers.

[![Live Site](https://img.shields.io/badge/Live-cloudcostcontrol.net-blue)](https://cloudcostcontrol.net)
[![Built with Astro](https://img.shields.io/badge/Built%20with-Astro-orange)](https://astro.build)
[![Deployed on Cloudflare](https://img.shields.io/badge/Deployed%20on-Cloudflare%20Workers-yellow)](https://workers.cloudflare.com)

## 🌐 Live Site

**Production:** [https://cloudcostcontrol.net](https://cloudcostcontrol.net)

## 📋 Overview

C³ - Cloud Cost Control is a professional Azure cost optimization consultancy landing page featuring:

- 🎯 **High-Converting Landing Page** - Services, testimonials, and optimized CTAs
- 📝 **Integrated Blog System** - Azure cost optimization articles and insights  
- 📧 **Smart Contact Form** - Cloudflare Workers backend with email integration
- 📅 **Cal.com Integration** - Direct appointment scheduling
- 📱 **Mobile-First Design** - Responsive across all devices
- ⚡ **Lightning Fast** - Deployed on Cloudflare's global edge network

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | [Astro](https://astro.build/) 5.10.1 |
| **Deployment** | [Cloudflare Workers](https://workers.cloudflare.com/) |
| **Styling** | Custom CSS (no frameworks) |
| **Forms** | Cloudflare Workers + Email Workers |
| **Content** | Astro Content Collections |
| **Domain** | Custom domain with Cloudflare DNS |

## 🏗️ Project Structure

```
landing-page/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── Contact.astro    # Contact form with validation
│   │   ├── Hero.astro       # Landing page hero section
│   │   ├── Services.astro   # Services showcase
│   │   └── ValueProposition.astro
│   ├── content/             # Content collections
│   │   └── blog/           # Blog posts (Markdown)
│   │       ├── 10-azure-cost-cutting-strategies.md
│   │       ├── azure-reserved-vs-spot-instances.md
│   │       └── hidden-azure-costs.md
│   ├── layouts/            # Page layouts
│   │   ├── Layout.astro    # Base layout with SEO
│   │   └── BlogPost.astro  # Blog post layout
│   ├── pages/              # Route pages
│   │   ├── index.astro     # Homepage
│   │   ├── thank-you.astro # Form success page
│   │   └── blog/          # Blog routes
│   │       ├── index.astro # Blog listing
│   │       └── [slug].astro # Dynamic blog posts
│   └── public/             # Static assets
│       ├── favicon.svg
│       ├── og-image.svg
│       └── manifest.json
├── dist/                   # Build output
├── astro.config.mjs       # Astro configuration
├── wrangler.toml          # Cloudflare Workers config
├── package.json           # Dependencies and scripts
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **npm** or **yarn**
- **Wrangler CLI** (for deployment)
  ```bash
  npm install -g wrangler
  ```

### Installation

1. **Clone and Install Dependencies**
   ```bash
   cd landing-page
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```
   🌐 Open [http://localhost:4321](http://localhost:4321)

3. **Build for Production**
   ```bash
   npm run build
   ```

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run deploy` | Deploy to Cloudflare Workers (default) |
| `npm run deploy:prod` | Deploy to production environment |
| `npm run deploy:preview` | Deploy to preview environment |

## 🚀 Deployment

### Production Deployment

Deploy to the live site at `cloudcostcontrol.net`:

```bash
npm run deploy:prod
```

### Preview Deployment

Deploy to a preview environment for testing:

```bash
npm run deploy:preview
```

### Deployment Details

- **Primary Domain:** `cloudcostcontrol.net`
- **WWW Redirect:** `www.cloudcostcontrol.net` → `cloudcostcontrol.net`
- **Workers.dev Fallback:** Available for development
- **Static Assets:** Served via Cloudflare Workers + KV
- **SSL:** Automatic HTTPS with Cloudflare

## 📧 Contact Form System

The contact form integrates with a dedicated Cloudflare Worker:

### Features
- ✅ **Real-time Validation** - Client and server-side validation
- ✅ **Email Notifications** - Cloudflare Email Workers integration
- ✅ **Spam Protection** - Honeypot fields and rate limiting
- ✅ **Success Handling** - Smooth UX with status messages
- ✅ **Mobile Optimized** - Responsive form design

### Form Handler
- **Location:** `../landing-page-form-handler-worker/`
- **Backend:** Cloudflare Workers + Email Workers
- **Endpoint:** `https://cloudcostcontrol.net/api/contact`
- **Security:** CORS protection, input validation, rate limiting

## 📝 Content Management

### Blog Posts

Blog posts are written in Markdown with frontmatter metadata:

```markdown
---
title: "10 Immediate Azure Cost-Cutting Strategies"
description: "Discover proven techniques to reduce Azure costs by 30-50%"
pubDate: 2024-12-29
tags: ["azure", "cost-optimization", "cloud-savings"]
author: "C³ - Cloud Cost Control"
draft: false
---

Your blog content goes here...
```

### Adding New Blog Posts

1. **Create Markdown File**
   ```bash
   touch src/content/blog/your-new-post.md
   ```

2. **Add Frontmatter** (title, description, date, tags, author)

3. **Write Content** in Markdown format

4. **Build and Deploy**
   ```bash
   npm run deploy:prod
   ```

## 🎨 Design System

### Colors
- **Primary:** `#667eea` (Blue)
- **Secondary:** `#764ba2` (Purple)  
- **Accent:** `#10b981` (Green)
- **Text:** `#1f2937` (Dark Gray)

### Typography
- **Font Family:** Inter (Google Fonts)
- **Headings:** 600-700 weight
- **Body:** 400 weight
- **Code:** Monospace fallbacks

### Components
- **Buttons:** Primary/secondary variants with hover effects
- **Forms:** Consistent styling with validation states
- **Cards:** Subtle shadows and rounded corners
- **Navigation:** Clean, minimal design

## ⚡ Performance & SEO

### Performance Features
- **Lighthouse Score:** 95+ on all metrics
- **Core Web Vitals:** Optimized for speed
- **Image Optimization:** SVG icons and optimized assets
- **Caching:** Aggressive static asset caching via Cloudflare

### SEO Optimization
- ✅ **Meta Tags** - Title, description, keywords
- ✅ **Open Graph** - Social media previews
- ✅ **Twitter Cards** - Twitter-specific metadata  
- ✅ **JSON-LD** - Structured data for search engines
- ✅ **Sitemap** - Auto-generated XML sitemap
- ✅ **Canonical URLs** - Prevent duplicate content
- ✅ **Mobile-Friendly** - Responsive design

## 🔒 Security Features

- **HTTPS Enforcement** - Automatic SSL/TLS
- **Security Headers** - CSP, XSS protection, HSTS
- **Form Validation** - Client and server-side sanitization
- **CORS Protection** - Configured for API endpoints
- **Rate Limiting** - Prevent abuse on contact form
- **Spam Protection** - Honeypot fields and validation

## 📊 Analytics & Monitoring

### Available Metrics
- **Cloudflare Analytics** - Traffic, performance, security
- **Workers Analytics** - Function performance and errors
- **Contact Form Tracking** - Submission success/failure rates
- **Blog Engagement** - Page views and user behavior

### Monitoring
- **Uptime:** Cloudflare global monitoring
- **Performance:** Real User Monitoring (RUM)
- **Errors:** Cloudflare Workers exception tracking
- **Logs:** Structured logging for debugging

## 🔧 Configuration Files

### Core Configuration

| File | Purpose |
|------|---------|
| `astro.config.mjs` | Astro build and development settings |
| `wrangler.toml` | Cloudflare Workers deployment config |
| `package.json` | Dependencies and npm scripts |
| `tsconfig.json` | TypeScript configuration |

### Key Settings

```javascript
// astro.config.mjs
export default defineConfig({
  site: 'https://cloudcostcontrol.net',
  trailingSlash: 'ignore',
  build: {
    format: 'directory'  // For proper routing
  }
});
```

## 🔗 Related Projects

- **📧 Form Handler:** `../landing-page-form-handler-worker/`
- **📚 Documentation:** `../docs/`
- **🏠 Main Project:** `../` (root directory)

## 🐛 Troubleshooting

### Common Issues

**Build Errors:**
```bash
# Clear cache and rebuild
rm -rf dist/ .astro/
npm run build
```

**Deployment Issues:**
```bash
# Check Wrangler authentication
wrangler whoami

# Login if needed
wrangler login
```

**CSS Warnings:**
- Check for duplicate closing braces in style tags
- Validate CSS syntax in .astro files

### Support

For technical issues:
- **Email:** contact@cloudcostcontrol.net
- **Documentation:** `../docs/` directory
- **Logs:** Check Cloudflare Workers dashboard

## 📄 License

Private project for C³ - Cloud Cost Control.

---

## 🚀 Quick Deploy Commands

```bash
# Development
npm run dev

# Production deployment
npm run deploy:prod

# Check deployment
curl -I https://cloudcostcontrol.net

# View logs
wrangler tail --env production
```

**Built with ❤️ for Azure cost optimization**
