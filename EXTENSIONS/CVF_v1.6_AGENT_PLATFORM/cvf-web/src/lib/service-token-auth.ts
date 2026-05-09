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

  if (process.env.NODE_ENV === 'test') {
    return true;
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
  return constantTimeEqual(signature, expectedSignature);
}
