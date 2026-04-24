// W119-T1 Non-Coder Adoption Evidence Pack
//
// Runs the locked non-coder adoption journeys against cvf-web using a real
// DashScope-compatible provider key. The script never prints or writes raw keys.

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

require('./load-repo-env.cjs').loadRepoEnv();
const { buildServiceTokenHeaders } = require('./service-token-signature.cjs');

const REPO_ROOT = path.resolve(__dirname, '..');
const CVF_WEB = path.join(REPO_ROOT, 'EXTENSIONS', 'CVF_v1.6_AGENT_PLATFORM', 'cvf-web');
const PORT = Number(process.env.W119_CVF_WEB_PORT || 3019);
const BASE_URL = process.env.W119_CVF_WEB_BASE_URL || `http://localhost:${PORT}`;
const EXECUTE_URL = `${BASE_URL}/api/execute`;
const INGEST_URL = `${BASE_URL}/api/knowledge/ingest`;
const SERVICE_TOKEN = process.env.CVF_SERVICE_TOKEN || 'pvv-pilot-2026';
const OUT_JSON = path.join(REPO_ROOT, 'docs', 'assessments', 'CVF_W119_T1_NONCODER_ADOPTION_EVIDENCE_RAW_2026-04-23.json');
const OUT_MD = path.join(REPO_ROOT, 'docs', 'assessments', 'CVF_W119_T1_NONCODER_ADOPTION_EVIDENCE_PACK_2026-04-23.md');

function resolveLiveKeyName() {
  const names = ['DASHSCOPE_API_KEY', 'ALIBABA_API_KEY', 'CVF_ALIBABA_API_KEY', 'CVF_BENCHMARK_ALIBABA_KEY'];
  return names.find((name) => String(process.env[name] || '').trim()) || null;
}

function ensureLiveKey() {
  const keyName = resolveLiveKeyName();
  if (!keyName) {
    throw new Error('No DashScope-compatible live key found. Set DASHSCOPE_API_KEY or an accepted Alibaba alias.');
  }
  if (!process.env.DASHSCOPE_API_KEY) {
    process.env.DASHSCOPE_API_KEY = String(process.env[keyName]).trim();
  }
  return keyName;
}

const LIVE_KEY_NAME = ensureLiveKey();

const commonExecuteMeta = {
  provider: 'alibaba',
  mode: 'simple',
  cvfPhase: 'BUILD',
  cvfRiskLevel: 'R1',
  action: 'create',
  skillPreflightPassed: true,
  skillPreflightDeclaration: 'W119-T1-NONCODER-ADOPTION-PROOF',
};

const knowledgeCollection = {
  collectionId: 'w119-lumencart-project',
  collectionName: 'W119 LumenCart Project Knowledge',
  chunks: [
    {
      id: 'lumencart-1',
      content: 'Project LumenCart serves night-market vendors who need a simple checkout flow on low-cost Android devices.',
      keywords: ['LumenCart', 'night-market', 'vendors', 'checkout'],
    },
    {
      id: 'lumencart-2',
      content: 'LumenCart must work offline-first because permanent internet connectivity is a forbidden assumption.',
      keywords: ['LumenCart', 'offline-first', 'connectivity'],
    },
    {
      id: 'lumencart-3',
      content: 'LumenCart success metric: checkout under 30 seconds for the vendor during a busy market shift.',
      keywords: ['LumenCart', '30 seconds', 'success metric'],
    },
  ],
};

