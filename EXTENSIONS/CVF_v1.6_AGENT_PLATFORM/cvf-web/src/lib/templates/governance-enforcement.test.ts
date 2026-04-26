/**
 * @vitest-environment jsdom
 *
 * CVF Template Governance Enforcement Tests
 * Enforces RULE-T1 through RULE-T6 from CVF_TEMPLATE_QUALITY_STANDARD.md
 * These tests are CI gate — a failure here blocks merge.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { templates } from './index';
import skillTemplateMapRaw from '@/data/skill-template-map.json';

// ─── Wizard and folder IDs (exempt from form-template rules) ───────────────
const WIZARD_TEMPLATE_IDS = new Set([
    'business_strategy_wizard',
    'content_strategy_wizard',
    'app_builder_wizard',
    'marketing_campaign_wizard',
    'product_design_wizard',
    'research_project_wizard',
    'data_analysis_wizard',
    'security_assessment_wizard',
    'system_design_wizard',
]);

const FOLDER_TEMPLATE_IDS = new Set([
    'individual_skills_folder',
    'vibe_workflow_folder',
]);

// ─── Helpers ───────────────────────────────────────────────────────────────
function isFormTemplate(id: string): boolean {
    return !WIZARD_TEMPLATE_IDS.has(id) && !FOLDER_TEMPLATE_IDS.has(id);
}

function loadActiveSkillIds(): Set<string> {
    const raw = readFileSync(join(process.cwd(), 'public/data/skills-index.json'), 'utf-8');
    const data = JSON.parse(raw);
    const ids = new Set<string>();
    for (const cat of data.categories ?? []) {
        for (const skill of cat.skills ?? []) {
            const sid = skill.id ?? skill.slug;
            if (sid) ids.add(sid as string);
        }
    }
    return ids;
}

const skillMap = skillTemplateMapRaw.templateToSkillMap as Record<string, { domain: string; skillId: string }>;
const mappedTemplateIds = new Set(Object.keys(skillMap));
const formTemplates = templates.filter(t => isFormTemplate(t.id));

// ─── Tests ─────────────────────────────────────────────────────────────────
describe('CVF Template Governance Enforcement', () => {

    // RULE-T4 / RULE-T5: All map entries reference a real template
    it('RULE-T4: every skill-template-map entry has a matching template ID', () => {
        const allTemplateIds = new Set(templates.map(t => t.id));
        const orphanMapEntries = Object.keys(skillMap).filter(id => !allTemplateIds.has(id));
        expect(orphanMapEntries, `Map entries with no template: ${orphanMapEntries.join(', ')}`).toHaveLength(0);
    });

    // RULE-T5: All skillIds in the map are live in the active skill library
    it('RULE-T5: every skillId in skill-template-map exists in active skill library', () => {
        const activeSkillIds = loadActiveSkillIds();
        const deadRefs = Object.entries(skillMap).filter(([, v]) => !activeSkillIds.has(v.skillId));
        const report = deadRefs.map(([tid, v]) => `${tid} → ${v.skillId}`).join(', ');
        expect(deadRefs, `Dead skill references: ${report}`).toHaveLength(0);
    });

    // RULE-T4: All non-wizard, non-folder form templates have a skill mapping
    it('RULE-T4: all form templates are present in skill-template-map.json', () => {
        const unmapped = formTemplates.filter(t => !mappedTemplateIds.has(t.id));
        const report = unmapped.map(t => t.id).join(', ');
        expect(unmapped, `Unmapped form templates: ${report}`).toHaveLength(0);
    });

    // RULE-T1: Form templates must have ≥ 3 fields
    it('RULE-T1: all form templates have at least 3 input fields', () => {
        const insufficient = formTemplates.filter(t => t.fields.length < 3);
        const report = insufficient.map(t => `${t.id}(${t.fields.length})`).join(', ');
        expect(insufficient, `Templates with <3 fields: ${report}`).toHaveLength(0);
    });

    // RULE-T1: Form templates must have ≥ 1 required field
    it('RULE-T1: all form templates have at least 1 required field', () => {
        const noRequired = formTemplates.filter(t => !t.fields.some(f => f.required));
        const report = noRequired.map(t => t.id).join(', ');
        expect(noRequired, `Templates with no required field: ${report}`).toHaveLength(0);
    });

    // RULE-T2: intentPattern must contain a success/output criteria block
    // Accepted variants: "SUCCESS CRITERIA" or "OUTPUT REQUIREMENTS" (both enforce behavioral constraints)
    it('RULE-T2: all form templates have SUCCESS CRITERIA or OUTPUT REQUIREMENTS in intentPattern', () => {
        const missing = formTemplates.filter(
            t => !t.intentPattern.includes('SUCCESS CRITERIA') && !t.intentPattern.includes('OUTPUT REQUIREMENTS')
        );
        const report = missing.map(t => t.id).join(', ');
        expect(missing, `Templates missing criteria block: ${report}`).toHaveLength(0);
    });

    // RULE-T3: outputExpected must be present and non-empty
    it('RULE-T3: all form templates have at least 3 outputExpected items', () => {
        const insufficient = formTemplates.filter(t => !t.outputExpected || t.outputExpected.length < 3);
        const report = insufficient.map(t => `${t.id}(${t.outputExpected?.length ?? 0})`).join(', ');
        expect(insufficient, `Templates with <3 outputExpected: ${report}`).toHaveLength(0);
    });

});

// ─── Phase 2 enforcement (Silver → Gold) ───────────────────────────────────
// Phase 2 upgrade complete: all 36 Silver templates now have outputTemplate
// and OUTPUT FORMAT / OUTPUT REQUIREMENTS in intentPattern.
const PHASE_2_COMPLETE = true;

// All templates upgraded — grandfathered list cleared.
const PHASE_2_GRANDFATHERED_IDS = new Set<string>();

describe('CVF Template Governance — Phase 2 (Silver → Gold upgrade)', () => {

    // RULE-T2: intentPattern must contain OUTPUT FORMAT or OUTPUT REQUIREMENTS block
    it('RULE-T2: all form templates have OUTPUT FORMAT or OUTPUT REQUIREMENTS in intentPattern', () => {
        const scope = PHASE_2_COMPLETE
            ? formTemplates
            : formTemplates.filter(t => !PHASE_2_GRANDFATHERED_IDS.has(t.id));
        const missing = scope.filter(
            t => !t.intentPattern.includes('OUTPUT FORMAT') && !t.intentPattern.includes('OUTPUT REQUIREMENTS')
        );
        const report = missing.map(t => t.id).join(', ');
        expect(missing, `Templates missing output format block: ${report}`).toHaveLength(0);
    });

    // RULE-T3: outputTemplate must be present (Gold standard gate)
    it('RULE-T3: all form templates have an outputTemplate defined', () => {
        const scope = PHASE_2_COMPLETE
            ? formTemplates
            : formTemplates.filter(t => !PHASE_2_GRANDFATHERED_IDS.has(t.id));
        const missing = scope.filter(t => !t.outputTemplate || t.outputTemplate.trim().length === 0);
        const report = missing.map(t => t.id).join(', ');
        expect(missing, `Templates missing outputTemplate: ${report}`).toHaveLength(0);
    });

    // Wizard integrity: all wizard templates are present in the map
    it('RULE-T4(wizard): all wizard templates have a valid skill mapping', () => {
        const activeSkillIds = loadActiveSkillIds();
        const wizardTemplates = templates.filter(t => WIZARD_TEMPLATE_IDS.has(t.id));
        const broken = wizardTemplates.filter(t => {
            const entry = skillMap[t.id];
            return !entry || !activeSkillIds.has(entry.skillId);
        });
        const report = broken.map(t => t.id).join(', ');
        expect(broken, `Wizard templates with broken skill mapping: ${report}`).toHaveLength(0);
    });

});
