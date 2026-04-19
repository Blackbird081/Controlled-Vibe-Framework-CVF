'use client';

import { LanguageToggle } from '@/lib/i18n';
import { ThemeToggle } from '@/lib/theme';

export function AdminHeaderActions() {
    return (
        <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
        </div>
    );
}
