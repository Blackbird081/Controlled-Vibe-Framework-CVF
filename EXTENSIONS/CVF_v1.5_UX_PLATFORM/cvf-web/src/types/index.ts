// Template types for CVF v1.5 UX Platform

export interface TemplateField {
    id: string;
    type: 'text' | 'textarea' | 'select' | 'multiselect';
    label: string;
    placeholder?: string;
    required: boolean;
    options?: string[];
    default?: string;
    section?: 'required' | 'advanced';
    maxLength?: number;
    rows?: number;
}

export interface Template {
    id: string;
    name: string;
    icon: string;
    description: string;
    category: 'business' | 'technical' | 'content' | 'research';
    fields: TemplateField[];
    intentPattern: string;
    outputExpected: string[];
}

export interface Execution {
    id: string;
    templateId: string;
    templateName: string;
    input: Record<string, string>;
    intent: string;
    output?: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    result?: 'accepted' | 'rejected';
    qualityScore?: number;
    createdAt: Date;
    completedAt?: Date;
}

export interface QualityScore {
    overall: number;
    structure: number;
    completeness: number;
    clarity: number;
    actionability: number;
}

export type Category = 'business' | 'technical' | 'content' | 'research';

export const CATEGORY_INFO: Record<Category, { name: string; icon: string; color: string }> = {
    business: { name: 'Business', icon: '📈', color: 'blue' },
    technical: { name: 'Technical', icon: '🔧', color: 'purple' },
    content: { name: 'Content', icon: '✍️', color: 'green' },
    research: { name: 'Research', icon: '🔬', color: 'orange' },
};
