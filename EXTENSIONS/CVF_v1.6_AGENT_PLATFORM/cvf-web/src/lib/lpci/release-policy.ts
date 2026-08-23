import { createHash } from 'node:crypto';

export const LPCI_RELEASE_POLICY_VERSION = 'cvf.lpciReleaseRolePolicy.v1' as const;
export const LPCI_CONFIG_SCHEMA_VERSION = 'cvf.lpciHostedConfig.v1' as const;
export const LPCI_CANONICAL_MODEL = 'openai/gpt-4o' as const;
export const LPCI_CANONICAL_ENDPOINT = 'https://api.openai.com/v1/chat/completions' as const;

export const LPCI_SESSION_ROLES = ['owner', 'admin', 'developer', 'reviewer', 'viewer'] as const;
export type LpciSessionRole = (typeof LPCI_SESSION_ROLES)[number];
export type LpciIdentityKind = 'session' | 'service';

export type ReleaseRolePolicyInput =
  | { authMode: 'session'; actorId: string | null | undefined; effectiveRole: string | null | undefined }
  | {
      authMode: 'service_token';
      actorId: string | null | undefined;
      purpose: 'lpci-query';
      allowedActorRefs: readonly string[];
    };

export type ReleaseRolePolicyDecision =
  | {
      allowed: true;
      policyVersion: typeof LPCI_RELEASE_POLICY_VERSION;
      identityKind: LpciIdentityKind;
      identityHash: string;
      roleClass: LpciSessionRole | 'service';
    }
  | {
      allowed: false;
      policyVersion: typeof LPCI_RELEASE_POLICY_VERSION;
      code: 'ROLE_NOT_ALLOWED' | 'SERVICE_IDENTITY_NOT_ALLOWED';
    };

export function digestReleaseIdentity(kind: LpciIdentityKind, actorId: string): string {
  return createHash('sha256').update(`cvf:lpci:${kind}:v1\0${actorId}`).digest('hex');
}

export function evaluateReleaseRolePolicy(input: ReleaseRolePolicyInput): ReleaseRolePolicyDecision {
  const actorId = input.actorId?.trim();
  if (input.authMode === 'session') {
    if (!actorId || !isLpciSessionRole(input.effectiveRole)) {
      return { allowed: false, policyVersion: LPCI_RELEASE_POLICY_VERSION, code: 'ROLE_NOT_ALLOWED' };
    }
    return {
      allowed: true,
      policyVersion: LPCI_RELEASE_POLICY_VERSION,
      identityKind: 'session',
      identityHash: digestReleaseIdentity('session', actorId),
      roleClass: input.effectiveRole,
    };
  }

  if (!actorId || input.purpose !== 'lpci-query') {
    return { allowed: false, policyVersion: LPCI_RELEASE_POLICY_VERSION, code: 'SERVICE_IDENTITY_NOT_ALLOWED' };
  }
  const actorRef = digestReleaseIdentity('service', actorId);
  if (!input.allowedActorRefs.includes(actorRef)) {
    return { allowed: false, policyVersion: LPCI_RELEASE_POLICY_VERSION, code: 'SERVICE_IDENTITY_NOT_ALLOWED' };
  }
  return {
    allowed: true,
    policyVersion: LPCI_RELEASE_POLICY_VERSION,
    identityKind: 'service',
    identityHash: actorRef,
    roleClass: 'service',
  };
}

function isLpciSessionRole(value: string | null | undefined): value is LpciSessionRole {
  return LPCI_SESSION_ROLES.some((role) => role === value);
}

export type HostedConfigState = 'ABSENT' | 'PARTIAL' | 'INVALID' | 'ROTATION_PENDING' | 'READY';

export interface HostedConfigMetadata {
  state: HostedConfigState;
  schemaVersion: typeof LPCI_CONFIG_SCHEMA_VERSION;
  bundleVersion?: string;
  digest?: string;
}

export interface HostedConfigInput {
  apiKeyAvailable?: boolean;
  model?: string | null;
  endpoint?: string | null;
  bundleVersion?: string | null;
  apiKeyBundleVersion?: string | null;
  modelBundleVersion?: string | null;
  endpointBundleVersion?: string | null;
  rotationPending?: boolean;
}

export function parseLpciServiceActorAllowlist(raw: string | undefined): string[] {
  return [...new Set((raw ?? '').split(',').map((value) => value.trim()).filter((value) => /^[a-f0-9]{64}$/.test(value)))];
}

export function resolveHostedConfigLifecycle(input: HostedConfigInput): HostedConfigMetadata {
  const model = input.model?.trim() ?? '';
  const endpoint = input.endpoint?.trim() ?? '';
  const bundleVersion = input.bundleVersion?.trim() ?? '';
  const versions = [
    input.apiKeyBundleVersion?.trim() ?? bundleVersion,
    input.modelBundleVersion?.trim() ?? bundleVersion,
    input.endpointBundleVersion?.trim() ?? bundleVersion,
  ];
  const present = [Boolean(input.apiKeyAvailable), Boolean(model), Boolean(endpoint)];
  if (!bundleVersion && present.every((value) => !value)) return baseConfig('ABSENT');
  if (present.some(Boolean) && !present.every(Boolean)) return baseConfig('PARTIAL');
  if (!present.every(Boolean) || !bundleVersion || versions.some((version) => !version)) return baseConfig('INVALID');
  if (new Set(versions).size !== 1 || versions[0] !== bundleVersion) return baseConfig('PARTIAL');
  if (model !== LPCI_CANONICAL_MODEL || endpoint !== LPCI_CANONICAL_ENDPOINT) return baseConfig('INVALID');
  if (input.rotationPending) return { ...baseConfig('ROTATION_PENDING'), bundleVersion };
  return {
    state: 'READY',
    schemaVersion: LPCI_CONFIG_SCHEMA_VERSION,
    bundleVersion,
    digest: createHash('sha256')
      .update(`${LPCI_CONFIG_SCHEMA_VERSION}\0${model}\0${endpoint}`)
      .digest('hex'),
  };
}

function baseConfig(state: Exclude<HostedConfigState, 'READY'>): HostedConfigMetadata {
  return { state, schemaVersion: LPCI_CONFIG_SCHEMA_VERSION };
}
