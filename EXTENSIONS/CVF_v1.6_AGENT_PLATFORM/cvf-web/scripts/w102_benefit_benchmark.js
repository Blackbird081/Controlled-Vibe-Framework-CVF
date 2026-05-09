/**
 * W102-T1 — Knowledge-Native Benefit Revalidation Benchmark
 *
 * Validates that the knowledge-native injection path introduced in W101-T1
 * produces a measurable quality improvement at the /api/execute front door.
 *
 * Methodology:
 *   - Calls Alibaba API directly (mirrors what /api/execute now does)
 *   - CFG-A: base CVF system prompt only (no knowledge context)
 *   - CFG-B: base CVF system prompt + governed knowledge context block
 *   - 5 invented-domain scenarios (anti training-data contamination)
 *   - 2 runs per scenario per config
 *   - Precision = keywords found / total keywords
 *
 * Gates:
 *   Gate 1 — Overall injected precision >= raw precision
 *   Gate 2 — Temporal consistency: |run1 - run2| < 0.4 per scenario
 *
 * Usage:
 *   ALIBABA_API_KEY=<key> node scripts/w102_benefit_benchmark.js
 *
 * Authorization: docs/baselines/CVF_GC018_W102_T1_BENEFIT_REVALIDATION_AUTHORIZATION_2026-04-17.md
 */

'use strict';

// eslint-disable-next-line @typescript-eslint/no-require-imports
require('../../../../scripts/load-repo-env.cjs').loadRepoEnv();

function resolveAlibabaApiKey(env = process.env) {
  return env.ALIBABA_API_KEY || env.CVF_BENCHMARK_ALIBABA_KEY || env.CVF_ALIBABA_API_KEY;
}

const ALIBABA_KEY = resolveAlibabaApiKey();
const ENDPOINT = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions';
const MODEL = 'qwen-max';
const FALLBACK_MODEL = 'qwen3-max';

// ---------------------------------------------------------------------------
// CVF base system prompt (mirrors CVF_SYSTEM_PROMPT constant)
// ---------------------------------------------------------------------------
const BASE_SYSTEM_PROMPT = `You are CVF Agent - an AI assistant for the Controlled Vibe Framework v1.6 Agent Platform.
Your role is to help non-technical users accomplish their goals through guided, safe, and governed AI interactions.
Be clear, concise, and avoid jargon. Always explain your reasoning.`;

// ---------------------------------------------------------------------------
// Knowledge context injection block (mirrors buildKnowledgeSystemPrompt output)
// ---------------------------------------------------------------------------
function buildEnrichedPrompt(basePrompt, context) {
  const trimmed = context.trim();
  if (!trimmed) return basePrompt;
  return (
    basePrompt +
    '\n\n---\n\n## GOVERNED KNOWLEDGE CONTEXT\n\nThe following context comes from governed, approved knowledge artifacts.\n' +
    'Prioritize this context when addressing the user request.\n' +
    'If this context contradicts general training knowledge on the covered domain,\nthe context below takes precedence.\n\n' +
    trimmed +
    '\n\n---\n\n'
  );
}

