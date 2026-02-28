/* eslint-disable @typescript-eslint/no-require-imports */
'use strict';

const fs = require('fs');
const path = require('path');

const BASE_DIR = path.resolve(__dirname, '..');
const CANONICAL_RISK_MODELS_DIR = path.resolve(
    BASE_DIR,
    '../../CVF_v1.7.3_RUNTIME_ADAPTER_HUB/risk_models'
);
const OUTPUT_FILE = path.resolve(BASE_DIR, 'src/lib/generated/risk-models.generated.ts');

const RISK_MATRIX_FILE = path.join(CANONICAL_RISK_MODELS_DIR, 'risk.matrix.json');
const DESTRUCTIVE_RULES_FILE = path.join(CANONICAL_RISK_MODELS_DIR, 'destructive.rules.json');
const ESCALATION_THRESHOLDS_FILE = path.join(CANONICAL_RISK_MODELS_DIR, 'escalation.thresholds.json');

function readJson(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Missing canonical risk model file: ${filePath}`);
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function getNumeric(input, keyPath) {
    const value = keyPath.reduce((acc, key) => (acc && acc[key] != null ? acc[key] : undefined), input);
    if (typeof value !== 'number' || Number.isNaN(value)) {
        throw new Error(`Invalid numeric value at "${keyPath.join('.')}"`);
    }
    return value;
}

function scoreToCategory(score) {
    if (score >= 90) return 'critical';
    if (score >= 70) return 'dangerous';
    if (score >= 40) return 'caution';
    return 'safe';
}

function buildRiskMatrix(rawRiskMatrix) {
    const mappedIntents = [
        { intent: 'FILE_READ', labelVi: 'Doc tep', labelEn: 'File Read', source: ['filesystem', 'read'] },
        { intent: 'FILE_WRITE', labelVi: 'Ghi tep', labelEn: 'File Write', source: ['filesystem', 'write'] },
        { intent: 'FILE_DELETE', labelVi: 'Xoa tep', labelEn: 'File Delete', source: ['filesystem', 'delete'] },
        { intent: 'EMAIL_SEND', labelVi: 'Gui email', labelEn: 'Email Send', source: ['email', 'send'] },
        { intent: 'API_CALL', labelVi: 'Goi API ngoai', labelEn: 'External API Call', source: ['http', 'external_call'] },
        { intent: 'CODE_EXECUTION', labelVi: 'Thuc thi shell', labelEn: 'Shell Execution', source: ['shell', 'execute'] },
        { intent: 'DATA_EXPORT', labelVi: 'Xuat du lieu', labelEn: 'Data Export', source: ['http', 'post'] },
        { intent: 'SHELL_COMMAND', labelVi: 'Lenh shell', labelEn: 'Shell Command', source: ['shell', 'execute'] },
        { intent: 'DB_WRITE', labelVi: 'Ghi co so du lieu', labelEn: 'Database Write', source: ['database', 'write'] },
        { intent: 'DB_DELETE', labelVi: 'Xoa co so du lieu', labelEn: 'Database Drop/Delete', source: ['database', 'drop'] },
    ];

    return mappedIntents.map((item) => {
        const baseScore = getNumeric(rawRiskMatrix, item.source);
        return {
            intent: item.intent,
            label: { vi: item.labelVi, en: item.labelEn },
            baseScore,
            category: scoreToCategory(baseScore),
        };
    });
}

function buildDestructiveRules(rawDestructiveRules) {
    const patterns = rawDestructiveRules && Array.isArray(rawDestructiveRules.destructive_patterns)
        ? rawDestructiveRules.destructive_patterns
        : [];

    const flattened = [];
    for (const patternGroup of patterns) {
        const riskBoost = typeof patternGroup.risk_increase === 'number' ? patternGroup.risk_increase : 0;
        const matches = Array.isArray(patternGroup.match) ? patternGroup.match : [];
        for (const pattern of matches) {
            if (typeof pattern !== 'string' || !pattern.trim()) continue;
            flattened.push({
                pattern,
                label: {
                    vi: `Mau nguy hiem: ${pattern}`,
                    en: `Destructive pattern: ${pattern}`,
                },
                riskBoost,
            });
        }
    }

    return flattened;
}

function buildEscalationThresholds(rawEscalation) {
    const thresholds = rawEscalation && rawEscalation.thresholds ? rawEscalation.thresholds : {};
    const allowMax = getNumeric(thresholds, ['allow', 'max_score']);
    const reviewMin = getNumeric(thresholds, ['review', 'min_score']);
    const reviewMax = getNumeric(thresholds, ['review', 'max_score']);
    const sandboxMin = getNumeric(thresholds, ['sandbox', 'min_score']);
    const sandboxMax = getNumeric(thresholds, ['sandbox', 'max_score']);
    const denyMin = getNumeric(thresholds, ['deny', 'min_score']);

    return [
        {
            level: 'ALLOW',
            minScore: 0,
            maxScore: allowMax,
            action: 'EXECUTE',
            color: 'bg-emerald-500',
            label: { vi: 'Cho phep', en: 'Allow' },
        },
        {
            level: 'REVIEW',
            minScore: reviewMin,
            maxScore: reviewMax,
            action: 'REVIEW',
            color: 'bg-amber-500',
            label: { vi: 'Can duyet', en: 'Review' },
        },
        {
            level: 'SANDBOX',
            minScore: sandboxMin,
            maxScore: sandboxMax,
            action: 'SANDBOX',
            color: 'bg-orange-500',
            label: { vi: 'Chay sandbox', en: 'Sandbox' },
        },
        {
            level: 'DENY',
            minScore: denyMin,
            maxScore: 100,
            action: 'BLOCK',
            color: 'bg-red-500',
            label: { vi: 'Tu choi', en: 'Deny' },
        },
    ];
}

function writeGeneratedFile(riskMatrix, destructiveRules, escalationThresholds) {
    const output = `/**
 * AUTO-GENERATED FILE. DO NOT EDIT.
 * Source of truth:
 * - ../../CVF_v1.7.3_RUNTIME_ADAPTER_HUB/risk_models/risk.matrix.json
 * - ../../CVF_v1.7.3_RUNTIME_ADAPTER_HUB/risk_models/destructive.rules.json
 * - ../../CVF_v1.7.3_RUNTIME_ADAPTER_HUB/risk_models/escalation.thresholds.json
 */

export const GENERATED_RISK_MATRIX = ${JSON.stringify(riskMatrix, null, 4)};

export const GENERATED_DESTRUCTIVE_RULES = ${JSON.stringify(destructiveRules, null, 4)};

export const GENERATED_ESCALATION_THRESHOLDS = ${JSON.stringify(escalationThresholds, null, 4)};
`;

    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, output);
}

function main() {
    const riskMatrixJson = readJson(RISK_MATRIX_FILE);
    const destructiveRulesJson = readJson(DESTRUCTIVE_RULES_FILE);
    const escalationThresholdsJson = readJson(ESCALATION_THRESHOLDS_FILE);

    const riskMatrix = buildRiskMatrix(riskMatrixJson);
    const destructiveRules = buildDestructiveRules(destructiveRulesJson);
    const escalationThresholds = buildEscalationThresholds(escalationThresholdsJson);

    writeGeneratedFile(riskMatrix, destructiveRules, escalationThresholds);

    console.log(`Generated risk models: ${OUTPUT_FILE}`);
    console.log(`Risk matrix entries: ${riskMatrix.length}`);
    console.log(`Destructive rules: ${destructiveRules.length}`);
    console.log(`Escalation thresholds: ${escalationThresholds.length}`);
}

main();
