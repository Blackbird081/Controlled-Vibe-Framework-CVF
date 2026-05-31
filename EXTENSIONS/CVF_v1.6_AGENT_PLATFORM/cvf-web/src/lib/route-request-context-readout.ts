import type { ExecutionRequest } from '@/lib/ai';

export const ROUTE_REQUEST_CONTEXT_READOUT_VERSION = 'cvf.routeRequestContextProfile.vi2.v1';

export type RouteRequestContextProfile = 'minimal' | 'task' | 'interactive';
export type RouteRequestContextBudgetTier = 'minimal' | 'standard' | 'expanded';
export type RouteRequestContextReadiness =
    | 'ready'
    | 'needs_clarification'
    | 'needs_context_compaction'
    | 'blocked_contaminated_brief';

export interface RouteRequestContextReadout {
    readoutVersion: typeof ROUTE_REQUEST_CONTEXT_READOUT_VERSION;
    profile: RouteRequestContextProfile;
    budgetTier: RouteRequestContextBudgetTier;
    readiness: RouteRequestContextReadiness;
    approxTokens: number;
    wordCount: number;
    signalDensity: number;
    detectedSignals: readonly string[];
    missingSignals: readonly string[];
    noiseFlags: readonly string[];
    contaminationFlags: readonly string[];
    includedSurfaces: readonly string[];
    excludedSurfaces: readonly string[];
    executionCeiling: {
        modelProviderCall: 'existing_route_only';
        toolExecution: false;
        mcpAccess: false;
        memoryInjection: false;
        profileEscalation: 'advisory_only';
    };
    recommendedNextAction: string;
    boundaries: readonly string[];
}

export interface BuildRouteRequestContextReadoutInput {
    request: Partial<ExecutionRequest>;
    knowledgeContextLength?: number;
    retrievedChunkCount?: number;
    chainTurnIndex?: number;
}

const SIGNAL_CHECKS = [
    ['active_task_objective', /\b(goal|objective|intent|create|build|analy[sz]e|review|plan|design|viết|tạo|phân tích|đánh giá)\b/i],
    ['business_goal_or_audience', /\b(user|users|customer|customers|audience|targetusers|team|teams|stakeholder|stakeholders|noncoder|người dùng|khách hàng|đối tượng)\b/i],
    ['constraints_or_risks', /\b(constraint|constraints|risk|risks|deadline|budget|must|must preserve|successcriteria|success criteria|ràng buộc|rủi ro|tiêu chí)\b/i],
    ['target_artifact_or_template', /\b(brief|pack|app|document|report|workflow|template|artifact|bản|ứng dụng|tài liệu)\b/i],
] as const;

function collectText(request: Partial<ExecutionRequest>): string {
    return [
        request.intent,
        request.templateName,
        request.templateId,
        ...Object.entries(request.inputs ?? {}).map(([key, value]) => `${key}: ${value}`),
    ].filter(Boolean).join('\n');
}

function unique(values: string[]): string[] {
    return [...new Set(values)];
}

function countWords(text: string): number {
    return text.trim().split(/\s+/).filter(Boolean).length;
}

function detectSignals(text: string, request: Partial<ExecutionRequest>, retrievedChunkCount: number): string[] {
    const signals: string[] = SIGNAL_CHECKS
        .filter(([, pattern]) => pattern.test(text))
        .map(([signal]) => signal);
    if (request.skillPreflightPassed || request.skillPreflightDeclaration) signals.push('governance_preflight');
    if (request.knowledgeCollectionId || request.knowledgeContext || retrievedChunkCount > 0) signals.push('knowledge_context');
    return unique(signals);
}

