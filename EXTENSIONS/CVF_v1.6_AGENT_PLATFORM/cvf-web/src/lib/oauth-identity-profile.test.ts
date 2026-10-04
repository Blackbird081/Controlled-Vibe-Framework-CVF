import { describe, expect, it } from 'vitest';
import { findOAuthIdentityBinding, parseOAuthIdentityBindings } from './oauth-identity-profile';

const githubBinding = {
  provider: 'github', providerAccountId: 'github-subject-123',
  userId: 'cvf-user-1', role: 'reviewer', orgId: 'org_cvf', teamId: 'team_sec',
};
const valid = JSON.stringify([githubBinding]);

describe('OAuth identity binding', () => {
  it('resolves only the exact provider and provider account ID', () => {
    expect(findOAuthIdentityBinding(valid, 'github', 'github-subject-123')).toMatchObject(githubBinding);
    expect(findOAuthIdentityBinding(valid, 'google', 'github-subject-123')).toBeNull();
    expect(findOAuthIdentityBinding(valid, 'github', 'other-subject')).toBeNull();
    expect(findOAuthIdentityBinding(undefined, 'github', 'github-subject-123')).toBeNull();
  });

  it('rejects malformed, duplicate or privilege-ambiguous bindings', () => {
    expect(() => parseOAuthIdentityBindings('{')).toThrow(/valid JSON/);
    expect(() => parseOAuthIdentityBindings('{}')).toThrow(/array/);
    expect(() => parseOAuthIdentityBindings(JSON.stringify([{ ...githubBinding, role: 'superuser' }]))).toThrow(/malformed/);
    expect(() => parseOAuthIdentityBindings(JSON.stringify([{ ...githubBinding, extra: 'ignored' }]))).toThrow(/malformed/);
    expect(() => parseOAuthIdentityBindings(JSON.stringify([githubBinding, githubBinding]))).toThrow(/duplicates/);
  });
});
