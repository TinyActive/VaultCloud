
import React, { useState, useMemo } from 'react';
import { User } from '../../types';
import { useI18n } from '../../i18n';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '../../components/Card';
import Button from '../../components/Button';
import EditUserModal from '../../components/modals/EditUserModal';

interface UserManagementViewProps {
    users: User[];
    searchQuery: string;
    onUpdateUser: (user: User) => void;
    onDeleteUser?: (userId: string) => void;
}

const UserManagementView: React.FC<UserManagementViewProps> = ({ users, searchQuery, onUpdateUser, onDeleteUser }) => {
    const { t } = useI18n();
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isEditModalOpen, setEditModalOpen] = useState(false);

    const filteredUsers = useMemo(() => {
        return users.filter(user =>
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [users, searchQuery]);
    
    const handleEditUser = (user: User) => {
        setSelectedUser(user);
        setEditModalOpen(true);
    };

    const handleSaveChanges = (updatedUser: User) => {
        onUpdateUser(updatedUser);
        setEditModalOpen(false);
        setSelectedUser(null);
    };

    return (
        <div className="space-y-8 w-full px-6 py-10 max-w-7xl mx-auto">
            {/* Header */}
            <div className="space-y-3 pb-4 border-b-2 border-border">
                <h1 className="text-4xl font-bold tracking-tight">{t('userManagement')}</h1>
                <p className="text-lg text-muted-foreground leading-relaxed">
                    {t('totalUsers')}: <span className="font-semibold text-foreground">{filteredUsers.length}</span>
                </p>
            </div>
            
            {/* Desktop Table View */}
            <Card className="hidden lg:block overflow-hidden shadow-md border-2">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-left text-muted-foreground border-b">
                            <tr>
                                <th className="p-4 font-medium whitespace-nowrap">{t('emailAddress')}</th>
                                <th className="p-4 font-medium whitespace-nowrap">{t('role')}</th>
                                <th className="p-4 font-medium whitespace-nowrap">{t('status')}</th>
                                <th className="p-4 font-medium whitespace-nowrap">{t('lastLogin')}</th>
                                <th className="p-4 font-medium text-right whitespace-nowrap">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                    <td className="p-4 font-medium">{user.email}</td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full capitalize ${
                                            user.role === 'admin' 
                                                ? 'bg-accent/20 text-accent' 
                                                : 'bg-secondary text-secondary-foreground'
                                        }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full capitalize ${
                                            user.status === 'active' 
                                                ? 'bg-green-500/20 text-green-600 dark:text-green-400' 
                                                : 'bg-red-500/20 text-red-600 dark:text-red-400'
                                        }`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-muted-foreground">{user.lastLogin}</td>
                                    <td className="p-4">
                                        <div className="flex justify-end gap-2">
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                onClick={() => handleEditUser(user)}
                                            >
                                                {t('editUser')}
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Mobile Card View */}
            <div className="grid lg:hidden grid-cols-1 gap-4">
                {filteredUsers.map(user => (
                    <Card key={user.id} className="overflow-hidden">
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                                <div className="space-y-1 flex-1 min-w-0">
                                    <CardTitle className="text-base truncate">{user.email}</CardTitle>
                                    <CardDescription className="text-xs">
                                        {t('lastLogin')}: {user.lastLogin}
                                    </CardDescription>
                                </div>
                                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full capitalize shrink-0 ${
                                    user.status === 'active' 
                                        ? 'bg-green-500/20 text-green-600 dark:text-green-400' 
                                        : 'bg-red-500/20 text-red-600 dark:text-red-400'
                                }`}>
                                    {user.status}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="pb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Role:</span>
                                <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full capitalize ${
                                    user.role === 'admin' 
                                        ? 'bg-accent/20 text-accent' 
                                        : 'bg-secondary text-secondary-foreground'
                                }`}>
                                    {user.role}
                                </span>
                            </div>
                        </CardContent>
                        <CardFooter className="pt-3">
                            <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleEditUser(user)} 
                                className="w-full"
                            >
                                {t('editUser')}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
            
            {filteredUsers.length === 0 && (
                <Card>
                    <CardContent className="py-12">
                        <div className="text-center text-muted-foreground">
                            <p>{t('noUsersFound')}</p>
                        </div>
                    </CardContent>
                </Card>
            )}
            
            {selectedUser && (
                <EditUserModal 
                    isOpen={isEditModalOpen} 
                    onClose={() => {
                        setEditModalOpen(false);
                        setSelectedUser(null);
                    }} 
                    user={selectedUser}
                    onSave={handleSaveChanges}
                />
            )}
        </div>
    );
};

export default UserManagementView;
