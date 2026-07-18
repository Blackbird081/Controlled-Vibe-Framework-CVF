/** Delta-T10 durable audit integrity readout. Pure deterministic classification of supplied records. */

import {
  DURABLE_EXECUTION_AUDIT_CONTRACT,
  BINDING_HASH_PATTERN,
  type DurableExecutionAuditRecord,
} from './durable-execution-audit-store.js';
import { RECEIPT_ID_PATTERN } from '../persistence/json-receipt-consumption.store.js';
import { CONSUMPTION_ID_PATTERN } from '../persistence/json-governed-execution.store.js';

export const DURABLE_AUDIT_INTEGRITY_READOUT_CONTRACT =
  'cvf.delta.durableAuditIntegrityReadout.v1' as const;

const SECRET_DETECT_PATTERN = /[=\s]|sk-|pk-|Bearer |token_|api[_-]?key/i;

export type DurableAuditIntegrityFindingCode =
  | 'INVALID_CONTRACT_VERSION'
  | 'MALFORMED_RECEIPT_ID'
  | 'MALFORMED_CONSUMPTION_ID'
  | 'INVALID_BINDING_HASH'
  | 'FORBIDDEN_MANDATORY_INVOCATION_CLAIM'
  | 'FORBIDDEN_DIRECT_INTERCEPTION_CLAIM'
  | 'INVALID_PROOF_CONSISTENCY'
  | 'SECRET_LIKE_FIELD_DETECTED'
  | 'JSONL_PARSE_ERROR';

export type DurableAuditIntegrityFindingSeverity = 'ERROR' | 'WARN';

export interface DurableAuditIntegrityFinding {
  code: DurableAuditIntegrityFindingCode;
  severity: DurableAuditIntegrityFindingSeverity;
  receiptId: string | null;
  lineNumber: number | null;
  message: string;
}

export interface DurableAuditIntegrityReadout {
  contractVersion: typeof DURABLE_AUDIT_INTEGRITY_READOUT_CONTRACT;
  total: number;
  valid: number;
  invalid: number;
  parseErrorCount: number;
  findings: DurableAuditIntegrityFinding[];
  mandatoryInvocationProved: false;
  directInterceptionProved: false;
  allValid: boolean;
  readoutAt: string;
}

export interface DurableAuditJsonlParseResult {
  records: DurableExecutionAuditRecord[];
  parseFindings: DurableAuditIntegrityFinding[];
}

function asRecordObject(record: unknown): Record<string, unknown> {
  if (typeof record === 'object' && record !== null) {
    return record as Record<string, unknown>;
  }
  return {};
}

function safeReceiptId(record: unknown): string | null {
  const value = asRecordObject(record)['receiptId'];
  if (typeof value === 'string' && RECEIPT_ID_PATTERN.test(value)) {
    return value;
  }
  return null;
}

