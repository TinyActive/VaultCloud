/**
 * Utilities for cryptographic operations and security
 */

/**
 * Generate a cryptographically secure random ID
 */
export function generateId(): string {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Generate a secure random token
 */
export function generateToken(length: number = 32): string {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Hash a password using Web Crypto API with PBKDF2
 * Note: For production, consider using a proper backend password hashing library
 * like bcrypt, scrypt, or Argon2 via a Cloudflare Worker with Durable Objects
 */
export async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const salt = 'vaultcloud-static-salt'; // TODO: Use unique salt per user
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits']
    );
    
    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: encoder.encode(salt),
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        256
    );
    
    const hashArray = Array.from(new Uint8Array(derivedBits));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    const passwordHash = await hashPassword(password);
    return passwordHash === hash;
}

/**
 * Create a JWT-like token (simplified for demo)
 * In production, use a proper JWT library
 */
export async function createSessionToken(userId: string, secret: string): Promise<string> {
    const payload = JSON.stringify({
        userId,
        iat: Date.now(),
    });
    
    const encoder = new TextEncoder();
    const data = encoder.encode(payload + secret);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return btoa(payload) + '.' + signature;
}

/**
 * Verify a session token
 */
export async function verifySessionToken(token: string, secret: string): Promise<{ userId: string } | null> {
    try {
        const [payloadB64, signature] = token.split('.');
        const payload = atob(payloadB64);
        
        const encoder = new TextEncoder();
        const data = encoder.encode(payload + secret);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const expectedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        if (signature !== expectedSignature) {
            return null;
        }
        
        const { userId } = JSON.parse(payload);
        return { userId };
    } catch {
        return null;
    }
}

/**
 * Get current timestamp in seconds
 */
export function getCurrentTimestamp(): number {
    return Math.floor(Date.now() / 1000);
}

/**
 * Sanitize input to prevent injection attacks
 * Note: This is a basic implementation. For production, use proper input validation
 * and context-specific sanitization (e.g., different for HTML, SQL, URLs)
 */
export function sanitizeInput(input: string, maxLength: number = 1000): string {
    // Trim and limit length
    let sanitized = input.trim().slice(0, maxLength);
    
    // Remove or escape potentially dangerous characters and protocols
    // Block common XSS vectors
    const dangerousPatterns = [
        /javascript:/gi,
        /data:/gi,
        /vbscript:/gi,
        /<script[^>]*>.*?<\/script>/gi,
        /<iframe[^>]*>.*?<\/iframe>/gi,
        /on\w+\s*=/gi, // Event handlers like onclick=, onload=, etc.
    ];
    
    for (const pattern of dangerousPatterns) {
        sanitized = sanitized.replace(pattern, '');
    }
    
    // Escape HTML special characters
    sanitized = sanitized
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    
    return sanitized;
}

/**
 * Validate and sanitize email addresses
 */
export function sanitizeEmail(email: string): string {
    return email.trim().toLowerCase().slice(0, 254);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
