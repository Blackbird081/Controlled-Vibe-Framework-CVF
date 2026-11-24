/* eslint-disable @typescript-eslint/no-require-imports */
'use strict';

const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { serializeAsciiJson } = require('./skill-summary');

const packageId = /^cvf-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const packageRoot = 'docs/reference/agent_system_skills/packages';
const privateLicense = 'CVF_PRIVATE_GOVERNED';

function readAssfSource(repoRoot, skill) {
    if (!packageId.test(skill.skillId) || skill.canonicalRoot !== `${packageRoot}/${skill.skillId}/SKILL.md`) {
        throw new Error(`Invalid ASSF package root for ${skill.skillId}`);
    }
    const sourcePath = path.join(repoRoot, path.dirname(skill.canonicalRoot), 'skill.source.json');
    const raw = fs.readFileSync(sourcePath, 'utf8').replace(/\r\n/g, '\n');
    const source = JSON.parse(raw);
    const licenseMatches = typeof source.license === 'string' && source.license !== privateLicense
        ? /^[a-f0-9]{40}$/.test(source.upstreamCommit ?? '')
            && source.license.trim() !== ''
            && skill.license === `${source.license} upstream; ${privateLicense} adaptation metadata`
        : source.license === privateLicense && !source.upstreamCommit && skill.license === privateLicense;
    if (source.skillId !== skill.skillId || source.lifecycleState !== 'ACTIVE'
        || source.certificationState !== 'CERTIFIED' || source.uatState !== 'PASSED' || !licenseMatches) {
        throw new Error(`Unverified ASSF metadata or license binding for ${skill.skillId}`);
    }
    return {
        license: source.license,
        upstreamCommit: source.upstreamCommit ?? null,
        sourceSha256: createHash('sha256').update(raw).digest('hex'),
    };
}

function writeJevAssfRoster(repoRoot, entries, output) {
    const registered = entries.filter(skill =>
        skill?.status === 'ACTIVE' && skill.certificationState === 'CERTIFIED' && skill.uatState === 'PASSED');
    if (!registered.length || registered.length > 100 || new Set(registered.map(skill => skill.skillId)).size !== registered.length) {
        throw new Error('The Jev ASSF roster requires distinct active certified Local packages.');
    }

    const packages = registered.sort((a, b) => a.skillId.localeCompare(b.skillId)).map(skill => {
        const title = typeof skill.name === 'string' ? skill.name.trim() : '';
        const purpose = typeof skill.purpose === 'string' ? skill.purpose.trim() : '';
        const triggers = skill.triggerPatterns;
        if (!title || !purpose || !Array.isArray(triggers)
            || triggers.some(value => typeof value !== 'string' || !value.trim())) {
            throw new Error(`Missing Jev suggestion metadata for ${skill.skillId}`);
        }
        return {
            id: skill.skillId,
            title,
            purpose,
            triggers,
            source: readAssfSource(repoRoot, skill),
        };
    });

    const contents = serializeAsciiJson({ schema: 'cvf.ui01.jev-assf-roster.v1', packages });
    if (!fs.existsSync(output) || fs.readFileSync(output, 'utf8') !== contents) {
        fs.writeFileSync(output, contents);
    }
}

module.exports = { writeJevAssfRoster };
