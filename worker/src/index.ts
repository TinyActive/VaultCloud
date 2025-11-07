import { Env, ApiResponse } from './types';
import { handleCorsOptions, requireAuth, requireAdmin, addSecurityHeaders } from './middleware/auth';
import {
    handleLogin,
    handleRegister,
    handleSendMagicLink,
    handleVerifyMagicLink,
    handleLogout,
    handleGetMe,
    handleSavePgpPublicKey,
    handleGetPgpPublicKey,
    handleVerifyEmail,
} from './handlers/auth';
import {
    handleGetEntries,
    handleGetEntry,
    handleCreateEntry,
    handleUpdateEntry,
    handleDeleteEntry,
} from './handlers/entries';
import {
    handleGetNotes,
    handleGetNote,
    handleCreateNote,
    handleUpdateNote,
    handleDeleteNote,
} from './handlers/notes';
import {
    handleGetUsers,
    handleCreateUser,
    handleUpdateUser,
    handleDeleteUser,
} from './handlers/users';
import {
    handleShareItem,
    handleGetItemShares,
    handleUnshareItem,
} from './handlers/sharing';
import {
    handleRegisterChallenge,
    handleRegisterCredential,
    handleAuthenticationChallenge,
    handleAuthenticateCredential,
    handleListCredentials,
    handleDeleteCredential,
    handleTogglePasswordLogin,
} from './handlers/fido';
import {
    handleGetSiteSettings,
    handleUpdateSiteSettings,
    handleGetPublicSiteSettings,
} from './handlers/settings';

/**
 * Router for API requests
 */
