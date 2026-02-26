export class SessionState {

  private domain?: string
  private riskLevel?: string

  setDomain(domain: string) {
    this.domain = domain
  }

  getDomain() {
    return this.domain
  }

  setRisk(level: string) {
    this.riskLevel = level
  }

  getRisk() {
    return this.riskLevel
  }
}