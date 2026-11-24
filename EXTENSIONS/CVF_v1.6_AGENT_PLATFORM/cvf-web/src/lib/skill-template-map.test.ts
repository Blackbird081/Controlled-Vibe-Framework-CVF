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
    it('does not advertise legacy skill mappings on current templates', () => {
        expect(templateToSkillMap).toEqual({});
        expect(getSkillForTemplate('strategy_analysis')).toBeNull();
        expect(getTemplatesForSkill('business_analysis', '01_strategy_analysis')).toEqual([]);
        expect(getTemplatesForDomain('business_analysis')).toEqual([]);
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
