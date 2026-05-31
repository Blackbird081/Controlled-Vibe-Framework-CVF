import type { Template } from '@/types';
import type { AIProvider, GovernanceEvidenceReceipt } from '@/lib/ai/types';
import { evaluateSpecGate, type SpecGateStatus } from '@/lib/spec-gate';
import { getSkillForTemplate, type SkillRef } from '@/lib/skill-template-map';
import { getTemplateById } from '@/lib/templates';
import { recommendTemplates, type RecommendationResult } from '@/lib/template-recommender';

export const SPEC_FIRST_MEDIATION_VERSION = 'cvf.specFirstMediation.l1.v1' as const;

export type SpecFirstEntryMode =
  | 'template_first'
  | 'describe_goal'
  | 'ai_assisted_prompt_preparation'
  | 'user_paid_provider_advisory';

export type SpecFirstLanguage = 'vi' | 'en' | 'unknown';

export interface SpecFirstAdvisorySource {
  provider?: AIProvider | string;
  model?: string;
  userPaid?: boolean;
  draftSummary?: string;
  draftText?: string;
}

export interface SpecFirstRequestMetadata {
  entryMode?: SpecFirstEntryMode;
  sourceLanguage?: SpecFirstLanguage;
  outputLanguage?: SpecFirstLanguage;
  originalPrompt?: string;
  selectedTemplateId?: string;
  userConfirmed?: boolean;
  advisory?: SpecFirstAdvisorySource;
}

export interface SpecFirstExecutionRequestLike {
  templateId?: string;
  templateName?: string;
  inputs?: Record<string, string>;
  intent?: string;
  provider?: AIProvider;
  model?: string;
  cvfRiskLevel?: string;
  cvfPhase?: string;
  specFirst?: SpecFirstRequestMetadata;
}

export interface SpecFirstRouteOutcome {
  success?: boolean;
  provider?: AIProvider | string;
  model?: string;
  decision?: string;
  receipt?: Pick<GovernanceEvidenceReceipt, 'receiptId' | 'envelopeId'>;
  rawTechnicalEvidenceAvailable?: boolean;
}

export interface SpecFirstMediationReadout {
  contractVersion: typeof SPEC_FIRST_MEDIATION_VERSION;
  entryMode: SpecFirstEntryMode;
  sourceLanguage: SpecFirstLanguage;
  workingLanguage: 'en' | SpecFirstLanguage;
  outputLanguage: SpecFirstLanguage;
  originalPromptPreserved: boolean;
  normalizedExecutionSpec: string;
  standardSections: readonly string[];
  translationAmbiguity: string | null;
  clarificationRequired: boolean;
  specGateStatus: SpecGateStatus;
  selectedTemplate: {
    id: string | null;
    name: string;
    category: string | null;
  };
  recommendedTemplates: ReadonlyArray<{
    templateId: string;
    name: string;
    score: number;
    reason: string;
  }>;
  relatedSkill: SkillRef | null;
  localizedEvidenceSummary: string;
  rawTechnicalEvidenceAvailable: boolean;
  advisoryProvider: string | null;
  advisoryModel: string | null;
  userPaidAdvisoryUsed: boolean;
  advisoryOutputIsSourceOnly: true;
  implementationAuthorization: 'spec_generation_only' | 'route_governance_required';
  boundaries: readonly string[];
}

const STANDARD_SPEC_SECTIONS = [
  'Context',
  'User Input',
  'Input Coverage',
  'Task / Intent',
  'Expected Output Format',
  'Output Template',
  'Execution Constraints',
  'Validation Hooks',
  'Non-Coder Success Standard',
  'Governed Response Rules',
  'Knowledge Context Preference',
  'Risk / Approval Posture',
  'Advisory Source Notes',
  'Agent Handoff Instructions',
  'Final User Review Checkpoint',
] as const;

const VI_MARKERS = [
  'ứng dụng',
  'kinh doanh',
  'chiến lược',
  'người dùng',
  'mục tiêu',
  'yêu cầu',
  'rủi ro',
  'tiếng việt',
  'khách hàng',
  'ung dung',
  'kinh doanh',
  'chien luoc',
  'nguoi dung',
  'muc tieu',
  'yeu cau',
  'rui ro',
  'tieng viet',
  'khach hang',
];