const scenarios = [
  {
    id: 'W119-S1-FIRST-GOVERNED-OUTPUT',
    journey: 'first_governed_output',
    expectedDecision: 'ALLOW',
    templateId: 'documentation',
    templateName: 'Tài liệu Kỹ thuật',
    intent: 'Create a simple handoff checklist for onboarding a new sales assistant.',
    inputs: {
      subject: 'New sales assistant onboarding checklist',
      currentNotes: 'Lead arrives from web form. Sales assistant calls back within 2 hours. Qualified leads receive same-day quote. Common questions: setup time, required documents, and who approves discounts.',
      readerGoal: 'A new sales assistant can handle the first lead response without asking the team lead.',
      audience: 'Người mới tiếp nhận',
      mustPreserve: 'Keep the 2-hour callback rule and same-day quote rule.',
    },
    expectedTerms: ['2 hours', 'same-day', 'checklist'],
  },
  {
    id: 'W119-S2-KNOWLEDGE-ASSISTED-TASK',
    journey: 'knowledge_assisted_project_task',
    expectedDecision: 'ALLOW',
    templateId: 'strategy_analysis',
    templateName: 'Phân tích Chiến lược',
    knowledgeCollectionId: knowledgeCollection.collectionId,
    intent: 'Use project knowledge to create a decision memo for LumenCart onboarding.',
    inputs: {
      topic: 'LumenCart onboarding decision memo',
      context: 'Use the loaded project knowledge as the authoritative source for user, constraints, and success metric.',
      options: '1. Build offline-first checkout first\n2. Build online catalog first\n3. Build vendor analytics first',
      constraints: 'Prioritize non-technical night-market vendors and avoid assuming permanent internet.',
      priority: 'Stability',
    },
    expectedTerms: ['LumenCart', 'offline-first', 'night-market', '30 seconds'],
  },
  {
    id: 'W119-S3-EVIDENCE-HANDOFF',
    journey: 'evidence_handoff',
    expectedDecision: 'ALLOW',
    templateId: 'documentation',
    templateName: 'Tài liệu Kỹ thuật',
    knowledgeCollectionId: knowledgeCollection.collectionId,
    intent: 'Create a short handoff note explaining what to build first for LumenCart.',
    inputs: {
      subject: 'LumenCart first build handoff',
      currentNotes: 'Use project knowledge. The recipient is a non-coder founder handing work to a builder. Keep the exact English project name LumenCart, the exact term offline-first, and include a short Evidence receipt section.',
      readerGoal: 'The builder understands the first milestone, constraints, and evidence receipt that CVF produced.',
      audience: 'Quản lý / approver',
      mustPreserve: 'Mention offline-first, night-market vendors, and checkout under 30 seconds.',
    },
    expectedTerms: ['LumenCart', 'offline-first', 'receipt'],
  },
];

function startServer() {
  const env = {
    ...process.env,
    CVF_SERVICE_TOKEN: SERVICE_TOKEN,
    DEFAULT_AI_PROVIDER: process.env.DEFAULT_AI_PROVIDER || 'alibaba',
    DASHSCOPE_API_KEY: process.env.DASHSCOPE_API_KEY,
  };
  const child = spawn('npm', ['run', 'dev', '--', '--port', String(PORT)], {
    cwd: CVF_WEB,
    env,
    shell: true,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const logLines = [];
  const keepLog = (chunk) => {
    for (const line of String(chunk).split(/\r?\n/).filter(Boolean)) {
      logLines.push(line);
      if (logLines.length > 100) logLines.shift();
    }
  };
  child.stdout.on('data', keepLog);
  child.stderr.on('data', keepLog);
  child.getRecentLog = () => logLines.join('\n');
  return child;
}

function stopServer(child) {
  if (!child || child.killed) return;
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' });
    } else {
      child.kill('SIGTERM');
    }
  } catch (_) {
    try { child.kill(); } catch (_) {}
  }
}

