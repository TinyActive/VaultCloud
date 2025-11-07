-- Seed data for development
-- This creates an admin user and a regular user for testing

-- Admin user (password: admin123)
-- Password hash is PBKDF2 with 100,000 iterations
INSERT OR IGNORE INTO users (id, email, password_hash, role, status, created_at, two_factor_enabled)
VALUES (
    'admin-001',
    'admin@vaultcloud.dev',
    '0b133ea070e13aa601b233fd2518470a47b9429c8373dca7b4c894778607f03c',
    'admin',
    'active',
    1640995200,
    0
);

-- Default site settings
INSERT OR IGNORE INTO site_settings (id, registration_enabled, email_verification_enabled, resend_api_key, updated_at)
VALUES ('default', 1, 0, NULL, 1640995200);

