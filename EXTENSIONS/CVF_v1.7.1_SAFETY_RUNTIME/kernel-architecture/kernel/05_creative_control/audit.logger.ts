export interface AuditEvent {
  type: string
  message: string
  timestamp: number
}

export class AuditLogger {
  private events: AuditEvent[] = []

  log(type: string, message: string) {
    this.events.push({
      type,
      message,
      timestamp: Date.now(),
    })
  }

  getEvents() {
    return this.events
  }
}
