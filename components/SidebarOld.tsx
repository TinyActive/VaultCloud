
import React from 'react';
import { LockIcon, HomeIcon, ListIcon, SettingsIcon, UserIcon, LogoutIcon, FileTextIcon, UsersIcon, SwitchCameraIcon, ShieldIcon, LayoutDashboardIcon } from '../constants';
import { useI18n } from '../i18n';
// FIX: Import UserView and AdminViewType for stronger prop typing.
import { User, UserView, AdminViewType } from '../types';

interface SidebarProps {
    // FIX: Use specific view types instead of string. Union with '' for when the view is not active.
    userActiveView: UserView | '';
    adminActiveView: AdminViewType | '';
    currentUser: User;
    isAdminMode: boolean;
    // FIX: Use specific view types for navigation callbacks.
    onUserNavigate: (view: UserView) => void;
    onAdminNavigate: (view: AdminViewType) => void;
    onLogout: () => void;
    onToggleAdminMode: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    userActiveView, 
    adminActiveView, 
    currentUser, 
    isAdminMode, 
    onUserNavigate, 
    onAdminNavigate, 
    onLogout, 
    onToggleAdminMode 
}) => {
    const { t } = useI18n();

    const userNavItems = [
        { id: 'overview', label: t('overview'), icon: HomeIcon },
        { id: 'all-entries', label: t('allEntries'), icon: ListIcon },
        { id: 'notes', label: t('notes'), icon: FileTextIcon },
        { id: 'settings', label: t('settings'), icon: SettingsIcon },
    ];
    
    const adminNavItems = [
        { id: 'overview', label: t('adminOverview'), icon: LayoutDashboardIcon },
        { id: 'management', label: t('userManagement'), icon: UsersIcon },
    ];

    const NavLink: React.FC<{item: {id: string, label: string, icon: React.FC<any>}, type: 'user' | 'admin'}> = ({ item, type }) => {
        const isActive = type === 'admin' ? adminActiveView === item.id : userActiveView === item.id;
        
        const handleClick = () => {
            if (type === 'admin') {
                // FIX: Cast item.id to AdminViewType as we know it comes from adminNavItems.
                onAdminNavigate(item.id as AdminViewType);
            } else {
                // FIX: Cast item.id to UserView as we know it comes from userNavItems.
                onUserNavigate(item.id as UserView);
            }
        };

        return (
            <button
                onClick={handleClick}
                className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-md transition-colors duration-200 ${
                    isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
            >
                <item.icon className="w-5 h-5 mr-3" />
                <span>{item.label}</span>
            </button>
        );
    }
    
    return (
        <aside className="w-64 bg-card p-4 flex-col h-screen border-r border-border hidden md:flex">
            <div className="flex items-center mb-12 px-2">
                <LockIcon className="w-8 h-8 text-accent" />
                <h1 className="text-2xl font-bold ml-2">VaultCloud</h1>
            </div>

            <nav className="flex-grow space-y-2">
                {isAdminMode ? (
                    adminNavItems.map(item => <NavLink key={item.id} item={item} type="admin" />)
                ) : (
                    userNavItems.map(item => <NavLink key={item.id} item={item} type="user" />)
                )}
            </nav>

            <div className="mt-auto">
                <div className="flex items-center p-2 mb-2">
                    <div className="relative">
                       <UserIcon className="w-10 h-10 p-1.5 bg-secondary text-secondary-foreground rounded-full" />
                       {currentUser.role === 'admin' && <ShieldIcon className="absolute bottom-0 right-0 w-4 h-4 text-accent bg-card rounded-full" />}
                    </div>
                    <div className="ml-3 overflow-hidden">
                        <p className="text-sm font-semibold truncate">{currentUser.email}</p>
                        <p className="text-xs text-muted-foreground capitalize">{currentUser.role}</p>
                    </div>
                </div>
                 {currentUser.role === 'admin' && (
                    <button
                        onClick={onToggleAdminMode}
                        className="flex items-center w-full px-4 py-3 text-sm font-medium text-muted-foreground rounded-md hover:bg-muted/50 hover:text-foreground transition-colors duration-200"
                    >
                        <SwitchCameraIcon className="w-5 h-5 mr-3" />
                        <span>{isAdminMode ? t('switchToUserView') : t('switchToAdminView')}</span>
                    </button>
                )}
                <button
                    onClick={onLogout}
                    className="flex items-center w-full px-4 py-3 text-sm font-medium text-muted-foreground rounded-md hover:bg-muted/50 hover:text-foreground transition-colors duration-200"
                >
                    <LogoutIcon className="w-5 h-5 mr-3" />
                    <span>{t('logout')}</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
