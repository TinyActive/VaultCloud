
import React, { useState, useEffect } from 'react';
import { useI18n } from '../../i18n';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../Dialog';
import Button from '../Button';
import Input from '../Input';
import { CheckIcon, XIcon } from '../../constants';
import fidoService from '../../services/fidoService';

interface RegisterFidoKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRegister: (key: any) => void;
}

const RegisterFidoKeyModal: React.FC<RegisterFidoKeyModalProps> = ({ isOpen, onClose, onRegister }) => {
    const { t } = useI18n();
    const [status, setStatus] = useState<'initial' | 'waiting' | 'naming' | 'success' | 'error'>('initial');
    const [keyName, setKeyName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSupported, setIsSupported] = useState(true);

    useEffect(() => {
        if (isOpen) {
            // Check WebAuthn support
            const supported = fidoService.isSupported();
            setIsSupported(supported);
            
            if (!supported) {
                setStatus('error');
                setError('WebAuthn is not supported in this browser. Please use a modern browser like Chrome, Firefox, Edge, or Safari.');
            } else {
                setStatus('naming');
            }
            
            setKeyName('');
            setError(null);
        }
    }, [isOpen]);

    const handleRegister = async () => {
        if (!keyName.trim()) {
            setError('Please enter a name for your security key');
            return;
        }

        setStatus('waiting');
        setError(null);

        try {
            // Register security key using WebAuthn
            const key = await fidoService.registerSecurityKey(keyName.trim());
            
            setStatus('success');
            
            // Call parent callback after a brief delay
            setTimeout(() => {
                onRegister(key);
                onClose();
            }, 1500);
        } catch (err) {
            console.error('FIDO registration error:', err);
            setStatus('error');
            setError(err instanceof Error ? err.message : 'Failed to register security key');
        }
    };

    const handleClose = () => {
        if (status !== 'waiting') {
            onClose();
        }
    };

    return (
        <Dialog isOpen={isOpen} onClose={handleClose}>
            <DialogContent onClick={handleClose}>
                <DialogHeader>
                    <DialogTitle>{t('registerSecurityKey')}</DialogTitle>
                    <DialogDescription>
                        {isSupported 
                            ? t('registerSecurityKeyDesc')
                            : 'Unable to register security key'
                        }
                    </DialogDescription>
                </DialogHeader>
                <div className="py-8 flex flex-col items-center justify-center text-center">
                    {status === 'naming' && (
                        <>
                            <div className="w-16 h-16 mb-4 flex items-center justify-center">
                                <svg className="w-16 h-16 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                            </div>
                            <p className="font-medium text-lg mb-2">{t('nameYourKey')}</p>
                            <p className="text-muted-foreground text-sm mb-4">
                                Give your security key a memorable name (e.g., "YubiKey 5C", "My USB Key")
                            </p>
                            <Input 
                                id="key-name" 
                                placeholder="e.g. My YubiKey"
                                value={keyName}
                                onChange={(e) => setKeyName(e.target.value)}
                                autoFocus
                            />
                            {error && (
                                <p className="text-destructive text-sm mt-2">{error}</p>
                            )}
                        </>
                    )}
                    {status === 'waiting' && (
                        <>
                            <div className="w-16 h-16 border-4 border-dashed border-primary rounded-full animate-spin mb-4"></div>
                            <p className="font-medium text-lg">{t('waitingForKey')}</p>
                            <p className="text-muted-foreground text-sm mt-2">
                                Insert your security key and touch it when it blinks
                            </p>
                        </>
                    )}
                    {status === 'success' && (
                        <>
                            <CheckIcon className="w-16 h-16 text-green-500 mb-4" />
                            <p className="font-medium text-lg text-green-600 dark:text-green-400">
                                Security Key Registered!
                            </p>
                            <p className="text-muted-foreground text-sm mt-2">
                                Your security key "{keyName}" has been successfully registered
                            </p>
                        </>
                    )}
                    {status === 'error' && (
                        <>
                            <XIcon className="w-16 h-16 text-destructive mb-4" />
                            <p className="font-medium text-lg text-destructive">Registration Failed</p>
                            <p className="text-muted-foreground text-sm mt-2">{error}</p>
                        </>
                    )}
                </div>
                <DialogFooter>
                    <Button 
                        variant="outline" 
                        onClick={handleClose}
                        disabled={status === 'waiting'}
                    >
                        {status === 'success' ? t('close') : t('cancel')}
                    </Button>
                    {status === 'naming' && (
                        <Button 
                            onClick={handleRegister} 
                            disabled={!keyName.trim()}
                        >
                            {t('add')}
                        </Button>
                    )}
                    {status === 'error' && isSupported && (
                        <Button onClick={() => setStatus('naming')}>
                            Try Again
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default RegisterFidoKeyModal;
