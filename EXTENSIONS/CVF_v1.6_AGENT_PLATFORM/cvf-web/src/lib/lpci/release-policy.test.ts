import { describe, expect, it } from 'vitest';
import {
  LPCI_CANONICAL_ENDPOINT,
  LPCI_CANONICAL_MODEL,
  LPCI_SESSION_ROLES,
  digestReleaseIdentity,
  evaluateReleaseRolePolicy,
  parseLpciServiceActorAllowlist,
  resolveHostedConfigLifecycle,
} from './release-policy';

describe('release role policy', () => {
  it('admits all five canonical session roles with stable pseudonymous keys', () => {
    const decisions = LPCI_SESSION_ROLES.map((effectiveRole) => evaluateReleaseRolePolicy({
      authMode: 'session', actorId: 'effective-user', effectiveRole,
    }));
    expect(decisions.every((decision) => decision.allowed)).toBe(true);
    expect(new Set(decisions.map((decision) => decision.allowed && decision.identityHash)).size).toBe(1);
    expect(JSON.stringify(decisions)).not.toContain('effective-user');
  });

  it('denies absent and noncanonical session roles', () => {
    for (const effectiveRole of [undefined, null, '', 'super-admin']) {
      expect(evaluateReleaseRolePolicy({ authMode: 'session', actorId: 'user', effectiveRole })).toMatchObject({
        allowed: false, code: 'ROLE_NOT_ALLOWED',
      });
    }
  });

  it('admits only a purpose-allowlisted signed service actor reference', () => {
    const actorRef = digestReleaseIdentity('service', 'registered-service');
    expect(evaluateReleaseRolePolicy({
      authMode: 'service_token', actorId: 'registered-service', purpose: 'lpci-query', allowedActorRefs: [actorRef],
    })).toMatchObject({ allowed: true, identityKind: 'service', identityHash: actorRef, roleClass: 'service' });
    expect(evaluateReleaseRolePolicy({
      authMode: 'service_token', actorId: 'other-service', purpose: 'lpci-query', allowedActorRefs: [actorRef],
    })).toMatchObject({ allowed: false, code: 'SERVICE_IDENTITY_NOT_ALLOWED' });
  });
});

describe('hosted config lifecycle', () => {
  const ready = {
    apiKeyAvailable: true,
    model: LPCI_CANONICAL_MODEL,
    endpoint: LPCI_CANONICAL_ENDPOINT,
    bundleVersion: 'bundle-7',
  } as const;

  it('classifies absent, partial, invalid, rotation, and ready states', () => {
    expect(resolveHostedConfigLifecycle({}).state).toBe('ABSENT');
    expect(resolveHostedConfigLifecycle({ ...ready, endpoint: '' }).state).toBe('PARTIAL');
    expect(resolveHostedConfigLifecycle({ ...ready, model: 'openai/other' }).state).toBe('INVALID');
    expect(resolveHostedConfigLifecycle({ ...ready, rotationPending: true }).state).toBe('ROTATION_PENDING');
    expect(resolveHostedConfigLifecycle(ready).state).toBe('READY');
  });

  it('blocks mixed versions and emits only opaque nonsecret correlation for ready bundles', () => {
    expect(resolveHostedConfigLifecycle({ ...ready, endpointBundleVersion: 'bundle-6' }).state).toBe('PARTIAL');
    const metadata = resolveHostedConfigLifecycle(ready);
    expect(metadata).toMatchObject({ state: 'READY', bundleVersion: 'bundle-7' });
    expect(metadata.digest).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(metadata)).not.toContain('apiKey');
  });

  it('parses only safe service actor references', () => {
    const hash = 'a'.repeat(64);
    expect(parseLpciServiceActorAllowlist(` ${hash},invalid,${hash}`)).toEqual([hash]);
  });
});
