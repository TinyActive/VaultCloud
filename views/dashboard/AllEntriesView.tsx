
import React, { useState } from 'react';
import { Entry } from '../../types';
import { useI18n } from '../../i18n';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '../../components/Card';
import Button from '../../components/Button';
import { CopyIcon, CheckIcon } from '../../constants';

interface AllEntriesViewProps {
    entries: Entry[];
    searchQuery?: string;
    onEditEntry: (entry: Entry) => void;
    onShareEntry?: (entry: Entry) => void;
    onDeleteEntry: (entry: Entry) => void;
    onCopyPassword?: (entry: Entry) => Promise<void>;
    onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const AllEntriesView: React.FC<AllEntriesViewProps> = ({ entries, searchQuery = '', onEditEntry, onShareEntry, onDeleteEntry, onCopyPassword, onShowToast }) => {
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
    
    const handleCopyPassword = async (entry: Entry) => {
        if (entry.password_encrypted.includes('-----BEGIN PGP MESSAGE-----')) {
            // Password is encrypted, need to decrypt first
            if (onCopyPassword) {
                setCopying(`${entry.id}-password`);
                try {
                    await onCopyPassword(entry);
                    setCopying(null);
                } catch (error) {
                    setCopying(null);
                }
            } else {
                alert('Password is encrypted. Click "View/Edit" and enter your master password to decrypt.');
            }
        } else {
            // Password is not encrypted, copy directly
            handleCopy(entry.password_encrypted, `${entry.id}-password`);
        }
    };

    // Filter entries based on search query
    const filteredEntries = entries.filter(entry => 
        entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="space-y-8">
            <h2 className="text-4xl font-bold tracking-tight">{t('allEntries')}</h2>
            
            {/* Desktop Table View */}
            <Card className="hidden md:block shadow-md border-2 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-left text-muted-foreground">
                            <tr className="border-b">
                                <th className="p-4 font-medium">{t('title')}</th>
                                <th className="p-4 font-medium">{t('username')}</th>
                                <th className="p-4 font-medium">{t('password')}</th>
                                <th className="p-4 font-medium">{t('url')}</th>
                                <th className="p-4 font-medium">{t('tags')}</th>
                                <th className="p-4 font-medium text-right">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEntries.map(entry => (
                                <tr key={entry.id} className="border-b last:border-0 hover:bg-muted/50">
                                    <td className="p-4 font-semibold">{entry.title}</td>
                                    <td className="p-4 text-muted-foreground max-w-[200px]">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="truncate">{entry.username}</span>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleCopy(entry.username, `${entry.id}-username`)}>
                                                {copied === `${entry.id}-username` ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                    </td>
                                    <td className="p-4 text-muted-foreground">
                                        <div className="flex items-center justify-between gap-2">
                                            <span>••••••••••</span>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 shrink-0"
                                                disabled={copying === `${entry.id}-password`}
                                                onClick={() => handleCopyPassword(entry)}
                                            >
                                                {copying === `${entry.id}-password` ? (
                                                    <span className="animate-spin">⏳</span>
                                                ) : copied === `${entry.id}-password` ? (
                                                    <CheckIcon className="w-4 h-4 text-green-500" />
                                                ) : (
                                                    <CopyIcon className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </td>
                                    <td className="p-4 text-muted-foreground max-w-[200px]">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="truncate">{entry.url}</span>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleCopy(entry.url, `${entry.id}-url`)}>
                                                {copied === `${entry.id}-url` ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-wrap gap-1">
                                            {entry.tags.map(tag => <span key={tag} className="text-xs bg-primary/10 text-accent-foreground px-2 py-0.5 rounded-full">{tag}</span>)}
                                        </div>
                                    </td>
                                    <td className="p-4 flex justify-end gap-2 items-center">
                                        <Button size="sm" variant="outline" onClick={() => onEditEntry(entry)}>{t('viewEdit')}</Button>
                                        <Button size="sm" variant="destructive" onClick={() => onDeleteEntry(entry)}>{t('delete')}</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <div className="grid md:hidden grid-cols-1 gap-4">
                {filteredEntries.map(entry => (
                    <Card key={entry.id}>
                        <CardHeader>
                            <CardTitle>{entry.title}</CardTitle>
                            <CardDescription>{entry.username}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-1">
                                {entry.tags.map(tag => <span key={tag} className="text-xs bg-primary/10 text-accent-foreground px-2 py-0.5 rounded-full">{tag}</span>)}
                            </div>
                        </CardContent>
                        <CardFooter className="gap-2">
                            <Button size="sm" variant="outline" onClick={() => onEditEntry(entry)} className="flex-1">{t('viewEdit')}</Button>
                            <Button size="sm" variant="destructive" onClick={() => onDeleteEntry(entry)} className="flex-1">{t('delete')}</Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default AllEntriesView;
