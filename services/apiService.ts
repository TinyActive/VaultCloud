/**
 * API Service for VaultCloud
 * Handles all communication with the Cloudflare Workers backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787/api';

interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

class ApiService {
    private token: string | null = null;

    constructor() {
        // Load token from localStorage on initialization
        this.token = localStorage.getItem('vaultcloud-token');
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        const data: ApiResponse<T> = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'An error occurred');
        }

        return data.data as T;
    }

    setToken(token: string | null) {
        this.token = token;
        if (token) {
            localStorage.setItem('vaultcloud-token', token);
        } else {
            localStorage.removeItem('vaultcloud-token');
        }
    }

    getToken(): string | null {
        return this.token;
    }

    // Auth endpoints
    async login(email: string, password: string) {
        const response = await this.request<{ user: any; token: string; expiresAt: number }>(
            '/auth/login',
            {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            }
        );
        this.setToken(response.token);
        return response;
    }

    async register(email: string, password: string) {
        const response = await this.request<{ 
            user?: any; 
            token?: string; 
            expiresAt?: number;
            message?: string;
            requiresVerification?: boolean;
        }>(
            '/auth/register',
            {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            }
        );
        
        // Only set token if provided (not required for email verification)
        if (response.token) {
            this.setToken(response.token);
        }
        
        return response;
    }

    async sendMagicLink(email: string) {
        return await this.request<{ message: string }>(
            '/auth/magic-link',
            {
                method: 'POST',
                body: JSON.stringify({ email }),
            }
        );
    }

    async verifyMagicLink(token: string) {
        const response = await this.request<{ user: any; token: string; expiresAt: number }>(
            '/auth/verify-magic-link',
            {
                method: 'POST',
                body: JSON.stringify({ token }),
            }
        );
        this.setToken(response.token);
        return response;
    }

    async logout() {
        await this.request('/auth/logout', { method: 'POST' });
        this.setToken(null);
    }

    async getMe() {
        return await this.request<any>('/auth/me');
    }

    async changePassword(currentPassword: string, newPassword: string) {
        return await this.request<{ message: string }>('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword }),
        });
    }

    async changeEmail(newEmail: string, password: string) {
        return await this.request<{ message: string; newEmail: string }>('/auth/change-email', {
            method: 'POST',
            body: JSON.stringify({ newEmail, password }),
        });
    }

    // PGP key endpoints
    async savePgpPublicKey(publicKey: string) {
        return await this.request<any>('/pgp/public-key', {
            method: 'POST',
            body: JSON.stringify({ publicKey }),
        });
    }

    async getPgpPublicKey() {
        return await this.request<{ publicKey: string | null }>('/pgp/public-key');
    }

    // Vault entries endpoints
    async getEntries() {
        return await this.request<any[]>('/entries');
    }

    async getEntry(id: string) {
        return await this.request<any>(`/entries/${id}`);
    }

    async createEntry(entry: any) {
        return await this.request<any>('/entries', {
            method: 'POST',
            body: JSON.stringify(entry),
        });
    }

    async updateEntry(id: string, entry: any) {
        return await this.request<any>(`/entries/${id}`, {
            method: 'PUT',
            body: JSON.stringify(entry),
        });
    }

    async deleteEntry(id: string) {
        return await this.request<any>(`/entries/${id}`, {
            method: 'DELETE',
        });
    }

    // Notes endpoints
    async getNotes() {
        return await this.request<any[]>('/notes');
    }

    async getNote(id: string) {
        return await this.request<any>(`/notes/${id}`);
    }

    async createNote(note: any) {
        return await this.request<any>('/notes', {
            method: 'POST',
            body: JSON.stringify(note),
        });
    }

    async updateNote(id: string, note: any) {
        return await this.request<any>(`/notes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(note),
        });
    }

    async deleteNote(id: string) {
        return await this.request<any>(`/notes/${id}`, {
            method: 'DELETE',
        });
    }

    // Sharing endpoints
    async shareItem(itemType: 'entry' | 'note', itemId: string, email: string, permission: 'view' | 'edit') {
        return await this.request<any>('/share', {
            method: 'POST',
            body: JSON.stringify({
                itemType,
                itemId,
                sharedWithEmail: email,
                permission,
            }),
        });
    }

    async getItemShares(itemType: 'entry' | 'note', itemId: string) {
        return await this.request<any[]>(`/share/${itemType}/${itemId}/shares`);
    }

    async unshareItem(shareId: string) {
        return await this.request<any>(`/share/${shareId}`, {
            method: 'DELETE',
        });
    }

    // Admin endpoints
    async getUsers() {
        return await this.request<any[]>('/admin/users');
    }

    async createUser(email: string, password?: string, role?: string) {
        return await this.request<any>('/admin/users', {
            method: 'POST',
            body: JSON.stringify({ email, password, role }),
        });
    }

    async updateUser(userId: string, updates: { role?: string; status?: string }) {
        return await this.request<any>(`/admin/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
    }

    async deleteUser(userId: string) {
        return await this.request<any>(`/admin/users/${userId}`, {
            method: 'DELETE',
        });
    }

    // FIDO/WebAuthn endpoints
    async fidoRegisterChallenge() {
        return await this.request<any>('/fido/register/challenge', {
            method: 'POST',
        });
    }

    async fidoRegisterCredential(challengeId: string, credential: any, name: string) {
        return await this.request<any>('/fido/register/credential', {
            method: 'POST',
            body: JSON.stringify({ challengeId, credential, name }),
        });
    }

    async fidoAuthenticationChallenge(email: string) {
        return await this.request<any>('/fido/authenticate/challenge', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    }

    async fidoAuthenticateCredential(challengeId: string, credential: any) {
        const response = await this.request<{ user: any; token: string; expiresAt: number }>(
            '/fido/authenticate/credential',
            {
                method: 'POST',
                body: JSON.stringify({ challengeId, credential }),
            }
        );
        this.setToken(response.token);
        return response;
    }

    async fidoListCredentials() {
        return await this.request<any[]>('/fido/credentials');
    }

    async fidoDeleteCredential(credentialId: string) {
        return await this.request<any>(`/fido/credentials/${credentialId}`, {
            method: 'DELETE',
        });
    }

    async fidoTogglePasswordLogin(enabled: boolean, password?: string) {
        return await this.request<{ passwordLoginEnabled: boolean }>('/fido/password-login', {
            method: 'POST',
            body: JSON.stringify({ enabled, password }),
        });
    }

    // Site Settings endpoints (admin only)
    async getSiteSettings() {
        return await this.request<{
            id: string;
            registration_enabled: number;
            email_verification_enabled: number;
            resend_api_key: string | null;
            updated_at: number;
            updated_by: string | null;
        }>('/admin/settings');
    }

    async updateSiteSettings(settings: {
        registration_enabled?: boolean;
        email_verification_enabled?: boolean;
        resend_api_key?: string;
    }) {
        return await this.request<any>('/admin/settings', {
            method: 'PUT',
            body: JSON.stringify(settings),
        });
    }

    async getPublicSiteSettings() {
        return await this.request<{
            registration_enabled: boolean;
            email_verification_enabled: boolean;
        }>('/settings/public');
    }

    // Health check
    async healthCheck() {
        return await fetch(`${API_BASE_URL}/health`).then(r => r.json());
    }
}

export const apiService = new ApiService();
export default apiService;
