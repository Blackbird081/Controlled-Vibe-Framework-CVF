import { DomainDefinition } from "./domain.types"

export class DomainRegistry {
  private domains: Map<string, DomainDefinition> = new Map()

  constructor() {
    this.bootstrap()
  }

  /**
   * Default Non-Coder Domains
   * Safety Absolute by Default
   */
  private bootstrap() {
    this.register({
      name: "informational",
      description: "General informational responses",
      allowedInputTypes: ["question", "clarification"],
      allowedOutputTypes: ["text"],
      riskTolerance: "low",
    })

    this.register({
      name: "analytical",
      description: "Analytical reasoning domain",
      allowedInputTypes: ["question", "data", "clarification"],
      allowedOutputTypes: ["text", "structured_text"],
      riskTolerance: "medium",
    })

    this.register({
      name: "creative",
      description: "Creative writing domain (controlled)",
      allowedInputTypes: ["prompt"],
      allowedOutputTypes: ["text"],
      riskTolerance: "medium",
    })

    this.register({
      name: "procedural",
      description: "Procedural guidance domain",
      allowedInputTypes: ["instruction", "question"],
      allowedOutputTypes: ["text", "structured_text"],
      riskTolerance: "low",
    })

    this.register({
      name: "sensitive",
      description: "Sensitive topic domain with strict guardrails",
      allowedInputTypes: ["question", "clarification"],
      allowedOutputTypes: ["text"],
      riskTolerance: "high",
    })

    this.register({
      name: "restricted",
      description: "Restricted domain (non-executable by default policy)",
      allowedInputTypes: [],
      allowedOutputTypes: [],
      riskTolerance: "critical",
    })
  }

  register(domain: DomainDefinition) {
    if (this.domains.has(domain.name)) {
      throw new Error(`Domain already exists: ${domain.name}`)
    }

    this.domains.set(domain.name, domain)
  }

  get(name: string): DomainDefinition | undefined {
    return this.domains.get(name)
  }

  exists(name: string): boolean {
    return this.domains.has(name)
  }

  list(): DomainDefinition[] {
    return Array.from(this.domains.values())
  }
}
