import { describe, expect, it } from 'vitest';
import type { CVFRole } from '../types';
import {
  ROLE_PERMISSION_DENY_RULES,
  ROLE_PERMISSION_OUTPUT_CLASSES,
  ROLE_PERMISSION_PROFILES,
  getRolePermissionProfile,
  isOutputAllowedForRole,
  roleHasDenyRule,
  rolePermissionCoversAllRoles,
} from './role-permission.contract';

const CURRENT_CVF_ROLES: readonly CVFRole[] = [
  'OBSERVER',
  'ANALYST',
  'BUILDER',
  'REVIEWER',
  'GOVERNOR',
  'HUMAN',
  'AI_AGENT',
  'OPERATOR',
  'SERVICE_AGENT',
];

describe('Phase D Role/Permission contract', () => {
  it('defines one permission profile for every current CVFRole', () => {
    expect(Object.keys(ROLE_PERMISSION_PROFILES).sort()).toEqual([...CURRENT_CVF_ROLES].sort());
    expect(rolePermissionCoversAllRoles(CURRENT_CVF_ROLES)).toBe(true);
  });

  it('keeps output classes inside the canonical vocabulary', () => {
    const vocabulary = new Set(ROLE_PERMISSION_OUTPUT_CLASSES);

    for (const profile of Object.values(ROLE_PERMISSION_PROFILES)) {
      for (const outputClass of profile.allowedOutputClasses) {
        expect(vocabulary.has(outputClass)).toBe(true);
      }
    }
  });

  it('keeps deny rules inside the canonical vocabulary', () => {
    const vocabulary = new Set(ROLE_PERMISSION_DENY_RULES);

    for (const profile of Object.values(ROLE_PERMISSION_PROFILES)) {
      for (const denyRule of profile.denyRules) {
        expect(vocabulary.has(denyRule)).toBe(true);
      }
    }
  });

  it('separates read-only observers from mutating outputs', () => {
    expect(isOutputAllowedForRole('OBSERVER', 'observation')).toBe(true);
    expect(isOutputAllowedForRole('OBSERVER', 'clarification')).toBe(true);
    expect(isOutputAllowedForRole('OBSERVER', 'code_patch')).toBe(false);
    expect(roleHasDenyRule('OBSERVER', 'may_not_mutate')).toBe(true);
  });

  it('allows builder and AI_AGENT implementation outputs without approval ownership', () => {
    expect(isOutputAllowedForRole('BUILDER', 'code_patch')).toBe(true);
    expect(isOutputAllowedForRole('AI_AGENT', 'implementation_note')).toBe(true);
    expect(roleHasDenyRule('BUILDER', 'may_not_approve_own_work')).toBe(true);
    expect(roleHasDenyRule('AI_AGENT', 'may_not_approve_own_work')).toBe(true);
  });

  it('keeps approval and freeze ownership on governance actors', () => {
    const governor = getRolePermissionProfile('GOVERNOR');
    const reviewer = getRolePermissionProfile('REVIEWER');

    expect(governor.receiptOwnerBoundary.ownerAxis).toBe('governance-actor');
    expect(governor.receiptOwnerBoundary.requiresReceiptFor).toContain('freeze');
    expect(reviewer.allowedOutputClasses).toContain('approval_decision');
    expect(reviewer.denyRules).toContain('may_not_freeze_boundary');
  });

  it('records operator as operator-team owner and requires receipts for provider execution', () => {
    const operator = getRolePermissionProfile('OPERATOR');

    expect(operator.receiptOwnerBoundary.ownerAxis).toBe('operator-team');
    expect(operator.receiptOwnerBoundary.ownerRole).toBe('operator');
    expect(operator.receiptOwnerBoundary.requiresReceiptFor).toContain('provider_execution');
    expect(operator.denyRules).toContain('must_emit_receipt_for_mutation');
  });

  it('keeps service-agent execution narrower than operator approval authority', () => {
    const serviceAgent = getRolePermissionProfile('SERVICE_AGENT');

    expect(serviceAgent.receiptOwnerBoundary.ownerRole).toBe('SERVICE_AGENT');
    expect(serviceAgent.receiptOwnerBoundary.requiresReceiptFor).toContain('provider_execution');
    expect(serviceAgent.allowedOutputClasses).toContain('artifact');
    expect(serviceAgent.allowedOutputClasses).not.toContain('approval_decision');
  });
});
