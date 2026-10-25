/**
 * Execute route context selection.
 *
 * Owns the same-domain context decisions that used to sit inline in `route.ts`:
 * which knowledge-context path a request takes, the fail-closed SOT3 rejection
 * response, and the memory/egress checks that decide the final system prompt.
 * The isolation input is a server-side boolean derived from the verified HTML
 * pilot binding; no field of the request body can select the isolated path.
 */
import { NextResponse } from 'next/server';
import type { AIProvider, ExecutionRequest } from '@/lib/ai';
import type { EnforcementResult } from '@/lib/enforcement';
import type { GuardPipelineResult } from '@/lib/guard-runtime-adapter';
import type { SessionCookie } from '@/lib/middleware-auth';
import type { WebProviderRoutingResult } from '@/lib/ai/provider-router-adapter';
import { buildAifMemoryReinjectionSystemPrompt, evaluateAifMemoryReinjection } from '@/lib/aif-memory-reinjection';
import { appendAifMemoryReinjectionAudit, buildAifMemoryReinjectionDeniedResponse } from '@/lib/aif-memory-reinjection-route';
import { buildDurableMemorySystemPrompt, evaluateDurableMemoryRoute, resolveDurableMemoryActorRole } from '@/lib/durable-memory-route';
import { buildExecutionDiagnostic } from '@/lib/execution-diagnostics';
import { pilotAmbientContextPresent } from '@/lib/server/html-execution-evidence';
import { buildEvidenceReceipt, type WebGovernanceEnvelope } from '@/lib/web-governance-envelope';
import { hasBlockedGovernedContext } from './governed-context-egress';
import { isolatedPilotKnowledgeContext, resolveKnowledgeContext, type KnowledgeContextParams, type KnowledgeContextResult } from './route-knowledge-context';

/**
 * `isolatedPilot` must come from the verified server-side pilot binding. Every other request keeps the
 * generic scoped retrieval and SOT3 activation path unchanged.
 */
export async function selectKnowledgeContext(isolatedPilot: boolean, params: KnowledgeContextParams): Promise<KnowledgeContextResult> {
    return isolatedPilot ? isolatedPilotKnowledgeContext() : resolveKnowledgeContext(params);
}

/** SOT3-ACT-A4: a rejected activation, or an explicitly requested collection with no governed context, never reaches the provider. */
export function sot3RejectionResponse(input: {
    knowledge: KnowledgeContextResult;
    envelope: WebGovernanceEnvelope;
    enforcement: EnforcementResult;
    guardResult: GuardPipelineResult;
    provider: AIProvider;
    routingResult: WebProviderRoutingResult;
}): NextResponse | null {
    const { knowledge, envelope, enforcement, guardResult, provider, routingResult } = input;
    const { sot3, requestedKnowledgeCollectionId } = knowledge;
    const explicitNoContext = sot3 !== null && sot3.terminalOutcome === 'NO_CONTEXT' && requestedKnowledgeCollectionId !== null;
    if (sot3 === null || (sot3.terminalOutcome !== 'REJECTED' && !explicitNoContext)) return null;
    const governanceEvidenceReceipt = buildEvidenceReceipt({
        envelope,
        decision: 'DENY',
        riskLevel: enforcement.riskGate?.riskLevel,
        provider,
        model: 'sot3-rejected',
        routingDecision: routingResult.decision,
        knowledgeSource: knowledge.knowledgeSource,
        knowledgeInjected: knowledge.knowledgeInjected,
        knowledgeCollectionId: requestedKnowledgeCollectionId,
        knowledgeChunkCount: knowledge.retrievalResult.allowedChunkCount,
    });
    return NextResponse.json({
        success: false,
        error: 'Governed knowledge activation rejected this request before provider execution.',
        provider,
        model: 'sot3-rejected',
        enforcement,
        guardResult,
        governanceEnvelope: envelope,
        policySnapshotId: envelope.policySnapshotId,
        governanceEvidenceReceipt,
        diagnostic: buildExecutionDiagnostic({ stage: 'governance', class: 'policy_blocked', provider, model: 'sot3-rejected', httpStatus: 409 }),
    }, { status: 409 });
}

