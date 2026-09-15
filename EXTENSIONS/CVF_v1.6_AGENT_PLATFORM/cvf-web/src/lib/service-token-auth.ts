import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

const SERVICE_TOKEN_SIGNATURE_WINDOW_MS = 5 * 60 * 1000;

function toUtf8Buffer(value: string): Buffer {
  return Buffer.from(value, 'utf8');
}

export function constantTimeEqual(left?: string | null, right?: string | null): boolean {
  if (!left || !right) {
    return false;
  }

  const leftBuffer = toUtf8Buffer(left);
  const rightBuffer = toUtf8Buffer(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function deriveServiceTokenIdentity(token: string): string {
  return `service:${createHash('sha256').update(token).digest('hex').slice(0, 16)}`;
}

export function computeServiceRequestSignature(
  token: string,
  timestamp: string,
  body: string,
): string {
  return createHmac('sha256', token)
    .update(`${timestamp}.${body}`)
    .digest('hex');
}

// ---------------------------------------------------------------------------
// Process-local replay ledger -- bounded, deterministic, no timer/daemon/IO
// ---------------------------------------------------------------------------

const DEFAULT_REPLAY_LEDGER_CAPACITY = 10_000;

interface ReplayEntry {
  expiresAt: number;
}

let replayLedger = new Map<string, ReplayEntry>();
let replayLedgerEnabled = true;
let replayLedgerCapacity = DEFAULT_REPLAY_LEDGER_CAPACITY;

/**
 * Derive a non-secret replay identity from already-validated identity material.
 * Uses the token identity hash (not the raw token), the presented timestamp and
 * the presented HMAC signature. No raw token, body or credential is retained.
 */
function deriveReplayKey(tokenIdentityHash: string, timestamp: string, signature: string): string {
  return createHash('sha256')
    .update(`${tokenIdentityHash}:${timestamp}:${signature}`)
    .digest('hex');
}

/**
 * Remove all entries whose expiry time is at or before `now`.
 * Called synchronously on each verification -- no timer or background task.
 */
function pruneExpiredEntries(now: number): void {
  for (const [key, entry] of replayLedger) {
    if (entry.expiresAt <= now) {
      replayLedger.delete(key);
    }
  }
}

/**
 * Test-only seam: reset the replay ledger and optionally reconfigure capacity.
 * This symbol is not exported through HTTP, environment, CLI or serialized
 * input. Production default remains enabled and bounded.
 */
export function _testOnlyResetReplayLedger(options?: {
  enabled?: boolean;
  capacity?: number;
}): void {
  replayLedger = new Map();
  replayLedgerEnabled = options?.enabled ?? true;
  replayLedgerCapacity = options?.capacity ?? DEFAULT_REPLAY_LEDGER_CAPACITY;
}

export function verifyServiceTokenRequest(input: {
  configuredToken?: string;
  presentedToken?: string | null;
  signature?: string | null;
  timestamp?: string | null;
  body: string;
  now?: number;
}): boolean {
  const { configuredToken, presentedToken, signature, timestamp, body } = input;

  if (!configuredToken || !constantTimeEqual(presentedToken, configuredToken)) {
    return false;
  }

  if (!signature || !timestamp) {
    return false;
  }

  const timestampMs = Number(timestamp);
  const now = input.now ?? Date.now();
  if (!Number.isFinite(timestampMs) || Math.abs(now - timestampMs) > SERVICE_TOKEN_SIGNATURE_WINDOW_MS) {
    return false;
  }

  const expectedSignature = computeServiceRequestSignature(configuredToken, timestamp, body);
  if (!constantTimeEqual(signature, expectedSignature)) {
    return false;
  }

  // -- Replay deduplication (process-local) --
  if (replayLedgerEnabled) {
    pruneExpiredEntries(now);

    const tokenHash = deriveServiceTokenIdentity(configuredToken);
    const replayKey = deriveReplayKey(tokenHash, timestamp, signature);

    if (replayLedger.has(replayKey)) {
      return false; // exact replay rejected
    }

    // Fail closed: if capacity is exhausted after pruning, reject
    if (replayLedger.size >= replayLedgerCapacity) {
      return false;
    }

    // Pin entry lifetime to the validated timestamp's own signature-validity
    // interval (timestampMs +/- WINDOW), not to verification-time `now`. A
    // future-dated timestamp remains signature-valid until timestampMs +
    // WINDOW, which can be later than now + WINDOW; expiring the entry at
    // now + WINDOW would let the same exact request be re-accepted while
    // its signature is still valid. The +1 covers the inclusive boundary:
    // the signature check accepts now == timestampMs + WINDOW, and pruning
    // uses expiresAt <= now, so expiresAt must exceed that last valid now.
    replayLedger.set(replayKey, {
      expiresAt: timestampMs + SERVICE_TOKEN_SIGNATURE_WINDOW_MS + 1,
    });
  }

  return true;
}
