# Savionyx

This project is based on [OpenSaas](https://opensaas.sh) template and consists of three main dirs:
1. `app` - Your web app, built with [Wasp](https://wasp-lang.dev).
2. `e2e-tests` - [Playwright](https://playwright.dev/) tests for your Wasp web app.
3. `blog` - Your blog / docs, built with [Astro](https://docs.astro.build) based on [Starlight](https://starlight.astro.build/) template.

For more details, check READMEs of each respective directory!

# Develop

Start the app
```sh
wasp start db
wasp db migrate-dev
wasp start
```

Play with the db
```
wasp db studio
```

# Deploy

**Fly.io**
Server, Client & DB - https://fly.io/dashboard/savionyx

```sh
cd ./app
REACT_APP_GOOGLE_ANALYTICS_ID=G-QBFDV639N5 wasp deploy fly deploy
fly secrets set -a savionyx-app-server STRIPE_API_KEY=sk_test_... KEY2=VAL2

```

**Cloudflare**
Blog & Docs - https://dash.cloudflare.com/31dc20ce87297458111f9eaf2a7cfb7c/pages/view/docs-savionyx-com

# Analyze 

Google Analytics - https://analytics.google.com/analytics/web/

# MVP flow

**Customer**
1. signs up @ savionyx.com
2. specifies Azure Tenant ID (First admin user, follow up users invite others into the tenantId)
3. executes ./cost-management/onboarding-script.ps1
    creates a resource group and a storage account
    grants owner access to the resource group
    grants billing owner access to the tenant

**Savionyx**
1. creates a cost export
    create cost export (https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/tutorial-export-acm-data?tabs=azure-cli)

3. Savionyx summarizes data

4. Savionyx presents data in a dashboard

