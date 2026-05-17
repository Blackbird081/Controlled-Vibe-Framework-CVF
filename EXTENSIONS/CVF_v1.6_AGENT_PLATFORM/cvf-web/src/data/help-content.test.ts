import { describe, it, expect } from 'vitest';
import { HELP_CONTENT } from './help-content';
import type { Lang } from './help-content';

const LOCALES: Lang[] = ['vi', 'en'];

// Indices used by help/page.tsx supportCards
const MODAL_CARD_INDICES = [0, 2, 5] as const; // Agent Chat, Self-UAT, Multi-Agent
const LINK_CARD_INDICES = [6] as const;         // Toolkit Guide

describe('HELP_CONTENT', () => {
    for (const lang of LOCALES) {
        describe(`locale: ${lang}`, () => {
            const content = HELP_CONTENT[lang];

            it('has a features array with at least 7 entries', () => {
                expect(content.features.length).toBeGreaterThanOrEqual(7);
            });

            describe('modal cards (features[0,2,5]) use event, not link', () => {
                it('Agent Chat (features[0]) has event cvf:openAgent', () => {
                    expect(content.features[0].event).toBe('cvf:openAgent');
                    expect(content.features[0].link).toBeUndefined();
                });

                it('Self-UAT (features[2]) has event cvf:openAgent', () => {
                    expect(content.features[2].event).toBe('cvf:openAgent');
                    expect(content.features[2].link).toBeUndefined();
                });

                it('Multi-Agent (features[5]) has event cvf:openMultiAgent', () => {
                    expect(content.features[5].event).toBe('cvf:openMultiAgent');
                    expect(content.features[5].link).toBeUndefined();
                });
            });

            describe('page-nav cards (features[6]) use link, not event', () => {
                it('Toolkit Guide (features[6]) has link /help/toolkit', () => {
                    expect(content.features[6].link).toBe('/help/toolkit');
                    expect(content.features[6].event).toBeUndefined();
                });
            });

            it('no modal card uses /?open= or /home?open= (navigates away from current page)', () => {
                const bad = content.features
                    .filter(f => f.link?.includes('?open='))
                    .map(f => `features["${f.title}"].link = "${f.link}"`);
                expect(bad).toEqual([]);
            });
        });
    }

    it('vi and en have identical event values for modal card indices', () => {
        for (const idx of MODAL_CARD_INDICES) {
            expect(HELP_CONTENT.vi.features[idx].event).toBe(
                HELP_CONTENT.en.features[idx].event,
            );
        }
    });

    it('vi and en have identical link values for link card indices', () => {
        for (const idx of LINK_CARD_INDICES) {
            expect(HELP_CONTENT.vi.features[idx].link).toBe(
                HELP_CONTENT.en.features[idx].link,
            );
        }
    });
});
