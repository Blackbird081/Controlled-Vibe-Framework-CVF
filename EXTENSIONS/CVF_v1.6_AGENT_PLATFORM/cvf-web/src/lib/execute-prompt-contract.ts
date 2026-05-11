import type { ExecutionRequest } from '@/lib/ai';
import { CVF_WEB_REDESIGN_DNA_APPENDIX, shouldAttachCvfWebRedesignDna } from '@/lib/cvf-web-redesign-dna';
import { getTemplateById } from '@/lib/templates';
import { renderTemplateIntent } from '@/lib/template-intent';

export function buildExecutionPrompt(request: ExecutionRequest): string {
  const { templateName, inputs, intent } = request;
  const previousOutput = inputs._previousOutput;
  const template = request.templateId ? getTemplateById(request.templateId) : undefined;

  let prompt = `## Task: ${templateName}\n\n`;
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
    prompt += `Follow this template contract more strongly than generic sectioning advice.\n`;
    prompt += `Do not return the raw skeleton or a fenced code block. Fill the headings with the supplied user input values, names, constraints, and concrete decisions.\n`;
    if (template.outputExpected?.length) {
      prompt += `Expected sections:\n`;
      for (const section of template.outputExpected) {
        prompt += `- ${section}\n`;
      }
      prompt += `\n`;
    }
    if (template.outputTemplate) {
      const renderedOutputTemplate = renderTemplateIntent(template.outputTemplate, inputs);
      prompt += `Use these headings and labels exactly where applicable:\n`;
      prompt += `\`\`\`markdown\n${renderedOutputTemplate}\n\`\`\`\n\n`;
    }
  }

  if (request.fileScope?.length) {
    prompt += `### File Scope\n- Allowed scope: ${request.fileScope.join(', ')}\n\n`;
  }

  if (previousOutput && previousOutput.trim()) {
    prompt += `### Previous Output (for context)\n${previousOutput}\n`;
    prompt += `\n*(The user is requesting a follow-up or refinement of the above.)*\n\n---\n\n`;
  }

  prompt += `### Output Contract\n`;
  prompt += `- Return a final answer directly in Markdown.\n`;
  prompt += `- Use the same natural language as the user's request unless the user explicitly asks for translation or another language.\n`;
  prompt += `- Use short, explicit section headers only when they add clarity. Do not wrap the final answer in a fenced markdown block unless the user asked for a file or code block.\n`;
  prompt += `- Match the response size to the task. For a short translation, rewrite, label, or simple transformation, preserve the requested tone and return only the transformed result unless the user asks for explanation.\n`;
  prompt += `- Keep the result implementation-ready and grounded in the supplied inputs; include concrete assumptions only when the user did not provide enough detail.\n`;
  prompt += `- For product briefs, plans, and documentation, include the practical components a handoff reader expects: purpose, audience/users, scope, key features or steps, success measures, risks/constraints, and next actions.\n`;
  prompt += `- For developer handoffs, include scope, likely files/modules, implementation notes, tests, security/data considerations, rollback notes, and verification steps.\n`;
  prompt += `- Do not invent latency, accuracy, benchmark, cost, quota, version, or provider-ranking numbers. If measured data was not supplied, use qualitative tradeoffs and a verification plan instead.\n`;
  prompt += `- If the task asks for general provider/model tradeoffs or says not to use live price/benchmark claims, do not choose a specific named provider or model as the final answer unless the user supplied the allowed candidates. Provide lane criteria and verification steps instead.\n`;
  prompt += `- Do not describe your internal process or governance workflow.\n\n`;
  prompt += `Please provide the most useful final answer for the user's task while following CVF guidelines.`;

  return prompt;
}
