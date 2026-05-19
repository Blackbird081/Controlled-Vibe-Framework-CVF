import type { ExecutionRequest } from '@/lib/ai';
import { CVF_WEB_REDESIGN_DNA_APPENDIX, shouldAttachCvfWebRedesignDna } from '@/lib/cvf-web-redesign-dna';
import { resolveGovernanceFamily, type GovernanceFamily } from '@/lib/governance-family';
import { getTemplateById } from '@/lib/templates';
import { renderTemplateIntent } from '@/lib/template-intent';

const TRUSTED_NONCODER_DEPTH_TEMPLATE_IDS = new Set([
  'documentation',
  'faq_outline',
  'acceptance_criteria',
  'competitor_review',
  'risk_assessment',
  'user_persona',
  'feature_prioritization',
  'pricing_strategy',
  'strategy_analysis',
  'operator_plan',
  'decision_memo',
]);

type DeliverableShape = 'faq' | 'acceptance_criteria' | 'checklist' | 'plan' | 'decision_comparison' | 'prioritization' | 'pricing' | 'persona';

const SHAPE_SPECIFIC_TEMPLATE_IDS = new Set([
  'faq_outline',
  'operator_plan',
]);

function collectRequestText(request: ExecutionRequest): string {
  const inputText = Object.entries(request.inputs)
    .filter(([key]) => !key.startsWith('_'))
    .map(([, value]) => value)
    .filter(Boolean)
    .join('\n');

  return [
    request.templateId,
    request.templateName,
    request.intent,
    inputText,
  ].join('\n').toLowerCase();
}

function resolveResponseLanguage(request: ExecutionRequest): 'English' | 'Vietnamese' {
  const text = collectRequestText(request);
  const vietnameseMarks = (text.match(/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/gi) || []).length;
  const vietnameseWords = (text.match(/\b(tôi|muốn|cần|cho|với|người|ứng dụng|tính năng|khách|hàng|quy trình|bàn giao|kiểm tra)\b/gi) || []).length;
  const englishWords = (text.match(/\b(the|for|with|operator|support|product|app|feature|pricing|decision|compare|create|checklist|onboarding|customer|workflow|acceptance|criteria)\b/gi) || []).length;

  return vietnameseMarks + vietnameseWords > englishWords ? 'Vietnamese' : 'English';
}

function resolveDeliverableShapes(request: ExecutionRequest): DeliverableShape[] {
  const text = collectRequestText(request);
  const shapes: DeliverableShape[] = [];

  if (/\b(faq|frequently asked|question(?:s)? and answer(?:s)?|q&a)\b/i.test(text)) {
    shapes.push('faq');
  }

  if (/\b(acceptance criteria|given when then|testable criteria)\b/i.test(text)) {
    shapes.push('acceptance_criteria');
  }

  if (/\b(checklist|onboarding|standard operating procedure|sop|handoff|runbook|playbook)\b/i.test(text)) {
    shapes.push('checklist');
  }

  if (/\b(\d+[- ]?day|weekly|monthly|roadmap|plan|launch|retention|operations?)\b/i.test(text)) {
    shapes.push('plan');
  }

  if (/\b(compare|comparison|option|options|versus|vs\.?|channel choice|choose|decision|freemium|paid-only)\b/i.test(text)) {
    shapes.push('decision_comparison');
  }

  if (/\b(prioriti[sz]e|prioritization|priority|backlog|mvp scope|triage|rice|ice|moscow|kano)\b/i.test(text)) {
    shapes.push('prioritization');
  }

  if (/\b(pricing|price|prices|priced|tier|tiers|freemium|paid-only|subscription|pilot pricing|willingness-to-pay|current price|pricing model)\b/i.test(text)
    || /(chiến lược giá|định giá|mức giá|gói giá|thuê bao)/i.test(text)) {
    shapes.push('pricing');
  }

  if (/\b(persona|personas|buyer|end-user|user journey|segment)\b/i.test(text)) {
    shapes.push('persona');
  }

  return shapes;
}

