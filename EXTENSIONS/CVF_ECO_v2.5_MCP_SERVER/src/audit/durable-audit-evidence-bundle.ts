/** Delta-T11 durable audit evidence bundle and external reviewer readout. Pure deterministic summarization over supplied artifacts. */

import {
  type DurableExecutionAuditRecord,
} from './durable-execution-audit-store.js';
import {
  DURABLE_AUDIT_INTEGRITY_READOUT_CONTRACT,
  type DurableAuditIntegrityReadout,
} from './durable-execution-audit-readout.js';

export const DURABLE_AUDIT_EVIDENCE_BUNDLE_CONTRACT =
  'cvf.delta.durableAuditEvidenceBundle.v1' as const;

const SECRET_DETECT_PATTERN = /[=\s]|sk-|pk-|Bearer |token_|api[_-]?key/i;

export type DurableAuditEvidenceBundleClaimDisposition =
  | 'PROVED'
  | 'BOUNDED'
  | 'REJECTED'
  | 'NOT_CLAIMED';

export interface DurableAuditEvidenceBundleSourceRef {
  label: string;
  kind: 'record_store' | 'readout' | 'other';
  ref?: string;
}

export interface DurableAuditEvidenceBundleClaim {
  claimName: string;
  disposition: DurableAuditEvidenceBundleClaimDisposition;
  evidence: string;
  reviewerNote: string;
}

export interface DurableAuditEvidenceBundle {
  contractVersion: typeof DURABLE_AUDIT_EVIDENCE_BUNDLE_CONTRACT;
  readoutContractVersion: typeof DURABLE_AUDIT_INTEGRITY_READOUT_CONTRACT;
  recordCount: number;
  validRecordCount: number;
  invalidRecordCount: number;
  parseErrorCount: number;
  readoutAllValid: boolean;
  sourceRefs: DurableAuditEvidenceBundleSourceRef[];
  claimMatrix: DurableAuditEvidenceBundleClaim[];
  mandatoryInvocationProved: false;
  directInterceptionProved: false;
  bundledAt: string;
}

const CLAIM_ORDER: ReadonlyArray<string> = [
  'receipt_evidence',
  'action_evidence',
  'durable_storage',
  'integrity_readout',
  'mandatory_invocation',
  'direct_interception',
  'provider_live',
  'public_sync',
  'readiness',
  'universal_control',
];

