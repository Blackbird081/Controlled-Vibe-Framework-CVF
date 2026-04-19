'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import vi from './i18n/vi.json';
import en from './i18n/en.json';

type Language = 'vi' | 'en';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
    mounted: boolean;
}

const translations: Record<Language, Record<string, string>> = { vi, en };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>('vi');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        try {
            const saved = window.localStorage.getItem('cvf_language');
            if (saved === 'vi' || saved === 'en') {
                setLanguageState(saved);
                document.documentElement.lang = saved;
            } else {
                document.documentElement.lang = 'vi';
            }
        } finally {
            setMounted(true);
        }
    }, []);

    useEffect(() => {
        document.documentElement.lang = language;
    }, [language]);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('cvf_language', lang);
        document.documentElement.lang = lang;
    };

    const t = (key: string): string => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, mounted }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

// Language toggle component
export function LanguageToggle() {
    const { language, setLanguage, t } = useLanguage();

    const toggleLanguage = () => {
        setLanguage(language === 'vi' ? 'en' : 'vi');
    };

    return (
        <button
            onClick={toggleLanguage}
            className="px-3 py-1.5 text-sm font-bold rounded-lg transition-all
                      bg-gray-100 dark:bg-gray-700 
                      text-gray-700 dark:text-gray-200
                      hover:bg-blue-100 dark:hover:bg-blue-900 
                      hover:text-blue-600 dark:hover:text-blue-400
                      border border-gray-200 dark:border-gray-600"
            title={t('lang.current')}
        >
            {language === 'vi' ? '🌐 EN' : '🌐 VI'}
        </button>
    );
}
