/** @vitest-environment jsdom */
import { describe, it, expect } from 'vitest';
import { DOCS, DOC_META } from './docs-data';
import type { DocCategory, DocItem } from './docs-data';

/* ================================================================== */
/*  DOCS — structure & shape                                           */
/* ================================================================== */

describe('DOCS', () => {
    it('is a non-empty array', () => {
        expect(Array.isArray(DOCS)).toBe(true);
        expect(DOCS.length).toBeGreaterThan(0);
    });

    it('contains 8 categories', () => {
        expect(DOCS).toHaveLength(8);
    });

    const expectedCategories = [
        'start',
        'guides',
        'tutorials',
        'concepts',
        'cheatsheets',
        'case-studies',
        'agent-skills',
        'references',
    ];

    it('has the expected category IDs in order', () => {
        const ids = DOCS.map(c => c.id);
        expect(ids).toEqual(expectedCategories);
    });

    describe.each(DOCS)('category "$id"', (cat: DocCategory) => {
        it('has required top-level fields', () => {
            expect(typeof cat.id).toBe('string');
            expect(cat.id.length).toBeGreaterThan(0);
            expect(typeof cat.icon).toBe('string');
            expect(cat.icon.length).toBeGreaterThan(0);
        });

        it('has vi and en labels', () => {
            expect(typeof cat.label.vi).toBe('string');
            expect(typeof cat.label.en).toBe('string');
            expect(cat.label.vi.length).toBeGreaterThan(0);
            expect(cat.label.en.length).toBeGreaterThan(0);
        });

        it('has at least 1 item', () => {
            expect(cat.items.length).toBeGreaterThan(0);
        });

        describe.each(cat.items)('item "$slug"', (item: DocItem) => {
            it('has icon, slug, title, desc', () => {
                expect(typeof item.icon).toBe('string');
                expect(item.icon.length).toBeGreaterThan(0);
                expect(typeof item.slug).toBe('string');
                expect(item.slug.length).toBeGreaterThan(0);
            });

            it('has bilingual title', () => {
                expect(typeof item.title.vi).toBe('string');
                expect(typeof item.title.en).toBe('string');
                expect(item.title.vi.length).toBeGreaterThan(0);
                expect(item.title.en.length).toBeGreaterThan(0);
            });

            it('has bilingual desc', () => {
                expect(typeof item.desc.vi).toBe('string');
                expect(typeof item.desc.en).toBe('string');
                expect(item.desc.vi.length).toBeGreaterThan(0);
                expect(item.desc.en.length).toBeGreaterThan(0);
            });

            it('tag (if present) is bilingual', () => {
                if (item.tag) {
                    expect(typeof item.tag.vi).toBe('string');
                    expect(typeof item.tag.en).toBe('string');
                    expect(item.tag.vi.length).toBeGreaterThan(0);
                    expect(item.tag.en.length).toBeGreaterThan(0);
                }
            });
        });
    });
});

/* ================================================================== */
/*  Slug uniqueness                                                    */
/* ================================================================== */

describe('Slug uniqueness', () => {
    const allSlugs = DOCS.flatMap(c => c.items.map(i => i.slug));

    it('every slug is unique', () => {
        const unique = new Set(allSlugs);
        expect(unique.size).toBe(allSlugs.length);
    });

    it('no slug contains a forward slash', () => {
        for (const slug of allSlugs) {
            expect(slug).not.toContain('/');
        }
    });

    it('no slug contains whitespace', () => {
        for (const slug of allSlugs) {
            expect(slug).toMatch(/^\S+$/);
        }
    });
});

/* ================================================================== */
/*  Agent Skills category — recently updated                           */
/* ================================================================== */