export function buildSpecFirstMediationReadout(input: {
  request: SpecFirstExecutionRequestLike;
  template?: Template;
  routeOutcome?: SpecFirstRouteOutcome;
}): SpecFirstMediationReadout {
  const request = input.request;
  const values = normalizeValues(request.inputs ?? {});
  const originalPrompt = safeText(request.specFirst?.originalPrompt)
    || safeText(request.intent)
    || Object.values(values).join(' ').trim();
  const sourceLanguage = request.specFirst?.sourceLanguage ?? detectSpecLanguage(originalPrompt);
  const outputLanguage = request.specFirst?.outputLanguage ?? (sourceLanguage === 'unknown' ? 'en' : sourceLanguage);
  const workingLanguage = sourceLanguage === 'vi' ? 'en' : sourceLanguage;
  const entryMode = resolveEntryMode(request);
  const selectedTemplate = input.template
    ?? getTemplateById(safeText(request.specFirst?.selectedTemplateId))
    ?? getTemplateById(safeText(request.templateId));
  const recommendations = buildRecommendations({
    request,
    sourceLanguage,
    selectedTemplate,
  });
  const templateForGate = selectedTemplate;
  const gateResult = templateForGate
    ? evaluateSpecGate(
      templateForGate.fields.map(field => ({ id: field.id, label: field.label, required: field.required })),
      values,
    )
    : { status: 'CLARIFY' as SpecGateStatus, missing: [], requiredCount: 0, providedCount: Object.values(values).filter(Boolean).length };
  const translationAmbiguity = resolveTranslationAmbiguity({
    originalPrompt,
    sourceLanguage,
    gateStatus: gateResult.status,
  });
  const advisory = request.specFirst?.advisory;
  const relatedSkill = selectedTemplate ? getSkillForTemplate(selectedTemplate.id) : null;
  const normalizedExecutionSpec = renderExecutionSpec({
    request,
    values,
    originalPrompt,
    sourceLanguage,
    workingLanguage,
    outputLanguage,
    entryMode,
    template: selectedTemplate,
    recommendations,
    gateStatus: gateResult.status,
    missingLabels: gateResult.missing.map(field => field.label),
    relatedSkill,
    advisory,
  });
  const rawTechnicalEvidenceAvailable = input.routeOutcome?.rawTechnicalEvidenceAvailable
    ?? Boolean(input.routeOutcome?.receipt?.receiptId);

  return {
    contractVersion: SPEC_FIRST_MEDIATION_VERSION,
    entryMode,
    sourceLanguage,
    workingLanguage,
    outputLanguage,
    originalPromptPreserved: originalPrompt.length > 0,
    normalizedExecutionSpec,
    standardSections: STANDARD_SPEC_SECTIONS,
    translationAmbiguity,
    clarificationRequired: Boolean(translationAmbiguity) || gateResult.status !== 'PASS',
    specGateStatus: gateResult.status,
    selectedTemplate: selectedTemplate
      ? { id: selectedTemplate.id, name: selectedTemplate.name, category: selectedTemplate.category }
      : { id: null, name: request.templateName || 'Unselected template', category: null },
    recommendedTemplates: recommendations.map(({ template, score, reason }) => ({
      templateId: template.id,
      name: template.name,
      score,
      reason,
    })),
    relatedSkill,
    localizedEvidenceSummary: buildLocalizedEvidenceSummary({
      language: outputLanguage,
      routeOutcome: input.routeOutcome,
      entryMode,
      templateName: selectedTemplate?.name ?? request.templateName ?? 'selected template',
    }),
    rawTechnicalEvidenceAvailable,
    advisoryProvider: safeText(advisory?.provider) || null,
    advisoryModel: safeText(advisory?.model) || null,
    userPaidAdvisoryUsed: Boolean(advisory?.userPaid),
    advisoryOutputIsSourceOnly: true,
    implementationAuthorization: 'route_governance_required',
    boundaries: [
      'spec_is_agent_handoff_contract',
      'loose_chat_is_source_material_only',
      'advisory_llm_output_is_not_implementation_authority',
      'no_external_skill_import',
      'no_tool_mcp_browser_database_or_spend_execution',
      'raw_technical_evidence_remains_available',
    ],
  };
}

export function detectSpecLanguage(text: string): SpecFirstLanguage {
  const normalized = safeText(text).toLowerCase();
  if (!normalized) return 'unknown';
  if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(normalized)) {
    return 'vi';
  }
  if (VI_MARKERS.some(marker => normalized.includes(marker))) {
    return 'vi';
  }
  if (/[a-z]/i.test(normalized)) return 'en';
  return 'unknown';
}

function resolveEntryMode(request: SpecFirstExecutionRequestLike): SpecFirstEntryMode {
  if (request.specFirst?.entryMode) return request.specFirst.entryMode;
  if (request.specFirst?.advisory) return 'user_paid_provider_advisory';
  if (request.templateId || request.templateName) return 'template_first';
  return 'describe_goal';
}

