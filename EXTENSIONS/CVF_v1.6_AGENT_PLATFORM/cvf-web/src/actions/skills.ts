'use server';

import fs from 'fs';
import path from 'path';
import { Skill, SkillCategory } from '../types/skill';
import { loadUat, saveUat } from '@/lib/uat-store';

const SKILLS_ROOT = path.resolve(process.cwd(), '../../CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS');
const UAT_ROOT = process.env.CVF_UAT_ROOT
    ? path.resolve(process.env.CVF_UAT_ROOT)
    : path.resolve(process.cwd(), '../../../governance/skill-library/uat/results');
const UAT_REPORT_PATH = path.resolve(process.cwd(), '../../../governance/skill-library/uat/reports/uat_score_report.json');
const SPEC_REPORT_PATH = path.resolve(process.cwd(), '../../../governance/skill-library/registry/reports/spec_metrics_report.json');

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

function safeWriteFile(targetPath: string, content: string) {
    try {
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        fs.writeFileSync(targetPath, content, 'utf-8');
        return targetPath;
    } catch (err) {
        // Fallback to tmp to avoid crash on read-only FS
        try {
            const fallbackDir = path.resolve(process.cwd(), '.tmp-uat');
            fs.mkdirSync(fallbackDir, { recursive: true });
            const fallbackPath = path.join(fallbackDir, path.basename(targetPath));
            fs.writeFileSync(fallbackPath, content, 'utf-8');
            return fallbackPath;
        } catch (inner) {
            console.error('Failed to persist UAT content', inner);
            throw err;
        }
    }
}

function deriveTitleFromFilename(baseName: string): string {
    return baseName
        .split(/[_-]+/)
        .filter(Boolean)
        .map((word) => {
            const lower = word.toLowerCase();
            if (lower.length <= 2) return lower.toUpperCase();
            return lower.charAt(0).toUpperCase() + lower.slice(1);
        })
        .join(' ');
}

function isTitleTrustworthy(title: string, baseName: string): boolean {
    const cleanedTitle = title.trim();
    if (!cleanedTitle) return false;

    const baseTokens = baseName.split(/[_-]+/).filter((token) => token.length >= 3);
    if (baseTokens.length === 0) return true;

    const titleLower = cleanedTitle.toLowerCase();
    const matched = baseTokens.filter((token) => titleLower.includes(token)).length;
    const ratio = matched / baseTokens.length;

    const titleTokens = cleanedTitle.split(/\s+/).filter(Boolean);
    const shortTokens = titleTokens.filter((token) => token.length === 1);

    if (shortTokens.length >= Math.max(2, Math.floor(titleTokens.length / 3))) {
        return false;
    }

    return ratio >= 0.6;
}

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

