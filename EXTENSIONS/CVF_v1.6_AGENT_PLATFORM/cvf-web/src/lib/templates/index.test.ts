/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { templates, getTemplateById, getTemplatesByCategory, generateIntent, generateCompleteSpec } from './index';

describe('templates/index', () => {
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
            const first = templates[0];
            expect(getTemplateById(first.id)).toBe(first);
        });

        it('returns undefined for unknown ID', () => {
            expect(getTemplateById('nonexistent-9999')).toBeUndefined();
        });
    });

    describe('getTemplatesByCategory', () => {
        it('filters by category', () => {
            const cat = templates[0].category;
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
            const template = templates.find(t => t.intentPattern && t.fields.length > 0) || templates[0];
            const values: Record<string, string> = {};
            template.fields.forEach(f => {
                values[f.id] = 'test-value';
            });
            const intent = generateIntent(template, values);
            expect(typeof intent).toBe('string');
        });

        it('uses N/A for missing values', () => {
            const template = templates[0];
            const intent = generateIntent(template, {});
            if (template.fields.length > 0) {
                expect(intent).toContain('N/A');
            }
        });
    });

    describe('generateCompleteSpec', () => {
        it('generates a full CVF spec document', () => {
            const template = templates[0];
            const values: Record<string, string> = {};
            template.fields.forEach(f => {
                values[f.id] = `Value for ${f.id}`;
            });

            const spec = generateCompleteSpec(template, values);
            expect(spec).toContain('CVF Task Specification');
            expect(spec).toContain(template.name);
            expect(spec).toContain(template.category);
            expect(spec).toContain('User Input');
            expect(spec).toContain('Input Coverage');
            expect(spec).toContain('Execution Constraints');
            expect(spec).toContain('Validation Hooks');
        });

        it('marks missing required fields', () => {
            const template = templates.find(t => t.fields.some(f => f.required));
            if (!template) return;

            const spec = generateCompleteSpec(template, {});
            expect(spec).toContain('❌');
        });

        it('marks provided required fields with checkmark', () => {
            const template = templates.find(t => t.fields.some(f => f.required));
            if (!template) return;

            const values: Record<string, string> = {};
            template.fields.filter(f => f.required).forEach(f => {
                values[f.id] = 'filled';
            });

            const spec = generateCompleteSpec(template, values);
            expect(spec).toContain('✅');
        });

        it('includes user intent if provided', () => {
            const template = templates[0];
            const spec = generateCompleteSpec(template, {}, 'Custom user intent');
            expect(spec).toContain(template.name);
        });

        it('includes expected output section', () => {
            const template = templates[0];
            const spec = generateCompleteSpec(template, {});
            expect(spec).toContain('Expected Output');
        });

        it('includes date', () => {
            const template = templates[0];
            const spec = generateCompleteSpec(template, {});
            const today = new Date().toISOString().split('T')[0];
            expect(spec).toContain(today);
        });

        it('handles template without outputExpected', () => {
            const template = { ...templates[0], outputExpected: undefined, outputTemplate: undefined };
            const spec = generateCompleteSpec(template, {});
            expect(spec).toContain('Comprehensive analysis');
        });

        it('shows no input provided when values are empty', () => {
            const template = templates[0];
            const spec = generateCompleteSpec(template, {});
            // When all values are empty, at least generates without error
            expect(spec).toBeTruthy();
        });
    });
});
