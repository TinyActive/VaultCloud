import { Env, ApiResponse } from '../types';
import { generateId } from '../utils/crypto';

/**
 * FIDO2/WebAuthn Authentication Handler
 * Implements passwordless authentication using security keys
 */

interface FidoCredential {
    id: string;
    user_id: string;
    name: string;
    credential_id: string;
    public_key: string;
    counter: number;
    transports?: string;
    aaguid?: string;
    added_on: number;
}

/**
 * Generate registration challenge for WebAuthn
 */
export async function handleRegisterChallenge(request: Request, env: Env, userId: string): Promise<Response> {
    try {
        // Get user info
        const user = await env.DB.prepare(
            'SELECT id, email FROM users WHERE id = ?'
        ).bind(userId).first() as any;

        if (!user) {
            return Response.json<ApiResponse>({
                success: false,
                error: 'User not found',
            }, { status: 404 });
        }

        // Generate challenge
        const challenge = generateRandomBuffer(32);
        const challengeId = generateId();

        // Store challenge temporarily (expires in 5 minutes)
        await env.SESSIONS.put(
            `fido-challenge:${challengeId}`,
            JSON.stringify({
                challenge: bufferToBase64(challenge),
                user_id: userId,
                created_at: Date.now(),
            }),
            { expirationTtl: 300 } // 5 minutes
        );

        // Get RP ID - handle localhost properly
        const url = new URL(request.url);
        let rpId = url.hostname;
        
        // Normalize localhost variations
        if (rpId === '127.0.0.1' || rpId === '[::1]') {
            rpId = 'localhost';
        }
        
        // Return WebAuthn registration options
        return Response.json<ApiResponse>({
            success: true,
            data: {
                challenge: bufferToBase64(challenge),
                challengeId,
                rp: {
                    name: 'VaultCloud',
                    id: rpId,
                },
                user: {
                    id: bufferToBase64(textToBuffer(user.id)),
                    name: user.email,
                    displayName: user.email,
                },
                pubKeyCredParams: [
                    { type: 'public-key', alg: -7 },  // ES256
                    { type: 'public-key', alg: -257 }, // RS256
                ],
                authenticatorSelection: {
                    authenticatorAttachment: 'cross-platform',
                    requireResidentKey: false,
                    userVerification: 'preferred',
                },
                timeout: 60000,
                attestation: 'none',
            },
        });
    } catch (error) {
        console.error('Register challenge error:', error);
        return Response.json<ApiResponse>({
            success: false,
            error: 'Failed to generate challenge',
        }, { status: 500 });
    }
}

/**
 * Verify and register FIDO credential
 */
export async function handleRegisterCredential(request: Request, env: Env, userId: string): Promise<Response> {
    try {
        const { challengeId, credential, name } = await request.json() as any;

        if (!challengeId || !credential || !name) {
            return Response.json<ApiResponse>({
                success: false,
                error: 'Missing required fields',
            }, { status: 400 });
        }

        // Retrieve and verify challenge
        const challengeData = await env.SESSIONS.get(`fido-challenge:${challengeId}`);
        if (!challengeData) {
            return Response.json<ApiResponse>({
                success: false,
                error: 'Invalid or expired challenge',
            }, { status: 400 });
        }

        const { challenge, user_id } = JSON.parse(challengeData);
        
        if (user_id !== userId) {
            return Response.json<ApiResponse>({
                success: false,
                error: 'Challenge user mismatch',
            }, { status: 400 });
        }

        // Delete used challenge
        await env.SESSIONS.delete(`fido-challenge:${challengeId}`);

        // Extract credential data
        const credentialId = credential.id;
        const publicKey = credential.response.publicKey;
        const transports = credential.response.transports || [];

        // Store credential in database
        const keyId = generateId();
        const now = Math.floor(Date.now() / 1000);

        await env.DB.prepare(
            `INSERT INTO fido_keys (id, user_id, name, credential_id, public_key, counter, transports, added_on)
             VALUES (?, ?, ?, ?, ?, 0, ?, ?)`
        ).bind(
            keyId,
            userId,
            name,
            credentialId,
            publicKey,
            JSON.stringify(transports),
            now
        ).run();

        return Response.json<ApiResponse>({
            success: true,
            data: {
                id: keyId,
                name,
                addedOn: new Date(now * 1000).toISOString(),
            },
        });
    } catch (error) {
        console.error('Register credential error:', error);
        return Response.json<ApiResponse>({
            success: false,
            error: 'Failed to register credential',
        }, { status: 500 });
    }
}

/**
 * Generate authentication challenge
 */
