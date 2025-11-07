import React, { useState } from 'react';
import { useI18n } from '../../i18n';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../Dialog';
import Button from '../Button';
import Input from '../Input';
import { PGPKeySet, pgpService } from '../../services/pgpService';
import apiService from '../../services/apiService';

interface PgpSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (publicKey: string, privateKey: string, masterPassword: string) => void;
    currentKey: PGPKeySet | null;
    onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const PgpSettingsModal: React.FC<PgpSettingsModalProps> = ({ isOpen, onClose, onSave, currentKey, onShowToast }) => {
    const { t } = useI18n();
    const [publicKey, setPublicKey] = useState(currentKey?.publicKey || '');
    const [privateKey, setPrivateKey] = useState('');
    const [masterPassword, setMasterPassword] = useState('');
    const [generating, setGenerating] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [keysGenerated, setKeysGenerated] = useState(false);
    const [downloadConfirmed, setDownloadConfirmed] = useState(false);
    const [copyConfirmed, setCopyConfirmed] = useState(false);
    const [importMode, setImportMode] = useState(false); // New: track if user is importing private key only
    
    const handleGenerateKeys = async () => {
        if (!name || !email || !masterPassword) {
            alert('Please fill in your name, email, and master password to generate keys.');
            return;
        }
        
        try {
            setGenerating(true);
            const keys = await pgpService.generateKeys(name, email, masterPassword);
            setPublicKey(keys.publicKey);
            setPrivateKey(keys.privateKey);
            setKeysGenerated(true);
            setDownloadConfirmed(false);
            setCopyConfirmed(false);
        } catch (error) {
            console.error('Failed to generate keys:', error);
            alert('Failed to generate PGP keys. Please try again.');
        } finally {
            setGenerating(false);
        }
    };
    
    const handleDownloadKeys = () => {
        const keysData = `VaultCloud PGP Keys Backup
Generated: ${new Date().toISOString()}

IMPORTANT: Store these keys in a secure location!
You will need your master password to use the private key.

NOTE: Keep your master password separate from these keys.
Write it down and store in a different secure location.

====== PUBLIC KEY ======
${publicKey}

====== PRIVATE KEY ======
${privateKey}

====== IMPORTANT NOTES ======
1. Keep your private key and master password secure and separate
2. If you lose your master password, you cannot recover your encrypted data
3. Never share your private key with anyone
4. Store this file in a secure location (encrypted USB, password manager, etc.)
5. Consider printing a physical copy and storing it in a safe
`;
        
        const blob = new Blob([keysData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vaultcloud-pgp-keys-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setDownloadConfirmed(true);
    };
    
    const handleCopyKeys = async () => {
        const keysText = `Public Key:\n${publicKey}\n\nPrivate Key:\n${privateKey}`;
        try {
            await navigator.clipboard.writeText(keysText);
            setCopyConfirmed(true);
            if (onShowToast) {
                onShowToast('PGP keys copied to clipboard!');
            }
        } catch (error) {
            console.error('Failed to copy:', error);
            if (onShowToast) {
                onShowToast('Failed to copy keys', 'error');
            }
        }
    };
    
    const canSave = () => {
        if (!publicKey || !privateKey || !masterPassword) {
            return false;
        }
        // If keys were just generated, require user to download or copy
        if (keysGenerated && !downloadConfirmed && !copyConfirmed) {
            return false;
        }
        return true;
    };
    
    const handleSave = async () => {
        if (!canSave()) {
            if (keysGenerated && !downloadConfirmed && !copyConfirmed) {
                alert('⚠️ IMPORTANT: Please download or copy your keys before saving!\n\nYou must backup your keys to ensure you can recover your encrypted data if needed.');
            } else {
                alert('All fields are required.');
            }
            return;
        }
        
        // Validate private key format before saving
        try {
            const isValidPrivateKey = await pgpService.validatePrivateKey(privateKey);
            if (!isValidPrivateKey) {
                alert('❌ Invalid Private Key\n\nThe private key you provided is not in a valid PGP format. Please check and try again.');
                return;
            }
            
            // If public key is provided, validate it too
            if (publicKey) {
                const isValidPublicKey = await pgpService.validatePublicKey(publicKey);
                if (!isValidPublicKey) {
                    alert('❌ Invalid Public Key\n\nThe public key you provided is not in a valid PGP format. Please check and try again.');
                    return;
                }
            }
            
            // Test if the private key can be decrypted and used with the master password
            try {
                // Store temporarily
                await pgpService.storePrivateKeyOnly(privateKey, masterPassword);
                // Try to load and decrypt it
                const testKey = await pgpService.loadAndDecryptPrivateKey(masterPassword);
                if (!testKey || !testKey.isDecrypted()) {
                    throw new Error("Private key validation failed - key is not properly decrypted");
                }
                console.log('✓ Private key validation successful');
            } catch (error: any) {
                console.error('Key validation failed:', error);
                alert('❌ Key Validation Failed\n\n' + 
                      (error.message || 'Could not decrypt the private key with the provided master password') + 
                      '\n\nPlease verify:\n• The private key is correct\n• The master password matches the one used to encrypt this private key');
                return;
            }
        } catch (error: any) {
            console.error('Validation error:', error);
            alert('❌ Validation Error\n\n' + (error.message || 'Failed to validate PGP keys'));
            return;
        }
        
        if (keysGenerated && (downloadConfirmed || copyConfirmed)) {
            const confirmed = confirm(
                '⚠️ FINAL CONFIRMATION\n\n' +
                'Have you securely saved your PGP keys?\n\n' +
                '• Your private key and master password are needed to decrypt your data\n' +
                '• If you lose them, your encrypted passwords cannot be recovered\n' +
                '• Store them in a secure location separate from each other\n\n' +
                'Click OK only if you have saved your keys securely.'
            );
            
            if (!confirmed) {
                return;
            }
        }
        
        // Call the onSave with public key, private key, and master password
        // The parent component will handle saving public key to server and private key locally
        onSave(publicKey, privateKey, masterPassword);
    };
    
    return (
        <Dialog isOpen={isOpen} onClose={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{t('yourPgpKey')}</DialogTitle>
                    <DialogDescription>
                        Generate new PGP keys or import your private key to enable end-to-end encryption.
                        {currentKey?.publicKey && (
                            <span className="block mt-2 text-green-600 dark:text-green-400">
                                ✓ Public key already saved on server
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>
                
                {/* Warning Banner */}
                {keysGenerated && !downloadConfirmed && !copyConfirmed && (
                    <div className="bg-orange-100 dark:bg-orange-900/30 border border-orange-400 dark:border-orange-600 rounded-lg p-4 mb-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-orange-600 dark:text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3 flex-1">
                                <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-200">
                                    ⚠️ IMPORTANT: Backup Your Keys Now!
                                </h3>
                                <div className="mt-2 text-sm text-orange-700 dark:text-orange-300">
                                    <p>Your PGP keys have been generated. <strong>You must save them before proceeding!</strong></p>
                                    <ul className="list-disc list-inside mt-2 space-y-1">
                                        <li>Download or copy your keys to a secure location</li>
                                        <li>Without these keys and your master password, you cannot recover encrypted data</li>
                                        <li>Store your private key and master password separately and securely</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Generate Keys Section */}
                <div className="py-4 border-b">
                    <h3 className="text-sm font-semibold mb-3">Generate New PGP Keys</h3>
                    {!keysGenerated ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                <Input
                                    label="Your Name"
                                    id="pgp-name"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                                <Input
                                    label="Your Email"
                                    id="pgp-email"
                                    type="email"
                                    placeholder="john@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <Input
                                label="Master Password"
                                id="master-password-gen"
                                type="password"
                                placeholder="Enter a strong master password"
                                value={masterPassword}
                                onChange={(e) => setMasterPassword(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground mt-1 mb-3">
                                Your master password is used to encrypt your private key locally. It is never sent to the server.
                                <strong> Choose a strong, memorable password - you will need it to decrypt your passwords!</strong>
                            </p>
                            <Button 
                                onClick={handleGenerateKeys} 
                                disabled={generating || !name || !email || !masterPassword}
                                className="w-full"
                            >
                                {generating ? 'Generating Keys... (this may take a moment)' : 'Generate PGP Keys'}
                            </Button>
                        </>
                    ) : (
                        <div className="space-y-3">
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                                <p className="text-sm text-green-800 dark:text-green-200">
                                    ✓ Keys generated successfully for <strong>{name}</strong> ({email})
                                </p>
                            </div>
                            
                            {/* Backup Options */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <Button 
                                    onClick={handleDownloadKeys}
                                    variant={downloadConfirmed ? "default" : "outline"}
                                    className="w-full"
                                >
                                    {downloadConfirmed ? '✓ Downloaded' : '📥 Download Keys'}
                                </Button>
                                <Button 
                                    onClick={handleCopyKeys}
                                    variant={copyConfirmed ? "default" : "outline"}
                                    className="w-full"
                                >
                                    {copyConfirmed ? '✓ Copied to Clipboard' : '📋 Copy Keys'}
                                </Button>
                            </div>
                            
                            {copyConfirmed && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2">
                                    <p className="text-xs text-blue-800 dark:text-blue-200">
                                        ✓ Keys copied to clipboard! Please paste and save them in a secure location immediately.
                                    </p>
                                </div>
                            )}
                            
                            <p className="text-xs text-muted-foreground">
                                Choose at least one option to backup your keys. You'll need them to decrypt your passwords.
                            </p>
                            
                            <Button 
                                onClick={() => {
                                    setKeysGenerated(false);
                                    setPublicKey('');
                                    setPrivateKey('');
                                    setDownloadConfirmed(false);
                                    setCopyConfirmed(false);
                                }}
                                variant="ghost"
                                className="w-full text-xs"
                            >
                                Generate Different Keys
                            </Button>
                        </div>
                    )}
                </div>

                {/* Import Existing Keys Section */}
                {!keysGenerated && (
                    <div className="py-4">
                        <h3 className="text-sm font-semibold mb-3">Or Import Your Private Key</h3>
                        <p className="text-xs text-muted-foreground mb-3">
                            {currentKey?.publicKey 
                                ? "Your public key is already saved on the server. Just import your private key from your backup file."
                                : "If you're using a new device, import your private key from your backup file. The public key will be retrieved from the server."}
                        </p>
                        <div className="space-y-3">
                            {/* Upload File Button */}
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => {
                                        const input = document.createElement('input');
                                        input.type = 'file';
                                        input.accept = '.txt,.asc,.key,.pgp';
                                        input.onchange = async (e: Event) => {
                                            const file = (e.target as HTMLInputElement).files?.[0];
                                            if (file) {
                                                try {
                                                    const text = await file.text();
                                                    // Try to extract private key from file
                                                    const privateKeyMatch = text.match(/-----BEGIN PGP PRIVATE KEY BLOCK-----([\s\S]*?)-----END PGP PRIVATE KEY BLOCK-----/);
                                                    if (privateKeyMatch) {
                                                        setPrivateKey(privateKeyMatch[0]);
                                                        setImportMode(true);
                                                        alert('✓ Private key loaded successfully from file!');
                                                    } else {
                                                        alert('❌ No valid PGP private key found in file. Please ensure the file contains a PGP private key block.');
                                                    }
                                                } catch (error) {
                                                    console.error('Failed to read file:', error);
                                                    alert('Failed to read file. Please try again.');
                                                }
                                            }
                                        };
                                        input.click();
                                    }}
                                >
                                    📁 Upload Private Key File
                                </Button>
                            </div>
                            
                            <div>
                                <label htmlFor="pgp-private" className="block text-sm font-medium text-foreground mb-2">Or Paste Private Key</label>
                                <textarea 
                                    id="pgp-private"
                                    value={privateKey}
                                    onChange={(e) => {
                                        setPrivateKey(e.target.value);
                                        setImportMode(true);
                                    }}
                                    rows={8}
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    placeholder="-----BEGIN PGP PRIVATE KEY BLOCK-----&#10;...&#10;-----END PGP PRIVATE KEY BLOCK-----"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Paste the private key from your backup file. Your public key will be automatically retrieved from the server.
                                </p>
                            </div>
                            {!masterPassword && privateKey && (
                                <Input
                                    label="Master Password (for imported keys)"
                                    id="master-password-import"
                                    type="password"
                                    placeholder="Enter your master password"
                                    value={masterPassword}
                                    onChange={(e) => setMasterPassword(e.target.value)}
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* Keys Preview (if generated) */}
                {keysGenerated && (downloadConfirmed || copyConfirmed) && (
                    <div className="py-4 border-t">
                        <h3 className="text-sm font-semibold mb-3">Keys Preview</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-foreground mb-1">Public Key (first 100 chars)</label>
                                <div className="text-xs font-mono bg-muted p-2 rounded border overflow-hidden text-ellipsis">
                                    {publicKey.substring(0, 100)}...
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-foreground mb-1">Private Key (first 100 chars)</label>
                                <div className="text-xs font-mono bg-muted p-2 rounded border overflow-hidden text-ellipsis">
                                    {privateKey.substring(0, 100)}...
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>{t('cancel')}</Button>
                    <Button 
                        onClick={handleSave} 
                        disabled={!canSave()}
                        title={!canSave() && keysGenerated ? 'Please download or copy your keys first' : ''}
                    >
                        {t('savePgpKey')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default PgpSettingsModal;