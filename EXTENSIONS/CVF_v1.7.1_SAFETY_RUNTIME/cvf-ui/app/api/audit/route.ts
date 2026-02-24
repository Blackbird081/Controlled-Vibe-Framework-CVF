/**
 * GET /api/audit — List audit logs (admin/operator only)
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireRole, checkRateLimit, type ApiResponse } from "../middleware"

export async function GET(req: Request) {
    const rl = checkRateLimit(req)
    if ("error" in rl) return rl.error

    const auth = requireRole(req, "audit:read")
    if ("error" in auth) return auth.error

    const logs = await prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
    })

    return NextResponse.json({ data: logs } satisfies ApiResponse)
}
