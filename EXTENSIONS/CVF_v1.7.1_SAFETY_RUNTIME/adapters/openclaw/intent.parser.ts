import { ParsedIntent } from "./types/intent.types"
import { ProviderAdapter } from "./provider.registry"

function deterministicFallback(raw: string): ParsedIntent {
  if (raw.includes("tạo") && raw.includes("nhân sự")) {
    return {
      action: "create_hr_module",
      confidence: 0.6,
      parameters: {},
    }
  }

  return {
    action: "unknown",
    confidence: 0.2,
    parameters: {},
  }
}

export async function parseIntent(
  raw: string,
  provider: ProviderAdapter
): Promise<ParsedIntent> {
  try {
    const prompt = `
    Extract structured intent JSON:
    {
      action: string,
      confidence: number,
      parameters: object
    }
    Message: "${raw}"
    `

    const response = await provider.sendMessage(prompt)

    const parsed = JSON.parse(response.content)

    return {
      action: parsed.action,
      confidence: parsed.confidence ?? 0,
      parameters: parsed.parameters ?? {},
    }
  } catch {
    return deterministicFallback(raw)
  }
}
