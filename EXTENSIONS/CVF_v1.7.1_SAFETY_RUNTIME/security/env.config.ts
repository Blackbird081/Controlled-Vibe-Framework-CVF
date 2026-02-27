/**
 * Environment Configuration — Centralized config with validation.
 *
 * All sensitive values come from environment variables.
 * Never hardcode API keys, secrets, or credentials.
 */

import { z } from "zod"

const EnvSchema = z.object({
  // Server
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),

  // Database
  DATABASE_URL: z.string().min(1).default("file:./dev.db"),

  // Auth
  JWT_SECRET: z.string().min(32).default("cvf_dev_secret_change_in_production_32chars!"),
  JWT_EXPIRY_SECONDS: z.coerce.number().int().positive().default(86400),

  // AI Provider
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  AI_MAX_TOKENS_PER_DAY: z.coerce.number().int().positive().default(100000),
  AI_MAX_COST_PER_DAY_USD: z.coerce.number().positive().default(20),

  // Rate Limiting
  RATE_LIMIT_API_MAX: z.coerce.number().int().positive().default(30),
  RATE_LIMIT_AI_MAX: z.coerce.number().int().positive().default(10),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
})

export type EnvConfig = z.infer<typeof EnvSchema>

let _config: EnvConfig | null = null

export function getConfig(): EnvConfig {
  if (!_config) {
    const result = EnvSchema.safeParse(process.env)
    if (!result.success) {
      const errors = result.error.issues
        .map(
          (e: { path: PropertyKey[]; message: string }) =>
            `  ${e.path.join(".")}: ${e.message}`
        )
        .join("\n")
      throw new Error(`Invalid environment configuration:\n${errors}`)
    }
    _config = result.data
  }
  return _config
}

/** Reset cached config (useful for testing) */
export function resetConfig(): void {
  _config = null
}