function buildTaskShapeGuidance(shapes: DeliverableShape[]): string[] {
  const guidance: string[] = [];

  if (shapes.includes('faq')) {
    guidance.push('FAQ shape: produce 8-12 concrete questions with direct answers; group by user concern; include at least one payment/access/troubleshooting item when relevant; end with acceptance checks for whether the FAQ is ready to publish.');
  }

  if (shapes.includes('acceptance_criteria')) {
    guidance.push('Acceptance-criteria shape: group criteria by feature or workflow; make each criterion observable and testable; include data source, refresh/state expectations, error/empty states, and pass/fail checks instead of generic quality advice.');
  }

  if (shapes.includes('checklist')) {
    guidance.push('Checklist/documentation shape: produce a procedural runbook with required inputs/artifacts, step-by-step actions, decision branches, QA checks, failure recovery, escalation rules, and final handoff acceptance checks; keep the overview and assumptions short, avoid long background prose, and spend most of the answer on executable tables/checks.');
  }

  if (shapes.includes('plan')) {
    guidance.push('Plan shape: provide first 24-72 hour start procedure, phased timeline, recurring operating cadence, QA checkpoints, owner/role, concrete artifact, success metric, and acceptance check for each phase.');
  }

  if (shapes.includes('decision_comparison')) {
    guidance.push('Decision/comparison shape: give a clear recommendation with the first 24-72 hour activation step, compare every named or reasonably inferred option using the same criteria, and include decision rule, switch/rollback trigger, risks, assumptions, and acceptance checks.');
  }

  if (shapes.includes('prioritization')) {
    guidance.push('Prioritization shape: lead with the scope decision before scoring evidence; include Do now / MVP, Do next, Defer, first validation or build step, owner/role, and acceptance check; use scoring only to support the decision.');
  }

  if (shapes.includes('pricing')) {
    guidance.push('Pricing shape: recommend concrete tiers or pricing options with target user, included features or limits, price anchors or relative bands, first pricing experiment, risk checks, and labeled assumptions; do not invent unsupported exact prices.');
  }

  if (shapes.includes('persona')) {
    guidance.push('Persona shape: every persona must include trigger, objection, decision criteria, success signal, product action, marketing/support action, onboarding or activation action, first experiment, and acceptance check.');
  }

  return guidance;
}

function resolvePrimaryDeliverableShape(shapes: DeliverableShape[]): DeliverableShape | undefined {
  if (shapes.includes('faq')) return 'faq';
  if (shapes.includes('acceptance_criteria')) return 'acceptance_criteria';
  if (shapes.includes('pricing')) return 'pricing';
  if (shapes.includes('prioritization')) return 'prioritization';
  if (shapes.includes('persona')) return 'persona';
  if (shapes.includes('decision_comparison')) return 'decision_comparison';
  if (shapes.includes('plan')) return 'plan';
  if (shapes.includes('checklist')) return 'checklist';
  return undefined;
}

