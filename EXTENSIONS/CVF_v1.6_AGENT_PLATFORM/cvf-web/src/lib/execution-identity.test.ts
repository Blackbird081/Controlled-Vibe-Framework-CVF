import { describe, expect, it } from 'vitest';
import { getRolePermissionProfile } from 'cvf-guard-contract';
import { buildExecutionIdentityDecision } from './execution-identity';

describe('execution identity decision', () => {
  it('authorizes a builder inside a governed pack actor policy boundary', () => {
    const decision = buildExecutionIdentityDecision({
      actorId: 'developer-user',
      sessionRole: 'developer',
      templateId: 'documentation',
      targetResource: 'Documentation',
      resolvedRole: {
        allowed: true,
        role: 'BUILDER',
        permissionRole: 'BUILDER',
        source: 'session',
        inputRole: 'developer',
      },
      resolvedOutputClass: { outputClass: 'summary', source: 'default' },
      actorRoleGate: {
        permitted: true,
        result: 'permitted',
        allowedActorRoles: ['OPERATOR', 'BUILDER', 'REVIEWER', 'SERVICE_AGENT'],
      },
      rolePermission: {
        allowed: true,
        role: 'BUILDER',
        outputClass: 'summary',
        profile: getRolePermissionProfile('BUILDER'),
      },
    });

    expect(decision).toMatchObject({
      contractVersion: 'cvf.executionIdentity.v1',
      actorId: 'developer-user',
      sessionRole: 'developer',
      cvfRole: 'BUILDER',
      decision: 'allowed',
      reason: 'execution_identity_authorized',
      authority: {
        canExecute: true,
        outputClass: 'summary',
        outputAllowed: true,
        allowedActorRoles: ['OPERATOR', 'BUILDER', 'REVIEWER', 'SERVICE_AGENT'],
      },
      contextScope: { scope: 'builder_workspace' },
      executionBoundary: {
        boundary: 'governed_pack_actor_policy',
        packPolicyApplied: true,
      },
      receiptOwnership: {
        ownerActorId: 'developer-user',
        ownerRole: 'BUILDER',
        source: 'session_actor',
      },
    });
  });

  it('denies an observer rejected by governed pack actor policy', () => {
    const decision = buildExecutionIdentityDecision({
      actorId: 'viewer-user',
      sessionRole: 'viewer',
      templateId: 'documentation',
      targetResource: 'Documentation',
      resolvedRole: {
        allowed: true,
        role: 'OBSERVER',
        permissionRole: 'OBSERVER',
        source: 'session',
        inputRole: 'viewer',
      },
      resolvedOutputClass: { outputClass: 'summary', source: 'default' },
      actorRoleGate: {
        permitted: false,
        result: 'rejected',
        allowedActorRoles: ['OPERATOR', 'BUILDER', 'REVIEWER', 'SERVICE_AGENT'],
      },
    });

    expect(decision).toMatchObject({
      cvfRole: 'OBSERVER',
      decision: 'denied',
      reason: 'actor_role_not_permitted',
      authority: {
        canExecute: false,
        outputAllowed: null,
      },
      contextScope: { scope: 'observer_read_only' },
      executionBoundary: {
        boundary: 'governed_pack_actor_policy',
        packPolicyApplied: true,
      },
    });
  });

  it('captures unknown roles as role-resolution denial without widening authority', () => {
    const decision = buildExecutionIdentityDecision({
      actorId: 'unknown-actor',
      sessionRole: 'intern',
      templateId: null,
      targetResource: 'unknown-template',
      resolvedRole: {
        allowed: false,
        role: null,
        permissionRole: null,
        source: 'denied',
        inputRole: 'intern',
        denialReason: 'Unsupported execution role: intern.',
      },
      resolvedOutputClass: { outputClass: 'summary', source: 'default' },
    });

    expect(decision).toMatchObject({
      cvfRole: null,
      inputRole: 'intern',
      decision: 'denied',
      reason: 'Unsupported execution role: intern.',
      authority: {
        canExecute: false,
        outputAllowed: null,
        allowedActorRoles: null,
      },
      contextScope: { scope: 'unknown_scope' },
      executionBoundary: {
        boundary: 'role_resolution_denied',
        packPolicyApplied: false,
      },
      receiptOwnership: {
        ownerActorId: 'unknown-actor',
        ownerRole: 'unknown',
        source: 'denied_actor',
      },
    });
  });
});
