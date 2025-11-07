import { Env, ApiResponse, User, Session } from '../types';
import { generateId, generateToken, hashPassword, verifyPassword, isValidEmail } from '../utils/crypto';

/**
 * Login with email and password
 */
export async function handleLogin(request: Request, env: Env): Promise<Response> {
    try {
        const { email, password } = await request.json() as { email: string; password: string };

        if (!email || !password) {
            return Response.json<ApiResponse>({
                success: false,
                error: 'Email and password are required',
            }, { status: 400 });
        }

        if (!isValidEmail(email)) {
            return Response.json<ApiResponse>({
                success: false,
                error: 'Invalid email format',
            }, { status: 400 });
        }

        // Get user from database
        const user = await env.DB.prepare(
            'SELECT * FROM users WHERE email = ?'
        ).bind(email).first<User>();

        if (!user) {
            return Response.json<ApiResponse>({
                success: false,
                error: 'Invalid credentials',
            }, { status: 401 });
        }

        // Verify password
        if (!user.password_hash || !(await verifyPassword(password, user.password_hash))) {
            return Response.json<ApiResponse>({
                success: false,
                error: 'Invalid credentials',
            }, { status: 401 });
        }

        // Check if user is suspended
        if (user.status !== 'active') {
            return Response.json<ApiResponse>({
                success: false,
                error: 'Account is suspended',
            }, { status: 403 });
        }

        // Create session
        const sessionToken = generateToken(64);
        const sessionId = generateId();
        const expiresAt = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days

        // Store session in KV
        await env.SESSIONS.put(sessionToken, JSON.stringify({
            session_id: sessionId,
            user_id: user.id,
            expires_at: expiresAt,
        }), {
            expirationTtl: 7 * 24 * 60 * 60, // 7 days
        });

        // Update last login
        await env.DB.prepare(
            'UPDATE users SET last_login = ? WHERE id = ?'
        ).bind(Math.floor(Date.now() / 1000), user.id).run();

        // Return user data without password hash
        const { password_hash, two_factor_secret, ...userData } = user;

        return Response.json<ApiResponse>({
            success: true,
            data: {
                user: userData,
                token: sessionToken,
                expiresAt,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        return Response.json<ApiResponse>({
            success: false,
            error: 'Internal server error',
        }, { status: 500 });
    }
}

/**
 * Register a new user
 */
export async function handleRegister(request: Request, env: Env): Promise<Response> {
    try {
        // Check if registration is enabled
        const siteSettings = await env.DB.prepare(
            'SELECT registration_enabled FROM site_settings WHERE id = ?'
        ).bind('default').first<{ registration_enabled: number }>();

        if (siteSettings && siteSettings.registration_enabled === 0) {
            return Response.json({
                success: false,
                error: 'Registration is currently disabled',
            } as ApiResponse, { status: 403 });
        }

        const { email, password } = await request.json() as { email: string; password: string };

        if (!email || !password) {
            return Response.json<ApiResponse>({
                success: false,
                error: 'Email and password are required',
            }, { status: 400 });
        }

        if (!isValidEmail(email)) {
            return Response.json<ApiResponse>({
                success: false,
                error: 'Invalid email format',
            }, { status: 400 });
        }

        if (password.length < 8) {
            return Response.json<ApiResponse>({
                success: false,
                error: 'Password must be at least 8 characters',
            }, { status: 400 });
        }

        // Check if user already exists
        const existingUser = await env.DB.prepare(
            'SELECT id FROM users WHERE email = ?'
        ).bind(email).first();

        if (existingUser) {
            return Response.json<ApiResponse>({
                success: false,
                error: 'User already exists',
            }, { status: 409 });
        }

        // Create new user
        const userId = generateId();
        const passwordHash = await hashPassword(password);
        const now = Math.floor(Date.now() / 1000);

        // Check if email verification is enabled
        const emailVerificationSettings = await env.DB.prepare(
            'SELECT email_verification_enabled, resend_api_key FROM site_settings WHERE id = ?'
        ).bind('default').first<{ email_verification_enabled: number; resend_api_key: string | null }>();

        const requiresEmailVerification = emailVerificationSettings?.email_verification_enabled === 1;
        const userStatus = requiresEmailVerification ? 'pending' : 'active';

        await env.DB.prepare(
            `INSERT INTO users (id, email, password_hash, role, status, created_at, two_factor_enabled)
             VALUES (?, ?, ?, 'user', ?, ?, 0)`
        ).bind(userId, email, passwordHash, userStatus, now).run();

        // If email verification is enabled, send verification email
        if (requiresEmailVerification && emailVerificationSettings?.resend_api_key) {
            try {
                const { sendEmail, getVerificationEmailTemplate } = await import('../utils/email');
                
                // Generate verification token
                const verificationToken = generateToken(64);
                const verificationExpiry = now + 24 * 60 * 60; // 24 hours

                // Store verification token in KV
                await env.SESSIONS.put(`verify:${verificationToken}`, JSON.stringify({
                    user_id: userId,
                    email,
                    expires_at: verificationExpiry,
                }), {
                    expirationTtl: 24 * 60 * 60,
                });

                // Send verification email
                const verificationLink = `${new URL(request.url).origin}/verify-email?token=${verificationToken}`;
                const emailHtml = getVerificationEmailTemplate(verificationLink, email);
                
                await sendEmail(
                    {
                        to: email,
                        subject: 'Verify Your Email - VaultCloud',
                        html: emailHtml,
                    },
                    emailVerificationSettings.resend_api_key
                );

                return Response.json({
                    success: true,
                    data: {
                        message: 'Account created! Please check your email to verify your account.',
                        requiresVerification: true,
                    },
                } as ApiResponse);
            } catch (emailError) {
                console.error('Failed to send verification email:', emailError);
                // Continue even if email fails - user is created
            }
        }

        // Auto-login after registration (if no email verification required)
        const sessionToken = generateToken(64);
        const sessionId = generateId();
        const expiresAt = now + 7 * 24 * 60 * 60; // 7 days

        await env.SESSIONS.put(sessionToken, JSON.stringify({
            session_id: sessionId,
            user_id: userId,
            expires_at: expiresAt,
        }), {
            expirationTtl: 7 * 24 * 60 * 60,
        });

        return Response.json<ApiResponse>({
            success: true,
            data: {
                user: {
                    id: userId,
                    email,
                    role: 'user',
                    status: userStatus,
                    created_at: now,
                    two_factor_enabled: 0,
                },
                token: sessionToken,
                expiresAt,
            },
        });
    } catch (error) {
        console.error('Register error:', error);
        return Response.json<ApiResponse>({
            success: false,
            error: 'Internal server error',
        }, { status: 500 });
    }
}

/**
 * Send magic link for passwordless login
 */
export async function handleSendMagicLink(request: Request, env: Env): Promise<Response> {
    try {
        const { email } = await request.json() as { email: string };

        if (!email || !isValidEmail(email)) {
            return Response.json<ApiResponse>({
                success: false,
                error: 'Valid email is required',
            }, { status: 400 });
        }

        // Check if user exists
        const user = await env.DB.prepare(
            'SELECT id FROM users WHERE email = ?'
        ).bind(email).first();

        // For security, always return success even if user doesn't exist
        // This prevents email enumeration attacks

        if (user) {
            // Generate magic link token
            const token = generateToken(64);
            const magicLinkId = generateId();
            const now = Math.floor(Date.now() / 1000);
            const expiresAt = now + 15 * 60; // 15 minutes

            await env.DB.prepare(
                `INSERT INTO magic_links (id, email, token, expires_at, created_at, used)
                 VALUES (?, ?, ?, ?, ?, 0)`
            ).bind(magicLinkId, email, token, expiresAt, now).run();

            // In production, send email with magic link here
            // For now, we'll log it (in dev environment only)
            if (env.ENVIRONMENT === 'development') {
                console.log(`Magic link for ${email}: ${token}`);
            }
        }

        return Response.json<ApiResponse>({
            success: true,
            message: 'If an account exists for this email, a magic link has been sent',
        });
    } catch (error) {
        console.error('Send magic link error:', error);
        return Response.json<ApiResponse>({
            success: false,
            error: 'Internal server error',
        }, { status: 500 });
    }
}

/**
 * Verify magic link and login
 */
export async function handleVerifyMagicLink(request: Request, env: Env): Promise<Response> {
    try {
        const { token } = await request.json() as { token: string };

        if (!token) {
            return Response.json<ApiResponse>({
                success: false,
                error: 'Token is required',
            }, { status: 400 });
        }

        // Get magic link
        const magicLink = await env.DB.prepare(
            'SELECT * FROM magic_links WHERE token = ? AND used = 0'
        ).bind(token).first() as any;

        if (!magicLink) {
            return Response.json<ApiResponse>({
                success: false,
                error: 'Invalid or expired magic link',
            }, { status: 401 });
        }

        // Check if expired
        const now = Math.floor(Date.now() / 1000);
        if (magicLink.expires_at < now) {
            return Response.json<ApiResponse>({
                success: false,
                error: 'Magic link has expired',
            }, { status: 401 });
        }

        // Get user
        const user = await env.DB.prepare(
            'SELECT * FROM users WHERE email = ?'
        ).bind(magicLink.email).first<User>();

        if (!user || user.status !== 'active') {
            return Response.json<ApiResponse>({
                success: false,
                error: 'User not found or inactive',
            }, { status: 401 });
        }

        // Mark magic link as used
        await env.DB.prepare(
            'UPDATE magic_links SET used = 1 WHERE id = ?'
        ).bind(magicLink.id).run();

        // Create session
        const sessionToken = generateToken(64);
        const sessionId = generateId();
        const expiresAt = now + 7 * 24 * 60 * 60; // 7 days

        await env.SESSIONS.put(sessionToken, JSON.stringify({
            session_id: sessionId,
            user_id: user.id,
            expires_at: expiresAt,
        }), {
            expirationTtl: 7 * 24 * 60 * 60,
        });

        // Update last login
        await env.DB.prepare(
            'UPDATE users SET last_login = ? WHERE id = ?'
        ).bind(now, user.id).run();

        const { password_hash, two_factor_secret, ...userData } = user;

        return Response.json<ApiResponse>({
            success: true,
            data: {
                user: userData,
                token: sessionToken,
                expiresAt,
            },
        });
    } catch (error) {
        console.error('Verify magic link error:', error);
        return Response.json<ApiResponse>({
            success: false,
            error: 'Internal server error',
        }, { status: 500 });
    }
}

/**
 * Logout
 */
export async function handleLogout(request: Request, env: Env): Promise<Response> {
    try {
        const authHeader = request.headers.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            await env.SESSIONS.delete(token);
        }

        return Response.json<ApiResponse>({
            success: true,
            message: 'Logged out successfully',
        });
    } catch (error) {
        console.error('Logout error:', error);
        return Response.json<ApiResponse>({
            success: false,
            error: 'Internal server error',
        }, { status: 500 });
    }
}

/**
 * Get current user info
 */
export async function handleGetMe(request: Request, env: Env, userId: string): Promise<Response> {
    try {
        const user = await env.DB.prepare(
            'SELECT * FROM users WHERE id = ?'
        ).bind(userId).first<User>();

        if (!user) {
            return Response.json<ApiResponse>({
                success: false,
                error: 'User not found',
            }, { status: 404 });
        }

        const { password_hash, two_factor_secret, ...userData } = user;

        return Response.json<ApiResponse>({
            success: true,
            data: userData,
        });
    } catch (error) {
        console.error('Get me error:', error);
        return Response.json<ApiResponse>({
            success: false,
            error: 'Internal server error',
        }, { status: 500 });
    }
}

/**
 * Save PGP public key for user
 */
export async function handleSavePgpPublicKey(request: Request, env: Env, userId: string): Promise<Response> {
    try {
        const { publicKey } = await request.json() as { publicKey: string };

        if (!publicKey) {
            return Response.json<ApiResponse>({
                success: false,
                error: 'Public key is required',
            }, { status: 400 });
        }

        // Extract key fingerprint (simplified version - just hash first 40 chars)
        const fingerprint = publicKey.substring(0, 40).replace(/[^a-zA-Z0-9]/g, '').substring(0, 40);

        await env.DB.prepare(
            'UPDATE users SET pgp_public_key = ?, pgp_key_fingerprint = ? WHERE id = ?'
        ).bind(publicKey, fingerprint, userId).run();

        return Response.json<ApiResponse>({
            success: true,
            message: 'PGP public key saved successfully',
        });
    } catch (error) {
        console.error('Save PGP public key error:', error);
        return Response.json<ApiResponse>({
            success: false,
            error: 'Internal server error',
        }, { status: 500 });
    }
}

/**
 * Get PGP public key for user
 */
export async function handleGetPgpPublicKey(env: Env, userId: string): Promise<Response> {
    try {
        const user = await env.DB.prepare(
            'SELECT pgp_public_key FROM users WHERE id = ?'
        ).bind(userId).first<{ pgp_public_key: string | null }>();

        if (!user) {
            return Response.json<ApiResponse>({
                success: false,
                error: 'User not found',
            }, { status: 404 });
        }

        return Response.json<ApiResponse>({
            success: true,
            data: { publicKey: user.pgp_public_key },
        });
    } catch (error) {
        console.error('Get PGP public key error:', error);
        return Response.json<ApiResponse>({
            success: false,
            error: 'Internal server error',
        }, { status: 500 });
    }
}

/**
 * Verify email address
 */
export async function handleVerifyEmail(request: Request, env: Env): Promise<Response> {
    try {
        const url = new URL(request.url);
        const token = url.searchParams.get('token');

        if (!token) {
            return Response.json({
                success: false,
                error: 'Verification token is required',
            } as ApiResponse, { status: 400 });
        }

        // Get verification data from KV
        const verificationData = await env.SESSIONS.get(`verify:${token}`);
        
        if (!verificationData) {
            return Response.json({
                success: false,
                error: 'Invalid or expired verification token',
            } as ApiResponse, { status: 400 });
        }

        const { user_id, email } = JSON.parse(verificationData);

        // Update user status to active
        await env.DB.prepare(
            'UPDATE users SET status = ? WHERE id = ?'
        ).bind('active', user_id).run();

        // Delete verification token
        await env.SESSIONS.delete(`verify:${token}`);

        // Create session for auto-login
        const sessionToken = generateToken(64);
        const sessionId = generateId();
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = now + 7 * 24 * 60 * 60; // 7 days

        await env.SESSIONS.put(sessionToken, JSON.stringify({
            session_id: sessionId,
            user_id: user_id,
            expires_at: expiresAt,
        }), {
            expirationTtl: 7 * 24 * 60 * 60,
        });

        return Response.json({
            success: true,
            data: {
                message: 'Email verified successfully! You can now log in.',
                token: sessionToken,
                expiresAt,
            },
        } as ApiResponse);
    } catch (error) {
        console.error('Verify email error:', error);
        return Response.json({
            success: false,
            error: 'Internal server error',
        } as ApiResponse, { status: 500 });
    }
}
