import { CommitType } from "../ai_commit/ai.commit.schema.js";

export type { CommitType };

export type SkillLifecycleState =
    | "PROPOSED"
    | "REGISTERED"
    | "VERIFIED"
    | "ACTIVE"
    | "DEPRECATED"
    | "REVOKED";

export interface SkillRecord {
    skill_id: string;
    version: string;
    status: SkillLifecycleState;
    description: string;
    registered_at: string;
    verified_at?: string;
    deprecated_at?: string;
    revoked_at?: string;
    revoke_reason?: string;
    commit_types: CommitType[];
    test_coverage: number;
    depends_on?: string[];
}

export class SkillRegistry {
    private skills: Map<string, SkillRecord> = new Map();

    public registerSkill(skill: Omit<SkillRecord, "status" | "registered_at">): SkillRecord {
        const record: SkillRecord = {
            ...skill,
            status: "REGISTERED",
            registered_at: new Date().toISOString()
        };
        this.skills.set(skill.skill_id, record);
        return record;
    }

    public getSkill(skill_id: string): SkillRecord | undefined {
        return this.skills.get(skill_id);
    }

    public verifySkill(skill_id: string, coverage: number, hasCommits: boolean): SkillRecord {
        const skill = this.skills.get(skill_id);
        if (!skill) throw new Error("Skill not found");
        if (skill.status === "REVOKED") throw new Error("Cannot verify revoked skill");

        skill.test_coverage = coverage;

        if (coverage >= 80 && hasCommits) {
            skill.status = "VERIFIED";
            skill.verified_at = new Date().toISOString();
        }

        return skill;
    }

    public activateSkill(skill_id: string): SkillRecord {
        const skill = this.skills.get(skill_id);
        if (!skill) throw new Error("Skill not found");
        if (skill.status !== "VERIFIED") throw new Error("Skill must be VERIFIED before ACTIVE");

        if (skill.depends_on) {
            for (const dep_id of skill.depends_on) {
                const dep = this.skills.get(dep_id);
                if (!dep || dep.status !== "ACTIVE") {
                    throw new Error(`Dependency ${dep_id} is not ACTIVE`);
                }
            }
        }

        skill.status = "ACTIVE";
        return skill;
    }

    public deprecateSkill(skill_id: string): SkillRecord {
        const skill = this.skills.get(skill_id);
        if (!skill) throw new Error("Skill not found");

        if (skill.status === "REVOKED") return skill;

        skill.status = "DEPRECATED";
        skill.deprecated_at = new Date().toISOString();
        return skill;
    }

    public revokeSkill(skill_id: string, reason: string): SkillRecord {
        const skill = this.skills.get(skill_id);
        if (!skill) throw new Error("Skill not found");

        skill.status = "REVOKED";
        skill.revoked_at = new Date().toISOString();
        skill.revoke_reason = reason;

        for (const [id, s] of this.skills.entries()) {
            if (id !== skill_id && s.depends_on?.includes(skill_id)) {
                this.deprecateSkill(id);
            }
        }

        return skill;
    }

    public canAcceptCommit(skill_id: string): { allowed: boolean; warning?: string; error?: string } {
        const skill = this.skills.get(skill_id);
        if (!skill) return { allowed: false, error: "Skill not registered" };

        if (skill.status === "REVOKED") {
            return { allowed: false, error: "Skill is REVOKED" };
        }

        if (skill.status === "DEPRECATED") {
            return { allowed: true, warning: "DEPRECATED_SKILL" };
        }

        if (skill.status === "ACTIVE" || skill.status === "VERIFIED") {
            return { allowed: true };
        }

        return { allowed: false, error: "Skill not yet VERIFIED or ACTIVE" };
    }
}
