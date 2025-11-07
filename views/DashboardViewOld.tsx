import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { MOCK_ENTRIES, MOCK_NOTES, MOCK_FIDO_KEYS } from '../constants';
import { Entry, Note, FidoKey, User, UserView, PgpKey } from '../types';
import OverviewView from './dashboard/OverviewView';
import AllEntriesView from './dashboard/AllEntriesView';
import AllNotesView from './dashboard/AllNotesView';
import SettingsView from './dashboard/SettingsView';
import EntryEditModal from '../components/modals/EntryEditModal';
import NoteEditModal from '../components/modals/NoteEditModal';
import ShareModal from '../components/modals/ShareModal';
import ChangePasswordModal from '../components/modals/ChangePasswordModal';
import Setup2FAModal from '../components/modals/Setup2FAModal';
import ImportDataModal from '../components/modals/ImportDataModal';
import RegisterFidoKeyModal from '../components/modals/RegisterFidoKeyModal';
import PgpSettingsModal from '../components/modals/PgpSettingsModal';
import DecryptVaultModal from '../components/modals/DecryptVaultModal';
import { pgpService, PGPKeySet } from '../services/pgpService';

interface DashboardViewProps {
    currentUser: User;
    onLogout: () => void;
    onToggleAdminMode: () => void;
    activeView: UserView;
    onNavigate: (view: UserView) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ currentUser, onLogout, onToggleAdminMode, activeView, onNavigate }) => {
    const [entries, setEntries] = useState<Entry[]>(MOCK_ENTRIES);
    const [notes] = useState<Note[]>(MOCK_NOTES);
    const [fidoKeys, setFidoKeys] = useState<FidoKey[]>(MOCK_FIDO_KEYS);
    const [pgpKey, setPgpKey] = useState<PGPKeySet | null>(null);
    // FIX: Changed type from openpgp.PrivateKey to any to align with the global declaration.
    const [decryptedPrivateKey, setDecryptedPrivateKey] = useState<any | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    const [isEntryModalOpen, setEntryModalOpen] = useState(false);
    const [isNoteModalOpen, setNoteModalOpen] = useState(false);
    const [isShareModalOpen, setShareModalOpen] = useState(false);
    
    // State for Settings page modals
    const [isChangePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
    const [isSetup2FAModalOpen, setSetup2FAModalOpen] = useState(false);
    const [isImportModalOpen, setImportModalOpen] = useState(false);
    const [isRegisterFidoKeyModalOpen, setRegisterFidoKeyModalOpen] = useState(false);
    const [isPgpModalOpen, setPgpModalOpen] = useState(false);
    const [isDecryptModalOpen, setDecryptModalOpen] = useState(false);
    
    const [is2FAEnabled, set2FAEnabled] = useState(false);
    const [isPasswordLoginEnabled, setPasswordLoginEnabled] = useState(true);

    const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [entryToProcess, setEntryToProcess] = useState<Entry | null>(null);

    useEffect(() => {
        const loadKey = async () => {
            const key = await pgpService.loadKeys();
            setPgpKey(key);
        };
        loadKey();
    }, []);

    const itemToShare = useMemo(() => selectedEntry || selectedNote, [selectedEntry, selectedNote]);

    const handleAddNew = async () => {
        if (activeView === 'notes') {
            setSelectedNote(null);
            setNoteModalOpen(true);
        } else {
            if (pgpKey && !decryptedPrivateKey) {
                setEntryToProcess(null); // Indicates a new entry
                setDecryptModalOpen(true);
            } else {
                handleEditEntry(null);
            }
        }
    };

    const handleEditEntry = async (entry: Entry | null) => {
        setEntryToProcess(entry);
        if (pgpKey && !decryptedPrivateKey) {
            setDecryptModalOpen(true);
        } else {
            let entryWithDecryptedPassword = entry;
            if (entry && decryptedPrivateKey) {
                try {
                    const decryptedPassword = await pgpService.decrypt(entry.password_encrypted, decryptedPrivateKey);
                    entryWithDecryptedPassword = { ...entry, password_encrypted: decryptedPassword };
                } catch (error) {
                    console.error("Decryption failed:", error);
                    alert("Failed to decrypt password. Is the correct PGP key unlocked?");
                    return;
                }
            }
            setSelectedEntry(entryWithDecryptedPassword);
            setEntryModalOpen(true);
        }
    };

    const handleUnlockSession = async (masterPassword: string) => {
        try {
            const privateKeyObj = await pgpService.loadAndDecryptPrivateKey(masterPassword);
            setDecryptedPrivateKey(privateKeyObj);
            setDecryptModalOpen(false);
            if (entryToProcess) {
                handleEditEntry(entryToProcess);
            } else { // This is for 'Add New'
                setSelectedEntry(null);
                setEntryModalOpen(true);
            }
            setEntryToProcess(null);
        } catch (error) {
            console.error("Failed to unlock PGP key:", error);
            alert("Incorrect master password or corrupted key.");
        }
    };
    
    const handleSaveEntry = async (entryToSave: Entry) => {
        let entryToStore = { ...entryToSave };
        if (pgpKey?.publicKey) {
             const publicKeyObj = await openpgp.readKey({ armoredKey: pgpKey.publicKey });
             const encryptedPassword = await pgpService.encrypt(entryToSave.password_encrypted, publicKeyObj);
             entryToStore.password_encrypted = encryptedPassword;
        }
        
        if (selectedEntry) { // Existing entry
            setEntries(entries.map(e => e.id === entryToStore.id ? entryToStore : e));
        } else { // New entry
             entryToStore.id = Date.now().toString();
             setEntries([entryToStore, ...entries]);
        }

        closeAllModals();
    };


    const handleEditNote = (note: Note) => {
        setSelectedNote(note);
        setNoteModalOpen(true);
    };

    const openShareModal = (item: Entry | Note) => {
        if ('password_encrypted' in item) {
            setSelectedEntry(item);
        } else {
            setSelectedNote(item);
        }
        setShareModalOpen(true);
    };
    
    const handleDelete = (item: Entry | Note) => {
        alert(`Item "${item.title}" would be deleted.`);
        closeAllModals();
    };
    
    const handleRemoveFidoKey = (keyId: string) => {
        setFidoKeys(prevKeys => prevKeys.filter(key => key.id !== keyId));
    };
    
    const handleAddFidoKey = (keyName: string) => {
        const newKey: FidoKey = {
            id: `fk${Date.now()}`,
            name: keyName,
            addedOn: new Date().toISOString().split('T')[0],
        };
        setFidoKeys(prevKeys => [...prevKeys, newKey]);
        setRegisterFidoKeyModalOpen(false);
    };

    const handleSavePgpKey = async (keys: PGPKeySet, masterPassword: string) => {
        await pgpService.storeKeys(keys, masterPassword);
        setPgpKey(keys);
        setDecryptedPrivateKey(null); // Force re-unlock with new key
        setPgpModalOpen(false);
    };

    const handleRemovePgpKey = async () => {
        await pgpService.removeKeys();
        setPgpKey(null);
        setDecryptedPrivateKey(null);
    };

    const closeAllModals = () => {
        setEntryModalOpen(false);
        setNoteModalOpen(false);
        setShareModalOpen(false);
        setSelectedEntry(null);
        setSelectedNote(null);
        setEntryToProcess(null);
    };

    const handleToggle2FA = () => {
        if (is2FAEnabled) {
            set2FAEnabled(false);
        } else {
            setSetup2FAModalOpen(true);
        }
    };

    const handle2FASetupSuccess = () => {
        set2FAEnabled(true);
        setSetup2FAModalOpen(false);
    };

    const handleExportVault = () => {
        const vaultData = { entries, notes };
        const blob = new Blob([JSON.stringify(vaultData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'vault_export.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const filteredEntries = useMemo(() => {
        return entries.filter(entry =>
            entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            entry.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            entry.url.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [entries, searchQuery]);
    
    const filteredNotes = useMemo(() => {
        return notes.filter(note =>
            note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.content.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [notes, searchQuery]);

    const renderActiveView = () => {
        switch (activeView) {
            case 'settings':
                return <SettingsView 
                    is2FAEnabled={is2FAEnabled}
                    fidoKeys={fidoKeys}
                    isPasswordLoginEnabled={isPasswordLoginEnabled}
                    pgpKey={pgpKey}
                    onToggle2FA={handleToggle2FA}
                    onChangePassword={() => setChangePasswordModalOpen(true)}
                    onExport={handleExportVault}
                    onImport={() => setImportModalOpen(true)}
                    onAddFidoKey={() => setRegisterFidoKeyModalOpen(true)}
                    onRemoveFidoKey={handleRemoveFidoKey}
                    onTogglePasswordLogin={setPasswordLoginEnabled}
                    onManagePgpKey={() => setPgpModalOpen(true)}
                    onRemovePgpKey={handleRemovePgpKey}
                />;
            case 'all-entries':
                return <AllEntriesView entries={filteredEntries} onEdit={handleEditEntry} onDelete={handleDelete} />;
            case 'notes':
                return <AllNotesView notes={filteredNotes} onEdit={handleEditNote} onDelete={handleDelete} />;
            case 'overview':
            default:
                return <OverviewView entries={entries} onEdit={handleEditEntry} onDelete={handleDelete} />;
        }
    };

    return (
        <div className="flex h-screen bg-background">
            <Sidebar 
                userActiveView={activeView}
                adminActiveView=""
                onUserNavigate={onNavigate}
                onAdminNavigate={() => {}}
                onLogout={onLogout} 
                currentUser={currentUser}
                isAdminMode={false}
                onToggleAdminMode={onToggleAdminMode}
            />
            <main className="flex-1 flex flex-col overflow-hidden">
                <Navbar onSearch={setSearchQuery} onAddNew={handleAddNew} />
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    {renderActiveView()}
                </div>
            </main>
            <EntryEditModal isOpen={isEntryModalOpen} onClose={closeAllModals} entry={selectedEntry} onSave={handleSaveEntry} onShare={openShareModal} />
            <NoteEditModal isOpen={isNoteModalOpen} onClose={closeAllModals} note={selectedNote} onDelete={handleDelete} onShare={openShareModal} />
            {itemToShare && <ShareModal isOpen={isShareModalOpen} onClose={closeAllModals} item={itemToShare} />}
            
            <ChangePasswordModal isOpen={isChangePasswordModalOpen} onClose={() => setChangePasswordModalOpen(false)} />
            <Setup2FAModal isOpen={isSetup2FAModalOpen} onClose={() => setSetup2FAModalOpen(false)} onEnable={handle2FASetupSuccess} />
            <ImportDataModal isOpen={isImportModalOpen} onClose={() => setImportModalOpen(false)} />
            <RegisterFidoKeyModal isOpen={isRegisterFidoKeyModalOpen} onClose={() => setRegisterFidoKeyModalOpen(false)} onRegister={handleAddFidoKey} />
            <PgpSettingsModal isOpen={isPgpModalOpen} onClose={() => setPgpModalOpen(false)} onSave={handleSavePgpKey} currentKey={pgpKey} />
            <DecryptVaultModal isOpen={isDecryptModalOpen} onClose={() => setDecryptModalOpen(false)} onUnlock={handleUnlockSession} />
        </div>
    );
};

export default DashboardView;