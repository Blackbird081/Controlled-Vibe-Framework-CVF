// Text Encoding Exception: checks the Vietnamese and English documentation.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { skillCopy } from '@/lib/skill-presentation';
import type { SkillIndexPayload } from '@/types/skill';

const hardCount = /\b\d{2,3}\+?(?:[-–]|[ \t]+)\**(?:(?:active|agent|certified|reusable)\s+)*(?:skills?|kỹ năng)\b/iu;
const retiredCode = /\bAGT-\d{3}\b/i;
const detailLinks = /\/skills\/([\w-]+\/[\w-]+)(?=[)"'\s?#]|$)/gi;
const namedSkill = /^[ \t-]*(?:\*\*)?(?:skill|agent pack|kỹ năng|gói kỹ năng)[ \t]*:(?:\*\*)?[ \t]*(?:\*\*|`|")([^`"*\n]+)(?:\*\*|`|")/gimu;
const namedColumn = /^(skill(?: name)?|agent pack|kỹ năng|tên kỹ năng|gói kỹ năng)$/iu;
const normalize = (value: string) => value.replaceAll('*', '').replaceAll('`', '').trim().replace(/\s+/g, ' ').toLowerCase();

function namedReferences(content: string): string[] {
    const references = [...content.matchAll(namedSkill)].map(match => match[1]);
    let skillColumn = -1;
    for (const line of content.split('\n')) {
        if (!line.trimStart().startsWith('|')) {
            skillColumn = -1;
            continue;
        }
        const cells = line.trim().split('|').slice(1, -1);
        const header = cells.findIndex(cell => namedColumn.test(normalize(cell)));
        if (header !== -1) {
            skillColumn = header;
            continue;
        }
        if (skillColumn !== -1 && cells[skillColumn] && !/^\s*:?-+:?\s*$/.test(cells[skillColumn])) {
            references.push(cells[skillColumn].replace(/^\s*\[([^\]]+)\]\([^)]+\)\s*$/, '$1'));
        }
    }
    return references.map(normalize).filter(Boolean);
}

const documents = [
    ...readdirSync('public/content', { recursive: true, withFileTypes: true })
        .filter(entry => entry.isFile() && /\.(?:md|mdx|txt)$/i.test(entry.name))
        .map(entry => join(entry.parentPath, entry.name)),
    'src/data/help-content.ts',
    'src/data/docs-data.ts',
    'src/app/(dashboard)/docs/page.tsx',
].map(path => ({ path, content: readFileSync(path, 'utf8') }));

const index = JSON.parse(readFileSync('public/data/skills-index.json', 'utf8')) as SkillIndexPayload;
const routes = new Set<string>();
const names = new Set<string>();
for (const category of index.categories ?? []) {
    for (const skill of category.skills) {
        const key = `${category.id}/${skill.id}`;
        routes.add(key);
        for (const name of [skill.title, skill.id, skillCopy[key]?.title]) {
            if (name) names.add(normalize(name));
        }
    }
}

describe('current skill information in Web documentation', () => {
    it('recognizes explicit skill references and counts without matching a reuse percentage', () => {
        expect(hardCount.test('Browse 24 reusable skills')).toBe(true);
        expect(hardCount.test('Duyệt 24+ **kỹ năng')).toBe(true);
        expect(namedReferences('Skill: **Unknown package**\n- Tái sử dụng skill: **62%**')).toEqual(['unknown package']);
    });

    it('uses count-free navigation and has no retired catalog codes', () => {
        const stale = documents.flatMap(({ path, content }) => content.split('\n')
            .flatMap((line, index) => hardCount.test(line) || retiredCode.test(line) ? [`${path}:${index + 1}`] : []));
        expect(stale).toEqual([]);
    });

    it('resolves explicit skill names and detail links against the shipped index', () => {
        expect(routes.size).toBeGreaterThan(0);
        const unknown = documents.flatMap(({ path, content }) => [
            ...namedReferences(content).filter(name => !names.has(name)),
            ...[...content.matchAll(detailLinks)].map(match => match[1]).filter(route => !routes.has(route)),
        ].map(value => `${path}: ${value}`));
        expect(unknown).toEqual([]);
    });
});
