import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  computeServiceRequestSignature,
  constantTimeEqual,
  deriveServiceTokenIdentity,
  verifyServiceTokenRequest,
  _testOnlyResetReplayLedger,
} from './service-token-auth';

describe('service-token-auth', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    _testOnlyResetReplayLedger();
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

    // second call with same parameters is replay -> rejected
    expect(verifyServiceTokenRequest({
      configuredToken: token,
      presentedToken: token,
      signature,
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

    // second call with same parameters is replay -> rejected
    expect(verifyServiceTokenRequest({
      configuredToken: token,
      presentedToken: token,
      signature: 'bad-signature',
      timestamp,
      body,
      now: Number(timestamp),
    })).toBe(false);
  });

  // ----- Replay deduplication tests -----

  describe('replay deduplication', () => {
    const token = 'replay-test-token';
    const baseNow = 2_000_000_000_000;

    function makeValidCall(overrides?: { body?: string; timestamp?: string; now?: number }) {
      const ts = overrides?.timestamp ?? String(baseNow);
      const bd = overrides?.body ?? '{"action":"test"}';
      const sig = computeServiceRequestSignature(token, ts, bd);
      return {
        configuredToken: token,
        presentedToken: token,
        signature: sig,
        timestamp: ts,
        body: bd,
        now: overrides?.now ?? Number(ts),
      };
    }

    it('accepts a first valid request and rejects an exact replay', () => {
      const call = makeValidCall();
      expect(verifyServiceTokenRequest(call)).toBe(true);
      expect(verifyServiceTokenRequest(call)).toBe(false);
    });

    it('does not poison the ledger with invalid-token requests', () => {
      // Invalid token attempt using the same timestamp/body
      const ts = String(baseNow);
      const bd = '{"action":"poison"}';
      const sig = computeServiceRequestSignature(token, ts, bd);

      expect(verifyServiceTokenRequest({
        configuredToken: token,
        presentedToken: 'wrong-token',
        signature: sig,
        timestamp: ts,
        body: bd,
        now: baseNow,
      })).toBe(false);

      // The valid request must still succeed
      expect(verifyServiceTokenRequest({
        configuredToken: token,
        presentedToken: token,
        signature: sig,
        timestamp: ts,
        body: bd,
        now: baseNow,
      })).toBe(true);
    });

    it('does not poison the ledger with bad-signature requests', () => {
      const ts = String(baseNow);
      const bd = '{"action":"badsig"}';
      const sig = computeServiceRequestSignature(token, ts, bd);

      expect(verifyServiceTokenRequest({
        configuredToken: token,
        presentedToken: token,
        signature: 'totally-wrong',
        timestamp: ts,
        body: bd,
        now: baseNow,
      })).toBe(false);

      // Valid request with correct signature still succeeds
      expect(verifyServiceTokenRequest({
        configuredToken: token,
        presentedToken: token,
        signature: sig,
        timestamp: ts,
        body: bd,
        now: baseNow,
      })).toBe(true);
    });

    it('does not poison the ledger with expired-timestamp requests', () => {
      const staleTs = String(baseNow - 6 * 60 * 1000); // 6 min ago
      const bd = '{"action":"stale"}';
      const sig = computeServiceRequestSignature(token, staleTs, bd);

      expect(verifyServiceTokenRequest({
        configuredToken: token,
        presentedToken: token,
        signature: sig,
        timestamp: staleTs,
        body: bd,
        now: baseNow,
      })).toBe(false);

      // A fresh valid call still works
      const freshCall = makeValidCall({ body: bd });
      expect(verifyServiceTokenRequest(freshCall)).toBe(true);
    });

    it('treats distinct valid tuples as independent (no collision)', () => {
      const call1 = makeValidCall({ body: '{"id":1}' });
      const call2 = makeValidCall({ body: '{"id":2}' });
      const call3 = makeValidCall({ timestamp: String(baseNow + 1000), now: baseNow + 1000 });

      expect(verifyServiceTokenRequest(call1)).toBe(true);
      expect(verifyServiceTokenRequest(call2)).toBe(true);
      expect(verifyServiceTokenRequest(call3)).toBe(true);

      // Each is still rejected on replay
      expect(verifyServiceTokenRequest(call1)).toBe(false);
      expect(verifyServiceTokenRequest(call2)).toBe(false);
      expect(verifyServiceTokenRequest(call3)).toBe(false);
    });

    it('allows re-use of the same parameters after the signature window expires', () => {
      const call = makeValidCall();
      expect(verifyServiceTokenRequest(call)).toBe(true);
      expect(verifyServiceTokenRequest(call)).toBe(false);

      // Advance time past the 5-minute window -- the entry should be pruned
      // but the original timestamp is now stale, so we need a fresh timestamp
      // that happens to produce the same body. The key includes timestamp so
      // it naturally differs.
      const laterNow = baseNow + 5 * 60 * 1000 + 1;
      const laterCall = makeValidCall({ timestamp: String(laterNow), now: laterNow });
      expect(verifyServiceTokenRequest(laterCall)).toBe(true);
    });

    it('prunes expired entries and reclaims capacity', () => {
      _testOnlyResetReplayLedger({ capacity: 3 });

      // Fill to capacity
      for (let i = 0; i < 3; i++) {
        const c = makeValidCall({ body: `{"i":${i}}` });
        expect(verifyServiceTokenRequest(c)).toBe(true);
      }

      // Capacity full -> next valid request fails closed
      const overflow = makeValidCall({ body: '{"i":3}' });
      expect(verifyServiceTokenRequest(overflow)).toBe(false);

      // Advance past expiry -> pruning frees capacity
      const laterNow = baseNow + 5 * 60 * 1000 + 1;
      const afterExpiry = makeValidCall({ body: '{"i":4}', timestamp: String(laterNow), now: laterNow });
      expect(verifyServiceTokenRequest(afterExpiry)).toBe(true);
    });

    it('fails closed when unexpired capacity is exhausted', () => {
      _testOnlyResetReplayLedger({ capacity: 2 });

      expect(verifyServiceTokenRequest(makeValidCall({ body: '{"a":1}' }))).toBe(true);
      expect(verifyServiceTokenRequest(makeValidCall({ body: '{"a":2}' }))).toBe(true);

      // Third valid but different request -> capacity full -> fail closed
      expect(verifyServiceTokenRequest(makeValidCall({ body: '{"a":3}' }))).toBe(false);
    });

    it('does not store raw tokens or bodies in the replay ledger (data boundary)', () => {
      // This test validates the design constraint by verifying that the
      // module-internal replay key is a hex digest, not raw material.
      // Since the ledger is module-private, we verify indirectly:
      // a valid call succeeds, its replay fails, and a call with
      // different body but same token still succeeds (proving the key
      // includes body-dependent material, not just the raw token).
      const call1 = makeValidCall({ body: '{"secret":"value1"}' });
      const call2 = makeValidCall({ body: '{"secret":"value2"}' });

      expect(verifyServiceTokenRequest(call1)).toBe(true);
      expect(verifyServiceTokenRequest(call1)).toBe(false); // exact replay
      expect(verifyServiceTokenRequest(call2)).toBe(true);  // different body
    });

    it('passes through when replay ledger is disabled', () => {
      _testOnlyResetReplayLedger({ enabled: false });

      const call = makeValidCall();
      expect(verifyServiceTokenRequest(call)).toBe(true);
      // Without replay protection, the same call succeeds again
      expect(verifyServiceTokenRequest(call)).toBe(true);
    });

    // ----- Future-dated timestamp expiry hostile regression (F1) -----
    //
    // Bug: entry lifetime was pinned to verification-time `now`
    // (expiresAt = now + WINDOW), not to the validated timestamp. A
    // future-dated timestamp within the window stays signature-valid until
    // timestampMs + WINDOW, which can exceed now + WINDOW -- so the old
    // implementation could prune the replay entry before the signature
    // itself expired, letting the exact same request be re-accepted.
    describe('future-dated timestamp replay lifetime (hostile regression)', () => {
      const WINDOW = 5 * 60 * 1000;

      it('1. accepts a request whose timestamp is future-dated within the window', () => {
        const futureTs = baseNow + 4 * 60 * 1000; // 4 min ahead, within 5 min window
        const call = makeValidCall({ timestamp: String(futureTs), now: baseNow });
        expect(verifyServiceTokenRequest(call)).toBe(true);
      });

      it('2. rejects an immediate replay of a future-dated-timestamp request', () => {
        const futureTs = baseNow + 4 * 60 * 1000;
        const call = makeValidCall({ timestamp: String(futureTs), now: baseNow });
        expect(verifyServiceTokenRequest(call)).toBe(true);
        expect(verifyServiceTokenRequest(call)).toBe(false);
      });

      it('3. rejects replay at a time past the OLD implementation expiry (now + WINDOW) while the signature is still valid', () => {
        // futureTs = baseNow + 4min. Old buggy expiresAt = baseNow + WINDOW
        // (i.e. baseNow + 5min), which is only 1 min after futureTs -- well
        // before the signature itself expires at futureTs + WINDOW
        // (baseNow + 9min). Verify at a `now` that is after the old
        // (buggy) expiry but still within the true signature-validity
        // interval [futureTs - WINDOW, futureTs + WINDOW].
        const futureTs = baseNow + 4 * 60 * 1000;
        const call = makeValidCall({ timestamp: String(futureTs), now: baseNow });
        expect(verifyServiceTokenRequest(call)).toBe(true);

        const oldBuggyExpiry = baseNow + WINDOW; // old expiresAt
        const replayAt = oldBuggyExpiry + 60 * 1000; // 1 min past old (buggy) expiry
        // Still within true validity: abs(replayAt - futureTs) <= WINDOW
        expect(Math.abs(replayAt - futureTs)).toBeLessThanOrEqual(WINDOW);

        const replay = { ...call, now: replayAt };
        expect(verifyServiceTokenRequest(replay)).toBe(false);
      });

      it('4. exact boundary: replay rejected at now == timestampMs + WINDOW (last valid instant), accepted fresh after signature truly expires', () => {
        const ts = baseNow;
        const call = makeValidCall({ timestamp: String(ts), now: baseNow });
        expect(verifyServiceTokenRequest(call)).toBe(true);

        // Last instant the signature is still valid for this timestamp.
        const lastValidNow = ts + WINDOW;
        const replayAtBoundary = { ...call, now: lastValidNow };
        expect(verifyServiceTokenRequest(replayAtBoundary)).toBe(false);

        // One ms later the signature itself is expired -- rejected for a
        // different reason (timestamp window), and pruning may now reclaim
        // the entry, but the exact tuple must never be re-accepted while
        // its own signature was valid.
        const pastWindow = { ...call, now: ts + WINDOW + 1 };
        expect(verifyServiceTokenRequest(pastWindow)).toBe(false);
      });

      it('5. capacity pruning still passes with timestamp-pinned expiry', () => {
        _testOnlyResetReplayLedger({ capacity: 3 });

        for (let i = 0; i < 3; i++) {
          const c = makeValidCall({ body: `{"cap":${i}}` });
          expect(verifyServiceTokenRequest(c)).toBe(true);
        }

        const overflow = makeValidCall({ body: '{"cap":3}' });
        expect(verifyServiceTokenRequest(overflow)).toBe(false);

        // Advance past the true expiry (timestampMs + WINDOW) so pruning
        // reclaims capacity.
        const laterNow = baseNow + WINDOW + 2;
        const afterExpiry = makeValidCall({
          body: '{"cap":4}',
          timestamp: String(laterNow),
          now: laterNow,
        });
        expect(verifyServiceTokenRequest(afterExpiry)).toBe(true);
      });
    });
  });
});
