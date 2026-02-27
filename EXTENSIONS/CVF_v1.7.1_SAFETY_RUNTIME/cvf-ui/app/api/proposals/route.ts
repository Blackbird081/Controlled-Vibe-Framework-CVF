/**
 * POST /api/proposals — Create a new proposal (validated + authenticated)
 * GET  /api/proposals — List all proposals
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { CreateProposalRequestSchema } from "../../../../validation/schemas"
import {
  validateBody,
  requireRole,
  checkRateLimit,
  type ApiResponse,
} from "../middleware"

export async function GET(req: Request) {
  const rl = checkRateLimit(req)
  if ("error" in rl) return rl.error

  const auth = requireRole(req, "proposal:read")
  if ("error" in auth) return auth.error

  const proposals = await prisma.proposal.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return NextResponse.json({ data: proposals } satisfies ApiResponse)
}

export async function POST(req: Request) {
  const rl = checkRateLimit(req)
  if ("error" in rl) return rl.error

  const auth = requireRole(req, "proposal:create")
  if ("error" in auth) return auth.error

  const body = await validateBody(req, CreateProposalRequestSchema)
  if ("error" in body) return body.error

  const { instruction } = body.data
  const riskScore = instruction.length > 500 ? 7 : 3

  const proposal = await prisma.proposal.create({
    data: {
      source: "api",
      action: "submit",
      payload: JSON.stringify({ instruction }),
      policyVersion: "v1",
      policyHash: "pending",
      confidence: 1.0,
      riskLevel: riskScore > 5 ? "high" : "low",
      state: riskScore > 5 ? "proposed" : "approved",
      decision: riskScore > 5 ? "pending" : "approved",
    },
  })

  return NextResponse.json({ data: proposal } satisfies ApiResponse, { status: 201 })
}
