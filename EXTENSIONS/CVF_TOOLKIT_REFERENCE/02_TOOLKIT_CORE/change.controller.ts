// change.controller.ts
// CVF Toolkit Core — Change Control Enforcement Engine
// Implements change.control.mapping.md spec.

import { RiskLevel, ChangeType, ChangeStatus, ChangeRequest } from "./interfaces"
import { RISK_ORDER } from "./cvf.config"
import { ChangeViolationError } from "./errors"
import { auditLogger } from "./audit.logger"

// --- Change Controller ---

class ChangeController {

    private changes: Map<string, ChangeRequest> = new Map()

    register(request: ChangeRequest): void {
        if (this.changes.has(request.changeId)) {
            throw new ChangeViolationError(
                `Change already registered: ${request.changeId}`
            )
        }

        // Apply risk matrix rules
        if (RISK_ORDER[request.riskAssessment] >= RISK_ORDER["R2"]) {
            request.requiresApproval = true
        }

        this.changes.set(request.changeId, request)

        auditLogger.log({
            eventType: "APPROVAL_GRANTED",
            operatorId: request.requestedBy,
            details: {
                changeId: request.changeId,
                changeType: request.changeType,
                status: "registered"
            }
        })
    }

    submit(changeId: string): void {
        const change = this.getChange(changeId)
        this.validateTransition(change.status, "submitted")
        change.status = "submitted"
    }

    approve(changeId: string, approverId: string): void {
        const change = this.getChange(changeId)
        this.validateTransition(change.status, "approved")

        change.approvalChain.push(approverId)

        // R4 requires multi-approval (at least 2)
        if (change.riskAssessment === "R4" && change.approvalChain.length < 2) {
            return // Need more approvals
        }

        change.status = "approved"

        auditLogger.log({
            eventType: "APPROVAL_GRANTED",
            operatorId: approverId,
            details: {
                changeId,
                riskLevel: change.riskAssessment,
                approvalChain: change.approvalChain
            }
        })
    }

    reject(changeId: string, rejectedBy: string, reason: string): void {
        const change = this.getChange(changeId)
        this.validateTransition(change.status, "rejected")
        change.status = "rejected"

        auditLogger.log({
            eventType: "APPROVAL_REJECTED",
            operatorId: rejectedBy,
            details: { changeId, reason }
        })
    }

    markImplemented(changeId: string, reference: string): void {
        const change = this.getChange(changeId)
        this.validateTransition(change.status, "implemented")
        change.status = "implemented"
        change.implementationReference = reference
    }

    freeze(changeId: string): void {
        const change = this.getChange(changeId)
        this.validateTransition(change.status, "frozen")
        change.status = "frozen"

        auditLogger.log({
            eventType: "FREEZE_APPLIED",
            details: { changeId, riskLevel: change.riskAssessment }
        })
    }

    validate(changeId: string): boolean {
        const change = this.changes.get(changeId)
        if (!change) return false
        return change.status === "approved" || change.status === "implemented"
    }

    get(changeId: string): ChangeRequest {
        return this.getChange(changeId)
    }

    // --- Private ---

    private getChange(changeId: string): ChangeRequest {
        const change = this.changes.get(changeId)
        if (!change) {
            throw new ChangeViolationError(`Change not found: ${changeId}`)
        }
        return change
    }

    private validateTransition(from: ChangeStatus, to: ChangeStatus): void {
        const allowed: Record<ChangeStatus, ChangeStatus[]> = {
            draft: ["submitted"],
            submitted: ["approved", "rejected"],
            approved: ["implemented"],
            rejected: [],
            implemented: ["frozen"],
            frozen: []
        }

        if (!allowed[from].includes(to)) {
            throw new ChangeViolationError(
                `Illegal change transition: ${from} → ${to}`
            )
        }
    }
}

export const changeController = new ChangeController()
