import { governedGenerate } from "../../ai/ai.governance";
import { DevArtifact } from "./artifact.types";

export async function generateCodeArtifact(
  instruction: string
): Promise<DevArtifact> {

  const response = await governedGenerate({
    userPrompt: instruction,
    temperature: 0.2,
    maxTokens: 2000,
  });

  return {
    id: crypto.randomUUID(),
    type: "CODE",
    content: response.content,
    metadata: {
      model: response.model,
      usage: response.usage,
    },
    createdAt: Date.now(),
  };
}