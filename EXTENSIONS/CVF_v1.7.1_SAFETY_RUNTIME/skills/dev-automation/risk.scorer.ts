/**
 * risk.scorer.ts
 *
 * Pure scoring module.
 * No DB access.
 * No execution.
 * No side effects.
 *
 * Responsible only for:
 * - Calculating risk score
 * - Returning structured breakdown
 */

export interface RiskScoreInput {
  instruction: string
  role: string
  devMode?: boolean
}

export interface RiskScoreBreakdown {
  keywordRisk: number
  lengthRisk: number
  roleRisk: number
  devAutomationRisk: number
}

export interface RiskScoreResult {
  totalScore: number
  breakdown: RiskScoreBreakdown
}

/**
 * Sensitive keywords
 * (can be moved to policy config later)
 */
const HIGH_RISK_KEYWORDS = [
  "delete",
  "drop database",
  "rm -rf",
  "shutdown",
  "kill process",
  "expose secret",
  "override policy",
]

const MEDIUM_RISK_KEYWORDS = [
  "deploy",
  "refactor core",
  "modify schema",
  "migrate database",
]

function calculateKeywordRisk(instruction: string): number {
  const lower = instruction.toLowerCase()

  let score = 0

  for (const kw of HIGH_RISK_KEYWORDS) {
    if (lower.includes(kw)) {
      score += 40
    }
  }

  for (const kw of MEDIUM_RISK_KEYWORDS) {
    if (lower.includes(kw)) {
      score += 20
    }
  }

  return score
}

function calculateLengthRisk(instruction: string): number {
  const length = instruction.length

  if (length > 2000) return 20
  if (length > 1000) return 10

  return 0
}

function calculateRoleRisk(role: string): number {
  switch (role) {
    case "ADMIN":
      return 0
    case "OPERATOR":
      return 5
    case "VIEWER":
      return 15
    default:
      return 20
  }
}

function calculateDevAutomationRisk(devMode?: boolean): number {
  return devMode ? 15 : 0
}

/**
 * Main scoring function
 */
export function scoreRisk(input: RiskScoreInput): RiskScoreResult {
  const { instruction, role, devMode } = input

  const keywordRisk = calculateKeywordRisk(instruction)
  const lengthRisk = calculateLengthRisk(instruction)
  const roleRisk = calculateRoleRisk(role)
  const devAutomationRisk = calculateDevAutomationRisk(devMode)

  const totalScore = keywordRisk + lengthRisk + roleRisk + devAutomationRisk

  return {
    totalScore,
    breakdown: {
      keywordRisk,
      lengthRisk,
      roleRisk,
      devAutomationRisk,
    },
  }
}
