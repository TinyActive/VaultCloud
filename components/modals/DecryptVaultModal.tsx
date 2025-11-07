import React, { useState } from 'react';
import { useI18n } from '../../i18n';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../Dialog';
import Button from '../Button';
import Input from '../Input';
import { pgpService } from '../../services/pgpService';

interface DecryptVaultModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUnlock: (masterPassword: string, privateKey?: string) => void;
}

const DecryptVaultModal: React.FC<DecryptVaultModalProps> = ({ isOpen, onClose, onUnlock }) => {
    const { t } = useI18n();
    const [masterPassword, setMasterPassword] = useState('');
    const [showUploadOption, setShowUploadOption] = useState(false);
    const [uploadedPrivateKey, setUploadedPrivateKey] = useState('');
    const [hasStoredKey, setHasStoredKey] = useState(false);
    
    // Check if user has a stored private key
    React.useEffect(() => {
        if (isOpen) {
            pgpService.hasPrivateKey().then(setHasStoredKey);
        }
    }, [isOpen]);
    
    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault();
        if (masterPassword) {
            if (uploadedPrivateKey) {
                // User uploaded a private key - store it temporarily for this session
                try {
                    await pgpService.storePrivateKeyOnly(uploadedPrivateKey, masterPassword);
                    // Verify it can be decrypted
                    await pgpService.loadAndDecryptPrivateKey(masterPassword);
                    onUnlock(masterPassword, uploadedPrivateKey);
                } catch (error: any) {
                    console.error('Failed to process uploaded key:', error);
                    alert('Failed to decrypt the uploaded private key.\n\n' + (error.message || 'Please check the key format and master password.'));
                    return;
                }
            } else {
                onUnlock(masterPassword);
            }
            setMasterPassword('');
            setUploadedPrivateKey('');
            setShowUploadOption(false);
        }
    };

    const handleFileUpload = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt,.asc,.key,.pgp';
        input.onchange = async (e: Event) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                try {
                    const text = await file.text();
                    const privateKeyMatch = text.match(/-----BEGIN PGP PRIVATE KEY BLOCK-----([\s\S]*?)-----END PGP PRIVATE KEY BLOCK-----/);
                    if (privateKeyMatch) {
                        setUploadedPrivateKey(privateKeyMatch[0]);
                        alert('✓ Private key loaded successfully!');
                    } else {
                        alert('❌ No valid PGP private key found in file.');
                    }
                } catch (error) {
                    console.error('Failed to read file:', error);
                    alert('Failed to read file. Please try again.');
                }
            }
        };
        input.click();
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose}>
            <DialogContent onClick={onClose}>
                <DialogHeader>
                    <DialogTitle>{t('privateKeyRequired')}</DialogTitle>
                    <DialogDescription>
                        {hasStoredKey 
                            ? 'Enter your Master Password to unlock your stored PGP key and decrypt the data.'
                            : 'No PGP private key found in browser storage. You can upload your private key from backup.'}
                    </DialogDescription>
                </DialogHeader>
                <form className="space-y-4 py-4" onSubmit={handleUnlock}>
                    <Input 
                        label={t('password')} 
                        id="master-password-unlock" 
                        type="password"
                        value={masterPassword}
                        onChange={(e) => setMasterPassword(e.target.value)}
                        placeholder="Enter your master password"
                    />
                    
                    {/* Show upload option if no stored key or user wants to use different key */}
                    {(!hasStoredKey || showUploadOption) && (
                        <div className="space-y-3 border-t pt-3">
                            <label className="block text-sm font-medium">Upload Private Key (Optional)</label>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={handleFileUpload}
                                >
                                    📁 {uploadedPrivateKey ? '✓ Key Loaded' : 'Upload Private Key'}
                                </Button>
                            </div>
                            {uploadedPrivateKey && (
                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-2">
                                    <p className="text-xs text-green-800 dark:text-green-200">
                                        ✓ Private key loaded. Enter your master password to decrypt.
                                    </p>
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Upload your private key from your backup file if you don't have it stored in this browser.
                            </p>
                        </div>
                    )}
                    
                    {/* Toggle upload option */}
                    {hasStoredKey && !showUploadOption && (
                        <Button
                            type="button"
                            variant="ghost"
                            className="w-full text-xs"
                            onClick={() => setShowUploadOption(true)}
                        >
                            Don't have the key in this browser? Upload from backup
                        </Button>
                    )}
                    
                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>{t('cancel')}</Button>
                        <Button type="submit" disabled={!masterPassword}>{t('unlockAndView')}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default DecryptVaultModal;