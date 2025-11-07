
import React, { useState } from 'react';
import { Entry, Note, SharedWith, SharedPermission } from '../../types';
import { useI18n } from '../../i18n';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../Dialog';
import Input from '../Input';
import Button from '../Button';
import { UserIcon } from '../../constants';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: Entry | Note;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, item }) => {
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState('share');
    const [sharedWith, setSharedWith] = useState<SharedWith[]>(item.sharedWith || []);

    const addShare = (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const email = (form.elements.namedItem('email') as HTMLInputElement).value;
        const permission = (form.elements.namedItem('permission') as HTMLSelectElement).value as SharedPermission;
        if(email && !sharedWith.find(u => u.email === email)) {
            setSharedWith([...sharedWith, { email, permission }]);
            form.reset();
        }
    };
    
    return (
        <Dialog isOpen={isOpen} onClose={onClose}>
            <DialogContent className="max-w-md" onClick={onClose}>
                <DialogHeader><DialogTitle>{t('shareItem', {itemName: item.title})}</DialogTitle></DialogHeader>
                <div className="flex border-b mb-4">
                    <button onClick={() => setActiveTab('share')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'share' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}> {t('shareWith')} </button>
                    <button onClick={() => setActiveTab('log')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'log' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}> {t('activityLog')} </button>
                </div>
                {activeTab === 'share' && (
                    <div>
                        <form className="flex flex-col sm:flex-row items-end gap-2 mb-6" onSubmit={addShare}>
                            <Input containerClassName="flex-grow w-full" label={t('emailToShare')} id="email" name="email" type="email" placeholder="teammate@example.com" />
                            <div className="w-full sm:w-auto">
                                <label htmlFor="permission" className="block text-sm font-medium text-foreground mb-2">{t('permissions')}</label>
                                <select id="permission" name="permission" className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm ring-offset-background">
                                    <option value="view">{t('canView')}</option>
                                    <option value="edit">{t('canEdit')}</option>
                                </select>
                            </div>
                            <Button type="submit" className="w-full sm:w-auto">{t('add')}</Button>
                        </form>
                        <h4 className="font-semibold mb-2 text-sm text-muted-foreground">{t('peopleWithAccess')}</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            <div className="flex items-center justify-between p-2 rounded-lg">
                                <div className="flex items-center"><UserIcon className="w-8 h-8 p-1.5 bg-secondary rounded-full mr-3" /> <span>user@vaultcloud.dev</span></div>
                                <span className="text-sm text-muted-foreground">{t('you')}</span>
                            </div>
                            {sharedWith.map(user => (
                                <div key={user.email} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                                    <div className="flex items-center"><UserIcon className="w-8 h-8 p-1.5 bg-secondary rounded-full mr-3" /> <span>{user.email}</span></div>
                                    <span className="text-sm text-muted-foreground">{user.permission === 'edit' ? t('canEdit') : t('canView')}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {activeTab === 'log' && (
                    <div className="text-center text-muted-foreground p-8">
                        <p>{t('noActivity')}</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default ShareModal;
