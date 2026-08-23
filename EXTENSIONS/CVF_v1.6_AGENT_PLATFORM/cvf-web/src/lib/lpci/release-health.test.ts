import { describe, expect, it } from 'vitest';
import { resolveHostedConfigLifecycle } from './release-policy';
import { evaluateLpciReleaseHealth, type LpciReleaseHealthInput } from './release-health';

const activeRedis = {
  schemaVersion: 'cvf.rateLimitBackend.v1',
  configuredStore: 'redis',
  activeStore: 'redis',
  distributed: true,
  configurationStatus: 'ACTIVE_REDIS_REST',
  claimBoundary: 'static configuration only',
} as const;

function readyInput(): LpciReleaseHealthInput {
  return {
    authPolicy: { actualVersion: 'policy-1', acceptedVersion: 'policy-1' },
    config: resolveHostedConfigLifecycle({
      apiKeyAvailable: true,
      model: 'openai/gpt-4o',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      bundleVersion: 'bundle-1',
    }),
    limiter: { backend: activeRedis, implementationCapable: true },
    audit: { configured: true, distributed: true, atomicAppend: true, retentionDays: 30 },
    routeComposition: { actualVersion: 'route-1', acceptedVersion: 'route-1' },
    providerCapability: { exactPairRegistered: true, executableAdapterRegistered: true },
  };
}

describe('evaluateLpciReleaseHealth', () => {
  it('returns exact first-failure priority for every static dependency', () => {
    const cases: Array<[string, (input: LpciReleaseHealthInput) => void]> = [
      ['STATIC_BLOCKED_AUTH_POLICY', (input) => { input.authPolicy.actualVersion = undefined; }],
      ['STATIC_BLOCKED_CONFIG', (input) => { input.config = resolveHostedConfigLifecycle({}); }],
      ['STATIC_BLOCKED_LIMITER_CAPABILITY', (input) => { input.limiter.implementationCapable = false; }],
      ['STATIC_BLOCKED_AUDIT_CAPABILITY', (input) => { input.audit.atomicAppend = false; }],
      ['STATIC_BLOCKED_ROUTE_COMPOSITION', (input) => { input.routeComposition.actualVersion = 'old'; }],
      ['STATIC_BLOCKED_PROVIDER_CAPABILITY', (input) => { input.providerCapability.exactPairRegistered = false; }],
    ];
    for (const [state, mutate] of cases) {
      const input = readyInput();
      mutate(input);
      expect(evaluateLpciReleaseHealth(input).state).toBe(state);
    }
    const multiple = readyInput();
    multiple.config = resolveHostedConfigLifecycle({});
    multiple.audit.configured = false;
    expect(evaluateLpciReleaseHealth(multiple).state).toBe('STATIC_BLOCKED_CONFIG');
  });

  it('reports only static readiness and safe configuration correlation', () => {
    const report = evaluateLpciReleaseHealth(readyInput());
    expect(report).toMatchObject({
      state: 'STATIC_READY',
      configState: 'READY',
      configBundleVersion: 'bundle-1',
      claimBoundary: 'static_prerequisites_only_external_status_unproven',
    });
    const serialized = JSON.stringify(report);
    for (const prohibited of ['writable', 'reachable', 'live', 'apiKey', 'endpoint', 'quotaKey']) {
      expect(serialized.toLowerCase()).not.toContain(prohibited.toLowerCase());
    }
  });
});
