
import React, { useState } from 'react';
import { useI18n } from '../../i18n';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../Dialog';
import Input from '../Input';
import Button from '../Button';
import apiService from '../../services/apiService';

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { t } = useI18n();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validation
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
            const response = await apiService.changePassword(currentPassword, newPassword);
            setSuccess(response.message);
            
            // Clear form
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

            // Close after 2 seconds
            setTimeout(() => {
                if (onSuccess) onSuccess();
                onClose();
            }, 2000);
        } catch (err: any) {
            setError(err.message || t('changePasswordError') || 'Failed to change password');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setSuccess('');
        onClose();
    };

    return (
        <Dialog isOpen={isOpen} onClose={handleClose}>
            <DialogContent onClick={handleClose}>
                <DialogHeader><DialogTitle>{t('changePassword')}</DialogTitle></DialogHeader>
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
                    <Input 
                        label={t('currentPassword')} 
                        id="current-password" 
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        disabled={isLoading}
                    />
                    <Input 
                        label={t('newPassword')} 
                        id="new-password" 
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={isLoading}
                    />
                    <Input 
                        label={t('confirmNewPassword')} 
                        id="confirm-new-password" 
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isLoading}
                    />
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
                            {isLoading ? t('saving') || 'Saving...' : t('saveChanges')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ChangePasswordModal;
