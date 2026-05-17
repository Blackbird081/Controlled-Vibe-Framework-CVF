# OPERATOR POLICY SPEC
# CVF-Toolkit Core Module
# Status: Authoritative Specification
# Toolkit Version: 1.0.0

## 1. PURPOSE

Defines and enforces operator roles, permissions, and authorization rules.
Every governance check must validate operator permissions before execution.

## 2. ROLE HIERARCHY

| Role     | Level | Description                          |
| -------- | ----- | ------------------------------------ |
| ANALYST  | 1     | Read-only, low-risk operations       |
| REVIEWER | 2     | Can review, approve R1/R2 operations |
| APPROVER | 3     | Can approve R3 operations            |
| ADMIN    | 4     | Full access, can approve R4          |

## 3. CORE INTERFACE

```ts
export type OperatorRole = "ANALYST" | "REVIEWER" | "APPROVER" | "ADMIN"

export interface OperatorContext {
  id: string
  name: string
  role: OperatorRole
}
```

## 4. AUTHORIZATION FUNCTIONS

### 4.1 Role Validation
```ts
validate(operatorRole: OperatorRole, requiredRole: OperatorRole): boolean
```
Returns true if operator role >= required role in hierarchy.

### 4.2 Skill Authorization
```ts
isAuthorizedForSkill(operator: OperatorContext, allowedRoles: string[]): boolean
```
Returns true if operator's role is in the skill's allowed roles list.

## 5. RISK-ROLE CONSTRAINTS

| Risk Level | Minimum Role Required |
| ---------- | --------------------- |
| R1         | ANALYST               |
| R2         | REVIEWER              |
| R3         | APPROVER              |
| R4         | ADMIN                 |

## 6. MULTI-APPROVAL RULES

For R4 operations:
- Minimum 2 distinct operators must approve
- At least 1 must be ADMIN
- Self-approval is prohibited

## 7. SECURITY RULES

- Operator role cannot be upgraded at runtime
- Operator context must come from authenticated source
- Operator ID must be logged in every audit event
- Role impersonation must throw SecurityException

## 8. COMPLIANCE CHECKLIST

✔ Role hierarchy enforced
✔ Skill authorization enforced
✔ Risk-role minimum enforced
✔ Multi-approval for R4
✔ Audit logging of operator ID
