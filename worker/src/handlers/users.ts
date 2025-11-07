import { Env, ApiResponse, User } from '../types';
import { generateId, hashPassword } from '../utils/crypto';

/**
 * Get all users (admin only)
 */
export async function handleGetUsers(env: Env): Promise<Response> {
    try {
        const { results: users } = await env.DB.prepare(
            'SELECT id, email, role, status, created_at, last_login FROM users ORDER BY created_at DESC'
        ).all<User>();

        return Response.json<ApiResponse>({
            success: true,
            data: users,
        });
    } catch (error) {
        console.error('Get users error:', error);
        return Response.json<ApiResponse>({
            success: false,
            error: 'Internal server error',
        }, { status: 500 });
    }
}

/**
 * Create a new user (admin only)
 */
export async function handleCreateUser(request: Request, env: Env): Promise<Response> {
    try {
        const data = await request.json() as { email: string; password?: string; role?: string };

        if (!data.email) {
            return Response.json<ApiResponse>({
                success: false,
                error: 'Email is required',
            }, { status: 400 });
        }

        // Check if user already exists
        const existingUser = await env.DB.prepare(
            'SELECT id FROM users WHERE email = ?'
        ).bind(data.email).first();

        if (existingUser) {
            return Response.json<ApiResponse>({
                success: false,
                error: 'User already exists',
            }, { status: 409 });
        }

        const userId = generateId();
        const now = Math.floor(Date.now() / 1000);
        const role = data.role === 'admin' ? 'admin' : 'user';
        
        // Generate temporary password if not provided
        const tempPassword = data.password || generateId().substring(0, 12);
        const passwordHash = await hashPassword(tempPassword);

        await env.DB.prepare(
            `INSERT INTO users (id, email, password_hash, role, status, created_at, two_factor_enabled)
             VALUES (?, ?, ?, ?, 'active', ?, 0)`
        ).bind(userId, data.email, passwordHash, role, now).run();

        // Try to send welcome email if Resend is configured
        try {
            const emailSettings = await env.DB.prepare(
                'SELECT email_verification_enabled, resend_api_key FROM site_settings WHERE id = ?'
            ).bind('default').first<{ email_verification_enabled: number; resend_api_key: string | null }>();

            if (emailSettings?.resend_api_key) {
                const { sendEmail, getWelcomeEmailTemplate } = await import('../utils/email');
                
                const loginLink = `${new URL(request.url).origin}/`;
                const emailHtml = getWelcomeEmailTemplate(
                    loginLink, 
                    data.email, 
                    data.password ? undefined : tempPassword
                );
                
                await sendEmail(
                    {
                        to: data.email,
                        subject: 'Welcome to VaultCloud - Your Account is Ready',
                        html: emailHtml,
                    },
                    emailSettings.resend_api_key
                );
            }
        } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
            // Continue even if email fails
        }

        return Response.json<ApiResponse>({
            success: true,
            data: {
                id: userId,
                email: data.email,
                role,
                status: 'active',
                created_at: now,
                two_factor_enabled: 0,
                tempPassword: data.password ? undefined : tempPassword, // Include temp password in response if auto-generated
            },
        }, { status: 201 });
    } catch (error) {
        console.error('Create user error:', error);
        return Response.json<ApiResponse>({
            success: false,
            error: 'Internal server error',
        }, { status: 500 });
    }
}

/**
 * Update a user (admin only)
 */
export async function handleUpdateUser(request: Request, env: Env, targetUserId: string): Promise<Response> {
    try {
        const data = await request.json() as { role?: string; status?: string };

        const updates: string[] = [];
        const bindings: any[] = [];

        if (data.role && ['admin', 'user'].includes(data.role)) {
            updates.push('role = ?');
            bindings.push(data.role);
        }

        if (data.status && ['active', 'suspended'].includes(data.status)) {
            updates.push('status = ?');
            bindings.push(data.status);
        }

        if (updates.length === 0) {
            return Response.json<ApiResponse>({
                success: false,
                error: 'No valid updates provided',
            }, { status: 400 });
        }

        bindings.push(targetUserId);

        await env.DB.prepare(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`
        ).bind(...bindings).run();

        return Response.json<ApiResponse>({
            success: true,
            message: 'User updated successfully',
        });
    } catch (error) {
        console.error('Update user error:', error);
        return Response.json<ApiResponse>({
            success: false,
            error: 'Internal server error',
        }, { status: 500 });
    }
}

/**
 * Delete a user (admin only)
 */
export async function handleDeleteUser(env: Env, userId: string): Promise<Response> {
    try {
        await env.DB.prepare(
            'DELETE FROM users WHERE id = ?'
        ).bind(userId).run();

        return Response.json<ApiResponse>({
            success: true,
            message: 'User deleted successfully',
        });
    } catch (error) {
        console.error('Delete user error:', error);
        return Response.json<ApiResponse>({
            success: false,
            error: 'Internal server error',
        }, { status: 500 });
    }
}
