import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from './Button';
import { LogoutIcon, SwitchCameraIcon, UserIcon, ShieldIcon, LockIcon } from '../constants';
import { useI18n } from '../i18n';
import { User } from '../types';
import { useTheme } from '../App';

interface NavbarProps {
    user: User;
    onLogout: () => void;
    onToggleAdminMode?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onToggleAdminMode }) => {
    const { t } = useI18n();
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const isAdminMode = location.pathname.includes('/admin');

    return (
        <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 h-16 bg-card border-b-2 border-border shadow-md">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/dashboard')}>
                <LockIcon className="w-6 h-6 sm:w-7 sm:h-7 text-accent shrink-0" />
                <h1 className="text-lg sm:text-xl font-bold truncate">VaultCloud</h1>
            </div>
            
            {/* Right Side Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
                {/* Theme Toggle */}
                <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="p-2 rounded-lg hover:bg-muted transition-colors shrink-0"
                    aria-label="Toggle theme"
                >
                    <span className="text-lg">{theme === 'dark' ? '☀️' : '🌙'}</span>
                </button>
                
                {/* User Info */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border">
                    <div className="relative shrink-0">
                        <UserIcon className="w-5 h-5 text-muted-foreground" />
                        {user.role === 'admin' && (
                            <ShieldIcon className="absolute -bottom-0.5 -right-0.5 w-3 h-3 text-accent bg-card rounded-full p-0.5" />
                        )}
                    </div>
                    <span className="text-sm font-medium truncate max-w-[150px]">{user.email}</span>
                </div>
                
                {/* Admin Mode Toggle */}
                {user.role === 'admin' && onToggleAdminMode && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onToggleAdminMode}
                        className="hidden md:flex shrink-0"
                    >
                        <SwitchCameraIcon className="w-4 h-4 sm:mr-1" />
                        <span className="hidden sm:inline">{isAdminMode ? 'User Mode' : 'Admin Mode'}</span>
                    </Button>
                )}
                
                {/* Logout */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onLogout}
                    className="shrink-0"
                >
                    <LogoutIcon className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Logout</span>
                </Button>
            </div>
        </header>
    );
};

export default Navbar;
