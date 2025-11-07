import { Env, ApiResponse, VaultEntry } from '../types';
import { generateId } from '../utils/crypto';

/**
 * Get all vault entries for a user
 */
export async function handleGetEntries(env: Env, userId: string): Promise<Response> {
    try {
        // Get user's own entries
        const { results: ownEntries } = await env.DB.prepare(
            'SELECT * FROM vault_entries WHERE user_id = ? ORDER BY updated_at DESC'
        ).bind(userId).all<VaultEntry>();

        // Get shared entries
        const { results: sharedEntries } = await env.DB.prepare(
            `SELECT ve.*, si.permission, si.owner_id
             FROM vault_entries ve
             JOIN shared_items si ON ve.id = si.item_id
             JOIN users u ON ve.user_id = u.id
             WHERE si.item_type = 'entry' AND si.shared_with_email = (
                 SELECT email FROM users WHERE id = ?
             )
             ORDER BY ve.updated_at DESC`
        ).bind(userId).all<any>();

        // Parse JSON tags
        const entries = [...ownEntries, ...sharedEntries].map(entry => ({
            ...entry,
            tags: entry.tags ? JSON.parse(entry.tags) : [],
        }));

        return Response.json<ApiResponse>({
            success: true,
            data: entries,
        });
    } catch (error) {
        console.error('Get entries error:', error);
        return Response.json<ApiResponse>({
            success: false,
            error: 'Internal server error',
        }, { status: 500 });
    }
}

/**
 * Get a specific vault entry
 */
export async function handleGetEntry(env: Env, userId: string, entryId: string): Promise<Response> {
    try {
        const entry = await env.DB.prepare(
            'SELECT * FROM vault_entries WHERE id = ? AND user_id = ?'
        ).bind(entryId, userId).first<VaultEntry>();

        if (!entry) {
            // Check if it's a shared entry
            const userEmail = await env.DB.prepare(
                'SELECT email FROM users WHERE id = ?'
            ).bind(userId).first<{ email: string }>();

            if (userEmail) {
                const sharedEntry = await env.DB.prepare(
                    `SELECT ve.*, si.permission
                     FROM vault_entries ve
                     JOIN shared_items si ON ve.id = si.item_id
                     WHERE ve.id = ? AND si.item_type = 'entry' AND si.shared_with_email = ?`
                ).bind(entryId, userEmail.email).first<any>();

                if (sharedEntry) {
                    return Response.json<ApiResponse>({
                        success: true,
                        data: {
                            ...sharedEntry,
                            tags: sharedEntry.tags ? JSON.parse(sharedEntry.tags) : [],
                        },
                    });
                }
            }

            return Response.json<ApiResponse>({
                success: false,
                error: 'Entry not found',
            }, { status: 404 });
        }

        return Response.json<ApiResponse>({
            success: true,
            data: {
                ...entry,
                tags: entry.tags ? JSON.parse(entry.tags) : [],
            },
        });
    } catch (error) {
        console.error('Get entry error:', error);
        return Response.json<ApiResponse>({
            success: false,
            error: 'Internal server error',
        }, { status: 500 });
    }
}

/**
 * Create a new vault entry
 */
