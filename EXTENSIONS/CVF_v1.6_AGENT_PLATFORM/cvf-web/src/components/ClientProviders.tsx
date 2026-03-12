'use client';

import { ReactNode } from 'react';
import { LanguageProvider } from '@/lib/i18n';
import { ThemeProvider } from '@/lib/theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ToastContainer } from '@/lib/error-handling';
import { SessionProvider } from 'next-auth/react';

export function ClientProviders({ children }: { children: ReactNode }) {
    return (
        <SessionProvider>
            <ThemeProvider>
                <LanguageProvider>
                    <ErrorBoundary>
                        {children}
                        <ToastContainer />
                    </ErrorBoundary>
                </LanguageProvider>
            </ThemeProvider>
        </SessionProvider>
    );
}
