export interface Env {
    DB: D1Database;
    SESSIONS: KVNamespace;
    ENVIRONMENT: string;
    JWT_SECRET?: string;
}

export interface User {
    id: string;
    email: string;
    password_hash?: string;
    role: 'admin' | 'user';
    status: 'active' | 'suspended';
    created_at: number;
    last_login?: number;
    two_factor_enabled: number;
    two_factor_secret?: string;
    pgp_public_key?: string;
    pgp_key_fingerprint?: string;
}

export interface VaultEntry {
    id: string;
    user_id: string;
    title: string;
    username?: string;
    password_encrypted: string;
    url?: string;
    notes?: string;
    tags?: string; // JSON array
    folder?: string;
    created_at: number;
    updated_at: number;
}

export interface Note {
    id: string;
    user_id: string;
    title: string;
    content: string;
    tags?: string; // JSON array
    folder?: string;
    created_at: number;
    updated_at: number;
}

export interface SharedItem {
    id: string;
    item_type: 'entry' | 'note';
    item_id: string;
    owner_id: string;
    shared_with_email: string;
    permission: 'view' | 'edit';
    created_at: number;
}

export interface FidoKey {
    id: string;
    user_id: string;
    name: string;
    credential_id: string;
    public_key: string;
    counter: number;
    added_on: number;
}

export interface Session {
    id: string;
    user_id: string;
    token: string;
    expires_at: number;
    created_at: number;
}

export interface MagicLink {
    id: string;
    email: string;
    token: string;
    expires_at: number;
    created_at: number;
    used: number;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface AuthContext {
    user: User;
    sessionToken: string;
}
