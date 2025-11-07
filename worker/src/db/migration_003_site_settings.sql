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
