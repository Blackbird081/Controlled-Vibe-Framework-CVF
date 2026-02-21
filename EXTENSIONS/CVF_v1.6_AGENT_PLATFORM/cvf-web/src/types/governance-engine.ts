/**
 * CVF v1.6.1 Governance Engine — Shared Types
 *
 * Types matching the FastAPI server response shapes from
 * EXTENSIONS/CVF_v1.6.1_GOVERNANCE_ENGINE/ai_governance_core/api/server.py
 *
 * @module types/governance-engine
 */

// ──────────────────────────────────────────────
// API Envelope
// ──────────────────────────────────────────────

/** Standard CVFResponse wrapper returned by all v1.6.1 endpoints */
export interface CVFApiResponse<T = Record<string, unknown>> {
    status: 'ok' | 'error';
    timestamp: string;
    data: T;
}

// ──────────────────────────────────────────────
// Health
// ──────────────────────────────────────────────

export interface GovernanceHealthStatus {
    status: 'healthy' | 'unhealthy';
    service: string;
    version: string;
    timestamp: string;
}

// ──────────────────────────────────────────────
// Evaluate
// ──────────────────────────────────────────────

/** POST /api/v1/evaluate request body */
export interface GovernanceEvaluateRequest {
    request_id: string;
    artifact_id: string;
    payload: Record<string, unknown>;
    cvf_phase?: string;       // A-E
    cvf_risk_level?: string;  // R0-R4
}

/** CVF Quality 4-dimension result from CVFQualityAdapter */
export interface CVFQualityResult {
    correctness: number;   // 0-1
    safety: number;        // 0-1 (2x weight)
    alignment: number;     // 0-1
    quality: number;       // 0-1
    overall: number;       // weighted 0-1
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

/** CVF Enforcement result from CVFEnforcementAdapter */
export interface CVFEnforcementResult {
    action: 'ALLOW' | 'BLOCK' | 'NEEDS_APPROVAL' | 'ESCALATE' | 'LOG_ONLY';
    phase_authority: {
        phase: string;
        can_approve: boolean;
        can_override: boolean;
        max_risk: string;
    };
}

/** Full governance evaluation result (data field from CVFResponse) */
export interface GovernanceEvaluateResult {
    report: {
        status: 'APPROVED' | 'MANUAL_REVIEW' | 'REJECTED' | 'FROZEN';
        risk_score: number;
        risk_level: string;
        decision: Record<string, unknown>;
        compliance_result: Record<string, unknown> | null;
        brand_result: Record<string, unknown> | null;
        cvf_risk_level: string;      // "R0"-"R4"
        cvf_risk_tier: string;       // "LOW"-"CRITICAL"
        cvf_quality: CVFQualityResult;
        cvf_enforcement: CVFEnforcementResult;
        ledger_hash: string;
        [key: string]: unknown;
    };
    execution_record: {
        request_id: string;
        artifact_id: string;
        risk_score: number;
        status: string;
        timestamp: string;
        [key: string]: unknown;
    };
}

// ──────────────────────────────────────────────
// Approve
// ──────────────────────────────────────────────

/** POST /api/v1/approve request body */
export interface GovernanceApproveRequest {
    request_id: string;
    approver_id: string;
    decision: 'APPROVED' | 'REJECTED';
    comment?: string;
}

/** Approval step detail */
export interface ApprovalStep {
    role: string;
    approver: string | null;
    decision: string | null;
    timestamp: string | null;
    comment: string | null;
}

/** Approval result (data field from CVFResponse) */
export interface GovernanceApproveResult {
    request_id: string;
    status: string;
    current_step: number;
    total_decisions: number;
}

// ──────────────────────────────────────────────
// Ledger
// ──────────────────────────────────────────────

/** A single block in the immutable hash-chain ledger */
export interface LedgerBlock {
    hash: string;
    previous_hash: string;
    event: Record<string, unknown>;
    timestamp: string;
    block_index: number;
}

/** Ledger query result (data field from CVFResponse) */
export interface GovernanceLedgerResult {
    total_blocks: number;
    returned: number;
    entries: LedgerBlock[];
}

// ──────────────────────────────────────────────
// Risk Convert
// ──────────────────────────────────────────────

/** POST /api/v1/risk-convert request body */
export interface GovernanceRiskConvertRequest {
    value: string;
    direction: 'to_cvf' | 'from_cvf';
}

/** Risk convert result (data field from CVFResponse) */
export interface GovernanceRiskConvertResult {
    input: string;
    cvf_level?: string;
    internal_level?: string;
    numeric_score?: number;
    direction: string;
}

// ──────────────────────────────────────────────
// Connection status
// ──────────────────────────────────────────────

export type GovernanceConnectionStatus = 'connected' | 'disconnected' | 'checking';

/** Client-side governance engine state */
export interface GovernanceEngineState {
    enabled: boolean;
    url: string;
    connectionStatus: GovernanceConnectionStatus;
    lastHealthCheck: string | null;
    version: string | null;
}
