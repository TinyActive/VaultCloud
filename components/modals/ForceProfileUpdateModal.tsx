import React, { useState } from 'react';
import { useI18n } from '../../i18n';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../Dialog';
import Input from '../Input';
import Button from '../Button';
import apiService from '../../services/apiService';

interface ForceProfileUpdateModalProps {
    isOpen: boolean;
    currentEmail: string;
    onSuccess: () => void;
}

const ForceProfileUpdateModal: React.FC<ForceProfileUpdateModalProps> = ({ 
    isOpen, 
    currentEmail,
    onSuccess 
}) => {
    const { t } = useI18n();
    const [step, setStep] = useState<'info' | 'email' | 'password'>('info');
    const [newEmail, setNewEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [emailChanged, setEmailChanged] = useState(false);
    const [passwordChanged, setPasswordChanged] = useState(false);

    const handleEmailChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!newEmail || !currentPassword) {
            setError(t('allFieldsRequired') || 'All fields are required');
            return;
        }

        if (!newEmail.includes('@')) {
            setError(t('invalidEmailFormat') || 'Invalid email format');
            return;
        }

        setIsLoading(true);

        try {
            await apiService.changeEmail(newEmail, currentPassword);
            setEmailChanged(true);
            setCurrentPassword(''); // Clear for next step
            setStep('password');
            setError('');
        } catch (err: any) {
            setError(err.message || t('changeEmailError') || 'Failed to change email');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!currentPassword || !newPassword || !confirmPassword) {
            setError(t('allFieldsRequired') || 'All fields are required');
            return;
        }

        if (newPassword.length < 8) {
            setError(t('passwordMinLength') || 'Password must be at least 8 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError(t('passwordsDoNotMatch') || 'Passwords do not match');
            return;
        }

        setIsLoading(true);

        try {
            await apiService.changePassword(currentPassword, newPassword);
            setPasswordChanged(true);
            // Give user feedback then close
            setTimeout(() => {
                onSuccess();
            }, 1500);
        } catch (err: any) {
            setError(err.message || t('changePasswordError') || 'Failed to change password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog isOpen={isOpen} onClose={() => {}} disableEscapeKeyDown disableBackdropClick>
            <DialogContent onClick={() => {}}>
                <DialogHeader>
                    <DialogTitle>
                        {step === 'info' && (t('welcomeFirstLogin') || '🎉 Welcome! First Time Setup')}
                        {step === 'email' && (t('changeEmailRequired') || '📧 Change Your Email')}
                        {step === 'password' && (t('changePasswordRequired') || '🔒 Change Your Password')}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 'info' && (
                            <span>
                                {t('firstLoginDesc') || 'For security reasons, you must change your email and password on first login.'}
                            </span>
                        )}
                        {step === 'email' && (
                            <span className="text-yellow-600 dark:text-yellow-400">
                                ⚠️ {t('emailChangeWarning') || 'You can only change your email once. Choose carefully.'}
                            </span>
                        )}
                        {step === 'password' && (
                            <span>
                                {emailChanged && '✓ Email changed successfully! Now set a new password.'}
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                {step === 'info' && (
                    <div className="space-y-4">
                        <div className="p-4 rounded-md bg-yellow-500/10 border border-yellow-500/20">
                            <h4 className="font-semibold mb-2">{t('securityNotice') || '🔐 Security Notice'}</h4>
                            <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                                <li>{t('mustChangeEmail') || 'You must change your default email address'}</li>
                                <li>{t('emailCanChangeOnce') || 'Email can only be changed ONCE'}</li>
                                <li>{t('mustChangePassword') || 'You must set a new secure password'}</li>
                                <li>{t('passwordRequirement') || 'Password must be at least 8 characters'}</li>
                            </ul>
                        </div>
                        <div className="p-3 rounded-md bg-muted text-sm">
                            <strong>{t('currentEmail') || 'Current Email'}:</strong> {currentEmail}
                        </div>
                        <Button onClick={() => setStep('email')} className="w-full">
                            {t('continue') || 'Continue'} →
                        </Button>
                    </div>
                )}

                {step === 'email' && !emailChanged && (
                    <form onSubmit={handleEmailChange} className="space-y-4">
                        {error && (
                            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                                {error}
                            </div>
                        )}
                        <div className="p-3 rounded-md bg-muted text-sm">
                            <strong>{t('currentEmail') || 'Current Email'}:</strong> {currentEmail}
                        </div>
                        <Input 
                            label={t('newEmail') || 'New Email Address'} 
                            id="new-email" 
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            disabled={isLoading}
                            placeholder="your.email@example.com"
                            required
                        />
                        <Input 
                            label={t('currentPassword') || 'Current Password'} 
                            id="current-password" 
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            disabled={isLoading}
                            required
                        />
                        <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading ? t('saving') || 'Changing...' : t('changeEmail') || 'Change Email'} →
                        </Button>
                    </form>
                )}

                {step === 'password' && !passwordChanged && (
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        {error && (
                            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                                {error}
                            </div>
                        )}
                        {emailChanged && (
                            <div className="p-3 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 text-sm">
                                ✓ {t('emailChangedSuccess') || 'Email changed successfully!'}
                            </div>
                        )}
                        <Input 
                            label={t('currentPassword') || 'Current Password'} 
                            id="current-password-2" 
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            disabled={isLoading}
                            required
                        />
                        <Input 
                            label={t('newPassword') || 'New Password'} 
                            id="new-password" 
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={isLoading}
                            required
                        />
                        <Input 
                            label={t('confirmNewPassword') || 'Confirm New Password'} 
                            id="confirm-password" 
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={isLoading}
                            required
                        />
                        <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading ? t('saving') || 'Changing...' : t('changePassword') || 'Change Password & Complete'} ✓
                        </Button>
                    </form>
                )}

                {passwordChanged && (
                    <div className="space-y-4 text-center">
                        <div className="p-6 rounded-full bg-green-500/10 w-16 h-16 mx-auto flex items-center justify-center">
                            <span className="text-3xl">✓</span>
                        </div>
                        <p className="text-lg font-semibold">{t('setupComplete') || 'Setup Complete!'}</p>
                        <p className="text-sm text-muted-foreground">
                            {t('redirecting') || 'Redirecting to your dashboard...'}
                        </p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default ForceProfileUpdateModal;
