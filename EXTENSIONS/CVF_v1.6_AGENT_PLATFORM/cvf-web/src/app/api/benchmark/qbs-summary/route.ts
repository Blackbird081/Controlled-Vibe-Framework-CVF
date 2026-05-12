import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export interface QBSRunSummary {
    run: string;
    run_id: string;
    kappa: number | null;
    rho: number | null;
    paired: number;
    agreement_pass: boolean;
    hard_gates_pass: boolean;
    median_delta_b_a1: number | null;
    l4_pass: boolean;
    public_status: string;
}

export interface QBSFamilyDelta {
    family: string;
    median_delta_b_vs_a1: number;
    negative_delta_task_count: number;
    positive_delta_task_count: number;
    zero_delta_task_count: number;
}

export interface QBSSummary {
    runs: QBSRunSummary[];
    latest_status: string;
    latest_run: string;
    family_deltas_r10: QBSFamilyDelta[];
    suspended: boolean;
    suspension_reason: string;
}

const BENCHMARK_ROOT = path.join(process.cwd(), '..', '..', '..', '..', '..', '..', 'docs', 'benchmark');

function readJson<T>(filePath: string): T | null {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
    } catch {
        return null;
    }
}

// Module-level cache — recomputed once per cold start, not per request.
let cached: QBSSummary | null = null;

function buildSummary(): QBSSummary {
    if (cached) return cached;

    const qbs1 = path.join(BENCHMARK_ROOT, 'qbs-1');
    const runs: QBSRunSummary[] = [];

    // R5-R7 from drift analysis (QBS-14)
    const drift = readJson<Record<string, unknown>>(path.join(qbs1, 'reviewer-drift-analysis-qbs14.json'));
    const driftRuns = (drift?.runs as Array<Record<string, unknown>>) ?? [];
    const historicDeltas: Record<string, number> = { R5: -0.25, R6: -0.125, R7: -0.125 };
    for (const r of driftRuns) {
        const rid = r.run_id as string;
        const suffix = rid.split('-').pop()!.toUpperCase();
        const ag = r.agreement as Record<string, unknown>;
        runs.push({
            run: suffix,
            run_id: rid,
            kappa: (ag?.quadratic_weighted_cohen_kappa as number) ?? null,
            rho: (ag?.spearman_rho as number) ?? null,
            paired: (ag?.paired_score_count as number) ?? 0,
            agreement_pass: ag?.status === 'PASS',
            hard_gates_pass: true,
            median_delta_b_a1: historicDeltas[suffix] ?? null,
            l4_pass: false,
            public_status: (r.public_status as string) ?? '',
        });
    }

    // R8-R10 from post-score analysis JSONs
    const postScoreFiles: [string, string][] = [
        ['r8-post-score-analysis-qbs21.json', 'qbs1-powered-single-provider-20260510-alibaba-r8'],
        ['r9-post-score-analysis-qbs25.json', 'qbs1-powered-single-provider-20260511-alibaba-r9'],
        ['r10-post-score-analysis-qbs41.json', 'qbs1-powered-single-provider-20260512-alibaba-r10'],
    ];

    for (const [fname, run_id] of postScoreFiles) {
        const ps = readJson<Record<string, unknown>>(path.join(qbs1, fname));
        if (!ps) continue;
        const suffix = run_id.split('-').pop()!.toUpperCase();
        const ag = ps.reviewer_agreement as Record<string, unknown>;
        const l4 = ps.l4_thresholds as Record<string, unknown>;
        runs.push({
            run: suffix,
            run_id,
            kappa: (ag?.quadratic_weighted_cohen_kappa as number) ?? null,
            rho: (ag?.spearman_rho as number) ?? null,
            paired: (ag?.paired_score_count as number) ?? 0,
            agreement_pass: ag?.status === 'PASS',
            hard_gates_pass: (l4?.hard_gates_passed as boolean) ?? true,
            median_delta_b_a1: (l4?.median_quality_delta_b_vs_a1 as number) ?? null,
            l4_pass: false,
            public_status: (ps.source_public_status as string) ?? (ps.status as string) ?? '',
        });
    }

    // Family deltas from R10
    const ps10 = readJson<Record<string, unknown>>(path.join(qbs1, 'r10-post-score-analysis-qbs41.json'));
    const qs = ps10?.quality_delta_summary as Record<string, unknown> | undefined;
    const family_deltas_r10: QBSFamilyDelta[] = ((qs?.by_family as Array<Record<string, unknown>>) ?? []).map(f => ({
        family: f.family as string,
        median_delta_b_vs_a1: f.median_delta_b_vs_a1 as number,
        negative_delta_task_count: f.negative_delta_task_count as number,
        positive_delta_task_count: f.positive_delta_task_count as number,
        zero_delta_task_count: f.zero_delta_task_count as number,
    }));

    const latest = runs[runs.length - 1];

    cached = {
        runs,
        latest_status: latest?.public_status ?? '',
        latest_run: latest?.run_id ?? '',
        family_deltas_r10,
        suspended: true,
        suspension_reason:
            'QBS live reruns suspended after R10. Reviewer agreement (kappa 0.379) has not improved across R6–R10 with current reviewer models. Resumption requires reviewer model upgrade + fresh GC-018 + explicit user authorization.',
    };

    return cached;
}

export async function GET() {
    const summary = buildSummary();
    return NextResponse.json(summary);
}
