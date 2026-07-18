/* eslint-disable @typescript-eslint/no-require-imports */
'use strict';

const fs = require('fs');
const path = require('path');
const { loadSkillCorpusGovernance } = require('./skill-corpus-governance');

const BASE_DIR = path.resolve(__dirname, '..');
const SKILLS_ROOT = path.resolve(BASE_DIR, '../../CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS');
const UAT_ROOT = path.resolve(BASE_DIR, '../../../governance/skill-library/uat/results');
const UAT_REPORT_PATH = path.resolve(BASE_DIR, '../../../governance/skill-library/uat/reports/uat_score_report.json');
const SPEC_REPORT_PATH = path.resolve(BASE_DIR, '../../../governance/skill-library/registry/reports/spec_metrics_report.json');
const ASSF_INDEX_PATH = path.resolve(BASE_DIR, '../../../docs/reference/agent_system_skills/generated/skill-index.json');
const ASSF_CONTROL_PLANE_INVENTORY_PATH = path.resolve(BASE_DIR, '../../../docs/reference/agent_system_skills/control_plane/generated/skill-inventory.json');
const PUBLIC_INDEX_PATH = path.resolve(BASE_DIR, 'public', 'data', 'skills-index.json');
const PUBLIC_CONTROL_PLANE_PATH = path.resolve(BASE_DIR, 'public', 'data', 'assf-skill-control-plane.json');

const DOMAIN_RISK_MAP = {
    ai_ml_evaluation: 'R1',
    app_development: 'R1',
    business_analysis: 'R1',
    content_creation: 'R0',
    finance_analytics: 'R2',
    hr_operations: 'R2',
    legal_contracts: 'R2',
    marketing_seo: 'R1',
    non_coder_workflow: 'R1',
    product_ux: 'R1',
    security_compliance: 'R2',
    technical_review: 'R1',
    web_development: 'R1',
};

const DOMAIN_PHASES_MAP = {
    ai_ml_evaluation: 'Discovery, Design, Review',
    app_development: 'Discovery, Design, Build',
    business_analysis: 'Discovery',
    content_creation: 'Discovery, Design',
    finance_analytics: 'Discovery, Review',
    hr_operations: 'Discovery, Review',
    legal_contracts: 'Discovery, Review',
    marketing_seo: 'Discovery, Design',
    non_coder_workflow: 'Discovery, Design, Build, Review',
    product_ux: 'Discovery, Design, Review',
    security_compliance: 'Design, Review',
    technical_review: 'Build, Review',
    web_development: 'Design, Build',
};

const RISK_AUTONOMY = {
    R0: 'Auto',
    R1: 'Auto + Audit',
    R2: 'Human confirmation required',
    R3: 'Suggest-only',
    R4: 'Blocked',
};

function toPosixPath(value) {
    return String(value || '').replace(/\\/g, '/');
}

