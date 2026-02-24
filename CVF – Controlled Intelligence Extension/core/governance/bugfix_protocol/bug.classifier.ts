export enum BugType {
  SYNTAX = "SYNTAX",
  FAILING_TEST = "FAILING_TEST",
  RUNTIME_ERROR = "RUNTIME_ERROR",
  LOGIC_FLAW = "LOGIC_FLAW",
  SECURITY = "SECURITY",
  ARCHITECTURE = "ARCHITECTURE",
  UNKNOWN = "UNKNOWN"
}

export interface BugReport {
  message: string
  stackTrace?: string
  failingTestName?: string
  affectedModule?: string
}

export function classifyBug(report: BugReport): BugType {
  const msg = report.message.toLowerCase()

  if (msg.includes("syntax") || msg.includes("unexpected token")) {
    return BugType.SYNTAX
  }

  if (report.failingTestName) {
    return BugType.FAILING_TEST
  }

  if (msg.includes("null") || msg.includes("undefined")) {
    return BugType.RUNTIME_ERROR
  }

  if (msg.includes("logic") || msg.includes("incorrect result")) {
    return BugType.LOGIC_FLAW
  }

  if (msg.includes("security") || msg.includes("injection") || msg.includes("vulnerability")) {
    return BugType.SECURITY
  }

  if (msg.includes("architecture") || msg.includes("circular dependency")) {
    return BugType.ARCHITECTURE
  }

  return BugType.UNKNOWN
}