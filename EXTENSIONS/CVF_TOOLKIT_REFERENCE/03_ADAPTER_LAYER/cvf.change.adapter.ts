// cvf.change.adapter.ts
// Bridges change management into CVF change.controller enforcement

import { changeController } from "../02_TOOLKIT_CORE/change.controller"
import { auditLogger } from "../02_TOOLKIT_CORE/audit.logger"
import type { RiskLevel, ChangeType } from "../02_TOOLKIT_CORE/interfaces"

export interface ChangeAdapterRequest {
  changeId: string
  changeType: ChangeType
  description: string
  requestedBy: string
  affectedComponents: string[]
  riskAssessment: RiskLevel
}

export class CVFChangeAdapter {

  registerChange(request: ChangeAdapterRequest) {
    changeController.register({
      changeId: request.changeId,
      changeType: request.changeType,
      description: request.description,
      requestedBy: request.requestedBy,
      requestedAt: new Date().toISOString(),
      affectedComponents: request.affectedComponents,
      riskAssessment: request.riskAssessment,
      requiresApproval: false, // set by changeController based on risk
      approvalChain: [],
      status: "draft",
      auditTrail: []
    })
  }

  submitChange(changeId: string) {
    changeController.submit(changeId)
  }

  approveChange(changeId: string, approverId: string) {
    changeController.approve(changeId, approverId)
  }

  rejectChange(changeId: string, rejectedBy: string, reason: string) {
    changeController.reject(changeId, rejectedBy, reason)
  }

  markImplemented(changeId: string, reference: string) {
    changeController.markImplemented(changeId, reference)
  }

  freezeChange(changeId: string) {
    changeController.freeze(changeId)
  }

  isApproved(changeId: string): boolean {
    return changeController.validate(changeId)
  }
}

export const cvfChangeAdapter = new CVFChangeAdapter()
