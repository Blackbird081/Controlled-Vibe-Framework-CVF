// cvf.version.validator.ts
// Validates toolkit version against canonical CVF version lock.

export interface CVFVersionLock {
    framework: string
    version: string
    lockedModules: string[]
    toolkitVersion: string
}

const CANONICAL_LOCK: Readonly<CVFVersionLock> = {
    framework: "CVF",
    version: "1.0",
    lockedModules: [
        "cvf_core_v1.0",
        "cvf_governance_v1.1",
        "cvf_risk_v1.2",
        "cvf_skills_v1.3",
        "cvf_change_v1.4",
        "cvf_agent_v1.5",
        "cvf_audit_v1.6"
    ],
    toolkitVersion: "1.0.0"
}

class CVFVersionValidator {

    validate(toolkitVersion: string): { valid: boolean; message: string } {
        if (toolkitVersion !== CANONICAL_LOCK.toolkitVersion) {
            return {
                valid: false,
                message: `Toolkit version ${toolkitVersion} does not match lock ${CANONICAL_LOCK.toolkitVersion}`
            }
        }
        return { valid: true, message: "Version validated against canonical lock" }
    }

    getLockedVersion(): Readonly<CVFVersionLock> {
        return CANONICAL_LOCK
    }

    isModuleLocked(moduleId: string): boolean {
        return CANONICAL_LOCK.lockedModules.includes(moduleId)
    }

    getFrameworkVersion(): string {
        return CANONICAL_LOCK.version
    }

    getToolkitVersion(): string {
        return CANONICAL_LOCK.toolkitVersion
    }
}

export const cvfVersionValidator = new CVFVersionValidator()
