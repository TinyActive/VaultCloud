#!/bin/bash

# VaultCloud Setup Script
# This script helps initialize the local development environment

echo "🚀 VaultCloud Setup Script"
echo "=========================="
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

echo "✅ Wrangler CLI is installed"
echo ""

# Create local D1 database
echo "📦 Creating local D1 database..."
if wrangler d1 create vaultcloud-db --local; then
    echo "✅ Local database created"
else
    echo "⚠️  Database might already exist, continuing..."
fi
echo ""

# Initialize schema
echo "🗄️  Initializing database schema..."
if wrangler d1 execute vaultcloud-db --local --file=./worker/src/db/schema.sql; then
    echo "✅ Schema initialized"
else
    echo "❌ Failed to initialize schema"
    exit 1
fi
echo ""

# Seed database
echo "🌱 Seeding database with test data..."
if wrangler d1 execute vaultcloud-db --local --file=./worker/src/db/seed.sql; then
    echo "✅ Database seeded"
    echo ""
    echo "Test accounts created:"
    echo "  - Admin: admin@vaultcloud.dev / admin123"
    echo "  - User:  user@vaultcloud.dev / user123"
else
    echo "❌ Failed to seed database"
    exit 1
fi
echo ""

# Check environment files
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local..."
    cp .env.example .env.local
    echo "✅ .env.local created"
else
    echo "✅ .env.local already exists"
fi

if [ ! -f .dev.vars ]; then
    echo "📝 Creating .dev.vars..."
    cp .dev.vars.example .dev.vars
    echo "✅ .dev.vars created"
else
    echo "✅ .dev.vars already exists"
fi
echo ""

echo "🎉 Setup complete!"
echo ""
echo "To start development:"
echo "  1. Terminal 1: npm run worker:dev"
echo "  2. Terminal 2: npm run dev"
echo ""
echo "Then open http://localhost:5173"
