import { join } from 'node:path';

export interface GovernanceTaxPhases {
    pre_processing_ms: number;
    policy_engine_ms: number;
    provider_ms: number;
    post_processing_ms: number;
}

export type GovernanceTaxGrade = 'GREEN' | 'AMBER' | 'RED';

export interface GovernanceTaxLog {
    request_id: string;
    ts: string;
    phase_ms: GovernanceTaxPhases;
    governance_tax_ms: number;
    total_ms: number;
    governance_tax_pct: number;
    decision: string;
    grade: GovernanceTaxGrade;
    provider: string;
    governance_family: string | null;
}

const LOG_DIR = process.env.CVF_TAX_LOG_DIR ?? join(process.cwd(), 'logs', 'governance-tax');
const LOG_FILE = join(LOG_DIR, 'governance-tax.jsonl');

export function evaluateFitness(tax_pct: number): GovernanceTaxGrade {
    if (tax_pct < 10) return 'GREEN';
    if (tax_pct < 20) return 'AMBER';
    return 'RED';
}

export function computeGovernanceTax(phases: GovernanceTaxPhases): {
    governance_tax_ms: number;
    total_ms: number;
    governance_tax_pct: number;
} {
    const governance_tax_ms = phases.pre_processing_ms + phases.policy_engine_ms + phases.post_processing_ms;
    const total_ms = governance_tax_ms + phases.provider_ms;
    const governance_tax_pct = total_ms > 0 ? (governance_tax_ms / total_ms) * 100 : 0;
    return { governance_tax_ms, total_ms, governance_tax_pct };
}

export function _writeTaxLog(logDir: string, logFile: string, line: string): void {
    // Dynamically require node:fs so this module can be imported in jsdom environments
    // without triggering the browser-external stub at module load time.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('node:fs') as typeof import('node:fs');
    fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(logFile, line, 'utf8');
}

// Indirection object lets vi.spyOn intercept _writeTaxLog in tests without
// ESM re-export tricks. logGovernanceTax always calls through this object.
export const _taxLogSink = { write: _writeTaxLog };

export function logGovernanceTax(entry: GovernanceTaxLog): void {
    try {
        _taxLogSink.write(LOG_DIR, LOG_FILE, JSON.stringify(entry) + '\n');
    } catch {
        // Non-fatal: tax logging must never break the execution path
    }
}

export function buildGovernanceTaxEntry(input: {
    request_id: string;
    phases: GovernanceTaxPhases;
    decision: string;
    provider: string;
    governance_family: string | null | undefined;
}): GovernanceTaxLog {
    const { governance_tax_ms, total_ms, governance_tax_pct } = computeGovernanceTax(input.phases);
    return {
        request_id: input.request_id,
        ts: new Date().toISOString(),
        phase_ms: input.phases,
        governance_tax_ms,
        total_ms,
        governance_tax_pct,
        decision: input.decision,
        grade: evaluateFitness(governance_tax_pct),
        provider: input.provider,
        governance_family: input.governance_family ?? null,
    };
}
