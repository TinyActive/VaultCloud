import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { LockIcon } from '../constants';

export default function VerifyEmailView() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verifyEmail = async () => {
            const token = searchParams.get('token');
            
            if (!token) {
                setStatus('error');
                setMessage('Invalid verification link. Please check your email and try again.');
                return;
            }

            try {
                const response = await fetch(`/api/auth/verify-email?token=${token}`);
                const data = await response.json();

                if (data.success) {
                    setStatus('success');
                    setMessage('Your email has been verified successfully!');
                    
                    // Store token if provided
                    if (data.data?.token) {
                        localStorage.setItem('token', data.data.token);
                    }

                    // Redirect to dashboard after 2 seconds
                    setTimeout(() => {
                        navigate('/dashboard');
                    }, 2000);
                } else {
                    setStatus('error');
                    setMessage(data.error || 'Verification failed. The link may have expired.');
                }
            } catch (error) {
                setStatus('error');
                setMessage('An error occurred during verification. Please try again.');
                console.error('Verification error:', error);
            }
        };

        verifyEmail();
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
            <div className="w-full max-w-md">
                <div className="bg-card border-2 border-border rounded-2xl shadow-2xl p-8 space-y-8">
                    {/* Header */}
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
                            <LockIcon className="w-10 h-10 text-primary" />
                        </div>
                        <h1 className="text-3xl font-bold">Email Verification</h1>
                    </div>

                    {/* Status Content */}
                    <div className="text-center space-y-4">
                        {status === 'verifying' && (
                            <>
                                <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto"></div>
                                <p className="text-lg text-muted-foreground">
                                    Verifying your email address...
                                </p>
                            </>
                        )}

                        {status === 'success' && (
                            <>
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                                    <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    Success!
                                </h2>
                                <p className="text-lg text-muted-foreground">
                                    {message}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Redirecting to dashboard...
                                </p>
                            </>
                        )}

                        {status === 'error' && (
                            <>
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                                    <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">
                                    Verification Failed
                                </h2>
                                <p className="text-base text-muted-foreground">
                                    {message}
                                </p>
                                <button
                                    onClick={() => navigate('/')}
                                    className="mt-6 inline-flex items-center justify-center px-6 py-3 text-base font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                                >
                                    Go to Login
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <p className="mt-8 text-center text-sm text-muted-foreground">
                    Need help? Contact support at{' '}
                    <a href="mailto:support@vaultcloud.app" className="text-primary hover:underline">
                        support@vaultcloud.app
                    </a>
                </p>
            </div>
        </div>
    );
}
