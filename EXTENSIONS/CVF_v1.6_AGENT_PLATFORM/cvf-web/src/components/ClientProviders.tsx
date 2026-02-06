'use client';

import { ReactNode } from 'react';
import { LanguageProvider } from '@/lib/i18n';
import { ThemeProvider } from '@/lib/theme';

export function ClientProviders({ children }: { children: ReactNode }) {
    return (
        <ThemeProvider>
            <LanguageProvider>
                {children}
            </LanguageProvider>
        </ThemeProvider>
    );
}
