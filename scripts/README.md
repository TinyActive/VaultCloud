# 🛠️ VaultCloud Scripts

Utility scripts for VaultCloud development and deployment.

## Available Scripts

### 📝 generate-secrets.js

Generates secure random secrets for deployment.

**Usage:**
```bash
# Via npm
npm run generate:secrets

# Direct execution
node scripts/generate-secrets.js
```

**Output:**
- Displays generated secrets in console
- Creates `.secrets-backup.txt` (git-ignored)
- Generates platform-specific scripts

**Generates:**
- `JWT_SECRET` - 64 hex characters (32 bytes)
- `ENCRYPTION_KEY` - 64 hex characters (32 bytes)

**Generated Files:**
- `.secrets-backup.txt` - Text backup of secrets
- `generate-secrets.ps1` - PowerShell version
- `generate-secrets.sh` - Bash version

### 🪟 generate-secrets.ps1

PowerShell version of secret generator for Windows users.

**Usage:**
```powershell
# Run in PowerShell
.\scripts\generate-secrets.ps1

# Copy to clipboard
.\scripts\generate-secrets.ps1
$jwtSecret | Set-Clipboard
```

### 🐧 generate-secrets.sh

Bash script for Linux/Mac users.

**Usage:**
```bash
# Make executable (first time)
chmod +x scripts/generate-secrets.sh

# Run
./scripts/generate-secrets.sh

# Copy to clipboard (Mac)
./scripts/generate-secrets.sh
echo $JWT_SECRET | pbcopy

# Copy to clipboard (Linux with xclip)
echo $JWT_SECRET | xclip -selection clipboard
```

### 🚀 setup.sh

Initial setup script for local development.

**Usage:**
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

**What it does:**
- Installs dependencies
- Sets up wrangler
- Creates local D1 database
- Runs migrations
- Seeds database

## Adding New Scripts

### Structure

```javascript
/**
 * Script description
 * 
 * Usage: node scripts/your-script.js
 */

// Your code here

// Export functions if needed
module.exports = {
  yourFunction
};
```

### Best Practices

1. ✅ Add header comment with usage
2. ✅ Handle errors gracefully
3. ✅ Provide clear output messages
4. ✅ Export reusable functions
5. ✅ Document in this README

### Testing

```bash
# Test the script
node scripts/your-script.js

# Check for errors
echo $?  # Should be 0 for success
```

## Security Notes

### Secrets Files

These files are **git-ignored** for security:
- `.secrets-backup.txt`
- `.secrets-backup*.txt`
- Any file matching pattern in `.gitignore`

### Best Practices

1. ✅ Never commit secrets to git
2. ✅ Use environment variables
3. ✅ Store backups securely (password manager)
4. ✅ Rotate secrets regularly
5. ✅ Use different secrets per environment

## Common Tasks

### Generate Secrets for New Environment

```bash
npm run generate:secrets > secrets-staging.txt
# Review and add to GitHub Secrets
rm secrets-staging.txt  # Clean up
```

### Backup Current Secrets

```bash
# From GitHub
# Settings → Secrets → Copy each value to password manager

# From Cloudflare Worker
wrangler secret list
```

### Rotate Secrets

```bash
# 1. Generate new secrets
npm run generate:secrets

# 2. Update in GitHub Secrets

# 3. Update in Cloudflare Worker
echo "new-secret" | wrangler secret put JWT_SECRET

# 4. Deploy
git push origin main
```

## Troubleshooting

### "Permission denied"

```bash
# Make script executable
chmod +x scripts/your-script.sh
```

### "Command not found: node"

```bash
# Install Node.js
# Download from: https://nodejs.org/
```

### "Module not found"

```bash
# Install dependencies
npm install
```

## Integration with CI/CD

These scripts are used in GitHub Actions:

```yaml
# .github/workflows/deploy.yml
- name: Generate Secrets
  run: npm run generate:secrets
```

## Documentation

- [Deployment Guide](../DEPLOYMENT.md)
- [Secrets Setup](../SECRETS_SETUP.md)
- [Quick Reference](../SECRETS_QUICK_REF.md)

---

**Last Updated:** 2025-11-07
