
export interface BlueprintModule {
  name: string;
  description: string;
  responsibilities: string[];
}

export interface BlueprintOutput {
  systemName: string;
  architectureStyle: string;
  techStack: string[];
  modules: BlueprintModule[];
  folderStructure: string[];
  estimatedFiles: number;
  estimatedComplexity: "LOW" | "MEDIUM" | "HIGH";
}

export interface BlueprintInput {
  instruction: string;
  userId: string;
}

export interface BlueprintAIClient {
  generateBlueprint(prompt: string): Promise<{
    blueprint: BlueprintOutput;
    tokensUsed: number;
    modelUsed: string;
  }>;
}

let blueprintClient: BlueprintAIClient | null = null;

export function registerBlueprintClient(client: BlueprintAIClient) {
  blueprintClient = client;
}

export async function generateBlueprint(
  input: BlueprintInput
): Promise<{
  blueprint: BlueprintOutput;
  tokensUsed: number;
  modelUsed: string;
}> {
  if (!blueprintClient) {
    throw new Error("Blueprint AI client not registered");
  }

  const prompt = buildBlueprintPrompt(input);

  const result = await blueprintClient.generateBlueprint(prompt);

  validateBlueprint(result.blueprint);

  return result;
}

function buildBlueprintPrompt(input: BlueprintInput): string {
  return `
You are generating a system blueprint.

Instruction:
${input.instruction}

Constraints:
- No policy modification
- No core lifecycle modification
- Modular architecture
- Enterprise-ready
- Clearly separated frontend/backend if applicable

Return structured architecture plan only.
`;
}

function validateBlueprint(blueprint: BlueprintOutput) {
  if (!blueprint.modules || blueprint.modules.length === 0) {
    throw new Error("Blueprint must define at least one module");
  }

  if (!blueprint.techStack || blueprint.techStack.length === 0) {
    throw new Error("Blueprint must define tech stack");
  }

  if (!blueprint.folderStructure || blueprint.folderStructure.length === 0) {
    throw new Error("Blueprint must define folder structure");
  }
}