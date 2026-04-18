'use strict';
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('fs');
const path = require('path');

const BASE_DIR = path.resolve(__dirname, '..');
const D2_MATRIX_PATH = path.resolve(BASE_DIR, '../../../docs/baselines/CVF_CORPUS_RESCREEN_D2_MATRIX_2026-04-15.md');
const D3_TRUSTED_SUBSET_PATH = path.resolve(BASE_DIR, '../../../docs/baselines/CVF_CORPUS_RESCREEN_D3_TRUSTED_SUBSET_2026-04-15.md');
const MAP_DATA_PATH = path.resolve(BASE_DIR, 'src/data/skill-template-map.json');

const TRUSTED = 'TRUSTED_FOR_VALUE_PROOF';
const REVIEW = 'REVIEW_REQUIRED';
const LEGACY = 'LEGACY_LOW_CONFIDENCE';
const REJECT = 'REJECT_FOR_NON_CODER_FRONTDOOR';
const UNSCREENED = 'UNSCREENED_LEGACY';

const CLASS_ORDER = [TRUSTED, REVIEW, LEGACY, REJECT, UNSCREENED];
const CLASS_PRIORITY = {
    [TRUSTED]: 5,
    [REVIEW]: 4,
    [LEGACY]: 3,
    [REJECT]: 2,
    [UNSCREENED]: 1,
};

function readFile(filePath) {
    return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '';
}

function extractSection(markdown, heading, nextHeadings) {
    const start = markdown.indexOf(heading);
    if (start === -1) return '';
    let end = markdown.length;
    for (const nextHeading of nextHeadings) {
        const idx = markdown.indexOf(nextHeading, start + heading.length);
        if (idx !== -1 && idx < end) {
            end = idx;
        }
    }
    return markdown.slice(start, end);
}

