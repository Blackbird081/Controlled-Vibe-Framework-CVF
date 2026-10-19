/** Server posture for CVF_NCR_RECEIPT_OPERATION_PROFILE plus the fixture-only controlled composition. No environment value can activate a receipt effect. */
import path from 'node:path';
import { OPERATION_EFFECT, SYNTHETIC_SOURCE_PREFIX, makeOperationConfig,
  type ControlledInvoker, type OperationConfig, type PresenceLookup } from '../artifacts-receipt-operation-contract';
import { BOUND_EFFECT } from '../artifacts-bound-receipt-contract';
import type { BoundReceiptFixtureProfile } from './bound-receipt-profile';
import type { SyntheticDraftProfile } from './html-draft-snapshot-store';

export const RECEIPT_OPERATION_SELECTOR = 'CVF_NCR_RECEIPT_OPERATION_PROFILE';
/** The sole explicit non-production server value that reaches the retained R0 legacy helper. Trusted server configuration, not a client permit or a controlled receipt permission. */
export const LEGACY_COMPATIBILITY_VALUE = 'LEGACY_COMPATIBILITY_ONLY';
export const FIXTURE_TIMEOUT_MS = 4000;
const MAX_FIXTURE_TIMEOUT_MS = 30_000;

/** Explicitly constructed composition. Real endpoint attestation, auth, per-hop and store proof stay held. */
export interface ReceiptOperationFixtureProfile {
  readonly kind: 'INJECTED_SYNTHETIC_RECEIPT_FIXTURE';
  readonly effect: typeof OPERATION_EFFECT;
  readonly identityTrust: 'DECLARED_UNATTESTED';
  readonly production: false;
  readonly sourcePrefix: typeof SYNTHETIC_SOURCE_PREFIX;
  readonly config: OperationConfig;
  readonly store: SyntheticDraftProfile;
  readonly invoker: ControlledInvoker;
  readonly lookup: PresenceLookup | null;
  readonly timeoutMs: number;
}
export interface FixtureProfileInput {
  root: string;
  endpointId: string;
  storeId: string;
  invoker: ControlledInvoker;
  lookup?: PresenceLookup;
  timeoutMs?: number;
  policyRevision?: string;
  transformRevision?: string;
}

/** Typed factory. The only way to obtain a controlled profile; it never reads the environment, fetch or credentials. */
export function createReceiptOperationFixtureProfile(input: FixtureProfileInput): ReceiptOperationFixtureProfile {
  const timeoutMs = input.timeoutMs ?? FIXTURE_TIMEOUT_MS;
  const config = makeOperationConfig({ policyRevision: input.policyRevision ?? 'fixture-policy-r1', transformRevision: input.transformRevision ?? 'fixture-transform-1',
    endpointId: input.endpointId, storeId: input.storeId, authReference: 'no-credential-synthetic-fixture', authScope: 'NONE' });
  if (!config || typeof input.invoker !== 'function' || (input.lookup !== undefined && typeof input.lookup !== 'function')
    || !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > MAX_FIXTURE_TIMEOUT_MS || typeof input.root !== 'string'
    || !path.isAbsolute(input.root) || path.resolve(input.root) !== input.root || input.root === path.parse(input.root).root
    || input.root.startsWith('\\\\')) throw new Error('FIXTURE_PROFILE_INVALID');
  const profile: ReceiptOperationFixtureProfile = {
    kind: 'INJECTED_SYNTHETIC_RECEIPT_FIXTURE', effect: OPERATION_EFFECT, identityTrust: 'DECLARED_UNATTESTED', production: false,
    sourcePrefix: SYNTHETIC_SOURCE_PREFIX, config,
    store: { kind: 'local-synthetic', root: input.root, production: false, jobDecisions: true, receiptOperations: true },
    invoker: input.invoker, lookup: input.lookup ?? null, timeoutMs,
  };
  return Object.freeze(profile);
}

export type ReceiptOperationPosture =
  | { posture: 'UNDECLARED' }
  | { posture: 'LOCAL_SYNTHETIC' }
  | { posture: 'LEGACY_COMPATIBILITY_ONLY' }
  | { posture: 'DENY'; reason: string }
  | { posture: 'CONTROLLED'; profile: ReceiptOperationFixtureProfile }
  | { posture: 'BOUND_CONTROLLED'; profile: BoundReceiptFixtureProfile };

