import { Template } from '@/types';
import { businessTemplates } from './business';
import { technicalTemplates } from './technical';
import { contentTemplates } from './content';
import { researchTemplates } from './research';
import { marketingTemplates } from './marketing';
import { productTemplates } from './product';
import { securityTemplates } from './security';
import { developmentTemplates } from './development';
import { hrTemplates } from './hr';
import { renderTemplateIntent, type TemplateIntentValue } from '@/lib/template-intent';

export const templates: Template[] = [
    ...businessTemplates,
    ...technicalTemplates,
    ...contentTemplates,
    ...researchTemplates,
    ...marketingTemplates,
    ...productTemplates,
    ...securityTemplates,
    ...developmentTemplates,
    ...hrTemplates,
];

export function getTemplateById(id: string): Template | undefined {
    return templates.find(t => t.id === id);
}

export function getTemplatesByCategory(category: string): Template[] {
    return templates.filter(t => t.category === category);
}

export function generateIntent(template: Template, values: Record<string, TemplateIntentValue>): string {
    return renderTemplateIntent(template.intentPattern, values);
}
