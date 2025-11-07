# 📋 GitHub Secrets - Quick Reference Card

## Required Secrets (4)

| Secret Name | Example Value | How to Get | Notes |
|------------|---------------|------------|-------|
| `CLOUDFLARE_API_TOKEN` | `AbCdEf1234567890...` | [Create Token](https://dash.cloudflare.com/profile/api-tokens) | Needs Workers, D1, KV, Pages permissions |
| `CLOUDFLARE_ACCOUNT_ID` | `a1b2c3d4e5f6...` | Dashboard URL or sidebar | 32-character hex string |
| `JWT_SECRET` | `3a7f9d2e1c8b...` | `npm run generate:secrets` | 64 hex characters |
| `ENCRYPTION_KEY` | `9f2e5d8c1b4a...` | `npm run generate:secrets` | 64 hex characters, MUST be different from JWT_SECRET |

## Optional Secrets (2)

| Secret Name | Example Value | How to Get | Notes |
|------------|---------------|------------|-------|
| `RESEND_API_KEY` | `re_AbCdEf123...` | [Resend.com](https://resend.com/api-keys) | For email functionality |
| `VITE_API_URL` | `https://api.yourdomain.com` | Your custom domain | Auto-generated if not set |

## Quick Commands

### Generate JWT_SECRET and ENCRYPTION_KEY
```bash
# Method 1: Use built-in script
npm run generate:secrets

# Method 2: OpenSSL
openssl rand -hex 32

# Method 3: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Method 4: PowerShell
-join ((48..57) + (65..70) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

### Add to GitHub
1. Go to: `https://github.com/YOUR_USERNAME/VaultCloud/settings/secrets/actions`
2. Click: **New repository secret**
3. Add each secret with exact name and value

## Validation Checklist

Before deploying:
- [ ] All 4 required secrets added
- [ ] No typos in secret names (case-sensitive!)
- [ ] `JWT_SECRET` ≠ `ENCRYPTION_KEY` (must be different)
- [ ] Both secrets are 64 characters (128 bits)
- [ ] `CLOUDFLARE_API_TOKEN` has correct permissions
- [ ] Tested token: `curl -H "Authorization: Bearer TOKEN" https://api.cloudflare.com/client/v4/user/tokens/verify`

## Common Mistakes

❌ **Wrong:** Using same value for JWT_SECRET and ENCRYPTION_KEY  
✅ **Right:** Generate two different random values

❌ **Wrong:** Secret name with spaces or wrong case  
✅ **Right:** Exact names from table above

❌ **Wrong:** 32 characters (hex appears as 64)  
✅ **Right:** 64 hex characters = 32 bytes

❌ **Wrong:** API token without D1 permission  
✅ **Right:** Token with Workers + D1 + KV + Pages

## Quick Test

After adding secrets:
```bash
# Push to trigger deploy
git commit --allow-empty -m "Test deploy"
git push origin main

# Or manually run workflow
# Actions → Deploy to Cloudflare → Run workflow
```

## Need Help?

- 📖 Full guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
- 🔐 Detailed setup: [SECRETS_SETUP.md](./SECRETS_SETUP.md)
- 🐛 Issues: [GitHub Issues](https://github.com/TinyActive/VaultCloud/issues)

---
Generated: 2025-11-07 | [View Source](.github/workflows/deploy.yml)
