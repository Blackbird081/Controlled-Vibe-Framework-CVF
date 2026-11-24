/* eslint-disable @typescript-eslint/no-require-imports */
'use strict';

const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const CONTRACT = 'EXTENSIONS/CVF_GUARD_CONTRACT/src';
const SOURCE_PATHS = Object.freeze({
    types: `${CONTRACT}/types.ts`,
    authorityGate: `${CONTRACT}/guards/authority-gate.guard.ts`,
    phaseGate: `${CONTRACT}/guards/phase-gate.guard.ts`,
    riskModel: 'docs/concepts/risk-model.md',
});
const OUTPUT_PATH = 'EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/generated/governance-model.generated.ts';
const REPO_ROOT = path.resolve(__dirname, '../../../..');
const normalizeNewlines = (source) => source.replace(/\r\n/g, '\n');

function declaration(source, kind, name) {
    const annotation = kind === 'const' ? '(?:\\s*:[^=\\r\\n]+)?' : '';
    const prefix = new RegExp(`^(?:export )?${kind} ${name}\\b${annotation}\\s*=\\s*`, 'gm');
    const matches = [...source.matchAll(prefix)];
    if (matches.length !== 1) throw new Error(`Expected one Local declaration of ${name}`);
    return source.slice(matches[0].index + matches[0][0].length);
}

// Read the named Local declarations as data. A computed expression requires an
// explicit projection update. No TypeScript or JavaScript source is executed.
function literalReader(source, name) {
    const tokenPattern = /\s+|\/\/[^\n]*|\/\*[\s\S]*?\*\/|'[^'\\\r\n]*'|"[^"\\\r\n]*"|[A-Za-z_$][\w$]*|\d+|[{}\[\]:,;|]/y;
    function read() {
        while (true) {
            const offset = tokenPattern.lastIndex;
            const match = tokenPattern.exec(source);
            if (!match) throw new Error(`${name}: expected a supported literal at offset ${offset}`);
            const token = match[0];
            if (!/^\s|^\/\//.test(token) && !token.startsWith('/*')) return token;
        }
    }

    let token = read();
    function take() {
        const previous = token;
        if (token !== ';') token = read();
        return previous;
    }
    function expect(expected) {
        if (token !== expected) throw new Error(`${name}: expected ${expected}, found ${token}`);
        take();
    }
    return { peek: () => token, take, expect };
}

function readLiteral(source, name, references = {}) {
    const reader = literalReader(declaration(source, 'const', name), name);

    function entries(end, append) {
        while (reader.peek() !== end) {
            append();
            if (reader.peek() === end) break;
            reader.expect(',');
        }
        reader.expect(end);
    }

    function value() {
        const token = reader.take();
        if (token === '{') {
            const result = Object.create(null);
            entries('}', () => {
                const key = reader.take();
                if (!/^[A-Za-z_$][\w$]*$/.test(key) || Object.hasOwn(result, key)) {
                    throw new Error(`${name}: invalid or duplicate property ${key}`);
                }
                reader.expect(':');
                result[key] = value();
            });
            return result;
        }
        if (token === '[') {
            const result = [];
            entries(']', () => result.push(value()));
            return result;
        }
        if (/^['"]/.test(token)) return token.slice(1, -1);
        if (/^\d+$/.test(token)) return Number(token);
        if (token === 'false' || token === 'true') return token === 'true';
        if (Object.hasOwn(references, token)) return references[token];
        throw new Error(`${name}: unsupported value ${token}`);
    }

    const result = value();
    reader.expect(';');
    return result;
}

function readStringUnion(source, name) {
    const reader = literalReader(declaration(source, 'type', name), name);
    const members = [];
    if (reader.peek() === '|') reader.take();
    while (true) {
        const token = reader.take();
        if (!/^'[A-Z0-9_]+'$/.test(token)) throw new Error(`${name}: expected a string literal`);
        members.push(token.slice(1, -1));
        if (reader.peek() !== '|') break;
        reader.take();
    }
    reader.expect(';');
    requireMembers(members, new Set(members), name);
    return members;
}

function requireMembers(actual, expected, label) {
    const members = Array.from(expected);
    if (!Array.isArray(actual) || actual.length !== members.length || new Set(actual).size !== actual.length
        || !actual.every((member) => members.includes(member))) {
        throw new Error(`${label}: invalid, duplicate, or missing members`);
    }
}

function requireKeys(value, keys, label) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error(`${label}: expected an object`);
    }
    requireMembers(Object.keys(value), keys, label);
}

function readRiskLabels(markdown, risks) {
    const start = markdown.indexOf('## Risk Levels:');
    const end = markdown.indexOf('\n## ', start + 1);
    if (start < 0 || end < 0) throw new Error('Missing Local risk levels section');
    const rows = markdown.slice(start, end).split('\n').filter((line) => /^\|\s*\*\*R\d/.test(line));
    const labels = Object.create(null);
    for (const row of rows) {
        const match = /^\|\s*\*\*(R\d+)\*\*\s*\|\s*([^|]+?)\s*\|/.exec(row);
        if (!match || Object.hasOwn(labels, match[1])) throw new Error(`Invalid or duplicate risk label row: ${row}`);
        labels[match[1]] = match[2];
    }
    requireKeys(labels, [...risks, 'R4'], 'Local risk labels');
    return labels;
}

