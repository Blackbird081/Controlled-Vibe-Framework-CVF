export interface Skill {
    id: string;
    title: string;
    domain: string;
    difficulty: string;
    summary: string;
    path: string;
    content?: string;
    riskLevel?: string;
    allowedRoles?: string;
    allowedPhases?: string;
    authorityScope?: string;
    autonomy?: string;
    uatStatus?: string;
    uatContent?: string;
    uatScore?: number;
    uatQuality?: string;
}

export interface SkillCategory {
    id: string;
    name: string;
    skills: Skill[];
}
