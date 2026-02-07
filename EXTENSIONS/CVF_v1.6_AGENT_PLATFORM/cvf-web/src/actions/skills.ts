'use server';

import fs from 'fs';
import path from 'path';
import { Skill, SkillCategory } from '../types/skill';

const SKILLS_ROOT = path.resolve(process.cwd(), '../../CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS');
const UAT_ROOT = path.resolve(process.cwd(), '../../../governance/skill-library/uat/results');
const UAT_REPORT_PATH = path.resolve(process.cwd(), '../../../governance/skill-library/uat/reports/uat_score_report.json');

const DOMAIN_RISK_MAP: Record<string, string> = {
    ai_ml_evaluation: 'R1',
    app_development: 'R1',
    business_analysis: 'R1',
    content_creation: 'R0',
    finance_analytics: 'R2',
    hr_operations: 'R2',
    legal_contracts: 'R2',
    marketing_seo: 'R1',
    product_ux: 'R1',
    security_compliance: 'R2',
    technical_review: 'R1',
    web_development: 'R1',
};

const DOMAIN_PHASES_MAP: Record<string, string> = {
    ai_ml_evaluation: 'Discovery, Design, Review',
    app_development: 'Discovery, Design, Build',
    business_analysis: 'Discovery',
    content_creation: 'Discovery, Design',
    finance_analytics: 'Discovery, Review',
    hr_operations: 'Discovery, Review',
    legal_contracts: 'Discovery, Review',
    marketing_seo: 'Discovery, Design',
    product_ux: 'Discovery, Design, Review',
    security_compliance: 'Design, Review',
    technical_review: 'Build, Review',
    web_development: 'Design, Build',
};

const RISK_AUTONOMY: Record<string, string> = {
    R0: 'Auto',
    R1: 'Auto + Audit',
    R2: 'Human confirmation required',
    R3: 'Suggest-only',
    R4: 'Blocked',
};

function parseUatStatus(content?: string): string {
    if (!content) return 'Not Run';
    const lines = content.split(/\r?\n/);
    const checkedFail = lines.find(line => /-\s*(?:\[[xX]\]|☑|✅)\s*FAIL\b/i.test(line));
    if (checkedFail) return 'FAIL';
    const checkedSoftFail = lines.find(line => /-\s*(?:\[[xX]\]|☑|✅)\s*SOFT FAIL\b/i.test(line));
    if (checkedSoftFail) return 'SOFT FAIL';
    const checkedPass = lines.find(line => /-\s*(?:\[[xX]\]|☑|✅)\s*PASS\b/i.test(line));
    if (checkedPass) return 'PASS';
    return 'Not Run';
}

function extractSection(text: string, start: string, end: string): string {
    const pattern = new RegExp(`##\\s+${start}[\\s\\S]*?(?=##\\s+${end})`, 'i');
    const match = text.match(pattern);
    return match ? match[0] : '';
}

function computeUatScore(content?: string): { score: number; quality: string } {
    if (!content) {
        return { score: 0, quality: 'Not Ready' };
    }

    const status = parseUatStatus(content);
    const decisionScore = status === 'PASS' ? 100 : status === 'SOFT FAIL' ? 60 : 0;

    let completenessScore = 0;
    const generalSection = extractSection(content, '0\\. General Information', '1\\. Risk Profile');
    if (generalSection) {
        const rows = generalSection.split(/\r?\n/).filter(line => line.trim().startsWith('|'));
        const parsedRows = rows
            .map(line => line.split('|').map(part => part.trim()).filter(Boolean))
            .filter(parts => parts.length >= 2 && parts[0].toLowerCase() !== 'field');
        const completed = parsedRows.filter(parts => parts[1]).length;
        completenessScore = parsedRows.length ? Math.round((completed / parsedRows.length) * 100) : 0;
    }

    let scenarioScore = 0;
    const scenarioSection = extractSection(content, 'B\\.3 Test Scenarios', 'C\\. Risk Containment Validation');
    if (scenarioSection) {
        const rows = scenarioSection.split(/\r?\n/).filter(line => line.trim().startsWith('|'));
        if (rows.length > 2) {
            const dataRows = rows.slice(2);
            const parsedRows = dataRows
                .map(line => line.split('|').map(part => part.trim()).filter(Boolean))
                .filter(parts => parts.length >= 5);
            const completed = parsedRows.filter(parts => parts[4]).length;
            scenarioScore = parsedRows.length ? Math.round((completed / parsedRows.length) * 100) : 0;
        }
    }

    const score = Math.round(0.5 * decisionScore + 0.3 * completenessScore + 0.2 * scenarioScore);
    const quality = score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 40 ? 'Needs Review' : 'Not Ready';
    return { score, quality };
}

function isCheckboxLine(line: string): boolean {
    return /^\s*[-*]\s+\[(?: |x|X)\]\s+/.test(line) || /^\s*[-*]\s+[☐☑]\s+/.test(line);
}

