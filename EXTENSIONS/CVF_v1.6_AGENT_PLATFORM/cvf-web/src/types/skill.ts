export interface SkillLinkedTemplate {
    templateId: string;
    corpusClass: string;
    trustedBenchmarkSurface?: boolean;
}

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
    specScore?: number;
    specQuality?: string;
    specGate?: string;
    corpusClass?: string;
    frontDoorVisible?: boolean;
    frontDoorTier?: string;
    trustedBenchmarkSurface?: boolean;
    hasRestrictedLinks?: boolean;
    linkedTemplates?: SkillLinkedTemplate[];
    corpusNote?: string;
}

export interface SkillCategory {
    id: string;
    name: string;
    skills: Skill[];
}

export interface SkillIndexMeta {
    totalScannedSkills: number;
    frontDoorSkills: number;
    quarantinedSkills: number;
    trustedMappedSkills: number;
    reviewMappedSkills: number;
    trustedBenchmarkSkills: number;
    governanceSource: string[];
}

export interface SkillIndexPayload {
    generatedAt?: string;
    categories: SkillCategory[];
    meta?: SkillIndexMeta;
}
