// cvf.uat.adapter.ts
// Bridges UAT execution into CVF audit system

import { auditLogger } from "../02_TOOLKIT_CORE/audit.logger"

export interface UATExecutionResult {
  skillId: string
  passed: boolean
  notes?: string
  executedBy: string
}

export class CVFUATAdapter {

  recordUAT(result: UATExecutionResult) {
    auditLogger.log({
      eventType: "UAT_EXECUTION",
      operatorId: result.executedBy,
      skillId: result.skillId,
      details: {
        passed: result.passed,
        notes: result.notes
      }
    })
  }
}

export const cvfUATAdapter = new CVFUATAdapter()