function deriveTitleFromFilename(baseName) {
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

function isTitleTrustworthy(title, baseName) {
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

function parseUatStatus(content) {
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

function extractSection(text, start, end) {
    const pattern = new RegExp(`##\\s+${start}[\\s\\S]*?(?=##\\s+${end})`, 'i');
    const match = text.match(pattern);
    return match ? match[0] : '';
}

function computeUatScore(content) {
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

const SPEC_SECTION_CHECKS = [
    { label: 'purpose', weight: 20, pattern: /##\s+.*Mục đích/i },
    { label: 'formInput', weight: 15, pattern: /##\s+.*Form Input/i },
    { label: 'expectedOutput', weight: 15, pattern: /##\s+.*Expected Output/i },
    { label: 'validationHooks', weight: 10, pattern: /##\s+.*Validation Hooks/i },
    { label: 'executionConstraints', weight: 10, pattern: /##\s+.*Execution Constraints/i },
    { label: 'governanceSummary', weight: 10, pattern: /##\s+.*Governance Summary/i },
    { label: 'uatBinding', weight: 5, pattern: /##\s+.*UAT Binding/i },
    { label: 'examples', weight: 5, pattern: /##\s+.*Ví dụ thực tế/i },
];

function extractSectionByHeader(text, header) {
    const pattern = new RegExp(`##\\s+${header}[\\s\\S]*?(?=##\\s+|$)`, 'i');
    const match = text.match(pattern);
    return match ? match[0] : '';
}

function countTableRows(section) {
    const rows = section.split(/\r?\n/).filter(line => line.trim().startsWith('|'));
    if (rows.length <= 2) return 0;
    const dataRows = rows.slice(2);
    return dataRows.filter(row => row.split('|').map(part => part.trim()).filter(Boolean).length >= 2).length;
}

function countBullets(section) {
    return section.split(/\r?\n/).filter(line => /^\s*[-*]\s+/.test(line)).length;
}

function hasCodeFence(section) {
    return /```/.test(section);
}

function computeSpecGate(score) {
    if (score >= 85) return 'PASS';
    if (score >= 60) return 'CLARIFY';
    return 'FAIL';
}

function computeSpecScore(content) {
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

function loadUatReportMap() {
    try {
        if (!fs.existsSync(UAT_REPORT_PATH)) {
            return {};
        }
        const raw = fs.readFileSync(UAT_REPORT_PATH, 'utf-8');
        const data = JSON.parse(raw);
        if (!data || !Array.isArray(data.skills)) {
            return {};
        }
        const map = {};
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

function loadSpecReportMap() {
    try {
        if (!fs.existsSync(SPEC_REPORT_PATH)) {
            return {};
        }
        const raw = fs.readFileSync(SPEC_REPORT_PATH, 'utf-8');
        const data = JSON.parse(raw);
        if (!data || !Array.isArray(data.skills)) {
            return {};
        }
        const map = {};
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

function loadExistingPublicSkillRecords() {
    try {
        if (!fs.existsSync(PUBLIC_INDEX_PATH)) {
            return new Map();
        }
        const raw = fs.readFileSync(PUBLIC_INDEX_PATH, 'utf-8');
        const data = JSON.parse(raw);
        if (!data || !Array.isArray(data.categories)) {
            return new Map();
        }
        const records = new Map();
        for (const category of data.categories) {
            if (!category || !Array.isArray(category.skills)) continue;
            for (const skill of category.skills) {
                if (!skill || !skill.id) continue;
                records.set(`${category.id}::${skill.id}`, skill);
            }
        }
        return records;
    } catch (error) {
        console.warn('Failed to load existing public skill records', error);
        return new Map();
    }
}

function loadAssfSkillIndex() {
    try {
        if (!fs.existsSync(ASSF_INDEX_PATH)) {
            return { claimBoundary: '', skills: [] };
        }
        const raw = fs.readFileSync(ASSF_INDEX_PATH, 'utf-8');
        const data = JSON.parse(raw);
        if (!data || !Array.isArray(data.skills)) {
            return { claimBoundary: '', skills: [] };
        }
        return {
            claimBoundary: typeof data.claimBoundary === 'string' ? data.claimBoundary : '',
            skills: data.skills,
        };
    } catch (error) {
        console.error('Failed to load ASSF skill index', error);
        return { claimBoundary: '', skills: [] };
    }
}

function loadAssfControlPlaneInventory() {
    try {
        if (!fs.existsSync(ASSF_CONTROL_PLANE_INVENTORY_PATH)) {
            return { claimBoundary: '', records: [], summary: {} };
        }
        const raw = fs.readFileSync(ASSF_CONTROL_PLANE_INVENTORY_PATH, 'utf-8');
        const data = JSON.parse(raw);
        if (!data || !Array.isArray(data.records)) {
            return { claimBoundary: '', records: [], summary: {} };
        }
        return {
            claimBoundary: typeof data.claimBoundary === 'string' ? data.claimBoundary : '',
            records: data.records,
            summary: data.summary || {},
        };
    } catch (error) {
        console.error('Failed to load ASSF control plane inventory', error);
        return { claimBoundary: '', records: [], summary: {} };
    }
}

function buildControlPlaneProjectionRecord(record) {
    const registry = record.registry || {};
    const selection = record.selection || {};
    const runtime = record.runtime || {};
    const activation = record.activation || {};
    const cliMcp = record.cliMcp || {};
    const packageRoot = record.packageRoot || {};
    const truth = record.truth || {};

    return {
        skillId: record.skillId,
        title: registry.name || deriveTitleFromFilename(record.skillId || 'assf-package'),
        primaryDomain: selection.primaryDomain || 'Agent System Skills',
        domainGroup: selection.domainGroup || 'agent_system_skills',
        secondaryDomains: Array.isArray(selection.secondaryDomains) ? selection.secondaryDomains : [],
        recommendedWhen: Array.isArray(selection.recommendedWhen) ? selection.recommendedWhen : [],
        notRecommendedWhen: Array.isArray(selection.notRecommendedWhen) ? selection.notRecommendedWhen : [],
        specSignals: Array.isArray(selection.specSignals) ? selection.specSignals : [],
        selectionKeywords: Array.isArray(selection.selectionKeywords) ? selection.selectionKeywords : [],
        outputGoals: Array.isArray(selection.outputGoals) ? selection.outputGoals : [],
        intendedUsers: Array.isArray(selection.intendedUsers) ? selection.intendedUsers : [],
        agentUseCases: Array.isArray(selection.agentUseCases) ? selection.agentUseCases : [],
        expectedOutputContribution: selection.expectedOutputContribution || null,
        runtimeEligible: runtime.eligible === true,
        activationDecision: activation.decision || null,
        cliMcpDisposition: cliMcp.disposition || registry.externalCliMcpDisposition || null,
        packageRootPath: packageRoot.rootPath || registry.canonicalRoot || null,
        registryEntryPath: registry.canonicalRoot || null,
        certificationState: registry.certificationState || null,
        uatState: registry.uatState || null,
        truthStatus: truth.truthStatus || null,
        verificationMode: truth.verificationMode || null,
        runtimeEligibility: truth.runtimeEligibility || null,
        authorityCeiling: registry.authorityCeiling || null,
        adapterContract: cliMcp.adapterContract || registry.adapterContract || null,
    };
}

function buildAssfControlPlaneProjection(inventory) {
    const runtimeRecords = inventory.records
        .filter((record) => record && record.runtime && record.runtime.eligible === true)
        .map(buildControlPlaneProjectionRecord)
        .sort((a, b) => a.skillId.localeCompare(b.skillId));

    return {
        schemaVersion: '0.1.0',
        generatedAt: new Date().toISOString(),
        sourceInventory: toPosixPath(path.relative(BASE_DIR, ASSF_CONTROL_PLANE_INVENTORY_PATH)),
        sourceSkillIndex: toPosixPath(path.relative(BASE_DIR, ASSF_INDEX_PATH)),
        dashboardContract: 'Read-only CVF Web projection of Skill Control Plane inventory. Web dashboards may consume this file for display and filtering, but it is not runtime authority, activation authority, provider authority, or public certification authority.',
        summary: {
            assfRegistryEntries: inventory.summary.assfRegistryEntries || 0,
            packageRoots: inventory.summary.packageRoots || 0,
            runtimeEligiblePackages: inventory.summary.runtimeEligiblePackages || 0,
            activeResolverReadyPackages: inventory.summary.activeResolverReadyPackages || 0,
            cliMcpAdapterPackages: inventory.summary.cliMcpAdapterPackages || 0,
            selectionProfiledPackages: inventory.summary.selectionProfiledPackages || 0,
            webProjectionItems: inventory.summary.webProjectionItems || 0,
            crossSurfaceDriftViolationCount: inventory.summary.crossSurfaceDriftViolationCount || 0,
            projectedRuntimePackages: runtimeRecords.length,
        },
        runtimePackages: runtimeRecords,
        claimBoundary: inventory.claimBoundary || 'Projection read model only; no runtime authority is granted.',
    };
}

function buildAssfContent(skill, claimBoundary, controlPlaneRecord) {
    const lines = [
        `# ${skill.name || skill.skillId}`,
        '',
        skill.purpose || 'ASSF package metadata projection.',
        '',
        '## Projection Boundary',
        claimBoundary || 'Metadata-only projection. No package activation or execution authority is granted.',
        '',
        '## Source Trace',
        `- Canonical root: ${skill.canonicalRoot || 'N/A with reason: source root not declared'}`,
        `- Certification state: ${skill.certificationState || 'UNKNOWN'}`,
        `- UAT state: ${skill.uatState || 'UNKNOWN'}`,
        `- External CLI/MCP disposition: ${skill.externalCliMcpDisposition || 'UNKNOWN'}`,
    ];

    if (controlPlaneRecord) {
        lines.push(
            `- Runtime eligible: ${controlPlaneRecord.runtimeEligible ? 'true' : 'false'}`,
            `- Activation decision: ${controlPlaneRecord.activationDecision || 'UNKNOWN'}`,
            `- Primary domain: ${controlPlaneRecord.primaryDomain || 'Agent System Skills'}`,
        );
    }

    if (Array.isArray(skill.reviewArtifacts) && skill.reviewArtifacts.length > 0) {
        lines.push('', '## Review Artifacts');
        for (const artifact of skill.reviewArtifacts) {
            lines.push(`- ${artifact}`);
        }
    }

    return lines.join('\n');
}

function buildAssfProjectedSkills(controlPlaneProjection) {
    const assfIndex = loadAssfSkillIndex();
    const projectedSkills = [];
    const controlPlaneById = new Map(
        (controlPlaneProjection.runtimePackages || []).map((record) => [record.skillId, record]),
    );

    for (const skill of assfIndex.skills) {
        if (!skill || skill.certificationState !== 'CERTIFIED' || skill.uatState !== 'PASSED') {
            continue;
        }
        const controlPlaneRecord = controlPlaneById.get(skill.skillId);

        projectedSkills.push({
            id: skill.skillId,
            title: skill.name || deriveTitleFromFilename(skill.skillId || 'assf-package'),
            domain: (controlPlaneRecord && controlPlaneRecord.primaryDomain) || 'Agent System Skills',
            difficulty: 'Governed',
            summary: skill.purpose || 'Certified ASSF package metadata projection.',
            path: skill.canonicalRoot || '',
            content: buildAssfContent(skill, assfIndex.claimBoundary, controlPlaneRecord),
            riskLevel: skill.riskProfile || skill.riskCeiling || 'R0',
            allowedRoles: Array.isArray(skill.roles) ? skill.roles.join(', ') : 'User, Reviewer',
            allowedPhases: Array.isArray(skill.phases) ? skill.phases.join(', ') : 'Discovery, Review',
            authorityScope: skill.authorityCeiling || 'Read-only metadata projection',
            autonomy: 'Read-only metadata projection',
            uatStatus: skill.uatState,
            uatQuality: 'Passed',
            specGate: skill.certificationState,
            corpusClass: 'AGENT_SYSTEM_SKILL_PACKAGE',
            frontDoorVisible: true,
            frontDoorTier: 'ASSF_CERTIFIED',
            trustedBenchmarkSurface: false,
            hasRestrictedLinks: false,
            linkedTemplates: [],
            corpusNote: 'ASSF certified package metadata projection; certificationState is separate from corpusClass.',
            assfProjectionClass: 'CERTIFIED_PACKAGE_PROJECTION',
            certificationState: skill.certificationState,
            uatState: skill.uatState,
            reviewArtifacts: Array.isArray(skill.reviewArtifacts) ? skill.reviewArtifacts : [],
            canonicalRoot: skill.canonicalRoot,
            externalCliMcpDisposition: skill.externalCliMcpDisposition,
            adapterContract: skill.adapterContract,
            runtimePackageProjection: Boolean(controlPlaneRecord),
            runtimeEligible: controlPlaneRecord ? controlPlaneRecord.runtimeEligible : false,
            activationDecision: controlPlaneRecord ? controlPlaneRecord.activationDecision : undefined,
            primaryDomain: controlPlaneRecord ? controlPlaneRecord.primaryDomain : undefined,
            domainGroup: controlPlaneRecord ? controlPlaneRecord.domainGroup : undefined,
            selectionKeywords: controlPlaneRecord ? controlPlaneRecord.selectionKeywords : [],
            specSignals: controlPlaneRecord ? controlPlaneRecord.specSignals : [],
            recommendedWhen: controlPlaneRecord ? controlPlaneRecord.recommendedWhen : [],
            notRecommendedWhen: controlPlaneRecord ? controlPlaneRecord.notRecommendedWhen : [],
            outputGoals: controlPlaneRecord ? controlPlaneRecord.outputGoals : [],
            projectionClaimBoundary: assfIndex.claimBoundary,
        });
    }

    return projectedSkills;
}

function buildSkillIndex() {
    if (!fs.existsSync(SKILLS_ROOT)) {
        console.warn(`Skills root not found: ${SKILLS_ROOT}`);
        return { categories: [], meta: {} };
    }

    const uatReportMap = loadUatReportMap();
    const specReportMap = loadSpecReportMap();
    const corpusGovernance = loadSkillCorpusGovernance();
    const categories = [];
    let totalScannedSkills = 0;
    let nonPublicSkills = 0;
    const existingPublicSkillRecords = loadExistingPublicSkillRecords();
    const assfControlPlaneInventory = loadAssfControlPlaneInventory();
    const assfControlPlaneProjection = buildAssfControlPlaneProjection(assfControlPlaneInventory);
    const assfProjectedSkills = buildAssfProjectedSkills(assfControlPlaneProjection);

    const entries = fs.readdirSync(SKILLS_ROOT, { withFileTypes: true });
    for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const folderName = entry.name;
        if (folderName.startsWith('.')) continue;

        const categoryPath = path.join(SKILLS_ROOT, folderName);
        const files = fs.readdirSync(categoryPath);
        const visibleSkills = [];

        for (const file of files) {
            if (!file.endsWith('.skill.md')) continue;
            const filePath = path.join(categoryPath, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const skillId = file.replace('.skill.md', '');
            totalScannedSkills += 1;
            const uatPath = path.join(UAT_ROOT, `UAT-${skillId}.md`);
            const uatContent = fs.existsSync(uatPath) ? fs.readFileSync(uatPath, 'utf-8') : '';
            const fallbackTitle = deriveTitleFromFilename(skillId);

            const uatReport = uatReportMap[skillId];
            const statusFromFile = parseUatStatus(uatContent);
            const uatStatus = statusFromFile !== 'Not Run' ? statusFromFile : (uatReport && uatReport.status) || statusFromFile;
            const computed = computeUatScore(uatContent);
            const uatScore = typeof (uatReport && uatReport.final_score) === 'number' ? uatReport.final_score : computed.score;
            const uatQuality = (uatReport && uatReport.quality) || computed.quality;

            const specReport = specReportMap[skillId];
            const specComputed = computeSpecScore(content);
            const specScore = typeof (specReport && specReport.spec_score) === 'number' ? specReport.spec_score : specComputed.score;
            const specQuality = (specReport && specReport.spec_quality) || specComputed.quality;
            const specGate = (specReport && specReport.spec_gate) || specComputed.gate;

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
            const governanceKey = `${folderName}::${skillId}`;
            const governanceEntry = corpusGovernance.skillMap.get(governanceKey);

            const titleCandidate = titleMatch ? titleMatch[1].trim() : '';
            const finalTitle = isTitleTrustworthy(titleCandidate, skillId) ? titleCandidate : fallbackTitle;

            const skillRecord = {
                id: skillId,
                title: finalTitle,
                domain: domainValue,
                difficulty: difficultyMatch ? difficultyMatch[1].trim() : 'Unknown',
                summary: '',
                path: path.relative(BASE_DIR, filePath),
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
                corpusClass: governanceEntry ? governanceEntry.corpusClass : corpusGovernance.classes.UNSCREENED,
                frontDoorVisible: governanceEntry ? governanceEntry.frontDoorVisible : false,
                frontDoorTier: governanceEntry ? governanceEntry.frontDoorTier : 'QUARANTINED',
                trustedBenchmarkSurface: governanceEntry ? governanceEntry.trustedBenchmarkSurface : false,
                hasRestrictedLinks: governanceEntry ? governanceEntry.hasRestrictedLinks : false,
                linkedTemplates: governanceEntry ? governanceEntry.linkedTemplates : [],
                corpusNote: governanceEntry ? governanceEntry.corpusNote : 'Unscreened legacy surface; excluded from front-door truth until classified.',
            };
            const existingPublicSkill = existingPublicSkillRecords.get(`${folderName}::${skillId}`);
            if (existingPublicSkill && typeof existingPublicSkill.content === 'string') {
                // Keep this projection tranche from refreshing unrelated legacy
                // skill markdown content in the generated public index.
                skillRecord.content = existingPublicSkill.content;
            }
            if (existingPublicSkill && typeof existingPublicSkill.uatContent === 'string') {
                skillRecord.uatContent = existingPublicSkill.uatContent;
            }

            if (skillRecord.frontDoorVisible) {
                visibleSkills.push(skillRecord);
            } else {
                nonPublicSkills += 1;
            }
        }

        const categoryName = folderName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        if (visibleSkills.length > 0) {
            categories.push({
                id: folderName,
                name: categoryName,
                skills: visibleSkills,
            });
        }

        // Non-public skills are intentionally not serialized to the web bundle.
        // Git history and source files remain the audit trail; the product surface
        // only exposes agent-ready public skills with a governed template path.
    }

    if (assfProjectedSkills.length > 0) {
        categories.push({
            id: 'agent_system_skills',
            name: 'Agent System Skills',
            skills: assfProjectedSkills,
        });
    }

    return {
        generatedAt: new Date().toISOString(),
        categories,
        meta: {
            totalScannedSkills,
            frontDoorSkills: categories.reduce((sum, category) => sum + category.skills.length, 0),
            quarantinedSkills: nonPublicSkills,
            trustedMappedSkills: corpusGovernance.summary.trustedSkills,
            reviewMappedSkills: corpusGovernance.summary.reviewSkills,
            trustedBenchmarkSkills: corpusGovernance.summary.trustedBenchmarkSkills,
            governanceSource: [...corpusGovernance.sourcePaths, toPosixPath(path.relative(BASE_DIR, ASSF_INDEX_PATH))],
            assfProjectedSkills: assfProjectedSkills.length,
            certifiedPackageProjections: assfProjectedSkills.filter((skill) => skill.assfProjectionClass === 'CERTIFIED_PACKAGE_PROJECTION').length,
            runtimePackageProjections: assfProjectedSkills.filter((skill) => skill.runtimePackageProjection === true).length,
            skillControlPlaneProjection: toPosixPath(path.relative(BASE_DIR, PUBLIC_CONTROL_PLANE_PATH)),
        },
        assfControlPlaneProjection,
    };
}

function normalizeIndexPayload(payload) {
    if (!payload || typeof payload !== 'object') {
        return payload;
    }

    const normalized = { ...payload };
    delete normalized.generatedAt;
    return normalized;
}

function writeIndex(indexPayload) {
    const outDir = path.resolve(BASE_DIR, 'public', 'data');
    fs.mkdirSync(outDir, { recursive: true });
    const outPath = PUBLIC_INDEX_PATH;
    if (fs.existsSync(outPath)) {
        try {
            const existingRaw = fs.readFileSync(outPath, 'utf-8');
            const existingPayload = JSON.parse(existingRaw);
            const existingNormalized = normalizeIndexPayload(existingPayload);
            const nextNormalized = normalizeIndexPayload(indexPayload);

            if (JSON.stringify(existingNormalized) === JSON.stringify(nextNormalized)) {
                return { outPath, updated: false };
            }
        } catch (error) {
            console.warn(`Rewriting skills index after parse mismatch: ${outPath}`, error);
        }
    }

    fs.writeFileSync(outPath, JSON.stringify(indexPayload, null, 2));
    return { outPath, updated: true };
}

function writeControlPlaneProjection(projectionPayload) {
    const outDir = path.resolve(BASE_DIR, 'public', 'data');
    fs.mkdirSync(outDir, { recursive: true });
    const outPath = PUBLIC_CONTROL_PLANE_PATH;
    const normalizedPayload = normalizeIndexPayload(projectionPayload);
    if (fs.existsSync(outPath)) {
        try {
            const existingRaw = fs.readFileSync(outPath, 'utf-8');
            const existingPayload = JSON.parse(existingRaw);
            if (JSON.stringify(normalizeIndexPayload(existingPayload)) === JSON.stringify(normalizedPayload)) {
                return { outPath, updated: false };
            }
        } catch (error) {
            console.warn(`Rewriting ASSF control plane projection after parse mismatch: ${outPath}`, error);
        }
    }

    fs.writeFileSync(outPath, JSON.stringify(projectionPayload, null, 2));
    return { outPath, updated: true };
}

const indexPayload = buildSkillIndex();
const controlPlaneProjection = indexPayload.assfControlPlaneProjection;
delete indexPayload.assfControlPlaneProjection;
const { outPath: controlPlaneOutPath, updated: controlPlaneUpdated } = writeControlPlaneProjection(controlPlaneProjection);
const { outPath, updated } = writeIndex(indexPayload);
console.log(`${controlPlaneUpdated ? 'Generated' : 'Reused'} ASSF control plane projection: ${controlPlaneOutPath}`);
console.log(`${updated ? 'Generated' : 'Reused'} skill index: ${outPath}`);
console.log(`Front-door categories: ${indexPayload.categories.length}`);
console.log(`Front-door skills: ${indexPayload.meta.frontDoorSkills}`);
console.log(`Quarantined skills: ${indexPayload.meta.quarantinedSkills}`);
