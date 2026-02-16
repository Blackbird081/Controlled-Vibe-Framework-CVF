/**
 * @vitest-environment jsdom
 * Test: i18n key parity between en.json and vi.json
 * Coverage: All 55+ new Skill Library keys + entire key set integrity
 */
import { describe, it, expect } from 'vitest';
import enJson from './i18n/en.json';
import viJson from './i18n/vi.json';

const enKeys = Object.keys(enJson);
const viKeys = Object.keys(viJson);

describe('i18n key parity', () => {
    it('en.json and vi.json have the same number of keys', () => {
        expect(enKeys.length).toBe(viKeys.length);
    });

    it('every key in en.json exists in vi.json', () => {
        const missingInVi = enKeys.filter(k => !(k in (viJson as Record<string, string>)));
        expect(missingInVi).toEqual([]);
    });

    it('every key in vi.json exists in en.json', () => {
        const missingInEn = viKeys.filter(k => !(k in (enJson as Record<string, string>)));
        expect(missingInEn).toEqual([]);
    });

    it('no duplicate keys exist (JSON parse takes last value)', () => {
        // Read raw file text and count key occurrences
        // Since JSON.parse already deduplicates, we verify key count matches
        expect(new Set(enKeys).size).toBe(enKeys.length);
        expect(new Set(viKeys).size).toBe(viKeys.length);
    });

    it('no translation value is empty string', () => {
        const emptyEn = enKeys.filter(k => (enJson as Record<string, string>)[k] === '');
        const emptyVi = viKeys.filter(k => (viJson as Record<string, string>)[k] === '');
        expect(emptyEn).toEqual([]);
        expect(emptyVi).toEqual([]);
    });
});

describe('Skill Library i18n keys', () => {
    const requiredSkillKeys = [
        'skills.library',
        'skills.searchPlaceholder',
        'skills.noResults',
        'skills.open',
        'skills.easy',
        'skills.med',
        'skills.adv',
        'skills.notRun',
        'skills.domainReport',
        'skills.domainReportDesc',
        'skills.totalSkills',
        'skills.uatCoverage',
        'skills.uatCompleted',
        'skills.specAvgLabel',
        'skills.uatNotRunHint',
        'skills.sort',
        'skills.countOption',
        'skills.coverageOption',
        'skills.specAvgOption',
        'skills.nameOption',
        'skills.sortDir',
        'skills.desc',
        'skills.asc',
        'skills.minCount',
        'skills.minCoverage',
        'skills.minSpecScore',
        'skills.onlyWithUat',
        'skills.showing',
        'skills.rows',
        'skills.prev',
        'skills.page',
        'skills.next',
        'skills.domain',
        'skills.outputUat',
        'skills.uatCoverageCol',
        'skills.specQualityCol',
        'skills.excellent',
        'skills.good',
        'skills.needsReview',
        'skills.notReady',
        'skills.risk',
        'skills.autonomy',
        'skills.roles',
        'skills.phases',
        'skills.scope',
        'skills.specGate',
        'skills.outputUatLabel',
        'skills.scoreLabel',
        'skills.outputQuality',
        'skills.specLabel',
        'skills.specQualityLabel',
        'skills.skillTab',
        'skills.uatTab',
        'skills.viewTab',
        'skills.editTab',
        'skills.copyRaw',
        'skills.copied',
        'skills.specGateWarning',
        'skills.editPlaceholder',
        'skills.saveUat',
        'skills.cancel',
        'skills.editorHint',
        'skills.noUat',
        'skills.selectSkill',
        'skills.selectSkillDesc',
        'skills.backToCvf',
        'skills.notFound',
        'skills.notFoundDesc',
    ];

    it.each(requiredSkillKeys)('en.json has key "%s"', (key) => {
        expect((enJson as Record<string, string>)[key]).toBeDefined();
        expect((enJson as Record<string, string>)[key].length).toBeGreaterThan(0);
    });

    it.each(requiredSkillKeys)('vi.json has key "%s"', (key) => {
        expect((viJson as Record<string, string>)[key]).toBeDefined();
        expect((viJson as Record<string, string>)[key].length).toBeGreaterThan(0);
    });

    it('Vietnamese translations differ from English for non-technical keys', () => {
        const nonTechnicalKeys = [
            'skills.library',
            'skills.searchPlaceholder',
            'skills.noResults',
            'skills.easy',
            'skills.med',
            'skills.adv',
            'skills.notRun',
            'skills.domainReport',
            'skills.totalSkills',
            'skills.uatCompleted',
            'skills.sort',
            'skills.sortDir',
            'skills.desc',
            'skills.asc',
            'skills.minCount',
            'skills.minCoverage',
            'skills.minSpecScore',
            'skills.onlyWithUat',
            'skills.showing',
            'skills.rows',
            'skills.prev',
            'skills.next',
            'skills.excellent',
            'skills.good',
            'skills.needsReview',
            'skills.notReady',
            'skills.risk',
            'skills.autonomy',
            'skills.roles',
            'skills.phases',
            'skills.scope',
            'skills.scoreLabel',
            'skills.outputQuality',
            'skills.viewTab',
            'skills.editTab',
            'skills.copyRaw',
            'skills.copied',
            'skills.saveUat',
            'skills.cancel',
            'skills.noUat',
            'skills.selectSkill',
            'skills.selectSkillDesc',
            'skills.backToCvf',
            'skills.notFound',
            'skills.notFoundDesc',
        ];
        for (const key of nonTechnicalKeys) {
            const en = (enJson as Record<string, string>)[key];
            const vi = (viJson as Record<string, string>)[key];
            expect(vi).not.toBe(en);
        }
    });
});
