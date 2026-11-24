const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');

function fingerprint(web, env) {
    const hash = createHash('sha256');
    const fields = Object.entries(env).filter(([name]) => name.startsWith('NEXT_PUBLIC_')).sort();
    hash.update(JSON.stringify([process.version, process.arch, fields]));
    function visit(file) {
        if (!fs.existsSync(file)) return;
        const stat = fs.lstatSync(file);
        if (stat.isDirectory()) {
            for (const name of fs.readdirSync(file).sort()) {
                if (!['node_modules', '.git', 'coverage', '.cvf'].includes(name) && !name.startsWith('.next')) {
                    visit(path.join(file, name));
                }
            }
        } else if (stat.isFile()) {
            hash.update(JSON.stringify([path.relative(web, file), stat.size]));
            hash.update(fs.readFileSync(file));
        }
    }
    const manifest = JSON.parse(fs.readFileSync(path.join(web, 'package.json'), 'utf8'));
    const files = ['src', 'public', 'scripts', 'package.json', 'package-lock.json', 'tsconfig.json', 'postcss.config.mjs', 'next.config.ts'];
    for (const file of files) visit(path.join(web, file));
    for (const dep of Object.values(manifest.dependencies ?? {}).sort()) {
        if (!dep.startsWith('file:')) continue;
        const base = path.resolve(web, dep.slice(5));
        for (const file of ['src', 'dist', 'package.json', 'package-lock.json', 'tsconfig.json']) {
            visit(path.join(base, file));
        }
    }
    return hash.digest('hex');
}

function main() {
    const web = path.resolve(__dirname, '..');
    require('@next/env').loadEnvConfig(web);
    const marker = path.join(web, '.next', 'cvf-launch-inputs');
    const provider = process.env.CVF_OAUTH_PROVIDER;
    if (process.argv[2] === 'check' && (!['github', 'google'].includes(provider)
        || !process.env[provider.toUpperCase() + '_ID'] || !process.env[provider.toUpperCase() + '_SECRET']
        || !process.env.CVF_OAUTH_IDENTITY_BINDINGS_JSON)) {
        console.log('sign-in-needed');
        return;
    }
    // Refresh the Local projections so edits outside the Web package enter the cache key.
    if (process.argv[2] === 'check') {
        for (const file of ['build-risk-models.js', 'build-governance-model.js', 'build-skill-index.js']) {
            execFileSync(process.execPath, [path.join(__dirname, file)], { cwd: web, stdio: ['ignore', 'ignore', 'inherit'] });
        }
    }
    const value = fingerprint(web, process.env);
    if (process.argv[2] === 'record') {
        if (process.argv[3] !== value) throw new Error('Build inputs changed while preparing the Web app. Open the launcher again.');
        fs.writeFileSync(marker, value);
    } else {
        const matches = fs.existsSync(path.join(web, '.next', 'BUILD_ID'))
            && fs.existsSync(marker) && fs.readFileSync(marker, 'utf8') === value;
        console.log(matches ? 'ready' : value);
    }
}

if (require.main === module) main();
module.exports = { fingerprint };
