import type { RateLimitBackendStatus } from '@/lib/rate-limit';
import type { HostedConfigMetadata } from './release-policy';

export const LPCI_RELEASE_HEALTH_VERSION = 'cvf.lpciReleaseHealth.v1' as const;

export type LpciReleaseHealthState =
  | 'STATIC_BLOCKED_AUTH_POLICY'
  | 'STATIC_BLOCKED_CONFIG'
  | 'STATIC_BLOCKED_LIMITER_CAPABILITY'
  | 'STATIC_BLOCKED_AUDIT_CAPABILITY'
  | 'STATIC_BLOCKED_ROUTE_COMPOSITION'
  | 'STATIC_BLOCKED_PROVIDER_CAPABILITY'
  | 'STATIC_READY';

export interface LpciReleaseHealthInput {
  authPolicy: { actualVersion?: string; acceptedVersion: string };
  config: HostedConfigMetadata;
  limiter: { backend: RateLimitBackendStatus; implementationCapable: boolean };
  audit: { configured: boolean; distributed: boolean; atomicAppend: boolean; retentionDays: number };
  routeComposition: { actualVersion?: string; acceptedVersion: string };
  providerCapability: { exactPairRegistered: boolean; executableAdapterRegistered: boolean };
}

export interface LpciReleaseHealthReport {
  schemaVersion: typeof LPCI_RELEASE_HEALTH_VERSION;
  state: LpciReleaseHealthState;
  operatorAction: string;
  configState: HostedConfigMetadata['state'];
  configBundleVersion?: string;
  configSchemaVersion: string;
  configDigest?: string;
  claimBoundary: 'static_prerequisites_only_external_status_unproven';
}

const decisions: Array<{
  state: Exclude<LpciReleaseHealthState, 'STATIC_READY'>;
  failed: (input: LpciReleaseHealthInput) => boolean;
  action: string;
}> = [
  {
    state: 'STATIC_BLOCKED_AUTH_POLICY',
    failed: (input) => !input.authPolicy.actualVersion
      || input.authPolicy.actualVersion !== input.authPolicy.acceptedVersion,
    action: 'Restore the accepted LPCI authorization policy version.',
  },
  {
    state: 'STATIC_BLOCKED_CONFIG',
    failed: (input) => input.config.state !== 'READY',
    action: 'Restore or promote one complete LPCI configuration bundle.',
  },
  {
    state: 'STATIC_BLOCKED_LIMITER_CAPABILITY',
    failed: (input) => !input.limiter.implementationCapable
      || input.limiter.backend.configurationStatus !== 'ACTIVE_REDIS_REST'
      || !input.limiter.backend.distributed,
    action: 'Restore the accepted distributed limiter configuration and adapter.',
  },
  {
    state: 'STATIC_BLOCKED_AUDIT_CAPABILITY',
    failed: (input) => !input.audit.configured
      || !input.audit.distributed
      || !input.audit.atomicAppend
      || input.audit.retentionDays !== 30,
    action: 'Restore the accepted distributed evidence adapter configuration and code.',
  },
  {
    state: 'STATIC_BLOCKED_ROUTE_COMPOSITION',
    failed: (input) => !input.routeComposition.actualVersion
      || input.routeComposition.actualVersion !== input.routeComposition.acceptedVersion,
    action: 'Restore the accepted LPCI route composition artifact.',
  },
  {
    state: 'STATIC_BLOCKED_PROVIDER_CAPABILITY',
    failed: (input) => !input.providerCapability.exactPairRegistered
      || !input.providerCapability.executableAdapterRegistered,
    action: 'Restore the accepted exact provider registry and binding artifact.',
  },
];

export function evaluateLpciReleaseHealth(input: LpciReleaseHealthInput): LpciReleaseHealthReport {
  const firstFailure = decisions.find((decision) => decision.failed(input));
  return {
    schemaVersion: LPCI_RELEASE_HEALTH_VERSION,
    state: firstFailure?.state ?? 'STATIC_READY',
    operatorAction: firstFailure?.action ?? 'Static prerequisites are present; external status remains unproven.',
    configState: input.config.state,
    configBundleVersion: input.config.bundleVersion,
    configSchemaVersion: input.config.schemaVersion,
    configDigest: input.config.digest,
    claimBoundary: 'static_prerequisites_only_external_status_unproven',
  };
}
