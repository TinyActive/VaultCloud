import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import en from './locales/en.tsx';
import vi from './locales/vi.tsx';

type Translations = typeof en;
type Language = 'en' | 'vi';

interface I18nContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: keyof Translations, replacements?: { [key: string]: string | number }) => string;
}

const translations: { [key in Language]: Translations } = { en, vi };

export const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>(() => {
        const savedLang = localStorage.getItem('vaultcloud-lang') as Language;
        return savedLang || 'en';
    });

    useEffect(() => {
        localStorage.setItem('vaultcloud-lang', language);
    }, [language]);

    const t = (key: keyof Translations, replacements?: { [key: string]: string | number }): string => {
        let translation = translations[language]?.[key] || translations['en'][key];
        if (replacements) {
            Object.keys(replacements).forEach(rKey => {
                const regex = new RegExp(`\\{${rKey}\\}`, 'g');
                translation = translation.replace(regex, String(replacements[rKey]));
            });
        }
        return translation;
    };

    const value = useMemo(() => ({
        language,
        setLanguage,
        t
    }), [language]);

    return (
        <I18nContext.Provider value={value}>
            {children}
        </I18nContext.Provider>
    );
};

export const useI18n = () => {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within an I18nProvider');
    }
    return context;
};