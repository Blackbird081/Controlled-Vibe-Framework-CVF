/**
 * Typed fixture profile for the offline bound receipt. This is the ONLY way to obtain one: it reads no environment, no client field and no
 * dependency default. Production, absent, disabled, invalid and unsupported modes never reach this module (the resolver denies them).
 * An issued profile is fixture execution authority for in-process transports only; it is not a real-network, provider or release grant.
 */
import path from 'node:path';
import { BOUND_EFFECT, IDENTITY_TRUST, boundDisclosureOf, boundEnvelopeSha256, makeBoundConfig, parseBoundEnvelope, type BoundConfig, type BoundConfigInput, type BoundDisclosure,
  type BoundEnvelope } from '../artifacts-bound-receipt-contract';
import { SYNTHETIC_SOURCE_PREFIX } from '../artifacts-receipt-operation-contract';
import type { SyntheticDraftProfile } from './html-draft-snapshot-store';
import { createBoundInvoker, createKeyring, newCounters, type BoundCounters, type BoundInvoker, type Keyring, type WireSend } from './bound-receipt-transport';

const issuedProfiles = new WeakSet<object>();
const issuedContexts = new WeakSet<object>();
const issuedDisclosures = new WeakMap<object, BoundReceiptFixtureProfile>();
export const isIssuedBoundProfile = (value: unknown): value is BoundReceiptFixtureProfile =>
  !!value && typeof value === 'object' && issuedProfiles.has(value);
export const isIssuedBoundContext = (value: unknown): value is BoundWebContext =>
  !!value && typeof value === 'object' && issuedContexts.has(value);
export const issuedProfileForDisclosure = (value: unknown): BoundReceiptFixtureProfile | null =>
  value && typeof value === 'object' ? issuedDisclosures.get(value) ?? null : null;

/** Everything the dedicated Web handler needs. Key bytes stay inside the keyring closure. */
export interface BoundWebContext {
  readonly config: BoundConfig;
  readonly keyring: Keyring;
  readonly engineSend: WireSend;
  readonly now: () => number;
  readonly counters: BoundCounters;
}

export interface BoundReceiptFixtureProfile {
  readonly kind: 'BOUND_ENGINE_RECEIPT_FIXTURE';
  readonly effect: typeof BOUND_EFFECT;
  readonly identityTrust: typeof IDENTITY_TRUST;
  readonly production: false;
  readonly sourcePrefix: typeof SYNTHETIC_SOURCE_PREFIX;
  readonly config: BoundConfig;
  readonly store: SyntheticDraftProfile;
  readonly timeoutMs: number;
  readonly counters: BoundCounters;
  /** The Web-side context for the dedicated handler factory. Never exported by a default resolver. */
  readonly webContext: BoundWebContext;
  /** One invoker per operation: it is bound to that operation's immutable envelope and is the identity the store grant checks. */
  createInvoker(envelope: BoundEnvelope): BoundInvoker;
  /** Nonsecret capability disclosure. It contains no key, key reference, private path or token. */
  disclosure(): BoundDisclosure;
}

export interface BoundFixtureProfileInput {
  root: string;
  config: BoundConfigInput;
  keyBundle: unknown;
  /** Injected in-process sender for the export -> proxy hop. There is no default and no network implementation. */
  webSend: WireSend;
  /** Injected in-process sender for the proxy -> engine hop. */
  engineSend: WireSend;
  now?: () => number;
}

const rootValid = (root: unknown): root is string => typeof root === 'string' && path.isAbsolute(root) && path.resolve(root) === root
  && root !== path.parse(root).root && !root.startsWith('\\\\');

/** Typed factory. Throws BOUND_PROFILE_INVALID for any unknown or inconsistent input; nothing is partially constructed. */
export function createBoundReceiptFixtureProfile(input: BoundFixtureProfileInput): BoundReceiptFixtureProfile {
  if (input === null || typeof input !== 'object' || !rootValid(input.root) || typeof input.webSend !== 'function' || typeof input.engineSend !== 'function'
    || (input.now !== undefined && typeof input.now !== 'function')) throw new Error('BOUND_PROFILE_INVALID');
  const parsed = makeBoundConfig({ ...input.config });
  // The key bundle is captured (cloned) once, here, before anything is awaited. Rotation needs a new bundle and a new config; it cannot revive an old operation.
  const keyring = parsed ? createKeyring(input.keyBundle, parsed) : null;
  if (!parsed || !keyring) throw new Error('BOUND_PROFILE_INVALID');
  const config = Object.freeze({ ...parsed });
  const now = input.now ?? Date.now;
  const counters = newCounters();
  const webSend = input.webSend;
  const webContext: BoundWebContext = Object.freeze({ config, keyring, engineSend: input.engineSend, now, counters });
  issuedContexts.add(webContext);
  const store: SyntheticDraftProfile = Object.freeze({ kind: 'local-synthetic', root: input.root, production: false,
    jobDecisions: true, boundReceiptOperations: true });
  const profile: BoundReceiptFixtureProfile = {
    kind: 'BOUND_ENGINE_RECEIPT_FIXTURE', effect: BOUND_EFFECT, identityTrust: IDENTITY_TRUST, production: false, sourcePrefix: SYNTHETIC_SOURCE_PREFIX,
    config, store,
    timeoutMs: config.timeoutMs, counters, webContext,
    createInvoker: (envelope: BoundEnvelope) => {
      const captured = parseBoundEnvelope(envelope);
      if (!captured || captured.config.configDigest !== config.configDigest || captured.config.instanceId !== config.instanceId
        || captured.config.storeBindingId !== config.storeBindingId) throw new Error('BOUND_ENVELOPE_AUTHORITY_MISMATCH');
      return createBoundInvoker({ config, envelope: captured, envelopeSha256: boundEnvelopeSha256(captured), keyring, send: webSend, now, counters });
    },
    disclosure: () => {
      const value = boundDisclosureOf(config);
      const disclosure = Object.freeze({ ...value, destination: Object.freeze({ ...value.destination }), sent: Object.freeze([...value.sent]) });
      issuedDisclosures.set(disclosure, profile);
      return disclosure;
    },
  };
  Object.freeze(profile);
  issuedProfiles.add(profile);
  return profile;
}
