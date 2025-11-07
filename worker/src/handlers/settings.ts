import { Env, ApiResponse } from '../types';

export interface SiteSettings {
    id: string;
    registration_enabled: number;
    email_verification_enabled: number;
    resend_api_key: string | null;
    updated_at: number;
    updated_by: string | null;
}

/**
 * Get site settings (admin only)
 */
export async function handleGetSiteSettings(request: Request, env: Env, userId: string): Promise<Response> {
    try {
        // Verify user is admin
        const user = await env.DB.prepare(
            'SELECT role FROM users WHERE id = ?'
        ).bind(userId).first<{ role: string }>();

        if (!user || user.role !== 'admin') {
            return Response.json({
                success: false,
                error: 'Unauthorized: Admin access required',
            } as ApiResponse, { status: 403 });
        }

        // Get site settings
        const settings = await env.DB.prepare(
            'SELECT * FROM site_settings WHERE id = ?'
        ).bind('default').first<SiteSettings>();

        if (!settings) {
            // Create default settings if not exists
            const now = Math.floor(Date.now() / 1000);
            await env.DB.prepare(
                `INSERT INTO site_settings (id, registration_enabled, email_verification_enabled, resend_api_key, updated_at)
                 VALUES ('default', 1, 0, NULL, ?)`
            ).bind(now).run();

            const newSettings = await env.DB.prepare(
                'SELECT * FROM site_settings WHERE id = ?'
            ).bind('default').first<SiteSettings>();

            return Response.json({
                success: true,
                data: newSettings,
            } as ApiResponse);
        }

        return Response.json({
            success: true,
            data: settings,
        } as ApiResponse);
    } catch (error) {
        console.error('Get site settings error:', error);
        return Response.json({
            success: false,
            error: 'Internal server error',
        } as ApiResponse, { status: 500 });
    }
}

/**
 * Update site settings (admin only)
 */
export async function handleUpdateSiteSettings(request: Request, env: Env, userId: string): Promise<Response> {
    try {
        // Verify user is admin
        const user = await env.DB.prepare(
            'SELECT role FROM users WHERE id = ?'
        ).bind(userId).first<{ role: string }>();

        if (!user || user.role !== 'admin') {
            return Response.json({
                success: false,
                error: 'Unauthorized: Admin access required',
            } as ApiResponse, { status: 403 });
        }

        const body = await request.json() as {
            registration_enabled?: boolean;
            email_verification_enabled?: boolean;
            resend_api_key?: string;
        };

        // Validate input
        if (body.registration_enabled !== undefined && typeof body.registration_enabled !== 'boolean') {
            return Response.json({
                success: false,
                error: 'Invalid registration_enabled value',
            } as ApiResponse, { status: 400 });
        }

        if (body.email_verification_enabled !== undefined && typeof body.email_verification_enabled !== 'boolean') {
            return Response.json({
                success: false,
                error: 'Invalid email_verification_enabled value',
            } as ApiResponse, { status: 400 });
        }

        if (body.resend_api_key !== undefined && typeof body.resend_api_key !== 'string') {
            return Response.json({
                success: false,
                error: 'Invalid resend_api_key value',
            } as ApiResponse, { status: 400 });
        }

        // If email verification is enabled, resend_api_key must be provided
        if (body.email_verification_enabled && !body.resend_api_key) {
            return Response.json({
                success: false,
                error: 'Resend API key is required when email verification is enabled',
            } as ApiResponse, { status: 400 });
        }

        const now = Math.floor(Date.now() / 1000);

        // Build update query dynamically
        const updates: string[] = [];
        const bindings: any[] = [];

        if (body.registration_enabled !== undefined) {
            updates.push('registration_enabled = ?');
            bindings.push(body.registration_enabled ? 1 : 0);
        }

        if (body.email_verification_enabled !== undefined) {
            updates.push('email_verification_enabled = ?');
            bindings.push(body.email_verification_enabled ? 1 : 0);
        }

        if (body.resend_api_key !== undefined) {
            updates.push('resend_api_key = ?');
            bindings.push(body.resend_api_key || null);
        }

        if (updates.length === 0) {
            return Response.json({
                success: false,
                error: 'No settings to update',
            } as ApiResponse, { status: 400 });
        }

        updates.push('updated_at = ?');
        bindings.push(now);

        updates.push('updated_by = ?');
        bindings.push(userId);

        bindings.push('default');

        const query = `UPDATE site_settings SET ${updates.join(', ')} WHERE id = ?`;
        await env.DB.prepare(query).bind(...bindings).run();

        // Get updated settings
        const updatedSettings = await env.DB.prepare(
            'SELECT * FROM site_settings WHERE id = ?'
        ).bind('default').first<SiteSettings>();

        return Response.json({
            success: true,
            data: updatedSettings,
        } as ApiResponse);
    } catch (error) {
        console.error('Update site settings error:', error);
        return Response.json({
            success: false,
            error: 'Internal server error',
        } as ApiResponse, { status: 500 });
    }
}

/**
 * Get public site settings (no authentication required)
 * Only returns non-sensitive settings
 */
export async function handleGetPublicSiteSettings(request: Request, env: Env): Promise<Response> {
    try {
        const settings = await env.DB.prepare(
            'SELECT registration_enabled, email_verification_enabled FROM site_settings WHERE id = ?'
        ).bind('default').first<{ registration_enabled: number; email_verification_enabled: number }>();

        if (!settings) {
            return Response.json({
                success: true,
                data: {
                    registration_enabled: true,
                    email_verification_enabled: false,
                },
            } as ApiResponse);
        }

        return Response.json({
            success: true,
            data: {
                registration_enabled: settings.registration_enabled === 1,
                email_verification_enabled: settings.email_verification_enabled === 1,
            },
        } as ApiResponse);
    } catch (error) {
        console.error('Get public site settings error:', error);
        return Response.json({
            success: false,
            error: 'Internal server error',
        } as ApiResponse, { status: 500 });
    }
}
