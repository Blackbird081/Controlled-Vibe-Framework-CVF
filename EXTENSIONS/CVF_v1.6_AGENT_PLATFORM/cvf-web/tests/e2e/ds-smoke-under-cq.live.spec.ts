import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { evaluateCostQuotaPreflight } from '../../src/lib/server/web-governance-cost-quota';
import { generateIntent, getTemplateById } from '../../src/lib/templates';

const EVIDENCE_MD = resolve(__dirname, '../../../../../docs/reviews/CVF_DEEPSEEK_POST_RC2_SMOKE_COVERAGE_2026-05-08.md');
const REPO_ROOT = resolve(__dirname, '../../../../..');
const HAS_DEEPSEEK_KEY = Boolean(process.env.DEEPSEEK_API_KEY);

interface SmokeCase {
  id: string;
  family: string;
  templateId: string;
  templateName: string;
  intent: string;
  inputs: Record<string, string>;
}

interface SmokeRecord {
  id: string;
  family: string;
  status: 'PASS' | 'FAIL';
  httpStatus: number;
  receipt: boolean;
  outputLength: number;
  detail: string;
}

const CASES: SmokeCase[] = [
  {
    id: 'ds-first-value',
    family: 'first_value',
    templateId: 'strategy_analysis',
    templateName: 'Strategy Analysis',
    intent: 'DeepSeek smoke: produce a concise governed strategy note with receipt.',
    inputs: { topic: 'Local-first GA readiness', context: 'Evaluate release readiness signals.', options: 'GA with limits\nRC3', constraints: 'Keep concise and auditable' },
  },
  {
    id: 'ds-intent-routing',
    family: 'intent_routing',
    templateId: 'email_template',
    templateName: 'Email Template',
    intent: 'DeepSeek smoke: draft a customer update email from an intent-routed family.',
    inputs: {
      purpose: 'Announce governed release validation to beta users',
      context: 'CVF has closed browser redaction and cost/quota guard evidence. The note must mention local-first posture, evidence receipts, and explicit known limits.',
      recipient: 'beta users and non-coder operators',
      tone: 'Professional',
    },
  },
  {
    id: 'ds-continuity-root',
    family: 'continuity',
    templateId: 'documentation',
    templateName: 'Documentation',
    intent: 'DeepSeek smoke: create a short handoff note that can be continued.',
    inputs: {
      subject: 'Post-RC2 handoff',
      currentNotes: 'BR closed with fake-key browser redaction. CQ active with live under-budget release gate proof. CI2-H hosted PASS is deferred because GitHub CLI is unavailable locally.',
      readerGoal: 'Next operator can continue CI2-H or DS work without overclaiming.',
      audience: 'Người vận hành nội bộ',
      mustPreserve: 'Do not claim hosted PASS until a hosted artifact exists.',
    },
  },
  {
    id: 'ds-clarification',
    family: 'clarification',
    templateId: 'risk_assessment',
    templateName: 'Risk Assessment',
    intent: 'DeepSeek smoke: answer an enriched clarification outcome for a vague operator request.',
    inputs: {
      subject: 'GA readiness decision with known limits',
      description: 'Some evidence is smoke-only and CI2-H hosted proof is deferred. The operator needs a clear risk view before choosing GA with limits or RC3.',
      stakeholders: 'Operator, non-coder users, maintainers',
      timeline: 'Before public GA decision',
      tolerance: 'Medium',
    },
  },
  {
    id: 'ds-deliverable-pack',
    family: 'deliverable_pack',
    templateId: 'competitor_review',
    templateName: 'Competitor Review',
    intent: 'DeepSeek smoke: produce a deliverable-pack-friendly competitor review summary.',
    inputs: {
      company: 'CVF - local-first AI governance framework',
      competitors: 'Generic automation tool\nHosted AI workflow suite\nDocumentation-only governance checklist',
      industry: 'local-first AI governance',
      criteria: 'evidence receipts, cost control, operator trust, local data ownership',
    },
  },
  {
    id: 'ds-trusted-form',
    family: 'trusted_form',
    templateId: 'user_persona',
    templateName: 'User Persona',
    intent: 'DeepSeek smoke: complete a trusted-form user persona packet.',
    inputs: {
      product: 'CVF Web Operations',
      data: 'Primary user is a non-coder operator who needs to run governed checks, inspect receipts, avoid cost spikes, and understand proof boundaries without reading source code.',
      segments: 'non-coder operator, maintainer, reviewer',
      goals: 'increase trust in governed AI work while keeping data local',
    },
  },
  {
    id: 'ds-export-readout',
    family: 'export_readout_metrics',
    templateId: 'feature_prioritization',
    templateName: 'Feature Prioritization',
    intent: 'DeepSeek smoke: prioritize GA-readiness follow-ups with clear metrics.',
    inputs: {
      features: 'CI2-H hosted proof\nDS larger confirmation\nManaged state adapter\nCost dollar estimates',
      goal: 'Reduce GA release risk while preserving local-first CVF.',
      constraints: 'Local-first GA first; managed mode is deferred.',
      framework: 'RICE',
    },
  },
  {
    id: 'ds-metrics-sanity',
    family: 'export_readout_metrics',
    templateId: 'pricing_strategy',
    templateName: 'Pricing Strategy',
    intent: 'DeepSeek smoke: explain why call-count cost guard is sufficient before dollar billing.',
    inputs: {
      product: 'CVF local-first release validation',
      currentPrice: 'CVF itself has no usage fee; operators pay their own provider API costs.',
      model: 'Usage-based',
      target: 'B2B SMB',
      competitors: 'Hosted AI workflow tools bundle platform cost and provider cost.',
    },
  },
];

