/**
 * @vitest-environment jsdom
 * Test: template-i18n.ts — getTemplateName and getTemplateDescription
 */
import { describe, it, expect } from 'vitest';
import { templateEnglish, getTemplateName, getTemplateDescription } from './template-i18n';

describe('template-i18n', () => {
    it('templateEnglish has at least 40 entries', () => {
        expect(Object.keys(templateEnglish).length).toBeGreaterThanOrEqual(40);
    });

    it('every entry has a non-empty name', () => {
        for (const [id, value] of Object.entries(templateEnglish)) {
            expect(value.name.length, `${id} should have non-empty name`).toBeGreaterThan(0);
        }
    });

    describe('getTemplateName', () => {
        it('returns English name when locale is "en"', () => {
            const result = getTemplateName('app_builder_wizard', 'Trình tạo ứng dụng', 'en');
            expect(result).toBe(templateEnglish['app_builder_wizard'].name);
        });

        it('returns default name when locale is "vi"', () => {
            const viName = 'Trình tạo ứng dụng';
            const result = getTemplateName('app_builder_wizard', viName, 'vi');
            expect(result).toBe(viName);
        });

        it('returns default name for unknown template ID in EN', () => {
            const result = getTemplateName('unknown_template', 'Default', 'en');
            expect(result).toBe('Default');
        });

        it('returns default name for unknown template ID in VI', () => {
            const result = getTemplateName('unknown_template', 'Mặc định', 'vi');
            expect(result).toBe('Mặc định');
        });
    });

    describe('getTemplateDescription', () => {
        it('returns English description when locale is "en" and description exists', () => {
            // Find an entry with description
            const entryWithDesc = Object.entries(templateEnglish).find(([, v]) => v.description);
            if (entryWithDesc) {
                const [id, value] = entryWithDesc;
                const result = getTemplateDescription(id, 'Mô tả VI', 'en');
                expect(result).toBe(value.description);
            }
        });

        it('returns default description when locale is "en" but no English description', () => {
            // Find an entry WITHOUT description
            const entryWithoutDesc = Object.entries(templateEnglish).find(([, v]) => !v.description);
            if (entryWithoutDesc) {
                const [id] = entryWithoutDesc;
                const result = getTemplateDescription(id, 'Fallback', 'en');
                expect(result).toBe('Fallback');
            }
        });

        it('returns default description when locale is "vi"', () => {
            const result = getTemplateDescription('app_builder_wizard', 'Mô tả tiếng Việt', 'vi');
            expect(result).toBe('Mô tả tiếng Việt');
        });

        it('returns default description for unknown template ID in EN (line 89)', () => {
            const result = getTemplateDescription('totally_unknown_id', 'FallbackDesc', 'en');
            expect(result).toBe('FallbackDesc');
        });
    });
});
