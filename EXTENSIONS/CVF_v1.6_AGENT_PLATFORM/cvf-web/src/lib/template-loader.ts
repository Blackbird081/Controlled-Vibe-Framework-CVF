/**
 * Template Loader — re-exports templates from the canonical source.
 *
 * Previously loaded from public/data/templates.json, but that file
 * is gitignored. Now delegates to the TypeScript template definitions.
 */
import { Template } from '@/types';
import { templates as allTemplates, getTemplateById } from './templates';

// Re-export templates
export const templates: Template[] = allTemplates;

// Category info derived from templates
export const categories = Array.from(new Set(templates.map(t => t.category)));

// Get templates by category
export function getTemplatesByCategory(category: string): Template[] {
    if (category === 'all') return templates;
    return templates.filter(t => t.category === category);
}

// Re-export getTemplateById
export { getTemplateById };

// Async loader for client-side dynamic loading (optional, for lazy loading by category)
export async function loadTemplatesByCategory(category: string): Promise<Template[]> {
    // No async JSON fetch needed — templates are bundled
    return getTemplatesByCategory(category);
}
