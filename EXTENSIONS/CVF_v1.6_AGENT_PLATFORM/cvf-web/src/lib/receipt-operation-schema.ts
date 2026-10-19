/**
 * Combined codec for the two receipt-operation schemas. Dispatch is strict on the exact schema and effect strings: unknown or cross-schema data
 * denies. The v1 contract stays authoritative for v1 bytes; the bound contract owns the bound schema. No conversion between them exists.
 */
import { OPERATION_EFFECT, OPERATION_RISK, OPERATION_SCHEMA, MAX_OPERATIONS_PER_OWNER, canonicalJson, decodeRecord as decodeV1, envelopeSha256 as envelopeSha256V1,
  makeIntent as makeIntentV1, makeOutcome as makeOutcomeV1, makeReservation as makeReservationV1, makeStart as makeStartV1, parseEnvelope as parseEnvelopeV1,
  parseIntent as parseIntentV1, parseOutcome as parseOutcomeV1, parseReservation as parseReservationV1, parseStart as parseStartV1, recordBytes as recordBytesV1,
  type ControlledEvaluateRequest, type IntentRecord, type OutcomeInput, type OutcomeRecord, type StartRecord } from './artifacts-receipt-operation-contract';
import { BOUND_EFFECT, BOUND_RISK, BOUND_SCHEMA, boundEnvelopeSha256, boundRecordBytes, boundRequestSha256, decodeBoundRecord, makeBoundIntent, makeBoundOutcome,
  makeBoundReservation, makeBoundStart, parseBoundEnvelope, parseBoundIntent, parseBoundOutcome, parseBoundReservation, parseBoundStart,
  type BoundIntent, type BoundOutcome, type BoundOutcomeInput, type BoundStart } from './artifacts-bound-receipt-contract';
import type { DraftPrincipal } from './html-draft-recovery-contract';
import { sha256 } from './html-draft-recovery-contract';

export type OperationSchemaKind = 'V1' | 'BOUND';
export const OPERATION_CAPACITY = MAX_OPERATIONS_PER_OWNER;

/** The structural fields the store needs from either schema. Schema-specific fields stay inside the owning contract. */
export interface BaseEnvelope { schema: string; operationKey: string; owner: DraftPrincipal; attemptId: string; config: { configDigest: string } }
export interface BaseReservation { slot: number; operationKey: string; configDigest: string; ownerSha256: string }
export interface BaseIntent { kind: 'INTENT'; slot: number; operationKey: string; envelopeSha256: string; envelope: BaseEnvelope }
export interface BaseStart { operationKey: string; envelopeSha256: string; attemptId: string; startNonce: string }
export interface BaseOutcome { operationKey: string; envelopeSha256: string; attemptId: string; startNonce: string }
export interface BaseReceiptInput { receipt: { receiptId: string; riskLevel: string; decision: string } | null }
export type DecodedRecord = { kind: 'OK'; value: unknown } | { kind: 'CORRUPT' } | { kind: 'UNSUPPORTED' };

export interface OperationCodec {
  readonly kind: OperationSchemaKind;
  readonly schema: string;
  /** Child directory name inside the owner namespace. Each schema owns a distinct namespace in the same store owner. */
  readonly directory: string;
  parseEnvelope(value: unknown): BaseEnvelope | null;
  envelopeSha256(envelope: BaseEnvelope): string;
  makeReservation(slot: number, owner: DraftPrincipal, key: string, configDigest: string, now: number): BaseReservation;
  parseReservation(value: unknown): BaseReservation | null;
  makeIntent(slot: number, envelope: BaseEnvelope, now: number): BaseIntent;
  parseIntent(value: unknown): BaseIntent | null;
  makeStart(envelope: BaseEnvelope, startNonce: string, now: number): BaseStart;
  parseStart(value: unknown): BaseStart | null;
  makeOutcome(start: BaseStart, input: BaseReceiptInput, now: number): BaseOutcome;
  parseOutcome(value: unknown): BaseOutcome | null;
  recordBytes(value: unknown): Buffer | null;
  decode(bytes: Uint8Array): DecodedRecord;
  /** A persisted receipt must be the evaluation of this start's attempt at the declared R1 with an accepted decision. */
  receiptJoins(attemptId: string, input: BaseReceiptInput): boolean;
}

const ACCEPTED_DECISIONS: readonly string[] = ['ALLOW', 'DENY', 'REVIEW', 'ESCALATE', 'SANDBOX'];
const joinReceipt = (attemptId: string, input: BaseReceiptInput, risk: string) => input.receipt === null
  || (input.receipt.receiptId === attemptId && input.receipt.riskLevel === risk && ACCEPTED_DECISIONS.includes(input.receipt.decision));
