
import React, { useState, useEffect } from 'react';
import { Note } from '../../types';
import { useI18n } from '../../i18n';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../Dialog';
import Input from '../Input';
import Button from '../Button';
import { ShareIcon } from '../../constants';

interface NoteEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    note: Note | null;
    onSave: (note: Note) => void;
}

const NoteEditModal: React.FC<NoteEditModalProps> = ({ isOpen, onClose, note, onSave }) => {
    const { t } = useI18n();
    
    // Internal state to manage form fields
    const [formData, setFormData] = useState<Omit<Note, 'id'>>({
        title: '',
        content: '',
        tags: [],
        folder: '',
    });

    useEffect(() => {
        if (note) {
            setFormData({
                title: note.title,
                content: note.content,
                tags: note.tags,
                folder: note.folder || '',
            });
        } else {
            setFormData({
                title: '',
                content: '',
                tags: [],
                folder: '',
            });
        }
    }, [note]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        const fieldName = id.replace('note-', '');
        setFormData(prev => ({ 
            ...prev, 
            [fieldName]: fieldName === 'tags' ? value.split(',').map(t => t.trim()).filter(Boolean) : value 
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const noteToSave: Note = {
            id: note?.id || '',
            ...formData,
        };
        onSave(noteToSave);
    };
    
    const isNewNote = note === null;
    const title = isNewNote ? t('addNewNote') : t('editNote');

    return (
        <Dialog isOpen={isOpen} onClose={onClose}>
            <DialogContent onClick={onClose}>
                <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <Input 
                        label={t('title')} 
                        id="note-title" 
                        value={formData.title}
                        onChange={handleChange}
                        required
                    />
                    <div>
                        <label htmlFor="note-content" className="block text-sm font-medium text-foreground mb-2">
                            {t('content')}
                        </label>
                        <textarea 
                            id="note-content" 
                            rows={8} 
                            value={formData.content}
                            onChange={handleChange}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            required
                        />
                    </div>
                    <Input 
                        label={t('tagsField')} 
                        id="note-tags" 
                        value={formData.tags.join(', ')}
                        onChange={handleChange}
                        placeholder="tag1, tag2, tag3"
                    />
                    <Input 
                        label={t('folder')} 
                        id="note-folder" 
                        value={formData.folder}
                        onChange={handleChange}
                        placeholder="Work, Personal, etc."
                    />
                    <DialogFooter className="pt-4 !flex-row !justify-end">
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={onClose}>{t('cancel')}</Button>
                            <Button type="submit">{isNewNote ? t('saveEntry') : t('saveChanges')}</Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default NoteEditModal;