function collectTemplateIdsFromSection(section) {
    const ids = new Set();
    const regex = /`([^`]+)`/g;
    let match;
    while ((match = regex.exec(section)) !== null) {
        ids.add(match[1]);
    }
    return ids;
}

function loadTemplateClassMap() {
    const d2 = readFile(D2_MATRIX_PATH);
    const sections = {
        [TRUSTED]: extractSection(d2, '## TRUSTED_FOR_VALUE_PROOF', [
            '## REVIEW_REQUIRED',
            '## LEGACY_LOW_CONFIDENCE',
            '## REJECT_FOR_NON_CODER_FRONTDOOR',
        ]),
        [REVIEW]: extractSection(d2, '## REVIEW_REQUIRED', [
            '## LEGACY_LOW_CONFIDENCE',
            '## REJECT_FOR_NON_CODER_FRONTDOOR',
        ]),
        [LEGACY]: extractSection(d2, '## LEGACY_LOW_CONFIDENCE', [
            '## REJECT_FOR_NON_CODER_FRONTDOOR',
        ]),
        [REJECT]: extractSection(d2, '## REJECT_FOR_NON_CODER_FRONTDOOR', []),
    };

    const map = {};
    for (const [className, section] of Object.entries(sections)) {
        for (const templateId of collectTemplateIdsFromSection(section)) {
            map[templateId] = className;
        }
    }
    return map;
}

function loadTrustedBenchmarkSet() {
    const d3 = readFile(D3_TRUSTED_SUBSET_PATH);
    const section = extractSection(d3, '## Benchmark-Ready Subset', ['## §1']);
    return collectTemplateIdsFromSection(section);
}

function buildSkillGovernanceMap() {
    const templateClassMap = loadTemplateClassMap();
    const trustedBenchmarkSet = loadTrustedBenchmarkSet();
    const mapData = JSON.parse(readFile(MAP_DATA_PATH));
    const templateToSkillMap = mapData.templateToSkillMap || {};

    const skillMap = new Map();

    for (const [templateId, ref] of Object.entries(templateToSkillMap)) {
        const key = `${ref.domain}::${ref.skillId}`;
        const templateClass = templateClassMap[templateId] || UNSCREENED;
        const entry = skillMap.get(key) || {
            domain: ref.domain,
            skillId: ref.skillId,
            linkedTemplates: [],
        };
        entry.linkedTemplates.push({
            templateId,
            corpusClass: templateClass,
            trustedBenchmarkSurface: trustedBenchmarkSet.has(templateId),
        });
        skillMap.set(key, entry);
    }

    for (const entry of skillMap.values()) {
        const classSet = new Set(entry.linkedTemplates.map((item) => item.corpusClass));
        const sortedClasses = Array.from(classSet).sort((a, b) => (CLASS_PRIORITY[b] || 0) - (CLASS_PRIORITY[a] || 0));
        const primaryClass = sortedClasses[0] || UNSCREENED;
        const hasRestrictedLinks = classSet.has(REJECT) || classSet.has(LEGACY);
        const hasReviewLinks = classSet.has(REVIEW);
        const hasTrustedLinks = classSet.has(TRUSTED);
        const trustedBenchmarkSurface = entry.linkedTemplates.some((item) => item.trustedBenchmarkSurface);

        entry.corpusClass = primaryClass;
        entry.frontDoorVisible = primaryClass === TRUSTED || primaryClass === REVIEW;
        entry.trustedBenchmarkSurface = trustedBenchmarkSurface;
        entry.hasRestrictedLinks = hasRestrictedLinks;
        entry.hasReviewLinks = hasReviewLinks;
        entry.hasTrustedLinks = hasTrustedLinks;
        entry.frontDoorTier = primaryClass === TRUSTED
            ? (trustedBenchmarkSurface ? 'TRUSTED_BENCHMARK' : 'TRUSTED_SUPPORTING')
            : primaryClass === REVIEW
                ? 'REVIEW_REQUIRED'
                : 'QUARANTINED';
        entry.corpusNote = buildCorpusNote(entry);
    }

    return {
        templateClassMap,
        trustedBenchmarkSet,
        skillMap,
    };
}

function buildCorpusNote(entry) {
    if (entry.corpusClass === TRUSTED && entry.trustedBenchmarkSurface) {
        return 'Trusted benchmark surface under GC-044 / D3 trusted subset.';
    }
    if (entry.corpusClass === TRUSTED && entry.hasRestrictedLinks) {
        return 'Front-door trusted via at least one trusted template path; some linked template surfaces remain quarantined.';
    }
    if (entry.corpusClass === TRUSTED) {
        return 'Trusted supporting front-door surface under GC-044.';
    }
    if (entry.corpusClass === REVIEW) {
        return 'Visible with review-required posture; not benchmark truth until promoted.';
    }
    if (entry.corpusClass === LEGACY) {
        return 'Legacy low-confidence surface; quarantined from non-coder front door.';
    }
    if (entry.corpusClass === REJECT) {
        return 'Rejected for non-coder front door; may remain advanced/internal only.';
    }
    return 'Unscreened legacy surface; excluded from front-door truth until classified.';
}

function summarizeSkillGovernance(skillMap) {
    const summary = {
        totalMappedSkills: 0,
        trustedSkills: 0,
        reviewSkills: 0,
        quarantinedSkills: 0,
        trustedBenchmarkSkills: 0,
    };

    for (const entry of skillMap.values()) {
        summary.totalMappedSkills += 1;
        if (entry.corpusClass === TRUSTED) summary.trustedSkills += 1;
        else if (entry.corpusClass === REVIEW) summary.reviewSkills += 1;
        else summary.quarantinedSkills += 1;
        if (entry.trustedBenchmarkSurface) summary.trustedBenchmarkSkills += 1;
    }

    return summary;
}

function loadSkillCorpusGovernance() {
    const data = buildSkillGovernanceMap();
    return {
        ...data,
        summary: summarizeSkillGovernance(data.skillMap),
        classOrder: CLASS_ORDER.slice(),
        classes: { TRUSTED, REVIEW, LEGACY, REJECT, UNSCREENED },
    };
}

module.exports = {
    loadSkillCorpusGovernance,
};
