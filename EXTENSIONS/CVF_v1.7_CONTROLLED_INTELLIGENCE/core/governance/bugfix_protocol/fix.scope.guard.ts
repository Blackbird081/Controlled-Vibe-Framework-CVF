export interface FixScopeContext {
  changedModules: string[]
  approvedModules: string[]
  modifiesArchitecture: boolean
  modifiesSchema: boolean
}

export interface FixScopeDecision {
  allowed: boolean
  reasons?: string[]
}

export function evaluateFixScope(context: FixScopeContext): FixScopeDecision {
  const reasons: string[] = []

  if (context.modifiesArchitecture) {
    reasons.push("Architecture modification is not allowed in autonomous fix.")
  }

  if (context.modifiesSchema) {
    reasons.push("Schema modification is not allowed in autonomous fix.")
  }

  const outOfScope = context.changedModules.filter(
    m => !context.approvedModules.includes(m)
  )

  if (outOfScope.length > 0) {
    reasons.push(`Changes outside approved scope: ${outOfScope.join(", ")}`)
  }

  return {
    allowed: reasons.length === 0,
    reasons: reasons.length > 0 ? reasons : undefined
  }
}