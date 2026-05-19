export type GovernedDecision = 'BLOCK' | 'CLARIFY' | 'NEEDS_APPROVAL';

export function buildGovernedDecisionOutput(input: {
    decision: GovernedDecision;
    reason?: string;
    approvalId?: string;
    missing?: string[];
    guidedResponse?: string;
}): string {
    if (input.decision === 'CLARIFY') {
        const missing = input.missing?.length ? input.missing.join(', ') : 'the missing required inputs';
        return [
            '## CVF Decision: Clarification Needed',
            '',
            `Please provide: ${missing}.`,
            '',
            'After the missing details are supplied, CVF can continue through the governed execution path.',
        ].join('\n');
    }

    if (input.decision === 'NEEDS_APPROVAL') {
        return [
            '## CVF Decision: Approval Required',
            '',
            `Approval request: ${input.approvalId || 'pending'}`,
            '',
            '### Pre-approval safe work',
            '- Confirm the request owner and intended audience.',
            '- Redact secrets, account identifiers, and raw sensitive values before sharing.',
            '- Prepare a bounded summary of the goal, constraints, and requested action.',
            '',
            '### Safe disclosure skeleton',
            '- Affected account: [REDACTED_ACCOUNT]',
            '- Sensitive indicators: [REDACTED_INDICATORS]',
            '- Requested outcome: [SAFE_SUMMARY]',
        ].join('\n');
    }

    return [
        '## CVF Decision: Blocked',
        '',
        input.reason || 'Execution was blocked by CVF policy.',
        '',
        '### Safe next steps',
        input.guidedResponse || 'Restate the request as a compliant, bounded task that preserves approvals, auditability, and data boundaries.',
    ].join('\n');
}
