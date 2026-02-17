// financial.skill.pack.ts
// Registers financial domain skills into CVF skill registry

import { skillRegistry } from "../../02_TOOLKIT_CORE/skill.registry"

export function registerFinancialSkills() {

  skillRegistry.register({
    id: "financial-data-fetch",
    name: "Financial Data Fetch",
    description: "Retrieve financial data from VNStock API",
    riskLevel: "R1",
    requiredPhase: 1,
    requiresApproval: false,
    allowedRoles: ["ANALYST", "REVIEWER", "APPROVER", "ADMIN"],
    version: "1.0.0",
    active: true
  })

  skillRegistry.register({
    id: "financial-ratio-analysis",
    name: "Financial Ratio Analysis",
    description: "Compute key financial ratios",
    riskLevel: "R2",
    requiredPhase: 2,
    requiresApproval: false,
    allowedRoles: ["ANALYST", "REVIEWER", "APPROVER", "ADMIN"],
    version: "1.0.0",
    active: true
  })

  skillRegistry.register({
    id: "investment-decision-support",
    name: "Investment Decision Support",
    description: "AI-generated investment recommendation",
    riskLevel: "R3",
    requiredPhase: 3,
    requiresApproval: true,
    allowedRoles: ["REVIEWER", "APPROVER", "ADMIN"],
    version: "1.0.0",
    active: true
  })

  skillRegistry.register({
    id: "portfolio-strategy-optimization",
    name: "Portfolio Strategy Optimization",
    description: "Generate portfolio allocation strategy",
    riskLevel: "R4",
    requiredPhase: 4,
    requiresApproval: true,
    allowedRoles: ["APPROVER", "ADMIN"],
    version: "1.0.0",
    active: true
  })
}
