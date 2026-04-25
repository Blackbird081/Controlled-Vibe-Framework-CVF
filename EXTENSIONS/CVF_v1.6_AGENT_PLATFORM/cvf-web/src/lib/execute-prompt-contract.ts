import type { ExecutionRequest } from '@/lib/ai';
import { CVF_WEB_REDESIGN_DNA_APPENDIX, shouldAttachCvfWebRedesignDna } from '@/lib/cvf-web-redesign-dna';

export function buildExecutionPrompt(request: ExecutionRequest): string {
  const { templateName, inputs, intent } = request;
  const previousOutput = inputs._previousOutput;

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

  if (request.fileScope?.length) {
    prompt += `### File Scope\n- Allowed scope: ${request.fileScope.join(', ')}\n\n`;
  }

  if (previousOutput && previousOutput.trim()) {
    prompt += `### Previous Output (for context)\n${previousOutput}\n`;
    prompt += `\n*(The user is requesting a follow-up or refinement of the above.)*\n\n---\n\n`;
  }

  prompt += `### Output Contract\n`;
  prompt += `- Return a final answer directly in Markdown.\n`;
  prompt += `- Use short, explicit section headers only when they add clarity.\n`;
  prompt += `- Keep the result implementation-ready and grounded in the supplied inputs.\n`;
  prompt += `- Do not describe your internal process or governance workflow.\n\n`;
  prompt += `Please analyze the above information and provide a comprehensive, structured response following CVF guidelines.`;

  return prompt;
}
