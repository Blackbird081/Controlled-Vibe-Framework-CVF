// LPCI1-T5: POST /api/lpci/query
// Implements T4 Response Boundary Contract C1–C9.
// LLM key from LPCI_LLM_API_KEY env var — NO_PROVIDER_CONFIGURED receipt when absent.

import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { buildAuditReceipt } from '@/lib/lpci/audit-receipt';
import { runRetrievalPipeline } from '@/lib/lpci/retrieval';
import type { AuditReceipt, FilterParams, LpciIndexRecord } from '@/lib/lpci/types';
import { authorizeRouteGovernanceProof, getRouteGovernanceProofConfig } from '@/lib/route-governance-proof';

const REGISTRY_PATH = join(process.cwd(), '..', '..', '..', 'docs', 'corpus-intelligence', 'CVF_CORPUS_SCAN_REGISTRY.json');

// Load corpus index records from a JSON file associated with the corpusId.
// For prototype: looks for docs/corpus-intelligence/<corpusId>-index.json
function loadCorpusIndex(corpusId: string): LpciIndexRecord[] {
  const indexPath = join(
    process.cwd(), '..', '..', '..', 'docs', 'corpus-intelligence', `${corpusId}-index.json`
  );
  if (!existsSync(indexPath)) return [];
  try {
    return JSON.parse(readFileSync(indexPath, 'utf-8')) as LpciIndexRecord[];
  } catch {
    return [];
  }
}

function isCorpusRegistered(corpusId: string): boolean {
  try {
    const raw = readFileSync(REGISTRY_PATH, 'utf-8');
    const registry = JSON.parse(raw) as { corpora: Array<{ id: string }> };
    return registry.corpora.some((c) => c.id === corpusId);
  } catch {
    return false;
  }
}

// Build the answer boundary system prompt per T4 Rules A1-A4
function buildAnswerBoundaryPrompt(receipt: {
  answer_class: string;
  freshness_flag: boolean;
  conflict_flag: boolean;
  matched_paths: string[];
  matched_records: Array<{ normalizedPath: string; effectiveDate?: string; status: string; authorityLevel?: string }>;
}): string {
  const { answer_class, freshness_flag, conflict_flag, matched_paths, matched_records } = receipt;

  // C3 — No legal advice (Rule A4)
  const noLegalAdvice = `You are a corpus intelligence assistant. You may only summarize or explain text from the retrieved documents listed below. You must NOT assert compliance status, advise on legal strategy, interpret legislative intent beyond retrieved text, or claim that your response constitutes legal advice. Every response must include the phrase: "Based on retrieved documents only."`;

  // C1/C2 — Per-answerClass instruction (Rule A1)
  let classInstruction: string;
  switch (answer_class) {
    case 'DIRECT_CITED_ANSWER':
      classInstruction = `Provide a direct citation and bounded explanation. You MUST name at least one document path and effectiveDate from the sources below.`;
      break;
    case 'SUMMARY_WITH_SOURCE':
      classInstruction = `Summarize only the retrieved text. You MUST name at least one document path from the sources below. Do NOT make independent legal claims.`;
      break;
    case 'PROCEDURAL_GUIDANCE':
      classInstruction = `Provide procedural guidance grounded in the retrieved source. You MUST name the document path from the sources below. Do NOT make legal judgments.`;
      break;
    default:
      classInstruction = `Return an abstention message only. Do NOT attempt to answer the query.`;
  }

  const sourceList = matched_records
    .map((r) => `- ${r.normalizedPath} (status: ${r.status}, effectiveDate: ${r.effectiveDate ?? 'unknown'})`)
    .join('\n');

  let prompt = `${noLegalAdvice}\n\nAnswer class: ${answer_class}\n${classInstruction}\n\nRetrieved sources:\n${sourceList}`;

  // C4 — Freshness warning (Rule A2)
  if (freshness_flag) {
    const staleList = matched_records
      .filter((r) => r.status === 'amended' || r.status === 'superseded')
      .map((r) => `${r.normalizedPath} (${r.status}, effectiveDate: ${r.effectiveDate ?? 'unknown'})`)
      .join(', ');
    prompt += `\n\nIMPORTANT: Append this freshness warning at the END of your response: [FRESHNESS WARNING — source at ${staleList} may not be current.]`;
  }

  // C5 — Conflict notice (Rule A3)
  if (conflict_flag) {
    const conflictList = matched_paths.join(', ');
    prompt += `\n\nIMPORTANT: Two or more sources conflict on this topic. You MUST list all conflicting sources: [${conflictList}] and state: "Resolution requires operator judgment." Do NOT attempt to resolve the conflict.`;
  }

  return prompt;
}

