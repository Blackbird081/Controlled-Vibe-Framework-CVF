import { describe, expect, it } from 'vitest';
import {
    OUTCOME_WORKFLOW_REGISTRY,
    WORKFLOW_COMPOSITION_VERSION,
} from '../outcome-workflow-registry';

const certifiedPackIds = new Set([
    'strategy_analysis',
    'product_brief',
    'sop_generator',
    'proposal_writer',
    'meeting_summarizer',
    'contract_review',
    'landing_page_builder',
]);

describe('outcome workflow registry', () => {
    it('contains the six T3 outcome workflows', () => {
        expect(OUTCOME_WORKFLOW_REGISTRY.map((entry) => entry.outcomeKey)).toEqual([
            'create_prd',
            'generate_sop',
            'review_contract',
            'build_landing_page',
            'summarize_meeting',
            'create_proposal',
        ]);
    });

    it('binds every outcome to certified T2 pack ids and required composition fields', () => {
        for (const entry of OUTCOME_WORKFLOW_REGISTRY) {
            expect(entry.templateId).toBeTruthy();
            expect(entry.title.en).toBeTruthy();
            expect(entry.description.vi).toBeTruthy();
            expect(entry.cta.en).toBeTruthy();
            expect(entry.composition.outcomeKey).toBe(entry.outcomeKey);
            expect(entry.composition.policyRefs).toContain('CVF_CAPABILITY_INTAKE_PIPELINE_GUARD');
            expect(entry.composition.inputContract.length).toBeGreaterThan(0);
            expect(entry.composition.outputContract.length).toBeGreaterThan(0);
            expect(entry.composition.deterministicFixturePath).toBe(
                `tests/fixtures/workflow/${entry.outcomeKey}.fixture.json`,
            );
            expect(entry.composition.packIds.every((packId) => certifiedPackIds.has(packId))).toBe(true);
        }
    });

    it('keeps the composition version explicit for receipt summaries', () => {
        expect(WORKFLOW_COMPOSITION_VERSION).toBe('workflowComposition.v1');
    });
});
