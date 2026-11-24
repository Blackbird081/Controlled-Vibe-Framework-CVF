'use strict';

const { createRequire } = require('node:module');
const path = require('node:path');

function loadDatabase(resolveFrom) {
    try {
        const Database = resolveFrom('better-sqlite3');
        const database = new Database(':memory:');
        try {
            database.prepare('SELECT 1').get();
        } finally {
            database.close();
        }
        return Database;
    } catch {
        return null;
    }
}

function binding() {
    if (loadDatabase(require)) return 'web';
    try {
        const engine = createRequire(path.resolve(__dirname, '../../../CVF_EXECUTION_PLANE_FOUNDATION/package.json'));
        if (require('better-sqlite3/package.json').version !== engine('better-sqlite3/package.json').version) return 'unavailable';
        const Database = loadDatabase(engine);
        const installedWebCopy = require.cache[require.resolve('better-sqlite3')];
        if (!Database || !installedWebCopy) return 'unavailable';
        // Keep Node's resolution path. Reuse the same-version, tested package in this process.
        installedWebCopy.exports = Database;
        return 'execution-plane';
    } catch {
        return 'unavailable';
    }
}

const selected = binding();
if (require.main === module) process.stdout.write(selected + '\n');
