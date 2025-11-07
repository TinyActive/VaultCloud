import { Env, ApiResponse, Note } from '../types';
import { generateId } from '../utils/crypto';

/**
 * Get all notes for a user
 */
export async function handleGetNotes(env: Env, userId: string): Promise<Response> {
    try {
        // Get user's own notes
        const { results: ownNotes } = await env.DB.prepare(
            'SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC'
        ).bind(userId).all<Note>();

        // Get shared notes
        const { results: sharedNotes } = await env.DB.prepare(
            `SELECT n.*, si.permission, si.owner_id
             FROM notes n
             JOIN shared_items si ON n.id = si.item_id
             JOIN users u ON n.user_id = u.id
             WHERE si.item_type = 'note' AND si.shared_with_email = (
                 SELECT email FROM users WHERE id = ?
             )
             ORDER BY n.updated_at DESC`
        ).bind(userId).all<any>();

        // Parse JSON tags
        const notes = [...ownNotes, ...sharedNotes].map(note => ({
            ...note,
            tags: note.tags ? JSON.parse(note.tags) : [],
        }));

        return Response.json<ApiResponse>({
            success: true,
            data: notes,
        });
    } catch (error) {
        console.error('Get notes error:', error);
        return Response.json<ApiResponse>({
            success: false,
            error: 'Internal server error',
        }, { status: 500 });
    }
}

/**
 * Get a specific note
 */
export async function handleGetNote(env: Env, userId: string, noteId: string): Promise<Response> {
    try {
        const note = await env.DB.prepare(
            'SELECT * FROM notes WHERE id = ? AND user_id = ?'
        ).bind(noteId, userId).first<Note>();

        if (!note) {
            // Check if it's a shared note
            const userEmail = await env.DB.prepare(
                'SELECT email FROM users WHERE id = ?'
            ).bind(userId).first<{ email: string }>();

            if (userEmail) {
                const sharedNote = await env.DB.prepare(
                    `SELECT n.*, si.permission
                     FROM notes n
                     JOIN shared_items si ON n.id = si.item_id
                     WHERE n.id = ? AND si.item_type = 'note' AND si.shared_with_email = ?`
                ).bind(noteId, userEmail.email).first<any>();

                if (sharedNote) {
                    return Response.json<ApiResponse>({
                        success: true,
                        data: {
                            ...sharedNote,
                            tags: sharedNote.tags ? JSON.parse(sharedNote.tags) : [],
                        },
                    });
                }
            }

            return Response.json<ApiResponse>({
                success: false,
                error: 'Note not found',
            }, { status: 404 });
        }

        return Response.json<ApiResponse>({
            success: true,
            data: {
                ...note,
                tags: note.tags ? JSON.parse(note.tags) : [],
            },
        });
    } catch (error) {
        console.error('Get note error:', error);
        return Response.json<ApiResponse>({
            success: false,
            error: 'Internal server error',
        }, { status: 500 });
    }
}

/**
 * Create a new note
 */
export async function handleCreateNote(request: Request, env: Env, userId: string): Promise<Response> {
    try {
        const data = await request.json() as Partial<Note>;

        if (!data.title || !data.content) {
            return Response.json<ApiResponse>({
                success: false,
                error: 'Title and content are required',
            }, { status: 400 });
        }

        const noteId = generateId();
        const now = Math.floor(Date.now() / 1000);

        const tagsJson = data.tags ? JSON.stringify(data.tags) : null;

        await env.DB.prepare(
            `INSERT INTO notes 
             (id, user_id, title, content, tags, folder, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
            noteId,
            userId,
            data.title,
            data.content,
            tagsJson,
            data.folder || null,
            now,
            now
        ).run();

        return Response.json<ApiResponse>({
            success: true,
            data: {
                id: noteId,
                user_id: userId,
                title: data.title,
                content: data.content,
                tags: data.tags || [],
                folder: data.folder,
                created_at: now,
                updated_at: now,
            },
        }, { status: 201 });
    } catch (error) {
        console.error('Create note error:', error);
        return Response.json<ApiResponse>({
            success: false,
            error: 'Internal server error',
        }, { status: 500 });
    }
}

/**
 * Update a note
 */
export async function handleUpdateNote(request: Request, env: Env, userId: string, noteId: string): Promise<Response> {
    try {
        // Check if user owns the note or has edit permission
        const note = await env.DB.prepare(
            'SELECT * FROM notes WHERE id = ? AND user_id = ?'
        ).bind(noteId, userId).first<Note>();

        let canEdit = !!note;

        if (!canEdit) {
            // Check if user has edit permission via sharing
            const userEmail = await env.DB.prepare(
                'SELECT email FROM users WHERE id = ?'
            ).bind(userId).first<{ email: string }>();

            if (userEmail) {
                const sharedItem = await env.DB.prepare(
                    `SELECT permission FROM shared_items
                     WHERE item_type = 'note' AND item_id = ? AND shared_with_email = ?`
                ).bind(noteId, userEmail.email).first<{ permission: string }>();

                canEdit = sharedItem?.permission === 'edit';
            }
        }

        if (!canEdit) {
            return Response.json<ApiResponse>({
                success: false,
                error: 'Note not found or no edit permission',
            }, { status: 404 });
        }

        const data = await request.json() as Partial<Note>;
        const now = Math.floor(Date.now() / 1000);

        const updates: string[] = [];
        const bindings: any[] = [];

        if (data.title !== undefined) {
            updates.push('title = ?');
            bindings.push(data.title);
        }
        if (data.content !== undefined) {
            updates.push('content = ?');
            bindings.push(data.content);
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

        bindings.push(noteId);

        await env.DB.prepare(
            `UPDATE notes SET ${updates.join(', ')} WHERE id = ?`
        ).bind(...bindings).run();

        return Response.json<ApiResponse>({
            success: true,
            message: 'Note updated successfully',
        });
    } catch (error) {
        console.error('Update note error:', error);
        return Response.json<ApiResponse>({
            success: false,
            error: 'Internal server error',
        }, { status: 500 });
    }
}

/**
 * Delete a note
 */
export async function handleDeleteNote(env: Env, userId: string, noteId: string): Promise<Response> {
    try {
        // Check if user owns the note
        const note = await env.DB.prepare(
            'SELECT * FROM notes WHERE id = ? AND user_id = ?'
        ).bind(noteId, userId).first<Note>();

        if (!note) {
            return Response.json<ApiResponse>({
                success: false,
                error: 'Note not found',
            }, { status: 404 });
        }

        // Delete the note
        await env.DB.prepare(
            'DELETE FROM notes WHERE id = ?'
        ).bind(noteId).run();

        // Also delete any sharing records
        await env.DB.prepare(
            `DELETE FROM shared_items WHERE item_type = 'note' AND item_id = ?`
        ).bind(noteId).run();

        return Response.json<ApiResponse>({
            success: true,
            message: 'Note deleted successfully',
        });
    } catch (error) {
        console.error('Delete note error:', error);
        return Response.json<ApiResponse>({
            success: false,
            error: 'Internal server error',
        }, { status: 500 });
    }
}
