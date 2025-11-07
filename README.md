<div align="center">
<img width="1200" height="475" alt="GHBanner" src="logo/banner.png" />
</div>

# VaultCloud - Secure Password & Account Manager

A modern, secure password and account management application built with:
- **Frontend**: React 19 + TypeScript + Vite (Cloudflare Pages)
- **Backend**: Cloudflare Workers API
- **Database**: Cloudflare D1

## Features

🔐 Secure password storage with PGP encryption  
📝 Encrypted notes management  
👥 Multi-user support with role-based access  
🔑 Multiple authentication methods (Password, Magic Link, FIDO2)  
🔄 Share passwords and notes securely  
🎨 Dark/Light theme support  
🌍 Multi-language support (i18n)

## Quick Start

### Prerequisites

- Node.js 18+
- Cloudflare account
- Wrangler CLI: `npm install -g wrangler`

### Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env.local
   cp .dev.vars.example .dev.vars
   ```

3. **Initialize D1 database (local)**
   ```bash
   wrangler d1 create vaultcloud-db --local
   wrangler d1 execute vaultcloud-db --local --file=./worker/src/db/schema.sql
   wrangler d1 execute vaultcloud-db --local --file=./worker/src/db/seed.sql
   ```

4. **Start development servers**
   
   Terminal 1 - Worker API:
   ```bash
   npm run worker:dev
   ```
   
   Terminal 2 - Frontend:
   ```bash
   npm run dev
   ```

5. **Access the app**
   - Frontend: http://localhost:5173
   - API: http://localhost:8787

### Test Accounts

- **Admin**: admin@vaultcloud.dev / admin123
- **User**: user@vaultcloud.dev / user123


### Quick Deploy

1. Create D1 database: `wrangler d1 create vaultcloud-db`
2. Create KV namespace: `wrangler kv:namespace create SESSIONS`
3. Update `wrangler.toml` with IDs
4. Deploy Worker: `npm run worker:deploy`
5. Build frontend: `npm run build`
6. Deploy to Cloudflare Pages via dashboard or GitHub Actions


## License

MIT License
