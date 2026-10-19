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

- Treat this packet as one source input for INTAKE; it grants no BUILD authority.
- Convert the non-coder brief into implementation decisions inside the stated guardrails.
- Prefer a simple, testable first version over broad platform expansion.
- Do not ask the non-coder to choose frameworks, databases, hosting, or hidden architecture unless that choice materially changes cost, risk, privacy, or scope.

### Source Values Handling

- This English packet includes working wording and preserved multilingual source data.
- \`TRANSLATION_REQUIRED\` indicates a local normalization limit, not an ambiguous idea. Interpret the preserved source during INTAKE; ask only when consequential meaning remains unclear and pause only dependent decisions.
- Verify product meaning, business terms, qualifiers and acceptance criteria against original source values. Keep restriction strength exact: non-deletion does not imply immutability; an optional choice is not prohibited. Do not connect independent rules without source or accepted-owner support.
- Use the summary for orientation and consult original values before dependent interpretations. Keep exact names/codes and the scope of restrictions, including automatic versus manual behavior and version limits.
- Record and repair wording discrepancies during INTAKE; route consequential ambiguity to its decision owner. Do not treat English fluency as source confirmation or require the non-coder to review every English sentence.
- Do not ask the non-coder to make hidden technical choices while resolving translation gaps.

### Implementation Decision Policy

- Apply the Receiving Analysis And Question Discipline in this packet to the next permitted action.
- Resolve ordinary technical unknowns through permitted sources or the existing technical owner; explain consequential defaults and alternatives. Separate identity/access business rules from authentication-mechanism selection.
- Ask the decision owner only when unresolved source meaning affects that action; name the decision and its source-supported impact. Source-confirmed constraints stay in force; no necessary question for this action does not certify a complete specification.
- For conflicts or deferred unknowns, name the specific blocked action and what permitted work can continue; do not hold all INTAKE or planning merely because questions remain. Accepted answers update derived analysis and retire old assumptions while preserving confirmed source/revision; conditional planning and building still require their own authority.

### Material Details To Reconfirm If Needed

${unresolvedSummary}

### External Agent Acceptance Checklist

- Restate the product goal in one short paragraph.
- List the first-version workflows the app must support.
- Identify data objects or records implied by the source values.
- Identify the next permitted action and unresolved decisions. When planning is permitted, propose tasks/milestones with source decisions, dependencies and validation links.
- Separate actionable validation criteria from business outcome measures; flag missing coverage, unsupported tasks and terminology drift without inventing completeness.
- Name assumptions and defaults separately from user-provided facts.
- Keep out-of-scope items out of the first build unless the operator approves expansion.

### Operator Review Gate

After the external agent responds, mark the packet:

- PASS: the agent understood the product, preserved source constraints, and proposed continuation sufficient for the next permitted action.
- PASS_WITH_MINOR_FIX: the agent understood the product but needs small wording or scope corrections.
- HOLD: the agent misunderstood the product, asked the non-coder to make hidden technical choices, lost source values, or expanded scope without approval.
`;
}
