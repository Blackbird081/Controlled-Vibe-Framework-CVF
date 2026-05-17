// {domain}.skill.pack.ts
// Template: Copy and rename for your domain
// Registers domain skills into CVF skill.registry

import { skillRegistry } from "../../02_TOOLKIT_CORE/skill.registry"

export function registerDomainSkills() {

    // Example R1 skill — low risk, read-only
    skillRegistry.register({
        id: "domain-data-fetch",
        name: "Domain Data Fetch",
        version: "1.0.0",
        description: "Retrieve data from domain source",
        riskLevel: "R1",
        domain: "your-domain",  // <-- CHANGE THIS
        requiredPhase: 1,
        requiresApproval: false,
        allowedRoles: ["ANALYST", "REVIEWER", "APPROVER", "ADMIN"],
        allowedEnvironments: ["dev", "staging", "prod"],
        requiresUAT: false,
        freezeOnRelease: false
    })

    // Example R3 skill — high risk, decision support
    skillRegistry.register({
        id: "domain-decision-support",
        name: "Domain Decision Support",
        version: "1.0.0",
        description: "AI-generated recommendation for domain",
        riskLevel: "R3",
        domain: "your-domain",  // <-- CHANGE THIS
        requiredPhase: 3,
        requiresApproval: true,
        allowedRoles: ["REVIEWER", "APPROVER", "ADMIN"],
        allowedEnvironments: ["dev", "staging"],
        requiresUAT: true,
        freezeOnRelease: true
    })
}
