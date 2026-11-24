'use client';

import { useLanguage } from '@/lib/i18n';
import { statusLabel } from '@/lib/presentation-labels';

export function OperatorStatusText({ value }: { value: string }) {
    const { language } = useLanguage();
    return statusLabel(value, language);
}
