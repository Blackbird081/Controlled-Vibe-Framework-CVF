import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  computeServiceRequestSignature,
  constantTimeEqual,
  deriveServiceTokenIdentity,
  verifyServiceTokenRequest,
} from './service-token-auth';

describe('service-token-auth', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('compares secrets in constant-time only when values match', () => {
    expect(constantTimeEqual('abc', 'abc')).toBe(true);
    expect(constantTimeEqual('abc', 'abd')).toBe(false);
    expect(constantTimeEqual('short', 'longer')).toBe(false);
  });

  it('derives a stable rate-limit identity from the token', () => {
    expect(deriveServiceTokenIdentity('svc-token')).toMatch(/^service:/);
    expect(deriveServiceTokenIdentity('svc-token')).toBe(deriveServiceTokenIdentity('svc-token'));
    expect(deriveServiceTokenIdentity('svc-token')).not.toBe(deriveServiceTokenIdentity('other-token'));
  });

  it('verifies hmac signatures outside test mode', () => {
    vi.stubEnv('NODE_ENV', 'production');

    const token = 'svc-secret';
    const timestamp = String(Date.now());
    const body = '{"templateName":"Strategy"}';
    const signature = computeServiceRequestSignature(token, timestamp, body);

    expect(verifyServiceTokenRequest({
      configuredToken: token,
      presentedToken: token,
      signature,
      timestamp,
      body,
      now: Number(timestamp),
    })).toBe(true);

    expect(verifyServiceTokenRequest({
      configuredToken: token,
      presentedToken: token,
      signature: 'bad-signature',
      timestamp,
      body,
      now: Number(timestamp),
    })).toBe(false);
  });

  it('never bypasses signature/timestamp verification on token equality alone, in any NODE_ENV', () => {
    const token = 'svc-secret';

    for (const nodeEnv of ['test', 'production', 'development', undefined]) {
      if (nodeEnv) {
        vi.stubEnv('NODE_ENV', nodeEnv);
      } else {
        vi.unstubAllEnvs();
      }

      expect(verifyServiceTokenRequest({
        configuredToken: token,
        presentedToken: token,
        signature: null,
        timestamp: null,
        body: '{"ok":true}',
      })).toBe(false);
    }
  });

  it('verifies hmac signatures using an injected time in test mode, matching production behavior', () => {
    vi.stubEnv('NODE_ENV', 'test');

    const token = 'svc-secret';
    const timestamp = String(1_000_000_000_000);
    const body = '{"templateName":"Strategy"}';
    const signature = computeServiceRequestSignature(token, timestamp, body);

    expect(verifyServiceTokenRequest({
      configuredToken: token,
      presentedToken: token,
      signature,
      timestamp,
      body,
      now: Number(timestamp),
    })).toBe(true);

    expect(verifyServiceTokenRequest({
      configuredToken: token,
      presentedToken: token,
      signature: 'bad-signature',
      timestamp,
      body,
      now: Number(timestamp),
    })).toBe(false);
  });
});
