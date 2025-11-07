// This will use the openpgp object from the global scope (CDN)
// The `openpgp` object is declared in types.ts to satisfy TypeScript

const DB_NAME = 'VaultCloudDB';
const DB_VERSION = 1;
const STORE_NAME = 'pgpKeys';

export interface PGPKeySet {
    publicKey: string;
    privateKey: string; // This will be the ENCRYPTED private key when stored locally
}

export interface PGPKeys {
    publicKey: string;
    encryptedPrivateKey: string;
}

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject("Error opening DB");
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
}

async function getFromDB(key: string): Promise<any> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);
        request.onerror = () => reject('Error fetching from DB');
        request.onsuccess = () => resolve(request.result?.value);
    });
}

async function setToDB(key: string, value: any): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put({ id: key, value });
        request.onerror = () => reject('Error saving to DB');
        request.onsuccess = () => resolve();
    });
}

async function removeFromDB(key: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(key);
        request.onerror = () => reject('Error deleting from DB');
        request.onsuccess = () => resolve();
    });
}

export const pgpService = {
    async generateKeys(name: string, email: string, passphrase: string): Promise<{ publicKey: string, privateKey: string }> {
        const { privateKey, publicKey } = await openpgp.generateKey({
            type: 'rsa',
            rsaBits: 4096,
            userIDs: [{ name, email }],
            passphrase,
        });
        
        return {
            publicKey,
            privateKey,
        };
    },

    async storeKeys(keys: { publicKey: string, privateKey: string }, masterPassword: string): Promise<void> {
        // Encrypt the private key with master password
        const encryptedPrivateKey = await openpgp.encrypt({
            message: await openpgp.createMessage({ text: keys.privateKey }),
            passwords: [masterPassword],
            format: 'armored'
        });
        
        // Store ONLY encrypted private key locally
        const localKeys: PGPKeys = {
            publicKey: keys.publicKey, // Still store for quick access
            encryptedPrivateKey: encryptedPrivateKey,
        };
        
        await setToDB('pgpKeys', localKeys);
    },

    async storePrivateKeyOnly(privateKey: string, masterPassword: string): Promise<void> {
        // Encrypt the private key with master password
        const encryptedPrivateKey = await openpgp.encrypt({
            message: await openpgp.createMessage({ text: privateKey }),
            passwords: [masterPassword],
            format: 'armored'
        });
        
        // Get existing keys to preserve public key if exists
        const existingKeys = await this.loadKeys();
        
        // Store encrypted private key
        const localKeys: PGPKeys = {
            publicKey: existingKeys?.publicKey || '', // Keep existing or empty
            encryptedPrivateKey: encryptedPrivateKey,
        };
        
        await setToDB('pgpKeys', localKeys);
    },

    async loadKeys(): Promise<PGPKeys | null> {
        return await getFromDB('pgpKeys');
    },

    async removeKeys(): Promise<void> {
        await removeFromDB('pgpKeys');
    },

    async hasPrivateKey(): Promise<boolean> {
        const keys = await this.loadKeys();
        return !!(keys && keys.encryptedPrivateKey);
    },

    async hasPublicKey(): Promise<boolean> {
        const keys = await this.loadKeys();
        return !!(keys && keys.publicKey);
    },

    // FIX: Changed return type from openpgp.PrivateKey to any.
    async loadAndDecryptPrivateKey(masterPassword: string): Promise<any> {
        const keys = await this.loadKeys();
        if (!keys || !keys.encryptedPrivateKey) {
            throw new Error("No PGP private key found in browser storage. Please import your private key from backup.");
        }

        try {
            // Step 1: Decrypt the encrypted private key stored in IndexedDB
            const message = await openpgp.readMessage({ armoredMessage: keys.encryptedPrivateKey });
            const { data: decrypted } = await openpgp.decrypt({
                message,
                passwords: [masterPassword],
                format: 'text'
            });

            // Step 2: Read the decrypted private key
            const privateKey = await openpgp.readKey({ armoredKey: decrypted });
            
            // Step 3: IMPORTANT - The private key itself may still be encrypted with the passphrase
            // We need to decrypt it with the same master password
            if (!privateKey.isDecrypted()) {
                const decryptedPrivateKey = await openpgp.decryptKey({
                    privateKey: privateKey,
                    passphrase: masterPassword
                });
                return decryptedPrivateKey;
            }
            
            return privateKey;
        } catch (error: any) {
            console.error('Failed to decrypt private key:', error);
            if (error.message && error.message.includes('Incorrect')) {
                throw new Error("Incorrect master password. Please try again.");
            } else if (error.message && error.message.includes('decrypt')) {
                throw new Error("Failed to decrypt private key. The key may be corrupted or the master password is incorrect.");
            }
            throw new Error("Failed to load and decrypt private key: " + error.message);
        }
    },

    async loadPublicKey(): Promise<any> {
        const keys = await this.loadKeys();
        if (!keys || !keys.publicKey) {
            throw new Error("No PGP public key found in browser storage.");
        }
        try {
            return await openpgp.readKey({ armoredKey: keys.publicKey });
        } catch (error: any) {
            throw new Error("Failed to parse public key: " + error.message);
        }
    },

    // FIX: Changed publicKey type from openpgp.Key to any.
    async encrypt(text: string, publicKey: any): Promise<string> {
        try {
            if (!text) {
                throw new Error("Cannot encrypt empty text");
            }
            if (!publicKey) {
                throw new Error("Public key is required for encryption");
            }
            
            const message = await openpgp.createMessage({ text });
            const encrypted = await openpgp.encrypt({
                message,
                encryptionKeys: publicKey,
            });
            
            // Validate encryption result
            if (!encrypted || typeof encrypted !== 'string' || !encrypted.includes('-----BEGIN PGP MESSAGE-----')) {
                throw new Error("Encryption failed - invalid output format");
            }
            
            return encrypted;
        } catch (error: any) {
            console.error('Encryption failed:', error);
            throw new Error("Failed to encrypt data: " + error.message);
        }
    },

    // FIX: Changed privateKey type from openpgp.PrivateKey to any.
    async decrypt(encryptedText: string, privateKey: any): Promise<string> {
        try {
            if (!encryptedText) {
                throw new Error("Cannot decrypt empty text");
            }
            if (!privateKey) {
                throw new Error("Private key is required for decryption");
            }
            
            // Validate the encrypted text format
            if (!encryptedText.includes('-----BEGIN PGP MESSAGE-----')) {
                // Text is not encrypted, return as-is
                console.warn('Text does not appear to be PGP encrypted, returning as-is');
                return encryptedText;
            }
            
            // IMPORTANT: Ensure the private key is decrypted before use
            let decryptedKey = privateKey;
            if (!privateKey.isDecrypted()) {
                console.error('Private key is not decrypted! This should not happen.');
                throw new Error("Private key must be decrypted before use. Please unlock your vault with master password.");
            }
            
            const message = await openpgp.readMessage({ armoredMessage: encryptedText });
            const { data: decrypted } = await openpgp.decrypt({
                message,
                decryptionKeys: decryptedKey,
            });
            
            if (!decrypted) {
                throw new Error("Decryption resulted in empty data");
            }
            
            return decrypted as string;
        } catch (error: any) {
            console.error('Decryption failed:', error);
            if (error.message && error.message.includes('Session key decryption failed')) {
                throw new Error("Wrong private key or the data was encrypted with a different key.");
            } else if (error.message && error.message.includes('not decrypted')) {
                throw new Error("Private key is locked. Please enter your master password to unlock it.");
            } else if (error.message && error.message.includes('Error decrypting')) {
                throw new Error("Failed to decrypt. Please check your master password and try again.");
            }
            throw new Error("Decryption failed: " + error.message);
        }
    },
    
    // Validate if a string is a valid PGP private key
    async validatePrivateKey(privateKeyArmored: string): Promise<boolean> {
        try {
            if (!privateKeyArmored || !privateKeyArmored.includes('-----BEGIN PGP PRIVATE KEY BLOCK-----')) {
                return false;
            }
            const key = await openpgp.readKey({ armoredKey: privateKeyArmored });
            return key.isPrivate();
        } catch (error) {
            console.error('Invalid private key:', error);
            return false;
        }
    },
    
    // Validate if a string is a valid PGP public key
    async validatePublicKey(publicKeyArmored: string): Promise<boolean> {
        try {
            if (!publicKeyArmored || !publicKeyArmored.includes('-----BEGIN PGP PUBLIC KEY BLOCK-----')) {
                return false;
            }
            await openpgp.readKey({ armoredKey: publicKeyArmored });
            return true;
        } catch (error) {
            console.error('Invalid public key:', error);
            return false;
        }
    }
};