
import React from 'react';
import { useI18n } from '../../i18n';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../Dialog';
import Input from '../Input';
import Button from '../Button';

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
    const { t } = useI18n();
    return (
        <Dialog isOpen={isOpen} onClose={onClose}>
            <DialogContent onClick={onClose}>
                <DialogHeader><DialogTitle>{t('changePassword')}</DialogTitle></DialogHeader>
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onClose(); }}>
                    <Input label={t('currentPassword')} id="current-password" type="password" />
                    <Input label={t('newPassword')} id="new-password" type="password" />
                    <Input label={t('confirmNewPassword')} id="confirm-new-password" type="password" />
                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>{t('cancel')}</Button>
                        <Button type="submit">{t('saveChanges')}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ChangePasswordModal;