function verifyAuthority(model) {
    requireKeys(model.phaseRoleMatrix, model.phaseOrder, 'PHASE_ROLE_MATRIX');
    requireKeys(model.authorityMatrix, model.roles, 'AUTHORITY_MATRIX');
    for (const phase of model.phaseOrder) {
        const phaseRoles = model.phaseRoleMatrix[phase];
        if (!Array.isArray(phaseRoles) || new Set(phaseRoles).size !== phaseRoles.length
            || !phaseRoles.every((role) => model.roles.includes(role))) {
            throw new Error(`PHASE_ROLE_MATRIX.${phase}: invalid or duplicate roles`);
        }
    }
    for (const role of model.roles) {
        const row = model.authorityMatrix[role];
        requireKeys(row, model.phaseOrder, `AUTHORITY_MATRIX.${role}`);
        for (const phase of model.phaseOrder) {
            const cell = row[phase];
            const label = `AUTHORITY_MATRIX.${role}.${phase}`;
            requireKeys(cell, ['allowed', 'allowedActions', 'maxRisk'], label);
            if (typeof cell.allowed !== 'boolean' || !model.riskOrder.includes(cell.maxRisk)
                || !Array.isArray(cell.allowedActions)
                || !cell.allowedActions.every((action) => typeof action === 'string' && action.trim())
                || cell.allowed !== (cell.allowedActions.length > 0)
                || new Set(cell.allowedActions).size !== cell.allowedActions.length) {
                throw new Error(`${label}: invalid risk or action data`);
            }
        }
    }
}

function renderProjection(repoRoot) {
    const sources = Object.fromEntries(Object.entries(SOURCE_PATHS).map(([name, file]) => [
        name, normalizeNewlines(fs.readFileSync(path.join(repoRoot, file), 'utf8')),
    ]));
    const phases = readStringUnion(sources.types, 'CanonicalCVFPhase');
    const roles = readStringUnion(sources.types, 'CVFRole');
    const risks = readStringUnion(sources.types, 'CVFRiskLevel');
    const phaseOrder = readLiteral(sources.types, 'PHASE_ORDER');
    const riskNumeric = readLiteral(sources.types, 'RISK_NUMERIC');
    requireMembers(phaseOrder, phases, 'PHASE_ORDER');
    requireKeys(riskNumeric, risks, 'RISK_NUMERIC');
    const riskOrder = [...risks].sort((left, right) => riskNumeric[left] - riskNumeric[right]);
    if (!riskOrder.every((risk, index) => riskNumeric[risk] === index)) {
        throw new Error('RISK_NUMERIC must provide a contiguous numeric order');
    }

    const forbidden = readLiteral(sources.authorityGate, 'FORBIDDEN');
    const authorityMatrix = readLiteral(sources.authorityGate, 'AUTHORITY_MATRIX', { FORBIDDEN: forbidden });
    const model = {
        schemaVersion: 1,
        sourceDigests: Object.fromEntries(Object.entries(SOURCE_PATHS).map(([name, file]) => [
            file, createHash('sha256').update(sources[name], 'utf8').digest('hex'),
        ])),
        phaseOrder,
        roles,
        riskOrder,
        riskLabels: readRiskLabels(sources.riskModel, risks),
        phaseRoleMatrix: readLiteral(sources.phaseGate, 'PHASE_ROLE_MATRIX'),
        authorityMatrix,
    };
    verifyAuthority(model);
    return [
        '/** AUTO-GENERATED by scripts/build-governance-model.js. DO NOT EDIT. */',
        `export const GENERATED_GOVERNANCE_MODEL = ${JSON.stringify(model, null, 2)} as const;`,
        '',
    ].join('\n');
}

function main(args) {
    let check = false;
    let repoRoot = REPO_ROOT;
    for (let index = 0; index < args.length; index += 1) {
        const arg = args[index];
        if (arg === '--check') {
            check = true;
        } else if (arg === '--repo-root' && args[index + 1] && !args[index + 1].startsWith('--')) {
            repoRoot = path.resolve(args[index + 1]);
            index += 1;
        } else {
            throw new Error('Usage: node scripts/build-governance-model.js [--check] [--repo-root <root>]');
        }
    }
    const expected = renderProjection(repoRoot);
    const output = path.join(repoRoot, OUTPUT_PATH);
    if (check) {
        if (normalizeNewlines(fs.readFileSync(output, 'utf8')) !== expected) {
            throw new Error(`Web governance model drift at ${OUTPUT_PATH}. Regenerate from Local sources.`);
        }
        console.log(`Web governance model projection matches Local sources: ${OUTPUT_PATH}`);
        return;
    }
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, expected, 'utf8');
    console.log(`Generated Web governance model: ${OUTPUT_PATH}`);
}

if (require.main === module) {
    try {
        main(process.argv.slice(2));
    } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
    }
}

module.exports = { renderProjection, SOURCE_PATHS, OUTPUT_PATH };
