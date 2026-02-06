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
    category: 'business' | 'technical' | 'content' | 'research' | 'marketing' | 'product' | 'security' | 'development';
    fields: TemplateField[];
    intentPattern: string;
    outputExpected: string[];
    sampleOutput?: string; // Markdown content for preview
    // Folder support
    isFolder?: boolean;        // This template is a folder containing child templates
    parentFolder?: string;     // ID of parent folder template (for child templates)
    folderName?: string;       // Display name when inside folder
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

export type Category = 'business' | 'technical' | 'content' | 'research' | 'marketing' | 'product' | 'security' | 'development';

export const CATEGORY_INFO: Record<Category, { name: string; icon: string; color: string }> = {
    business: { name: 'Business', icon: '📈', color: 'blue' },
    technical: { name: 'Technical', icon: '🔧', color: 'purple' },
    content: { name: 'Content', icon: '✍️', color: 'green' },
    research: { name: 'Research', icon: '🔬', color: 'orange' },
    marketing: { name: 'Marketing & SEO', icon: '📣', color: 'pink' },
    product: { name: 'Product & UX', icon: '🎨', color: 'cyan' },
    security: { name: 'Security & Compliance', icon: '🔐', color: 'red' },
    development: { name: 'App Development', icon: '🚀', color: 'indigo' },
};

