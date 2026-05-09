/**
 * Auth utilities — JWT and password hashing.
 *
 * TODO (Sprint 4): Replace with proper JWT library and add
 * httpOnly/secure cookie flags, RBAC, and token rotation.
 */

const SECRET = process.env.JWT_SECRET || "cvf_secret"

export interface TokenPayload {
  userId: string
  role: string
  [key: string]: unknown
}

export function signToken(payload: TokenPayload): string {
  // Stub: In production, use jsonwebtoken
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64")
  return `${encoded}.${SECRET}`
}

export function verifyToken(token: string): TokenPayload {
  // Stub: In production, use jsonwebtoken
  const [encoded] = token.split(".")
  if (!encoded) {
    throw new Error("Invalid token format")
  }
  const decoded = JSON.parse(Buffer.from(encoded, "base64").toString())
  return decoded as TokenPayload
}

export async function hashPassword(password: string): Promise<string> {
  // Stub: In production, use bcryptjs
  return `hashed_${password}`
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  // Stub: In production, use bcryptjs
  return hash === `hashed_${password}`
}
