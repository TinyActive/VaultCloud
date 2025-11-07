
import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { MOCK_USERS } from '../constants';
import { User, AdminViewType } from '../types';
import { useI18n } from '../i18n';
import AdminOverviewView from './admin/AdminOverviewView';
import UserManagementView from './admin/UserManagementView';
import AddUserModal from '../components/modals/AddUserModal';

interface AdminViewProps {
    currentUser: User;
    onLogout: () => void;
    onToggleAdminMode: () => void;
    activeView: AdminViewType;
    onNavigate: (view: AdminViewType) => void;
}

const AdminView: React.FC<AdminViewProps> = ({ currentUser, onLogout, onToggleAdminMode, activeView, onNavigate }) => {
    const { t } = useI18n();
    const [users, setUsers] = useState<User[]>(MOCK_USERS);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddUserModalOpen, setAddUserModalOpen] = useState(false);
    
    const handleAddUser = (newUser: Omit<User, 'id' | 'lastLogin'>) => {
        const userToAdd: User = {
            id: `u${Date.now()}`,
            lastLogin: 'Never',
            ...newUser,
        };
        setUsers(prevUsers => [userToAdd, ...prevUsers]);
        setAddUserModalOpen(false);
    };
    
    const handleUpdateUser = (updatedUser: User) => {
        setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    };

    return (
        <div className="flex h-screen bg-background">
            <Sidebar 
                userActiveView=""
                adminActiveView={activeView}
                onUserNavigate={() => {}}
                onAdminNavigate={onNavigate}
                onLogout={onLogout} 
                currentUser={currentUser}
                isAdminMode={true}
                onToggleAdminMode={onToggleAdminMode}
            />
            <main className="flex-1 flex flex-col overflow-hidden">
                {activeView === 'management' && <Navbar onSearch={setSearchQuery} onAddNew={() => setAddUserModalOpen(true)} addNewLabel={t('addNewUser')} />}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                   {activeView === 'overview' && <AdminOverviewView users={users} />}
                   {activeView === 'management' && (
                        <UserManagementView
                            users={users} 
                            searchQuery={searchQuery}
                            onUpdateUser={handleUpdateUser}
                        />
                   )}
                </div>
            </main>
            <AddUserModal 
                isOpen={isAddUserModalOpen} 
                onClose={() => setAddUserModalOpen(false)} 
                onAdd={handleAddUser}
            />
        </div>
    );
};

export default AdminView;
