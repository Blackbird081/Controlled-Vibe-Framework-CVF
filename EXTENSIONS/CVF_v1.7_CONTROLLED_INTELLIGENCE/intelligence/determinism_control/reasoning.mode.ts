import { AgentRole } from "../role_transition_guard/role.types"
import { ReasoningMode } from "./temperature.policy"

export function resolveReasoningMode(role: AgentRole): ReasoningMode {

  switch (role) {
    case AgentRole.PLAN:
    case AgentRole.RISK:
    case AgentRole.REVIEW:
      return ReasoningMode.STRICT

    case AgentRole.RESEARCH:
    case AgentRole.DESIGN:
      return ReasoningMode.CONTROLLED

    case AgentRole.BUILD:
    case AgentRole.TEST:
    case AgentRole.DEBUG:
      return ReasoningMode.STRICT

    default:
      return ReasoningMode.CONTROLLED
  }
}