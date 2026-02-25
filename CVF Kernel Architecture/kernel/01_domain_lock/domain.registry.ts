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
      name: "general_info",
      description: "General informational responses",
      allowedInputTypes: ["question", "clarification"],
      allowedOutputTypes: ["text"],
      riskTolerance: "low"
    })

    this.register({
      name: "education",
      description: "Learning & explanation domain",
      allowedInputTypes: ["question", "exercise"],
      allowedOutputTypes: ["text", "structured_text"],
      riskTolerance: "medium"
    })

    this.register({
      name: "creative",
      description: "Creative writing domain (controlled)",
      allowedInputTypes: ["prompt"],
      allowedOutputTypes: ["text"],
      riskTolerance: "medium"
    })

    this.register({
      name: "analysis",
      description: "Analytical reasoning domain",
      allowedInputTypes: ["data", "question"],
      allowedOutputTypes: ["text", "structured_text"],
      riskTolerance: "low"
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