function buildRecommendations(input: {
  request: SpecFirstExecutionRequestLike;
  sourceLanguage: SpecFirstLanguage;
  selectedTemplate?: Template;
}): RecommendationResult[] {
  const query = safeText(input.request.intent)
    || safeText(input.request.specFirst?.originalPrompt)
    || Object.values(input.request.inputs ?? {}).join(' ');
  const lang = input.sourceLanguage === 'vi' ? 'vi' : 'en';
  const recommended = recommendTemplates(query, { maxResults: 5, lang });

  if (!input.selectedTemplate) return recommended;
  if (recommended.some(result => result.template.id === input.selectedTemplate?.id)) {
    return recommended;
  }

  return [
    {
      template: input.selectedTemplate,
      score: 100,
      reason: lang === 'vi' ? 'Mẫu đã được chọn trực tiếp' : 'Directly selected template',
    },
    ...recommended,
  ].slice(0, 5);
}

function renderExecutionSpec(input: {
  request: SpecFirstExecutionRequestLike;
  values: Record<string, string>;
  originalPrompt: string;
  sourceLanguage: SpecFirstLanguage;
  workingLanguage: SpecFirstMediationReadout['workingLanguage'];
  outputLanguage: SpecFirstLanguage;
  entryMode: SpecFirstEntryMode;
  template?: Template;
  recommendations: RecommendationResult[];
  gateStatus: SpecGateStatus;
  missingLabels: string[];
  relatedSkill: SkillRef | null;
  advisory?: SpecFirstAdvisorySource;
}): string {
  const expectedOutput = input.template?.outputExpected?.length
    ? input.template.outputExpected.map(item => `- ${item}`).join('\n')
    : '- Clear recommendation\n- Actionable next steps\n- Success criteria check';
  const outputTemplate = input.template?.outputTemplate
    ? fenced(input.template.outputTemplate)
    : '(Use the expected output format unless the user confirms a different frame.)';
  const providedInput = Object.entries(input.values)
    .filter(([, value]) => value.trim())
    .map(([key, value]) => `- ${formatLabel(key)}: ${value}`)
    .join('\n') || '- No structured fields were provided.';
  const recommendationLines = input.recommendations.length
    ? input.recommendations.map((result, index) => `${index + 1}. ${result.template.name} (${result.template.id}) - ${result.reason}`).join('\n')
    : 'No confident recommendation yet; ask the user to choose a template or provide more detail.';
  const advisorySummary = input.advisory
    ? [
      `- Provider: ${safeText(input.advisory.provider) || 'not declared'}`,
      `- Model: ${safeText(input.advisory.model) || 'not declared'}`,
      `- User-paid advisory used: ${input.advisory.userPaid ? 'yes' : 'no'}`,
      `- Advisory summary: ${safeText(input.advisory.draftSummary) || 'not provided'}`,
      '- Advisory output is source material only. CVF normalization controls the final Spec.',
    ].join('\n')
    : '- No advisory provider/model source declared.';
  const missing = input.missingLabels.length ? input.missingLabels.join(', ') : 'None';
  const task = safeText(input.request.intent) || input.originalPrompt || 'Clarify the user goal before execution.';

  return [
    '# CVF Execution Spec',
    '',
    `- Entry mode: ${input.entryMode}`,
    `- Source language: ${input.sourceLanguage}`,
    `- Working language: ${input.workingLanguage}`,
    `- Output language: ${input.outputLanguage}`,
    `- Template: ${input.template?.name ?? input.request.templateName ?? 'unselected'}`,
    `- Related skill: ${input.relatedSkill ? `${input.relatedSkill.domain}/${input.relatedSkill.skillId}` : 'not mapped'}`,
    `- Spec gate: ${input.gateStatus}`,
    '',
    '## Context',
    input.template?.description || 'The user is preparing a governed CVF task for an agent.',
    '',
    '## User Input',
    `Original prompt: ${input.originalPrompt || '(not provided)'}`,
    '',
    providedInput,
    '',
    '## Input Coverage',
    `Spec gate status: ${input.gateStatus}`,
    `Missing required fields: ${missing}`,
    '',
    '## Task / Intent',
    task,
    '',
    '## Expected Output Format',
    expectedOutput,
    '',
    '## Output Template',
    outputTemplate,
    '',
    '## Execution Constraints',
    '- Do not invent missing required inputs.',
    '- Ask for clarification when the Spec gate is CLARIFY or FAIL.',
    '- Keep implementation inside the selected template, skill, risk, and phase boundaries.',
    '- Do not execute tools, MCP, browser, database, payment, or external side-effect actions unless a later governed workflow authorizes them.',
    '',
    '## Validation Hooks',
    '- Confirm all required fields are covered.',
    '- Confirm the output follows every expected section.',
    '- Include a success criteria check.',
    '- Return a receipt/evidence summary when the execution surface supports it.',
    '',
    '## Non-Coder Success Standard',
    '- The result must be understandable and actionable for a non-coder.',
    '- Use the requested output language for user-facing guidance.',
    '- Keep raw technical evidence available for agents and auditors.',
    '',
    '## Governed Response Rules',
    '- If allowed, answer directly within scope.',
    '- If blocked or approval-gated, explain the reason in plain language and give the safest next step.',
    '- Do not hide risk, review, approval, or evidence implications.',
    '',
    '## Knowledge Context Preference',
    '- Prefer user-provided project facts over generic assumptions.',
    '- If critical context is missing, ask for it rather than guessing.',
    '',
    '## Risk / Approval Posture',
    `- Declared phase: ${safeText(input.request.cvfPhase) || 'not declared'}`,
    `- Declared risk: ${safeText(input.request.cvfRiskLevel) || 'not declared'}`,
    '- Implementation requires the governed execution route or explicit user approval; this Spec alone is not a tool-execution authorization.',
    '',
    '## Advisory Source Notes',
    advisorySummary,
    '',
    '## Template / Skill Recommendation',
    recommendationLines,
    '',
    '## Agent Handoff Instructions',
    '- Implement from this Spec, not from loose chat text.',
    '- Preserve the original user intent and language metadata.',
    '- Return user-facing output in the declared output language.',
    '',
    '## Final User Review Checkpoint',
    '- Before implementation, the user should confirm the selected template, expected output, constraints, and any missing fields.',
  ].join('\n');
}