function buildDeliverableContract(shape: DeliverableShape | undefined): string | undefined {
  switch (shape) {
    case 'faq':
      return `# FAQ Outline

## 1. Audience And Scope
- Who this FAQ is for:
- What workflow or product area it covers:

## 2. FAQ Entries
| Question | Direct Answer | When It Applies | Owner/Source To Confirm |
| --- | --- | --- | --- |
| 1. | | | |
| 2. | | | |

## 3. Must-Include Edge Cases
- Payment/access/troubleshooting questions:
- Policy or wording that must stay unchanged:

## 4. Publish Readiness Checks
- [ ] Answers are direct and understandable by the target audience
- [ ] Missing facts are marked as assumptions or confirmation items
- [ ] Support/operator escalation path is clear`;
    case 'acceptance_criteria':
      return `# Acceptance Criteria Packet

## 1. Scope Under Test
- Feature/workflow:
- User or operator outcome:

## 2. Criteria By Workflow
| Workflow Area | Given | When | Then | Data/State Requirement | Pass/Fail Check |
| --- | --- | --- | --- | --- | --- |
| 1. | | | | | |
| 2. | | | | | |

## 3. Empty, Error, And Edge States
- Empty state:
- Error state:
- Permission/access state:
- Refresh or data-latency state:

## 4. Handoff Checks
- [ ] Each criterion is observable
- [ ] Each criterion can be verified by a non-technical operator or tester
- [ ] Open assumptions are listed`;
    case 'checklist':
      return `# Operator Checklist And Handoff Runbook

## 1. Procedure Summary
- Purpose, in one sentence:
- Who uses this:
- Done state:
- Key assumptions, max 3 bullets:

## 2. Required Inputs, Artifacts, And Fields
| Required Item | Source/Owner | Where It Lives | Needed Before Step | Acceptance Check |
| --- | --- | --- | --- | --- |
| 1. | | | | |
| 2. | | | | |

## 3. Step-By-Step Procedure
| Step | Owner/Role | Trigger | Action | Required Artifact Or Field | Done Signal | Acceptance Check |
| --- | --- | --- | --- | --- | --- | --- |
| 1. | | | | | | |
| 2. | | | | | | |

## 4. Decision Branches
| Situation | Decision Rule | Next Action | Owner/Role | Escalate When |
| --- | --- | --- | --- | --- |
| 1. | | | | |
| 2. | | | | |

## 5. QA Checks
- Pre-handoff QA:
- Data/content QA:
- User-facing QA:
- Audit/evidence to retain:

## 6. Common Failure Modes And Recovery
| Situation | How To Notice It | What To Do | When To Escalate |
| --- | --- | --- | --- |
| 1. | | | |
| 2. | | | |

## 7. First-Day Or First-Run Actions
- Step 1:
- Step 2:
- Step 3:

## 8. Final Handoff Acceptance Checklist
- [ ] Every required action has a visible done signal
- [ ] Required artifacts or fields are complete
- [ ] QA checks have pass/fail evidence
- [ ] Open assumptions are marked for confirmation
- [ ] The operator knows what to do next and when to escalate`;
    case 'prioritization':
      return `# MVP Scope And Prioritization Decision

## 1. Recommended Scope First
- Do now / MVP:
- Do next:
- Defer:
- Explicit non-goals:
- First validation or build step:
- Owner/role:
- Acceptance check:

## 2. Why This Scope
- Product/operator goal:
- Constraints:
- Main tradeoff:
- Assumptions to confirm:

## 3. Supporting Scoring Matrix
| Item | User/Business Value | Effort | Risk | Confidence | Score/Rank | Rationale |
| --- | --- | --- | --- | --- | --- | --- |
| 1. | | | | | | |
| 2. | | | | | | |

## 4. Implementation Or Validation Steps
| Step | Owner/Role | Action | Artifact | Success Metric | Acceptance Check |
| --- | --- | --- | --- | --- | --- |
| 1. | | | | | |
| 2. | | | | | |

## 5. Risk And Deferral Checks
- [ ] Owner can explain why each top item was chosen
- [ ] Deferred items have a reason and revisit trigger
- [ ] First implementation or validation step is clear
- [ ] Acceptance check is observable by a non-technical operator`;
    case 'pricing':
      return `# Pricing Recommendation

## 1. Recommendation Summary
- Recommended pricing model:
- Starting tiers or options:
- Target user for the first test:
- First pricing experiment:
- Assumptions to validate:

## 2. Pricing Tiers Or Options
| Tier/Option | Target User | Included Features Or Limits | Price Anchor Or Relative Band | Why It Fits | Risk |
| --- | --- | --- | --- | --- | --- |
| 1. | | | | | |
| 2. | | | | | |

## 3. Assumptions And Guardrails
- Supplied facts used:
- Labeled assumptions:
- Exact prices not supported by the input:
- Guardrails for discounting or exceptions:

## 4. First Experiment
| Step | Owner/Role | Action | Artifact | Success Metric | Acceptance Check |
| --- | --- | --- | --- | --- | --- |
| 1. | | | | | |
| 2. | | | | | |

## 5. Risk And Validation Checks
- [ ] Each tier or option has a clear target user
- [ ] Included limits or features are explicit
- [ ] Price anchors are labeled as supplied, relative, or assumed
- [ ] First experiment can be run without another strategy pass
- [ ] Risks and rollback or adjustment signals are visible`;
    case 'persona':
      return `# Persona-To-Action Packet

## 1. Segments And Assumptions
- Source data used:
- Assumptions:
- Segment boundaries:

## 2. Persona Profiles And Decision Signals
| Persona | Context | Job To Be Done | Trigger | Objection | Decision Criteria | Success Signal |
| --- | --- | --- | --- | --- | --- | --- |
| 1. | | | | | | |
| 2. | | | | | | |

## 3. Persona-Linked Actions
| Persona | Product Action | Marketing/Support Action | Onboarding Or Activation Action | Owner/Role | Acceptance Check |
| --- | --- | --- | --- | --- | --- |
| 1. | | | | | |
| 2. | | | | | |

## 4. First Experiments
| Persona | Experiment | Hypothesis | Success Metric | Timebox | Decision Rule |
| --- | --- | --- | --- | --- | --- |
| 1. | | | | | |
| 2. | | | | | |

## 5. Persona Usability Checks
- [ ] Every persona has a trigger, objection, decision criteria, and success signal
- [ ] Every persona maps to at least one product action and one marketing/support action
- [ ] Every persona has a first experiment and measurable acceptance check
- [ ] Unsupported demographic or behavioral claims are labeled as assumptions`;
    case 'decision_comparison':
      return `# Decision Activation Memo

## 1. Recommendation And First Activation Step
- Decision:
- Recommended option:
- Why it wins:
- First 24-72 hour activation step:
- Owner/role:
- Acceptance check for the first step:

## 2. Option-By-Option Comparison
| Option | Best Fit Scenario | Pros | Cons | Cost/Effort | Risks | Activation Step | Evidence/Assumption |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Option A | | | | | | | |
| Option B | | | | | | | |

## 3. Decision Rule, Switch Trigger, And Rollback
- Decision rule:
- Switch trigger:
- Rollback or pause trigger:
- When to revisit:

## 4. Risks And Assumption Checks
| Risk/Assumption | How To Validate | Owner/Role | Deadline/Timebox | Mitigation |
| --- | --- | --- | --- | --- |
| 1. | | | | |
| 2. | | | | |

## 5. Activation Acceptance Checks
- [ ] Every named option was compared
- [ ] Operator knows the first 24-72 hour activation step
- [ ] Switch or rollback trigger is explicit
- [ ] Risks and assumptions have validation checks`;
    case 'plan':
      return `# Operator Action Plan

## 1. Goal, Constraints, Done State, And Assumptions
- Goal:
- Constraints:
- Done state:
- Assumptions:

## 2. First 24-72 Hour Start Procedure
| Step | Owner/Role | Action | Concrete Artifact | Done Signal | Acceptance Check |
| --- | --- | --- | --- | --- | --- |
| 1. | | | | | |
| 2. | | | | | |

## 3. Timeline And Owners
| Phase/Date | Owner/Role | Action | Concrete Artifact | Success Metric | Acceptance Check |
| --- | --- | --- | --- | --- | --- |
| 1. | | | | | |
| 2. | | | | | |

## 4. Operating Cadence And Decision Branches
| Cadence/Situation | Owner/Role | What To Check | Decision Rule | Next Action |
| --- | --- | --- | --- | --- |
| Daily/weekly | | | | |
| Exception | | | | |

## 5. QA Checks And Review Checkpoints
- Pre-launch QA:
- Operational QA:
- Customer/user-facing QA:
- Review checkpoints:

## 6. Risks, Dependencies, Failure Modes, And Escalation
- Key risks:
- Dependencies:
- Failure mode:
- Escalation rule:

## 7. Final Handoff Checklist
- [ ] Owner is clear for every action
- [ ] Required artifacts are named
- [ ] Metrics are measurable
- [ ] Acceptance checks are specific enough to verify
- [ ] First 24-72 hours can be executed without extra strategy work`;
    default:
      return undefined;
  }
}

