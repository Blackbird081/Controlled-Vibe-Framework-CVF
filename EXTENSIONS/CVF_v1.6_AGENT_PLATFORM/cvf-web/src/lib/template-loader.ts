/**
 * Template Loader — loads templates from external JSON.
 *
 * For server-side (SSR / API routes), reads from the filesystem.
 * For client-side, fetches from /data/templates.json.
 *
 * This module provides both sync (import-time) and async (fetch) access.
 */
import { Template } from '@/types';
import rawTemplates from '../../public/data/templates.json';

// Type-assert the imported JSON as Template[]
export const templates: Template[] = rawTemplates as unknown as Template[];

// Category info derived from templates
export const categories = Array.from(new Set(templates.map(t => t.category)));

// Get templates by category
export function getTemplatesByCategory(category: string): Template[] {
    if (category === 'all') return templates;
    return templates.filter(t => t.category === category);
}

// Get a single template by ID
export function getTemplateById(id: string): Template | undefined {
    return templates.find(t => t.id === id);
}

// Async loader for client-side dynamic loading (optional, for lazy loading by category)
export async function loadTemplatesByCategory(category: string): Promise<Template[]> {
    try {
        const res = await fetch(`/data/templates-${category}.json`);
        if (!res.ok) throw new Error(`Failed to load templates for ${category}`);
        return await res.json();
    } catch {
        // Fallback to full bundle
        return getTemplatesByCategory(category);
    }
}
