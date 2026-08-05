function buildApprovalPreparationOutput(userPrompt?: string): string {
    const text = (userPrompt || '').toLowerCase();
    if (/\b(credential|secret|token|api\s*key|leak|incident|indicators?|account identifiers?|security)\b/i.test(text)) {
        return [
            'Pre-approval safe work:',
            '- Draft a disclosure note without raw credentials, tokens, indicators, or account identifiers.',
            '- Replace sensitive values with [REDACTED_CREDENTIAL], [REDACTED_ACCOUNT], or [REDACTED_INDICATOR].',
            '',
            'Safe disclosure skeleton:',
            '- Summary: A potential security exposure is under review.',
            '- What is known: Describe the affected data category without revealing sensitive values.',
            '- Actions underway: preserve evidence, notify the security owner, and monitor for misuse.',
        ].join('\n');
    }
    return [
        'Pre-approval safe work:',
        '- Prepare the approval packet: purpose, data involved, scope, approver, retention, and rollback.',
        '- Separate planning that can happen now from operations that must wait.',
    ].join('\n');
}

export function buildGovernedStopOutput(input: {
    decision: 'BLOCK' | 'CLARIFY' | 'NEEDS_APPROVAL';
    reason?: string;
    missing?: string[];
    approvalId?: string;
    guidedResponse?: string | null;
    userPrompt?: string;
}): string {
    const reason = input.reason?.trim();
    if (input.decision === 'CLARIFY') {
        const fields = (input.missing || []).filter(Boolean);
        return [
            '## CVF Decision: Clarification Needed', '',
            'Please provide:',
            ...(fields.length ? fields.map(field => `- ${field}`) : ['- Goal, audience, constraints, and success criteria.']),
            '', 'CVF will re-check the request after clarification.',
        ].join('\n');
    }
    if (input.decision === 'NEEDS_APPROVAL') {
        return [
            '## CVF Decision: Approval Required', '',
            'This request needs explicit human approval before execution.',
            ...(reason ? ['', `Reason: ${reason}`] : []),
            ...(input.approvalId ? ['', `Approval request: ${input.approvalId}`] : []),
            '', 'Safe next steps:',
            '- Wait for the approval decision tied to this request.',
            '- Keep phase, scope, provider, and data access within the approved boundary.',
            '', buildApprovalPreparationOutput(input.userPrompt),
            ...(input.guidedResponse ? ['', 'Suggested safe alternative:', input.guidedResponse] : []),
        ].join('\n');
    }
    return [
        '## CVF Decision: Blocked', '',
        'This request crosses a safety, access, audit, or governance boundary.',
        ...(reason ? ['', `Reason: ${reason}`] : []),
        '', 'Safe next steps:',
        '- Use an approved account, data source, and access path.',
        '- Restate the request as a compliant planning, documentation, remediation, or review task.',
        ...(input.guidedResponse ? ['', 'Suggested safe alternative:', input.guidedResponse] : []),
    ].join('\n');
}