function buildLocalizedEvidenceSummary(input: {
  language: SpecFirstLanguage;
  routeOutcome?: SpecFirstRouteOutcome;
  entryMode: SpecFirstEntryMode;
  templateName: string;
}): string {
  const receiptId = input.routeOutcome?.receipt?.receiptId;
  const provider = input.routeOutcome?.provider;
  const model = input.routeOutcome?.model;
  const decision = input.routeOutcome?.decision;
  const success = input.routeOutcome?.success;

  if (input.language === 'vi') {
    return [
      `CVF đã chuẩn hóa yêu cầu qua chế độ ${input.entryMode} cho mẫu ${input.templateName}.`,
      success === undefined ? 'Đây là bản Spec/readout trước hoặc trong quá trình thực thi.' : `Kết quả thực thi: ${success ? 'thành công' : 'chưa thành công'}.`,
      receiptId ? `Receipt: ${receiptId}.` : 'Receipt kỹ thuật sẽ có khi route thực thi trả bằng chứng.',
      provider ? `Provider/model: ${provider}/${model ?? 'không khai báo'}.` : 'Provider/model chưa khai báo.',
      decision ? `Quyết định governance: ${decision}.` : 'Quyết định governance chưa có trong readout này.',
      'Bằng chứng kỹ thuật thô vẫn có thể mở rộng cho agent/auditor.',
    ].join(' ');
  }

  return [
    `CVF normalized the request through ${input.entryMode} for ${input.templateName}.`,
    success === undefined ? 'This is a Spec/readout before or during execution.' : `Execution result: ${success ? 'success' : 'not successful'}.`,
    receiptId ? `Receipt: ${receiptId}.` : 'A technical receipt is available after the execution route returns evidence.',
    provider ? `Provider/model: ${provider}/${model ?? 'not declared'}.` : 'Provider/model not declared.',
    decision ? `Governance decision: ${decision}.` : 'Governance decision is not present in this readout.',
    'Raw technical evidence remains available for agents and auditors.',
  ].join(' ');
}

function resolveTranslationAmbiguity(input: {
  originalPrompt: string;
  sourceLanguage: SpecFirstLanguage;
  gateStatus: SpecGateStatus;
}): string | null {
  if (!safeText(input.originalPrompt)) {
    return 'missing_original_prompt';
  }
  if (input.sourceLanguage === 'unknown') {
    return 'source_language_unknown';
  }
  if (input.gateStatus !== 'PASS') {
    return 'required_spec_fields_missing';
  }
  return null;
}

function normalizeValues(values: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, String(value ?? '').trim()]),
  );
}

function formatLabel(key: string): string {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

function fenced(value: string): string {
  return ['```markdown', value, '```'].join('\n');
}

function safeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