export async function handleCreateEntry(request: Request, env: Env, userId: string): Promise<Response> {
    try {
        const data = await request.json() as Partial<VaultEntry>;

        if (!data.title || !data.password_encrypted) {
            return Response.json<ApiResponse>({
                success: false,
                error: 'Title and encrypted password are required',
            }, { status: 400 });
        }

        const entryId = generateId();
        const now = Math.floor(Date.now() / 1000);

        const tagsJson = data.tags ? JSON.stringify(data.tags) : null;

        await env.DB.prepare(
            `INSERT INTO vault_entries 
             (id, user_id, title, username, password_encrypted, url, notes, tags, folder, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
            entryId,
            userId,
            data.title,
            data.username || null,
            data.password_encrypted,
            data.url || null,
            data.notes || null,
            tagsJson,
            data.folder || null,
            now,
            now
        ).run();

        return Response.json<ApiResponse>({
            success: true,
            data: {
                id: entryId,
                user_id: userId,
                title: data.title,
                username: data.username,
                password_encrypted: data.password_encrypted,
                url: data.url,
                notes: data.notes,
                tags: data.tags || [],
                folder: data.folder,
                created_at: now,
                updated_at: now,
            },
        }, { status: 201 });
    } catch (error) {
        console.error('Create entry error:', error);
        return Response.json<ApiResponse>({
            success: false,
            error: 'Internal server error',
        }, { status: 500 });
    }
}

/**
 * Update a vault entry
 */
export async function handleUpdateEntry(request: Request, env: Env, userId: string, entryId: string): Promise<Response> {
    try {
        // Check if user owns the entry or has edit permission
        const entry = await env.DB.prepare(
            'SELECT * FROM vault_entries WHERE id = ? AND user_id = ?'
        ).bind(entryId, userId).first<VaultEntry>();

        let canEdit = !!entry;

        if (!canEdit) {
            // Check if user has edit permission via sharing
            const userEmail = await env.DB.prepare(
                'SELECT email FROM users WHERE id = ?'
            ).bind(userId).first<{ email: string }>();

            if (userEmail) {
                const sharedItem = await env.DB.prepare(
                    `SELECT permission FROM shared_items
                     WHERE item_type = 'entry' AND item_id = ? AND shared_with_email = ?`
                ).bind(entryId, userEmail.email).first<{ permission: string }>();

                canEdit = sharedItem?.permission === 'edit';
            }
        }

        if (!canEdit) {
            return Response.json<ApiResponse>({
                success: false,
                error: 'Entry not found or no edit permission',
            }, { status: 404 });
        }

        const data = await request.json() as Partial<VaultEntry>;
        const now = Math.floor(Date.now() / 1000);

        const updates: string[] = [];
        const bindings: any[] = [];

        if (data.title !== undefined) {
            updates.push('title = ?');
            bindings.push(data.title);
        }
        if (data.username !== undefined) {
            updates.push('username = ?');
            bindings.push(data.username);
        }
        if (data.password_encrypted !== undefined) {
            updates.push('password_encrypted = ?');
            bindings.push(data.password_encrypted);
        }
        if (data.url !== undefined) {
            updates.push('url = ?');
            bindings.push(data.url);
        }
        if (data.notes !== undefined) {
            updates.push('notes = ?');
            bindings.push(data.notes);
        }
        if (data.tags !== undefined) {
            updates.push('tags = ?');
            bindings.push(JSON.stringify(data.tags));
        }
        if (data.folder !== undefined) {
            updates.push('folder = ?');
            bindings.push(data.folder);
        }

        updates.push('updated_at = ?');
        bindings.push(now);

        bindings.push(entryId);

        await env.DB.prepare(
            `UPDATE vault_entries SET ${updates.join(', ')} WHERE id = ?`
        ).bind(...bindings).run();

        return Response.json<ApiResponse>({
            success: true,
            message: 'Entry updated successfully',
        });
    } catch (error) {
        console.error('Update entry error:', error);
        return Response.json<ApiResponse>({
            success: false,
            error: 'Internal server error',
        }, { status: 500 });
    }
}

/**
 * Delete a vault entry
 */
export async function handleDeleteEntry(env: Env, userId: string, entryId: string): Promise<Response> {
    try {
        // Check if user owns the entry
        const entry = await env.DB.prepare(
            'SELECT * FROM vault_entries WHERE id = ? AND user_id = ?'
        ).bind(entryId, userId).first<VaultEntry>();

        if (!entry) {
            return Response.json<ApiResponse>({
                success: false,
                error: 'Entry not found',
            }, { status: 404 });
        }

        // Delete the entry (cascade will delete shared_items)
        await env.DB.prepare(
            'DELETE FROM vault_entries WHERE id = ?'
        ).bind(entryId).run();

        // Also delete any sharing records
        await env.DB.prepare(
            `DELETE FROM shared_items WHERE item_type = 'entry' AND item_id = ?`
        ).bind(entryId).run();

        return Response.json<ApiResponse>({
            success: true,
            message: 'Entry deleted successfully',
        });
    } catch (error) {
        console.error('Delete entry error:', error);
        return Response.json<ApiResponse>({
            success: false,
            error: 'Internal server error',
        }, { status: 500 });
    }
}
