import { describe, expect, it } from 'vitest';
import type { GovernanceRolePlanSummary } from './ai/types';
import { finalRolePlanReview, isReviewDiagnostic, reviewDiagnosticText } from './role-plan-review-status';

const plan: GovernanceRolePlanSummary = { reviewerVerdict: 'REVISE', revisionApplied: true, revisionReviewed: true,
    recheckVerdict: 'PASS', stoppedEarly: null, promptContract: 'role-plan-review-v4', stepCount: 4 };

describe('final model review status', () => {
    it.each(['REVISE', 'UNPARSEABLE', 'NOT_RUN', null] as const)('does not confirm a revision whose recheck is %s', recheckVerdict => {
        expect(finalRolePlanReview({ ...plan, recheckVerdict }).confirmed).toBe(false);
    });
    it('requires the recheck to have settled and no early stop, even with a PASS field', () => {
        expect(finalRolePlanReview({ ...plan, revisionReviewed: false }).confirmed).toBe(false);
        expect(finalRolePlanReview({ ...plan, stoppedEarly: 'DEADLINE' }).confirmed).toBe(false);
        expect(finalRolePlanReview(plan).confirmed).toBe(true);
    });
    it('uses the initial verdict only when no revision was applied', () => {
        expect(finalRolePlanReview({ ...plan, revisionApplied: false, reviewerVerdict: 'UNPARSEABLE', reviewerDiagnostic: 'INVALID_JSON', recheckDiagnostic: 'EMPTY_OUTPUT' }))
            .toEqual({ verdict: 'UNPARSEABLE', diagnostic: 'INVALID_JSON', confirmed: false });
        expect(finalRolePlanReview({ ...plan, recheckVerdict: 'UNPARSEABLE', recheckDiagnostic: 'EMPTY_OUTPUT', reviewerDiagnostic: 'INVALID_JSON' }).diagnostic).toBe('EMPTY_OUTPUT');
        expect(finalRolePlanReview({ ...plan, revisionApplied: false, reviewerVerdict: 'PASS', revisionReviewed: null, recheckVerdict: null }).confirmed).toBe(true);
    });
    it('does not echo arbitrary diagnostics into user-facing text', () => {
        expect(isReviewDiagnostic('RAW PRIVATE PROVIDER TEXT')).toBe(false);
        expect(reviewDiagnosticText('RAW PRIVATE PROVIDER TEXT', false)).toBe(reviewDiagnosticText(undefined, false));
    });
});
