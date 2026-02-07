import type { SkillContract } from '../types';

export function makeContract(overrides: Partial<SkillContract> = {}): SkillContract {
    return {
        capability_id: 'CODE_REVIEW_v1',
        domain: 'development',
        description: 'Review code for issues',
        risk_level: 'R1',
        version: '1.0',
        governance: {
            allowed_archetypes: ['Analysis', 'Execution'],
            allowed_phases: ['C'],
            required_decisions: [],
            required_status: 'ACTIVE',
        },
        input_spec: [
            { name: 'code', type: 'string', required: true },
            { name: 'language', type: 'string', required: false, default: 'python' },
        ],
        output_spec: [
            { name: 'issues', type: 'array' },
            { name: 'score', type: 'integer', range: [0, 100] },
        ],
        execution: {
            side_effects: false,
            rollback_possible: true,
            idempotent: true,
            execution_type: 'EXECUTABLE',
        },
        audit: {
            trace_level: 'Standard',
            required_fields: ['code'],
        },
        ...overrides,
    };
}

export function contractYaml(): string {
    return `
capability_id: CODE_REVIEW_v1
domain: development
description: Review code for issues
risk_level: R1
version: "1.0"
governance:
  allowed_archetypes: ["Analysis", "Execution"]
  allowed_phases: ["C"]
  required_decisions: []
  required_status: ACTIVE
input_spec:
  - name: code
    type: string
    required: true
output_spec:
  - name: issues
    type: array
execution:
  side_effects: false
  rollback_possible: true
  idempotent: true
audit:
  trace_level: Standard
  required_fields: ["code"]
`;
}
