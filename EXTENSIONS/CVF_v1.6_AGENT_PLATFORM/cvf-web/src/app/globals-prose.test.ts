import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// Guards the self-contained .prose markdown styles in globals.css. The plugin
// @tailwindcss/typography is not installed, so these rules are the only source of
// markdown structure and readable colour for ResultViewer and other .prose users.
// All assertions are source-level (text of globals.css). They do not prove the
// rendered cascade in a browser.

const css = readFileSync(path.join(__dirname, 'globals.css'), 'utf8');

interface Block {
    header: string;
    body: string;
    start: number;
    end: number;
}

// Finds every block opened by `opener` (a regex that ends just before its '{') and
// returns the balanced-brace body. Brace matching keeps nested rules intact.
function findBlocks(text: string, opener: RegExp): Block[] {
    const flags = opener.flags.includes('g') ? opener.flags : `${opener.flags}g`;
    const re = new RegExp(opener.source, flags);
    const blocks: Block[] = [];
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
        const bodyStart = match.index + match[0].length;
        let depth = 1;
        let i = bodyStart;
        while (i < text.length && depth > 0) {
            if (text[i] === '{') depth++;
            else if (text[i] === '}') depth--;
            i++;
        }
        blocks.push({
            header: match[0].replace(/\s+/g, ' ').trim(),
            body: text.slice(bodyStart, i - 1),
            start: match.index,
            end: i,
        });
    }
    return blocks;
}

