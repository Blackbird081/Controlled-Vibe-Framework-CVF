// Bundles the probe entry (production store/actor/security modules) into one CommonJS file for real peer processes.
// Usage: node nis-t1b-d-probe-build.mjs <output.cjs>
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'rolldown';

const here = path.dirname(fileURLToPath(import.meta.url));
const output = process.argv[2];
if (!output || !path.isAbsolute(output)) { console.error('Usage: node nis-t1b-d-probe-build.mjs <absolute output.cjs>'); process.exit(64); }
const stub = path.join(here, 'nis-t1b-d-probe-session-stub.mjs');
await build({
    input: path.join(here, 'nis-t1b-d-probe-entry.mjs'),
    platform: 'node',
    logLevel: 'silent',
    external: [/^node:/],
    output: { file: output, format: 'cjs' },
    plugins: [{
        name: 'nis-probe-session-stub',
        // Only the session verifier is substituted; no Auth.js/next-auth code runs in the probe processes.
        resolveId(source, importer) {
            return source === './middleware-auth' && /intent-spec-actor\.ts$/.test(importer ?? '') ? stub : null;
        },
    }],
});
console.log(JSON.stringify({ built: output }));
