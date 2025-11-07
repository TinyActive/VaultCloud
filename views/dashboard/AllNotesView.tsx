
import React, { useState } from 'react';
import { Note } from '../../types';
import { useI18n } from '../../i18n';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/Card';
import Button from '../../components/Button';
import { CopyIcon, CheckIcon } from '../../constants';

interface AllNotesViewProps {
    notes: Note[];
    searchQuery?: string;
    onEditNote: (note: Note) => void;
    onShareNote?: (note: Note) => void;
    onDeleteNote: (note: Note) => void;
    onCopyContent?: (note: Note) => Promise<void>;
    onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const AllNotesView: React.FC<AllNotesViewProps> = ({ notes, searchQuery = '', onEditNote, onShareNote, onDeleteNote, onCopyContent, onShowToast }) => {
    const { t } = useI18n();
    const [copied, setCopied] = useState<string | null>(null);
    const [copying, setCopying] = useState<string | null>(null);

    const handleCopy = (textToCopy: string, identifier: string) => {
        navigator.clipboard.writeText(textToCopy);
        setCopied(identifier);
        setTimeout(() => setCopied(null), 2000);
        if (onShowToast) {
            onShowToast('Copied to clipboard!');
        }
    };
    
    const handleCopyContent = async (note: Note) => {
        if (note.content.includes('-----BEGIN PGP MESSAGE-----')) {
            // Content is encrypted, need to decrypt first
            if (onCopyContent) {
                setCopying(`${note.id}-content`);
                try {
                    await onCopyContent(note);
                    setCopying(null);
                } catch (error) {
                    setCopying(null);
                }
            } else {
                alert('Content is encrypted. Click "View/Edit" and enter your master password to decrypt.');
            }
        } else {
            // Content is not encrypted, copy directly
            handleCopy(note.content, `${note.id}-content`);
        }
    };
    
    // Filter notes based on search query
    const filteredNotes = notes.filter(note => 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
    return (
        <div className="space-y-8">
            <h2 className="text-4xl font-bold tracking-tight">{t('allNotes')}</h2>
            
            {/* Desktop Table View */}
            <Card className="hidden md:block shadow-md border-2 overflow-hidden">
                 <table className="w-full text-sm">
                    <thead className="text-left text-muted-foreground">
                        <tr className="border-b">
                            <th className="p-4 font-medium">{t('title')}</th>
                            <th className="p-4 font-medium">{t('content')}</th>
                            <th className="p-4 font-medium">{t('tags')}</th>
                            <th className="p-4 font-medium text-right">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredNotes.map(note => (
                             <tr key={note.id} className="border-b last:border-0 hover:bg-muted/50">
                                <td className="p-4 font-semibold">{note.title}</td>
                                <td className="p-4 text-muted-foreground max-w-xs">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="truncate">
                                            {note.content.includes('-----BEGIN PGP MESSAGE-----') ? '*****' : note.content.split('\n')[0]}
                                        </span>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 shrink-0"
                                            disabled={copying === `${note.id}-content`}
                                            onClick={() => handleCopyContent(note)}
                                        >
                                            {copying === `${note.id}-content` ? (
                                                <span className="animate-spin">⏳</span>
                                            ) : copied === `${note.id}-content` ? (
                                                <CheckIcon className="w-4 h-4 text-green-500" />
                                            ) : (
                                                <CopyIcon className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </div>
                                </td>
                                <td className="p-4">
                                  <div className="flex flex-wrap gap-1">
                                      {note.tags.map(tag => <span key={tag} className="text-xs bg-primary/10 text-accent-foreground px-2 py-0.5 rounded-full">{tag}</span>)}
                                  </div>
                                </td>
                                <td className="p-4 flex justify-end gap-2">
                                    <Button size="sm" variant="outline" onClick={() => onEditNote(note)}>{t('viewEdit')}</Button>
                                    <Button size="sm" variant="destructive" onClick={() => onDeleteNote(note)}>{t('delete')}</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>

             <div className="grid md:hidden grid-cols-1 gap-4">
                {filteredNotes.map(note => (
                    <Card key={note.id}>
                        <CardHeader>
                            <CardTitle>{note.title}</CardTitle>
                            <CardDescription className="flex items-center justify-between gap-2">
                                <span className="truncate">
                                    {note.content.includes('-----BEGIN PGP MESSAGE-----') ? '*****' : note.content.split('\n')[0]}
                                </span>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 shrink-0"
                                    disabled={copying === `${note.id}-content`}
                                    onClick={() => handleCopyContent(note)}
                                >
                                    {copying === `${note.id}-content` ? (
                                        <span className="animate-spin">⏳</span>
                                    ) : copied === `${note.id}-content` ? (
                                        <CheckIcon className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <CopyIcon className="w-4 h-4" />
                                    )}
                                </Button>
                            </CardDescription>
                        </CardHeader>
                        <div className="p-4 flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => onEditNote(note)} className="flex-1">{t('viewEdit')}</Button>
                            <Button size="sm" variant="destructive" onClick={() => onDeleteNote(note)} className="flex-1">{t('delete')}</Button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    )
};

export default AllNotesView;
