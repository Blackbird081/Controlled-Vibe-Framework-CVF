/** Delta-T9 durable execution audit contract and local JSONL store boundary. */

import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import {
  RECEIPT_TO_EXECUTION_AUDIT_CONTRACT,
  type ReceiptToExecutionEvidenceAudit,
} from './receipt-to-execution-evidence-auditor.js';
import { RECEIPT_ID_PATTERN } from '../persistence/json-receipt-consumption.store.js';
import { CONSUMPTION_ID_PATTERN } from '../persistence/json-governed-execution.store.js';

export const DURABLE_EXECUTION_AUDIT_CONTRACT =
  'cvf.delta.durableExecutionAudit.v1' as const;

export const BINDING_HASH_PATTERN = /^[0-9a-f]{64}$/;

const SECRET_REJECT_PATTERN = /[=\s]|sk-|pk-|Bearer |token_|api[_-]?key/i;
const SAFE_IDENTITY_MAX_LENGTH = 256;

export type DurableAuditRetentionClass = 'LOCAL_GOVERNANCE_EVIDENCE';

export type DurableAuditDisposalAdvisory =
  | 'RETAIN_UNTIL_MANUAL_REVIEW'
  | 'EPHEMERAL_TEST_ONLY';

export type DurableAuditPrivacyBoundary =
  'NO_RAW_SECRETS_NO_ENV_NO_PROVIDER_KEYS_NO_FULL_COMMAND_OUTPUT';

export interface DurableExecutionAuditRecord {
  contractVersion: typeof DURABLE_EXECUTION_AUDIT_CONTRACT;
  receiptId: string;
  requestId: string;
  consumptionId: string;
  profileId: string;
  bindingHash: string;
  evidenceChainValid: boolean;
  actionExecutionProved: boolean;
  approvalBackedMutationProved: boolean;
  findings: string[];
  retentionClass: DurableAuditRetentionClass;
  disposalAdvisory: DurableAuditDisposalAdvisory;
  privacyBoundary: DurableAuditPrivacyBoundary;
  mandatoryInvocationProved: false;
  directInterceptionProved: false;
  auditedAt: string;
}

export interface DurableExecutionAuditInput {
  audit: ReceiptToExecutionEvidenceAudit;
  receiptId: string;
  requestId: string;
  consumptionId: string;
  profileId: string;
  bindingHash: string;
  disposalAdvisory?: DurableAuditDisposalAdvisory;
  auditedAt?: string;
}

function rejectSecretLike(field: string, value: string): void {
  if (value.length > SAFE_IDENTITY_MAX_LENGTH) {
    throw new Error(`Durable audit field '${field}' exceeds safe identity length.`);
  }
  if (SECRET_REJECT_PATTERN.test(value)) {
    throw new Error(`Durable audit field '${field}' contains a secret-like or unsafe value.`);
  }
}

export function buildDurableAuditRecord(
  input: DurableExecutionAuditInput,
): DurableExecutionAuditRecord {
  const { audit, receiptId, requestId, consumptionId, profileId, bindingHash } = input;

  if (audit.contractVersion !== RECEIPT_TO_EXECUTION_AUDIT_CONTRACT) {
    throw new Error(
      'Durable audit input does not carry a valid Delta-T7 audit contract version.',
    );
  }
  if (!RECEIPT_ID_PATTERN.test(receiptId)) {
    throw new Error(
      'Durable audit receiptId does not match the expected Delta receipt id pattern.',
    );
  }
  if (!CONSUMPTION_ID_PATTERN.test(consumptionId)) {
    throw new Error(
      'Durable audit consumptionId does not match the expected Delta consumption id pattern.',
    );
  }
  if (!BINDING_HASH_PATTERN.test(bindingHash)) {
    throw new Error('Durable audit bindingHash is not a valid 64-character hex value.');
  }

  rejectSecretLike('requestId', requestId);
  rejectSecretLike('profileId', profileId);

  return {
    contractVersion: DURABLE_EXECUTION_AUDIT_CONTRACT,
    receiptId,
    requestId,
    consumptionId,
    profileId,
    bindingHash,
    evidenceChainValid: audit.evidenceChainValid,
    actionExecutionProved: audit.actionExecutionProved,
    approvalBackedMutationProved: audit.approvalBackedMutationProved,
    findings: [...audit.findings].sort(),
    retentionClass: 'LOCAL_GOVERNANCE_EVIDENCE',
    disposalAdvisory: input.disposalAdvisory ?? 'RETAIN_UNTIL_MANUAL_REVIEW',
    privacyBoundary: 'NO_RAW_SECRETS_NO_ENV_NO_PROVIDER_KEYS_NO_FULL_COMMAND_OUTPUT',
    mandatoryInvocationProved: false,
    directInterceptionProved: false,
    auditedAt: input.auditedAt ?? new Date().toISOString(),
  };
}

function rejectTraversal(filePath: string): void {
  if (filePath.includes('..')) {
    throw new Error('Durable audit store file path contains a path traversal sequence.');
  }
}

function validateDurableRecordBoundary(record: DurableExecutionAuditRecord): void {
  if (record.contractVersion !== DURABLE_EXECUTION_AUDIT_CONTRACT) {
    throw new Error(
      'Durable audit record has mismatched durable audit contract version.',
    );
  }
  if (!RECEIPT_ID_PATTERN.test(record.receiptId)) {
    throw new Error('Durable audit record receiptId is invalid.');
  }
  if (!CONSUMPTION_ID_PATTERN.test(record.consumptionId)) {
    throw new Error('Durable audit record consumptionId is invalid.');
  }
  if (!BINDING_HASH_PATTERN.test(record.bindingHash)) {
    throw new Error('Durable audit record bindingHash is invalid.');
  }
  rejectSecretLike('requestId', record.requestId);
  rejectSecretLike('profileId', record.profileId);
  if (record.mandatoryInvocationProved !== false) {
    throw new Error('Durable audit record cannot prove mandatory invocation.');
  }
  if (record.directInterceptionProved !== false) {
    throw new Error('Durable audit record cannot prove direct interception.');
  }
  if (!record.evidenceChainValid && record.actionExecutionProved) {
    throw new Error(
      'Durable audit record cannot prove action execution when evidence chain is invalid.',
    );
  }
}

export class JsonDurableExecutionAuditStore {
  constructor(private readonly filePath: string) {
    rejectTraversal(filePath);
  }

  async appendRecord(record: DurableExecutionAuditRecord): Promise<void> {
    validateDurableRecordBoundary(record);
    await mkdir(dirname(this.filePath), { recursive: true });
    await appendFile(this.filePath, JSON.stringify(record) + '\n', 'utf-8');
  }

  async readRecords(): Promise<DurableExecutionAuditRecord[]> {
    let content: string;
    try {
      content = await readFile(this.filePath, 'utf-8');
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as NodeJS.ErrnoException).code === 'ENOENT'
      ) {
        return [];
      }
      throw error;
    }
    return content
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .map((line) => {
        const record = JSON.parse(line) as DurableExecutionAuditRecord;
        validateDurableRecordBoundary(record);
        return record;
      });
  }
}
