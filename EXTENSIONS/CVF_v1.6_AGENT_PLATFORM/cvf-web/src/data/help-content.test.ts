import { describe, it, expect } from 'vitest';
import { HELP_CONTENT } from './help-content';
import type { Lang } from './help-content';

// Indices used by help/page.tsx supportCards
const CARD_INDICES = [0, 2, 5, 6] as const;
const LOCALES: Lang[] = ['vi', 'en'];

// Modal-opening links must route through the dashboard layout, not the root page
const ROOT_OPEN_PATTERN = /^\/?(\?|#)/;

describe('HELP_CONTENT', () => {
    for (const lang of LOCALES) {
        describe(`locale: ${lang}`, () => {
            const content = HELP_CONTENT[lang];

            it('has a features array with at least 7 entries', () => {
                expect(content.features.length).toBeGreaterThanOrEqual(7);
            });

            describe('supportCards (features[0,2,5,6]) — all must have a link', () => {
                for (const idx of CARD_INDICES) {
                    it(`features[${idx}] (${content.features[idx]?.title}) has a link`, () => {
                        const feature = content.features[idx];
                        expect(feature).toBeDefined();
                        expect(feature.link).toBeTruthy();
                    });
                }
            });

            describe('modal-opening links must use /home?open=<modal>, not /?open=<modal>', () => {
                it('no feature link bypasses the dashboard layout via root /?open=', () => {
                    const badLinks = content.features
                        .filter(f => f.link && ROOT_OPEN_PATTERN.test(f.link))
                        .map(f => `features["${f.title}"].link = "${f.link}"`);
                    expect(badLinks).toEqual([]);
                });
            });

            describe('modal links target correct dashboard routes', () => {
                it('Agent Chat (features[0]) opens via /home?open=agent', () => {
                    expect(content.features[0].link).toBe('/home?open=agent');
                });

                it('Self-UAT (features[2]) opens via /home?open=agent', () => {
                    expect(content.features[2].link).toBe('/home?open=agent');
                });

                it('Multi-Agent (features[5]) opens via /home?open=multi-agent', () => {
                    expect(content.features[5].link).toBe('/home?open=multi-agent');
                });

                it('Toolkit Guide (features[6]) routes to /help/toolkit', () => {
                    expect(content.features[6].link).toBe('/help/toolkit');
                });
            });
        });
    }

    it('vi and en have consistent link values for all card indices', () => {
        for (const idx of CARD_INDICES) {
            expect(HELP_CONTENT.vi.features[idx].link).toBe(
                HELP_CONTENT.en.features[idx].link,
            );
        }
    });
});