// ---------------------------------------------------------------------------
// Benchmark scenarios — invented domain terminology to prevent training-data
// contamination. The model can only answer correctly by reading the context.
// ---------------------------------------------------------------------------
const SCENARIOS = [
  {
    id: 'w102-001',
    name: 'LUMEN-7 Governance Protocol',
    knowledgeContext:
      'The LUMEN-7 governance protocol requires that all platform deployments pass a ' +
      'NEXUS-STAMP before production release. A NEXUS-STAMP is issued by the Compliance Council ' +
      'after reviewing the deployment for PRAXIS violations. Deployments without a NEXUS-STAMP ' +
      'are classified as DARK-RELEASE and must be quarantined immediately.',
    question:
      'According to the platform governance rules, what happens to a deployment that does not have a NEXUS-STAMP?',
    keywords: ['DARK-RELEASE', 'quarantine', 'Compliance Council', 'NEXUS-STAMP'],
  },
  {
    id: 'w102-002',
    name: 'ORBIT Platform Selection',
    knowledgeContext:
      'The ORBIT classification system defines three platform tiers: TERRAN (cloud-only, ' +
      'requires persistent internet), LUNAR (hybrid, works offline with sync), and STELLAR ' +
      '(fully offline, no cloud dependency). Applications requiring ZERO-LATENCY access to ' +
      'local files must use STELLAR tier. TERRAN tier is prohibited for ZETA-CLASS data.',
    question:
      'I need to build an app that accesses local files with zero latency and handles ZETA-CLASS data. Which ORBIT tier should I use?',
    keywords: ['STELLAR', 'offline', 'TERRAN', 'prohibited'],
  },
  {
    id: 'w102-003',
    name: 'PRAXIS Cost Model',
    knowledgeContext:
      'The PRAXIS cost model has four billing tiers: SEED (free, 500 calls/month), ' +
      'SPROUT (15 USD/month, 5000 calls), BLOOM (49 USD/month, unlimited calls), and ' +
      'HARVEST (enterprise, custom pricing). Teams exceeding SPROUT limits without upgrading ' +
      'are automatically migrated to THROTTLE-MODE which reduces call speed by 80%.',
    question:
      'Our team makes about 3000 calls per month and we just got throttled. What tier are we on and what should we upgrade to?',
    keywords: ['SPROUT', 'BLOOM', 'THROTTLE-MODE', '3000'],
  },
  {
    id: 'w102-004',
    name: 'VEGA Security Classification',
    knowledgeContext:
      'VEGA security levels range from V1 (public) to V5 (top-secret). ' +
      'Data classified as INDIGO-PRIME must be handled at V4 or above. ' +
      'Agents operating below V4 on INDIGO-PRIME data trigger a SENTINEL-ALERT ' +
      'and are automatically suspended pending review by the Security Board.',
    question:
      'An agent at V3 clearance tried to access INDIGO-PRIME data. What happens according to the VEGA security policy?',
    keywords: ['SENTINEL-ALERT', 'suspended', 'Security Board', 'V4'],
  },
  {
    id: 'w102-005',
    name: 'APEX Deployment Gate',
    knowledgeContext:
      'The APEX deployment pipeline enforces three mandatory gates before production: ' +
      'FORGE (build verification), SHIELD (security scan), and CROWN (final approval). ' +
      'Skipping SHIELD is only permitted for MICRO-PATCH deployments under 10 lines of change. ' +
      'Any deployment bypassing CROWN is classified as a ROGUE-DEPLOY and triggers an ' +
      'immediate rollback and INCIDENT-ALPHA notification to the operator.',
    question:
      'A developer wants to push a 200-line change directly to production without going through CROWN. What does the APEX pipeline classify this as?',
    keywords: ['ROGUE-DEPLOY', 'rollback', 'INCIDENT-ALPHA', 'CROWN'],
  },
];

// ---------------------------------------------------------------------------
// API caller
// ---------------------------------------------------------------------------
async function callAlibaba(systemPrompt, userQuestion, modelName = MODEL) {
  const startTime = Date.now();
  const body = {
    model: modelName,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userQuestion },
    ],
    max_tokens: 256,
    temperature: 0.1,
  };

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ALIBABA_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (res.status === 429) {
    console.warn(`  [429] quota on ${modelName}, switching to ${FALLBACK_MODEL}`);
    return callAlibaba(systemPrompt, userQuestion, FALLBACK_MODEL);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Alibaba API error ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = await res.json();
  const output = json.choices?.[0]?.message?.content ?? '';
  const latencyMs = Date.now() - startTime;
  return { output, latencyMs };
}

// ---------------------------------------------------------------------------
// Precision calculator
// ---------------------------------------------------------------------------
function computePrecision(output, keywords) {
  const lower = output.toLowerCase();
  const found = keywords.filter(k => lower.includes(k.toLowerCase())).length;
  return found / keywords.length;
}

