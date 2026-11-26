export const GOVERNANCE_CHECK_WORKFLOWS = {
    documentation: 'documentation-testing.yml',
    static: 'cvf-static-ci.yml',
    publicSync: 'public-sync-preflight.yml',
} as const;

export type GovernanceWorkflow = keyof typeof GOVERNANCE_CHECK_WORKFLOWS;
export type GovernanceCheckRun = { workflow: GovernanceWorkflow } & (
    | { state: 'unavailable' | 'noRun' }
    | { state: 'passed' | 'failed' | 'running' | 'notPassed'; startedAt: string; sha: string; href: string }
);