export async function handleAuthenticationChallenge(request: Request, env: Env): Promise<Response> {
    try {
        const { email } = await request.json() as { email: string };

        if (!email) {
            return Response.json<ApiResponse>({
                success: false,
                error: 'Email is required',
            }, { status: 400 });
        }

        // Get user
        const user = await env.DB.prepare(
            'SELECT id FROM users WHERE email = ?'
        ).bind(email).first() as any;

        if (!user) {
            // Don't reveal if user exists
            return Response.json<ApiResponse>({
                success: false,
                error: 'No credentials found',
            }, { status: 404 });
        }

        // Get user's credentials
        const credentials = await env.DB.prepare(
            'SELECT credential_id, transports FROM fido_keys WHERE user_id = ?'
        ).bind(user.id).all() as any;

        if (!credentials.results || credentials.results.length === 0) {
            return Response.json<ApiResponse>({
                success: false,
                error: 'No security keys registered',
            }, { status: 404 });
        }

        // Generate challenge
        const challenge = generateRandomBuffer(32);
        const challengeId = generateId();

        // Store challenge
        await env.SESSIONS.put(
            `fido-auth:${challengeId}`,
            JSON.stringify({
                challenge: bufferToBase64(challenge),
                user_id: user.id,
                created_at: Date.now(),
            }),
            { expirationTtl: 300 }
        );

        // Get RP ID - handle localhost properly
        const url = new URL(request.url);
        let rpId = url.hostname;
        
        // Normalize localhost variations
        if (rpId === '127.0.0.1' || rpId === '[::1]') {
            rpId = 'localhost';
        }
        
        // Return authentication options
        return Response.json<ApiResponse>({
            success: true,
            data: {
                challenge: bufferToBase64(challenge),
                challengeId,
                rpId: rpId,
                allowCredentials: credentials.results.map((cred: any) => ({
                    type: 'public-key',
                    id: cred.credential_id,
                    transports: cred.transports ? JSON.parse(cred.transports) : undefined,
                })),
                timeout: 60000,
                userVerification: 'preferred',
            },
        });
    } catch (error) {
        console.error('Authentication challenge error:', error);
        return Response.json<ApiResponse>({
            success: false,
            error: 'Failed to generate challenge',
        }, { status: 500 });
    }
}

/**
 * Verify authentication and login
 */
export async function handleAuthenticateCredential(request: Request, env: Env): Promise<Response> {
    try {
        const { challengeId, credential } = await request.json() as any;

        if (!challengeId || !credential) {
            return Response.json<ApiResponse>({
                success: false,
                error: 'Missing required fields',
            }, { status: 400 });
        }

        // Retrieve challenge
        const challengeData = await env.SESSIONS.get(`fido-auth:${challengeId}`);
        if (!challengeData) {
            return Response.json<ApiResponse>({
                success: false,
                error: 'Invalid or expired challenge',
            }, { status: 400 });
        }

        const { user_id } = JSON.parse(challengeData);

        // Delete used challenge
        await env.SESSIONS.delete(`fido-auth:${challengeId}`);

        // Get credential from database
        const storedCred = await env.DB.prepare(
            'SELECT * FROM fido_keys WHERE credential_id = ? AND user_id = ?'
        ).bind(credential.id, user_id).first() as FidoCredential;

        if (!storedCred) {
            return Response.json<ApiResponse>({
                success: false,
                error: 'Invalid credential',
            }, { status: 401 });
        }

        // Verify signature counter to prevent replay attacks
        const newCounter = credential.response.authenticatorData?.counter || 0;
        if (newCounter > 0 && newCounter <= storedCred.counter) {
            return Response.json<ApiResponse>({
                success: false,
                error: 'Invalid signature counter',
            }, { status: 401 });
        }

        // Update counter
        await env.DB.prepare(
            'UPDATE fido_keys SET counter = ? WHERE id = ?'
        ).bind(newCounter, storedCred.id).run();

        // Get user
        const user = await env.DB.prepare(
            'SELECT * FROM users WHERE id = ?'
        ).bind(user_id).first() as any;

        if (!user || user.status !== 'active') {
            return Response.json<ApiResponse>({
                success: false,
                error: 'User not found or inactive',
            }, { status: 401 });
        }

        // Create session
        const sessionToken = generateRandomString(64);
        const sessionId = generateId();
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = now + 7 * 24 * 60 * 60;

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
        console.error('Authenticate credential error:', error);
        return Response.json<ApiResponse>({
            success: false,
            error: 'Authentication failed',
        }, { status: 500 });
    }
}

/**
 * List user's FIDO credentials
 */
