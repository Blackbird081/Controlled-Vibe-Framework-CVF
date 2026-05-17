'use server';

import fs from 'fs';
import path from 'path';
import { Skill, SkillCategory } from '../types/skill';

const SKILLS_ROOT = path.resolve(process.cwd(), '../../CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS');

export async function getSkillCategories(): Promise<SkillCategory[]> {
    const categories: SkillCategory[] = [];

    try {
        const entries = fs.readdirSync(SKILLS_ROOT, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.isDirectory()) {
                const categoryPath = path.join(SKILLS_ROOT, entry.name);
                const folderName = entry.name;

                // Skip hidden folders or non-skill folders if needed
                if (folderName.startsWith('.')) continue;

                const skills: Skill[] = [];
                const files = fs.readdirSync(categoryPath);

                for (const file of files) {
                    if (file.endsWith('.skill.md')) {
                        const filePath = path.join(categoryPath, file);
                        const content = fs.readFileSync(filePath, 'utf-8');

                        // Basic parsing of metadata
                        const titleMatch = content.match(/^#\s+(.+)$/m);
                        const domainMatch = content.match(/>\s*\*\*Domain:\*\*\s*(.+)$/m);
                        const difficultyMatch = content.match(/>\s*\*\*Difficulty:\*\*\s*(.+)$/m);

                        skills.push({
                            id: file.replace('.skill.md', ''),
                            title: titleMatch ? titleMatch[1].trim() : file,
                            domain: domainMatch ? domainMatch[1].trim() : folderName,
                            difficulty: difficultyMatch ? difficultyMatch[1].trim() : 'Unknown',
                            summary: '', // Could extract first paragraph
                            path: path.relative(process.cwd(), filePath), // Store relative path for debugging or display
                            content: content
                        });
                    }
                }

                if (skills.length > 0) {
                    // Check for potential category name in _index.md if it exists, otherwise simplify folder name
                    let categoryName = folderName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

                    categories.push({
                        id: folderName,
                        name: categoryName,
                        skills: skills
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error reading skills:', error);
        return [];
    }

    return categories;
}