const SPEC_SECTION_CHECKS: Array<{ label: string; weight: number; pattern: RegExp }> = [
    { label: 'purpose', weight: 20, pattern: /##\s+.*Mục đích/i },
    { label: 'formInput', weight: 15, pattern: /##\s+.*Form Input/i },
    { label: 'expectedOutput', weight: 15, pattern: /##\s+.*Expected Output/i },
    { label: 'validationHooks', weight: 10, pattern: /##\s+.*Validation Hooks/i },
    { label: 'executionConstraints', weight: 10, pattern: /##\s+.*Execution Constraints/i },
    { label: 'governanceSummary', weight: 10, pattern: /##\s+.*Governance Summary/i },
    { label: 'uatBinding', weight: 5, pattern: /##\s+.*UAT Binding/i },
    { label: 'examples', weight: 5, pattern: /##\s+.*Ví dụ thực tế/i },
];

function extractSectionByHeader(text: string, header: string): string {
    const pattern = new RegExp(`##\\s+${header}[\\s\\S]*?(?=##\\s+|$)`, 'i');
    const match = text.match(pattern);
    return match ? match[0] : '';
}

function countTableRows(section: string): number {
    const rows = section.split(/\r?\n/).filter(line => line.trim().startsWith('|'));
    if (rows.length <= 2) return 0;
    const dataRows = rows.slice(2);
    return dataRows.filter(row => row.split('|').map(part => part.trim()).filter(Boolean).length >= 2).length;
}

function countBullets(section: string): number {
    return section.split(/\r?\n/).filter(line => /^\s*[-*]\s+/.test(line)).length;
}

function hasCodeFence(section: string): boolean {
    return /```/.test(section);
}

function computeSpecGate(score: number): 'PASS' | 'CLARIFY' | 'FAIL' {
    if (score >= 85) return 'PASS';
    if (score >= 60) return 'CLARIFY';
    return 'FAIL';
}

function computeSpecScore(content?: string): { score: number; quality: string; gate: 'PASS' | 'CLARIFY' | 'FAIL' } {
    if (!content) {
        return { score: 0, quality: 'Not Ready', gate: 'FAIL' };
    }

    let score = 0;
    for (const check of SPEC_SECTION_CHECKS) {
        if (check.pattern.test(content)) {
            score += check.weight;
        }
    }

    const formSection = extractSectionByHeader(content, '📋\\s*Form Input');
    const expectedSection = extractSectionByHeader(content, '✅\\s*Expected Output');
    const validationSection = extractSectionByHeader(content, '✅\\s*Validation Hooks');
    const executionSection = extractSectionByHeader(content, '⛔\\s*Execution Constraints');

    if (formSection) {
        const rows = countTableRows(formSection);
        if (rows >= 4) score += 10;
    }
    if (expectedSection && hasCodeFence(expectedSection)) {
        score += 5;
    }
    if (validationSection && countBullets(validationSection) >= 3) {
        score += 5;
    }
    if (executionSection && countBullets(executionSection) >= 3) {
        score += 5;
    }

    score = Math.min(100, score);
    const quality = score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Needs Review' : 'Not Ready';
    return { score, quality, gate: computeSpecGate(score) };
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
        const content = await loadUat(skillId);
        if (!content) return null;
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
        const persistedPath = await saveUat(skillId, updated);
        return { content: updated, status: parseUatStatus(updated), path: persistedPath };
    } catch (error) {
        console.error('Failed to toggle UAT checkbox', error);
        return null;
    }
}

export async function saveUatContent(skillId: string, content: string) {
    try {
        const pathSaved = await saveUat(skillId, content);
        const status = parseUatStatus(content);
        const score = computeUatScore(content);
        return { content, status, score: score.score, quality: score.quality, path: pathSaved };
    } catch (error) {
        console.error('Failed to save UAT content', error);
        return null;
    }
}

export async function toggleUatCheckboxByLine(skillId: string, lineNumber: number) {
    try {
        const content = await loadUat(skillId);
        if (!content) return null;
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
        const persistedPath = await saveUat(skillId, updated);
        return { content: updated, status: parseUatStatus(updated), path: persistedPath };
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

function loadSpecReportMap(): Record<string, { spec_score?: number; spec_quality?: string; spec_gate?: string }> {
    try {
        if (!fs.existsSync(SPEC_REPORT_PATH)) {
            return {};
        }
        const raw = fs.readFileSync(SPEC_REPORT_PATH, 'utf-8');
        const data = JSON.parse(raw);
        if (!data || !Array.isArray(data.skills)) {
            return {};
        }
        const map: Record<string, { spec_score?: number; spec_quality?: string; spec_gate?: string }> = {};
        for (const entry of data.skills) {
            if (!entry || !entry.skill_id) continue;
            const rawId = String(entry.skill_id);
            const normalizedId = rawId.replace(/\.skill(\.md)?$/i, '');
            map[normalizedId] = {
                spec_score: entry.spec_score,
                spec_quality: entry.spec_quality,
                spec_gate: entry.spec_gate,
            };
        }
        return map;
    } catch (error) {
        console.error('Failed to load Spec metrics report', error);
        return {};
    }
}

export async function getSkillCategories(): Promise<SkillCategory[]> {
    const categories: SkillCategory[] = [];

    try {
        const uatReportMap = loadUatReportMap();
        const specReportMap = loadSpecReportMap();
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
                        const uatContent = await loadUat(file.replace('.skill.md', ''));
                        const skillId = file.replace('.skill.md', '');
                        const fallbackTitle = deriveTitleFromFilename(skillId);
                        const uatReport = uatReportMap[skillId];
                        const statusFromFile = parseUatStatus(uatContent);
                        const uatStatus = statusFromFile !== 'Not Run' ? statusFromFile : (uatReport?.status || statusFromFile);
                        const computed = computeUatScore(uatContent);
                        const uatScore = typeof uatReport?.final_score === 'number' ? uatReport.final_score : computed.score;
                        const uatQuality = uatReport?.quality || computed.quality;
                        const specReport = specReportMap[skillId];
                        const specComputed = computeSpecScore(content);
                        const specScore = typeof specReport?.spec_score === 'number' ? specReport.spec_score : specComputed.score;
                        const specQuality = specReport?.spec_quality || specComputed.quality;
                        const specGate = (specReport?.spec_gate as 'PASS' | 'CLARIFY' | 'FAIL') || specComputed.gate;

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

                        const titleCandidate = titleMatch ? titleMatch[1].trim() : '';
                        const finalTitle = isTitleTrustworthy(titleCandidate, skillId) ? titleCandidate : fallbackTitle;

                        skills.push({
                            id: skillId,
                            title: finalTitle,
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
                            uatScore,
                            uatQuality,
                            specScore,
                            specQuality,
                            specGate,
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

export async function getSkillDetail(domain: string, skillId: string): Promise<Skill | null> {
    try {
        const categoryPath = path.join(SKILLS_ROOT, domain);
        const filePath = path.join(categoryPath, `${skillId}.skill.md`);
        if (!fs.existsSync(filePath)) {
            return null;
        }

        const uatReportMap = loadUatReportMap();
        const specReportMap = loadSpecReportMap();
        const content = fs.readFileSync(filePath, 'utf-8');
        const uatContent = await loadUat(skillId);
        const uatReport = uatReportMap[skillId];
        const statusFromFile = parseUatStatus(uatContent);
        const uatStatus = statusFromFile !== 'Not Run' ? statusFromFile : (uatReport?.status || statusFromFile);
        const computed = computeUatScore(uatContent);
        const uatScore = typeof uatReport?.final_score === 'number' ? uatReport.final_score : computed.score;
        const uatQuality = uatReport?.quality || computed.quality;
        const specReport = specReportMap[skillId];
        const specComputed = computeSpecScore(content);
        const specScore = typeof specReport?.spec_score === 'number' ? specReport.spec_score : specComputed.score;
        const specQuality = specReport?.spec_quality || specComputed.quality;
        const specGate = (specReport?.spec_gate as 'PASS' | 'CLARIFY' | 'FAIL') || specComputed.gate;

        const titleMatch = content.match(/^#\s+(.+)$/m);
        const domainMatch = content.match(/>\s*\*\*Domain:\*\*\s*(.+)$/m);
        const difficultyMatch = content.match(/>\s*\*\*Difficulty:\*\*\s*(.+)$/m);
        const riskMatch = content.match(/\|\s*Risk Level\s*\|\s*([^|]+)\|/m);
        const rolesMatch = content.match(/\|\s*Allowed Roles\s*\|\s*([^|]+)\|/m);
        const phasesMatch = content.match(/\|\s*Allowed Phases\s*\|\s*([^|]+)\|/m);
        const scopeMatch = content.match(/\|\s*Authority Scope\s*\|\s*([^|]+)\|/m);
        const autonomyMatch = content.match(/\|\s*Autonomy\s*\|\s*([^|]+)\|/m);

        const domainValue = domainMatch ? domainMatch[1].trim() : domain;
        const fallbackRisk = DOMAIN_RISK_MAP[domain] || DOMAIN_RISK_MAP[domainValue.toLowerCase().replace(/ /g, '_')] || 'R1';
        const fallbackPhases = DOMAIN_PHASES_MAP[domain] || DOMAIN_PHASES_MAP[domainValue.toLowerCase().replace(/ /g, '_')] || 'Discovery, Design';
        const fallbackAutonomy = RISK_AUTONOMY[fallbackRisk] || 'Human confirmation required';
        const fallbackScope = fallbackRisk === 'R0' ? 'Informational' : (fallbackRisk === 'R3' || fallbackRisk === 'R4') ? 'Strategic' : 'Tactical';

        const titleCandidate = titleMatch ? titleMatch[1].trim() : '';
        const fallbackTitle = deriveTitleFromFilename(skillId);
        const finalTitle = isTitleTrustworthy(titleCandidate, skillId) ? titleCandidate : fallbackTitle;

        return {
            id: skillId,
            title: finalTitle,
            domain: domainValue,
            difficulty: difficultyMatch ? difficultyMatch[1].trim() : 'Unknown',
            summary: '',
            path: path.relative(process.cwd(), filePath),
            content,
            riskLevel: riskMatch ? riskMatch[1].trim() : fallbackRisk,
            allowedRoles: rolesMatch ? rolesMatch[1].trim() : 'User, Reviewer',
            allowedPhases: phasesMatch ? phasesMatch[1].trim() : fallbackPhases,
            authorityScope: scopeMatch ? scopeMatch[1].trim() : fallbackScope,
            autonomy: autonomyMatch ? autonomyMatch[1].trim() : fallbackAutonomy,
            uatStatus,
            uatContent,
            uatScore,
            uatQuality,
            specScore,
            specQuality,
            specGate,
        };
    } catch (error) {
        console.error('Error reading skill detail:', error);
        return null;
    }
}
