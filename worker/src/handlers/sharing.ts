import { Env, ApiResponse, SharedItem } from '../types';
import { generateId } from '../utils/crypto';

/**
 * Share an item (entry or note) with another user
 */
export async function handleShareItem(request: Request, env: Env, userId: string): Promise<Response> {
    try {
        const data = await request.json() as {
            itemType: 'entry' | 'note';
            itemId: string;
            sharedWithEmail: string;
            permission: 'view' | 'edit';
        };

        if (!data.itemType || !data.itemId || !data.sharedWithEmail || !data.permission) {
            return Response.json<ApiResponse>({
                success: false,
                error: 'itemType, itemId, sharedWithEmail, and permission are required',
            }, { status: 400 });
        }

        // Verify user owns the item
        const table = data.itemType === 'entry' ? 'vault_entries' : 'notes';
        const item = await env.DB.prepare(
            `SELECT * FROM ${table} WHERE id = ? AND user_id = ?`
        ).bind(data.itemId, userId).first();

        if (!item) {
            return Response.json<ApiResponse>({
                success: false,
                error: 'Item not found or you do not have permission to share it',
            }, { status: 404 });
        }

        // Check if sharing already exists
        const existingShare = await env.DB.prepare(
            `SELECT id FROM shared_items 
             WHERE item_type = ? AND item_id = ? AND shared_with_email = ?`
        ).bind(data.itemType, data.itemId, data.sharedWithEmail).first();

        if (existingShare) {
            // Update existing share
            await env.DB.prepare(
                `UPDATE shared_items SET permission = ? 
                 WHERE item_type = ? AND item_id = ? AND shared_with_email = ?`
            ).bind(data.permission, data.itemType, data.itemId, data.sharedWithEmail).run();

            return Response.json<ApiResponse>({
                success: true,
                message: 'Sharing updated successfully',
            });
        }

        // Create new sharing
        const shareId = generateId();
        const now = Math.floor(Date.now() / 1000);

        await env.DB.prepare(
            `INSERT INTO shared_items (id, item_type, item_id, owner_id, shared_with_email, permission, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).bind(shareId, data.itemType, data.itemId, userId, data.sharedWithEmail, data.permission, now).run();

        return Response.json<ApiResponse>({
            success: true,
            data: {
                id: shareId,
                item_type: data.itemType,
                item_id: data.itemId,
                owner_id: userId,
                shared_with_email: data.sharedWithEmail,
                permission: data.permission,
                created_at: now,
            },
        }, { status: 201 });
    } catch (error) {
        console.error('Share item error:', error);
        return Response.json<ApiResponse>({
            success: false,
            error: 'Internal server error',
        }, { status: 500 });
    }
}

/**
 * Get shares for an item
 */
export async function handleGetItemShares(env: Env, userId: string, itemType: string, itemId: string): Promise<Response> {
    try {
        // Verify user owns the item
        const table = itemType === 'entry' ? 'vault_entries' : 'notes';
        const item = await env.DB.prepare(
            `SELECT * FROM ${table} WHERE id = ? AND user_id = ?`
        ).bind(itemId, userId).first();

        if (!item) {
            return Response.json<ApiResponse>({
                success: false,
                error: 'Item not found',
            }, { status: 404 });
        }

        const { results: shares } = await env.DB.prepare(
            `SELECT * FROM shared_items WHERE item_type = ? AND item_id = ?`
        ).bind(itemType, itemId).all<SharedItem>();

        return Response.json<ApiResponse>({
            success: true,
            data: shares,
        });
    } catch (error) {
        console.error('Get item shares error:', error);
        return Response.json<ApiResponse>({
            success: false,
            error: 'Internal server error',
        }, { status: 500 });
    }
}

/**
 * Unshare an item
 */
export async function handleUnshareItem(env: Env, userId: string, shareId: string): Promise<Response> {
    try {
        // Verify user owns the item being shared
        const share = await env.DB.prepare(
            `SELECT * FROM shared_items WHERE id = ? AND owner_id = ?`
        ).bind(shareId, userId).first<SharedItem>();

        if (!share) {
            return Response.json<ApiResponse>({
                success: false,
                error: 'Share not found',
            }, { status: 404 });
        }

        await env.DB.prepare(
            'DELETE FROM shared_items WHERE id = ?'
        ).bind(shareId).run();

        return Response.json<ApiResponse>({
            success: true,
            message: 'Item unshared successfully',
        });
    } catch (error) {
        console.error('Unshare item error:', error);
        return Response.json<ApiResponse>({
            success: false,
            error: 'Internal server error',
        }, { status: 500 });
    }
}