async function waitForServer(timeoutMs = 90_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(BASE_URL, { redirect: 'manual' });
      if (res.status >= 200 && res.status < 500) return;
    } catch (_) {
      // keep polling
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Timed out waiting for cvf-web at ${BASE_URL}`);
}

async function postJson(url, payload, headers = {}) {
  const serviceAuth = headers['x-cvf-service-token']
    ? buildServiceTokenHeaders(headers['x-cvf-service-token'], payload)
    : null;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
      ...(serviceAuth ? serviceAuth.headers : {}),
    },
    body: serviceAuth ? serviceAuth.body : JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({ error: 'Non-JSON response' }));
  return { status: res.status, data };
}

async function ingestKnowledge() {
  return postJson(INGEST_URL, knowledgeCollection);
}

function buildPayload(scenario) {
  return {
    ...commonExecuteMeta,
    templateId: scenario.templateId,
    templateName: scenario.templateName,
    intent: scenario.intent,
    inputs: scenario.inputs,
    knowledgeCollectionId: scenario.knowledgeCollectionId,
    requestId: `${scenario.id}-${Date.now()}`,
    skillPreflightRecordRef: `w119-t1-${scenario.id}`,
    aiCommit: {
      commitId: `w119-t1-${scenario.id}-${Date.now()}`,
      agentId: 'cvf-w119-adoption-evidence-pack',
      timestamp: Date.now(),
      description: 'W119 live non-coder adoption evidence pack',
    },
  };
}

function scoreUsefulness(output) {
  const text = String(output || '');
  const hasStructure = /^#{1,3}\s+/m.test(text) || /^[*-]\s+/m.test(text) || /^\d+\.\s+/m.test(text);
  const hasAction = /\b(step|checklist|recommend|handoff|next|action|implementation|implement|develop|test|plan|nên|cần|bàn giao|triển khai)\b/i.test(text);
  const hasGovernanceBypass = /\b(skip governance|bypass approval|ignore policy)\b/i.test(text);
  return {
    length: text.length,
    hasStructure,
    hasAction,
    governanceSafe: !hasGovernanceBypass,
    pass: text.length >= 300 && hasStructure && hasAction && !hasGovernanceBypass,
  };
}

function collectTermHits(output, expectedTerms) {
  const lower = String(output || '').toLowerCase();
  return expectedTerms.filter((term) => lower.includes(term.toLowerCase()));
}

function receiptPresent(receipt) {
  return !!(
    receipt
    && receipt.receiptId
    && receipt.evidenceMode === 'live'
    && receipt.routeId === '/api/execute'
    && receipt.policySnapshotId
    && receipt.envelopeId
    && receipt.decision
    && receipt.provider
    && receipt.model
  );
}

async function runScenario(scenario) {
  const payload = buildPayload(scenario);
  const started = Date.now();
  const { status, data } = await postJson(EXECUTE_URL, payload, { 'x-cvf-service-token': SERVICE_TOKEN });
  const durationMs = Date.now() - started;
  const output = data.output || '';
  const termHits = collectTermHits(output, scenario.expectedTerms || []);
  const receipt = data.governanceEvidenceReceipt || null;
  const expectedDecisionMet = data.enforcement?.status === scenario.expectedDecision;
  const evidenceReceiptMet = receiptPresent(receipt);
  const knowledgeMet = scenario.knowledgeCollectionId
    ? data.knowledgeInjection?.source === 'retrieval'
      && data.knowledgeInjection?.collectionId === scenario.knowledgeCollectionId
      && Number(data.knowledgeInjection?.chunkCount || 0) > 0
      && receipt?.knowledgeCollectionId === scenario.knowledgeCollectionId
    : true;
  const termMet = scenario.expectedTerms?.length ? termHits.length >= 2 : true;
  const usefulness = scoreUsefulness(output);

  return {
    id: scenario.id,
    journey: scenario.journey,
    expectedDecision: scenario.expectedDecision,
    expectedDecisionMet,
    evidenceReceiptMet,
    knowledgeMet,
    termMet,
    usefulness,
    pass: expectedDecisionMet && evidenceReceiptMet && knowledgeMet && termMet && usefulness.pass,
    httpStatus: status,
    durationMs,
    provider: data.provider || null,
    model: data.model || null,
    governanceDecision: data.enforcement?.status || null,
    riskLevel: data.enforcement?.riskGate?.riskLevel || null,
    providerRouting: data.providerRouting ? {
      decision: data.providerRouting.decision,
      selectedProvider: data.providerRouting.selectedProvider,
      requestedProvider: data.providerRouting.requestedProvider,
      routerOverrode: data.providerRouting.routerOverrode,
    } : null,
    knowledgeInjection: data.knowledgeInjection || null,
    expectedTerms: scenario.expectedTerms || [],
    expectedTermHits: termHits,
    evidenceReceipt: receipt ? {
      receiptId: receipt.receiptId,
      evidenceMode: receipt.evidenceMode,
      routeId: receipt.routeId,
      decision: receipt.decision,
      riskLevel: receipt.riskLevel,
      provider: receipt.provider,
      model: receipt.model,
      routingDecision: receipt.routingDecision,
      policySnapshotId: receipt.policySnapshotId,
      envelopeId: receipt.envelopeId,
      knowledgeSource: receipt.knowledgeSource,
      knowledgeCollectionId: receipt.knowledgeCollectionId,
      knowledgeChunkCount: receipt.knowledgeChunkCount,
      validationHint: receipt.validationHint,
      generatedAt: receipt.generatedAt,
    } : null,
    outputLength: output.length,
    outputExcerpt: output.slice(0, 900),
    rawKeyValue: 'NOT PRINTED',
  };
}

function summarize(results, ingest) {
  return {
    totalJourneys: results.length,
    passedJourneys: results.filter((r) => r.pass).length,
    expectedDecisionMet: results.filter((r) => r.expectedDecisionMet).length,
    evidenceReceiptMet: results.filter((r) => r.evidenceReceiptMet).length,
    knowledgeJourneys: results.filter((r) => r.knowledgeInjection?.source === 'retrieval').length,
    knowledgeCollectionMet: results.filter((r) => r.knowledgeMet).length,
    usefulOutputs: results.filter((r) => r.usefulness.pass).length,
    ingestAccepted: ingest.data?.accepted || 0,
    rawKeysPrinted: false,
  };
}

function writeMarkdown(evidence) {
  const s = evidence.summary;
  const lines = [
    '<!-- Memory class: SUMMARY_RECORD -->',
    '',
    '# CVF W119-T1 Non-Coder Adoption Evidence Pack',
    '',
    '> Date: 2026-04-23',
    '> Status: CP4 LIVE EVIDENCE GENERATED',
    '> Evidence class: LIVE WEB ROUTE / ALIBABA LANE',
    '> Raw evidence: `docs/assessments/CVF_W119_T1_NONCODER_ADOPTION_EVIDENCE_RAW_2026-04-23.json`',
    '',
    '## Scope',
    '',
    'This pack exercises the W119 locked non-coder adoption journeys: first governed output, project knowledge use, and evidence handoff. It uses `POST /api/knowledge/ingest` plus the governed `/api/execute` route with a real DashScope-compatible provider key loaded from operator-controlled environment sources. Raw provider key values are not printed or written.',
    '',
    '## Summary',
    '',
    `- Total locked journeys: ${s.totalJourneys}`,
    `- Passed journeys: ${s.passedJourneys}/${s.totalJourneys}`,
    `- Expected decisions met: ${s.expectedDecisionMet}/${s.totalJourneys}`,
    `- Evidence receipts present: ${s.evidenceReceiptMet}/${s.totalJourneys}`,
    `- Knowledge ingest accepted chunks: ${s.ingestAccepted}`,
    `- Knowledge collection checks met: ${s.knowledgeCollectionMet}/${s.totalJourneys}`,
    `- Useful live outputs: ${s.usefulOutputs}/${s.totalJourneys}`,
    `- Raw provider keys printed: ${s.rawKeysPrinted ? 'YES' : 'NO'}`,
    '',
    '## Journey Results',
    '',
    '| Journey | Decision | Receipt | Knowledge | Useful | Terms | Receipt Id |',
    '| --- | --- | --- | --- | --- | --- | --- |',
  ];

  for (const r of evidence.results) {
    lines.push(`| ${r.journey} | ${r.expectedDecisionMet ? 'PASS' : 'FAIL'} (${r.governanceDecision || 'n/a'}) | ${r.evidenceReceiptMet ? 'PASS' : 'FAIL'} | ${r.knowledgeMet ? 'PASS' : 'FAIL'} | ${r.usefulness.pass ? 'PASS' : 'FAIL'} | ${r.expectedTermHits.join(', ') || 'n/a'} | ${r.evidenceReceipt?.receiptId || 'n/a'} |`);
  }

  lines.push(
    '',
    '## Boundaries',
    '',
    '- This proves the active CVF Web governed `/api/execute` path for the locked W119 journeys, not the full CVF runtime.',
    '- This is Alibaba/DashScope-compatible lane evidence, not provider parity or provider quality comparison.',
    '- Workspace enforcement readiness remains artifact/doctor evidence; live provider readiness is separate and secret-free.',
    '- File-backed knowledge persistence remains local single-process storage, not production multi-user database storage.',
  );

  fs.writeFileSync(OUT_MD, `${lines.join('\n')}\n`, 'utf8');
}

async function main() {
  console.log('W119 Non-Coder Adoption Evidence Pack');
  console.log(`Target: ${BASE_URL}`);
  console.log('Provider lane: alibaba');
  console.log(`Live key source name: ${LIVE_KEY_NAME}`);
  console.log('Raw key value: NOT PRINTED');

  const child = startServer();
  try {
    await waitForServer();
    console.log('cvf-web dev server ready.');

    const ingest = await ingestKnowledge();
    console.log(`[ingest] HTTP ${ingest.status} | accepted=${ingest.data?.accepted || 0} | collection=${ingest.data?.collectionId || 'n/a'}`);

    const results = [];
    for (const scenario of scenarios) {
      const result = await runScenario(scenario);
      results.push(result);
      console.log(`[${result.id}] HTTP ${result.httpStatus} | ${result.governanceDecision || 'n/a'} | receipt=${result.evidenceReceiptMet ? 'PASS' : 'FAIL'} | pass=${result.pass ? 'PASS' : 'FAIL'}`);
    }

    const evidence = {
      tranche: 'W119-T1',
      generatedAt: new Date().toISOString(),
      route: '/api/execute',
      ingestRoute: '/api/knowledge/ingest',
      targetBaseUrl: BASE_URL,
      providerLane: 'alibaba',
      liveKeyAvailable: true,
      liveKeySourceName: LIVE_KEY_NAME,
      rawKeyValue: 'NOT PRINTED',
      serviceTokenValue: 'NOT PRINTED',
      scenarioLock: 'docs/baselines/CVF_W119_T1_NONCODER_ADOPTION_SCENARIO_LOCK_2026-04-23.md',
      ingest: {
        status: ingest.status,
        accepted: ingest.data?.accepted || 0,
        collectionId: ingest.data?.collectionId || knowledgeCollection.collectionId,
      },
      summary: summarize(results, ingest),
      results,
    };

    fs.writeFileSync(OUT_JSON, JSON.stringify(evidence, null, 2), 'utf8');
    writeMarkdown(evidence);

    console.log('\nSummary:');
    console.log(JSON.stringify(evidence.summary, null, 2));
    console.log(`\nRaw evidence: ${OUT_JSON}`);
    console.log(`Assessment: ${OUT_MD}`);

    if (ingest.status !== 200 || evidence.summary.passedJourneys !== evidence.summary.totalJourneys) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('W119 evidence pack failed:', err.message);
    if (child.getRecentLog) {
      console.error('\nRecent cvf-web log:');
      console.error(child.getRecentLog());
    }
    process.exitCode = 1;
  } finally {
    stopServer(child);
  }
}

main();
