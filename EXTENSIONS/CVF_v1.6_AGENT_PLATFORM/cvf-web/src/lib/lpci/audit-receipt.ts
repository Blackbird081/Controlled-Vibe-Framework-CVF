// LPCI1-T5: AuditReceipt construction per T4 AuditReceipt Schema
// model_response_hash = SHA-256 hex of LLM response text (or negative receipt payload)

import { createHash, randomUUID } from 'node:crypto';
import type {
  AuditReceipt,
  ConflictRecord,
  FilterParams,
  Phase1ReceiptType,
  ResponseBoundaryClass,
  RetrievalReceipt,
  StaleRecord,
} from './types';

export function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

interface BuildAuditReceiptOptions {
  query: string;
  query_timestamp: string;
  retrieval?: RetrievalReceipt;
  responseText?: string;
  response_boundary_class: ResponseBoundaryClass;
  phase1_receipt_type?: Phase1ReceiptType;
  applied_filters: FilterParams;
  sensitivity_pre_filter_applied: boolean;
  stale_records?: StaleRecord[];
  conflict_records?: ConflictRecord[];
}

export function buildAuditReceipt(opts: BuildAuditReceiptOptions): AuditReceipt {
  const {
    query,
    query_timestamp,
    retrieval,
    responseText,
    response_boundary_class,
    phase1_receipt_type,
    applied_filters,
    sensitivity_pre_filter_applied,
    stale_records,
    conflict_records,
  } = opts;

  // model_response_hash: SHA-256 of response text or negative receipt payload (never null)
  const hashInput = responseText ?? JSON.stringify({ receiptType: phase1_receipt_type ?? response_boundary_class, query });
  const model_response_hash = sha256Hex(hashInput);

  const receipt: AuditReceipt = {
    auditId: randomUUID(),
    query,
    query_timestamp,
    matched_paths: retrieval?.matched_paths ?? [],
    answer_class: retrieval?.answer_class ?? 'ESCALATE_OR_ABSTAIN',
    freshness_flag: retrieval?.freshness_flag ?? false,
    conflict_flag: retrieval?.conflict_flag ?? false,
    model_response_hash,
    response_boundary_class,
    applied_filters,
    sensitivity_pre_filter_applied,
  };

  if (phase1_receipt_type) {
    receipt.phase1_receipt_type = phase1_receipt_type;
  }
  if (stale_records && stale_records.length > 0) {
    receipt.stale_records = stale_records;
  }
  if (conflict_records && conflict_records.length > 0) {
    receipt.conflict_records = conflict_records;
  }

  return receipt;
}
