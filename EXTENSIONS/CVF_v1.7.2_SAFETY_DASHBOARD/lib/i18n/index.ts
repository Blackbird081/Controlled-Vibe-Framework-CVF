// lib/i18n/index.ts
// i18n entry point for CVF Safety Dashboard v1.7.2
// Default locale: Vietnamese (vi) — CVF is designed for Vietnamese non-coders.

import { vi, type TranslationKey } from './vi'
import { en } from './en'

export type Locale = 'vi' | 'en'

const translations: Record<Locale, TranslationKey> = { vi, en }

let currentLocale: Locale = 'vi'

export function setLocale(locale: Locale): void {
    currentLocale = locale
}

export function getLocale(): Locale {
    return currentLocale
}

export function t(): TranslationKey {
    return translations[currentLocale]
}

export { vi, en }
