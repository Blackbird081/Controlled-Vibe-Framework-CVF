/**
 * API Middleware — Shared request processing for all API routes.
 *
 * Provides: validation, auth, rate limiting, error handling
 */

import { NextResponse } from "next/server"
import { z } from "zod"
import { verifyToken, type Role, requirePermission } from "../../../security/auth"
import { apiLimiter, aiLimiter } from "../../../security/rate-limiter"

// ─── Types ──────────────────────────────────────────────────

export interface ApiContext {
    userId: string
    role: Role
}

export interface ApiResponse<T = unknown> {
    data?: T
    error?: string
    errors?: string[]
}

// ─── Validation Middleware ───────────────────────────────────

export async function validateBody<T>(
    req: Request,
    schema: z.ZodType<T>
): Promise<{ data: T } | { error: NextResponse }> {
    try {
        const body = await req.json()
        const result = schema.safeParse(body)

        if (!result.success) {
            return {
                error: NextResponse.json(
                    {
                        error: "Validation failed",
                        errors: result.error.issues.map(
                            (e) => `${e.path.join(".")}: ${e.message}`
                        ),
                    } satisfies ApiResponse,
                    { status: 400 }
                ),
            }
        }

        return { data: result.data }
    } catch {
        return {
            error: NextResponse.json(
                { error: "Invalid JSON body" } satisfies ApiResponse,
                { status: 400 }
            ),
        }
    }
}

// ─── Auth Middleware ─────────────────────────────────────────

export function extractToken(req: Request): string | null {
    const authHeader = req.headers.get("Authorization")
    if (authHeader?.startsWith("Bearer ")) {
        return authHeader.slice(7)
    }
    return null
}

export function authenticateRequest(req: Request): ApiContext | null {
    const token = extractToken(req)
    if (!token) return null

    try {
        const payload = verifyToken(token)
        return { userId: payload.userId, role: payload.role }
    } catch {
        return null
    }
}

export function requireAuth(req: Request): { ctx: ApiContext } | { error: NextResponse } {
    const ctx = authenticateRequest(req)
    if (!ctx) {
        return {
            error: NextResponse.json(
                { error: "Authentication required" } satisfies ApiResponse,
                { status: 401 }
            ),
        }
    }
    return { ctx }
}

export function requireRole(
    req: Request,
    permission: string
): { ctx: ApiContext } | { error: NextResponse } {
    const result = requireAuth(req)
    if ("error" in result) return result

    try {
        requirePermission(result.ctx.role, permission)
        return result
    } catch (err) {
        return {
            error: NextResponse.json(
                { error: err instanceof Error ? err.message : "Forbidden" } satisfies ApiResponse,
                { status: 403 }
            ),
        }
    }
}

// ─── Rate Limit Middleware ──────────────────────────────────

export function checkRateLimit(
    req: Request,
    type: "api" | "ai" = "api"
): { ok: true } | { error: NextResponse } {
    const ip = req.headers.get("x-forwarded-for") || "unknown"
    const limiter = type === "ai" ? aiLimiter : apiLimiter
    const result = limiter.check(ip)

    if (!result.allowed) {
        return {
            error: NextResponse.json(
                {
                    error: "Too many requests",
                    errors: [`Retry after ${Math.ceil((result.retryAfterMs ?? 0) / 1000)}s`],
                } satisfies ApiResponse,
                {
                    status: 429,
                    headers: {
                        "Retry-After": String(Math.ceil((result.retryAfterMs ?? 0) / 1000)),
                        "X-RateLimit-Remaining": String(result.remaining),
                    },
                }
            ),
        }
    }

    return { ok: true }
}
