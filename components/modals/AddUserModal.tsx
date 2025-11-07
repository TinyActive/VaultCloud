
import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { useI18n } from '../../i18n';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../Dialog';
import Button from '../Button';
import Input from '../Input';

interface AddUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (user: Omit<User, 'id'|'lastLogin'>) => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onAdd }) => {
    const { t } = useI18n();
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'admin' | 'user'>('user');
    const [status, setStatus] = useState<'active' | 'suspended'>('active');
    
    useEffect(() => {
        if(isOpen) {
            setEmail('');
            setRole('user');
            setStatus('active');
        }
    }, [isOpen]);

    const handleSubmit = () => {
        if (email.trim()) {
            onAdd({ email, role, status });
        }
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose}>
            <DialogContent onClick={onClose}>
                <DialogHeader>
                    <DialogTitle>{t('addNewUser')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <label htmlFor="add-email" className="block text-sm font-medium text-foreground mb-2">{t('emailAddress')}</label>
                        <Input 
                            id="add-email" 
                            type="email" 
                            placeholder="user@example.com" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="add-role-select" className="block text-sm font-medium text-foreground mb-2">{t('role')}</label>
                        <select id="add-role-select" value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'user')} className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm ring-offset-background">
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="add-status-select" className="block text-sm font-medium text-foreground mb-2">{t('status')}</label>
                        <select id="add-status-select" value={status} onChange={(e) => setStatus(e.target.value as 'active' | 'suspended')} className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm ring-offset-background">
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </div>
                </div>
                <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>{t('cancel')}</Button>
                    <Button type="button" onClick={handleSubmit} disabled={!email.trim()}>{t('addUser')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AddUserModal;
