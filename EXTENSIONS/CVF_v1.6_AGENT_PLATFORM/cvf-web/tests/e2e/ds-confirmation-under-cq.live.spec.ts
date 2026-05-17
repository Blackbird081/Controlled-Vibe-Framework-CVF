import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { evaluateCostQuotaPreflight } from '../../src/lib/server/web-governance-cost-quota';
import { generateIntent, getTemplateById } from '../../src/lib/templates';

const EVIDENCE_MD = resolve(__dirname, '../../../../../docs/reviews/CVF_DEEPSEEK_POST_RC2_CONFIRMATION_COVERAGE_2026-05-09.md');
const REPO_ROOT = resolve(__dirname, '../../../../..');
const HAS_DEEPSEEK_KEY = Boolean(process.env.DEEPSEEK_API_KEY);

interface ConfirmationCase {
  id: string;
  family: string;
  templateId: string;
  templateName: string;
  intent: string;
  inputs: Record<string, string>;
}

interface ConfirmationRecord {
  id: string;
  family: string;
  status: 'PASS' | 'FAIL';
  httpStatus: number;
  receipt: boolean;
  receiptDecision: string | null;
  outputLength: number;
  detail: string;
}

const CASES: ConfirmationCase[] = [
  {
    id: 'ds-first-value-strategy',
    family: 'first_value',
    templateId: 'strategy_analysis',
    templateName: 'Strategy Analysis',
    intent: 'DeepSeek confirmation: produce a governed strategy note with receipt.',
    inputs: {
      topic: 'Local-first GA readiness',
      context: 'Evaluate CI2-H PASS, browser redaction, cost/quota guard, and known limits.',
      options: 'GA local-first\nRC3 extension\nManaged deployment deferral',
      constraints: 'Keep concise, auditable, and boundary-aware',
    },
  },
  {
    id: 'ds-first-value-documentation',
    family: 'first_value',
    templateId: 'documentation',
    templateName: 'Documentation',
    intent: 'DeepSeek confirmation: produce an operator handoff summary with receipt.',
    inputs: {
      subject: 'Post-RC2 GA readiness',
      currentNotes: 'CI2-H hosted release gate passed 7/7 after DashScope env alignment. CQ and BR are closed.',
      readerGoal: 'A future operator can continue multi-provider validation without overclaiming.',
      audience: 'CVF maintainers',
      mustPreserve: 'Do not claim exact-dollar cost control or managed cloud mode completion.',
    },
  },
  {
    id: 'ds-intent-routing-email',
    family: 'intent_routing',
    templateId: 'email_template',
    templateName: 'Email Template',
    intent: 'DeepSeek confirmation: draft a customer update email from an intent-routed family.',
    inputs: {
      purpose: 'Notify beta users that CVF has moved to local-first GA readiness',
      context: 'The update should mention evidence receipts, local-first data ownership, and cost/quota guardrails.',
      recipient: 'beta users and non-coder operators',
      tone: 'Professional',
    },
  },
  {
    id: 'ds-intent-routing-pricing',
    family: 'intent_routing',
    templateId: 'pricing_strategy',
    templateName: 'Pricing Strategy',
    intent: 'DeepSeek confirmation: explain provider-cost posture for local-first operators.',
    inputs: {
      product: 'CVF local-first governed AI operations',
      currentPrice: 'CVF itself has no provider markup; operators use their own API keys.',
      model: 'Open-source local-first framework plus operator-owned provider costs',
      target: 'B2B SMB maintainers and non-coder operators',
      competitors: 'Hosted AI workflow suites bundle platform and provider costs.',
    },
  },
  {
    id: 'ds-continuity-root',
    family: 'continuity',
    templateId: 'documentation',
    templateName: 'Documentation',
    intent: 'DeepSeek confirmation: create a continuation-ready handoff note.',
    inputs: {
      subject: 'DeepSeek confirmation follow-up',
      currentNotes: 'After CI2-H PASS, the remaining provider work is DeepSeek confirmation and future Gemini/OpenAI/Claude lanes.',
      readerGoal: 'Continue provider validation with explicit N counts and evidence boundaries.',
      audience: 'Next CVF operator',
      mustPreserve: 'Record live run IDs and do not print raw keys.',
    },
  },
  {
    id: 'ds-continuity-pack',
    family: 'continuity',
    templateId: 'competitor_review',
    templateName: 'Competitor Review',
    intent: 'DeepSeek confirmation: generate a deliverable-pack-friendly competitor review that can be continued.',
    inputs: {
      company: 'CVF',
      competitors: 'Hosted AI workflow suite\nLocal scripts without governance\nDocumentation-only policy checklist',
      industry: 'AI governance operations',
      criteria: 'evidence receipts, provider portability, local data ownership, cost control',
    },
  },
  {
    id: 'ds-clarification-risk',
    family: 'clarification',
    templateId: 'risk_assessment',
    templateName: 'Risk Assessment',
    intent: 'DeepSeek confirmation: answer an enriched clarification outcome for GA release risk.',
    inputs: {
      subject: 'GA readiness decision',
      description: 'Hosted CI2-H is now PASS, but exact-dollar billing and managed multi-tenant quota remain out of scope.',
      stakeholders: 'Maintainers, non-coder users, reviewers',
      timeline: 'Before broader public announcement',
      tolerance: 'Medium',
    },
  },
  {
    id: 'ds-clarification-persona',
    family: 'clarification',
    templateId: 'user_persona',
    templateName: 'User Persona',
    intent: 'DeepSeek confirmation: turn an ambiguous user profile into a governed persona packet.',
    inputs: {
      product: 'CVF Web Operations',
      data: 'The user is a non-coder operator who needs visibility into proof status, provider keys, budget risk, and handoff state.',
      segments: 'non-coder operator, maintainer, reviewer',
      goals: 'Run governed checks confidently without reading source code.',
    },
  },
  {
    id: 'ds-deliverable-pack-competitor',
    family: 'deliverable_pack',
    templateId: 'competitor_review',
    templateName: 'Competitor Review',
    intent: 'DeepSeek confirmation: produce a compact competitor review suitable for a deliverable pack.',
    inputs: {
      company: 'CVF local-first governance',
      competitors: 'Hosted agent platform\nGeneric chat UI\nManual checklist',
      industry: 'AI governance tooling',
      criteria: 'audit trail, live proof, provider portability, cost guard',
    },
  },
  {
    id: 'ds-deliverable-pack-feature',
    family: 'deliverable_pack',
    templateId: 'feature_prioritization',
    templateName: 'Feature Prioritization',
    intent: 'DeepSeek confirmation: prioritize multi-provider completion work for a deliverable pack.',
    inputs: {
      features: 'DeepSeek confirmation\nGemini lane\nOpenAI lane\nClaude lane\nManaged Postgres mode',
      goal: 'Complete provider validation without weakening local-first posture.',
      constraints: 'Use live keys only from operator-controlled env vars. Keep managed storage optional.',
      framework: 'RICE',
    },
  },
  {
    id: 'ds-trusted-form-persona',
    family: 'trusted_form',
    templateId: 'user_persona',
    templateName: 'User Persona',
    intent: 'DeepSeek confirmation: complete a trusted-form user persona packet.',
    inputs: {
      product: 'CVF local-first Web Operations',
      data: 'Operators need visual governance controls, release-gate proof, cost preflight, and safe evidence exports.',
      segments: 'non-coder operator, maintainer, reviewer',
      goals: 'Increase trust in governed AI work while keeping project data local.',
    },
  },
  {
    id: 'ds-trusted-form-risk',
    family: 'trusted_form',
    templateId: 'risk_assessment',
    templateName: 'Risk Assessment',
    intent: 'DeepSeek confirmation: complete a trusted-form risk assessment packet.',
    inputs: {
      subject: 'Adding Gemini, OpenAI, and Claude lanes after DeepSeek',
      description: 'Each lane needs live proof, credential redaction, and bounded claim wording before multi-provider parity is claimed.',
      stakeholders: 'Operator, maintainer, reviewer',
      timeline: 'After DeepSeek confirmation',
      tolerance: 'Low',
    },
  },
  {
    id: 'ds-export-readout-feature',
    family: 'export_readout_metrics',
    templateId: 'feature_prioritization',
    templateName: 'Feature Prioritization',
    intent: 'DeepSeek confirmation: prioritize remaining provider work with clear metrics.',
    inputs: {
      features: 'Gemini live gate\nOpenAI live gate\nClaude live gate\nManaged runtime job store\nCost dollar estimates',
      goal: 'Reduce release risk while preserving local-first governance.',
      constraints: 'No cloud storage requirement for developer mode.',
      framework: 'RICE',
    },
  },
  {
    id: 'ds-export-readout-pricing',
    family: 'export_readout_metrics',
    templateId: 'pricing_strategy',
    templateName: 'Pricing Strategy',
    intent: 'DeepSeek confirmation: explain why call-count cost guard is useful before exact billing.',
    inputs: {
      product: 'CVF provider validation',
      currentPrice: 'Operators pay provider APIs directly.',
      model: 'Usage-based provider costs with local call-count guardrails',
      target: 'Local-first teams',
      competitors: 'Hosted suites hide some provider cost details behind platform billing.',
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
  await page.getByRole('button', { name: /Dang nhap|Đăng nhập|Sign in/i }).click();
  await expect(page.getByRole('heading', { name: /Templates/i }).first()).toBeVisible({ timeout: 30_000 });
}

function writeEvidence(records: ConfirmationRecord[], costQuota: ReturnType<typeof evaluateCostQuotaPreflight>) {
  const passRecords = records.filter((record) => record.status === 'PASS');
  const passCount = passRecords.length;
  const families = Array.from(new Set(records.map((record) => record.family)));
  const familyRows = families.map((family) => {
    const total = records.filter((record) => record.family === family).length;
    const passed = records.filter((record) => record.family === family && record.status === 'PASS').length;
    return { family, total, passed };
  });
  const familiesWithTwoPasses = familyRows.filter((row) => row.passed >= 2).length;
  const status = passCount >= 14 && familiesWithTwoPasses >= 7 ? 'PASS' : 'FAIL';

  ensureDir(EVIDENCE_MD);
  writeFileSync(EVIDENCE_MD, [
    '<!-- Memory class: FULL_RECORD -->',
    '# CVF DeepSeek Post-RC2 Confirmation Coverage',
    '',
    '**Date:** 2026-05-09',
    `**Status:** ${status}`,
    '**Provider lane:** DeepSeek',
    '**Model:** `deepseek-chat`',
    '**Claim tier:** bounded post-RC2 regression confirmation',
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
    `- Successful DeepSeek checks: ${passCount}/14`,
    `- Families with >=2 PASS records: ${familiesWithTwoPasses}/7`,
    '- This satisfies the authorized N>=14 confirmation tier only if all rows below are PASS.',
    '',
    '## Family Coverage',
    '',
    '| Family | PASS | Total |',
    '|---|---:|---:|',
    ...familyRows.map((row) => `| ${row.family} | ${row.passed} | ${row.total} |`),
    '',
    '## Records',
    '',
    '| ID | Family | Status | HTTP | Receipt | Decision | Output length | Detail |',
    '|---|---|---|---:|---:|---|---:|---|',
    ...records.map((record) => `| ${record.id} | ${record.family} | ${record.status} | ${record.httpStatus} | ${record.receipt ? 'yes' : 'no'} | ${record.receiptDecision ?? 'n/a'} | ${record.outputLength} | ${record.detail.replace(/\|/g, '/')} |`),
    '',
    '## Boundary',
    '',
    '- This is bounded DeepSeek confirmation after Post-RC2 hardening and CQ controls.',
    '- It does not claim full DeepSeek/Alibaba parity.',
    '- It does not claim exact provider-dollar cost control.',
    '- It does not cover Gemini, OpenAI, or Claude; those lanes require separate live keys and evidence.',
  ].join('\n'), 'utf8');
}

test('DS N>=14 confirmation coverage runs under CQ preflight', async ({ page }) => {
  test.skip(!HAS_DEEPSEEK_KEY, 'DeepSeek confirmation requires DEEPSEEK_API_KEY in env or .env.local');
  test.setTimeout(3_600_000);

  const dsAuditPath = resolve(REPO_ROOT, '.cvf', 'runtime', `web-governance-cost-quota-ds-confirmation-${Date.now()}.jsonl`);
  const costQuota = evaluateCostQuotaPreflight({
    repoRoot: REPO_ROOT,
    jobId: `ds-confirmation-${Date.now()}`,
    jobType: 'deepseek_post_rc2_confirmation',
    providerLane: 'deepseek',
    role: 'admin',
    requestedBy: 'DS Confirmation Playwright',
    auditPath: dsAuditPath,
  });
  expect(costQuota.decision, costQuota.decisionReason).toBe('allowed');
  expect(costQuota.estimate.expectedLiveCallCount).toBe(14);

  await loginFast(page);
  const records: ConfirmationRecord[] = [];

  for (const confirmationCase of CASES) {
    const template = getTemplateById(confirmationCase.templateId);
    const response = await page.request.post('/api/execute', {
      data: {
        templateId: confirmationCase.templateId,
        templateName: template?.name ?? confirmationCase.templateName,
        intent: template ? generateIntent(template, confirmationCase.inputs) : confirmationCase.intent,
        inputs: confirmationCase.inputs,
        provider: 'deepseek',
        model: 'deepseek-chat',
        mode: 'governance',
        action: 'analyze template execution request',
      },
      timeout: 180_000,
    });
    const body = await response.json().catch(() => ({}));
    const output = String(body.output ?? '');
    const receiptDecision = body.governanceEvidenceReceipt?.decision ? String(body.governanceEvidenceReceipt.decision) : null;
    const receipt = Boolean(receiptDecision);
    const ok = response.status() === 200 && body.success === true && receipt && output.length >= 120;
    records.push({
      id: confirmationCase.id,
      family: confirmationCase.family,
      status: ok ? 'PASS' : 'FAIL',
      httpStatus: response.status(),
      receipt,
      receiptDecision,
      outputLength: output.length,
      detail: ok ? 'DeepSeek governed response returned receipt.' : `success=${String(body.success)} error=${String(body.error ?? '')}`,
    });
    writeEvidence(records, costQuota);
    await page.waitForTimeout(1000);
  }

  const passRecords = records.filter((record) => record.status === 'PASS');
  const familiesWithTwoPasses = new Set(
    Array.from(new Set(records.map((record) => record.family))).filter((family) =>
      records.filter((record) => record.family === family && record.status === 'PASS').length >= 2,
    ),
  );

  writeEvidence(records, costQuota);

  expect(passRecords.length).toBeGreaterThanOrEqual(14);
  expect(familiesWithTwoPasses.size).toBeGreaterThanOrEqual(7);
});