export type MemoryContextOutcome =
    | { response: NextResponse }
    | { response?: undefined; durableMemoryRoute: ReturnType<typeof evaluateDurableMemoryRoute>;
        aifMemoryReinjection: ReturnType<typeof evaluateAifMemoryReinjection>; enrichedSystemPrompt: string | undefined };

/**
 * Durable and AIF memory evaluation, the governed-context egress check and the pilot ambient-context refusal.
 * Ordering is unchanged: denial and egress responses precede the final prompt, and a prepared pilot is
 * refused if any ambient context is present regardless of how it arrived.
 */
export async function resolveMemoryContext(input: {
    body: Partial<ExecutionRequest>;
    session: SessionCookie | null | undefined;
    knowledge: KnowledgeContextResult;
    actor: { id: string; executionRole: string | null | undefined; targetResource: string };
    envelope: WebGovernanceEnvelope;
    enforcement: EnforcementResult;
    guardResult: GuardPipelineResult;
    routedProvider: AIProvider;
    routingResult: WebProviderRoutingResult;
    htmlPilotPrepared: boolean;
}): Promise<MemoryContextOutcome> {
    const { body, session, knowledge, actor, routedProvider } = input;
    const { knowledgeInjected, finalKnowledgeContext, knowledgeSystemPrompt } = knowledge;
    const durableMemoryRoute = evaluateDurableMemoryRoute({ request: body, actorId: actor.id, actorRole: resolveDurableMemoryActorRole(actor.executionRole), defaultQuery: body.intent! });
    const durableMemorySystemPrompt = durableMemoryRoute.promptBlock ? buildDurableMemorySystemPrompt(knowledgeSystemPrompt, durableMemoryRoute.promptBlock) : knowledgeSystemPrompt;
    const aifMemoryReinjection = evaluateAifMemoryReinjection(body.aifMemoryReinjection);
    await appendAifMemoryReinjectionAudit({ decision: aifMemoryReinjection, request: body, session });
    if (aifMemoryReinjection.status === 'denied') {
        return { response: buildAifMemoryReinjectionDeniedResponse({ decision: aifMemoryReinjection, envelope: input.envelope, enforcement: input.enforcement,
            guardResult: input.guardResult, provider: routedProvider, routingResult: input.routingResult, knowledgeSource: knowledge.knowledgeSource, knowledgeInjected,
            knowledgeCollectionId: knowledge.requestedKnowledgeCollectionId, knowledgeChunkCount: knowledge.retrievalResult.allowedChunkCount }) };
    }
    if (await hasBlockedGovernedContext({
        contexts: [knowledgeInjected ? finalKnowledgeContext : undefined, durableMemoryRoute.promptBlock, aifMemoryReinjection.promptBlock],
        actorId: actor.id, actorRole: session?.role ?? 'service', targetResource: actor.targetResource,
    })) {
        return { response: NextResponse.json({ success: false, error: 'Governed context requires correction before provider execution.', provider: routedProvider, model: 'blocked' }, { status: 400 }) };
    }
    const enrichedSystemPrompt = aifMemoryReinjection.promptBlock ? buildAifMemoryReinjectionSystemPrompt(durableMemorySystemPrompt, aifMemoryReinjection.promptBlock) : knowledgeInjected || durableMemoryRoute.injected ? durableMemorySystemPrompt : undefined;
    if (input.htmlPilotPrepared && pilotAmbientContextPresent({ knowledgeInjected, finalKnowledgeContext,
        durableMemoryPromptBlock: durableMemoryRoute.promptBlock, aifMemoryPromptBlock: aifMemoryReinjection.promptBlock })) {
        return { response: NextResponse.json({ success: false, error: 'PILOT_AMBIENT_CONTEXT_REFUSED' }, { status: 403 }) };
    }
    return { durableMemoryRoute, aifMemoryReinjection, enrichedSystemPrompt };
}
