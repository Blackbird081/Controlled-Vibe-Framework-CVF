// output_validator.ts

import { IOContract } from "./contract.types"

export class OutputValidator {
  validate(output: string, contract: IOContract): boolean {
    if (!output || output.length === 0) return false

    if (!contract.allow_code_blocks && output.includes("```")) return false

    if (!contract.allow_external_links && output.includes("http")) return false

    if (contract.max_tokens && output.length > contract.max_tokens * 4) return false

    if (contract.expected_output_format === "json") {
      try {
        JSON.parse(output)
      } catch {
        return false
      }
    }

    return true
  }
}
