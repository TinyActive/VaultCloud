# GitHub Actions Deployment

This directory contains the GitHub Actions workflow for automated deployment to Cloudflare.

## 📁 Files

- **`workflows/deploy.yml`** - Main deployment workflow

## 🚀 Quick Start

### 1. Setup GitHub Secrets

Before the first deployment, you need to configure secrets:

```bash
# Generate secrets locally
npm run generate:secrets

# Then add these to GitHub:
# Repository → Settings → Secrets and variables → Actions
```

**Required Secrets:**
- `CLOUDFLARE_API_TOKEN` - API token with Workers, D1, KV, Pages permissions
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID
- `JWT_SECRET` - 64 hex character string for JWT signing
- `ENCRYPTION_KEY` - 64 hex character string for data encryption

**Optional Secrets:**
- `RESEND_API_KEY` - For email functionality
- `VITE_API_URL` - Custom API URL (auto-generated if not set)

See [SECRETS_SETUP.md](../SECRETS_SETUP.md) for detailed instructions.

### 2. Deploy

Push to main branch:
```bash
git push origin main
```

Or manually trigger:
- Go to Actions tab
- Select "Deploy to Cloudflare Pages and Workers"
- Click "Run workflow"

## 🔄 Workflow Overview

The deployment workflow consists of 4 jobs:

### 1. Setup Infrastructure (`setup-infrastructure`)
- ✅ Auto-creates D1 Database if not exists
- ✅ Auto-creates KV Namespace if not exists
- ✅ Updates wrangler.toml with resource IDs
- ⏱️ Duration: ~1-2 minutes

### 2. Setup Database (`setup-database`)
- ✅ Runs schema migrations
- ✅ Runs additional migrations (002, 003)
- ✅ Seeds database with default data
- ⏱️ Duration: ~2-3 minutes

### 3. Deploy Worker (`deploy-worker`)
- ✅ Configures worker secrets
- ✅ Deploys API to Cloudflare Workers
- ⏱️ Duration: ~2-3 minutes

### 4. Deploy Frontend (`deploy-frontend`)
- ✅ Builds React frontend
- ✅ Deploys to Cloudflare Pages
- ⏱️ Duration: ~3-4 minutes

**Total Time: ~8-12 minutes**

## ⚙️ Environment Variables

Configured in `deploy.yml`:

```yaml
NODE_VERSION: '20'                      # Node.js version
D1_DATABASE_NAME: 'vaultcloud-db'       # D1 database name
KV_NAMESPACE_NAME: 'vaultcloud-sessions' # KV namespace name
PAGES_PROJECT_NAME: 'vaultcloud'        # Pages project name
```

## 🔧 Customization

### Skip Database Seeding

For manual workflow runs, you can skip database seeding:

1. Go to Actions → Deploy workflow
2. Click "Run workflow"
3. Check "Skip database seeding"

### Change Resource Names

Edit environment variables in `deploy.yml`:

```yaml
env:
  D1_DATABASE_NAME: 'your-db-name'
  KV_NAMESPACE_NAME: 'your-kv-name'
  PAGES_PROJECT_NAME: 'your-pages-name'
```

## 📊 Monitoring

### View Logs

- GitHub Actions → Latest workflow run → Expand job steps

### Cloudflare Dashboard

- Workers: `dash.cloudflare.com/{account}/workers`
- Pages: `dash.cloudflare.com/{account}/pages`
- D1: `dash.cloudflare.com/{account}/d1`
- KV: `dash.cloudflare.com/{account}/kv`

### Real-time Worker Logs

```bash
npm run worker:tail
```

## 🐛 Troubleshooting

### "API token missing"
- Verify `CLOUDFLARE_API_TOKEN` is set in GitHub Secrets
- Check token hasn't expired

### "Unauthorized"
- Verify API token has correct permissions:
  - Workers Scripts: Edit
  - D1: Edit
  - KV Storage: Edit
  - Cloudflare Pages: Edit

### "Database already exists"
- Normal - workflow detects and reuses existing resources
- No action needed

### "Migration failed"
- Check which migration failed in logs
- Migrations 002/003 may fail if already applied (OK)
- Schema migration failure is critical - check SQL syntax

### Deploy fails after secrets change
- Secrets are cached - may need to re-run workflow
- Clear Actions cache if issues persist

## 🔐 Security Best Practices

1. ✅ **Rotate secrets regularly** (every 90 days)
2. ✅ **Use different secrets** for dev/staging/prod
3. ✅ **Never commit secrets** to repository
4. ✅ **Audit secret access** periodically
5. ✅ **Change default passwords** immediately after first deploy

## 📚 Documentation

- [Full Deployment Guide](../DEPLOYMENT.md)
- [Secrets Setup Guide](../SECRETS_SETUP.md)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)

## 🆘 Getting Help

If you encounter issues:

1. Check workflow logs in GitHub Actions
2. Review [DEPLOYMENT.md](../DEPLOYMENT.md) troubleshooting section
3. Check Cloudflare dashboard for resource status
4. Open an issue with:
   - Workflow run link
   - Error message
   - Steps to reproduce

## 🎯 Success Indicators

After successful deployment:

- ✅ All 4 jobs complete successfully (green checks)
- ✅ Frontend accessible at `https://vaultcloud.pages.dev`
- ✅ API responds at worker URL
- ✅ Can login with default credentials
- ✅ Database has seeded data

## 📝 Next Steps

After first deployment:

1. Access your site at the provided URL
2. Login with admin credentials (see seed.sql)
3. **Change admin password immediately**
4. Configure site settings
5. Test functionality
6. Setup custom domain (optional)

---

**Maintained by:** VaultCloud Team  
**Last Updated:** 2025-11-07
