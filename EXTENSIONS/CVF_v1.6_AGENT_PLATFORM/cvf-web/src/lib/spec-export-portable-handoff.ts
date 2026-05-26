import { Template } from '@/types';
import { getTemplateFieldLabel } from '@/lib/template-i18n';

type ExportLanguage = 'en' | 'vi';
type ExportMode = 'simple' | 'governance' | 'full';

export function buildPortableAgentHandoffReadiness(
    template: Template,
    values: Record<string, string>,
    lang: ExportLanguage,
    mode: ExportMode,
): string {
    if (template.id !== 'app_builder_complete' || lang !== 'en' || mode !== 'full') {
        return '';
    }

    const materialFieldIds = ['mustPreserve', 'dataNeeds', 'lookAndFeel', 'outOfScope', 'constraints'];
    const unresolvedMaterialDetails = materialFieldIds
        .map(fieldId => template.fields.find(field => field.id === fieldId))
        .filter((field): field is Template['fields'][number] => Boolean(field))
        .filter(field => {
            const value = values[field.id]?.trim();
            return !value || value.toLowerCase() === 'n/a';
        })
        .map(field => getTemplateFieldLabel(template.id, field.id, field.label, lang));
    const unresolvedSummary = unresolvedMaterialDetails.length
        ? unresolvedMaterialDetails.join(', ')
        : 'None identified from the provided source values';

    return `
---

## 🧳 Portable Agent Handoff Readiness

**Readiness status:** READY_FOR_EXTERNAL_AGENT_REVIEW

### Receiving Agent Mission

- Treat this packet as the authoritative product brief for the first build plan.
- Convert the non-coder brief into implementation decisions inside the stated guardrails.
- Prefer a simple, testable first version over broad platform expansion.
- Do not ask the non-coder to choose frameworks, databases, hosting, or hidden architecture unless that choice materially changes cost, risk, privacy, or scope.

### Source Values Handling

- This English packet uses agent-facing working values, not raw multilingual source text.
- If any field says \`TRANSLATION_REQUIRED\`, stop before build work and request an approved translation.
- Preserve product meaning, business terms, and acceptance criteria from the English Working Brief.
- Do not ask the non-coder to make hidden technical choices while resolving translation gaps.

### Implementation Decision Policy

- If a technical detail is missing, choose a conservative default and explain why.
- If a missing detail changes business risk, privacy, data retention, payment, authentication, or deployment scope, ask one concise clarification question before building.
- If user-provided constraints conflict, stop and list the conflict instead of guessing.

### Material Details To Reconfirm If Needed

${unresolvedSummary}

### External Agent Acceptance Checklist

- Restate the product goal in one short paragraph.
- List the first-version workflows the app must support.
- Identify data objects or records implied by the source values.
- Propose a practical build plan with milestones.
- Define acceptance tests mapped to the user's success criteria.
- Name assumptions and defaults separately from user-provided facts.
- Keep out-of-scope items out of the first build unless the operator approves expansion.

### Operator Review Gate

After the external agent responds, mark the packet:

- PASS: the agent understood the product, made sensible defaults, and produced actionable build steps.
- PASS_WITH_MINOR_FIX: the agent understood the product but needs small wording or scope corrections.
- HOLD: the agent misunderstood the product, asked the non-coder to make hidden technical choices, lost source values, or expanded scope without approval.
`;
}
