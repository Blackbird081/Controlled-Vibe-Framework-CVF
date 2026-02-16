/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { templates, categories, getTemplatesByCategory, getTemplateById, loadTemplatesByCategory } from './template-loader';

describe('template-loader', () => {
    it('exports a non-empty templates array', () => {
        expect(Array.isArray(templates)).toBe(true);
        expect(templates.length).toBeGreaterThan(0);
    });

    it('derives unique categories from templates', () => {
        expect(Array.isArray(categories)).toBe(true);
        expect(categories.length).toBeGreaterThan(0);
        // Should be unique
        expect(new Set(categories).size).toBe(categories.length);
    });

    describe('getTemplatesByCategory', () => {
        it('returns all templates when category is "all"', () => {
            const result = getTemplatesByCategory('all');
            expect(result.length).toBe(templates.length);
        });

        it('filters templates by specific category', () => {
            const cat = categories[0];
            const filtered = getTemplatesByCategory(cat);
            expect(filtered.length).toBeGreaterThan(0);
            filtered.forEach(t => expect(t.category).toBe(cat));
        });

        it('returns empty for unknown category', () => {
            expect(getTemplatesByCategory('nonexistent-xyz')).toEqual([]);
        });
    });

    describe('getTemplateById', () => {
        it('finds template by ID', () => {
            const first = templates[0];
            const found = getTemplateById(first.id);
            expect(found).toBeDefined();
            expect(found?.id).toBe(first.id);
        });

        it('returns undefined for unknown ID', () => {
            expect(getTemplateById('no-such-id-999')).toBeUndefined();
        });
    });

    describe('loadTemplatesByCategory', () => {
        it('returns templates async for a category', async () => {
            const result = await loadTemplatesByCategory('all');
            expect(result.length).toBe(templates.length);
        });

        it('returns filtered templates async', async () => {
            const cat = categories[0];
            const result = await loadTemplatesByCategory(cat);
            expect(result.length).toBeGreaterThan(0);
            result.forEach(t => expect(t.category).toBe(cat));
        });
    });
});