/**
 * Runtime resolver. Recognized before any legacy resolution. A declared value is never ignored: disabled, invalid, held-activation and
 * production-denied values deny. Absence is UNDECLARED, which routes only to a valid local-only profile and otherwise denies; it is never legacy.
 * The CONTROLLED and BOUND_CONTROLLED postures are never returned here; tests inject them by mocking this function. Declaring either effect name
 * through the environment is an unsupported held activation, never a profile.
 */
export function resolveReceiptOperation(env: Record<string, string | undefined> = process.env): ReceiptOperationPosture {
  const declared = env[RECEIPT_OPERATION_SELECTOR];
  if (declared === undefined) return { posture: 'UNDECLARED' };
  if (env.NODE_ENV === 'production') return { posture: 'DENY', reason: 'PRODUCTION_DENIED' };
  if (declared === 'LOCAL_SYNTHETIC') return { posture: 'LOCAL_SYNTHETIC' };
  if (declared === LEGACY_COMPATIBILITY_VALUE) return { posture: 'LEGACY_COMPATIBILITY_ONLY' };
  if (declared === 'DISABLED') return { posture: 'DENY', reason: 'DISABLED' };
  if (declared === OPERATION_EFFECT || declared === BOUND_EFFECT) return { posture: 'DENY', reason: 'ACTIVATION_HELD_UNSUPPORTED' };
  return { posture: 'DENY', reason: 'INVALID_SELECTOR' };
}

export type SelectorKind = 'NONE' | 'VALID' | 'INVALID';
export type ReceiptOperationRoute =
  | { route: 'LEGACY' }
  | { route: 'LOCAL_ONLY' }
  | { route: 'CONTROLLED'; profile: ReceiptOperationFixtureProfile }
  | { route: 'BOUND'; profile: BoundReceiptFixtureProfile }
  | { route: 'DENY'; reason: string; status: 400 | 403 };
const deny = (reason: string, status: 400 | 403): ReceiptOperationRoute => ({ route: 'DENY', reason, status });

/**
 * Pure route decision. A deny never falls back to legacy. Legacy needs the explicit server value, no job selectors and no local profile;
 * absence reaches only a valid local profile; unknown or malformed posture, selectors or profile combinations deny.
 */
export function decideReceiptOperationRoute(input: { posture: ReceiptOperationPosture; selectors: SelectorKind; localProfilePresent: boolean }): ReceiptOperationRoute {
  const { posture, selectors, localProfilePresent } = input;
  if (posture === null || typeof posture !== 'object') return deny('POSTURE_INVALID', 403);
  if (posture.posture === 'DENY') return deny(posture.reason, 403);
  if (selectors === 'INVALID') return deny('SELECTOR_INVALID', 400);
  if (posture.posture === 'CONTROLLED') return selectors === 'VALID' ? { route: 'CONTROLLED', profile: posture.profile } : deny('SELECTOR_REQUIRED', 400);
  if (posture.posture === 'BOUND_CONTROLLED') return selectors === 'VALID' ? { route: 'BOUND', profile: posture.profile } : deny('SELECTOR_REQUIRED', 400);
  if (posture.posture === 'LOCAL_SYNTHETIC') return localProfilePresent ? { route: 'LOCAL_ONLY' } : deny('LOCAL_PROFILE_UNAVAILABLE', 403);
  if (posture.posture === 'LEGACY_COMPATIBILITY_ONLY') {
    if (selectors !== 'NONE') return deny('LEGACY_SELECTORS_CONFLICT', 403);
    return localProfilePresent ? deny('LEGACY_PROFILE_CONFLICT', 403) : { route: 'LEGACY' };
  }
  if (posture.posture !== 'UNDECLARED') return deny('POSTURE_INVALID', 403);
  if (localProfilePresent) return { route: 'LOCAL_ONLY' };
  return deny(selectors === 'VALID' ? 'SELECTORS_WITHOUT_PROFILE' : 'POSTURE_UNDECLARED', 403);
}
