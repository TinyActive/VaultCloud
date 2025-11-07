import React, { useState } from 'react';
import { useI18n } from '../../i18n';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../Dialog';
import Input from '../Input';
import Button from '../Button';
import apiService from '../../services/apiService';

interface ChangeEmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentEmail: string;
    emailChangedAt?: number;
    onSuccess?: (newEmail: string) => void;
}

const ChangeEmailModal: React.FC<ChangeEmailModalProps> = ({ 
    isOpen, 
    onClose, 
    currentEmail,
    emailChangedAt,
    onSuccess 
}) => {
    const { t } = useI18n();
    const [newEmail, setNewEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const alreadyChanged = !!emailChangedAt;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validation
        if (!newEmail || !password) {
            setError(t('allFieldsRequired') || 'All fields are required');
            return;
        }

        if (!newEmail.includes('@')) {
            setError(t('invalidEmailFormat') || 'Invalid email format');
            return;
        }

        if (newEmail === currentEmail) {
            setError(t('emailMustBeDifferent') || 'New email must be different from current email');
            return;
        }

        setIsLoading(true);

        try {
            const response = await apiService.changeEmail(newEmail, password);
            setSuccess(response.message);
            
            // Clear form
            setNewEmail('');
            setPassword('');

            // Close after 2 seconds and notify parent
            setTimeout(() => {
                if (onSuccess) onSuccess(response.newEmail);
                onClose();
            }, 2000);
        } catch (err: any) {
            setError(err.message || t('changeEmailError') || 'Failed to change email');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setNewEmail('');
        setPassword('');
        setError('');
        setSuccess('');
        onClose();
    };

    return (
        <Dialog isOpen={isOpen} onClose={handleClose}>
            <DialogContent onClick={handleClose}>
                <DialogHeader>
                    <DialogTitle>{t('changeEmail') || 'Change Email'}</DialogTitle>
                    <DialogDescription>
                        {alreadyChanged ? (
                            <span className="text-destructive">
                                ⚠️ {t('emailAlreadyChanged') || 'Email can only be changed once. You have already changed your email.'}
                            </span>
                        ) : (
                            <span className="text-muted-foreground">
                                ⚠️ {t('emailChangeWarning') || 'You can only change your email once. Make sure to enter the correct email address.'}
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>
                
                {alreadyChanged ? (
                    <div className="space-y-4">
                        <div className="p-4 rounded-md bg-muted border">
                            <p className="text-sm">
                                <strong>{t('currentEmail') || 'Current Email'}:</strong> {currentEmail}
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">
                                {t('emailChangedOn') || 'Email was changed on'}: {new Date(emailChangedAt * 1000).toLocaleDateString()}
                            </p>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleClose}>{t('close') || 'Close'}</Button>
                        </DialogFooter>
                    </div>
                ) : (
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        {error && (
                            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="p-3 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 text-sm">
                                ✓ {success}
                            </div>
                        )}
                        
                        <div className="p-3 rounded-md bg-muted text-sm">
                            <strong>{t('currentEmail') || 'Current Email'}:</strong> {currentEmail}
                        </div>

                        <Input 
                            label={t('newEmail') || 'New Email'} 
                            id="new-email" 
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            disabled={isLoading}
                            placeholder="your.new.email@example.com"
                        />
                        <Input 
                            label={t('confirmPassword') || 'Confirm Password'} 
                            id="password" 
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            placeholder={t('enterPasswordToConfirm') || 'Enter your password to confirm'}
                        />
                        
                        <div className="p-3 rounded-md bg-yellow-500/10 text-yellow-800 dark:text-yellow-400 text-xs">
                            ⚠️ {t('oneTimeChangeOnly') || 'This is a ONE-TIME change. You will not be able to change your email again.'}
                        </div>

                        <DialogFooter className="pt-4">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={handleClose}
                                disabled={isLoading}
                            >
                                {t('cancel')}
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? t('saving') || 'Saving...' : t('changeEmail') || 'Change Email'}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default ChangeEmailModal;
