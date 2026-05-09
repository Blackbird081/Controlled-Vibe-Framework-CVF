export const LANE_STATUSES = [
  'UNCONFIGURED',
  'BLOCKED',
  'LIVE',
  'CANARY_PASS',
  'CERTIFIED',
  'DEGRADED',
  'EXPERIMENTAL',
] as const;

export type LaneStatus = (typeof LANE_STATUSES)[number];

export interface ReceiptSummary {
  runId: string;
  overallStatus: 'PASS' | 'FAIL' | 'SKIP';
  passCount: number;
}

export interface LaneRecord {
  provider: string;
  model: string;
  status: LaneStatus;
  lastRunAt: string | null;
  receiptPath: string | null;
  reason: string | null;
}

const CERTIFICATION_WINDOW = 3;
const SCENARIOS_TOTAL = 6;

/**
 * Derives lane status from an ordered receipt history (oldest first).
 * UNCONFIGURED and BLOCKED are set externally (no key / auth failure).
 */
export function classifyFromReceipts(receipts: ReceiptSummary[]): LaneStatus {
  if (receipts.length === 0) return 'EXPERIMENTAL';

  const latest = receipts[receipts.length - 1];
  const latestFullPass =
    latest.overallStatus === 'PASS' && latest.passCount === SCENARIOS_TOTAL;

  if (!latestFullPass) {
    const hasPriorPass = receipts
      .slice(0, -1)
      .some((r) => r.overallStatus === 'PASS' && r.passCount === SCENARIOS_TOTAL);
    return hasPriorPass ? 'DEGRADED' : 'LIVE';
  }

  let consecutive = 0;
  for (let i = receipts.length - 1; i >= 0; i--) {
    const r = receipts[i];
    if (r.overallStatus === 'PASS' && r.passCount === SCENARIOS_TOTAL) {
      consecutive++;
    } else {
      break;
    }
  }

  return consecutive >= CERTIFICATION_WINDOW ? 'CERTIFIED' : 'CANARY_PASS';
}
