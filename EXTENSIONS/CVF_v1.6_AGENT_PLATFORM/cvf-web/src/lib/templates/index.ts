import { Template } from '@/types';
import { businessTemplates } from './business';
import { technicalTemplates } from './technical';
import { contentTemplates } from './content';
import { researchTemplates } from './research';
import { marketingTemplates } from './marketing';
import { productTemplates } from './product';
import { securityTemplates } from './security';
import { developmentTemplates } from './development';
import { CVF_WEB_REDESIGN_DNA_APPENDIX, shouldAttachCvfWebRedesignDna } from '@/lib/cvf-web-redesign-dna';

export const templates: Template[] = [
    ...businessTemplates,
    ...technicalTemplates,
    ...contentTemplates,
    ...researchTemplates,
    ...marketingTemplates,
    ...productTemplates,
    ...securityTemplates,
    ...developmentTemplates,
];

export function getTemplateById(id: string): Template | undefined {
    return templates.find(t => t.id === id);
}

export function getTemplatesByCategory(category: string): Template[] {
    return templates.filter(t => t.category === category);
}

export function generateIntent(template: Template, values: Record<string, string>): string {
    let intent = template.intentPattern;
    Object.entries(values).forEach(([key, value]) => {
        intent = intent.replace(new RegExp(`\\[${key}\\]`, 'g'), value || 'N/A');
    });
    return intent;
}

/**
 * Generate a complete CVF specification document
 * Ready for copy/paste into any AI (ChatGPT, Claude, Gemini, etc.)
 */
export function generateCompleteSpec(
    template: Template,
    values: Record<string, string>,
    userIntent?: string
): string {
    const date = new Date().toISOString().split('T')[0];
    const intent = userIntent?.trim() || generateIntent(template, values);
    const cvfWebDnaAppendix = shouldAttachCvfWebRedesignDna({
        templateId: template.id,
        templateName: template.name,
    }) ? CVF_WEB_REDESIGN_DNA_APPENDIX : '';

    // Build user input section
    const userInputLines = Object.entries(values)
        .filter(([, value]) => value && value.trim())
        .map(([key, value]) => {
            const field = template.fields.find(f => f.id === key);
            const label = field?.label || key;
            return `- **${label}:** ${value}`;
        })
        .join('\n');

    // Build expected output section
    const expectedOutput = template.outputExpected
        ?.map(item => `- ${item}`)
        .join('\n') || '- Comprehensive analysis\n- Actionable recommendations';
    const outputTemplate = template.outputTemplate || (template.outputExpected?.length
        ? template.outputExpected.map(section => `## ${section}\n- ...`).join('\n\n')
        : '');

    const requiredFields = template.fields.filter(field => field.required);
    const missingRequired = requiredFields.filter(field => {
        const value = values[field.id];
        return !value || !value.trim() || value.trim().toLowerCase() === 'n/a';
    });
    const inputCoverage = requiredFields.length
        ? [
            '| Field | Provided |',
            '| --- | --- |',
            ...requiredFields.map(field => {
                const value = values[field.id];
                const provided = value && value.trim() && value.trim().toLowerCase() !== 'n/a';
                return `| ${field.label} | ${provided ? '✅' : '❌'} |`;
            })
        ].join('\n')
        : '(No required inputs)';

    const executionConstraints = `## ⛔ Execution Constraints
- Do not invent missing inputs. If required inputs are missing, stop and ask for clarification.
- Follow the Output Template headings exactly (no reordering).
- Stay within the scope defined by the Task section.
- If data is unavailable, state it explicitly as "Unknown".`;

    const validationHooks = `## ✅ Validation Hooks
- Check required inputs against the Input Coverage table.
- Ensure every Expected Output section is present.
- Include a Success Criteria Check.
- If any item is missing, mark the result as "Not Ready" and list what's missing.`;

    const nonCoderStandard = `## 🧭 CVF Non-Coder Success Standard
- The result must be actionable for a non-coder, not just descriptive.
- Tailor the output to the provided inputs instead of falling back to generic advice.
- Cover the main requested output shape end-to-end.
- Stay governance-safe: do not suggest bypasses, unsafe shortcuts, or hidden assumptions.
- If the request cannot be completed safely, provide the clearest safe next step instead of ending in a dead end.`;

    const governedResponseRules = `## 🛡️ Governed Response Rules
- If the task is allowed, answer directly and clearly.
- If the task should be blocked or needs approval, explain why in plain language.
- When blocked or approval-gated, provide a safe next-step path the user can actually follow.
- Make risk, review, or approval implications visible instead of hiding them in jargon.`;

    const knowledgePreference = `## 🧠 Knowledge Context Preference
- If the user provides governed domain context, internal policy text, or project-specific facts, prioritize that context over generic training knowledge.
- If important knowledge context is missing, say exactly what context would improve the result instead of guessing.
- Do not invent proprietary domain facts that were not provided.`;

    const spec = `---
# CVF Task Specification
**Generated:** ${date}
**Template:** ${template.name}
**Category:** ${template.category}
---

## 📋 Context

**Template:** ${template.icon} ${template.name}

${template.description}

---

## 📝 User Input

${userInputLines || '(No input provided)'}

---

## ✅ Input Coverage

${inputCoverage}
${missingRequired.length ? `\n\n**Missing Required Inputs:** ${missingRequired.map(field => field.label).join(', ')}` : ''}

---

## 🎯 Task

${intent}

---

## 📤 Expected Output Format

${expectedOutput}

${outputTemplate ? `\n---\n\n## 📐 Output Template\n\n\`\`\`markdown\n${outputTemplate}\n\`\`\`\n` : ''}

---

${cvfWebDnaAppendix ? `${cvfWebDnaAppendix}\n\n---\n\n` : ''}

${executionConstraints}

---

${validationHooks}

---

${nonCoderStandard}

---

${governedResponseRules}

---

${knowledgePreference}

---

## 💡 Instructions for AI

Please analyze the information provided above and generate a comprehensive response that:
1. Addresses all the success criteria listed in the Task section
2. Follows the Expected Output Format structure
3. Provides actionable insights and recommendations
4. Uses clear, professional language
5. Includes specific examples where applicable

---

> **CVF v1.5 UX Platform**
> Copy this entire specification and paste into your preferred AI assistant (ChatGPT, Claude, Gemini, etc.)
`;

    return spec;
}