function buildFamilyOutputContract(family: GovernanceFamily | null): string | undefined {
  switch (family) {
    case 'builder_handoff_technical_planning':
      return [
        'Governance family: builder_handoff_technical_planning',
        '- Files/modules likely to touch: name concrete paths when known; use "unknown - requires repo inspection" when the repository has not been inspected.',
        '- Tests to add or run: include the most relevant unit, integration, or manual checks.',
        '- Rollback step: state how to revert or disable the change.',
        '- Verification step: state the observable proof that the handoff is complete.',
        '- Security/data consideration: identify auth, privacy, credential, data, or permission concerns.',
        '- Keep implementation details bounded to the supplied request and clearly label assumptions.',
      ].join('\n');
    case 'cost_quota_provider_selection':
      return [
        'Governance family: cost_quota_provider_selection',
        '- Provide decision criteria, tradeoff categories, and a verification plan.',
        '- Compare cost, quota, latency, provider/model fit, operational risk, and fallback path when relevant.',
        '- do not invent or assert a specific provider name, model name, latency number, quota, or price unless supplied.',
      ].join('\n');
    case 'normal_productivity_app_planning':
      return [
        'Governance family: normal_productivity_app_planning',
        '- preserve the user input language unless the user asks otherwise.',
        '- Cover purpose, audience/users, scope, workflow, minimum useful features or steps, success measures, risks/constraints, and next actions.',
        '- Keep the packet usable by a non-technical operator or builder handoff recipient.',
      ].join('\n');
    default:
      return undefined;
  }
}

