export interface Skill {
    id: string;
    title: string;
    domain: string;
    difficulty: string;
    summary: string;
    path: string;
    content?: string;
}

export interface SkillCategory {
    id: string;
    name: string;
    skills: Skill[];
}
