-- Migration 002: Add FIDO2 enhancements
-- Add new columns to fido_keys table for better WebAuthn support

-- Note: SQLite doesn't support IF NOT EXISTS for ALTER TABLE
-- This migration should be run only once

-- Add transports column
ALTER TABLE fido_keys ADD COLUMN transports TEXT;

-- Add aaguid column  
ALTER TABLE fido_keys ADD COLUMN aaguid TEXT;

-- Add last_used column
ALTER TABLE fido_keys ADD COLUMN last_used INTEGER;

-- Add unique constraint to credential_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_fido_credential_id ON fido_keys(credential_id);

-- Update existing rows to have default values
UPDATE fido_keys SET transports = '[]' WHERE transports IS NULL;