function detectNoise(text: string, approxTokens: number): string[] {
    const flags: string[] = [];
    if (approxTokens > 900) flags.push('oversized_context');
    if (/(\bat\s+\S+\s+\(|traceback|stack trace|error:|warning:).{80,}/i.test(text)) flags.push('raw_log_stream');
    if (/(full file|entire file|whole repo|all history|toàn bộ file|toàn bộ log)/i.test(text)) flags.push('unscoped_context_dump');
    return flags;
}

function detectContamination(text: string): string[] {
    const flags: string[] = [];
    if (/```/.test(text)) flags.push('contains_code_block');
    if (/(ignore (all )?(previous|above) instructions|bypass|disable.*governance|skip.*approval|bỏ qua.*quy định)/i.test(text)) flags.push('policy_bypass_language');
    if (/(api[_-]?key|secret|token)\s*[:=]\s*['"]?[A-Za-z0-9_\-]{16,}/i.test(text)) flags.push('secret_like_token');
    return flags;
}

function missingSignals(detected: readonly string[]): string[] {
    const missing: string[] = [];
    if (!detected.includes('active_task_objective')) missing.push('problem_statement_or_task_objective');
    if (!detected.includes('business_goal_or_audience')) missing.push('target_user_or_audience');
    if (!detected.includes('constraints_or_risks')) missing.push('constraints_or_success_criteria');
    return missing;
}

function selectReadiness(
    missing: readonly string[],
    noise: readonly string[],
    contamination: readonly string[],
): RouteRequestContextReadiness {
    if (contamination.includes('policy_bypass_language') || contamination.includes('secret_like_token')) {
        return 'blocked_contaminated_brief';
    }
    if (noise.length > 0 || contamination.includes('contains_code_block')) {
        return 'needs_context_compaction';
    }
    if (missing.includes('problem_statement_or_task_objective') || missing.length >= 2) {
        return 'needs_clarification';
    }
    return 'ready';
}

function selectProfile(wordCount: number, readiness: RouteRequestContextReadiness, turnIndex: number): RouteRequestContextProfile {
    if (readiness === 'needs_clarification' || wordCount <= 16) return 'minimal';
    if (turnIndex >= 2 || wordCount > 180) return 'interactive';
    return 'task';
}

function selectBudgetTier(approxTokens: number, readiness: RouteRequestContextReadiness): RouteRequestContextBudgetTier {
    if (readiness === 'needs_context_compaction' || approxTokens > 700) return 'expanded';
    if (approxTokens <= 220) return 'minimal';
    return 'standard';
}

function nextAction(readiness: RouteRequestContextReadiness): string {
    switch (readiness) {
        case 'blocked_contaminated_brief':
            return 'Remove bypass language or secret-like material, then re-submit a clean bounded request.';
        case 'needs_context_compaction':
            return 'Compact noisy context to objective, constraints, relevant evidence, and target artifact before rerun.';
        case 'needs_clarification':
            return 'Ask for the missing objective, audience, or constraints before spending another live provider call.';
        case 'ready':
            return 'Proceed with existing governed route execution; no context-profile escalation is needed.';
    }
}

export function buildRouteRequestContextReadout(
    input: BuildRouteRequestContextReadoutInput,
): RouteRequestContextReadout {
    const text = collectText(input.request);
    const wordCount = countWords(text);
    const approxTokens = Math.ceil(text.length / 4);
    const retrievedChunkCount = input.retrievedChunkCount ?? 0;
    const detectedSignals = detectSignals(text, input.request, retrievedChunkCount);
    const missing = missingSignals(detectedSignals);
    const noiseFlags = detectNoise(text, approxTokens);
    const contaminationFlags = detectContamination(text);
    const readiness = selectReadiness(missing, noiseFlags, contaminationFlags);
    const profile = selectProfile(wordCount, readiness, input.chainTurnIndex ?? 1);
    const budgetTier = selectBudgetTier(approxTokens, readiness);

    return {
        readoutVersion: ROUTE_REQUEST_CONTEXT_READOUT_VERSION,
        profile,
        budgetTier,
        readiness,
        approxTokens,
        wordCount,
        signalDensity: Number((detectedSignals.length / Math.max(1, detectedSignals.length + missing.length)).toFixed(3)),
        detectedSignals,
        missingSignals: missing,
        noiseFlags,
        contaminationFlags,
        includedSurfaces: [
            'identity_invariant',
            'safety_baseline',
            'policy_baseline',
            'task_objective',
            ...(input.knowledgeContextLength || retrievedChunkCount > 0 ? ['knowledge_context_summary'] : []),
            ...(input.request.skillIds?.length ? ['skill_affordance_summary'] : []),
        ],
        excludedSurfaces: [
            'runtime_context_injection',
            'raw_memory_injection',
            'mcp_surface',
            'tool_execution_surface',
            'profile_cache_runtime',
        ],
        executionCeiling: {
            modelProviderCall: 'existing_route_only',
            toolExecution: false,
            mcpAccess: false,
            memoryInjection: false,
            profileEscalation: 'advisory_only',
        },
        recommendedNextAction: nextAction(readiness),
        boundaries: [
            'advisory_readout_only',
            'no_prompt_mutation',
            'no_route_blocking',
            'no_provider_routing_change',
            'no_memory_reinjection',
        ],
    };
}
