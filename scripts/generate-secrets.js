/**
 * VaultCloud Secrets Generator
 * Generates secure random secrets for deployment
 * 
 * Usage: node scripts/generate-secrets.js
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generate a secure random hex string
function generateSecret(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

// Generate all required secrets
function generateAllSecrets() {
  const secrets = {
    JWT_SECRET: generateSecret(32),
    ENCRYPTION_KEY: generateSecret(32),
    // Add timestamp for reference
    GENERATED_AT: new Date().toISOString()
  };

  return secrets;
}

// Format secrets for display
function formatSecrets(secrets) {
  const lines = [
    '='.repeat(70),
    '🔐 VaultCloud Secrets Generator',
    '='.repeat(70),
    '',
    '✅ REQUIRED SECRETS (Add these to GitHub Secrets)',
    '',
    '1. JWT_SECRET',
    `   ${secrets.JWT_SECRET}`,
    '',
    '2. ENCRYPTION_KEY',
    `   ${secrets.ENCRYPTION_KEY}`,
    '',
    '='.repeat(70),
    '⚠️  SECURITY WARNINGS',
    '='.repeat(70),
    '',
    '1. NEVER commit these secrets to git',
    '2. Store them securely (password manager recommended)',
    '3. These secrets are needed for GitHub Actions deployment',
    '4. Each secret must be unique - DO NOT reuse!',
    '5. ENCRYPTION_KEY cannot be changed after deployment (data loss)',
    '',
    '='.repeat(70),
    '📋 NEXT STEPS',
    '='.repeat(70),
    '',
    '1. Copy JWT_SECRET to GitHub Secrets:',
    '   Repository → Settings → Secrets → New secret',
    '   Name: JWT_SECRET',
    '   Value: [paste the value above]',
    '',
    '2. Copy ENCRYPTION_KEY to GitHub Secrets:',
    '   Name: ENCRYPTION_KEY',
    '   Value: [paste the value above]',
    '',
    '3. Add Cloudflare credentials:',
    '   - CLOUDFLARE_API_TOKEN (from Cloudflare Dashboard)',
    '   - CLOUDFLARE_ACCOUNT_ID (from Cloudflare Dashboard)',
    '',
    '4. (Optional) Add email service:',
    '   - RESEND_API_KEY (from resend.com)',
    '',
    '5. See SECRETS_SETUP.md for detailed instructions',
    '',
    '='.repeat(70),
    `Generated at: ${secrets.GENERATED_AT}`,
    '='.repeat(70),
    ''
  ];

  return lines.join('\n');
}

// Save secrets to a file (for backup - remember to .gitignore it!)
function saveSecretsToFile(secrets, filename = '.secrets-backup.txt') {
  const filepath = path.join(__dirname, '..', filename);
  const content = [
    '# VaultCloud Secrets Backup',
    '# KEEP THIS FILE SECURE - DO NOT COMMIT TO GIT',
    '',
    `# Generated: ${secrets.GENERATED_AT}`,
    '',
    `JWT_SECRET=${secrets.JWT_SECRET}`,
    `ENCRYPTION_KEY=${secrets.ENCRYPTION_KEY}`,
    '',
    '# Cloudflare Credentials (fill these in manually)',
    'CLOUDFLARE_API_TOKEN=',
    'CLOUDFLARE_ACCOUNT_ID=',
    '',
    '# Optional',
    'RESEND_API_KEY=',
    'VITE_API_URL=',
    ''
  ].join('\n');

  try {
    fs.writeFileSync(filepath, content, 'utf8');
    return filepath;
  } catch (error) {
    console.error('Warning: Could not save backup file:', error.message);
    return null;
  }
}

// Generate PowerShell script for Windows users
function generatePowershellScript() {
  return `# VaultCloud Secrets Generator (PowerShell)
# Run this in PowerShell to generate secrets

Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 69) -ForegroundColor Cyan
Write-Host "🔐 VaultCloud Secrets Generator (PowerShell)" -ForegroundColor Green
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 69) -ForegroundColor Cyan
Write-Host ""

# Generate JWT_SECRET
$jwtSecret = -join ((48..57) + (65..70) | Get-Random -Count 64 | ForEach-Object {[char]$_})
Write-Host "1. JWT_SECRET:" -ForegroundColor Yellow
Write-Host "   $jwtSecret" -ForegroundColor White
Write-Host ""

# Generate ENCRYPTION_KEY
$encKey = -join ((48..57) + (65..70) | Get-Random -Count 64 | ForEach-Object {[char]$_})
Write-Host "2. ENCRYPTION_KEY:" -ForegroundColor Yellow
Write-Host "   $encKey" -ForegroundColor White
Write-Host ""

Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 69) -ForegroundColor Cyan
Write-Host "✅ Copy these secrets to GitHub:" -ForegroundColor Green
Write-Host "   Repository → Settings → Secrets → New secret" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 Tip: Use Set-Clipboard to copy:" -ForegroundColor Blue
Write-Host '   $jwtSecret | Set-Clipboard' -ForegroundColor Gray
Write-Host ""
`;
}

// Generate Bash script for Linux/Mac users
function generateBashScript() {
  return `#!/bin/bash
# VaultCloud Secrets Generator (Bash)
# Run this to generate secrets

echo "======================================================================"
echo "🔐 VaultCloud Secrets Generator (Bash)"
echo "======================================================================"
echo ""

# Generate JWT_SECRET
JWT_SECRET=$(openssl rand -hex 32)
echo "1. JWT_SECRET:"
echo "   $JWT_SECRET"
echo ""

# Generate ENCRYPTION_KEY
ENCRYPTION_KEY=$(openssl rand -hex 32)
echo "2. ENCRYPTION_KEY:"
echo "   $ENCRYPTION_KEY"
echo ""

echo "======================================================================"
echo "✅ Copy these secrets to GitHub:"
echo "   Repository → Settings → Secrets → New secret"
echo ""
echo "💡 Tip: Copy to clipboard:"
echo "   Mac:   echo \$JWT_SECRET | pbcopy"
echo "   Linux: echo \$JWT_SECRET | xclip -selection clipboard"
echo ""
`;
}

// Main execution
function main() {
  console.log('Generating secrets...\n');

  // Generate secrets
  const secrets = generateAllSecrets();

  // Display secrets
  console.log(formatSecrets(secrets));

  // Save backup file
  const backupFile = saveSecretsToFile(secrets);
  if (backupFile) {
    console.log(`📁 Secrets backed up to: ${backupFile}`);
    console.log('   (This file is git-ignored for security)\n');
  }

  // Save PowerShell script
  const psScriptPath = path.join(__dirname, 'generate-secrets.ps1');
  fs.writeFileSync(psScriptPath, generatePowershellScript(), 'utf8');
  console.log(`📄 PowerShell script saved: ${psScriptPath}`);

  // Save Bash script
  const bashScriptPath = path.join(__dirname, 'generate-secrets.sh');
  fs.writeFileSync(bashScriptPath, generateBashScript(), 'utf8');
  fs.chmodSync(bashScriptPath, '755');
  console.log(`📄 Bash script saved: ${bashScriptPath}`);

  console.log('\n✨ All done! Follow the instructions above.\n');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  generateSecret,
  generateAllSecrets
};