export function buildExecutionPrompt(request: ExecutionRequest): string {
  const { templateName, inputs, intent } = request;
  const previousOutput = inputs._previousOutput;
  const template = request.templateId ? getTemplateById(request.templateId) : undefined;
  const isTrustedNoncoderTemplate = Boolean(template?.id && TRUSTED_NONCODER_DEPTH_TEMPLATE_IDS.has(template.id));
  const deliverableShapes = isTrustedNoncoderTemplate ? resolveDeliverableShapes(request) : [];
  const usesShapeSpecificTemplate = Boolean(template?.id && SHAPE_SPECIFIC_TEMPLATE_IDS.has(template.id));
  const primaryDeliverableShape = usesShapeSpecificTemplate ? undefined : resolvePrimaryDeliverableShape(deliverableShapes);
  const primaryDeliverableContract = buildDeliverableContract(primaryDeliverableShape);
  const taskShapeGuidance = buildTaskShapeGuidance(deliverableShapes);
  const responseLanguage = resolveResponseLanguage(request);
  const familyContract = buildFamilyOutputContract(resolveGovernanceFamily({
    qbsFamily: request.qbsFamily,
    governanceFamily: request.governanceFamily,
    intent: request.intent,
    templateId: request.templateId,
    templateCategory: template?.category,
    riskLevel: request.cvfRiskLevel,
  }));

  let prompt = `## Task: ${templateName}\n\n`;
  prompt += `### Response Language\nUse ${responseLanguage} for the final answer. Do not translate the deliverable into another language unless the user explicitly asks.\n\n`;
  prompt += `### User Intent\n${intent}\n\n`;
  prompt += `### Input Data\n`;

  for (const [key, value] of Object.entries(inputs)) {
    if (key.startsWith('_')) continue;
    if (value && value.trim()) {
      const label = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .replace(/^\s/, '')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

      prompt += `\n**${label}:**\n${value}\n`;
    }
  }

  prompt += `\n---\n\n`;

  if (request.cvfPhase || request.cvfRiskLevel) {
    prompt += `### Governance Context\n`;
    if (request.cvfPhase) prompt += `- Phase target: ${request.cvfPhase}\n`;
    if (request.cvfRiskLevel) prompt += `- Risk level: ${request.cvfRiskLevel}\n`;
    prompt += `\n`;
  }

  if (request.skillPreflightDeclaration || request.skillIds?.length) {
    prompt += `### Skill Context\n`;
    if (request.skillPreflightDeclaration) {
      prompt += `- Skill preflight: ${request.skillPreflightDeclaration}\n`;
    }
    if (request.skillIds?.length) {
      prompt += `- Declared skills: ${request.skillIds.join(', ')}\n`;
    }
    prompt += `\n`;
  }

  if (shouldAttachCvfWebRedesignDna({
    templateId: request.templateId,
    templateName: request.templateName,
    skillIds: request.skillIds,
  })) {
    prompt += `### Bound UX Skill Context\n`;
    prompt += `${CVF_WEB_REDESIGN_DNA_APPENDIX}\n\n`;
  }

  if (template?.outputTemplate || template?.outputExpected?.length) {
    prompt += `### Template Output Contract\n`;
    prompt += `Follow this template contract for structure, but treat it as a minimum outline, not a compression target.\n`;
    prompt += `Do not return the raw skeleton or a fenced code block. Fill the headings with the supplied user input values, names, constraints, and concrete decisions.\n`;
    prompt += `Expand each major heading with task-specific depth: assumptions, rationale, concrete next actions, and acceptance checks when the user asks for an actionable non-coder output.\n`;
    prompt += `If a required detail does not fit a heading cleanly, add a concise subheading under the closest matching section instead of omitting it.\n`;
    if (isTrustedNoncoderTemplate) {
      prompt += `For this trusted non-coder template, produce an operator-ready deliverable rather than a compact summary. Unless the user explicitly asks for brevity, aim for 700-1100 output tokens and make every major option, persona, feature, risk, pricing tier, or step concrete enough to act on.\n`;
      prompt += `For comparison tasks, compare each named or reasonably inferred option before giving a recommendation.\n`;
    }
    if (primaryDeliverableContract) {
      prompt += `Use this shape-specific deliverable contract as the primary output contract. It replaces generic template headings when they conflict with the user's requested deliverable:\n`;
      prompt += `\`\`\`markdown\n${primaryDeliverableContract}\n\`\`\`\n\n`;
    } else if (template.outputExpected?.length) {
      prompt += `Expected sections:\n`;
      for (const section of template.outputExpected) {
        prompt += `- ${section}\n`;
      }
      prompt += `\n`;
    }
    if (!primaryDeliverableContract && template.outputTemplate) {
      const renderedOutputTemplate = renderTemplateIntent(template.outputTemplate, inputs);
      prompt += `Use these headings and labels exactly where applicable:\n`;
      prompt += `\`\`\`markdown\n${renderedOutputTemplate}\n\`\`\`\n\n`;
    }
    if (taskShapeGuidance.length) {
      prompt += `Task-shape requirements override generic template headings when they conflict:\n`;
      for (const item of taskShapeGuidance) {
        prompt += `- ${item}\n`;
      }
      prompt += `Do not let SWOT, risk, overview, or documentation-wrapper sections replace the requested plan, comparison, FAQ, prioritization, pricing, persona, or criteria deliverable.\n\n`;
    }
  }

  if (request.fileScope?.length) {
    prompt += `### File Scope\n- Allowed scope: ${request.fileScope.join(', ')}\n\n`;
  }

  if (familyContract) {
    prompt += `### Family Output Contract\n${familyContract}\n\n`;
  }

  if (previousOutput && previousOutput.trim()) {
    prompt += `### Previous Output (for context)\n${previousOutput}\n`;
    prompt += `\n*(The user is requesting a follow-up or refinement of the above.)*\n\n---\n\n`;
  }

  prompt += `### Output Contract\n`;
  prompt += `- Return a final answer directly in Markdown.\n`;
  prompt += `- Use ${responseLanguage} for the final answer, matching the primary language of the user intent and supplied inputs.\n`;
  prompt += `- Use short, explicit section headers only when they add clarity.\n`;
  prompt += `- Keep the result implementation-ready and grounded in the supplied inputs.\n`;
  prompt += `- Do not invent precise budgets, prices, company sizes, locale-specific currency, dates, quotas, or guarantees unless they were supplied. If an assumption is useful, label it as an assumption and keep it non-binding.\n`;
  prompt += `- Do not describe your internal process or governance workflow.\n\n`;
  prompt += `Please analyze the above information and provide a comprehensive, structured response following CVF guidelines.`;

  return prompt;
}
