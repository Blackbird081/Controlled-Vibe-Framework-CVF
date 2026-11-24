import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { THEME_DEFAULT, THEME_INIT_SCRIPT, THEME_STORAGE_KEY } from './theme-init-script';

// The blocking theme script must match ThemeProvider in theme.tsx (same key, same
// accepted values, same default). Source checks read the files; behaviour checks run
// the exact script string in jsdom with storage stubbed.
const themeSource = readFileSync(path.join(__dirname, 'theme.tsx'), 'utf8');
const layoutSource = readFileSync(path.join(__dirname, '../app/layout.tsx'), 'utf8');

function runScript(): void {
    new Function(THEME_INIT_SCRIPT)();
}

afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.classList.remove('dark');
});

describe('theme init script matches ThemeProvider in theme.tsx (source-level)', () => {
    it('reads the same storage key that ThemeProvider reads', () => {
        const keys = [...themeSource.matchAll(/localStorage\.getItem\('([^']+)'\)/g)].map((m) => m[1]);
        expect(keys.length).toBeGreaterThan(0);
        expect(keys.every((key) => key === THEME_STORAGE_KEY)).toBe(true);
        expect(THEME_INIT_SCRIPT).toContain(`getItem('${THEME_STORAGE_KEY}')`);
    });

    it('uses the same accepted values and default as ThemeProvider', () => {
        expect(themeSource).toContain("saved === 'light' || saved === 'dark' ? saved : 'dark'");
        expect(THEME_DEFAULT).toBe('dark');
        expect(THEME_INIT_SCRIPT).toContain("saved === 'light' || saved === 'dark'");
        expect(THEME_INIT_SCRIPT).toContain(`var theme = '${THEME_DEFAULT}'`);
    });

    it('is rendered in the <head> of the root layout, before <body>, with suppressHydrationWarning on <html>', () => {
        const head = layoutSource.indexOf('<head>');
        const script = layoutSource.indexOf('<script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />');
        const body = layoutSource.indexOf('<body');
        expect(head).toBeGreaterThan(0);
        expect(script).toBeGreaterThan(head);
        expect(body).toBeGreaterThan(script);
        expect(layoutSource).toContain('<html lang="en" suppressHydrationWarning>');
    });
});

describe('theme init script behaviour (jsdom, storage stubbed)', () => {
    it('adds the dark class when the saved theme is dark', () => {
        vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('dark');
        runScript();
        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('removes the dark class when the saved theme is light', () => {
        document.documentElement.classList.add('dark');
        vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('light');
        runScript();
        expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('defaults to dark when nothing is saved', () => {
        vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
        runScript();
        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('defaults to dark for an unrecognised saved value', () => {
        vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('sepia');
        runScript();
        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('defaults to dark and does not throw when storage access throws', () => {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('storage blocked');
        });
        expect(() => runScript()).not.toThrow();
        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
});