function layerComponentsBody(): string {
    const [layer] = findBlocks(css, /@layer components\s*\{/);
    return layer ? layer.body : '';
}

function mediaBlocks(header: string): Block[] {
    return findBlocks(css, new RegExp(`@media ${header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{`));
}

function stripMedia(text: string): string {
    const all = findBlocks(text, /@media[^{]*\{/).sort((a, b) => b.start - a.start);
    let out = text;
    for (const block of all) {
        out = out.slice(0, block.start) + out.slice(block.end);
    }
    return out;
}

function ruleBody(text: string, selector: string): string | null {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = new RegExp(`(?:^|\\n)\\s*${escaped}\\s*\\{([^}]*)\\}`).exec(text);
    return match ? match[1] : null;
}

function declaredProperty(body: string | null, property: string): string | null {
    if (!body) return null;
    const match = new RegExp(`(?:^|[\\s;{])${property}:\\s*([^;]+);`).exec(body);
    return match ? match[1].trim() : null;
}

function declaredColor(body: string | null): string | null {
    const value = declaredProperty(body, 'color');
    return value && /^#[0-9a-fA-F]{6}$/.test(value) ? value.toLowerCase() : null;
}

function remValue(value: string | null): number {
    const match = /^([\d.]+)rem$/.exec(value ?? '');
    return match ? Number(match[1]) : Number.NaN;
}

function channelLuminance(channel: number): number {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
    const n = parseInt(hex.slice(1), 16);
    const r = channelLuminance((n >> 16) & 0xff);
    const g = channelLuminance((n >> 8) & 0xff);
    const b = channelLuminance(n & 0xff);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(foreground: string, background: string): number {
    const a = relativeLuminance(foreground);
    const b = relativeLuminance(background);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

describe('globals.css .prose markdown styles (source-level evidence only)', () => {
    const layer = layerComponentsBody();

    it('keeps the Google Fonts @import before @import "tailwindcss"', () => {
        const fontsIndex = css.indexOf('@import url(');
        const tailwindIndex = css.indexOf('@import "tailwindcss"');
        expect(fontsIndex).toBeGreaterThanOrEqual(0);
        expect(tailwindIndex).toBeGreaterThan(fontsIndex);
    });

    it('places the new .prose block inside @layer components so utilities still win', () => {
        expect(layer.length).toBeGreaterThan(0);
        expect(layer).toContain('.prose :where(');
        expect(layer).toContain('.dark .prose :where(th)');
        // No .prose element rule may exist outside the layer.
        const total = css.split('.prose :where(').length - 1;
        const inLayer = layer.split('.prose :where(').length - 1;
        expect(inLayer).toBeGreaterThan(0);
        expect(inLayer).toBe(total);
    });

    it('declares an explicit light text colour on .prose', () => {
        expect(declaredColor(ruleBody(layer, '.prose'))).not.toBeNull();
    });

    it('declares an explicit dark text colour on .dark .prose', () => {
        expect(declaredColor(ruleBody(layer, '.dark .prose'))).not.toBeNull();
    });

    it('renders unordered lists as disc and ordered lists as decimal under .prose', () => {
        expect(ruleBody(layer, '.prose :where(ul)')).toMatch(/list-style-type:\s*disc/);
        expect(ruleBody(layer, '.prose :where(ol)')).toMatch(/list-style-type:\s*decimal/);
    });

    it('keeps desktop h1 and h2 font-size only inside a media block (never unconditional)', () => {
        const withoutMedia = stripMedia(css);
        expect(ruleBody(withoutMedia, '.prose :where(h1)')).toBeNull();
        expect(ruleBody(withoutMedia, '.prose :where(h2)')).toBeNull();
        const desktop = mediaBlocks('not all and (max-width: 640px)');
        expect(desktop.length).toBe(1);
        expect(declaredProperty(ruleBody(desktop[0].body, '.prose :where(h1)'), 'font-size')).toBe('1.875rem');
        expect(declaredProperty(ruleBody(desktop[0].body, '.prose :where(h2)'), 'font-size')).toBe('1.5rem');
    });

    it('keeps the existing mobile .prose font-size and h1/h2 rules at max-width 640px', () => {
        const mobile = mediaBlocks('(max-width: 640px)');
        expect(mobile.length).toBeGreaterThanOrEqual(1);
        const unlayered = mobile[0].body;
        expect(declaredProperty(ruleBody(unlayered, '.prose'), 'font-size')).toBe('0.95rem');
        expect(declaredProperty(ruleBody(unlayered, '.prose h1'), 'font-size')).toBe('1.25rem');
        expect(declaredProperty(ruleBody(unlayered, '.prose h2'), 'font-size')).toBe('1.125rem');
    });

    it('keeps mobile heading sizes strictly decreasing: h1 > h2 > h3 > h4', () => {
        const mobile = mediaBlocks('(max-width: 640px)');
        const h1 = remValue(declaredProperty(ruleBody(mobile[0].body, '.prose h1'), 'font-size'));
        const h2 = remValue(declaredProperty(ruleBody(mobile[0].body, '.prose h2'), 'font-size'));
        const layeredMobile = mobile.find((block) => block.body.includes('.prose :where(h3)'));
        expect(layeredMobile).toBeDefined();
        const body = layeredMobile ? layeredMobile.body : '';
        const h3 = remValue(declaredProperty(ruleBody(body, '.prose :where(h3)'), 'font-size'));
        const h4 = remValue(declaredProperty(ruleBody(body, '.prose :where(h4)'), 'font-size'));
        expect(h1).toBeGreaterThan(h2);
        expect(h2).toBeGreaterThan(h3);
        expect(h3).toBeGreaterThan(h4);
    });

    it('keeps desktop heading sizes strictly decreasing: h1 > h2 > h3 > h4', () => {
        const desktop = mediaBlocks('not all and (max-width: 640px)')[0].body;
        const sizes = ['h1', 'h2', 'h3', 'h4'].map((tag) =>
            remValue(declaredProperty(ruleBody(desktop, `.prose :where(${tag})`), 'font-size')),
        );
        expect(sizes[0]).toBeGreaterThan(sizes[1]);
        expect(sizes[1]).toBeGreaterThan(sizes[2]);
        expect(sizes[2]).toBeGreaterThan(sizes[3]);
    });

    it('documents that prose-* modifiers remain no-ops because the plugin is not installed', () => {
        expect(css).toMatch(/prose-lg/);
        expect(css).toMatch(/NO-OPS/);
    });

    it('meets WCAG AA (>= 4.5:1) for light text on white', () => {
        const light = declaredColor(ruleBody(layer, '.prose'));
        expect(light).not.toBeNull();
        expect(contrastRatio(light as string, '#ffffff')).toBeGreaterThanOrEqual(4.5);
    });

    it('meets WCAG AA (>= 4.5:1) for dark text on dark:bg-gray-800 (#1f2937)', () => {
        const dark = declaredColor(ruleBody(layer, '.dark .prose'));
        expect(dark).not.toBeNull();
        expect(contrastRatio(dark as string, '#1f2937')).toBeGreaterThanOrEqual(4.5);
    });

    it('meets WCAG AA (>= 4.5:1) for dark text on the dark:bg-gray-900/40 pack box', () => {
        // gray-900/40 over gray-800 is darker than gray-800, so checking against
        // gray-900 (#111827) is the stricter bound for the pack box.
        const dark = declaredColor(ruleBody(layer, '.dark .prose'));
        expect(contrastRatio(dark as string, '#111827')).toBeGreaterThanOrEqual(4.5);
    });
});

describe('app theme follows the .dark class, not the OS colour scheme (source-level evidence only)', () => {
    const light = ruleBody(css, ':root');
    const dark = ruleBody(css, ':root.dark');

    it('has no @media query keyed on prefers-color-scheme (comments may still mention it)', () => {
        expect(css).not.toMatch(/@media[^{]*prefers-color-scheme/);
    });

    it('defines the light body colour variables on :root', () => {
        expect(declaredProperty(light, '--foreground-rgb')).toBe('0, 0, 0');
        expect(declaredProperty(light, '--background-end-rgb')).toBe('255, 255, 255');
    });

    it('defines the dark body colour variables under .dark (app theme class)', () => {
        expect(dark).not.toBeNull();
        expect(declaredProperty(dark, '--foreground-rgb')).toBe('255, 255, 255');
        expect(declaredProperty(dark, '--background-start-rgb')).toBe('0, 0, 0');
        expect(declaredProperty(dark, '--background-end-rgb')).toBe('0, 0, 0');
    });

    it('drives the body colour from --foreground-rgb', () => {
        expect(declaredProperty(ruleBody(css, 'body'), 'color')).toBe('rgb(var(--foreground-rgb))');
    });
});

describe('ResultViewer "Checked by CVF Safety" caption (source-level evidence only)', () => {
    const source = readFileSync(path.join(__dirname, '../components/ResultViewer.tsx'), 'utf8');
    const marker = "'Checked by CVF Safety'";
    const markerIndex = source.indexOf(marker);
    const before = source.slice(0, markerIndex);
    const classStart = before.lastIndexOf('className="');
    const valueStart = classStart + 'className="'.length;
    const classes = classStart >= 0 ? before.slice(valueStart, before.indexOf('"', valueStart)) : '';

    it('locates the caption and its className in ResultViewer.tsx', () => {
        expect(markerIndex).toBeGreaterThan(0);
        expect(classStart).toBeGreaterThanOrEqual(0);
    });

    it('uses text-gray-600 for light mode and dark:text-gray-400 for dark mode', () => {
        expect(classes).toMatch(/(^|\s)text-gray-600(\s|$)/);
        expect(classes).toMatch(/(^|\s)dark:text-gray-400(\s|$)/);
        expect(classes).not.toMatch(/(^|\s)text-gray-400(\s|$)/);
    });

    it('meets WCAG AA (>= 4.5:1) for text-gray-600 on each light safety-badge background', () => {
        for (const bg of ['#ffffff', '#ecfdf5', '#fffbeb', '#fff7ed', '#fef2f2']) {
            expect(contrastRatio('#4b5563', bg)).toBeGreaterThanOrEqual(4.5);
        }
    });

    it('meets WCAG AA (>= 4.5:1) for dark:text-gray-400 on the dark page surface (#1f2937)', () => {
        expect(contrastRatio('#9ca3af', '#1f2937')).toBeGreaterThanOrEqual(4.5);
    });
});

describe('ResultViewer safety-badge issues line (source-level evidence only)', () => {
    const source = readFileSync(path.join(__dirname, '../components/ResultViewer.tsx'), 'utf8');
    const marker = '{safety.issues.join(\', \')}';
    const markerIndex = source.indexOf(marker);
    const before = source.slice(0, markerIndex);
    const classStart = before.lastIndexOf('className="');
    const valueStart = classStart + 'className="'.length;
    const classes = classStart >= 0 ? before.slice(valueStart, before.indexOf('"', valueStart)) : '';

    it('locates the issues line and its className in ResultViewer.tsx', () => {
        expect(markerIndex).toBeGreaterThan(0);
        expect(classStart).toBeGreaterThanOrEqual(0);
    });

    it('uses text-gray-600 for light mode and dark:text-gray-400 for dark mode, not text-gray-500', () => {
        expect(classes).toMatch(/(^|\s)text-gray-600(\s|$)/);
        expect(classes).toMatch(/(^|\s)dark:text-gray-400(\s|$)/);
        expect(classes).not.toMatch(/(^|\s)text-gray-500(\s|$)/);
    });

    it('meets WCAG AA (>= 4.5:1) for text-gray-600 on each light safety-badge background', () => {
        for (const bg of ['#ffffff', '#ecfdf5', '#fffbeb', '#fff7ed', '#fef2f2']) {
            expect(contrastRatio('#4b5563', bg)).toBeGreaterThanOrEqual(4.5);
        }
    });
});
