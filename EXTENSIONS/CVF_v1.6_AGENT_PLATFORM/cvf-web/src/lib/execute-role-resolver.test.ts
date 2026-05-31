import { describe, expect, it } from 'vitest';
import {
  evaluateExecutionActorRoleGate,
  resolveExecutionCVFRole,
  resolveExecutionAllowedActorRoles,
  resolveExecutionOutputClass,
  validateActorRoleGate,
} from './execute-role-resolver';

describe('execute role resolver', () => {
  it('maps service-token execution to SERVICE_AGENT boundary role', () => {
    expect(resolveExecutionCVFRole(null, true)).toEqual({
      allowed: true,
      role: 'SERVICE_AGENT',
      permissionRole: 'SERVICE_AGENT',
      source: 'service_token',
      inputRole: 'service',
    });
  });

  it('maps owner and admin RBAC roles to OPERATOR', () => {
    expect(resolveExecutionCVFRole({ role: 'owner' }, false).permissionRole).toBe('OPERATOR');
    expect(resolveExecutionCVFRole({ role: 'admin' }, false).permissionRole).toBe('OPERATOR');
  });

  it('maps developer, reviewer, and viewer RBAC roles to bounded CVF roles', () => {
    expect(resolveExecutionCVFRole({ role: 'developer' }, false).permissionRole).toBe('BUILDER');
    expect(resolveExecutionCVFRole({ role: 'reviewer' }, false).permissionRole).toBe('REVIEWER');
    expect(resolveExecutionCVFRole({ role: 'viewer' }, false).permissionRole).toBe('OBSERVER');
  });

  it('denies unknown and missing roles without widening authority', () => {
    expect(resolveExecutionCVFRole({ role: 'intern' }, false)).toMatchObject({
      allowed: false,
      role: null,
      permissionRole: null,
      source: 'denied',
      inputRole: 'intern',
    });
    expect(resolveExecutionCVFRole({}, false)).toMatchObject({
      allowed: false,
      role: null,
      permissionRole: null,
      source: 'denied',
      inputRole: null,
    });
  });

  it('maps app_builder_complete to artifact output class', () => {
    expect(resolveExecutionOutputClass('app_builder_complete', 'development', 'simple')).toEqual({
      outputClass: 'artifact',
      source: 'template_id',
    });
  });

  it('keeps code mode as the bounded code_patch route-test output class', () => {
    expect(resolveExecutionOutputClass('unknown', 'development', 'code')).toEqual({
      outputClass: 'code_patch',
      source: 'default',
    });
  });

  it('validates allowed actor roles with permitted, rejected, and empty-list outcomes', () => {
    expect(validateActorRoleGate('BUILDER', ['OPERATOR', 'BUILDER'])).toEqual({ permitted: true });
    expect(validateActorRoleGate('OBSERVER', ['OPERATOR', 'BUILDER'])).toEqual({ permitted: false });
    expect(validateActorRoleGate('BUILDER', [])).toEqual({ permitted: false });
  });

  it('reads governed pack actor-role policy and excludes OBSERVER by default', () => {
    expect(resolveExecutionAllowedActorRoles('documentation')).toEqual([
      'OPERATOR',
      'BUILDER',
      'REVIEWER',
      'SERVICE_AGENT',
    ]);
    expect(evaluateExecutionActorRoleGate('documentation', 'OBSERVER')).toMatchObject({
      permitted: false,
      result: 'rejected',
    });
    expect(evaluateExecutionActorRoleGate('documentation', 'SERVICE_AGENT')).toMatchObject({
      permitted: true,
      result: 'permitted',
    });
  });

  it('does not apply actor-role policy to templates without governed pack policy', () => {
    expect(evaluateExecutionActorRoleGate('unknown_template', 'OBSERVER')).toEqual({
      permitted: true,
      result: 'not_applicable',
    });
  });
});
