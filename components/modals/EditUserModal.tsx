
import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { useI18n } from '../../i18n';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../Dialog';
import Button from '../Button';

interface EditUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    onSave: (user: User) => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, user, onSave }) => {
    const { t } = useI18n();
    const [role, setRole] = useState(user.role);
    const [status, setStatus] = useState(user.status);

    useEffect(() => {
        if(user) {
            setRole(user.role);
            setStatus(user.status);
        }
    }, [user]);
    
    const handleSave = () => {
        onSave({ ...user, role, status });
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose}>
            <DialogContent onClick={onClose}>
                <DialogHeader>
                    <DialogTitle>{t('editUser')} - {user.email}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <label htmlFor="role-select" className="block text-sm font-medium text-foreground mb-2">{t('role')}</label>
                        <select id="role-select" value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'user')} className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm ring-offset-background">
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="status-select" className="block text-sm font-medium text-foreground mb-2">{t('status')}</label>
                        <select id="status-select" value={status} onChange={(e) => setStatus(e.target.value as 'active' | 'suspended')} className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm ring-offset-background">
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </div>
                </div>
                <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>{t('cancel')}</Button>
                    <Button type="button" onClick={handleSave}>{t('saveChanges')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default EditUserModal;
