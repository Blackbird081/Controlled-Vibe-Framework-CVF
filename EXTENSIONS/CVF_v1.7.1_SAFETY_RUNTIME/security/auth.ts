/**
 * JWT Auth Module — Production-ready token signing & verification.
 *
 * Uses Node.js built-in crypto for HMAC-SHA256 JWT signing.
 * No external dependencies required.
 */

import crypto from "crypto"
import { z } from "zod"
import { TokenPayloadSchema } from "../validation/schemas"

type TokenPayload = z.infer<typeof TokenPayloadSchema>

const ALGORITHM = "HS256"
const DEFAULT_EXPIRY_SECONDS = 86400 // 24 hours

function getSecret(): string {
    const secret = process.env.JWT_SECRET
    if (!secret || secret === "cvf_dev_secret_change_in_production") {
        if (process.env.NODE_ENV === "production") {
            throw new Error("JWT_SECRET must be set in production")
        }
    }
    return secret || "cvf_dev_secret_change_in_production"
}

function base64UrlEncode(data: string): string {
    return Buffer.from(data)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "")
}

function base64UrlDecode(data: string): string {
    const padded = data + "=".repeat((4 - (data.length % 4)) % 4)
    return Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString()
}

function createSignature(headerPayload: string, secret: string): string {
    return crypto
        .createHmac("sha256", secret)
        .update(headerPayload)
        .digest("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "")
}

// ─── Public API ─────────────────────────────────────────────

export interface SignedToken {
    token: string
    expiresAt: number
}

export function signToken(
    payload: TokenPayload,
    expirySeconds: number = DEFAULT_EXPIRY_SECONDS
): SignedToken {
    const now = Math.floor(Date.now() / 1000)
    const expiresAt = now + expirySeconds

    const header = base64UrlEncode(JSON.stringify({ alg: ALGORITHM, typ: "JWT" }))
    const body = base64UrlEncode(
        JSON.stringify({
            ...payload,
            iat: now,
            exp: expiresAt,
        })
    )

    const signature = createSignature(`${header}.${body}`, getSecret())

    return {
        token: `${header}.${body}.${signature}`,
        expiresAt,
    }
}

export function verifyToken(token: string): TokenPayload {
    const parts = token.split(".")
    if (parts.length !== 3) {
        throw new Error("Invalid token format")
    }

    const [header, body, signature] = parts as [string, string, string]

    // Verify signature
    const expectedSignature = createSignature(`${header}.${body}`, getSecret())
    if (signature !== expectedSignature) {
        throw new Error("Invalid token signature")
    }

    // Decode and check expiry
    const decoded = JSON.parse(base64UrlDecode(body))
    const now = Math.floor(Date.now() / 1000)

    if (decoded.exp && decoded.exp < now) {
        throw new Error("Token expired")
    }

    // Validate payload shape
    const result = TokenPayloadSchema.safeParse(decoded)
    if (!result.success) {
        throw new Error("Invalid token payload")
    }

    return result.data
}

// ─── Password Hashing ───────────────────────────────────────

const SALT_LENGTH = 16
const KEY_LENGTH = 64
const ITERATIONS = 100000

export async function hashPassword(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(SALT_LENGTH).toString("hex")
        crypto.pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, "sha512", (err, key) => {
            if (err) reject(err)
            else resolve(`${salt}:${key.toString("hex")}`)
        })
    })
}

export async function comparePassword(
    password: string,
    hash: string
): Promise<boolean> {
    return new Promise((resolve, reject) => {
        const [salt, key] = hash.split(":")
        if (!salt || !key) {
            resolve(false)
            return
        }
        crypto.pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, "sha512", (err, derivedKey) => {
            if (err) reject(err)
            else resolve(derivedKey.toString("hex") === key)
        })
    })
}

// ─── Cookie Config ──────────────────────────────────────────

export const COOKIE_CONFIG = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge: DEFAULT_EXPIRY_SECONDS,
    path: "/",
}

// ─── RBAC ───────────────────────────────────────────────────

export type Role = "admin" | "operator" | "viewer"

const PERMISSIONS: Record<Role, string[]> = {
    admin: [
        "proposal:create", "proposal:read", "proposal:approve", "proposal:reject",
        "policy:create", "policy:read", "policy:update",
        "settings:read", "settings:update",
        "audit:read",
        "user:manage",
    ],
    operator: [
        "proposal:create", "proposal:read", "proposal:approve", "proposal:reject",
        "policy:read",
        "settings:read",
        "audit:read",
    ],
    viewer: [
        "proposal:read",
        "policy:read",
        "audit:read",
    ],
}

export function hasPermission(role: Role, permission: string): boolean {
    return PERMISSIONS[role]?.includes(permission) ?? false
}

export function requirePermission(role: Role, permission: string): void {
    if (!hasPermission(role, permission)) {
        throw new Error(`Forbidden: role '${role}' lacks permission '${permission}'`)
    }
}
