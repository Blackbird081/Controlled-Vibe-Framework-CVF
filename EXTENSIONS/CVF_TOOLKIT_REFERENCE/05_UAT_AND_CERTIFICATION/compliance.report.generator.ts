// compliance.report.generator.ts
// Generates compliance summary for audit & certification

import { auditLogger } from "../02_TOOLKIT_CORE/audit.logger"
import { skillRegistry } from "../02_TOOLKIT_CORE/skill.registry"

export class ComplianceReportGenerator {

  generate(skillId: string): string {

    const skill = skillRegistry.get(skillId)
    const logs = auditLogger.filterBySkill(skillId)

    const report = {
      skillId: skill.id,
      riskLevel: skill.riskLevel,
      requiredPhase: skill.requiredPhase,
      requiresApproval: skill.requiresApproval,
      auditTrailCount: logs.length,
      generatedAt: new Date().toISOString()
    }

    return JSON.stringify(report, null, 2)
  }
}

export const complianceReportGenerator = new ComplianceReportGenerator()
