// Text Encoding Exception: fixtures assert the Vietnamese search and display contract.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { SkillIndexPayload } from '@/types/skill';
import { categoryNames, normalizeSkillSearch, skillCopy, skillCategoryName, skillContentInLanguage, skillDifficulty, skillPresentation } from './skill-presentation';
import { skillReadingParts } from '@/components/SkillReading';

const index = JSON.parse(readFileSync('public/data/skills-index.json', 'utf-8')) as SkillIndexPayload;
const entries = index.categories.flatMap(category => category.skills.map(skill => ({ category, skill })));

describe('skill presentation coverage', () => {
    it('covers every category and every skill in the current front-door index', () => {
        for (const { category, skill } of entries) {
            expect(categoryNames[category.id]).toBeDefined();
            expect(skillCopy[`${category.id}/${skill.id}`]).toBeDefined();
            const presentation = skillPresentation(category.id, skill, true);
            expect(presentation.title).not.toBe(presentation.english);
            expect(presentation.hint).toBeTruthy();
            expect(skillPresentation(category.id, skill, false).hint).toMatch(/^[\x20-\x7E]+$/);
        }
    });

    it('uses canonical English names for categories in the current index', () => {
        expect(skillCategoryName('agent_system_skills', 'fallback', false)).toBe('Agent System Skills');
        for (const category of index.categories) {
            expect(skillCategoryName(category.id, category.name, false)).toBe(categoryNames[category.id].en);
        }
        expect(skillCategoryName('unknown', 'Unknown', false)).toBe('Unknown');
    });

    it('falls back to English, removes display numbering and translates known difficulty levels', () => {
        const skill = { ...entries[0].skill, id: 'unmapped', title: '05 Example Skill' };
        expect(skillPresentation('unknown', skill, true)).toEqual({ title: 'Example Skill', english: 'Example Skill', hint: undefined });
        expect(['Easy', 'Medium', 'Advanced'].map(level => skillDifficulty(level, true))).toEqual(['Dễ', 'Vừa', 'Khó']);
        expect(normalizeSkillSearch('  VIẾT BÁO CÁO ')).toBe('viet bao cao');
    });

    it('preserves certified English source when no localized purpose is supplied', () => {
        const { category, skill } = entries.find(entry => entry.skill.id === 'cvf-engineering-api-interface-design')!;
        expect(skill.content).toContain('Guide contract-first API');
        expect(skillContentInLanguage(skill, category.id, 'vi')).toBe(skill.content);
        expect(skillContentInLanguage(skill, category.id, 'en')).toBe(skill.content);
    });

    it('moves technical headers and an opening metadata table without hiding the original guide', () => {
        const { skill } = entries.find(entry => entry.skill.id === 'cvf-engineering-api-interface-design')!;
        const { body, metadata } = skillReadingParts(skill.content!, true);
        expect(metadata).toContain('Projection Boundary');
        expect(metadata).toContain('Source Trace');
        expect(body).toContain('Guide contract-first API');
        expect(body).not.toContain('Projection Boundary');
        const table = '| Metadata | Value |\n| --- | --- |\n| Version | 1 |\n\n## Purpose\nOriginal content';
        expect(skillReadingParts(table)).toEqual({ body: '## Purpose\nOriginal content', metadata: table.split('\n\n')[0] });
    });
});
