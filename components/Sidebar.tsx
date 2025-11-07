import React from 'react';
import { LockIcon, HomeIcon, ListIcon, SettingsIcon, UserIcon, FileTextIcon, UsersIcon, ShieldIcon, LayoutDashboardIcon, SearchIcon, PlusIcon } from '../constants';
import { useI18n } from '../i18n';
import Input from './Input';

interface SidebarProps {
    activeView: string;
    onNavigate: (view: string) => void;
    onAddNew?: () => void;
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
    isAdminMode?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    activeView,
    onNavigate,
    onAddNew,
    searchQuery = '',
    onSearchChange,
    isAdminMode = false
}) => {
    const { t } = useI18n();

    const userNavItems = [
        { id: 'overview', label: t('overview'), icon: HomeIcon },
        { id: 'all-entries', label: t('allEntries'), icon: ListIcon },
        { id: 'notes', label: t('notes'), icon: FileTextIcon },
        { id: 'settings', label: t('settings'), icon: SettingsIcon },
    ];
    
    const adminNavItems = [
        { id: 'overview', label: t('adminOverview') || 'Admin Overview', icon: LayoutDashboardIcon },
        { id: 'management', label: t('userManagement') || 'User Management', icon: UsersIcon },
        { id: 'settings', label: t('siteSettings') || 'Site Settings', icon: SettingsIcon },
    ];

    const navItems = isAdminMode ? adminNavItems : userNavItems;

    const NavLink: React.FC<{item: {id: string, label: string, icon: React.FC<any>}}> = ({ item }) => {
        const isActive = activeView === item.id;

        return (
            <button
                onClick={() => onNavigate(item.id)}
                className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
            >
                <item.icon className="w-5 h-5 mr-3 shrink-0" />
                <span className="truncate">{item.label}</span>
            </button>
        );
    };
    
    return (
        <aside className="fixed left-0 top-16 w-64 bg-card border-r-2 border-border h-[calc(100vh-4rem)] hidden lg:flex flex-col overflow-hidden z-40 shadow-lg">
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Search and Add New */}
                {onSearchChange && (
                    <div className="space-y-3">
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            <Input
                                type="text"
                                placeholder={t('searchVault')}
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="pl-9 w-full"
                            />
                        </div>
                        {onAddNew && (
                            <button
                                onClick={onAddNew}
                                className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 transition-colors shadow-sm"
                            >
                                <PlusIcon className="w-4 h-4 mr-2" />
                                {isAdminMode ? t('addUser') : t('addNew')}
                            </button>
                        )}
                    </div>
                )}

                {/* Navigation */}
                <nav className="space-y-1">
                    {navItems.map(item => <NavLink key={item.id} item={item} />)}
                </nav>
            </div>
        </aside>
    );
};

export default Sidebar;