describe('Agent Skills category', () => {
    const agentSkills = DOCS.find(c => c.id === 'agent-skills');

    it('exists', () => {
        expect(agentSkills).toBeDefined();
    });

    it('has 3 items (catalog, operator-workflows, agentic-patterns)', () => {
        expect(agentSkills!.items).toHaveLength(3);
    });

    it('includes operator-workflows with NEW tag (no version label)', () => {
        const opWorkflows = agentSkills!.items.find(
            i => i.slug === 'operator-workflows'
        );
        expect(opWorkflows).toBeDefined();
        expect(opWorkflows!.tag).toBeDefined();
        expect(opWorkflows!.tag!.en).toBe('NEW');
        expect(opWorkflows!.tag!.vi).toBe('MỚI');
        // No v1.6.x sub-version label
        expect(opWorkflows!.tag!.en).not.toMatch(/v1\.6\.\d/);
        expect(opWorkflows!.tag!.vi).not.toMatch(/v1\.6\.\d/);
    });

    it('catalog mentions 34 skills and 7 domains', () => {
        const catalog = agentSkills!.items.find(
            i => i.slug === 'agent-skills-catalog'
        );
        expect(catalog).toBeDefined();
        expect(catalog!.title.en).toContain('34');
        expect(catalog!.desc.en).toContain('7 domains');
    });

    it('agentic-patterns slug exists', () => {
        const patterns = agentSkills!.items.find(
            i => i.slug === 'agentic-patterns'
        );
        expect(patterns).toBeDefined();
    });
});

/* ================================================================== */
/*  DOC_META — auto-derived mapping                                    */
/* ================================================================== */

describe('DOC_META', () => {
    const allSlugs = DOCS.flatMap(c => c.items.map(i => i.slug));

    it('is a non-empty object', () => {
        expect(typeof DOC_META).toBe('object');
        expect(Object.keys(DOC_META).length).toBeGreaterThan(0);
    });

    it('contains an entry for every slug in DOCS', () => {
        for (const slug of allSlugs) {
            expect(DOC_META[slug]).toBeDefined();
        }
    });

    it('has exactly the same number of entries as total items', () => {
        expect(Object.keys(DOC_META)).toHaveLength(allSlugs.length);
    });

    it('each entry has title, category, categoryIcon', () => {
        for (const [, meta] of Object.entries(DOC_META)) {
            expect(typeof meta.title.vi).toBe('string');
            expect(typeof meta.title.en).toBe('string');
            expect(typeof meta.category.vi).toBe('string');
            expect(typeof meta.category.en).toBe('string');
            expect(typeof meta.categoryIcon).toBe('string');
        }
    });

    it('getting-started maps to start category', () => {
        const meta = DOC_META['getting-started'];
        expect(meta).toBeDefined();
        expect(meta.category.en).toBe('Getting Started');
        expect(meta.categoryIcon).toBe('🚀');
    });

    it('operator-workflows maps to agent-skills category', () => {
        const meta = DOC_META['operator-workflows'];
        expect(meta).toBeDefined();
        expect(meta.category.en).toBe('Agent Skills');
        expect(meta.categoryIcon).toBe('🤖');
    });

    it('non-existent slug returns undefined', () => {
        expect(DOC_META['this-slug-does-not-exist']).toBeUndefined();
    });
});

/* ================================================================== */
/*  Data integrity — no v1.6.x sub-version labels anywhere            */
/* ================================================================== */

describe('No v1.6.x sub-version labels', () => {
    const versionPattern = /v1\.6\.\d/;

    it('no tag contains v1.6.x', () => {
        for (const cat of DOCS) {
            for (const item of cat.items) {
                if (item.tag) {
                    expect(item.tag.en).not.toMatch(versionPattern);
                    expect(item.tag.vi).not.toMatch(versionPattern);
                }
            }
        }
    });

    it('no title contains v1.6.x', () => {
        for (const cat of DOCS) {
            for (const item of cat.items) {
                expect(item.title.en).not.toMatch(versionPattern);
                expect(item.title.vi).not.toMatch(versionPattern);
            }
        }
    });
});
