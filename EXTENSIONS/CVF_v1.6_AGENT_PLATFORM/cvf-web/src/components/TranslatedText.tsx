'use client';

import { useLanguage } from '@/lib/i18n';

export function TranslatedText({ translationKey }: { translationKey: string }) {
    const { t } = useLanguage();
    return t(translationKey);
}
