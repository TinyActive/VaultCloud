-- Migration 004: User Profile Changes
-- Add fields for first login tracking and email change restriction

-- Add must_change_password flag
ALTER TABLE users ADD COLUMN must_change_password INTEGER DEFAULT 0 CHECK(must_change_password IN (0, 1));

-- Add email_changed_at timestamp (NULL if never changed)
ALTER TABLE users ADD COLUMN email_changed_at INTEGER DEFAULT NULL;

-- Add original_email to track first email (for security audit)
ALTER TABLE users ADD COLUMN original_email TEXT DEFAULT NULL;

-- Update existing users with default emails to require password change
UPDATE users 
SET must_change_password = 1, 
    original_email = email
WHERE email IN ('admin@vaultcloud.dev', 'user@vaultcloud.dev', 'test@example.com');

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_must_change_password ON users(must_change_password);
CREATE INDEX IF NOT EXISTS idx_users_email_changed_at ON users(email_changed_at);