// ---------------------------------------------------------------------------
// Main benchmark runner
// ---------------------------------------------------------------------------
async function runBenchmark() {
  if (!ALIBABA_KEY) {
    console.error('ERROR: ALIBABA_API_KEY not set. Compatibility aliases: CVF_BENCHMARK_ALIBABA_KEY, CVF_ALIBABA_API_KEY.');
    process.exit(1);
  }

  console.log('\n' + '═'.repeat(64));
  console.log('W102-T1 KNOWLEDGE-NATIVE BENEFIT REVALIDATION BENCHMARK');
  console.log(`Model: ${MODEL} | Provider: Alibaba | Tranche: W102-T1`);
  console.log('═'.repeat(64) + '\n');

  const results = [];

  for (const run of [1, 2]) {
    console.log(`\n── RUN ${run} ──────────────────────────────────────────────`);
    for (const s of SCENARIOS) {
      // CFG-A: base prompt only (no context)
      process.stdout.write(`  ${s.id} [CFG-A raw]... `);
      const rawResult = await callAlibaba(BASE_SYSTEM_PROMPT, s.question);
      const rawPrec = computePrecision(rawResult.output, s.keywords);
      results.push({ id: s.id, run, cfg: 'raw', prec: rawPrec, latencyMs: rawResult.latencyMs });
      console.log(`prec=${rawPrec.toFixed(2)} lat=${rawResult.latencyMs}ms`);
      console.log(`    → ${rawResult.output.slice(0, 120)}`);

      // CFG-B: enriched prompt with knowledge context
      const enrichedPrompt = buildEnrichedPrompt(BASE_SYSTEM_PROMPT, s.knowledgeContext);
      process.stdout.write(`  ${s.id} [CFG-B injected]... `);
      const injResult = await callAlibaba(enrichedPrompt, s.question);
      const injPrec = computePrecision(injResult.output, s.keywords);
      results.push({ id: s.id, run, cfg: 'injected', prec: injPrec, latencyMs: injResult.latencyMs });
      console.log(`prec=${injPrec.toFixed(2)} lat=${injResult.latencyMs}ms`);
      console.log(`    → ${injResult.output.slice(0, 120)}`);

      // Pause between calls to avoid rate limiting
      await new Promise(r => setTimeout(r, 800));
    }
  }

  // ---------------------------------------------------------------------------
  // Gate assessment
  // ---------------------------------------------------------------------------
  console.log('\n' + '═'.repeat(64));
  console.log('W102-T1 BENEFIT REVALIDATION — GATE ASSESSMENT');
  console.log(`Model: ${MODEL} | Evidence class: LIVE_INFERENCE | Tranche: W102-T1`);
  console.log('═'.repeat(64));

  for (const s of SCENARIOS) {
    const injRuns = results.filter(r => r.id === s.id && r.cfg === 'injected');
    const rawRuns = results.filter(r => r.id === s.id && r.cfg === 'raw');
    if (!injRuns.length || !rawRuns.length) continue;
    const avgInj = injRuns.reduce((a, x) => a + x.prec, 0) / injRuns.length;
    const avgRaw = rawRuns.reduce((a, x) => a + x.prec, 0) / rawRuns.length;
    const delta = avgInj - avgRaw;
    console.log(
      `  ${s.id}: injected=${avgInj.toFixed(2)} raw=${avgRaw.toFixed(2)} ` +
        `delta=${delta >= 0 ? '+' : ''}${delta.toFixed(2)} [${avgInj >= avgRaw ? 'INJECTED>=RAW ✓' : 'RAW>INJECTED ✗'}]`,
    );
  }

  const allInj = results.filter(r => r.cfg === 'injected');
  const allRaw = results.filter(r => r.cfg === 'raw');
  const overallInj = allInj.reduce((a, x) => a + x.prec, 0) / allInj.length;
  const overallRaw = allRaw.reduce((a, x) => a + x.prec, 0) / allRaw.length;

  let temporalMet = true;
  for (const s of SCENARIOS) {
    const injRuns = results.filter(r => r.id === s.id && r.cfg === 'injected');
    if (injRuns.length === 2) {
      const runDelta = Math.abs(injRuns[0].prec - injRuns[1].prec);
      if (runDelta > 0.4) temporalMet = false;
    }
  }

  const gate1 = overallInj >= overallRaw;
  const overallDelta = overallInj - overallRaw;
  const verdict = gate1 && temporalMet ? 'PROVEN' : gate1 ? 'MIXED' : 'NOT_PROVEN';

  console.log('─'.repeat(64));
  console.log(`  Overall injected avg precision : ${overallInj.toFixed(3)}`);
  console.log(`  Overall raw avg precision      : ${overallRaw.toFixed(3)}`);
  console.log(`  Overall delta                  : ${overallDelta >= 0 ? '+' : ''}${overallDelta.toFixed(3)}`);
  console.log(`  Gate 1 — precision >= baseline : ${gate1 ? 'MET ✓' : 'NOT MET ✗'}`);
  console.log(`  Gate 2 — temporal consistency  : ${temporalMet ? 'MET ✓' : 'NOT MET ✗'}`);
  console.log(
    `  Runs completed                 : injected=${allInj.length}/${SCENARIOS.length * 2} raw=${allRaw.length}/${SCENARIOS.length * 2}`,
  );
  console.log('─'.repeat(64));
  console.log(`  BENEFIT VERDICT: ${verdict}`);
  console.log('═'.repeat(64) + '\n');
}

runBenchmark().catch(err => {
  console.error('Benchmark failed:', err.message);
  process.exit(1);
});