function toggleCheckboxLine(line: string): string {
    if (/\[[xX]\]/.test(line)) {
        return line.replace(/\[[xX]\]/, '[ ]');
    }
    if (/\[ \]/.test(line)) {
        return line.replace(/\[ \]/, '[x]');
    }
    if (/☑/.test(line)) {
        return line.replace('☑', '☐');
    }
    if (/☐/.test(line)) {
        return line.replace('☐', '☑');
    }
    return line;
}

function isCheckedLine(line: string): boolean {
    return /\[[xX]\]/.test(line) || /☑/.test(line) || /✅/.test(line);
}

function isDecisionLine(line: string): boolean {
    return /\bPASS\b/.test(line) || /\bSOFT FAIL\b/.test(line) || /\bFAIL\b/.test(line);
}

function isWithinDecisionSection(lines: string[], idx: number): boolean {
    for (let i = idx; i >= 0; i -= 1) {
        const line = lines[i].trim();
        if (line.startsWith('## ')) {
            return line.toLowerCase().includes('go-live decision');
        }
    }
    return false;
}

function uncheckLine(line: string): string {
    if (/\[[xX]\]/.test(line)) {
        return line.replace(/\[[xX]\]/, '[ ]');
    }
    if (/☑/.test(line)) {
        return line.replace('☑', '☐');
    }
    return line;
}

export async function toggleUatCheckboxByIndex(skillId: string, checkboxIndex: number) {
    try {
        const uatPath = path.join(UAT_ROOT, `UAT-${skillId}.md`);
        if (!fs.existsSync(uatPath)) {
            return null;
        }
        const content = fs.readFileSync(uatPath, 'utf-8');
        const lines = content.split(/\r?\n/);
        let targetLine = -1;
        let counter = -1;
        for (let i = 0; i < lines.length; i += 1) {
            if (!isCheckboxLine(lines[i])) continue;
            counter += 1;
            if (counter === checkboxIndex) {
                targetLine = i;
                break;
            }
        }
        if (targetLine < 0) {
            return null;
        }
        const wasChecked = isCheckedLine(lines[targetLine]);
        lines[targetLine] = toggleCheckboxLine(lines[targetLine]);

        if (isDecisionLine(lines[targetLine]) && isWithinDecisionSection(lines, targetLine)) {
            const nowChecked = isCheckedLine(lines[targetLine]);
            if (!wasChecked && nowChecked) {
                for (let i = targetLine - 1; i >= 0; i -= 1) {
                    if (lines[i].trim().startsWith('## ')) break;
                    if (isDecisionLine(lines[i])) {
                        lines[i] = uncheckLine(lines[i]);
                    }
                }
                for (let i = targetLine + 1; i < lines.length; i += 1) {
                    if (lines[i].trim().startsWith('## ')) break;
                    if (isDecisionLine(lines[i])) {
                        lines[i] = uncheckLine(lines[i]);
                    }
                }
            }
        }
        const updated = lines.join('\n');
        fs.writeFileSync(uatPath, updated, 'utf-8');
        return { content: updated, status: parseUatStatus(updated) };
    } catch (error) {
        console.error('Failed to toggle UAT checkbox', error);
        return null;
    }
}

export async function saveUatContent(skillId: string, content: string) {
    try {
        const uatPath = path.join(UAT_ROOT, `UAT-${skillId}.md`);
        if (!fs.existsSync(uatPath)) {
            return null;
        }
        fs.writeFileSync(uatPath, content, 'utf-8');
        const status = parseUatStatus(content);
        const score = computeUatScore(content);
        return { content, status, score: score.score, quality: score.quality };
    } catch (error) {
        console.error('Failed to save UAT content', error);
        return null;
    }
}

export async function toggleUatCheckboxByLine(skillId: string, lineNumber: number) {
    try {
        const uatPath = path.join(UAT_ROOT, `UAT-${skillId}.md`);
        if (!fs.existsSync(uatPath)) {
            return null;
        }
        const content = fs.readFileSync(uatPath, 'utf-8');
        const lines = content.split(/\r?\n/);
        const idx = Math.max(0, lineNumber - 1);
        if (!lines[idx]) {
            return null;
        }
        if (!isCheckboxLine(lines[idx])) {
            return null;
        }
        const wasChecked = isCheckedLine(lines[idx]);
        lines[idx] = toggleCheckboxLine(lines[idx]);

        if (isDecisionLine(lines[idx]) && isWithinDecisionSection(lines, idx)) {
            const nowChecked = isCheckedLine(lines[idx]);
            if (!wasChecked && nowChecked) {
                for (let i = idx - 1; i >= 0; i -= 1) {
                    if (lines[i].trim().startsWith('## ')) break;
                    if (isDecisionLine(lines[i])) {
                        lines[i] = uncheckLine(lines[i]);
                    }
                }
                for (let i = idx + 1; i < lines.length; i += 1) {
                    if (lines[i].trim().startsWith('## ')) break;
                    if (isDecisionLine(lines[i])) {
                        lines[i] = uncheckLine(lines[i]);
                    }
                }
            }
        }

        const updated = lines.join('\n');
        fs.writeFileSync(uatPath, updated, 'utf-8');
        return { content: updated, status: parseUatStatus(updated) };
    } catch (error) {
        console.error('Failed to toggle UAT checkbox', error);
        return null;
    }
}

