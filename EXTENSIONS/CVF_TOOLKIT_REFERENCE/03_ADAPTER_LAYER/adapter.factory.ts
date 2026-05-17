// adapter.factory.ts
// CVF Toolkit — Adapter Registry & Factory
// Central registration point for all adapters.

import { CVFSkillAdapter, cvfSkillAdapter } from "./cvf.skill.adapter"
import { CVFGovernanceAdapter, cvfGovernanceAdapter } from "./cvf.governance.adapter"
import { CVFChangeAdapter, cvfChangeAdapter } from "./cvf.change.adapter"

type AdapterName = "skill" | "governance" | "change" | "agent" | "audit"

interface AdapterEntry {
    name: AdapterName
    instance: unknown
    description: string
}

class AdapterFactory {

    private adapters: Map<string, AdapterEntry> = new Map()

    constructor() {
        // Register built-in adapters
        this.register("skill", cvfSkillAdapter, "Bridges external workflows into CVF Skill Registry")
        this.register("governance", cvfGovernanceAdapter, "Central governance enforcement bridge")
        this.register("change", cvfChangeAdapter, "Change management lifecycle bridge")
    }

    register(name: string, instance: unknown, description: string): void {
        this.adapters.set(name, { name: name as AdapterName, instance, description })
    }

    get<T>(name: string): T {
        const entry = this.adapters.get(name)
        if (!entry) {
            throw new Error(`Adapter '${name}' not registered. Available: ${this.list().join(", ")}`)
        }
        return entry.instance as T
    }

    has(name: string): boolean {
        return this.adapters.has(name)
    }

    list(): string[] {
        return Array.from(this.adapters.keys())
    }

    describe(): AdapterEntry[] {
        return Array.from(this.adapters.values())
    }
}

export const adapterFactory = new AdapterFactory()
