import React, { useState, useEffect } from 'react';
import { Entry } from '../../types';
import { useI18n } from '../../i18n';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../Dialog';
import Input from '../Input';
import Button from '../Button';
import { EyeIcon, EyeOffIcon, CopyIcon, ShareIcon } from '../../constants';

interface EntryEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    entry: Entry | null;
    onSave: (entry: Entry) => void;
    onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const EntryEditModal: React.FC<EntryEditModalProps> = ({ isOpen, onClose, entry, onSave, onShowToast }) => {
    const [passwordVisible, setPasswordVisible] = useState(false);
    const { t } = useI18n();
    
    // Internal state to manage form fields
    const [formData, setFormData] = useState<Omit<Entry, 'id' | 'sharedWith'>>({
        title: '',
        url: '',
        username: '',
        password_encrypted: '',
        notes: '',
        tags: [],
        folder: '',
    });

    useEffect(() => {
        if (entry) {
            setFormData({
                title: entry.title,
                url: entry.url,
                username: entry.username,
                password_encrypted: entry.password_encrypted,
                notes: entry.notes,
                tags: entry.tags,
                folder: entry.folder,
            });
        } else {
             setFormData({
                title: '',
                url: '',
                username: '',
                password_encrypted: '',
                notes: '',
                tags: [],
                folder: '',
            });
        }
    }, [entry]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: id === 'tags' ? value.split(',').map(t => t.trim()) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const entryToSave: Entry = {
            id: entry?.id || '',
            ...formData,
        };
        onSave(entryToSave);
    };
    
    const isNewEntry = entry === null;
    const title = isNewEntry ? t('addNewEntry') : t('editEntry');
    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        if (onShowToast) {
            onShowToast('Copied to clipboard!');
        }
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose}>
            <DialogContent onClick={onClose}>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <Input label={t('title')} id="title" value={formData.title} onChange={handleChange} />
                    <Input label={t('url')} id="url" value={formData.url} onChange={handleChange} />
                    <div className="relative">
                        <Input label={t('username')} id="username" value={formData.username} onChange={handleChange} />
                        <Button type="button" variant="ghost" size="icon" className="absolute right-0 bottom-0 h-10 w-10 text-muted-foreground" onClick={() => handleCopy(formData.username)} aria-label="Copy username"><CopyIcon className="w-4 h-4" /></Button>
                    </div>
                     <div>
                        <label htmlFor="password_encrypted" className="block text-sm font-medium text-foreground mb-2">{t('password')}</label>
                        <div className="relative flex items-center">
                            <Input id="password_encrypted" type={passwordVisible ? 'text' : 'password'} value={formData.password_encrypted} onChange={handleChange} className="pr-20" />
                            <div className="absolute right-0 bottom-0 flex items-center">
                                <Button type="button" variant="ghost" size="icon" onClick={() => setPasswordVisible(!passwordVisible)} className="h-10 w-10 text-muted-foreground" aria-label={passwordVisible ? "Hide password" : "Show password"}>
                                    {passwordVisible ? <EyeOffIcon className="w-4 h-4"/> : <EyeIcon className="w-4 h-4"/>}
                                </Button>
                                <Button type="button" variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground" onClick={() => handleCopy(formData.password_encrypted)} aria-label="Copy password"><CopyIcon className="w-4 h-4" /></Button>
                            </div>
                        </div>
                     </div>
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-foreground mb-2">{t('notesField')}</label>
                        <textarea id="notes" rows={3} value={formData.notes} onChange={handleChange} className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"></textarea>
                    </div>
                     <Input label={t('tagsField')} id="tags" value={Array.isArray(formData.tags) ? formData.tags.join(', ') : ''} onChange={handleChange} />
                    <DialogFooter className="pt-4 !flex-row !justify-end">
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={onClose}>{t('cancel')}</Button>
                            <Button type="submit">{isNewEntry ? t('saveEntry') : t('saveChanges')}</Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default EntryEditModal;