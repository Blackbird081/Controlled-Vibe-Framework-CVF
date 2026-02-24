// reasoning.types.ts

import { AgentRole } from "../role_transition_guard/role.graph"
import { ReasoningMode } from "../determinism_control/temperature.policy"

export interface ReasoningInput {
  sessionId: string
  role: AgentRole
  basePrompt: string
  context: string
  riskScore: number
  // policyCompliant đã bị xóa — governance check được thực hiện nội bộ bởi controlled.reasoning.ts
  entropyScore?: number
}

export interface ReasoningConfig {
  mode: ReasoningMode
  temperature: number
  entropyThreshold: number
}

export interface ReasoningDecision {
  allowed: boolean
  reason?: string
  finalPrompt?: string
  temperature: number
  mode: ReasoningMode
}

export interface ReasoningResult {
  decision: ReasoningDecision
  snapshot?: {
    sessionId: string
    role: AgentRole
    temperature: number
    entropyScore: number
    timestamp: number
  }
}