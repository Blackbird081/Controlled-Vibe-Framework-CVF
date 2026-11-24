'use client';

/**
 * Role-plan evidence helpers and the unreviewed partial-output panel of ProcessingScreen (outcome fidelity O5, O6).
 * Split out of ProcessingScreen.tsx to keep that governed file under the size limit; behaviour is unchanged.
 */
import { useState } from 'react';
import type { GovernanceRolePlanSummary, MaoRolePlanPartialOutput } from '@/lib/ai/types';
import { isReviewDiagnostic } from '@/lib/role-plan-review-status';

const ROLE_VERDICTS = ['PASS', 'REVISE', 'UNPARSEABLE', 'NOT_RUN'];
const ROLE_STOPS = ['DEADLINE', 'EMPTY_DRAFT', 'ATTEMPT_DENIED', 'FAILED'];

/** Compact reviewer-model verdict summary of the role-plan evidence the route returned; undefined when the response carries none. */
export function summarizeRolePlan(plan: unknown): GovernanceRolePlanSummary | undefined {
    const p = plan as Record<string, unknown> | null | undefined;
    if (!p || typeof p !== 'object' || !ROLE_VERDICTS.includes(p.reviewerVerdict as string)) return undefined;
    return {
        reviewerVerdict: p.reviewerVerdict as GovernanceRolePlanSummary['reviewerVerdict'],
        revisionApplied: p.revisionApplied === true,
        revisionReviewed: typeof p.revisionReviewed === 'boolean' ? p.revisionReviewed : null,
        recheckVerdict: ROLE_VERDICTS.includes(p.recheckVerdict as string) ? p.recheckVerdict as GovernanceRolePlanSummary['recheckVerdict'] : null,
        stoppedEarly: ROLE_STOPS.includes(p.stoppedEarly as string) ? p.stoppedEarly as GovernanceRolePlanSummary['stoppedEarly'] : null,
        promptContract: typeof p.promptContract === 'string' ? p.promptContract : '',
        stepCount: Array.isArray(p.steps) ? p.steps.length : 0,
        ...(p.reviewerVerdict === 'UNPARSEABLE' && isReviewDiagnostic(p.reviewerDiagnostic) ? { reviewerDiagnostic: p.reviewerDiagnostic } : {}),
        ...(p.recheckVerdict === 'UNPARSEABLE' && isReviewDiagnostic(p.recheckDiagnostic) ? { recheckDiagnostic: p.recheckDiagnostic } : {}),
    };
}

/** Unreviewed draft kept on a failure response; anything not shaped exactly so is ignored. */
export function readPartialOutput(value: unknown): MaoRolePlanPartialOutput | null {
    const v = value as Record<string, unknown> | null | undefined;
    return v && typeof v.text === 'string' && v.text.trim() && (v.fromStep === 'draft' || v.fromStep === 'revise') && v.reviewed === false
        ? { text: v.text, fromStep: v.fromStep, reviewed: false } : null;
}

/** Reviewer-model verdict line shown when the failure evidence carries one; these are model verdicts, not human approval. */
export function partialVerdictLine(plan: GovernanceRolePlanSummary | null | undefined, isVi: boolean): string | null {
    if (!plan) return null;
    const parts: string[] = [];
    if (plan.reviewerVerdict !== 'NOT_RUN') parts.push(`${isVi ? 'R\u00E0 so\u00E1t' : 'Review'}: ${plan.reviewerVerdict}`);
    if (plan.recheckVerdict && plan.recheckVerdict !== 'NOT_RUN') parts.push(`${isVi ? 'R\u00E0 so\u00E1t l\u1EA1i' : 'Recheck'}: ${plan.recheckVerdict}`);
    return parts.length ? `${isVi ? 'K\u1EBFt lu\u1EADn c\u1EE7a m\u00F4 h\u00ECnh r\u00E0 so\u00E1t' : 'Reviewer model verdict'} - ${parts.join(', ')}` : null;
}

/** Incomplete role-plan output of a failed run, shown beside the error with a copy action, never delivered as a completed result. */
export function PartialOutputPanel({ partialOutput, rolePlan, isVi }: { partialOutput: MaoRolePlanPartialOutput; rolePlan?: GovernanceRolePlanSummary | null; isVi: boolean }) {
    const [copied, setCopied] = useState(false);
    const verdictLine = partialVerdictLine(rolePlan, isVi);
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(partialOutput.text);
            setCopied(true);
        } catch {
            setCopied(false);
        }
    };
    return (
        <div className="mt-2 mb-4 mx-auto max-w-md rounded-lg border border-amber-300 bg-amber-50 p-3 text-left dark:border-amber-700 dark:bg-amber-950/40" data-testid="partial-output-panel">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">{'K\u1EBFt qu\u1EA3 ch\u01B0a ho\u00E0n t\u1EA5t, ch\u01B0a qua b\u01B0\u1EDBc r\u00E0 so\u00E1t cu\u1ED1i / Incomplete result, not finally reviewed'}</p>
            <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">
                {isVi ? '\u0110\u00E2y kh\u00F4ng ph\u1EA3i k\u1EBFt qu\u1EA3 ho\u00E0n t\u1EA5t v\u00E0 ch\u01B0a \u0111\u01B0\u1EE3c ng\u01B0\u1EDDi ph\u00EA duy\u1EC7t.' : 'This is not a completed result and has not been approved by a person.'}
            </p>
            {verdictLine && <p className="mt-1 text-xs text-amber-800 dark:text-amber-200" data-testid="partial-output-verdict">{verdictLine}</p>}
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words text-xs text-gray-800 dark:text-gray-100" data-testid="partial-output-text">{partialOutput.text}</pre>
            <button
                type="button"
                className="mt-2 rounded border border-amber-400 px-3 py-1 text-xs text-amber-900 hover:bg-amber-100 dark:text-amber-100 dark:hover:bg-amber-900/40"
                data-testid="partial-output-copy"
                onClick={copy}
            >
                {copied ? (isVi ? '\u0110\u00E3 sao ch\u00E9p' : 'Copied') : (isVi ? 'Sao ch\u00E9p b\u1EA3n nh\u00E1p' : 'Copy draft')}
            </button>
        </div>
    );
}
