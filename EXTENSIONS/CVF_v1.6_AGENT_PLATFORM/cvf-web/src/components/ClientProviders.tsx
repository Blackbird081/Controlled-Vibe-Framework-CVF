'use client';

import { ReactNode } from 'react';
import { LanguageProvider } from '@/lib/i18n';
import { ThemeProvider } from '@/lib/theme';
import { ErrorBoundary, ToastContainer } from '@/lib/error-handling';

export function ClientProviders({ children }: { children: ReactNode }) {
    return (
        <ThemeProvider>
            <LanguageProvider>
                <ErrorBoundary>
                    {children}
                    <ToastContainer />
                </ErrorBoundary>
            </LanguageProvider>
        </ThemeProvider>
    );
}
