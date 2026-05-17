// operator.policy.ts
// Defines operator role enforcement and permission logic

import { OperatorRole, OperatorContext } from "./interfaces"

class OperatorPolicy {

  isAuthorizedForSkill(operator: OperatorContext, allowedRoles: string[]): boolean {
    return allowedRoles.includes(operator.role)
  }

  requireMinimumRole(
    operator: OperatorContext,
    minimum: OperatorRole
  ): void {
    const hierarchy: OperatorRole[] = [
      "VIEWER",
      "ANALYST",
      "REVIEWER",
      "APPROVER",
      "ADMIN"
    ]

    const operatorLevel = hierarchy.indexOf(operator.role)
    const requiredLevel = hierarchy.indexOf(minimum)

    if (operatorLevel < requiredLevel) {
      throw new Error(
        `Insufficient role. Required: ${minimum}, actual: ${operator.role}`
      )
    }
  }

  validateCustomPermission(
    operator: OperatorContext,
    permission: string
  ): void {
    if (!operator.permissions || !operator.permissions.includes(permission)) {
      throw new Error(
        `Missing required permission: ${permission}`
      )
    }
  }
}

export const operatorPolicy = new OperatorPolicy()
