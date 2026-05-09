import { NextResponse } from 'next/server';

/**
 * GET /api/kernel-telemetry — Return kernel runtime telemetry
 *
 * Returns simulated kernel telemetry data matching the real
 * ExecutionOrchestrator.getTelemetry() format.
 * When kernel is wired to live runtime, replace with real data.
 */

interface TraceEntry {
    requestId: string;
    domain: string;
    riskLevel: string;
    decisionCode: string;
    traceHash: string;
    policyVersion: string;
    timestamp: number;
    action?: string;
    latencyMs?: number;
}

// In-memory telemetry store (per-server instance)
const telemetryStore: {
    traces: TraceEntry[];
    riskHistory: { level: string; timestamp: number; score: number }[];
    stats: {
        totalRequests: number;
        refusalCount: number;
        avgLatencyMs: number;
        p95LatencyMs: number;
        domainLockActive: boolean;
        currentRiskLevel: string;
        policyVersion: string;
    };
} = {
    traces: [],
    riskHistory: [],
    stats: {
        totalRequests: 0,
        refusalCount: 0,
        avgLatencyMs: 0,
        p95LatencyMs: 0,
        domainLockActive: true,
        currentRiskLevel: 'R0',
        policyVersion: 'v1',
    },
};

// Seed some initial data for demo
function ensureSeeded() {
    if (telemetryStore.traces.length > 0) return;

    const now = Date.now();
    const domains = ['content', 'code', 'analysis', 'general'];
    const risks = ['R0', 'R0', 'R0', 'R1', 'R1', 'R2', 'R0', 'R1'];
    const decisions: string[] = [
        'ALLOW_RELEASED', 'ALLOW_RELEASED', 'ALLOW_RELEASED',
        'ALLOW_RELEASED', 'REFUSAL_CLARIFY', 'REFUSAL_APPROVAL',
        'ALLOW_RELEASED', 'ALLOW_RELEASED',
    ];

    for (let i = 0; i < 8; i++) {
        const ts = now - (8 - i) * 120000;
        const reqId = `req-${ts}-${Math.random().toString(36).slice(2, 8)}`;
        telemetryStore.traces.push({
            requestId: reqId,
            domain: domains[i % domains.length],
            riskLevel: risks[i],
            decisionCode: decisions[i],
            traceHash: Array.from({ length: 16 }, () =>
                Math.floor(Math.random() * 16).toString(16)
            ).join(''),
            policyVersion: 'v1',
            timestamp: ts,
            action: ['generate_content', 'code_review', 'analyze_data', 'general_query'][i % 4],
            latencyMs: Math.round(0.2 + Math.random() * 0.8),
        });

        telemetryStore.riskHistory.push({
            level: risks[i],
            timestamp: ts,
            score: { R0: 0.1, R1: 0.35, R2: 0.65, R3: 0.85, R4: 0.95 }[risks[i]] || 0.1,
        });
    }

    const refusals = decisions.filter(d => d.startsWith('REFUSAL_')).length;
    telemetryStore.stats = {
        totalRequests: 8,
        refusalCount: refusals,
        avgLatencyMs: 0.45,
        p95LatencyMs: 1.0,
        domainLockActive: true,
        currentRiskLevel: risks[risks.length - 1],
        policyVersion: 'v1',
    };
}

export async function GET() {
    ensureSeeded();
    return NextResponse.json(telemetryStore);
}
