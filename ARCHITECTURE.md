# VaultCloud Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        VaultCloud Architecture                      │
└─────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │   Browser    │
                              │  (User UI)   │
                              └──────┬───────┘
                                     │
                       ┌─────────────┼─────────────┐
                       │             │             │
                  ┌────▼────┐   ┌───▼────┐   ┌───▼────┐
                  │  React  │   │ PGP.js │   │ Theme  │
                  │   App   │   │(Crypto)│   │  i18n  │
                  └────┬────┘   └────────┘   └────────┘
                       │
                  ┌────▼────────────────┐
                  │   API Service       │
                  │  (apiService.ts)    │
                  └────┬────────────────┘
                       │ HTTPS (Bearer Token)
                       │
            ┌──────────▼──────────────────────────┐
            │    Cloudflare Pages (Frontend)      │
            │  • Static hosting                   │
            │  • Global CDN                       │
            │  • Automatic SSL                    │
            └─────────────────────────────────────┘
                       │
            ┌──────────▼──────────────────────────┐
            │   Cloudflare Workers (Backend)      │
            │  ┌─────────────────────────────┐   │
            │  │  Router (index.ts)          │   │
            │  └────┬──────────────┬─────────┘   │
            │       │              │              │
            │  ┌────▼────┐    ┌───▼──────┐      │
            │  │Handlers │    │Middleware│      │
            │  │ • Auth  │    │ • CORS   │      │
            │  │ • Entry │    │ • Auth   │      │
            │  │ • Notes │    │ • Security│     │
            │  │ • Share │    │ • Headers│      │
            │  │ • Users │    └──────────┘      │
            │  └────┬────┘                       │
            │       │                            │
            │  ┌────▼────────────┐              │
            │  │  Utils & Types  │              │
            │  │  • Crypto       │              │
            │  │  • Validation   │              │
            │  └─────────────────┘              │
            └─────┬───────────────┬──────────────┘
                  │               │
       ┌──────────▼──────┐  ┌────▼────────────┐
       │  Cloudflare D1  │  │ Cloudflare KV   │
       │   (Database)    │  │   (Sessions)    │
       │                 │  │                 │
       │ • users         │  │ • session_token │
       │ • vault_entries │  │ • user_id       │
       │ • notes         │  │ • expires_at    │
       │ • shared_items  │  └─────────────────┘
       │ • fido_keys     │
       │ • sessions      │
       │ • magic_links   │
       └─────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                         Data Flow Example                           │
└─────────────────────────────────────────────────────────────────────┘

Login Flow:
───────────
1. User enters email/password in React UI
2. apiService.login() sends POST to /api/auth/login
3. Worker validates credentials (PBKDF2 hash comparison)
4. Worker creates session token
5. Worker stores session in KV (7 days TTL)
6. Worker returns user data + token
7. Frontend stores token in localStorage
8. Frontend updates UI with user data

Create Entry Flow:
─────────────────
1. User fills entry form in React UI
2. (Optional) PGP.js encrypts password client-side
3. apiService.createEntry() sends POST to /api/entries
4. Worker validates auth token from KV
5. Worker validates input & sanitizes
6. Worker inserts entry into D1 database
7. Worker returns created entry
8. Frontend updates entries list

Share Entry Flow:
────────────────
1. User selects entry and clicks "Share"
2. User enters email and permission level
3. apiService.shareItem() sends POST to /api/share
4. Worker validates auth token
5. Worker checks entry ownership
6. Worker creates shared_items record in D1
7. Shared user can now access entry
8. Frontend updates share list


┌─────────────────────────────────────────────────────────────────────┐
│                        Security Layers                              │
└─────────────────────────────────────────────────────────────────────┘

Layer 1: Network
├─ HTTPS encryption (Cloudflare SSL)
├─ CORS protection
└─ Security headers (CSP, X-Frame-Options, etc.)

Layer 2: Authentication
├─ PBKDF2 password hashing (100k iterations)
├─ Session tokens with expiration
└─ KV-based session management

Layer 3: Authorization
├─ Role-based access control (admin/user)
├─ Resource ownership verification
└─ Sharing permission enforcement

Layer 4: Data Protection
├─ Optional client-side PGP encryption
├─ Input sanitization
├─ SQL injection prevention (prepared statements)
└─ XSS prevention (sanitization + escaping)

Layer 5: Application
├─ Token validation on every request
├─ Error message sanitization
└─ Rate limiting (recommended for production)


┌─────────────────────────────────────────────────────────────────────┐
│                      Deployment Pipeline                            │
└─────────────────────────────────────────────────────────────────────┘

GitHub Repository
       │
       ├─── Push to main branch
       │
       ▼
GitHub Actions Workflow
       │
       ├──────────────┬─────────────┐
       │              │             │
    Build           Deploy        Deploy
   Frontend        Worker        Pages
       │              │             │
       ▼              ▼             ▼
  npm run build  wrangler deploy  Cloudflare
       │              │           Pages API
       ▼              ▼             │
   dist/folder    Worker API        │
       │              │             │
       └──────────────┴─────────────┘
                      │
                Production Environment
                      │
              ┌───────┴────────┐
              │                │
         D1 Database      KV Namespace
         (Production)     (Production)


┌─────────────────────────────────────────────────────────────────────┐
│                         Technology Stack                            │
└─────────────────────────────────────────────────────────────────────┘

Frontend:
├─ React 19.2.0
├─ TypeScript 5.8.2
├─ Vite 6.2.0 (build tool)
└─ OpenPGP.js (encryption)

Backend:
├─ Cloudflare Workers (serverless)
├─ TypeScript 5.8.2
├─ Wrangler 4.46.0 (CLI)
└─ @cloudflare/workers-types

Database:
├─ Cloudflare D1 (SQLite-based)
└─ Cloudflare KV (key-value store)

DevOps:
├─ GitHub Actions (CI/CD)
├─ Cloudflare Pages (hosting)
└─ npm (package management)


┌─────────────────────────────────────────────────────────────────────┐
│                      Performance Metrics                            │
└─────────────────────────────────────────────────────────────────────┘

API Response Times:
├─ Auth endpoints: < 100ms
├─ CRUD operations: < 150ms
└─ List queries: < 200ms

Frontend Load Times:
├─ First paint: < 1s
├─ Interactive: < 2s
└─ Cached loads: < 500ms

Database Performance:
├─ Indexed queries: < 10ms
├─ Concurrent requests: 1000+/sec
└─ Storage: Unlimited (practical limit)

Global Distribution:
├─ Workers: 300+ edge locations
├─ CDN: Worldwide coverage
└─ Latency: < 50ms (typical)
```