function buildClaimMatrix(readout: DurableAuditIntegrityReadout): DurableAuditEvidenceBundleClaim[] {
  const hasRecords = readout.total > 0;
  const hasValidRecords = readout.valid > 0;
  const allValid = readout.allValid;
  const parseErrors = readout.parseErrorCount;
  const claims: DurableAuditEvidenceBundleClaim[] = [];

  if (!hasRecords) {
    claims.push({
      claimName: 'receipt_evidence',
      disposition: 'REJECTED',
      evidence: 'No supplied records.',
      reviewerNote: 'CLAIM_REJECTED_NO_RECEIPT: no records were supplied.',
    });
  } else if (!hasValidRecords) {
    claims.push({
      claimName: 'receipt_evidence',
      disposition: 'REJECTED',
      evidence: `Supplied ${readout.total} record(s); all failed integrity classification.`,
      reviewerNote: 'CLAIM_REJECTED_NO_RECEIPT: no valid receipt identity found in supplied records.',
    });
  } else {
    claims.push({
      claimName: 'receipt_evidence',
      disposition: 'PROVED',
      evidence: `Supplied ${readout.total} record(s); ${readout.valid} passed integrity classification.`,
      reviewerNote: 'CVF_RECEIPT_PRESENT: valid receipt identity found in supplied records.',
    });
  }

  if (!hasRecords) {
    claims.push({
      claimName: 'action_evidence',
      disposition: 'REJECTED',
      evidence: 'No supplied records.',
      reviewerNote: 'CLAIM_REJECTED_NO_ACTION: no records were supplied.',
    });
  } else if (allValid) {
    claims.push({
      claimName: 'action_evidence',
      disposition: 'PROVED',
      evidence: `All ${readout.total} supplied record(s) passed integrity classification.`,
      reviewerNote: 'ACTION_EVIDENCE_PRESENT: all supplied records are valid durable audit records.',
    });
  } else if (hasValidRecords) {
    const parseNote = parseErrors > 0 ? `, ${parseErrors} parse error(s)` : '';
    claims.push({
      claimName: 'action_evidence',
      disposition: 'BOUNDED',
      evidence: `Supplied ${readout.total} record(s); ${readout.valid} valid, ${readout.invalid} invalid${parseNote}.`,
      reviewerNote: 'BOUNDED: some supplied records passed, some did not; not all action evidence is valid.',
    });
  } else {
    claims.push({
      claimName: 'action_evidence',
      disposition: 'REJECTED',
      evidence: `Supplied ${readout.total} record(s); none passed integrity classification.`,
      reviewerNote: 'CLAIM_REJECTED_NO_ACTION: no valid action evidence in supplied records.',
    });
  }

  claims.push({
    claimName: 'durable_storage',
    disposition: 'BOUNDED',
    evidence: `${readout.total} record(s) supplied by caller; not live-fetched or externally observed.`,
    reviewerNote: 'BOUNDED: records are caller-supplied snapshots; live durable persistence is not verified here.',
  });

  if (!hasRecords) {
    claims.push({
      claimName: 'integrity_readout',
      disposition: 'REJECTED',
      evidence: 'No supplied records; readout is empty.',
      reviewerNote: 'REJECTED: no records to classify.',
    });
  } else if (allValid) {
    claims.push({
      claimName: 'integrity_readout',
      disposition: 'PROVED',
      evidence: `All ${readout.total} supplied record(s) passed all integrity checks.`,
      reviewerNote: 'PROVED: readout.allValid=true for all supplied records.',
    });
  } else if (hasValidRecords) {
    claims.push({
      claimName: 'integrity_readout',
      disposition: 'BOUNDED',
      evidence: `${readout.valid} of ${readout.total} supplied record(s) passed integrity checks; ${readout.findings.length} finding(s).`,
      reviewerNote: 'BOUNDED: partial integrity; some records have findings.',
    });
  } else {
    claims.push({
      claimName: 'integrity_readout',
      disposition: 'REJECTED',
      evidence: `${readout.total} supplied record(s); none passed integrity checks; ${readout.findings.length} finding(s).`,
      reviewerNote: 'REJECTED: all supplied records failed integrity classification.',
    });
  }

  const notClaimedRows: ReadonlyArray<{ claimName: string; reviewerNote: string }> = [
    {
      claimName: 'mandatory_invocation',
      reviewerNote: 'This bundle does not claim mandatory MCP tool invocation.',
    },
    {
      claimName: 'direct_interception',
      reviewerNote: 'This bundle does not claim IDE/shell/git/filesystem interception.',
    },
    {
      claimName: 'provider_live',
      reviewerNote: 'This bundle does not claim provider/live API call evidence.',
    },
    {
      claimName: 'public_sync',
      reviewerNote: 'This bundle does not claim public repository synchronization.',
    },
    {
      claimName: 'readiness',
      reviewerNote: 'This bundle does not claim external, deployment, or release readiness.',
    },
    {
      claimName: 'universal_control',
      reviewerNote: 'This bundle does not claim universal governed-coding control.',
    },
  ];

  for (const row of notClaimedRows) {
    claims.push({
      claimName: row.claimName,
      disposition: 'NOT_CLAIMED',
      evidence: 'Forbidden expansion; not applicable to this bounded evidence bundle.',
      reviewerNote: row.reviewerNote,
    });
  }

  return claims.sort((a, b) => {
    const ai = CLAIM_ORDER.indexOf(a.claimName);
    const bi = CLAIM_ORDER.indexOf(b.claimName);
    const aOrder = ai === -1 ? CLAIM_ORDER.length : ai;
    const bOrder = bi === -1 ? CLAIM_ORDER.length : bi;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.claimName.localeCompare(b.claimName);
  });
}

