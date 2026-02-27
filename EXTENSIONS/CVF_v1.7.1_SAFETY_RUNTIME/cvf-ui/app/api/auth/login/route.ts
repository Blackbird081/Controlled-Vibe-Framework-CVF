/**
 * POST /api/auth/login — Authenticate and receive JWT
 */

import { NextResponse } from "next/server"
import { LoginRequestSchema } from "../../../../../validation/schemas"
import { signToken, comparePassword, COOKIE_CONFIG } from "../../../../../security/auth"
import { validateBody, checkRateLimit, type ApiResponse } from "../../middleware"

// Stub user store — in production, use Prisma
const USERS: Record<
  string,
  { passwordHash: string; role: "admin" | "operator" | "viewer" }
> = {}

export async function POST(req: Request) {
  const rl = checkRateLimit(req)
  if ("error" in rl) return rl.error

  const body = await validateBody(req, LoginRequestSchema)
  if ("error" in body) return body.error

  const { username, password } = body.data
  const user = USERS[username]

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" } satisfies ApiResponse, {
      status: 401,
    })
  }

  const valid = await comparePassword(password, user.passwordHash)
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" } satisfies ApiResponse, {
      status: 401,
    })
  }

  const { token, expiresAt } = signToken({ userId: username, role: user.role })

  const response = NextResponse.json({
    data: { token, expiresAt, role: user.role },
  } satisfies ApiResponse)

  response.cookies.set("cvf_token", token, {
    ...COOKIE_CONFIG,
    maxAge: COOKIE_CONFIG.maxAge,
  })

  return response
}
