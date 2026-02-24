export interface RuleVersion {
  ruleId: string
  version: string
  previousVersion?: string
  timestamp: number
}

const ruleHistory: RuleVersion[] = []

export function registerRuleVersion(
  ruleId: string,
  version: string,
  previousVersion?: string
): void {
  ruleHistory.push({
    ruleId,
    version,
    previousVersion,
    timestamp: Date.now()
  })
}

export function getRuleHistory(ruleId: string): RuleVersion[] {
  return ruleHistory.filter(r => r.ruleId === ruleId)
}