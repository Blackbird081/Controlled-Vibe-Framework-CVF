import type { ExecutionRequest } from '@/lib/ai';
import type { SpecFirstLanguage, SpecFirstMediationReadout } from '@/lib/spec-first-mediation';

export const ENGLISH_SPEC_FREEZE_VERSION = 'cvf.englishSpecFreeze.vi5.t2.v1' as const;

export type EnglishSpecFreezeStatus = 'frozen' | 'blocked';

export interface EnglishSpecFreezeValidation {
  englishOnlyBody: boolean;
  requiredSectionsPresent: boolean;
  sourceEvidenceSeparated: boolean;
  missingSections: string[];
  blockedReasons: string[];
}

export interface EnglishSpecFreezeReadout {
  contractVersion: typeof ENGLISH_SPEC_FREEZE_VERSION;
  status: EnglishSpecFreezeStatus;
  frozenSpecLanguage: 'en';
  sourcePromptLanguage: SpecFirstLanguage;
  sourcePromptPreserved: boolean;
  frozenAt: string | null;
  frozenSpec: string;
  standardSections: readonly string[];
  validation: EnglishSpecFreezeValidation;
  sourceEvidenceRef: {
    originalPrompt: 'specFirstMediation.originalPrompt';
    structuredInputs: 'request.inputs';
    providerOutput: 'route.output' | null;
  };
  agentHandoffReady: boolean;
  userReviewRequired: boolean;
  boundaries: readonly string[];
}

const REQUIRED_SECTIONS = [
  'Purpose',
  'Task Classification',
  'Selected Workflow',
  'Execution Inputs',
  'Execution Constraints',
  'Expected Output',
  'Validation Requirements',
  'Source Evidence References',
  'Agent Handoff Instructions',
  'User Review Checkpoint',
] as const;

const VI_PATTERN = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]|\b(ứng dụng|ung dung|chiến lược|chien luoc|người dùng|nguoi dung|mục tiêu|muc tieu|yêu cầu|yeu cau|rủi ro|rui ro|khách hàng|khach hang|thị trường|thi truong|doanh thu|miền trung|mien trung)\b/i;

export function buildEnglishSpecFreezeReadout(input: {
  request: Partial<ExecutionRequest>;
  specFirstMediation: SpecFirstMediationReadout;
  providerOutput?: string | null;
}): EnglishSpecFreezeReadout {
  const frozenSpec = renderFrozenEnglishSpec(input);
  const validation = validateFrozenEnglishSpec(frozenSpec, input.specFirstMediation);
  const status: EnglishSpecFreezeStatus = validation.blockedReasons.length === 0 ? 'frozen' : 'blocked';

  return {
    contractVersion: ENGLISH_SPEC_FREEZE_VERSION,
    status,
    frozenSpecLanguage: 'en',
    sourcePromptLanguage: input.specFirstMediation.sourceLanguage,
    sourcePromptPreserved: input.specFirstMediation.originalPromptPreserved,
    frozenAt: status === 'frozen' ? new Date().toISOString() : null,
    frozenSpec,
    standardSections: REQUIRED_SECTIONS,
    validation,
    sourceEvidenceRef: {
      originalPrompt: 'specFirstMediation.originalPrompt',
      structuredInputs: 'request.inputs',
      providerOutput: input.providerOutput?.trim() ? 'route.output' : null,
    },
    agentHandoffReady: status === 'frozen',
    userReviewRequired: input.specFirstMediation.sourceLanguage !== 'en',
    boundaries: [
      'frozen_spec_body_is_english_only',
      'source_prompt_preserved_outside_frozen_body',
      'source_evidence_refs_may_require_human_or_agent_review',
      'no_provider_adapter_or_routing_change',
      'no_receipt_envelope_change',
      'no_tool_mcp_browser_database_or_spend_execution',
    ],
  };
}

