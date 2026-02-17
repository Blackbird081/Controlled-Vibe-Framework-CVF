// {domain}.risk.profile.ts
// Template: Copy and rename for your domain
// Maps domain-specific risk factors to CVF risk levels (R1–R4)

import { SkillRiskLevel } from "../../02_TOOLKIT_CORE/skill.registry"

export interface DomainRiskProfile {
    impactLevel: "LOW" | "MODERATE" | "HIGH" | "SEVERE"
    requiresHumanReview: boolean
    affectsExternalSystems: boolean
    dataClassification: "public" | "internal" | "confidential" | "restricted"
}

export class DomainRiskProfileEngine {

    mapToCVFRisk(profile: DomainRiskProfile): SkillRiskLevel {
        if (profile.impactLevel === "SEVERE") return "R4"
        if (profile.impactLevel === "HIGH") return "R3"
        if (profile.affectsExternalSystems) return "R3"
        if (profile.dataClassification === "restricted") return "R3"
        if (profile.impactLevel === "MODERATE") return "R2"
        return "R1"
    }

    requiresApproval(profile: DomainRiskProfile): boolean {
        const risk = this.mapToCVFRisk(profile)
        return risk === "R3" || risk === "R4"
    }
}

export const domainRiskProfile = new DomainRiskProfileEngine()