type V1Bytes = Parameters<typeof recordBytesV1>[0];
type BoundBytes = Parameters<typeof boundRecordBytes>[0];

export const V1_CODEC: OperationCodec = Object.freeze({
  kind: 'V1', schema: OPERATION_SCHEMA, directory: 'operations',
  parseEnvelope: parseEnvelopeV1,
  envelopeSha256: (envelope: BaseEnvelope) => envelopeSha256V1(parseEnvelopeV1(envelope)!),
  makeReservation: makeReservationV1, parseReservation: parseReservationV1,
  makeIntent: (slot: number, envelope: BaseEnvelope, now: number) => makeIntentV1(slot, parseEnvelopeV1(envelope)!, now),
  parseIntent: parseIntentV1,
  makeStart: (envelope: BaseEnvelope, nonce: string, now: number) => makeStartV1(parseEnvelopeV1(envelope)!, nonce, now),
  parseStart: parseStartV1,
  makeOutcome: (start: BaseStart, input: BaseReceiptInput, now: number) => makeOutcomeV1(start as StartRecord, input as OutcomeInput, now),
  parseOutcome: parseOutcomeV1,
  recordBytes: (value: unknown) => recordBytesV1(value as V1Bytes),
  decode: decodeV1,
  receiptJoins: (attemptId: string, input: BaseReceiptInput) => joinReceipt(attemptId, input, OPERATION_RISK),
});

export const BOUND_CODEC: OperationCodec = Object.freeze({
  kind: 'BOUND', schema: BOUND_SCHEMA, directory: 'bound-operations',
  parseEnvelope: parseBoundEnvelope,
  envelopeSha256: (envelope: BaseEnvelope) => boundEnvelopeSha256(parseBoundEnvelope(envelope)!),
  makeReservation: makeBoundReservation, parseReservation: parseBoundReservation,
  makeIntent: (slot: number, envelope: BaseEnvelope, now: number) => makeBoundIntent(slot, parseBoundEnvelope(envelope)!, now),
  parseIntent: parseBoundIntent,
  makeStart: (envelope: BaseEnvelope, nonce: string, now: number) => makeBoundStart(parseBoundEnvelope(envelope)!, nonce, now),
  parseStart: parseBoundStart,
  makeOutcome: (start: BaseStart, input: BaseReceiptInput, now: number) => makeBoundOutcome(start as BoundStart, input as BoundOutcomeInput, now),
  parseOutcome: parseBoundOutcome,
  recordBytes: (value: unknown) => boundRecordBytes(value as BoundBytes),
  decode: decodeBoundRecord,
  receiptJoins: (attemptId: string, input: BaseReceiptInput) => joinReceipt(attemptId, input, BOUND_RISK),
});

const isRecord = (v: unknown): v is Record<string, unknown> => Object.prototype.toString.call(v) === '[object Object]';

/** Exact schema AND effect select the codec. A mismatched pair, an unknown revision or a missing field selects nothing. */
export function schemaKindOf(value: unknown): OperationSchemaKind | null {
  if (!isRecord(value)) return null;
  if (value.schema === OPERATION_SCHEMA && value.effectKind === OPERATION_EFFECT) return 'V1';
  if (value.schema === BOUND_SCHEMA && value.effectKind === BOUND_EFFECT) return 'BOUND';
  return null;
}
export const codecFor = (kind: OperationSchemaKind): OperationCodec => (kind === 'BOUND' ? BOUND_CODEC : V1_CODEC);
export interface AnyEnvelope { kind: OperationSchemaKind; envelope: BaseEnvelope }
/** Selects the parser from the data itself, then applies that parser strictly. The caller never supplies a schema flag. */
export function parseAnyEnvelope(value: unknown): AnyEnvelope | null {
  const kind = schemaKindOf(value);
  if (kind === null) return null;
  const envelope = codecFor(kind).parseEnvelope(value);
  return envelope ? { kind, envelope } : null;
}
/** Lifecycle records carry their own schema string. */
export function recordKindOf(value: unknown): OperationSchemaKind | null {
  if (!isRecord(value)) return null;
  return value.schema === OPERATION_SCHEMA ? 'V1' : value.schema === BOUND_SCHEMA ? 'BOUND' : null;
}
/** The digest function comes from the already validated envelope schema. A bound request is never hashed with the v1 serializer. */
export function requestDigest(kind: OperationSchemaKind, request: ControlledEvaluateRequest): string {
  return kind === 'BOUND' ? boundRequestSha256(request) : sha256(canonicalJson(request));
}
export const envelopeDigest = (any: AnyEnvelope): string => codecFor(any.kind).envelopeSha256(any.envelope);
export type { IntentRecord, OutcomeRecord, StartRecord, BoundIntent, BoundOutcome, BoundStart };
