/**
 * Bi-directional mapping between Templates (UI forms) and Skills (governance .skill.md files).
 *
 * Templates = INPUT side (help users create specs via forms)
 * Skills    = KNOWLEDGE side (detailed governance + UAT metadata)
 *
 * This mapping enables:
 * - From Templates page: "📚 View related Skill" link
 * - From Skills page:    "📝 Use Template" link
 *
 * Format: { templateId → { domain, skillId } }
 * where domain = skill folder name, skillId = filename without .skill.md
 */

import skillTemplateMapData from '@/data/skill-template-map.json';

export interface SkillRef {
    domain: string;
    skillId: string;
}

/**
 * Maps template IDs to their corresponding skill domain/ID.
 * Only templates with a clear 1:1 skill match are included.
 */
export const templateToSkillMap: Record<string, SkillRef> = skillTemplateMapData.templateToSkillMap;

/**
 * Reverse lookup: find templates that link to a given skill.
 */
export function getTemplatesForSkill(domain: string, skillId: string): string[] {
    return Object.entries(templateToSkillMap)
        .filter(([, ref]) => ref.domain === domain && ref.skillId === skillId)
        .map(([templateId]) => templateId);
}

/**
 * Get the skill reference for a given template ID.
 */
export function getSkillForTemplate(templateId: string): SkillRef | null {
    return templateToSkillMap[templateId] || null;
}

/**
 * Get all template IDs that link to any skill within a domain.
 */
export function getTemplatesForDomain(domain: string): string[] {
    return Object.entries(templateToSkillMap)
        .filter(([, ref]) => ref.domain === domain)
        .map(([templateId]) => templateId);
}

/**
 * Category → Domain mapping (for templates that don't have a direct skill match).
 */
export const categoryToDomainMap: Record<string, string> = skillTemplateMapData.categoryToDomainMap;

/**
 * Domain → Category mapping (reverse).
 */
export const domainToCategoryMap: Record<string, string> = Object.fromEntries(
    Object.entries(categoryToDomainMap).map(([cat, domain]) => [domain, cat])
);
