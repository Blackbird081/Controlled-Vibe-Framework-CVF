import { describe, expect, it } from 'vitest';
import {
    parseGovernanceStateRegistry,
    parseRegistryBindings,
    parseSelfUatBindings,
    resolveGovernanceBindingsFromStateRegistry,
    resolveGovernanceBindingsFromMarkdown,
} from './governance-binding-resolver';

describe('governance-binding-resolver', () => {
    const registryMarkdown = `# CVF AGENT REGISTRY

## ENTRY TEMPLATE

---

Agent ID:
Owner:
Department:

## ACTIVE REGISTRY ENTRIES

---

Agent ID: AI_ASSISTANT_V1
Owner: Local CVF Maintainer
Department: Engineering
Business Purpose: Runtime governance
Environment: dev
CVF Version: 1.1.2
System Prompt Version: sp_local_20260307
Risk Level: R2
Approved Phases: DESIGN, BUILD, REVIEW
Approved Roles: ANALYST, BUILDER, REVIEWER
Approved Skills: code_generation, code_review
Certification Status: APPROVED_INTERNAL
Last Self-UAT Date: 2026-03-07
Last Audit Date: 2026-03-07
`;

    const selfUatMarkdown = `# CVF SELF-UAT DECISION LOG

## 3. SAMPLE ENTRY

---

ENTRY ID: 2026-02-11T10:32:45Z
Agent Identifier: CVF-Agent-Builder-v1
CVF Version: 1.2.0
FINAL RESULT: PASS
PRODUCTION STATUS: ENABLED
Decision Owner: Nguyen Minh
Timestamp: 2026-02-11T10:32:45Z

## 7. OPERATIONAL LOG ENTRIES

---

ENTRY ID: 2026-03-07T01:25:00Z
Agent Identifier: AI_ASSISTANT_V1
CVF Version: 1.1.2
FINAL RESULT: PASS
PRODUCTION STATUS: ENABLED
Decision Owner: Local CVF Maintainer
Timestamp: 2026-03-07T01:25:00Z

---

ENTRY ID: 2026-02-01T10:00:00Z
Agent Identifier: AI_ASSISTANT_V1
CVF Version: 1.1.1
FINAL RESULT: FAIL
PRODUCTION STATUS: BLOCKED
Decision Owner: Local CVF Maintainer
Timestamp: 2026-02-01T10:00:00Z
`;

    const stateRegistryJson = JSON.stringify({
        schemaVersion: '2026-03-07',
        generatedAt: '2026-03-07T05:00:00Z',
        sources: {
            agentRegistry: 'governance/toolkit/03_CONTROL/CVF_AGENT_REGISTRY.md',
            selfUatDecisionLog: 'governance/toolkit/04_TESTING/CVF_SELF_UAT_DECISION_LOG.md',
        },
        agents: {
            AI_ASSISTANT_V1: {
                registryBinding: {
                    agentId: 'AI_ASSISTANT_V1',
                    certificationStatus: 'APPROVED_INTERNAL',
                    approvedPhases: ['DESIGN', 'BUILD', 'REVIEW'],
                    approvedSkills: ['code_generation', 'code_review'],
                    lastSelfUatDate: '2026-03-07',
                },
                uatBinding: {
                    status: 'PASS',
                    lastRunAt: '2026-03-07T01:25:00Z',
                },
            },
        },
    });

    it('parses registry bindings from markdown', () => {
        const result = parseRegistryBindings(registryMarkdown);

        expect(result).toHaveLength(1);
        expect(result[0]?.agentId).toBe('AI_ASSISTANT_V1');
        expect(result[0]?.approvedPhases).toEqual(['DESIGN', 'BUILD', 'REVIEW']);
        expect(result[0]?.certificationStatus).toBe('APPROVED_INTERNAL');
    });

    it('parses self-UAT bindings from markdown', () => {
        const result = parseSelfUatBindings(selfUatMarkdown);

        expect(result).toHaveLength(2);
        expect(result[0]?.agentId).toBe('AI_ASSISTANT_V1');
        expect(result[0]?.status).toBe('PASS');
    });

    it('resolves latest registry and self-UAT binding for an agent', () => {
        const result = resolveGovernanceBindingsFromMarkdown(
            'AI_ASSISTANT_V1',
            registryMarkdown,
            selfUatMarkdown
        );

        expect(result.registryBinding?.agentId).toBe('AI_ASSISTANT_V1');
        expect(result.registryBinding?.approvedSkills).toEqual(['code_generation', 'code_review']);
        expect(result.uatBinding?.status).toBe('PASS');
        expect(result.uatBinding?.lastRunAt).toBe('2026-03-07T01:25:00Z');
    });

    it('parses the canonical governance state registry document', () => {
        const result = parseGovernanceStateRegistry(stateRegistryJson);

        expect(result.schemaVersion).toBe('2026-03-07');
        expect(result.agents.AI_ASSISTANT_V1?.registryBinding?.agentId).toBe('AI_ASSISTANT_V1');
        expect(result.agents.AI_ASSISTANT_V1?.uatBinding?.status).toBe('PASS');
    });

    it('resolves bindings from the canonical governance state registry', () => {
        const registry = parseGovernanceStateRegistry(stateRegistryJson);
        const result = resolveGovernanceBindingsFromStateRegistry('AI_ASSISTANT_V1', registry);

        expect(result.registryBinding?.approvedSkills).toEqual(['code_generation', 'code_review']);
        expect(result.uatBinding?.status).toBe('PASS');
    });

    it('returns empty bindings when agent is not found', () => {
        const result = resolveGovernanceBindingsFromMarkdown(
            'MISSING_AGENT',
            registryMarkdown,
            selfUatMarkdown
        );

        expect(result.registryBinding).toBeUndefined();
        expect(result.uatBinding).toBeUndefined();
    });
});
