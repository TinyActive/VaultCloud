import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/Card';
import Input from '../components/Input';
import { LockIcon, KeyIcon, MailIcon } from '../constants';
import { useI18n } from '../i18n';
import apiService from '../services/apiService';
import fidoService from '../services/fidoService';
import { useAuth } from '../App';

type AuthMethod = 'password' | 'register' | 'fido' | 'magicLink' | 'magicLinkSent';

const AuthView: React.FC = () => {
    const { t } = useI18n();
    const navigate = useNavigate();
    const { setCurrentUser } = useAuth();
    const [authMethod, setAuthMethod] = useState<AuthMethod>('password');
    const [email, setEmail] = useState('admin@vaultcloud.dev');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fidoSupported, setFidoSupported] = useState(true);
    
    useEffect(() => {
        // Check FIDO support on component mount
        setFidoSupported(fidoService.isSupported());
        
        // Check for URL parameters (from extension)
        const params = new URLSearchParams(window.location.search);
        const fidoLogin = params.get('fido_login');
        const emailParam = params.get('email');
        
        if (fidoLogin === '1') {
            // Set email from URL parameter if provided
            if (emailParam) {
                setEmail(emailParam);
            }
            // Auto-trigger FIDO login
            setAuthMethod('fido');
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        try {
            const response = await apiService.login(email, password);
            setCurrentUser(response.user);
            navigate('/dashboard');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }
        
        try {
            const response = await apiService.register(email, password);
            
            // Check if email verification is required
            if (response.requiresVerification) {
                setAuthMethod('verificationSent');
                return;
            }
            
            if (response.user) {
                setCurrentUser(response.user);
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleFidoLogin = async () => {
        if (!email) {
            setError('Please enter your email address');
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            const response = await fidoService.authenticateWithSecurityKey(email);
            setCurrentUser(response.user);
            navigate('/dashboard');
        } catch (err) {
            console.error('FIDO login error:', err);
            setError(err instanceof Error ? err.message : 'Security key authentication failed');
            setAuthMethod('password');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authMethod === 'fido') {
            if (!fidoSupported) {
                setError('WebAuthn is not supported in this browser');
                setAuthMethod('password');
            } else {
                handleFidoLogin();
            }
        }
    }, [authMethod]);
    
    const handleSendMagicLink = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        try {
            await apiService.sendMagicLink(email);
            setAuthMethod('magicLinkSent');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send magic link');
        } finally {
            setLoading(false);
        }
    }

    const renderContent = () => {
        switch (authMethod) {
            case 'register':
                return (
                    <form onSubmit={handleRegister}>
                        <CardHeader className="text-center">
                            <LockIcon className="w-10 h-10 text-accent mx-auto mb-2" />
                            <CardTitle>Create Account</CardTitle>
                            <CardDescription>Sign up for your free VaultCloud account</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {error && (
                                <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                                    {error}
                                </div>
                            )}
                            <Input 
                                type="email" 
                                placeholder="you@example.com" 
                                id="register-email" 
                                label={t('emailAddress')}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <Input 
                                type="password" 
                                placeholder="••••••••" 
                                id="register-password" 
                                label={t('password')}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <Input 
                                type="password" 
                                placeholder="••••••••" 
                                id="confirm-password" 
                                label="Confirm Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </CardContent>
                        <CardFooter className="flex-col">
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Creating account...' : 'Create Account'}
                            </Button>
                            <div className="mt-4 text-center text-sm">
                                Already have an account?{' '}
                                <Button variant="link" className="p-0 h-auto" onClick={() => setAuthMethod('password')}>
                                    Sign In
                                </Button>
                            </div>
                        </CardFooter>
                    </form>
                );
            case 'fido':
                return (
                     <div className="text-center p-8">
                        <KeyIcon className="w-12 h-12 text-accent mx-auto mb-4 animate-pulse" />
                        <h3 className="font-semibold text-lg">{t('waitingForKey')}</h3>
                        <p className="text-muted-foreground text-sm mb-4">{t('touchYourKey')}</p>
                        {error && (
                            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded mb-2">
                                {error}
                            </div>
                        )}
                        <Button variant="link" className="mt-2" onClick={() => setAuthMethod('password')}>{t('cancel')}</Button>
                    </div>
                );
            case 'magicLink':
                 return (
                    <form onSubmit={handleSendMagicLink}>
                        <CardHeader>
                            <CardTitle>{t('emailMagicLink')}</CardTitle>
                            <CardDescription>{t('signInToAccess')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {error && (
                                <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                                    {error}
                                </div>
                            )}
                            <Input 
                                type="email" 
                                placeholder="you@example.com" 
                                id="magic-email" 
                                label={t('emailAddress')}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required 
                            />
                        </CardContent>
                        <CardFooter className="flex-col gap-4">
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Sending...' : t('sendMagicLink')}
                            </Button>
                            <Button variant="link" onClick={() => setAuthMethod('password')}>{t('backToLogin')}</Button>
                        </CardFooter>
                    </form>
                );
             case 'magicLinkSent':
                return (
                    <div className="text-center p-8">
                        <MailIcon className="w-12 h-12 text-accent mx-auto mb-4" />
                        <h3 className="font-semibold text-lg">{t('checkYourEmail')}</h3>
                        <p className="text-muted-foreground text-sm">{t('magicLinkSent', { email })}</p>
                        <Button variant="link" className="mt-4" onClick={() => setAuthMethod('password')}>{t('backToLogin')}</Button>
                    </div>
                );
            case 'verificationSent':
                return (
                    <div className="text-center p-8 space-y-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                            <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                            </svg>
                        </div>
                        <h3 className="font-bold text-xl">Check Your Email</h3>
                        <p className="text-muted-foreground">
                            We've sent a verification link to <strong>{email}</strong>
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Please click the link in the email to verify your account and complete registration.
                        </p>
                        <div className="pt-4">
                            <Button variant="outline" onClick={() => setAuthMethod('password')} className="w-full">
                                {t('backToLogin')}
                            </Button>
                        </div>
                    </div>
                );
            case 'password':
            default:
                return (
                     <form onSubmit={handleLogin}>
                        <CardHeader className="text-center">
                           <LockIcon className="w-10 h-10 text-accent mx-auto mb-2" />
                            <CardTitle>{t('welcomeToVaultCloud')}</CardTitle>
                            <CardDescription>{t('signInToAccess')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {error && (
                                <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                                    {error}
                                </div>
                            )}
                            <Input 
                                type="email" 
                                placeholder="you@example.com" 
                                id="email" 
                                label={t('emailAddress')}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <Input 
                                type="password" 
                                placeholder="••••••••" 
                                id="password" 
                                label={t('password')}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </CardContent>
                        <CardFooter className="flex-col">
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Signing in...' : t('signIn')}
                            </Button>
                            <div className="relative my-6 w-full">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-card px-2 text-muted-foreground">{t('orContinueWith')}</span>
                                </div>
                            </div>
                            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <Button variant="outline" className="w-full" type="button" onClick={() => setAuthMethod('fido')}>
                                    <KeyIcon className="w-4 h-4 mr-2"/>
                                    {t('signInWithSecurityKey')}
                                </Button>
                                <Button variant="outline" className="w-full" type="button" onClick={() => setAuthMethod('magicLink')}>
                                    <MailIcon className="w-4 h-4 mr-2"/>
                                    {t('emailMagicLink')}
                                </Button>
                            </div>
                            <div className="mt-4 text-center text-sm">
                                Don't have an account?{' '}
                                <Button variant="link" className="p-0 h-auto" onClick={() => setAuthMethod('register')}>
                                    Create Account
                                </Button>
                            </div>
                        </CardFooter>
                    </form>
                );
        }
    }
    
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <Card className="w-full max-w-md overflow-hidden">
                {renderContent()}
            </Card>
        </div>
    );
};

export default AuthView;
