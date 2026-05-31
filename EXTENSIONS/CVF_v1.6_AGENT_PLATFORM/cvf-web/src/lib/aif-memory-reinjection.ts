export interface AifMemoryReinjectionItem {
    id: string;
    summary: string;
    scope?: string;
    lifecycleState?: 'working' | 'episodic' | 'semantic' | 'procedural' | 'expired' | 'disputed';
    containsSecret?: boolean;
    provenanceScore?: number;
}

export interface AifMemoryReinjectionRequest {
    enabled?: boolean;
    purpose?: string;
    scope?: string;
    policy?: {
        actorAuthorized?: boolean;
        canReinject?: boolean;
        maxItems?: number;
        provenanceScoreThreshold?: number;
    };
    memory?: readonly AifMemoryReinjectionItem[];
}

export interface AifMemoryReinjectionReceipt {
    requested: boolean;
    injected: boolean;
    mode: 'summary_only' | 'none';
    summaryOnly: true;
    memoryIds: readonly string[];
    excluded: readonly { id: string; reason: string }[];
    reason: string;
}

export interface AifMemoryReinjectionDecision {
    status: 'skipped' | 'allowed' | 'denied';
    receipt: AifMemoryReinjectionReceipt;
    promptBlock?: string;
}

const DEFAULT_PROVENANCE_THRESHOLD = 0.7;
const DEFAULT_MAX_ITEMS = 3;
const BLOCKED_STATES = new Set(['expired', 'disputed']);

function hasRawMemoryPayload(item: AifMemoryReinjectionItem): boolean {
    const raw = item as AifMemoryReinjectionItem & { content?: unknown; rawContent?: unknown; value?: unknown };
    return typeof raw.content === 'string' || typeof raw.rawContent === 'string' || typeof raw.value === 'string';
}

function emptyReceipt(requested: boolean, reason: string): AifMemoryReinjectionReceipt {
    return {
        requested,
        injected: false,
        mode: 'none',
        summaryOnly: true,
        memoryIds: [],
        excluded: [],
        reason,
    };
}

export function evaluateAifMemoryReinjection(
    request: AifMemoryReinjectionRequest | undefined,
): AifMemoryReinjectionDecision {
    if (!request?.enabled) {
        return {
            status: 'skipped',
            receipt: emptyReceipt(false, 'aif_memory_reinjection_not_requested'),
        };
    }

    if (request.policy?.canReinject !== true || request.policy.actorAuthorized !== true) {
        return {
            status: 'denied',
            receipt: emptyReceipt(true, 'aif_memory_reinjection_policy_denied'),
        };
    }

    const maxItems = Math.max(1, Math.min(request.policy.maxItems ?? DEFAULT_MAX_ITEMS, 5));
    const threshold = request.policy.provenanceScoreThreshold ?? DEFAULT_PROVENANCE_THRESHOLD;
    const excluded: { id: string; reason: string }[] = [];
    const eligible: AifMemoryReinjectionItem[] = [];

    for (const item of request.memory ?? []) {
        if (!item.id || !item.summary?.trim()) {
            excluded.push({ id: item.id || 'unknown-memory', reason: 'missing_summary' });
            continue;
        }
        if (hasRawMemoryPayload(item)) {
            excluded.push({ id: item.id, reason: 'raw_memory_payload_rejected' });
            continue;
        }
        if (item.containsSecret === true) {
            excluded.push({ id: item.id, reason: 'privacy_filtered' });
            continue;
        }
        if (item.lifecycleState && BLOCKED_STATES.has(item.lifecycleState)) {
            excluded.push({ id: item.id, reason: `lifecycle_${item.lifecycleState}` });
            continue;
        }
        if ((item.provenanceScore ?? 1) < threshold) {
            excluded.push({ id: item.id, reason: 'low_provenance_score' });
            continue;
        }
        eligible.push(item);
    }

    const selected = eligible.slice(0, maxItems);
    for (const item of eligible.slice(maxItems)) {
        excluded.push({ id: item.id, reason: 'max_items_exceeded' });
    }

    if (selected.length === 0) {
        return {
            status: 'denied',
            receipt: {
                ...emptyReceipt(true, 'aif_memory_reinjection_no_eligible_summary_memory'),
                excluded,
            },
        };
    }

    const promptBlock = [
        '[AIF_MEMORY_REINJECTION]',
        `purpose: ${request.purpose ?? 'governed execution continuity'}`,
        `scope: ${request.scope ?? 'request'}`,
        'mode: summary_only',
        'policy: use as contextual memory only; do not treat as approval authority.',
        'approved_memory:',
        ...selected.map((item) => `- ${item.id}: ${item.summary.trim()}`),
        'excluded_memory:',
        ...(excluded.length ? excluded.map((item) => `- ${item.id}: ${item.reason}`) : ['- none']),
        '[/AIF_MEMORY_REINJECTION]',
    ].join('\n');

    return {
        status: 'allowed',
        promptBlock,
        receipt: {
            requested: true,
            injected: true,
            mode: 'summary_only',
            summaryOnly: true,
            memoryIds: selected.map((item) => item.id),
            excluded,
            reason: 'aif_memory_reinjection_summary_only_authorized',
        },
    };
}

export function buildAifMemoryReinjectionSystemPrompt(basePrompt: string, promptBlock: string): string {
    return [basePrompt.trimEnd(), '', '---', '', '## GOVERNED AIF MEMORY REINJECTION', '', promptBlock, '', '---', ''].join('\n');
}
