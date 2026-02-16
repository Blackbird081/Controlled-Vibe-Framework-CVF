/**
 * @vitest-environment jsdom
 * Test: skill-template-map.ts — all mapping functions
 */
import { describe, it, expect } from 'vitest';
import {
    templateToSkillMap,
    getTemplatesForSkill,
    getSkillForTemplate,
    getTemplatesForDomain,
    categoryToDomainMap,
    domainToCategoryMap,
} from './skill-template-map';

describe('skill-template-map', () => {
    it('templateToSkillMap has at least 40 entries', () => {
        expect(Object.keys(templateToSkillMap).length).toBeGreaterThanOrEqual(40);
    });

    it('every entry has valid domain and skillId', () => {
        for (const [id, ref] of Object.entries(templateToSkillMap)) {
            expect(ref.domain.length, `${id} should have domain`).toBeGreaterThan(0);
            expect(ref.skillId.length, `${id} should have skillId`).toBeGreaterThan(0);
        }
    });

    describe('getSkillForTemplate', () => {
        it('returns SkillRef for known template', () => {
            const firstKey = Object.keys(templateToSkillMap)[0];
            const result = getSkillForTemplate(firstKey);
            expect(result).toEqual(templateToSkillMap[firstKey]);
        });

        it('returns null for unknown template', () => {
            expect(getSkillForTemplate('nonexistent_template')).toBeNull();
        });
    });

    describe('getTemplatesForSkill', () => {
        it('returns templates matching domain and skillId', () => {
            const firstEntry = Object.entries(templateToSkillMap)[0];
            const [templateId, ref] = firstEntry;
            const results = getTemplatesForSkill(ref.domain, ref.skillId);
            expect(results).toContain(templateId);
        });

        it('returns empty array for nonexistent skill', () => {
            expect(getTemplatesForSkill('fake_domain', 'fake_skill')).toEqual([]);
        });
    });

    describe('getTemplatesForDomain', () => {
        it('returns all templates in a known domain', () => {
            const firstRef = Object.values(templateToSkillMap)[0];
            const domain = firstRef.domain;
            const results = getTemplatesForDomain(domain);
            expect(results.length).toBeGreaterThan(0);
            // every result should map to this domain
            results.forEach(tid => {
                expect(templateToSkillMap[tid].domain).toBe(domain);
            });
        });

        it('returns empty array for unknown domain', () => {
            expect(getTemplatesForDomain('nonexistent')).toEqual([]);
        });
    });

    describe('categoryToDomainMap ↔ domainToCategoryMap', () => {
        it('are inverse mappings', () => {
            for (const [category, domain] of Object.entries(categoryToDomainMap)) {
                expect(domainToCategoryMap[domain]).toBe(category);
            }
            for (const [domain, category] of Object.entries(domainToCategoryMap)) {
                expect(categoryToDomainMap[category]).toBe(domain);
            }
        });

        it('have at least 7 entries', () => {
            expect(Object.keys(categoryToDomainMap).length).toBeGreaterThanOrEqual(7);
        });
    });
});