function loadUatReportMap(): Record<string, { status?: string; final_score?: number; quality?: string }> {
    try {
        if (!fs.existsSync(UAT_REPORT_PATH)) {
            return {};
        }
        const raw = fs.readFileSync(UAT_REPORT_PATH, 'utf-8');
        const data = JSON.parse(raw);
        if (!data || !Array.isArray(data.skills)) {
            return {};
        }
        const map: Record<string, { status?: string; final_score?: number; quality?: string }> = {};
        for (const entry of data.skills) {
            if (!entry || !entry.skill_id) continue;
            map[entry.skill_id] = {
                status: entry.status,
                final_score: entry.final_score,
                quality: entry.quality,
            };
        }
        return map;
    } catch (error) {
        console.error('Failed to load UAT report', error);
        return {};
    }
}

export async function getSkillCategories(): Promise<SkillCategory[]> {
    const categories: SkillCategory[] = [];

    try {
        const uatReportMap = loadUatReportMap();
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
                        const uatPath = path.join(UAT_ROOT, `UAT-${file.replace('.skill.md', '')}.md`);
                        const uatContent = fs.existsSync(uatPath) ? fs.readFileSync(uatPath, 'utf-8') : '';
                        const skillId = file.replace('.skill.md', '');
                        const uatReport = uatReportMap[skillId];
                        const statusFromFile = parseUatStatus(uatContent);
                        const uatStatus = statusFromFile !== 'Not Run' ? statusFromFile : (uatReport?.status || statusFromFile);
                        const computed = computeUatScore(uatContent);

                        // Basic parsing of metadata
                        const titleMatch = content.match(/^#\s+(.+)$/m);
                        const domainMatch = content.match(/>\s*\*\*Domain:\*\*\s*(.+)$/m);
                        const difficultyMatch = content.match(/>\s*\*\*Difficulty:\*\*\s*(.+)$/m);
                        const riskMatch = content.match(/\|\s*Risk Level\s*\|\s*([^|]+)\|/m);
                        const rolesMatch = content.match(/\|\s*Allowed Roles\s*\|\s*([^|]+)\|/m);
                        const phasesMatch = content.match(/\|\s*Allowed Phases\s*\|\s*([^|]+)\|/m);
                        const scopeMatch = content.match(/\|\s*Authority Scope\s*\|\s*([^|]+)\|/m);
                        const autonomyMatch = content.match(/\|\s*Autonomy\s*\|\s*([^|]+)\|/m);

                        const domainValue = domainMatch ? domainMatch[1].trim() : folderName;
                        const fallbackRisk = DOMAIN_RISK_MAP[folderName] || DOMAIN_RISK_MAP[domainValue.toLowerCase().replace(/ /g, '_')] || 'R1';
                        const fallbackPhases = DOMAIN_PHASES_MAP[folderName] || DOMAIN_PHASES_MAP[domainValue.toLowerCase().replace(/ /g, '_')] || 'Discovery, Design';
                        const fallbackAutonomy = RISK_AUTONOMY[fallbackRisk] || 'Human confirmation required';
                        const fallbackScope = fallbackRisk === 'R0' ? 'Informational' : (fallbackRisk === 'R3' || fallbackRisk === 'R4') ? 'Strategic' : 'Tactical';

                        skills.push({
                            id: skillId,
                            title: titleMatch ? titleMatch[1].trim() : file,
                            domain: domainValue,
                            difficulty: difficultyMatch ? difficultyMatch[1].trim() : 'Unknown',
                            summary: '', // Could extract first paragraph
                            path: path.relative(process.cwd(), filePath), // Store relative path for debugging or display
                            content: content,
                            riskLevel: riskMatch ? riskMatch[1].trim() : fallbackRisk,
                            allowedRoles: rolesMatch ? rolesMatch[1].trim() : 'User, Reviewer',
                            allowedPhases: phasesMatch ? phasesMatch[1].trim() : fallbackPhases,
                            authorityScope: scopeMatch ? scopeMatch[1].trim() : fallbackScope,
                            autonomy: autonomyMatch ? autonomyMatch[1].trim() : fallbackAutonomy,
                            uatStatus,
                            uatContent,
                            uatScore: computed.score,
                            uatQuality: computed.quality,
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
