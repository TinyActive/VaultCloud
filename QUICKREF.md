# VaultCloud Quick Reference

## Development Commands

### Setup
```bash
npm install                    # Install dependencies
./scripts/setup.sh            # Initialize database and environment
```

### Development
```bash
npm run dev                   # Start frontend (http://localhost:5173)
npm run worker:dev            # Start worker API (http://localhost:8787)
npm run build                 # Build frontend for production
```

### Database
```bash
wrangler d1 execute vaultcloud-db --local --file=./worker/src/db/schema.sql  # Init schema
wrangler d1 execute vaultcloud-db --local --file=./worker/src/db/seed.sql    # Seed data
```

### Deployment
```bash
npm run worker:deploy         # Deploy worker to Cloudflare
npm run build                 # Build frontend
# Then deploy dist/ to Cloudflare Pages
```

## Test Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@vaultcloud.dev | admin123 | Admin |
| user@vaultcloud.dev | user123 | User |

## API Endpoints

### Authentication
```bash
POST /api/auth/register       # Register new user
POST /api/auth/login          # Login with credentials
POST /api/auth/magic-link     # Request magic link
POST /api/auth/logout         # Logout
GET  /api/auth/me            # Get current user
```

### Entries
```bash
GET    /api/entries          # List all entries
POST   /api/entries          # Create entry
GET    /api/entries/:id      # Get entry
PUT    /api/entries/:id      # Update entry
DELETE /api/entries/:id      # Delete entry
```

### Notes
```bash
GET    /api/notes            # List all notes
POST   /api/notes            # Create note
GET    /api/notes/:id        # Get note
PUT    /api/notes/:id        # Update note
DELETE /api/notes/:id        # Delete note
```

### Sharing
```bash
POST   /api/share            # Share item
GET    /api/share/:type/:id/shares  # Get shares
DELETE /api/share/:id        # Unshare
```

### Admin
```bash
GET    /api/admin/users      # List users
POST   /api/admin/users      # Create user
PUT    /api/admin/users/:id  # Update user
DELETE /api/admin/users/:id  # Delete user
```

## Common Tasks

### Create a new entry
```javascript
const entry = await apiService.createEntry({
  title: "GitHub",
  username: "myusername",
  password_encrypted: "encrypted_password",
  url: "https://github.com",
  notes: "My GitHub account",
  tags: ["work", "development"],
  folder: "Work"
});
```

### Share an entry
```javascript
await apiService.shareItem(
  'entry',           // item type
  'entry-id',        // item ID
  'user@email.com',  // share with
  'view'             // permission
);
```

### Create admin user
```javascript
await apiService.createUser(
  'admin@example.com',
  'securepassword',
  'admin'
);
```

## Environment Variables

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:8787/api
```

### Worker (.dev.vars)
```
JWT_SECRET=your-secret-key
ENVIRONMENT=development
```

## Project Structure

```
VaultCloud/
├── worker/src/
│   ├── index.ts              # Worker entry point
│   ├── handlers/             # API route handlers
│   ├── middleware/           # Auth & security
│   ├── types/                # TypeScript types
│   ├── utils/                # Helper functions
│   └── db/                   # Database schemas
├── services/
│   └── apiService.ts         # Frontend API client
├── components/               # React components
├── views/                    # Page views
└── scripts/
    └── setup.sh              # Setup script
```

## Troubleshooting

### Issue: Database not found
```bash
# Recreate database
wrangler d1 create vaultcloud-db --local
wrangler d1 execute vaultcloud-db --local --file=./worker/src/db/schema.sql
```

### Issue: CORS errors
```bash
# Check API URL in .env.local matches worker URL
echo $VITE_API_URL
```

### Issue: Auth not working
```bash
# Check session KV namespace is configured in wrangler.toml
# Verify .dev.vars exists with JWT_SECRET
```

### Issue: Build fails
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Security Checklist

- [ ] Use HTTPS in production
- [ ] Set strong JWT_SECRET
- [ ] Enable 2FA for admin accounts
- [ ] Regular security audits
- [ ] Monitor access logs
- [ ] Keep dependencies updated
- [ ] Use unique database IDs
- [ ] Rotate API tokens regularly

## Resources

- **Documentation**: See /DEPLOYMENT.md, /TESTING.md, /SECURITY.md
- **API Docs**: See /DEPLOYMENT.md#api-documentation
- **Cloudflare Docs**: https://developers.cloudflare.com
- **Support**: Open an issue on GitHub

---

**Quick tip**: Use `Ctrl+Shift+P` in VS Code and search for "Tasks" to run common commands quickly.
