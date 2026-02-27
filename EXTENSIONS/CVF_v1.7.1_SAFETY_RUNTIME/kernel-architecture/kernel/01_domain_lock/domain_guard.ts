import { DomainDefinition } from "./domain.types"
import { DomainRegistry } from "./domain.registry"

export interface DomainValidationResult {
  valid: boolean
  reason?: string
  domain?: string
}

export class DomainGuard {
  private registry = new DomainRegistry()

  /**
   * Validate input against declared domain
   * - Ensures domain exists
   * - Ensures input type allowed
   * - Prevents cross-domain misuse
   */
  validate(input: any): DomainValidationResult {
    if (!input?.domain) {
      return {
        valid: false,
        reason: "Missing domain declaration",
      }
    }

    const domain: DomainDefinition | undefined = this.registry.get(input.domain)

    if (!domain) {
      return {
        valid: false,
        reason: `Unknown domain: ${input.domain}`,
      }
    }

    if (!domain.allowedInputTypes.includes(input.type)) {
      return {
        valid: false,
        reason: `Input type '${input.type}' not allowed in domain '${input.domain}'`,
      }
    }

    return {
      valid: true,
      domain: input.domain,
    }
  }

  /**
   * Hard enforcement mode (throws)
   */
  enforce(input: any): void {
    const result = this.validate(input)

    if (!result.valid) {
      throw new Error(`Domain violation: ${result.reason}`)
    }
  }
}
