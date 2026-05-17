// governance/adaptive.policy.ts

import { calculateSkillRisk } from "./skill.risk.score"

export type AdaptiveMode = "normal" | "moderate" | "strict"

export interface AdaptivePolicy {
  skillId: string
  mode: AdaptiveMode
  temperatureCap: number
  maxTokensCap: number
  requireClarification: boolean
  blockExecution: boolean
}

export function generateAdaptivePolicy(
  skillId: string
): AdaptivePolicy {
  const risk = calculateSkillRisk(skillId)

  let mode: AdaptiveMode = "normal"

  if (risk.score >= 70) {
    mode = "strict"
  } else if (risk.score >= 40) {
    mode = "moderate"
  }

  switch (mode) {
    case "strict":
      return {
        skillId,
        mode,
        temperatureCap: 0.3,
        maxTokensCap: 800,
        requireClarification: true,
        blockExecution: risk.score >= 90,
      }

    case "moderate":
      return {
        skillId,
        mode,
        temperatureCap: 0.5,
        maxTokensCap: 1200,
        requireClarification: false,
        blockExecution: false,
      }

    default:
      return {
        skillId,
        mode: "normal",
        temperatureCap: 0.8,
        maxTokensCap: 2000,
        requireClarification: false,
        blockExecution: false,
      }
  }
}