/**
 * FIDO2/WebAuthn Service
 * Handles passwordless authentication using security keys (YubiKey, etc.)
 */

import apiService from './apiService';

interface RegisterChallengeResponse {
    challenge: string;
    challengeId: string;
    rp: {
        name: string;
        id: string;
    };
    user: {
        id: string;
        name: string;
        displayName: string;
    };
    pubKeyCredParams: Array<{
        type: string;
        alg: number;
    }>;
    authenticatorSelection: {
        authenticatorAttachment?: string;
        requireResidentKey: boolean;
        userVerification: string;
    };
    timeout: number;
    attestation: string;
}

interface AuthenticationChallengeResponse {
    challenge: string;
    challengeId: string;
    rpId: string;
    allowCredentials: Array<{
        type: string;
        id: string;
        transports?: string[];
    }>;
    timeout: number;
    userVerification: string;
}

interface FidoKey {
    id: string;
    name: string;
    addedOn: string;
    transports: string[];
}

class FidoService {
    /**
     * Check if WebAuthn is supported in this browser
     */
    isSupported(): boolean {
        return !!(navigator.credentials && navigator.credentials.create && navigator.credentials.get);
    }

    /**
     * Check if platform authenticator (Touch ID, Windows Hello) is available
     */
    async isPlatformAuthenticatorAvailable(): Promise<boolean> {
        if (!this.isSupported()) return false;
        
        try {
            return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        } catch {
            return false;
        }
    }

    /**
     * Register a new FIDO security key
     */
    async registerSecurityKey(keyName: string): Promise<FidoKey> {
        if (!this.isSupported()) {
            throw new Error('WebAuthn is not supported in this browser');
        }

        // Step 1: Get registration challenge from server
        const challengeData = await apiService.fidoRegisterChallenge();
        const options = this.parseRegisterOptions(challengeData);

        // Step 2: Create credential using WebAuthn API
        const credential = await navigator.credentials.create({
            publicKey: options,
        }) as PublicKeyCredential | null;

        if (!credential) {
            throw new Error('Failed to create credential');
        }

        // Step 3: Send credential to server for verification and storage
        const response = credential.response as AuthenticatorAttestationResponse;
        
        const credentialData = {
            id: credential.id,
            rawId: this.bufferToBase64(credential.rawId),
            type: credential.type,
            response: {
                clientDataJSON: this.bufferToBase64(response.clientDataJSON),
                attestationObject: this.bufferToBase64(response.attestationObject),
                publicKey: response.getPublicKey() ? this.bufferToBase64(response.getPublicKey()!) : null,
                transports: response.getTransports ? response.getTransports() : [],
            },
        };

        return await apiService.fidoRegisterCredential(
            challengeData.challengeId,
            credentialData,
            keyName
        );
    }

    /**
     * Authenticate using FIDO security key
     */
    async authenticateWithSecurityKey(email: string): Promise<{ user: any; token: string; expiresAt: number }> {
        if (!this.isSupported()) {
            throw new Error('WebAuthn is not supported in this browser');
        }

        // Step 1: Get authentication challenge from server
        const challengeData = await apiService.fidoAuthenticationChallenge(email);
        const options = this.parseAuthenticationOptions(challengeData);

        // Step 2: Get assertion using WebAuthn API
        const assertion = await navigator.credentials.get({
            publicKey: options,
        }) as PublicKeyCredential | null;

        if (!assertion) {
            throw new Error('Authentication failed');
        }

        // Step 3: Send assertion to server for verification
        const response = assertion.response as AuthenticatorAssertionResponse;
        
        const assertionData = {
            id: assertion.id,
            rawId: this.bufferToBase64(assertion.rawId),
            type: assertion.type,
            response: {
                clientDataJSON: this.bufferToBase64(response.clientDataJSON),
                authenticatorData: this.bufferToBase64(response.authenticatorData),
                signature: this.bufferToBase64(response.signature),
                userHandle: response.userHandle ? this.bufferToBase64(response.userHandle) : null,
            },
        };

        return await apiService.fidoAuthenticateCredential(
            challengeData.challengeId,
            assertionData
        );
    }

    /**
     * List registered security keys for current user
     */
    async listSecurityKeys(): Promise<FidoKey[]> {
        return await apiService.fidoListCredentials();
    }

    /**
     * Remove a security key
     */
    async removeSecurityKey(keyId: string): Promise<void> {
        await apiService.fidoDeleteCredential(keyId);
    }

    /**
     * Toggle password login on/off
     */
    async togglePasswordLogin(enabled: boolean, password?: string): Promise<{ passwordLoginEnabled: boolean }> {
        return await apiService.fidoTogglePasswordLogin(enabled, password);
    }

    /**
     * Parse server registration options to WebAuthn format
     */
    private parseRegisterOptions(data: RegisterChallengeResponse): PublicKeyCredentialCreationOptions {
        return {
            challenge: this.base64ToBuffer(data.challenge),
            rp: {
                name: data.rp.name,
                id: data.rp.id,
            },
            user: {
                id: this.base64ToBuffer(data.user.id),
                name: data.user.name,
                displayName: data.user.displayName,
            },
            pubKeyCredParams: data.pubKeyCredParams,
            authenticatorSelection: {
                authenticatorAttachment: data.authenticatorSelection.authenticatorAttachment as AuthenticatorAttachment,
                requireResidentKey: data.authenticatorSelection.requireResidentKey,
                userVerification: data.authenticatorSelection.userVerification as UserVerificationRequirement,
            },
            timeout: data.timeout,
            attestation: data.attestation as AttestationConveyancePreference,
        };
    }

    /**
     * Parse server authentication options to WebAuthn format
     */
    private parseAuthenticationOptions(data: AuthenticationChallengeResponse): PublicKeyCredentialRequestOptions {
        return {
            challenge: this.base64ToBuffer(data.challenge),
            rpId: data.rpId,
            allowCredentials: data.allowCredentials.map(cred => ({
                type: cred.type as PublicKeyCredentialType,
                id: this.base64ToBuffer(cred.id),
                transports: cred.transports as AuthenticatorTransport[],
            })),
            timeout: data.timeout,
            userVerification: data.userVerification as UserVerificationRequirement,
        };
    }

    /**
     * Convert base64url string to ArrayBuffer
     */
    private base64ToBuffer(base64: string): ArrayBuffer {
        // Add padding if needed
        const padding = '='.repeat((4 - (base64.length % 4)) % 4);
        const base64Padded = base64.replace(/-/g, '+').replace(/_/g, '/') + padding;
        
        const binary = atob(base64Padded);
        const bytes = new Uint8Array(binary.length);
        
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        
        return bytes.buffer;
    }

    /**
     * Convert ArrayBuffer to base64url string
     */
    private bufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        
        return btoa(binary)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }
}

export default new FidoService();