async function handleRequest(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
        return handleCorsOptions(request);
    }

    try {
        // Public routes (no auth required)
        if (path === '/api/auth/login' && method === 'POST') {
            return await handleLogin(request, env);
        }
        if (path === '/api/auth/register' && method === 'POST') {
            return await handleRegister(request, env);
        }
        if (path === '/api/auth/magic-link' && method === 'POST') {
            return await handleSendMagicLink(request, env);
        }
        if (path === '/api/auth/verify-magic-link' && method === 'POST') {
            return await handleVerifyMagicLink(request, env);
        }
        if (path === '/api/auth/logout' && method === 'POST') {
            return await handleLogout(request, env);
        }
        if (path === '/api/auth/verify-email' && method === 'GET') {
            return await handleVerifyEmail(request, env);
        }

        // Protected routes (auth required)
        if (path === '/api/auth/me' && method === 'GET') {
            const auth = await requireAuth(request, env);
            return await handleGetMe(request, env, auth.user.id);
        }

        // PGP key routes
        if (path === '/api/pgp/public-key' && method === 'POST') {
            const auth = await requireAuth(request, env);
            return await handleSavePgpPublicKey(request, env, auth.user.id);
        }
        if (path === '/api/pgp/public-key' && method === 'GET') {
            const auth = await requireAuth(request, env);
            return await handleGetPgpPublicKey(env, auth.user.id);
        }

        // Vault entries routes
        if (path === '/api/entries' && method === 'GET') {
            const auth = await requireAuth(request, env);
            return await handleGetEntries(env, auth.user.id);
        }
        if (path === '/api/entries' && method === 'POST') {
            const auth = await requireAuth(request, env);
            return await handleCreateEntry(request, env, auth.user.id);
        }
        if (path.startsWith('/api/entries/') && method === 'GET') {
            const auth = await requireAuth(request, env);
            const entryId = path.split('/')[3];
            return await handleGetEntry(env, auth.user.id, entryId);
        }
        if (path.startsWith('/api/entries/') && method === 'PUT') {
            const auth = await requireAuth(request, env);
            const entryId = path.split('/')[3];
            return await handleUpdateEntry(request, env, auth.user.id, entryId);
        }
        if (path.startsWith('/api/entries/') && method === 'DELETE') {
            const auth = await requireAuth(request, env);
            const entryId = path.split('/')[3];
            return await handleDeleteEntry(env, auth.user.id, entryId);
        }

        // Notes routes
        if (path === '/api/notes' && method === 'GET') {
            const auth = await requireAuth(request, env);
            return await handleGetNotes(env, auth.user.id);
        }
        if (path === '/api/notes' && method === 'POST') {
            const auth = await requireAuth(request, env);
            return await handleCreateNote(request, env, auth.user.id);
        }
        if (path.startsWith('/api/notes/') && method === 'GET') {
            const auth = await requireAuth(request, env);
            const noteId = path.split('/')[3];
            return await handleGetNote(env, auth.user.id, noteId);
        }
        if (path.startsWith('/api/notes/') && method === 'PUT') {
            const auth = await requireAuth(request, env);
            const noteId = path.split('/')[3];
            return await handleUpdateNote(request, env, auth.user.id, noteId);
        }
        if (path.startsWith('/api/notes/') && method === 'DELETE') {
            const auth = await requireAuth(request, env);
            const noteId = path.split('/')[3];
            return await handleDeleteNote(env, auth.user.id, noteId);
        }

        // Sharing routes
        if (path === '/api/share' && method === 'POST') {
            const auth = await requireAuth(request, env);
            return await handleShareItem(request, env, auth.user.id);
        }
        if (path.startsWith('/api/share/') && path.endsWith('/shares') && method === 'GET') {
            const auth = await requireAuth(request, env);
            const parts = path.split('/');
            const itemType = parts[3]; // 'entry' or 'note'
            const itemId = parts[4];
            return await handleGetItemShares(env, auth.user.id, itemType, itemId);
        }
        if (path.startsWith('/api/share/') && method === 'DELETE') {
            const auth = await requireAuth(request, env);
            const shareId = path.split('/')[3];
            return await handleUnshareItem(env, auth.user.id, shareId);
        }

        // FIDO/WebAuthn routes
        // Registration
        if (path === '/api/fido/register/challenge' && method === 'POST') {
            const auth = await requireAuth(request, env);
            return await handleRegisterChallenge(request, env, auth.user.id);
        }
        if (path === '/api/fido/register/credential' && method === 'POST') {
            const auth = await requireAuth(request, env);
            return await handleRegisterCredential(request, env, auth.user.id);
        }
        // Authentication (public)
        if (path === '/api/fido/authenticate/challenge' && method === 'POST') {
            return await handleAuthenticationChallenge(request, env);
        }
        if (path === '/api/fido/authenticate/credential' && method === 'POST') {
            return await handleAuthenticateCredential(request, env);
        }
        // Manage credentials
        if (path === '/api/fido/credentials' && method === 'GET') {
            const auth = await requireAuth(request, env);
            return await handleListCredentials(request, env, auth.user.id);
        }
        if (path.startsWith('/api/fido/credentials/') && method === 'DELETE') {
            const auth = await requireAuth(request, env);
            const credentialId = path.split('/')[4];
            return await handleDeleteCredential(request, env, auth.user.id, credentialId);
        }
        // Password login toggle
        if (path === '/api/fido/password-login' && method === 'POST') {
            const auth = await requireAuth(request, env);
            return await handleTogglePasswordLogin(request, env, auth.user.id);
        }

        // Admin routes
        if (path === '/api/admin/users' && method === 'GET') {
            await requireAdmin(request, env);
            return await handleGetUsers(env);
        }
        if (path === '/api/admin/users' && method === 'POST') {
            await requireAdmin(request, env);
            return await handleCreateUser(request, env);
        }
        if (path.startsWith('/api/admin/users/') && method === 'PUT') {
            await requireAdmin(request, env);
            const userId = path.split('/')[4];
            return await handleUpdateUser(request, env, userId);
        }
        if (path.startsWith('/api/admin/users/') && method === 'DELETE') {
            await requireAdmin(request, env);
            const userId = path.split('/')[4];
            return await handleDeleteUser(env, userId);
        }

        // Admin site settings routes
        if (path === '/api/admin/settings' && method === 'GET') {
            const auth = await requireAdmin(request, env);
            return await handleGetSiteSettings(request, env, auth.user.id);
        }
        if (path === '/api/admin/settings' && method === 'PUT') {
            const auth = await requireAdmin(request, env);
            return await handleUpdateSiteSettings(request, env, auth.user.id);
        }

        // Public site settings (no auth required)
        if (path === '/api/settings/public' && method === 'GET') {
            return await handleGetPublicSiteSettings(request, env);
        }

        // Health check
        if (path === '/api/health' && method === 'GET') {
            return Response.json({ status: 'ok', timestamp: Date.now() });
        }

        // Route not found
        return Response.json({
            success: false,
            error: 'Not found',
        } as ApiResponse, { status: 404 });

    } catch (error) {
        console.error('Request error:', error);
        
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        const status = errorMessage === 'Unauthorized' ? 401 : 
                      errorMessage.startsWith('Forbidden') ? 403 : 500;

        return Response.json({
            success: false,
            error: errorMessage,
        } as ApiResponse, { status });
    }
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const origin = request.headers.get('Origin');
        const response = await handleRequest(request, env);
        return addSecurityHeaders(response, origin || undefined);
    },
};