function classifyRecord(record: unknown): DurableAuditIntegrityFinding[] {
  const findings: DurableAuditIntegrityFinding[] = [];
  const recordObject = asRecordObject(record);
  const rid = safeReceiptId(record);

  if (recordObject['contractVersion'] !== DURABLE_EXECUTION_AUDIT_CONTRACT) {
    findings.push({
      code: 'INVALID_CONTRACT_VERSION',
      severity: 'ERROR',
      receiptId: rid,
      lineNumber: null,
      message: `Record has invalid contract version; expected ${DURABLE_EXECUTION_AUDIT_CONTRACT}.`,
    });
  }

  if (typeof recordObject['receiptId'] !== 'string' || !RECEIPT_ID_PATTERN.test(recordObject['receiptId'])) {
    findings.push({
      code: 'MALFORMED_RECEIPT_ID',
      severity: 'ERROR',
      receiptId: rid,
      lineNumber: null,
      message: 'Record receiptId does not match the expected Delta receipt id pattern.',
    });
  }

  if (
    typeof recordObject['consumptionId'] !== 'string' ||
    !CONSUMPTION_ID_PATTERN.test(recordObject['consumptionId'])
  ) {
    findings.push({
      code: 'MALFORMED_CONSUMPTION_ID',
      severity: 'ERROR',
      receiptId: rid,
      lineNumber: null,
      message: 'Record consumptionId does not match the expected Delta consumption id pattern.',
    });
  }

  if (typeof recordObject['bindingHash'] !== 'string' || !BINDING_HASH_PATTERN.test(recordObject['bindingHash'])) {
    findings.push({
      code: 'INVALID_BINDING_HASH',
      severity: 'ERROR',
      receiptId: rid,
      lineNumber: null,
      message: 'Record bindingHash is not a valid 64-character hex value.',
    });
  }

  if (recordObject['mandatoryInvocationProved'] !== false) {
    findings.push({
      code: 'FORBIDDEN_MANDATORY_INVOCATION_CLAIM',
      severity: 'ERROR',
      receiptId: rid,
      lineNumber: null,
      message: 'Record mandatoryInvocationProved is not false; this bounded field must remain false.',
    });
  }

  if (recordObject['directInterceptionProved'] !== false) {
    findings.push({
      code: 'FORBIDDEN_DIRECT_INTERCEPTION_CLAIM',
      severity: 'ERROR',
      receiptId: rid,
      lineNumber: null,
      message: 'Record directInterceptionProved is not false; this bounded field must remain false.',
    });
  }

  if (recordObject['evidenceChainValid'] === false && recordObject['actionExecutionProved'] === true) {
    findings.push({
      code: 'INVALID_PROOF_CONSISTENCY',
      severity: 'ERROR',
      receiptId: rid,
      lineNumber: null,
      message: 'Record cannot prove action execution when evidenceChainValid is false.',
    });
  }

  const identityFieldNames = [
    'receiptId',
    'requestId',
    'consumptionId',
    'profileId',
  ] as const;
  for (const fieldName of identityFieldNames) {
    const value = recordObject[fieldName];
    if (typeof value === 'string' && SECRET_DETECT_PATTERN.test(value)) {
      findings.push({
        code: 'SECRET_LIKE_FIELD_DETECTED',
        severity: 'ERROR',
        receiptId: rid,
        lineNumber: null,
        message: `Record field '${String(fieldName)}' contains a secret-like pattern; raw value suppressed.`,
      });
    }
  }

  return findings.sort((a, b) => a.code.localeCompare(b.code));
}

function sortFindings(findings: DurableAuditIntegrityFinding[]): DurableAuditIntegrityFinding[] {
  return [...findings].sort((a, b) => {
    const aId = a.receiptId ?? '';
    const bId = b.receiptId ?? '';
    if (aId !== bId) return aId.localeCompare(bId);
    const lineA = a.lineNumber ?? 0;
    const lineB = b.lineNumber ?? 0;
    if (lineA !== lineB) return lineA - lineB;
    return a.code.localeCompare(b.code);
  });
}

export function buildDurableAuditIntegrityReadout(
  records: DurableExecutionAuditRecord[],
  options?: { readoutAt?: string },
): DurableAuditIntegrityReadout {
  let valid = 0;
  let invalid = 0;
  const allFindings: DurableAuditIntegrityFinding[] = [];

  for (const record of records) {
    const recordFindings = classifyRecord(record);
    if (recordFindings.length === 0) {
      valid++;
    } else {
      invalid++;
      allFindings.push(...recordFindings);
    }
  }

  return {
    contractVersion: DURABLE_AUDIT_INTEGRITY_READOUT_CONTRACT,
    total: records.length,
    valid,
    invalid,
    parseErrorCount: 0,
    findings: sortFindings(allFindings),
    mandatoryInvocationProved: false,
    directInterceptionProved: false,
    allValid: records.length > 0 && invalid === 0,
    readoutAt: options?.readoutAt ?? new Date().toISOString(),
  };
}

export function parseDurableAuditJsonlLines(text: string): DurableAuditJsonlParseResult {
  const records: DurableExecutionAuditRecord[] = [];
  const parseFindings: DurableAuditIntegrityFinding[] = [];
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.length === 0) continue;
    try {
      records.push(JSON.parse(line) as DurableExecutionAuditRecord);
    } catch {
      parseFindings.push({
        code: 'JSONL_PARSE_ERROR',
        severity: 'ERROR',
        receiptId: null,
        lineNumber: i + 1,
        message: `Line ${i + 1} could not be parsed as JSON.`,
      });
    }
  }

  return { records, parseFindings };
}

export function buildDurableAuditIntegrityReadoutFromJsonl(
  text: string,
  options?: { readoutAt?: string },
): DurableAuditIntegrityReadout {
  const { records, parseFindings } = parseDurableAuditJsonlLines(text);
  const base = buildDurableAuditIntegrityReadout(records, options);

  const combined = sortFindings([...parseFindings, ...base.findings]);

  return {
    ...base,
    parseErrorCount: parseFindings.length,
    findings: combined,
    allValid: records.length > 0 && base.invalid === 0 && parseFindings.length === 0,
  };
}
