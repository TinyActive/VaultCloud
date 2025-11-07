import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { User } from '../types';
import { useI18n } from '../i18n';
import AdminOverviewView from './admin/AdminOverviewView';
import UserManagementView from './admin/UserManagementView';
import SiteSettingsView from './admin/SiteSettingsView';
import AddUserModal from '../components/modals/AddUserModal';
import EditUserModal from '../components/modals/EditUserModal';
import apiService from '../services/apiService';
import { useAuth } from '../App';

interface AdminViewProps {
    currentUser: User;
}

const AdminView: React.FC<AdminViewProps> = ({ currentUser }) => {
    const { t } = useI18n();
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useAuth();
    
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddUserModalOpen, setAddUserModalOpen] = useState(false);
    const [isEditUserModalOpen, setEditUserModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    
    // Load users from API
    useEffect(() => {
        const loadUsers = async () => {
            try {
                setLoading(true);
                const usersData = await apiService.getUsers();
                setUsers(usersData);
            } catch (error) {
                console.error('Failed to load users:', error);
            } finally {
                setLoading(false);
            }
        };
        
        loadUsers();
    }, []);
    
    const handleAddUser = async (newUser: { email: string; password?: string; role?: string }) => {
        try {
            const addedUser = await apiService.createUser(newUser.email, newUser.password, newUser.role);
            setUsers(prevUsers => [addedUser, ...prevUsers]);
            setAddUserModalOpen(false);
        } catch (error) {
            console.error('Failed to add user:', error);
            alert('Failed to add user. Please try again.');
        }
    };
    
    const handleEditUser = (user: User) => {
        setSelectedUser(user);
        setEditUserModalOpen(true);
    };
    
    const handleUpdateUser = async (updatedUser: User) => {
        try {
            await apiService.updateUser(updatedUser.id, {
                role: updatedUser.role,
                status: updatedUser.status
            });
            setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
            setEditUserModalOpen(false);
            setSelectedUser(null);
        } catch (error) {
            console.error('Failed to update user:', error);
            alert('Failed to update user. Please try again.');
        }
    };
    
    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user?')) {
            return;
        }
        
        try {
            await apiService.deleteUser(userId);
            setUsers(users.filter(u => u.id !== userId));
        } catch (error) {
            console.error('Failed to delete user:', error);
            alert('Failed to delete user. Please try again.');
        }
    };

    const handleNavigate = (view: string) => {
        navigate(`/admin/${view}`);
    };
    
    const handleToggleAdminMode = () => {
        navigate('/dashboard');
    };
    
    const handleAddNew = () => {
        setAddUserModalOpen(true);
    };

    const currentView = location.pathname.split('/')[2] || 'overview';

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
                    <p>Loading admin panel...</p>
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
                    activeView={currentView}
                    onNavigate={handleNavigate}
                    onAddNew={handleAddNew}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    isAdminMode={true}
                />
                
                {/* Main Content Area */}
                <main className="flex-1 min-h-[calc(100vh-4rem)] lg:ml-64">
                    <Routes>
                        <Route path="/" element={<AdminOverviewView users={users} />} />
                        <Route path="/overview" element={<AdminOverviewView users={users} />} />
                        <Route path="/management" element={
                            <UserManagementView
                                users={users} 
                                searchQuery={searchQuery}
                                onUpdateUser={handleEditUser}
                                onDeleteUser={handleDeleteUser}
                            />
                        } />
                        <Route path="/settings" element={<SiteSettingsView />} />
                    </Routes>
                </main>
            </div>
            
            {/* Modals */}
            <AddUserModal 
                isOpen={isAddUserModalOpen} 
                onClose={() => setAddUserModalOpen(false)} 
                onAdd={handleAddUser}
            />
            
            {isEditUserModalOpen && selectedUser && (
                <EditUserModal
                    isOpen={isEditUserModalOpen}
                    onClose={() => {
                        setEditUserModalOpen(false);
                        setSelectedUser(null);
                    }}
                    user={selectedUser}
                    onSave={handleUpdateUser}
                />
            )}
        </div>
    );
};

export default AdminView;
