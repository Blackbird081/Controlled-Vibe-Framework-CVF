import { describe, expect, it } from 'vitest';

import {
  computeServiceRequestSignature,
  constantTimeEqual,
  deriveServiceTokenIdentity,
  verifyServiceTokenRequest,
} from './service-token-auth';

describe('service-token-auth', () => {
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
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

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

    process.env.NODE_ENV = originalNodeEnv;
  });
});
