export interface RefusalRecord {
  reason: string
  domain: string
  timestamp: number
}

export class RefusalRegistry {

  private refusals: RefusalRecord[] = []

  record(reason: string, domain: string) {
    this.refusals.push({
      reason,
      domain,
      timestamp: Date.now()
    })
  }

  getAll() {
    return this.refusals
  }
}