'use client';

import { trackEvent } from '@/lib/analytics';
import type { EnforcementResult } from '@/lib/enforcement';

export type EnforcementSource = 'agent_chat' | 'multi_agent' | 'api_execute' | 'spec_export';

export interface EnforcementLogPayload {
    source: EnforcementSource;
    mode: string;
    enforcement: EnforcementResult;
    context?: Record<string, unknown>;
}

export function logEnforcementDecision({
    source,
    mode,
    enforcement,
    context,
}: EnforcementLogPayload) {
    if (typeof window === 'undefined') return;
    trackEvent('enforcement_decision', {
        source,
        mode,
        status: enforcement.status,
        risk: enforcement.riskGate?.riskLevel,
        specGate: enforcement.specGate?.status,
        missing: enforcement.specGate?.missing?.length || 0,
        reasons: enforcement.reasons,
        ...context,
    });
}

export function logPreUatFailure(context?: Record<string, unknown>) {
    if (typeof window === 'undefined') return;
    trackEvent('pre_uat_failed', {
        ...context,
    });
}
