// cvf.agent.adapter.ts
// Bridges external AI agent execution into CVF lifecycle governance

import { auditLogger } from "../02_TOOLKIT_CORE/audit.logger"

export interface AgentExecutionRecord {
  agentId: string
  skillId: string
  model: string
  operatorId: string
}

export class CVFAgentAdapter {

  recordAgentInvocation(record: AgentExecutionRecord) {
    auditLogger.log({
      eventType: "MODEL_INVOCATION",
      operatorId: record.operatorId,
      skillId: record.skillId,
      details: {
        agentId: record.agentId,
        model: record.model
      }
    })
  }
}

export const cvfAgentAdapter = new CVFAgentAdapter()
