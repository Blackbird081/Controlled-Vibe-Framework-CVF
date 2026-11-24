/**
 * @vitest-environment jsdom
 *
 * CVF Template Governance Enforcement Tests
 * Enforces RULE-T1 through RULE-T6 from CVF_TEMPLATE_QUALITY_STANDARD.md
 * These tests are CI gate — a failure here blocks merge.
 */
import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { templates } from './index';
import { getHomeRecommendedAssfPackage, homeOnlyAssfRecommendations, homeSpecTemplates } from '@/lib/home-spec-jev-catalog';
import jevAssfRoster from '@/lib/server/jev-web-assf-roster.json';
import {
    ASSF_PACKAGE_CATEGORY,
    getRecommendedAssfPackage,
    getTemplatesForAssfPackage,
    templateAssfPackageIds,
} from '@/lib/assf-template-recommendations';

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

const formTemplates = templates.filter(t => isFormTemplate(t.id));

const WIZARD_COMPONENT_FILES: Record<string, string> = {
    business_strategy_wizard: 'BusinessStrategyWizard.tsx',
    content_strategy_wizard: 'ContentStrategyWizard.tsx',
    app_builder_wizard: 'AppBuilderWizard.tsx',
    marketing_campaign_wizard: 'MarketingCampaignWizard.tsx',
    product_design_wizard: 'ProductDesignWizard.tsx',
    research_project_wizard: 'ResearchProjectWizard.tsx',
    data_analysis_wizard: 'DataAnalysisWizard.tsx',
    security_assessment_wizard: 'SecurityAssessmentWizard.tsx',
    system_design_wizard: 'SystemDesignWizard.tsx',
};

// ─── Tests ─────────────────────────────────────────────────────────────────
describe('CVF Template Governance Enforcement', () => {

    it('RULE-T4: each current form and wizard has one package recommendation or an explicit no-match', () => {
        const expectedIds = templates.map(template => template.id).filter(id => !FOLDER_TEMPLATE_IDS.has(id));
        expect(Object.keys(templateAssfPackageIds).sort()).toEqual(expectedIds.sort());
        expect(getRecommendedAssfPackage('strategy_analysis')).toBeNull();
        expect(getRecommendedAssfPackage('unknown-template')).toBeNull();
        for (const { id } of homeSpecTemplates) {
            expect(Object.hasOwn(templateAssfPackageIds, id) || Object.hasOwn(homeOnlyAssfRecommendations, id)).toBe(true);
            expect(getHomeRecommendedAssfPackage(id)).toEqual(getRecommendedAssfPackage(id));
        }
    });

    it('RULE-T5: mapped packages are certified in Local, accessible on Web and eligible for Jev', () => {
        const source = JSON.parse(readFileSync(
            join(process.cwd(), '../../../docs/reference/agent_system_skills/generated/skill-index.json'), 'utf8',
        )) as { skills: Array<{
            skillId: string;
            canonicalRoot: string;
            status: string;
            certificationState: string;
            uatState: string;
        }> };
        const eligible = new Map(source.skills.filter(row =>
            row.status === 'ACTIVE' && row.certificationState === 'CERTIFIED' && row.uatState === 'PASSED'
            && row.canonicalRoot === `docs/reference/agent_system_skills/packages/${row.skillId}/SKILL.md`,
        ).map(row => [row.skillId, row.canonicalRoot]));
        const web = JSON.parse(readFileSync(join(process.cwd(), 'public/data/skills-index.json'), 'utf8')) as {
            categories: Array<{ id: string; skills: Array<{
                id: string;
                canonicalRoot?: string;
                frontDoorVisible?: boolean;
                assfProjectionClass?: string;
            }> }>;
        };
        const webPackageIds = new Set(web.categories.find(category => category.id === ASSF_PACKAGE_CATEGORY)?.skills
            .filter(row => row.frontDoorVisible && row.assfProjectionClass === 'CERTIFIED_PACKAGE_PROJECTION'
                && Boolean(row.canonicalRoot) && eligible.get(row.id) === row.canonicalRoot)
            .map(row => row.id) ?? []);
        const jevPackageIds = new Set(jevAssfRoster.packages.map(pack => pack.id));
        expect(jevPackageIds).toEqual(new Set(eligible.keys()));
        expect(jevPackageIds).toEqual(webPackageIds);
        for (const pack of jevAssfRoster.packages) {
            const canonicalRoot = eligible.get(pack.id)!;
            const sourcePath = canonicalRoot.replace(/SKILL\.md$/, 'skill.source.json');
            const raw = readFileSync(join(process.cwd(), '../../..', sourcePath), 'utf8').replace(/\r\n/g, '\n');
            const sourceFile = JSON.parse(raw);
            expect(pack.source).toEqual({
                license: sourceFile.license,
                upstreamCommit: sourceFile.upstreamCommit ?? null,
                sourceSha256: createHash('sha256').update(raw).digest('hex'),
            });
        }
        const invalidReferences = Object.entries(templateAssfPackageIds)
            .filter(([, skillId]) => skillId !== null && !jevPackageIds.has(skillId));
        expect(invalidReferences).toEqual([]);
        for (const [templateId, skillId] of Object.entries(templateAssfPackageIds)) {
            if (skillId === null) continue;
            expect(getRecommendedAssfPackage(templateId)?.href).toBe(`/skills/${ASSF_PACKAGE_CATEGORY}/${skillId}`);
            expect(getTemplatesForAssfPackage(skillId)).toContain(templateId);
        }
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

    it('RULE-T7(wizard): all wizard components expose the governed non-coder live execution wrapper', () => {
        const missing: string[] = [];

        for (const [templateId, fileName] of Object.entries(WIZARD_COMPONENT_FILES)) {
            const componentPath = join(process.cwd(), 'src/components', fileName);
            if (!existsSync(componentPath)) {
                missing.push(`${templateId} missing component ${fileName}`);
                continue;
            }

            const source = readFileSync(componentPath, 'utf-8');
            if (!source.includes('buildNonCoderReferenceLoop')) {
                missing.push(`${templateId} missing buildNonCoderReferenceLoop`);
            }
            if (!source.includes('buildNonCoderLiveExecutionRequest')) {
                missing.push(`${templateId} missing buildNonCoderLiveExecutionRequest`);
            }
            if (!source.includes('<ProcessingScreen')) {
                missing.push(`${templateId} missing live ProcessingScreen path`);
            }
        }

        expect(missing, `Wizard governance wrapper gaps: ${missing.join('; ')}`).toHaveLength(0);
    });

});
