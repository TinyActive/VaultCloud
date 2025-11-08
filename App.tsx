
import React, { useState, useEffect, createContext, useContext, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
// FIX: Import UserView and AdminViewType from types.ts for strong typing.
import { Theme, User } from './types';
import LandingView from './views/LandingView';
import AuthView from './views/AuthView';
import DashboardView from './views/DashboardView';
import AdminView from './views/AdminView';
import VerifyEmailView from './views/VerifyEmailView';
import apiService from './services/apiService';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

interface AuthContextType {
    currentUser: User | null;
    setCurrentUser: (user: User | null) => void;
    logout: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

const AppContent: React.FC = () => {
    const navigate = useNavigate();
    const [theme, setTheme] = useState<Theme>(() => {
        const savedTheme = localStorage.getItem('vaultcloud-theme') as Theme;
        return savedTheme || 'dark';
    });
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('vaultcloud-theme', theme);
    }, [theme]);

    // Check for existing session on mount
    useEffect(() => {
        const checkSession = async () => {
            try {
                const token = apiService.getToken();
                if (token) {
                    const user = await apiService.getMe();
                    setCurrentUser(user);
                }
            } catch (error) {
                console.error('Session check failed:', error);
                apiService.setToken(null);
            } finally {
                setLoading(false);
            }
        };
        checkSession();
    }, []);

    const handleLogout = async () => {
        try {
            await apiService.logout();
        } catch (error) {
            console.error('Logout error:', error);
        }
        setCurrentUser(null);
        navigate('/');
    };

    const themeValue = useMemo(() => ({ theme, setTheme }), [theme]);
    const authValue = useMemo(() => ({ 
        currentUser, 
        setCurrentUser,
        logout: handleLogout 
    }), [currentUser]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background text-light-text dark:text-dark-text">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <ThemeContext.Provider value={themeValue}>
            <AuthContext.Provider value={authValue}>
                <div className="min-h-screen text-light-text dark:text-dark-text">
                    <Routes>
                        <Route path="/" element={
                            currentUser ? <Navigate to="/dashboard" replace /> : <LandingView />
                        } />
                        <Route path="/auth" element={<AuthView />} />
                        <Route path="/verify-email" element={<VerifyEmailView />} />
                        <Route path="/dashboard/*" element={
                            currentUser ? <DashboardView currentUser={currentUser} /> : <Navigate to="/auth" replace />
                        } />
                        <Route path="/admin/*" element={
                            currentUser?.role === 'admin' ? (
                                <AdminView currentUser={currentUser} />
                            ) : (
                                <Navigate to="/dashboard" replace />
                            )
                        } />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </div>
            </AuthContext.Provider>
        </ThemeContext.Provider>
    );
};

const App: React.FC = () => {
    return (
        <BrowserRouter>
            <AppContent />
        </BrowserRouter>
    );
};

export default App;
