'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import viLocale from './vi.json';
import enLocale from './en.json';

export type Locale = 'vi' | 'en';

type LocaleData = typeof viLocale;

const locales: Record<Locale, LocaleData> = {
    vi: viLocale,
    en: enLocale,
};

interface I18nContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('cvf_locale') as Locale;
            return saved || 'vi';
        }
        return 'vi';
    });

    const setLocale = useCallback((newLocale: Locale) => {
        setLocaleState(newLocale);
        if (typeof window !== 'undefined') {
            localStorage.setItem('cvf_locale', newLocale);
        }
    }, []);

    const t = useCallback((key: string): string => {
        const keys = key.split('.');
        let value: any = locales[locale];

        for (const k of keys) {
            value = value?.[k];
        }

        return typeof value === 'string' ? value : key;
    }, [locale]);

    return (
        <I18nContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within I18nProvider');
    }
    return context;
}

export function LanguageSwitcher() {
    const { locale, setLocale } = useI18n();

    return (
        <button
            onClick={() => setLocale(locale === 'vi' ? 'en' : 'vi')}
            className="px-3 py-1.5 rounded-lg text-sm font-medium
                 bg-gray-100 dark:bg-gray-800 
                 text-gray-700 dark:text-gray-300
                 hover:bg-gray-200 dark:hover:bg-gray-700
                 transition-colors flex items-center gap-1.5"
            title={locale === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
        >
            {locale === 'vi' ? '🇻🇳 VI' : '🇺🇸 EN'}
        </button>
    );
}
