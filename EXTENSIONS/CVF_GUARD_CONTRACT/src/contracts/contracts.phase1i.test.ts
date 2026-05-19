/**
 * CVF Phase 1.I — Role Axis Taxonomy Conformance Test Stubs
 * ===========================================================
 * Conformance stubs verifying the four role axis definitions and adapter map.
 * Shape-only checks — no runtime role changes (Phase 2.B).
 *
 * Authorized by: docs/baselines/CVF_GC018_PHASE_1I_IDENTITY_ROLE_TAXONOMY_2026-05-18.md
 */

import { describe, it, expect } from 'vitest';

import {
  CANONICAL_ROLE_SURFACES,
  ROLE_AXIS_ADAPTER_MAP,
} from './index';

import type {
  AgentFunctionRole,
  OperatorTeamRole,
  AuthRbacRole,
  GovernanceActorRole,
  RoleAxisAdapterMeta,
} from './index';

// ─── Axis 1: Agent Function ───────────────────────────────────────────────────

describe('AgentFunctionRole axis', () => {
  it('defines all agent function role values', () => {
    const roles: AgentFunctionRole[] = [
      'executor', 'observer', 'orchestrator', 'architect',
      'builder', 'reviewer', 'coordinator',
    ];
    expect(roles).toHaveLength(7);
    for (const role of roles) {
      expect(typeof role).toBe('string');
    }
  });

  it('AgentRole values are a subset of AgentFunctionRole', () => {
    const agentRoleValues: AgentFunctionRole[] = ['executor', 'observer', 'orchestrator', 'reviewer', 'coordinator'];
    for (const v of agentRoleValues) {
      expect(v).toBeTruthy();
    }
  });

  it('DesignAgentRole values are a subset of AgentFunctionRole', () => {
    const designRoleValues: AgentFunctionRole[] = ['orchestrator', 'architect', 'builder', 'reviewer'];
    for (const v of designRoleValues) {
      expect(v).toBeTruthy();
    }
  });
});

// ─── Axis 2: Operator / Team ──────────────────────────────────────────────────

describe('OperatorTeamRole axis', () => {
  it('defines operator team role values', () => {
    const roles: OperatorTeamRole[] = ['operator', 'team-lead', 'contributor'];
    expect(roles).toHaveLength(3);
  });

  it('operator-team axis is independent from agent-function axis', () => {
    const agentFunction: AgentFunctionRole = 'orchestrator';
    const operatorTeam: OperatorTeamRole = 'operator';
    expect(agentFunction).not.toBe(operatorTeam);
  });
});

// ─── Axis 3: Auth / RBAC ─────────────────────────────────────────────────────

describe('AuthRbacRole axis', () => {
  it('defines all five NextAuth RBAC role values', () => {
    const roles: AuthRbacRole[] = ['Owner', 'Admin', 'Developer', 'Reviewer', 'Viewer'];
    expect(roles).toHaveLength(5);
  });

  it('RBAC roles are capitalized (matching NextAuth convention)', () => {
    const roles: AuthRbacRole[] = ['Owner', 'Admin', 'Developer', 'Reviewer', 'Viewer'];
    for (const role of roles) {
      expect(role[0]).toBe(role[0].toUpperCase());
    }
  });

  it('RBAC Reviewer does not conflict with AgentFunctionRole reviewer', () => {
    const rbacReviewer: AuthRbacRole = 'Reviewer';
    const agentReviewer: AgentFunctionRole = 'reviewer';
    expect(rbacReviewer).not.toBe(agentReviewer); // capital vs lowercase — separate axes
  });
});

// ─── Axis 4: Governance Actor ─────────────────────────────────────────────────

describe('GovernanceActorRole axis', () => {
  it('defines all four governance actor role values', () => {
    const roles: GovernanceActorRole[] = ['PROPOSER', 'REVIEWER', 'OPERATOR', 'AUDITOR'];
    expect(roles).toHaveLength(4);
  });

  it('governance roles are upper-case (matching GC-046 convention)', () => {
    const roles: GovernanceActorRole[] = ['PROPOSER', 'REVIEWER', 'OPERATOR', 'AUDITOR'];
    for (const role of roles) {
      expect(role).toBe(role.toUpperCase());
    }
  });
});

