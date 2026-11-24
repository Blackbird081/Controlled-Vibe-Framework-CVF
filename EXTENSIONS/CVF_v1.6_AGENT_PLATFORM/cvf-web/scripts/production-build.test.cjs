const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { fingerprint } = require('./production-build.cjs');

test('production cache follows source, local package edits, removals and demo mode', t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cvf-launch-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const web = path.join(root, 'web');
    for (const folder of ['web/src', 'linked/src']) fs.mkdirSync(path.join(root, folder), { recursive: true });
    fs.writeFileSync(path.join(web, 'package.json'), JSON.stringify({ dependencies: { linked: 'file:../linked' } }));
    const original = fingerprint(web, {});
    const file = path.join(root, 'linked/src/main.ts');
    fs.writeFileSync(file, 'A');
    const added = fingerprint(web, {});
    assert.notEqual(added, original);
    fs.writeFileSync(file, 'B');
    assert.notEqual(fingerprint(web, {}), added);
    fs.unlinkSync(file);
    assert.equal(fingerprint(web, {}), original);
    assert.notEqual(fingerprint(web, { NEXT_PUBLIC_CVF_MOCK_AI: '1' }), original);
});