function ensureDir(path: string) {
  mkdirSync(dirname(path), { recursive: true });
}

async function loginFast(page: import('@playwright/test').Page) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.locator('input[type="text"][placeholder="admin"]').fill('admin');
  await page.locator('input[type="password"][placeholder="admin123"]').fill('admin123');
  await page.getByRole('button', { name: /Đăng nhập|Sign in/i }).click();
  await expect(page.getByRole('heading', { name: /Templates/i }).first()).toBeVisible({ timeout: 30_000 });
}

function writeEvidence(records: SmokeRecord[], costQuota: ReturnType<typeof evaluateCostQuotaPreflight>) {
  const passCount = records.filter((record) => record.status === 'PASS').length;
  const familyCount = new Set(records.filter((record) => record.status === 'PASS').map((record) => record.family)).size;
  ensureDir(EVIDENCE_MD);
  writeFileSync(EVIDENCE_MD, [
    '<!-- Memory class: FULL_RECORD -->',
    '# CVF DeepSeek Post-RC2 Smoke Coverage',
    '',
    '**Date:** 2026-05-08',
    `**Status:** ${passCount >= 8 ? 'PASS' : 'FAIL'}`,
    '**Provider lane:** DeepSeek',
    '**Claim tier:** smoke/sanity, not regression confirmation',
    '',
    '## Cost/Quota Preflight',
    '',
    '| Field | Value |',
    '|---|---|',
    `| decision | ${costQuota.decision} |`,
    `| decisionReason | ${costQuota.decisionReason} |`,
    `| expectedLiveCallCount | ${costQuota.estimate.expectedLiveCallCount} |`,
    `| providerLane | ${costQuota.estimate.providerLane} |`,
    `| providerUsageBefore | ${costQuota.providerUsage} |`,
    `| providerLimit | ${costQuota.providerLimit} |`,
    `| auditPath | ${costQuota.auditPath} |`,
    '',
    '## Summary',
    '',
    `- Successful DeepSeek checks: ${passCount}/8`,
    `- Families covered: ${familyCount}`,
    '- N>=8 is smoke/sanity only. N>=14 is required before using regression confirmation wording.',
    '',
    '## Records',
    '',
    '| ID | Family | Status | HTTP | Receipt | Output length | Detail |',
    '|---|---|---|---:|---:|---:|---|',
    ...records.map((record) => `| ${record.id} | ${record.family} | ${record.status} | ${record.httpStatus} | ${record.receipt ? 'yes' : 'no'} | ${record.outputLength} | ${record.detail.replace(/\|/g, '/')} |`),
    '',
    '## Boundary',
    '',
    '- This is bounded DeepSeek smoke/sanity coverage after CQ controls.',
    '- It does not claim full DeepSeek/Alibaba parity.',
    '- It does not replay the full W149 corpus.',
    '- It does not claim DeepSeek regression confirmation.',
  ].join('\n'), 'utf8');
}

test('DS smoke/sanity coverage runs under CQ preflight', async ({ page }) => {
  test.skip(!HAS_DEEPSEEK_KEY, 'DeepSeek smoke requires DEEPSEEK_API_KEY in env or .env.local');
  test.setTimeout(900_000);

  const dsAuditPath = resolve(REPO_ROOT, '.cvf', 'runtime', `web-governance-cost-quota-ds-smoke-${Date.now()}.jsonl`);
  const costQuota = evaluateCostQuotaPreflight({
    repoRoot: REPO_ROOT,
    jobId: `ds-smoke-${Date.now()}`,
    jobType: 'deepseek_post_rc2_smoke',
    providerLane: 'deepseek',
    role: 'admin',
    requestedBy: 'DS Smoke Playwright',
    auditPath: dsAuditPath,
  });
  expect(costQuota.decision, costQuota.decisionReason).toBe('allowed');
  expect(costQuota.estimate.expectedLiveCallCount).toBe(8);

  await loginFast(page);
  const records: SmokeRecord[] = [];

  for (const smokeCase of CASES) {
    const template = getTemplateById(smokeCase.templateId);
    const response = await page.request.post('/api/execute', {
      data: {
        templateId: smokeCase.templateId,
        templateName: template?.name ?? smokeCase.templateName,
        intent: template ? generateIntent(template, smokeCase.inputs) : smokeCase.intent,
        inputs: smokeCase.inputs,
        provider: 'deepseek',
        model: 'deepseek-chat',
        mode: 'governance',
        action: 'analyze',
      },
      timeout: 120_000,
    });
    const body = await response.json().catch(() => ({}));
    const output = String(body.output ?? '');
    const receipt = Boolean(body.governanceEvidenceReceipt?.decision);
    const ok = response.status() === 200 && body.success === true && receipt && output.length >= 120;
    records.push({
      id: smokeCase.id,
      family: smokeCase.family,
      status: ok ? 'PASS' : 'FAIL',
      httpStatus: response.status(),
      receipt,
      outputLength: output.length,
      detail: ok ? 'DeepSeek governed response returned receipt.' : `success=${String(body.success)} error=${String(body.error ?? '')}`,
    });
  }

  writeEvidence(records, costQuota);

  expect(records.filter((record) => record.status === 'PASS').length).toBeGreaterThanOrEqual(8);
  expect(new Set(records.map((record) => record.family)).size).toBeGreaterThanOrEqual(7);
});
