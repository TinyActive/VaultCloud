-- Migration 001: Initial Schema
-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    role TEXT NOT NULL CHECK(role IN ('admin', 'user')) DEFAULT 'user',
    status TEXT NOT NULL CHECK(status IN ('active', 'suspended')) DEFAULT 'active',
    created_at INTEGER NOT NULL,
    last_login INTEGER,
    two_factor_enabled INTEGER DEFAULT 0,
    two_factor_secret TEXT,
    pgp_public_key TEXT,
    pgp_key_fingerprint TEXT
);

-- Create vault entries table
CREATE TABLE IF NOT EXISTS vault_entries (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    username TEXT,
    password_encrypted TEXT NOT NULL,
    url TEXT,
    notes TEXT,
    tags TEXT, -- JSON array stored as text
    folder TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT, -- JSON array stored as text
    folder TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create sharing table
CREATE TABLE IF NOT EXISTS shared_items (
    id TEXT PRIMARY KEY,
    item_type TEXT NOT NULL CHECK(item_type IN ('entry', 'note')),
    item_id TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    shared_with_email TEXT NOT NULL,
    permission TEXT NOT NULL CHECK(permission IN ('view', 'edit')),
    created_at INTEGER NOT NULL,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create FIDO keys table
CREATE TABLE IF NOT EXISTS fido_keys (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    credential_id TEXT NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    counter INTEGER DEFAULT 0,
    transports TEXT, -- JSON array of transports (usb, nfc, ble, internal)
    aaguid TEXT, -- Authenticator AAGUID
    added_on INTEGER NOT NULL,
    last_used INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create sessions table (for magic links and session management)
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create magic link tokens table
CREATE TABLE IF NOT EXISTS magic_links (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    used INTEGER DEFAULT 0
);

-- Create site settings table
CREATE TABLE IF NOT EXISTS site_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    registration_enabled INTEGER DEFAULT 1 CHECK(registration_enabled IN (0, 1)),
    email_verification_enabled INTEGER DEFAULT 0 CHECK(email_verification_enabled IN (0, 1)),
    resend_api_key TEXT,
    updated_at INTEGER NOT NULL,
    updated_by TEXT,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_vault_entries_user_id ON vault_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_items_item ON shared_items(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_shared_items_email ON shared_items(shared_with_email);
CREATE INDEX IF NOT EXISTS idx_fido_keys_user_id ON fido_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_magic_links_token ON magic_links(token);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);


-- Migration 002: Add FIDO2 enhancements
-- Add new columns to fido_keys table for better WebAuthn support

-- Note: SQLite doesn't support IF NOT EXISTS for ALTER TABLE
-- This migration should be run only once

-- Add transports column
-- The following ALTER TABLE statements were removed because the
-- initial CREATE TABLE above already includes these columns
-- (transports, aaguid, last_used). Leaving these ALTERs in place
-- causes "duplicate column" errors when the script is executed
-- against an existing database. If you intentionally start from a
-- pre-001 schema that lacks these columns, re-add appropriate
-- ALTER TABLE statements in a controlled migration run.

-- Add unique constraint to credential_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_fido_credential_id ON fido_keys(credential_id);

-- Update existing rows to have default values
UPDATE fido_keys SET transports = '[]' WHERE transports IS NULL;


-- Migration 003: Site Settings
-- Add site settings table for controlling registration and email verification

CREATE TABLE IF NOT EXISTS site_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    registration_enabled INTEGER DEFAULT 1 CHECK(registration_enabled IN (0, 1)),
    email_verification_enabled INTEGER DEFAULT 0 CHECK(email_verification_enabled IN (0, 1)),
    resend_api_key TEXT,
    updated_at INTEGER NOT NULL,
    updated_by TEXT,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Insert default settings
INSERT OR IGNORE INTO site_settings (id, registration_enabled, email_verification_enabled, resend_api_key, updated_at)
VALUES ('default', 1, 0, NULL, strftime('%s', 'now'));

-- Create index for faster lookups (though we'll only have one row)
CREATE INDEX IF NOT EXISTS idx_site_settings_id ON site_settings(id);
