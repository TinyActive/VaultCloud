import { Env, User, AuthContext } from '../types';
import { verifySessionToken } from '../utils/crypto';

/**
 * CORS middleware to handle cross-origin requests
 */
export function corsHeaders(origin?: string): HeadersInit {
    return {
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
    };
}

/**
 * Handle CORS preflight requests
 */
export function handleCorsOptions(request: Request): Response {
    const origin = request.headers.get('Origin');
    return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
    });
}

/**
 * Authentication middleware
 */
export async function authenticate(request: Request, env: Env): Promise<AuthContext | null> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.substring(7);
    
    // Verify token from sessions KV
    const sessionData = await env.SESSIONS.get(token);
    if (!sessionData) {
        return null;
    }

    const session = JSON.parse(sessionData);
    
    // Check if session is expired
    if (session.expires_at < Math.floor(Date.now() / 1000)) {
        await env.SESSIONS.delete(token);
        return null;
    }

    // Get user from database
    const user = await env.DB.prepare(
        'SELECT * FROM users WHERE id = ?'
    ).bind(session.user_id).first<User>();

    if (!user || user.status !== 'active') {
        return null;
    }

    return {
        user,
        sessionToken: token,
    };
}

/**
 * Require authentication middleware
 */
export async function requireAuth(request: Request, env: Env): Promise<AuthContext> {
    const auth = await authenticate(request, env);
    if (!auth) {
        throw new Error('Unauthorized');
    }
    return auth;
}

/**
 * Require admin role middleware
 */
export async function requireAdmin(request: Request, env: Env): Promise<AuthContext> {
    const auth = await requireAuth(request, env);
    if (auth.user.role !== 'admin') {
        throw new Error('Forbidden: Admin access required');
    }
    return auth;
}

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: Response, origin?: string): Response {
    const headers = new Headers(response.headers);
    
    // CORS headers
    const cors = corsHeaders(origin);
    Object.entries(cors).forEach(([key, value]) => {
        headers.set(key, value);
    });
    
    // Security headers
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-XSS-Protection', '1; mode=block');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // Content Security Policy
    // Note: For production, remove 'unsafe-inline' and 'unsafe-eval' and use nonces or hashes
    headers.set(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self';"
    );

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
}
