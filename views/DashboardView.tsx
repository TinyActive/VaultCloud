import React, { useState, useMemo, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import Toast from '../components/Toast';
import { Entry, Note, FidoKey, User } from '../types';
import OverviewView from './dashboard/OverviewView';
import AllEntriesView from './dashboard/AllEntriesView';
import AllNotesView from './dashboard/AllNotesView';
import SettingsView from './dashboard/SettingsView';
import EntryEditModal from '../components/modals/EntryEditModal';
import NoteEditModal from '../components/modals/NoteEditModal';
import ShareModal from '../components/modals/ShareModal';
import ChangePasswordModal from '../components/modals/ChangePasswordModal';
import ChangeEmailModal from '../components/modals/ChangeEmailModal';
import ForceProfileUpdateModal from '../components/modals/ForceProfileUpdateModal';
import Setup2FAModal from '../components/modals/Setup2FAModal';
import ImportDataModal from '../components/modals/ImportDataModal';
import RegisterFidoKeyModal from '../components/modals/RegisterFidoKeyModal';
import PgpSettingsModal from '../components/modals/PgpSettingsModal';
import DecryptVaultModal from '../components/modals/DecryptVaultModal';
import { pgpService, PGPKeySet } from '../services/pgpService';
import apiService from '../services/apiService';
import fidoService from '../services/fidoService';
import { useAuth } from '../App';

interface DashboardViewProps {
    currentUser: User;
}

const DashboardView: React.FC<DashboardViewProps> = ({ currentUser }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, setCurrentUser } = useAuth();
    
    const [entries, setEntries] = useState<Entry[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [fidoKeys, setFidoKeys] = useState<FidoKey[]>([]);
    const [pgpKey, setPgpKey] = useState<PGPKeySet | null>(null);
    const [decryptedPrivateKey, setDecryptedPrivateKey] = useState<any | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    
    const [isEntryModalOpen, setEntryModalOpen] = useState(false);
    const [isNoteModalOpen, setNoteModalOpen] = useState(false);
    const [isShareModalOpen, setShareModalOpen] = useState(false);
    
    // State for Settings page modals
    const [isChangePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
    const [isChangeEmailModalOpen, setChangeEmailModalOpen] = useState(false);
    const [showForceProfileUpdate, setShowForceProfileUpdate] = useState(false);
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
    const [noteToProcess, setNoteToProcess] = useState<Note | null>(null);
    
    // Toast state
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ message, type });
    };

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                
                // Check if user must change password on first login
                if (currentUser.must_change_password) {
                    setShowForceProfileUpdate(true);
                }
                
                // Load PGP keys: get public key from server and check for local private key
                const [serverPublicKeyData, localKeys, fidoKeysData] = await Promise.all([
                    apiService.getPgpPublicKey().catch(() => ({ publicKey: null })),
                    pgpService.loadKeys(),
                    apiService.fidoListCredentials().catch(() => [])
                ]);
                
                // Combine server public key with local private key status
                if (serverPublicKeyData.publicKey || localKeys) {
                    setPgpKey({
                        publicKey: serverPublicKeyData.publicKey || localKeys?.publicKey || '',
                        privateKey: localKeys?.encryptedPrivateKey ? 'encrypted' : '', // Just indicate presence
                    });
                }
                
                // Load FIDO keys
                setFidoKeys(fidoKeysData);
                
                // Load entries and notes from API
                const [entriesData, notesData] = await Promise.all([
                    apiService.getEntries(),
                    apiService.getNotes()
                ]);
                
                setEntries(entriesData);
                setNotes(notesData);
            } catch (error) {
                console.error('Failed to load data:', error);
            } finally {
                setLoading(false);
            }
        };
        
        loadData();
    }, []);

    const itemToShare = useMemo(() => selectedEntry || selectedNote, [selectedEntry, selectedNote]);

    const handleNavigate = (view: string) => {
        navigate(`/dashboard/${view}`);
    };

    const handleAddNew = async () => {
        const currentPath = location.pathname;
        
        if (currentPath.includes('/notes')) {
            if (pgpKey && !decryptedPrivateKey) {
                setNoteToProcess(null); // Indicates a new note
                setDecryptModalOpen(true);
            } else {
                handleEditNote(null);
            }
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
        
        // Check if entry has encrypted password and we need to unlock
        const needsUnlock = entry && pgpKey && entry.password_encrypted && 
                          entry.password_encrypted.includes('-----BEGIN PGP MESSAGE-----') && 
                          !decryptedPrivateKey;
        
        if (needsUnlock) {
            // Need to unlock private key first
            setDecryptModalOpen(true);
        } else if (pgpKey && !entry && !decryptedPrivateKey) {
            // Adding new entry and need to unlock for encryption
            setDecryptModalOpen(true);
        } else {
            // Can proceed to open modal
            let entryWithDecryptedPassword = entry;
            if (entry && decryptedPrivateKey && entry.password_encrypted) {
                try {
                    // Check if password is encrypted (contains PGP headers)
                    if (entry.password_encrypted.includes('-----BEGIN PGP MESSAGE-----')) {
                        const decryptedPassword = await pgpService.decrypt(entry.password_encrypted, decryptedPrivateKey);
                        entryWithDecryptedPassword = { ...entry, password_encrypted: decryptedPassword };
                    }
                } catch (error: any) {
                    console.error("Decryption failed:", error);
                    const errorMessage = error.message || "Failed to decrypt password. Please check your master password.";
                    showToast("Decryption Error: " + errorMessage, 'error');
                    return;
                }
            }
            setSelectedEntry(entryWithDecryptedPassword);
            setEntryModalOpen(true);
        }
    };

    const handleUnlockSession = async (masterPassword: string, uploadedPrivateKey?: string) => {
        try {
            const privateKeyObj = await pgpService.loadAndDecryptPrivateKey(masterPassword);
            setDecryptedPrivateKey(privateKeyObj);
            setDecryptModalOpen(false);
            
            // Process entry if present
            if (entryToProcess) {
                let entryWithDecryptedPassword = entryToProcess;
                if (entryToProcess.password_encrypted && entryToProcess.password_encrypted.includes('-----BEGIN PGP MESSAGE-----')) {
                    try {
                        const decryptedPassword = await pgpService.decrypt(entryToProcess.password_encrypted, privateKeyObj);
                        entryWithDecryptedPassword = { ...entryToProcess, password_encrypted: decryptedPassword };
                    } catch (error: any) {
                        console.error("Decryption failed:", error);
                        const errorMessage = error.message || "Failed to decrypt password.";
                        showToast("Decryption Error: " + errorMessage, 'error');
                        setEntryToProcess(null);
                        return;
                    }
                }
                
                // Check if this is for copy action
                if (entryToProcess.__copyAction) {
                    // Copy the decrypted password
                    await navigator.clipboard.writeText(entryWithDecryptedPassword.password_encrypted);
                    showToast("Password copied to clipboard!");
                    setEntryToProcess(null);
                } else {
                    // Open entry modal for view/edit
                    setSelectedEntry(entryWithDecryptedPassword);
                    setEntryModalOpen(true);
                    setEntryToProcess(null);
                }
            } 
            // Process note if present
            else if (noteToProcess) {
                let noteWithDecryptedContent = noteToProcess;
                if (noteToProcess.content && noteToProcess.content.includes('-----BEGIN PGP MESSAGE-----')) {
                    try {
                        const decryptedContent = await pgpService.decrypt(noteToProcess.content, privateKeyObj);
                        noteWithDecryptedContent = { ...noteToProcess, content: decryptedContent };
                    } catch (error: any) {
                        console.error("Decryption failed:", error);
                        const errorMessage = error.message || "Failed to decrypt note content.";
                        showToast("Decryption Error: " + errorMessage, 'error');
                        setNoteToProcess(null);
                        return;
                    }
                }
                
                // Check if this is for copy action
                if (noteToProcess.__copyAction) {
                    // Copy the decrypted content
                    await navigator.clipboard.writeText(noteWithDecryptedContent.content);
                    showToast("Note content copied to clipboard!");
                    setNoteToProcess(null);
                } else {
                    // Open note modal for view/edit
                    setSelectedNote(noteWithDecryptedContent);
                    setNoteModalOpen(true);
                    setNoteToProcess(null);
                }
            } 
            // This is for 'Add New'
            else {
                // Check current path to decide which modal to open
                const currentPath = location.pathname;
                if (currentPath.includes('/notes')) {
                    setSelectedNote(null);
                    setNoteModalOpen(true);
                } else {
                    setSelectedEntry(null);
                    setEntryModalOpen(true);
                }
            }
        } catch (error: any) {
            console.error("Failed to unlock PGP key:", error);
            const errorMessage = error.message || "Incorrect master password or corrupted key.";
            showToast("Unlock Failed: " + errorMessage, 'error');
        }
    };
    
    const handleCopyPassword = async (entry: Entry) => {
        // Check if password is encrypted
        if (entry.password_encrypted.includes('-----BEGIN PGP MESSAGE-----')) {
            // Need to decrypt first
            if (!decryptedPrivateKey) {
                // Mark this entry for copy action
                setEntryToProcess({ ...entry, __copyAction: true } as any);
                setDecryptModalOpen(true);
            } else {
                // Already have decrypted key, decrypt and copy
                try {
                    const decryptedPassword = await pgpService.decrypt(entry.password_encrypted, decryptedPrivateKey);
                    await navigator.clipboard.writeText(decryptedPassword);
                    showToast("Password copied to clipboard!");
                } catch (error: any) {
                    console.error("Failed to decrypt password:", error);
                    showToast("Failed to decrypt password: " + (error.message || "Please try again"), 'error');
                }
            }
        } else {
            // Not encrypted, copy directly
            await navigator.clipboard.writeText(entry.password_encrypted);
            showToast("Password copied to clipboard!");
        }
    };

    const handleCopyContent = async (note: Note) => {
        // Check if content is encrypted
        if (note.content.includes('-----BEGIN PGP MESSAGE-----')) {
            // Need to decrypt first
            if (!decryptedPrivateKey) {
                // Mark this note for copy action
                setNoteToProcess({ ...note, __copyAction: true } as any);
                setDecryptModalOpen(true);
            } else {
                // Already have decrypted key, decrypt and copy
                try {
                    const decryptedContent = await pgpService.decrypt(note.content, decryptedPrivateKey);
                    await navigator.clipboard.writeText(decryptedContent);
                    showToast("Note content copied to clipboard!");
                } catch (error: any) {
                    console.error("Failed to decrypt content:", error);
                    showToast("Failed to decrypt content: " + (error.message || "Please try again"), 'error');
                }
            }
        } else {
            // Not encrypted, copy directly
            await navigator.clipboard.writeText(note.content);
            showToast("Note content copied to clipboard!");
        }
    };
    
    const handleSaveEntry = async (entryToSave: Entry) => {
        try {
            let entryToStore = { ...entryToSave };
            
            // Encrypt password if PGP key is available
            if (pgpKey?.publicKey && entryToSave.password_encrypted) {
                try {
                    const publicKeyObj = await openpgp.readKey({ armoredKey: pgpKey.publicKey });
                    const encryptedPassword = await pgpService.encrypt(entryToSave.password_encrypted, publicKeyObj);
                    
                    // Validate encryption was successful
                    if (!encryptedPassword || !encryptedPassword.includes('-----BEGIN PGP MESSAGE-----')) {
                        throw new Error("Encryption validation failed");
                    }
                    
                    entryToStore.password_encrypted = encryptedPassword;
                    
                    // Optional: Test decryption immediately to ensure it works
                    if (decryptedPrivateKey) {
                        try {
                            const testDecrypt = await pgpService.decrypt(encryptedPassword, decryptedPrivateKey);
                            if (testDecrypt !== entryToSave.password_encrypted) {
                                console.warn('Decryption test mismatch - encryption may have issues');
                            } else {
                                console.log('✓ Encryption/Decryption test passed');
                            }
                        } catch (testError) {
                            console.error('Decryption test failed:', testError);
                            throw new Error("Encryption test failed - data may not be decryptable");
                        }
                    }
                } catch (encError: any) {
                    console.error('Encryption error:', encError);
                    showToast('Encryption Failed: ' + (encError.message || 'Failed to encrypt password'), 'error');
                    return;
                }
            }
            
            if (selectedEntry) { // Existing entry
                await apiService.updateEntry(entryToStore.id, entryToStore);
                setEntries(entries.map(e => e.id === entryToStore.id ? entryToStore : e));
            } else { // New entry
                const newEntry = await apiService.createEntry(entryToStore);
                setEntries([newEntry, ...entries]);
            }

            closeAllModals();
        } catch (error: any) {
            console.error('Failed to save entry:', error);
            showToast('Failed to save entry: ' + (error.message || 'Unknown error occurred'), 'error');
        }
    };

    const handleSaveNote = async (noteToSave: Note) => {
        try {
            let noteToStore = { ...noteToSave };
            
            // Encrypt content if PGP key is available
            if (pgpKey?.publicKey && noteToSave.content) {
                try {
                    const publicKeyObj = await openpgp.readKey({ armoredKey: pgpKey.publicKey });
                    const encryptedContent = await pgpService.encrypt(noteToSave.content, publicKeyObj);
                    
                    // Validate encryption was successful
                    if (!encryptedContent || !encryptedContent.includes('-----BEGIN PGP MESSAGE-----')) {
                        throw new Error("Encryption validation failed");
                    }
                    
                    noteToStore.content = encryptedContent;
                    
                    // Optional: Test decryption immediately to ensure it works
                    if (decryptedPrivateKey) {
                        try {
                            const testDecrypt = await pgpService.decrypt(encryptedContent, decryptedPrivateKey);
                            if (testDecrypt !== noteToSave.content) {
                                console.warn('Decryption test mismatch - encryption may have issues');
                            } else {
                                console.log('✓ Note encryption/decryption test passed');
                            }
                        } catch (testError) {
                            console.error('Decryption test failed:', testError);
                            throw new Error("Encryption test failed - data may not be decryptable");
                        }
                    }
                } catch (encError: any) {
                    console.error('Encryption error:', encError);
                    showToast('Encryption Failed: ' + (encError.message || 'Failed to encrypt note content'), 'error');
                    return;
                }
            }
            
            if (selectedNote) { // Existing note
                await apiService.updateNote(noteToStore.id, noteToStore);
                setNotes(notes.map(n => n.id === noteToStore.id ? noteToStore : n));
            } else { // New note
                const newNote = await apiService.createNote(noteToStore);
                setNotes([newNote, ...notes]);
            }
            closeAllModals();
        } catch (error: any) {
            console.error('Failed to save note:', error);
            showToast('Failed to save note: ' + (error.message || 'Unknown error occurred'), 'error');
        }
    };

    const handleEditNote = async (note: Note | null) => {
        setNoteToProcess(note);
        
        // Check if note has encrypted content and we need to unlock
        const needsUnlock = note && pgpKey && note.content && 
                          note.content.includes('-----BEGIN PGP MESSAGE-----') && 
                          !decryptedPrivateKey;
        
        if (needsUnlock) {
            // Need to unlock private key first
            setDecryptModalOpen(true);
        } else if (pgpKey && !note && !decryptedPrivateKey) {
            // Adding new note and need to unlock for encryption
            setDecryptModalOpen(true);
        } else {
            // Can proceed to open modal
            let noteWithDecryptedContent = note;
            if (note && decryptedPrivateKey && note.content) {
                try {
                    // Check if content is encrypted (contains PGP headers)
                    if (note.content.includes('-----BEGIN PGP MESSAGE-----')) {
                        const decryptedContent = await pgpService.decrypt(note.content, decryptedPrivateKey);
                        noteWithDecryptedContent = { ...note, content: decryptedContent };
                    }
                } catch (error: any) {
                    console.error("Decryption failed:", error);
                    const errorMessage = error.message || "Failed to decrypt note content.";
                    showToast("Decryption Error: " + errorMessage, 'error');
                    return;
                }
            }
            setSelectedNote(noteWithDecryptedContent);
            setNoteModalOpen(true);
        }
    };

    const openShareModal = (item: Entry | Note) => {
        if ('password_encrypted' in item) {
            setSelectedEntry(item);
        } else {
            setSelectedNote(item);
        }
        setShareModalOpen(true);
    };
    
    const handleDelete = async (item: Entry | Note) => {
        if (!confirm(`Are you sure you want to delete "${item.title}"?`)) {
            return;
        }
        
        try {
            if ('password_encrypted' in item) {
                await apiService.deleteEntry(item.id);
                setEntries(entries.filter(e => e.id !== item.id));
            } else {
                await apiService.deleteNote(item.id);
                setNotes(notes.filter(n => n.id !== item.id));
            }
            closeAllModals();
        } catch (error) {
            console.error('Failed to delete item:', error);
            showToast('Failed to delete item. Please try again.', 'error');
        }
    };
    
    const handleRemoveFidoKey = async (keyId: string) => {
        if (!confirm('Are you sure you want to remove this security key?')) {
            return;
        }
        
        try {
            await apiService.fidoDeleteCredential(keyId);
            setFidoKeys(prevKeys => prevKeys.filter(key => key.id !== keyId));
            showToast('Security key removed successfully!');
        } catch (error) {
            console.error('Failed to remove FIDO key:', error);
            showToast('Failed to remove security key. Please try again.', 'error');
        }
    };
    
    const handleAddFidoKey = async (key: FidoKey) => {
        setFidoKeys(prevKeys => [...prevKeys, key]);
        setRegisterFidoKeyModalOpen(false);
        showToast('Security key registered successfully!');
    };

    const handleTogglePasswordLogin = async (enabled: boolean) => {
        try {
            if (!enabled && fidoKeys.length === 0) {
                showToast('You must register at least one security key before disabling password login.', 'error');
                return;
            }
            
            if (enabled) {
                // Need to set a new password
                setChangePasswordModalOpen(true);
                // The actual toggle will happen after password is set
            } else {
                // Disable password login
                await apiService.fidoTogglePasswordLogin(false);
                setPasswordLoginEnabled(false);
                showToast('Password login disabled. You can now only login with security keys.', 'info');
            }
        } catch (error) {
            console.error('Failed to toggle password login:', error);
            showToast('Failed to update login method. Please try again.', 'error');
        }
    };

    const handleSavePgpKey = async (publicKey: string, privateKey: string, masterPassword: string) => {
        try {
            // Save public key to server
            await apiService.savePgpPublicKey(publicKey);
            
            // Save private key (encrypted) locally
            await pgpService.storeKeys({ publicKey, privateKey }, masterPassword);
            
            // Update local state
            setPgpKey({ publicKey, privateKey: '' }); // Don't store unencrypted private key in state
            setDecryptedPrivateKey(null); // Force re-unlock with new key
            setPgpModalOpen(false);
            
            showToast('PGP keys saved successfully!');
        } catch (error) {
            console.error('Failed to save PGP keys:', error);
            showToast('Failed to save PGP keys. Please try again.', 'error');
        }
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
        setDecryptModalOpen(false);
        setSelectedEntry(null);
        setSelectedNote(null);
        setEntryToProcess(null);
        setNoteToProcess(null);
    };
    
    const handleCloseDecryptModal = () => {
        setDecryptModalOpen(false);
        setEntryToProcess(null); // Clear the pending entry
    };

    const handleToggle2FA = () => {
        if (is2FAEnabled) {
            set2FAEnabled(false);
        } else {
            setSetup2FAModalOpen(true);
        }
    };

    const handleSetup2FA = (code: string) => {
        set2FAEnabled(true);
        setSetup2FAModalOpen(false);
    };

    const handleToggleAdminMode = () => {
        if (currentUser.role === 'admin') {
            navigate('/admin');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
                    <p>Loading your vault...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Fixed Navbar */}
            <Navbar 
                user={currentUser} 
                onLogout={logout}
                onToggleAdminMode={handleToggleAdminMode}
            />
            
            {/* Main Layout Container */}
            <div className="flex pt-16">
                {/* Fixed Sidebar */}
                <Sidebar 
                    activeView={location.pathname.split('/')[2] || 'overview'}
                    onNavigate={handleNavigate}
                    onAddNew={handleAddNew}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                />
                
                {/* Main Content Area */}
                <main className="flex-1 min-h-[calc(100vh-4rem)] lg:ml-64">
                    {/* PGP Setup Banner */}
                    {!pgpKey && location.pathname !== '/dashboard/settings' && (
                        <div className="mx-6 mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                                        🔐 Enable End-to-End Encryption
                                    </h3>
                                    <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                                        Your passwords are not encrypted yet. Set up PGP encryption to ensure only you can access your data.
                                    </p>
                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        onClick={() => navigate('/dashboard/settings')}
                                        className="bg-white dark:bg-gray-800"
                                    >
                                        Go to Settings → PGP Encryption
                                    </Button>
                                </div>
                                <button 
                                    onClick={() => {/* Could add logic to hide banner for session */}}
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                                    aria-label="Dismiss"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}
                    
                    <div className="container mx-auto px-6 py-8 max-w-7xl">
                        <Routes>
                            <Route path="/" element={
                                <OverviewView 
                                    entries={entries}
                                    notes={notes}
                                    onEditEntry={handleEditEntry}
                                    onEditNote={handleEditNote}
                                    onShareItem={openShareModal}
                                    onDeleteItem={handleDelete}
                                    onCopyPassword={handleCopyPassword}
                                    onShowToast={showToast}
                                />
                            } />
                            <Route path="/overview" element={
                                <OverviewView 
                                    entries={entries}
                                    notes={notes}
                                    onEditEntry={handleEditEntry}
                                    onEditNote={handleEditNote}
                                    onShareItem={openShareModal}
                                    onDeleteItem={handleDelete}
                                    onCopyPassword={handleCopyPassword}
                                    onShowToast={showToast}
                                />
                            } />
                            <Route path="/all-entries" element={
                                <AllEntriesView 
                                    entries={entries}
                                    searchQuery={searchQuery}
                                    onEditEntry={handleEditEntry}
                                    onShareEntry={openShareModal}
                                    onDeleteEntry={handleDelete}
                                    onCopyPassword={handleCopyPassword}
                                    onShowToast={showToast}
                                />
                            } />
                            <Route path="/notes" element={
                                <AllNotesView 
                                    notes={notes}
                                    searchQuery={searchQuery}
                                    onEditNote={handleEditNote}
                                    onShareNote={openShareModal}
                                    onDeleteNote={handleDelete}
                                    onCopyContent={handleCopyContent}
                                    onShowToast={showToast}
                                />
                            } />
                            <Route path="/settings" element={
                                <SettingsView 
                                    is2FAEnabled={is2FAEnabled}
                                    fidoKeys={fidoKeys}
                                    isPasswordLoginEnabled={isPasswordLoginEnabled}
                                    pgpKey={pgpKey}
                                    userEmail={currentUser.email}
                                    emailChangedAt={currentUser.email_changed_at}
                                    onToggle2FA={handleToggle2FA}
                                    onChangePassword={() => setChangePasswordModalOpen(true)}
                                    onChangeEmail={() => setChangeEmailModalOpen(true)}
                                    onExport={() => {/* Export functionality */}}
                                    onImport={() => setImportModalOpen(true)}
                                    onAddFidoKey={() => setRegisterFidoKeyModalOpen(true)}
                                    onRemoveFidoKey={handleRemoveFidoKey}
                                    onTogglePasswordLogin={handleTogglePasswordLogin}
                                    onManagePgpKey={() => setPgpModalOpen(true)}
                                    onRemovePgpKey={handleRemovePgpKey}
                                />
                            } />
                        </Routes>
                    </div>
                </main>
            </div>

            {/* Modals */}
            {showForceProfileUpdate && (
                <ForceProfileUpdateModal
                    isOpen={showForceProfileUpdate}
                    onClose={() => {
                        // Force profile update cannot be dismissed
                    }}
                    onComplete={async (newEmail: string) => {
                        setShowForceProfileUpdate(false);
                        // Refresh user data
                        try {
                            const updatedUser = await apiService.getMe();
                            setCurrentUser(updatedUser);
                            showToast('Profile updated successfully!', 'success');
                        } catch (error) {
                            console.error('Failed to refresh user data:', error);
                        }
                    }}
                    currentEmail={currentUser.email}
                />
            )}
            
            {isEntryModalOpen && (
                <EntryEditModal
                    isOpen={isEntryModalOpen}
                    onClose={closeAllModals}
                    entry={selectedEntry}
                    onSave={handleSaveEntry}
                    onShowToast={showToast}
                />
            )}
            
            {isNoteModalOpen && (
                <NoteEditModal
                    isOpen={isNoteModalOpen}
                    onClose={closeAllModals}
                    note={selectedNote}
                    onSave={handleSaveNote}
                />
            )}
            
            {isShareModalOpen && itemToShare && (
                <ShareModal
                    isOpen={isShareModalOpen}
                    onClose={closeAllModals}
                    item={itemToShare}
                />
            )}
            
            {isChangePasswordModalOpen && (
                <ChangePasswordModal
                    isOpen={isChangePasswordModalOpen}
                    onClose={() => setChangePasswordModalOpen(false)}
                />
            )}
            
            {isChangeEmailModalOpen && (
                <ChangeEmailModal
                    isOpen={isChangeEmailModalOpen}
                    onClose={() => setChangeEmailModalOpen(false)}
                    currentEmail={currentUser.email}
                    hasChangedEmail={!!currentUser.email_changed_at}
                    onSuccess={() => {
                        showToast('Email changed successfully!', 'success');
                        setChangeEmailModalOpen(false);
                    }}
                />
            )}
            
            {isSetup2FAModalOpen && (
                <Setup2FAModal
                    isOpen={isSetup2FAModalOpen}
                    onClose={() => setSetup2FAModalOpen(false)}
                    onSetup={handleSetup2FA}
                />
            )}
            
            {isImportModalOpen && (
                <ImportDataModal
                    isOpen={isImportModalOpen}
                    onClose={() => setImportModalOpen(false)}
                />
            )}
            
            {isRegisterFidoKeyModalOpen && (
                <RegisterFidoKeyModal
                    isOpen={isRegisterFidoKeyModalOpen}
                    onClose={() => setRegisterFidoKeyModalOpen(false)}
                    onRegister={handleAddFidoKey}
                />
            )}
            
            {isPgpModalOpen && (
                <PgpSettingsModal
                    isOpen={isPgpModalOpen}
                    onClose={() => setPgpModalOpen(false)}
                    onSave={handleSavePgpKey}
                    currentKey={pgpKey}
                    onShowToast={showToast}
                />
            )}
            
            {isDecryptModalOpen && (
                <DecryptVaultModal
                    isOpen={isDecryptModalOpen}
                    onClose={handleCloseDecryptModal}
                    onUnlock={handleUnlockSession}
                />
            )}
            
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default DashboardView;