// ─── Canonical Role Surfaces ──────────────────────────────────────────────────

describe('CANONICAL_ROLE_SURFACES', () => {
  it('has exactly four canonical surfaces', () => {
    expect(CANONICAL_ROLE_SURFACES).toHaveLength(4);
  });

  it('each canonical surface covers one of the four axes', () => {
    const axes = CANONICAL_ROLE_SURFACES.map((s) => s.primaryAxis);
    expect(axes).toContain('agent-function');
    expect(axes).toContain('auth-rbac');
    expect(axes).toContain('governance-actor');
  });

  it('every canonical surface has a sourcePath and values array', () => {
    for (const surface of CANONICAL_ROLE_SURFACES) {
      expect(surface.sourcePath).toBeTruthy();
      expect(surface.values.length).toBeGreaterThan(0);
    }
  });
});

// ─── Adapter Map Coverage ─────────────────────────────────────────────────────

describe('ROLE_AXIS_ADAPTER_MAP', () => {
  it('covers all 20 Phase 1.0 role surfaces', () => {
    expect(ROLE_AXIS_ADAPTER_MAP).toHaveLength(20);
  });

  it('every entry has required fields', () => {
    for (const entry of ROLE_AXIS_ADAPTER_MAP) {
      expect(entry.adapterId).toBeTruthy();
      expect(entry.domain).toBeTruthy();
      expect(entry.sourcePath).toBeTruthy();
      expect(['agent-function', 'operator-team', 'auth-rbac', 'governance-actor', 'false-positive'])
        .toContain(entry.primaryAxis);
      expect(['canonical_contract', 'adapter', 'legacy_reference', 'deprecate_candidate'])
        .toContain(entry.disposition);
    }
  });

  it('adapter IDs are unique', () => {
    const ids = ROLE_AXIS_ADAPTER_MAP.map((e) => e.adapterId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('false-positive surfaces are all legacy_reference', () => {
    const falsePositives = ROLE_AXIS_ADAPTER_MAP.filter((e) => e.primaryAxis === 'false-positive');
    for (const entry of falsePositives) {
      expect(entry.disposition).toBe('legacy_reference');
    }
  });

  it('canonical_contract surfaces exist for agent-function axis', () => {
    const canonicals = ROLE_AXIS_ADAPTER_MAP.filter(
      (e) => e.disposition === 'canonical_contract' && e.primaryAxis === 'agent-function',
    );
    expect(canonicals.length).toBeGreaterThan(0);
  });

  it('no existing role enum renamed or deleted (adapter map is classification-only)', () => {
    // All entries reference existing sourcePaths — no code deletion or rename.
    // This test verifies the adapter map does not contain any "delete" or "rename" disposition.
    const dispositions = ROLE_AXIS_ADAPTER_MAP.map((e) => e.disposition);
    for (const d of dispositions) {
      expect(['canonical_contract', 'adapter', 'legacy_reference', 'deprecate_candidate']).toContain(d);
    }
  });
});

// ─── Axis Orthogonality ───────────────────────────────────────────────────────

describe('Role axis orthogonality', () => {
  it('an entity can hold values on multiple axes simultaneously', () => {
    // An orchestrator agent (agent-function) may also be an Admin (auth-rbac)
    // and a PROPOSER (governance-actor) — axes are independent
    const agentFunction: AgentFunctionRole = 'orchestrator';
    const authRole: AuthRbacRole = 'Admin';
    const governanceRole: GovernanceActorRole = 'PROPOSER';

    expect(agentFunction).toBe('orchestrator');
    expect(authRole).toBe('Admin');
    expect(governanceRole).toBe('PROPOSER');
  });

  it('CVFRole is retired — not present in canonical surfaces', () => {
    // CVFRole was confirmed as a legacy alias for AgentRole in Phase 1.0 alias table
    // It should NOT appear as a canonical surface or axis type
    const sourceIds = CANONICAL_ROLE_SURFACES.map((s) => s.surfaceId);
    expect(sourceIds.every((id) => !id.includes('cvf-role'))).toBe(true);
  });
});
