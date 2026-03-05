interface VaultEntry {
  original: string
  masked: string
}

export class VaultStore {
  private store = new Map<string, VaultEntry[]>()

  createSession(sessionId: string) {
    if (!this.store.has(sessionId)) {
      this.store.set(sessionId, [])
    }
  }

  add(sessionId: string, entry: VaultEntry) {
    const entries = this.store.get(sessionId)
    if (entries) entries.push(entry)
  }

  get(sessionId: string): VaultEntry[] {
    return this.store.get(sessionId) || []
  }

  clear(sessionId: string) {
    this.store.delete(sessionId)
  }
}