export function validateFrozenEnglishSpec(
  frozenSpec: string,
  specFirstMediation: Pick<SpecFirstMediationReadout, 'originalPromptPreserved'>,
): EnglishSpecFreezeValidation {
  const missingSections = REQUIRED_SECTIONS.filter(section => !frozenSpec.includes(`## ${section}`));
  const englishOnlyBody = !VI_PATTERN.test(frozenSpec);
  const requiredSectionsPresent = missingSections.length === 0;
  const sourceEvidenceSeparated = frozenSpec.includes('specFirstMediation.originalPrompt')
    && frozenSpec.includes('request.inputs')
    && !frozenSpec.includes('Original prompt:');
  const blockedReasons = [
    ...(!englishOnlyBody ? ['frozen_spec_contains_non_english_body'] : []),
    ...(!requiredSectionsPresent ? ['required_sections_missing'] : []),
    ...(!sourceEvidenceSeparated ? ['source_evidence_not_separated'] : []),
    ...(!specFirstMediation.originalPromptPreserved ? ['source_prompt_not_preserved'] : []),
  ];

  return {
    englishOnlyBody,
    requiredSectionsPresent,
    sourceEvidenceSeparated,
    missingSections,
    blockedReasons,
  };
}

function renderFrozenEnglishSpec(input: {
  request: Partial<ExecutionRequest>;
  specFirstMediation: SpecFirstMediationReadout;
  providerOutput?: string | null;
}): string {
  const selected = input.specFirstMediation.selectedTemplate;
  const skill = input.specFirstMediation.relatedSkill;
  const requestFieldKeys = Object.keys(input.request.inputs ?? {}).sort();
  const providerOutputAvailable = Boolean(input.providerOutput?.trim());

  return [
    '# CVF Frozen English Execution Spec',
    '',
    `- Contract source: ${input.specFirstMediation.contractVersion}`,
    `- Freeze target language: en`,
    `- Source prompt language: ${input.specFirstMediation.sourceLanguage}`,
    `- User-facing response language: ${input.specFirstMediation.outputLanguage}`,
    `- Selected template id: ${selected.id ?? 'unselected'}`,
    '- Selected template label: preserved outside the frozen body when localized.',
    `- Related skill: ${skill ? `${skill.domain}/${skill.skillId}` : 'not mapped'}`,
    '',
    '## Purpose',
    'Provide an English-only agent handoff contract derived from the governed CVF Spec mediation readout.',
    '',
    '## Task Classification',
    `- Entry mode: ${input.specFirstMediation.entryMode}`,
    `- Spec gate status: ${input.specFirstMediation.specGateStatus}`,
    `- Implementation authorization: ${input.specFirstMediation.implementationAuthorization}`,
    '',
    '## Selected Workflow',
    `- Template id: ${selected.id ?? 'unselected'}`,
    `- Template category: ${selected.category ?? 'unclassified'}`,
    `- Related skill id: ${skill?.skillId ?? 'not mapped'}`,
    '',
    '## Execution Inputs',
    '- Use structured source evidence references for user-specific facts.',
    `- Structured input keys: ${requestFieldKeys.length ? requestFieldKeys.join(', ') : 'none declared'}`,
    '- Do not copy loose chat text into implementation instructions.',
    '- If a source value is not understandable to the implementing agent, ask for translation or clarification before implementation.',
    '',
    '## Execution Constraints',
    '- Stay inside the selected template, skill, risk, and phase boundaries.',
    '- Do not invent missing inputs.',
    '- Do not execute tools, MCP, browser, database, payment, or external side-effect actions unless a later governed workflow authorizes them.',
    '- Treat advisory model output as source material only.',
    '',
    '## Expected Output',
    '- Produce the deliverable requested by the selected template.',
    '- Include concise rationale, decision criteria, and next steps.',
    '- Keep the final user-facing explanation in the declared user-facing language unless the user requests otherwise.',
    '',
    '## Validation Requirements',
    '- Confirm every required input is covered or explicitly marked for clarification.',
    '- Confirm the output follows the selected template expectations.',
    '- Confirm governance evidence remains available.',
    '- Confirm no unsupported tool or spend action is performed.',
    '',
    '## Source Evidence References',
    '- Original source prompt: specFirstMediation.originalPrompt.',
    '- Structured source inputs: request.inputs.',
    `- Provider output reference: ${providerOutputAvailable ? 'route.output' : 'not available'}.`,
    '- Source evidence is preserved outside this frozen English body for audit and user review.',
    '',
    '## Agent Handoff Instructions',
    '- Implement from this frozen English Spec body and its referenced evidence.',
    '- Preserve source evidence references in receipts or review notes.',
    '- Ask for clarification if source evidence is ambiguous, untranslated, or insufficient.',
    '',
    '## User Review Checkpoint',
    '- The user should confirm the selected template, input references, constraints, and expected output before implementation.',
  ].join('\n');
}
