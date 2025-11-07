import React from 'react';
import { FidoKey } from '../../types';
import { PGPKeySet } from '../../services/pgpService';
import { useTheme } from '../../App';
import { useI18n } from '../../i18n';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Switch from '../../components/Switch';
import { SunIcon, MoonIcon } from '../../constants';

interface SettingsViewProps {
    is2FAEnabled: boolean;
    fidoKeys: FidoKey[];
    isPasswordLoginEnabled: boolean;
    pgpKey: PGPKeySet | null;
    onToggle2FA: () => void;
    onChangePassword: () => void;
    onExport: () => void;
    onImport: () => void;
    onAddFidoKey: () => void;
    onRemoveFidoKey: (keyId: string) => void;
    onTogglePasswordLogin: (enabled: boolean) => void;
    onManagePgpKey: () => void;
    onRemovePgpKey: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ 
    is2FAEnabled, fidoKeys, isPasswordLoginEnabled, pgpKey, 
    onToggle2FA, onChangePassword, onExport, onImport, onAddFidoKey, onRemoveFidoKey, onTogglePasswordLogin, onManagePgpKey, onRemovePgpKey 
}) => {
    const { theme, setTheme } = useTheme();
    const { t, language, setLanguage } = useI18n();
    const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');
    const canDisablePasswordLogin = fidoKeys.length > 0;

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold tracking-tight">{t('settings')}</h2>
            <div className="grid gap-8 max-w-4xl">
                <Card>
                    <CardHeader><CardTitle>{t('profile')}</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <Input label={t('emailAddress')} id="email" type="email" defaultValue="user@vaultcloud.dev" disabled />
                        <Button variant="outline" onClick={onChangePassword}>{t('changeMasterPassword')}</Button>
                    </CardContent>
                </Card>
                <Card>
                     <CardHeader>
                        <CardTitle>{t('security')}</CardTitle>
                      </CardHeader>
                    <CardContent className="space-y-6 divide-y divide-border">
                        <div className="pt-6 first:pt-0">
                            <h3 className="font-medium">{t('twoFactorAuth')}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{t('twoFactorAuthDesc')}</p>
                            <Button variant={is2FAEnabled ? "destructive" : "outline"} onClick={onToggle2FA}>
                                {is2FAEnabled ? t('disable2FA') : t('enable2FA')}
                            </Button>
                        </div>
                        <div className="pt-6">
                            <h3 className="font-medium">{t('securityKeys')}</h3>
                            <p className="text-sm text-muted-foreground mb-4">{t('securityKeysDesc')}</p>
                            <div className="space-y-2">
                                {fidoKeys.length > 0 ? (
                                    fidoKeys.map(key => (
                                        <div key={key.id} className="flex items-center justify-between p-3 border rounded-md">
                                            <div>
                                                <p className="font-medium">{key.name}</p>
                                                <p className="text-sm text-muted-foreground">{t('addedOn', {date: key.addedOn})}</p>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => onRemoveFidoKey(key.id)}>{t('remove')}</Button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground p-3 text-center">{t('noSecurityKeysRegistered')}</p>
                                )}
                            </div>
                            <Button variant="outline" className="mt-4" onClick={onAddFidoKey}>{t('addSecurityKey')}</Button>
                        </div>
                         <div className="pt-6">
                            <h3 className="font-medium">{t('allowPasswordLogin')}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{t('allowPasswordLoginDesc')}</p>
                            <div className="flex items-center space-x-2">
                                <Switch 
                                    checked={isPasswordLoginEnabled} 
                                    onCheckedChange={onTogglePasswordLogin} 
                                    disabled={!canDisablePasswordLogin && isPasswordLoginEnabled}
                                />
                                 <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                   {isPasswordLoginEnabled ? 'Enabled' : 'Disabled'}
                                </label>
                            </div>
                            {!canDisablePasswordLogin && (
                                <p className="text-xs text-destructive mt-2">{t('mustHaveSecurityKey')}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>{t('pgpEncryption')}</CardTitle>
                        <CardDescription>
                            End-to-end encryption ensures only you can decrypt your passwords, even the server cannot access them.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {pgpKey ? (
                            <div className="space-y-3">
                                <div className="p-4 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 rounded-md">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-semibold text-green-800 dark:text-green-200">✓ PGP Keys Configured</h4>
                                            <p className="text-sm text-green-700 dark:text-green-300 mt-1">Your vault is protected with end-to-end encryption.</p>
                                        </div>
                                        <Button variant="destructive" size="sm" onClick={onRemovePgpKey}>{t('removeKey')}</Button>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    💡 <strong>Tip:</strong> Make sure you've backed up your PGP keys and master password. 
                                    You'll need them to access your encrypted passwords on other devices or browsers.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-4 border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">⚠️ No PGP Keys Configured</h4>
                                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                                        Your passwords are not encrypted. To enable end-to-end encryption:
                                    </p>
                                    <ul className="text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside space-y-1">
                                        <li><strong>First time?</strong> Generate new PGP keys and save them securely</li>
                                        <li><strong>Using another browser/device?</strong> Import your existing PGP keys that you saved earlier</li>
                                        <li><strong>Lost your keys?</strong> Generate new ones (but you won't be able to decrypt old passwords)</li>
                                    </ul>
                                </div>
                                <Button variant="outline" onClick={onManagePgpKey} className="w-full md:w-auto">
                                    {t('addPgpKey')} (Generate or Import)
                                </Button>
                                <p className="text-xs text-muted-foreground">
                                    ℹ️ PGP keys are stored locally in your browser. You must save a backup to use them on other devices.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>{t('appearance')}</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <label htmlFor="theme" className="font-medium">{t('theme')}</label>
                            <Button onClick={toggleTheme} variant="outline" size="icon">
                                {theme === 'dark' ? <SunIcon className="w-5 h-5"/> : <MoonIcon className="w-5 h-5" />}
                            </Button>
                        </div>
                         <div className="flex items-center justify-between">
                             <label htmlFor="language-select" className="font-medium">Language</label>
                            <select id="language-select" value={language} onChange={(e) => setLanguage(e.target.value as 'en' | 'vi')} className="h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                                <option value="en">English</option>
                                <option value="vi">Tiếng Việt</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    {/* FIX: Corrected closing tag from </Header> to </CardHeader> to fix component mismatch. */}
                    <CardHeader>
                      <CardTitle>{t('vaultData')}</CardTitle>
                      <CardDescription>Export your vault data or import from another manager.</CardDescription>
                    </CardHeader>
                     <CardContent className="flex items-center gap-4">
                        <Button variant="outline" onClick={onExport}>{t('exportVault')}</Button>
                        <Button variant="outline" onClick={onImport}>{t('importVault')}</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default SettingsView;