export async function POST(request: NextRequest) {
  const bodyText = await request.text();
  const routeAuth = await authorizeRouteGovernanceProof(
    request,
    bodyText,
    getRouteGovernanceProofConfig('/api/lpci/query'),
  );
  if (!routeAuth.allowed && routeAuth.response) return routeAuth.response;

  let body: unknown;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body', routeGovernanceProof: routeAuth.proof }, { status: 400 });
  }

  const { query, corpusId, filters } = body as {
    query?: string;
    corpusId?: string;
    filters?: FilterParams;
  };

  if (!query || !corpusId) {
    return NextResponse.json({ error: 'query and corpusId are required', routeGovernanceProof: routeAuth.proof }, { status: 400 });
  }

  const query_timestamp = new Date().toISOString();
  const appliedFilters: FilterParams = filters ?? {};

  // Verify corpus is GC-051 registered
  if (!isCorpusRegistered(corpusId)) {
    const notRegisteredPayload = JSON.stringify({ receiptType: 'NOT_REGISTERED', query, corpusId });
    const auditReceipt = buildAuditReceipt({
      query,
      query_timestamp,
      responseText: notRegisteredPayload,
      response_boundary_class: 'NEGATIVE_RECEIPT',
      applied_filters: appliedFilters,
      sensitivity_pre_filter_applied: false,
    });
    return NextResponse.json({
      receiptType: 'NOT_REGISTERED',
      query,
      auditReceipt,
      routeGovernanceProof: routeAuth.proof,
    }, { status: 403 });
  }

  // Load corpus index
  const corpus = loadCorpusIndex(corpusId);

  // Phase 1 + Phase 2: retrieval pipeline
  const pipelineResult = runRetrievalPipeline(corpus, query, appliedFilters);

  // C9 — Phase 1 negative receipt passthrough: return unchanged, Phase 2 not invoked
  if (pipelineResult.phase === 1) {
    const { negative, sensitivityApplied } = pipelineResult;
    const negPayload = JSON.stringify(negative);
    const auditReceipt = buildAuditReceipt({
      query,
      query_timestamp,
      responseText: negPayload,
      response_boundary_class: 'NEGATIVE_RECEIPT',
      phase1_receipt_type: negative.receiptType,
      applied_filters: appliedFilters,
      sensitivity_pre_filter_applied: sensitivityApplied,
    });
    // C7 — AuditReceipt emitted for every query
    return NextResponse.json({
      ...negative,
      auditReceipt,
      routeGovernanceProof: routeAuth.proof,
    } satisfies { auditReceipt: AuditReceipt; routeGovernanceProof: unknown } & typeof negative);
  }

  const { receipt } = pipelineResult;

  // C6 — Abstention if answer_class = ESCALATE_OR_ABSTAIN
  if (receipt.answer_class === 'ESCALATE_OR_ABSTAIN') {
    const abstentionText = 'Based on retrieved documents only. This query cannot be answered directly — the source documents require operator escalation or abstention.';
    const auditReceipt = buildAuditReceipt({
      query,
      query_timestamp,
      retrieval: receipt,
      responseText: abstentionText,
      response_boundary_class: 'ABSTAINED',
      applied_filters: appliedFilters,
      sensitivity_pre_filter_applied: false,
    });
    return NextResponse.json({
      response: abstentionText,
      answerClass: 'ESCALATE_OR_ABSTAIN',
      auditReceipt,
      routeGovernanceProof: routeAuth.proof,
    });
  }

  // Check for operator-supplied LLM API key
  const llmApiKey = process.env.LPCI_LLM_API_KEY;
  if (!llmApiKey) {
    // NO_PROVIDER_CONFIGURED — not an error stack trace
    const noProviderPayload = JSON.stringify({ receiptType: 'NO_PROVIDER_CONFIGURED', query });
    const auditReceipt = buildAuditReceipt({
      query,
      query_timestamp,
      retrieval: receipt,
      responseText: noProviderPayload,
      response_boundary_class: 'NEGATIVE_RECEIPT',
      applied_filters: appliedFilters,
      sensitivity_pre_filter_applied: false,
      stale_records: receipt.freshness_flag ? receipt.matched_records
        .filter((r) => r.status === 'amended' || r.status === 'superseded')
        .map((r) => ({ normalizedPath: r.normalizedPath, status: r.status, effectiveDate: r.effectiveDate }))
        : undefined,
      conflict_records: receipt.conflict_flag ? receipt.matched_records
        .map((r) => ({ normalizedPath: r.normalizedPath, authorityLevel: r.authorityLevel, effectiveDate: r.effectiveDate }))
        : undefined,
    });
    return NextResponse.json({
      receiptType: 'NO_PROVIDER_CONFIGURED',
      query,
      retrievalReceipt: receipt,
      auditReceipt,
      routeGovernanceProof: routeAuth.proof,
    });
  }

  // Build answer boundary prompt (C1-C5)
  const systemPrompt = buildAnswerBoundaryPrompt(receipt);

  // Call LLM with operator-supplied key (OpenAI-compatible endpoint)
  const llmEndpoint = process.env.LPCI_LLM_ENDPOINT ?? 'https://api.openai.com/v1/chat/completions';
  const llmModel = process.env.LPCI_LLM_MODEL ?? 'gpt-4o-mini';

  let llmResponseText: string;
  try {
    const llmResp = await fetch(llmEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${llmApiKey}`,
      },
      body: JSON.stringify({
        model: llmModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query },
        ],
        max_tokens: 1024,
        temperature: 0,
      }),
    });

    if (!llmResp.ok) {
      const errText = await llmResp.text();
      throw new Error(`LLM provider error ${llmResp.status}: ${errText.slice(0, 200)}`);
    }

    const llmData = await llmResp.json() as { choices?: Array<{ message?: { content?: string } }> };
    llmResponseText = llmData.choices?.[0]?.message?.content ?? '';
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const auditReceipt = buildAuditReceipt({
      query,
      query_timestamp,
      retrieval: receipt,
      responseText: `LLM_ERROR: ${errMsg}`,
      response_boundary_class: 'NEGATIVE_RECEIPT',
      applied_filters: appliedFilters,
      sensitivity_pre_filter_applied: false,
    });
    return NextResponse.json({
      receiptType: 'PROVIDER_ERROR',
      error: errMsg,
      auditReceipt,
      routeGovernanceProof: routeAuth.proof,
    }, { status: 502 });
  }

  // C8 — model_response_hash = SHA-256 of LLM response text
  const staleRecords = receipt.freshness_flag
    ? receipt.matched_records
        .filter((r) => r.status === 'amended' || r.status === 'superseded')
        .map((r) => ({ normalizedPath: r.normalizedPath, status: r.status, effectiveDate: r.effectiveDate }))
    : undefined;

  const conflictRecords = receipt.conflict_flag
    ? receipt.matched_records.map((r) => ({
        normalizedPath: r.normalizedPath,
        authorityLevel: r.authorityLevel,
        effectiveDate: r.effectiveDate,
      }))
    : undefined;

  const auditReceipt = buildAuditReceipt({
    query,
    query_timestamp,
    retrieval: receipt,
    responseText: llmResponseText,
    response_boundary_class: 'ANSWER_EMITTED',
    applied_filters: appliedFilters,
    sensitivity_pre_filter_applied: false,
    stale_records: staleRecords,
    conflict_records: conflictRecords,
  });

  return NextResponse.json({
    response: llmResponseText,
    answerClass: receipt.answer_class,
    matchedSources: receipt.matched_paths,
    freshnessFlag: receipt.freshness_flag,
    conflictFlag: receipt.conflict_flag,
    auditReceipt,
    routeGovernanceProof: routeAuth.proof,
  });
}
