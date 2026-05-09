'use client';

import type { Skill, SkillCategory, SkillIndexPayload } from '@/types/skill';
import type { SkillRecord } from '@/lib/skill-search';

function normalizeDifficulty(input?: string): string {
    if (!input) return 'Medium';
    const cleaned = input.replace(/[⭐\s]+/g, ' ').trim();
    if (/easy/i.test(cleaned)) return 'Easy';
    if (/advanced|hard/i.test(cleaned)) return 'Advanced';
    return 'Medium';
}

function toSkillRecord(skill: Skill): SkillRecord {
    return {
        skill_id: skill.id,
        domain: skill.domain,
        skill_name: skill.title,
        difficulty: normalizeDifficulty(skill.difficulty),
        risk_level: skill.riskLevel || 'R1',
        phases: skill.allowedPhases || '',
        keywords: (skill.linkedTemplates ?? []).map((item) => item.templateId).join(','),
        description: skill.summary || skill.corpusNote || '',
        file_path: skill.path,
    };
}

export async function fetchFrontDoorSkillRecords(): Promise<SkillRecord[]> {
    const response = await fetch('/data/skills-index.json', { cache: 'no-store' });
    if (!response.ok) {
        throw new Error('Failed to load skill index');
    }

    const payload = await response.json() as SkillIndexPayload | SkillCategory[];
    const categories: SkillCategory[] = Array.isArray(payload) ? payload : (payload.categories ?? []);
    return categories.flatMap((category) => category.skills.map(toSkillRecord));
}