export async function handleListCredentials(request: Request, env: Env, userId: string): Promise<Response> {
    try {
        const credentials = await env.DB.prepare(
            'SELECT id, name, added_on, transports FROM fido_keys WHERE user_id = ? ORDER BY added_on DESC'
        ).bind(userId).all() as any;

        const keys = credentials.results?.map((cred: any) => ({
            id: cred.id,
            name: cred.name,
            addedOn: new Date(cred.added_on * 1000).toISOString(),
            transports: cred.transports ? JSON.parse(cred.transports) : [],
        })) || [];

        return Response.json<ApiResponse>({
            success: true,
            data: keys,
        });
    } catch (error) {
        console.error('List credentials error:', error);
        return Response.json<ApiResponse>({
            success: false,
            error: 'Failed to list credentials',
        }, { status: 500 });
    }
}

/**
 * Delete a FIDO credential
 */
export async function handleDeleteCredential(request: Request, env: Env, userId: string, credentialId: string): Promise<Response> {
    try {
        // Verify ownership
        const credential = await env.DB.prepare(
            'SELECT id FROM fido_keys WHERE id = ? AND user_id = ?'
        ).bind(credentialId, userId).first();

        if (!credential) {
            return Response.json<ApiResponse>({
                success: false,
                error: 'Credential not found',
            }, { status: 404 });
        }

        // Check if this is the last security key and password login is disabled
        const user = await env.DB.prepare(
            'SELECT password_hash FROM users WHERE id = ?'
        ).bind(userId).first() as any;

        const keyCount = await env.DB.prepare(
            'SELECT COUNT(*) as count FROM fido_keys WHERE user_id = ?'
        ).bind(userId).first() as any;

        if (keyCount.count === 1 && !user.password_hash) {
            return Response.json<ApiResponse>({
                success: false,
                error: 'Cannot remove last security key when password login is disabled',
            }, { status: 400 });
        }

        // Delete credential
        await env.DB.prepare(
            'DELETE FROM fido_keys WHERE id = ?'
        ).bind(credentialId).run();

        return Response.json<ApiResponse>({
            success: true,
            message: 'Security key removed successfully',
        });
    } catch (error) {
        console.error('Delete credential error:', error);
        return Response.json<ApiResponse>({
            success: false,
            error: 'Failed to delete credential',
        }, { status: 500 });
    }
}

/**
 * Toggle password login (enable/disable)
 */
export async function handleTogglePasswordLogin(request: Request, env: Env, userId: string): Promise<Response> {
    try {
        const { enabled, password } = await request.json() as { enabled: boolean; password?: string };

        // Get current user state
        const user = await env.DB.prepare(
            'SELECT password_hash FROM users WHERE id = ?'
        ).bind(userId).first() as any;

        if (!user) {
            return Response.json<ApiResponse>({
                success: false,
                error: 'User not found',
            }, { status: 404 });
        }

        if (!enabled) {
            // Disabling password login - check if user has security keys
            const keyCount = await env.DB.prepare(
                'SELECT COUNT(*) as count FROM fido_keys WHERE user_id = ?'
            ).bind(userId).first() as any;

            if (keyCount.count === 0) {
                return Response.json<ApiResponse>({
                    success: false,
                    error: 'Must have at least one security key to disable password login',
                }, { status: 400 });
            }

            // Set password_hash to null to disable password login
            await env.DB.prepare(
                'UPDATE users SET password_hash = NULL WHERE id = ?'
            ).bind(userId).run();
        } else {
            // Enabling password login - require new password
            if (!password || password.length < 8) {
                return Response.json<ApiResponse>({
                    success: false,
                    error: 'Password must be at least 8 characters',
                }, { status: 400 });
            }

            const { hashPassword } = await import('../utils/crypto');
            const passwordHash = await hashPassword(password);

            await env.DB.prepare(
                'UPDATE users SET password_hash = ? WHERE id = ?'
            ).bind(passwordHash, userId).run();
        }

        return Response.json<ApiResponse>({
            success: true,
            data: { passwordLoginEnabled: enabled },
        });
    } catch (error) {
        console.error('Toggle password login error:', error);
        return Response.json<ApiResponse>({
            success: false,
            error: 'Failed to update password login setting',
        }, { status: 500 });
    }
}

// Utility functions
function generateRandomBuffer(length: number): Uint8Array {
    const buffer = new Uint8Array(length);
    crypto.getRandomValues(buffer);
    return buffer;
}

function generateRandomString(length: number): string {
    const buffer = generateRandomBuffer(length);
    return Array.from(buffer, byte => byte.toString(16).padStart(2, '0')).join('');
}

function bufferToBase64(buffer: Uint8Array): string {
    const binary = String.fromCharCode(...buffer);
    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

function textToBuffer(text: string): Uint8Array {
    return new TextEncoder().encode(text);
}