function validateReadoutBoundary(readout: DurableAuditIntegrityReadout): void {
  if (readout.contractVersion !== DURABLE_AUDIT_INTEGRITY_READOUT_CONTRACT) {
    throw new Error('Durable audit evidence bundle requires a Delta-T10 integrity readout contract.');
  }
  if (readout.mandatoryInvocationProved !== false) {
    throw new Error('Durable audit evidence bundle cannot accept a mandatory invocation proof claim.');
  }
  if (readout.directInterceptionProved !== false) {
    throw new Error('Durable audit evidence bundle cannot accept a direct interception proof claim.');
  }
}

export function buildDurableAuditEvidenceBundle(
  _records: DurableExecutionAuditRecord[],
  readout: DurableAuditIntegrityReadout,
  options?: {
    sourceRefs?: DurableAuditEvidenceBundleSourceRef[];
    bundledAt?: string;
  },
): DurableAuditEvidenceBundle {
  validateReadoutBoundary(readout);
  return {
    contractVersion: DURABLE_AUDIT_EVIDENCE_BUNDLE_CONTRACT,
    readoutContractVersion: DURABLE_AUDIT_INTEGRITY_READOUT_CONTRACT,
    recordCount: readout.total,
    validRecordCount: readout.valid,
    invalidRecordCount: readout.invalid,
    parseErrorCount: readout.parseErrorCount,
    readoutAllValid: readout.allValid,
    sourceRefs: options?.sourceRefs ?? [],
    claimMatrix: buildClaimMatrix(readout),
    mandatoryInvocationProved: false,
    directInterceptionProved: false,
    bundledAt: options?.bundledAt ?? readout.readoutAt,
  };
}

function sanitizeSourceLabel(label: string): string {
  if (SECRET_DETECT_PATTERN.test(label)) {
    return '[label suppressed: secret-like pattern detected]';
  }
  return label;
}

export function renderDurableAuditEvidenceBundleMarkdown(
  bundle: DurableAuditEvidenceBundle,
): string {
  const lines: string[] = [];

  lines.push('## Durable Audit Evidence Bundle');
  lines.push('');
  lines.push(`Contract: \`${bundle.contractVersion}\``);
  lines.push('');
  lines.push(`Bundled at: ${bundle.bundledAt}`);
  lines.push('');
  lines.push('### Record Counts');
  lines.push('');
  lines.push('| Field | Value |');
  lines.push('| --- | --- |');
  lines.push(`| Total records | ${bundle.recordCount} |`);
  lines.push(`| Valid records | ${bundle.validRecordCount} |`);
  lines.push(`| Invalid records | ${bundle.invalidRecordCount} |`);
  lines.push(`| Parse errors | ${bundle.parseErrorCount} |`);
  lines.push(`| All valid | ${bundle.readoutAllValid} |`);
  lines.push('');

  if (bundle.sourceRefs.length > 0) {
    lines.push('### Source References');
    lines.push('');
    lines.push('| Label | Kind | Ref |');
    lines.push('| --- | --- | --- |');
    for (const ref of bundle.sourceRefs) {
      const safeLabel = sanitizeSourceLabel(ref.label);
      const safeRef = ref.ref !== undefined ? sanitizeSourceLabel(ref.ref) : '-';
      lines.push(`| ${safeLabel} | ${ref.kind} | ${safeRef} |`);
    }
    lines.push('');
  }

  lines.push('### Claim Matrix');
  lines.push('');
  lines.push('| Claim | Disposition | Evidence | Reviewer Note |');
  lines.push('| --- | --- | --- | --- |');
  for (const claim of bundle.claimMatrix) {
    lines.push(`| ${claim.claimName} | ${claim.disposition} | ${claim.evidence} | ${claim.reviewerNote} |`);
  }
  lines.push('');
  lines.push('### Bounded Claim Statement');
  lines.push('');
  lines.push(`- \`mandatoryInvocationProved\`: ${bundle.mandatoryInvocationProved}`);
  lines.push(`- \`directInterceptionProved\`: ${bundle.directInterceptionProved}`);
  lines.push('');
  lines.push('This bundle summarizes supplied audit artifacts only. It does not prove that');
  lines.push('all actions pass through CVF, that external actions were observed, that');
  lines.push('direct IDE/shell/git/filesystem activity was intercepted, that public');
  lines.push('artifacts were updated, or that CVF has universal governed-coding control.');

  return lines.join('\n');
}
