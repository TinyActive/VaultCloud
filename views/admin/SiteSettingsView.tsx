import React, { useState, useEffect } from 'react';
import { useI18n } from '../../i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Switch from '../../components/Switch';
import Toast from '../../components/Toast';
import apiService from '../../services/apiService';
import { CheckIcon, AlertTriangleIcon } from '../../constants';

interface SiteSettings {
    id: string;
    registration_enabled: number;
    email_verification_enabled: number;
    resend_api_key: string | null;
    updated_at: number;
    updated_by: string | null;
}

const SiteSettingsView: React.FC = () => {
    const { t } = useI18n();
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    
    // Form state
    const [registrationEnabled, setRegistrationEnabled] = useState(true);
    const [emailVerificationEnabled, setEmailVerificationEnabled] = useState(false);
    const [resendApiKey, setResendApiKey] = useState('');
    const [showApiKey, setShowApiKey] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const data = await apiService.getSiteSettings();
            setSettings(data);
            setRegistrationEnabled(data.registration_enabled === 1);
            setEmailVerificationEnabled(data.email_verification_enabled === 1);
            setResendApiKey(data.resend_api_key || '');
        } catch (error) {
            console.error('Failed to load site settings:', error);
            setToast({
                message: error instanceof Error ? error.message : t('failedToLoadSettings'),
                type: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            // Validate: if email verification is enabled, resend_api_key must be provided
            if (emailVerificationEnabled && !resendApiKey.trim()) {
                setToast({
                    message: t('resendApiKeyRequired'),
                    type: 'error',
                });
                return;
            }

            setSaving(true);
            await apiService.updateSiteSettings({
                registration_enabled: registrationEnabled,
                email_verification_enabled: emailVerificationEnabled,
                resend_api_key: resendApiKey.trim() || undefined,
            });

            setToast({
                message: t('settingsSavedSuccessfully'),
                type: 'success',
            });

            // Reload settings to get updated data
            await loadSettings();
        } catch (error) {
            console.error('Failed to save settings:', error);
            setToast({
                message: error instanceof Error ? error.message : t('failedToSaveSettings'),
                type: 'error',
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-6 py-12 max-w-7xl">
                <div className="flex items-center justify-center min-h-[500px]">
                    <div className="text-center space-y-4">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto"></div>
                        <p className="text-muted-foreground text-lg">{t('loading') || 'Loading...'}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 py-12 max-w-7xl">
            <div className="space-y-10">
                {/* Header Section */}
                <div className="space-y-4 pb-6 border-b-2 border-border">
                    <h1 className="text-4xl font-bold tracking-tight text-foreground">
                        {t('siteSettings') || 'Site Settings'}
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-4xl leading-relaxed">
                        {t('siteSettingsDescription') || 'Configure global site settings and user registration options'}
                    </p>
                </div>

                {/* Registration Settings Card */}
                <Card className="shadow-md border-2">
                    <CardHeader className="space-y-4 pb-8">
                        <CardTitle className="text-2xl font-bold">
                            {t('registrationSettings') || 'Registration Settings'}
                        </CardTitle>
                        <CardDescription className="text-base leading-relaxed">
                            {t('registrationSettingsDescription') || 'Control whether new users can register for accounts'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 p-8 bg-muted/40 rounded-xl border-2 border-border">
                            <div className="space-y-3 flex-1">
                                <label className="text-lg font-bold text-foreground block">
                                    {t('allowRegistration') || 'Allow Registration'}
                                </label>
                                <p className="text-base text-muted-foreground leading-relaxed">
                                    {t('allowRegistrationDescription') || 'When enabled, new users can create accounts. When disabled, only administrators can create accounts.'}
                                </p>
                            </div>
                            <div className="shrink-0 flex items-center pt-2">
                                <Switch
                                    checked={registrationEnabled}
                                    onCheckedChange={setRegistrationEnabled}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Email Verification Settings Card */}
                <Card className="shadow-md border-2">
                    <CardHeader className="space-y-4 pb-8">
                        <CardTitle className="text-2xl font-bold">
                            {t('emailVerificationSettings') || 'Email Verification Settings'}
                        </CardTitle>
                        <CardDescription className="text-base leading-relaxed">
                            {t('emailVerificationSettingsDescription') || 'Configure email verification requirements and Resend API integration'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-8">
                        {/* Toggle Section */}
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 p-8 bg-muted/40 rounded-xl border-2 border-border">
                            <div className="space-y-3 flex-1">
                                <label className="text-lg font-bold text-foreground block">
                                    {t('enableEmailVerification') || 'Enable Email Verification'}
                                </label>
                                <p className="text-base text-muted-foreground leading-relaxed">
                                    {t('enableEmailVerificationDescription') || 'When enabled, users must verify their email address after registration before they can log in.'}
                                </p>
                            </div>
                            <div className="shrink-0 flex items-center pt-2">
                                <Switch
                                    checked={emailVerificationEnabled}
                                    onCheckedChange={setEmailVerificationEnabled}
                                />
                            </div>
                        </div>

                        {/* API Key Section - Only shown when enabled */}
                        {emailVerificationEnabled && (
                            <div className="space-y-8 pt-6 mt-6 border-t-2 border-border">
                                <div className="space-y-4">
                                    <label 
                                        htmlFor="resend-api-key" 
                                        className="text-lg font-bold text-foreground block"
                                    >
                                        {t('resendApiKey') || 'Resend API Key'} <span className="text-red-500 text-xl">*</span>
                                    </label>
                                    <p className="text-base text-muted-foreground leading-relaxed">
                                        {t('resendApiKeyDescription') || 'Your Resend API key for sending verification emails. Get one at https://resend.com'}
                                    </p>
                                </div>
                                
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex-1">
                                        <Input
                                            id="resend-api-key"
                                            type={showApiKey ? 'text' : 'password'}
                                            value={resendApiKey}
                                            onChange={(e) => setResendApiKey(e.target.value)}
                                            placeholder="re_xxxxxxxxxxxxxxxxxxxx"
                                            className="font-mono text-base w-full h-14 px-4"
                                        />
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowApiKey(!showApiKey)}
                                        className="shrink-0 h-14 px-8 font-semibold text-base"
                                    >
                                        {showApiKey ? '🙈 ' + (t('hide') || 'Hide') : '👁️ ' + (t('show') || 'Show')}
                                    </Button>
                                </div>
                                
                                {/* Warning Box */}
                                <div className="flex items-start gap-6 p-6 bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-400 dark:border-amber-600 rounded-xl">
                                    <AlertTriangleIcon className="w-8 h-8 text-amber-600 dark:text-amber-500 shrink-0 mt-1" />
                                    <div className="space-y-3 flex-1">
                                        <p className="font-bold text-amber-900 dark:text-amber-200 text-base">
                                            {t('resendApiKeyNote') || '⚠️ Security Notice'}
                                        </p>
                                        <p className="text-base text-amber-800 dark:text-amber-300 leading-relaxed">
                                            {t('resendApiKeyNoteDescription') || 'Your API key is stored securely in the database. It will only be used to send email verification messages to new users.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-5 pt-8 border-t-2 border-border">
                    <Button
                        variant="outline"
                        onClick={loadSettings}
                        disabled={saving}
                        className="w-full sm:w-auto h-14 px-10 font-bold text-base"
                    >
                        🔄 {t('reset') || 'Reset'}
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full sm:w-auto h-14 px-10 font-bold text-base min-w-[200px] bg-primary hover:bg-primary/90"
                    >
                        {saving ? (
                            <div className="flex items-center gap-3 justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                <span>{t('saving') || 'Saving...'}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 justify-center">
                                <CheckIcon className="w-5 h-5" />
                                <span>{t('saveChanges') || 'Save Changes'}</span>
                            </div>
                        )}
                    </Button>
                </div>
            </div>

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

export default SiteSettingsView;
