/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import * as skillActions from '@/actions/skills';
import * as templateRegistry from './index';
import { templates, getTemplateById, getTemplatesByCategory, generateIntent } from './index';

describe('templates/index', () => {
    it('keeps the active skill catalog without the unused detail action', () => {
        expect(skillActions.getSkillCategories).toBeTypeOf('function');
        expect(skillActions).not.toHaveProperty('getSkillDetail');
    });

    it('keeps intent generation without exporting the retired spec generator', () => {
        expect(templateRegistry.generateIntent).toBeTypeOf('function');
        expect(templateRegistry).not.toHaveProperty('generateCompleteSpec');
    });

    it('exports a non-empty templates array', () => {
        expect(Array.isArray(templates)).toBe(true);
        expect(templates.length).toBeGreaterThan(0);
    });

    it('every template has required fields', () => {
        templates.forEach(t => {
            expect(t.id).toBeTruthy();
            expect(t.name).toBeTruthy();
            expect(t.category).toBeTruthy();
            expect(Array.isArray(t.fields)).toBe(true);
        });
    });

    it('all template IDs are unique', () => {
        const ids = templates.map(t => t.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    describe('getTemplateById', () => {
        it('finds a template by ID', () => {
            const first = templates[0]!;
            expect(getTemplateById(first.id)).toBe(first);
        });

        it('returns undefined for unknown ID', () => {
            expect(getTemplateById('nonexistent-9999')).toBeUndefined();
        });
    });

    describe('getTemplatesByCategory', () => {
        it('filters by category', () => {
            const cat = templates[0]!.category;
            const filtered = getTemplatesByCategory(cat);
            expect(filtered.length).toBeGreaterThan(0);
            filtered.forEach(t => expect(t.category).toBe(cat));
        });

        it('returns empty for unknown category', () => {
            expect(getTemplatesByCategory('nonexistent')).toEqual([]);
        });
    });

    describe('generateIntent', () => {
        it('replaces placeholders with values', () => {
            const template = templates.find(t => t.intentPattern && t.fields.length > 0) || templates[0]!;
            const values: Record<string, string> = {};
            template.fields.forEach(f => {
                values[f.id] = 'test-value';
            });
            const intent = generateIntent(template, values);
            expect(typeof intent).toBe('string');
        });

        it('uses N/A for missing values', () => {
            const template = templates.find(t => t.fields.length > 0 && /\[[A-Za-z0-9_]+\]/.test(t.intentPattern));
            expect(template).toBeDefined();
            if (!template) throw new Error('Expected a template with placeholder fields');

            const intent = generateIntent(template, {});
            expect(intent).toContain('N/A');
            expect(intent).not.toMatch(/\[[A-Za-z0-9_]+\]/);
        });

        it('normalizes multi-select values without leaving placeholders', () => {
            const template = getTemplateById('code_review');
            expect(template).toBeDefined();

            const intent = generateIntent(template!, {
                workSample: 'function pay() {}',
                goal: 'Review payment behavior',
                worry: 'Timeouts',
                mustPreserve: 'Mobile API contract',
                focus: ['Logic risk', 'Security risk'],
            });

            expect(intent).toContain('Logic risk, Security risk');
            expect(intent).not.toMatch(/\[[A-Za-z0-9_]+\]/);
        });
    });
});
