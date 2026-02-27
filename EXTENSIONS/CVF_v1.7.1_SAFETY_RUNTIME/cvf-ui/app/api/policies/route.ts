/**
 * GET  /api/policies — List policies
 * POST /api/policies — Register new policy (admin only)
 */

import { NextResponse } from "next/server"
import { registerPolicy, listPolicies } from "../../../../policy/policy.registry"
import { RegisterPolicySchema } from "../../../../validation/schemas"
import type { PolicyRule } from "../../../../types/index"
import {
  validateBody,
  requireRole,
  checkRateLimit,
  type ApiResponse,
} from "../middleware"

export async function GET(req: Request) {
  const rl = checkRateLimit(req)
  if ("error" in rl) return rl.error

  const auth = requireRole(req, "policy:read")
  if ("error" in auth) return auth.error

  const policies = listPolicies()
  return NextResponse.json({ data: policies } satisfies ApiResponse)
}

export async function POST(req: Request) {
  const rl = checkRateLimit(req)
  if ("error" in rl) return rl.error

  const auth = requireRole(req, "policy:create")
  if ("error" in auth) return auth.error

  const body = await validateBody(req, RegisterPolicySchema)
  if ("error" in body) return body.error

  const { version, rules } = body.data

  const policyRules: PolicyRule[] = rules.map((r) => ({
    ...r,
    evaluate: () => null,
  }))

  registerPolicy(version, policyRules)

  return NextResponse.json(
    { data: { version, rulesCount: rules.length } } satisfies ApiResponse,
    { status: 201 }
  )
}
