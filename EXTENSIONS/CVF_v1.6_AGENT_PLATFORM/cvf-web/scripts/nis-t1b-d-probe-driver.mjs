// NIS-T1B-D transaction probe driver (parent and real second-process peer roles).
// Invoked by nis-t1b-d-transaction-probe.ps1; run with --help for options. Synthetic roots only, no secrets printed.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const HELP = `Usage: node nis-t1b-d-probe-driver.mjs --bundle <probe.cjs> --root <synthetic private root> --out <evidence.json> [--barrier-timeout-ms <n>]
  Parent role runs six real-process scenarios against FileIntentSpecAcceptanceStore.createIfAbsent and writes secret-safe JSON evidence.
  --barrier-timeout-ms  deadlock-safety timeout only (default 30000); it is never used as ordering proof.
  Exit codes: 0 all fields exercised and passed; 2 a field failed or cannot be exercised on this host; 64 usage.`;
const args = process.argv.slice(2);
const opt = name => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
if (args.includes('--help')) { console.log(HELP); process.exit(0); }
const bundle = opt('bundle');
const root = opt('root');
const role = opt('role') ?? 'parent';
if (!bundle || !root || !path.isAbsolute(bundle) || !path.isAbsolute(root)) { console.error(HELP); process.exit(64); }
process.env.NODE_ENV = 'test';
const lib = createRequire(import.meta.url)(bundle);

const emit = (event, extra = {}) => process.stdout.write(JSON.stringify({ event, pid: process.pid, ...extra }) + '\n');

// ---------------------------------------------------------------- peer role
if (role === 'peer') {
    const label = opt('label');
    const userId = opt('user');
    const fail = opt('fail') ?? 'none';
    const actor = await lib.syntheticActor(userId);
    const store = new lib.FileIntentSpecAcceptanceStore(root, actor, Date.now, {
        security: lib.windowsPrivateSecurity, lockTimeoutMs: Number(opt('lock-timeout-ms') ?? 60000),
        instrumentation: {
            onContended: () => emit('CONTENDED'),
            afterAcquire: () => {
                emit('ENTERED');
                if (fail === 'after-acquire') { emit('FAULT_INJECTED', { point: 'AFTER_ACQUIRE_BEFORE_MUTATION' }); throw new Error('INJECTED_AFTER_ACQUIRE_BEFORE_MUTATION'); }
            },
            afterSecurityMutation: () => {
                emit('SECURITY_MUTATED');
                if (fail === 'after-security') { emit('FAULT_INJECTED', { point: 'AFTER_SECURITY_MUTATION' }); throw new Error('INJECTED_AFTER_SECURITY_MUTATION'); }
            },
        },
    });
    const candidate = await lib.prepareSyntheticCandidate(actor, label);
    emit('READY');
    await new Promise(resolve => {
        let buffer = '';
        process.stdin.on('data', chunk => { buffer += chunk; if (buffer.includes('START_ATTEMPT')) resolve(); });
    });
    emit('ATTEMPTING');
    try {
        const receipt = await lib.commitIntentSpecAcceptanceCandidate(actor, candidate, store);
        emit('COMPLETE', { ok: true, id: receipt.id, state: receipt.state });
    } catch (error) {
        emit('COMPLETE', { ok: false, error: error.message });
    }
    process.exit(0);
}

// -------------------------------------------------------------- parent role
const out = opt('out');
const barrierMs = Number(opt('barrier-timeout-ms') ?? 30000);
if (!out) { console.error(HELP); process.exit(64); }
const started = process.hrtime.bigint();
const nowMs = () => Number((process.hrtime.bigint() - started) / 1000n) / 1000;

/** Real second process; the parent is the single ordering authority (seq is parent observation order). */
function spawnPeer({ user, label, fail = 'none', log, name }) {
    const child = spawn(process.execPath, [fileURLToPath(import.meta.url), '--role', 'peer', '--bundle', bundle, '--root', root,
        '--user', user, '--label', label, '--fail', fail], { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true, env: { ...process.env, NODE_ENV: 'test' } });
    const waiters = [];
    const seen = [];
    let stderr = '';
    let buffer = '';
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.stdout.on('data', chunk => {
        buffer += chunk;
        let index;
        while ((index = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, index); buffer = buffer.slice(index + 1);
            if (!line.trim()) continue;
            const message = JSON.parse(line);
            const entry = log(name, message.event, { pid: message.pid, ...(message.ok === undefined ? {} : { ok: message.ok, error: message.error, id: message.id }) });
            seen.push({ message, entry });
            for (const waiter of waiters.splice(0)) waiter();
        }
    });
    const exited = new Promise(resolve => child.on('exit', code => resolve(code)));
    const wait = event => new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`BARRIER_TIMEOUT waiting for ${name}:${event}`)), barrierMs);
        const check = () => {
            const hit = seen.find(item => item.message.event === event);
            if (hit) { clearTimeout(timer); resolve(hit.message); } else waiters.push(check);
        };
        check();
    });
    return { child, wait, exited, stderr: () => stderr, pid: child.pid, start: () => { log('parent', 'START_ATTEMPT', { target: name }); child.stdin.write('START_ATTEMPT\n'); } };
}

function newLog() {
    const events = [];
    const log = (source, event, extra = {}) => { const entry = { seq: events.length + 1, source, event, tMs: Number(nowMs().toFixed(3)), ...extra }; events.push(entry); return entry; };
    return { events, log };
}

/** REJECT_ENTRY_BEFORE_PARENT_RELEASE: the peer may enter only after the parent's own release event. */
function orderingOracle(events) {
    const release = events.find(e => e.event === 'PARENT_RELEASE');
    const entered = events.find(e => e.source === 'peer' && e.event === 'ENTERED');
    const attempting = events.find(e => e.source === 'peer' && e.event === 'ATTEMPTING');
    if (!release || !entered || !attempting) return { verdict: 'REJECT', reason: 'REQUIRED_EVENT_MISSING' };
    if (entered.seq < release.seq) return { verdict: 'REJECT', reason: 'ENTRY_BEFORE_PARENT_RELEASE', enteredSeq: entered.seq, releaseSeq: release.seq };
    return { verdict: 'ACCEPT', reason: 'ENTRY_AFTER_PARENT_RELEASE', enteredSeq: entered.seq, releaseSeq: release.seq };
}
// Synthetic oracle self-test: the oracle must itself reject an early entry and accept a valid order.
const syntheticOracle = {
    earlyEntry: orderingOracle([{ seq: 1, source: 'peer', event: 'ATTEMPTING' }, { seq: 2, source: 'peer', event: 'ENTERED' }, { seq: 3, source: 'parent', event: 'PARENT_RELEASE' }]).verdict,
    validOrder: orderingOracle([{ seq: 1, source: 'peer', event: 'ATTEMPTING' }, { seq: 2, source: 'parent', event: 'PARENT_RELEASE' }, { seq: 3, source: 'peer', event: 'ENTERED' }]).verdict,
};

const exists = target => fs.promises.lstat(target).then(() => true, () => false);
async function parentStore(userId, instrumentation) {
    const actor = await lib.syntheticActor(userId);
    return { actor, store: new lib.FileIntentSpecAcceptanceStore(root, actor, Date.now, { security: lib.windowsPrivateSecurity, lockTimeoutMs: 60000, instrumentation }) };
}
const lockPath = store => path.join(root, `${store.namespace}.lock`);
const namespacePath = store => path.join(root, store.namespace);
async function listRecords(store) { return (await exists(namespacePath(store))) ? fs.promises.readdir(namespacePath(store)) : null; }

const evidence = { schemaVersion: 'cvf.nisT1bDTransactionProbe.v1', profile: 'WINDOWS_SINGLE_HOST_PRIVATE_V1', parentPid: process.pid, node: process.version, platform: process.platform, syntheticRoot: root, scenarios: {}, limitations: [] };

// 1. Positive ordering: parent holds the production lock; the real peer blocks inside acquire until PARENT_RELEASE.
async function orderingPositive() {
    const { events, log } = newLog();
    let release; const gate = new Promise(resolve => { release = resolve; });
    let holderEntered; const entered = new Promise(resolve => { holderEntered = resolve; });
    const user = 'probe_ordering';
    const { actor, store } = await parentStore(user, { afterAcquire: async () => { log('parent', 'HOLDER_ENTERED'); holderEntered(); await gate; } });
    const holderCandidate = await lib.prepareSyntheticCandidate(actor, 'holder');
    const holder = lib.commitIntentSpecAcceptanceCandidate(actor, holderCandidate, store);
    const holderSettled = holder.then(value => ({ ok: true, value }), error => ({ ok: false, error: error.message }));
    // Safety timeout only: ordering below is established by events, never by elapsed time.
    await Promise.race([entered, new Promise((_, reject) => setTimeout(() => reject(new Error('BARRIER_TIMEOUT waiting for parent:HOLDER_ENTERED')), barrierMs).unref())]);
    const peer = spawnPeer({ user, label: 'peer-ordering', log, name: 'peer' });
    await peer.wait('READY');
    peer.start();
    await peer.wait('ATTEMPTING');
    await peer.wait('CONTENDED'); // deterministic: peer is blocked inside the production lock acquire
    log('parent', 'PARENT_RELEASE'); release();
    const holderResult = await holderSettled;
    await peer.wait('ENTERED');
    const complete = await peer.wait('COMPLETE');
    const code = await peer.exited;
    const peerCandidate = complete.ok ? complete.id : null;
    return {
        events, oracle: orderingOracle(events), holderResult: { ok: holderResult.ok, id: holderResult.value?.id ?? null }, peerResult: { ok: complete.ok, id: peerCandidate, exitCode: code },
        peerPid: peer.pid, lockReleased: !(await exists(lockPath(store))), records: await listRecords(store),
        bothRecordsPresent: holderResult.ok && complete.ok && (await store.read(holderResult.value.id)) !== null && (await store.read(peerCandidate)) !== null,
        namespaceDir: namespacePath(store), recordFile: holderResult.ok ? path.join(namespacePath(store), `${holderResult.value.id}.json`) : null,
    };
}

// 2. Negative control: with no lock holder the peer enters at once; the oracle must REJECT because PARENT_RELEASE has not happened.
async function orderingNegativeControl() {
    const { events, log } = newLog();
    const peer = spawnPeer({ user: 'probe_negative_control', label: 'peer-control', log, name: 'peer' });
    await peer.wait('READY');
    peer.start();
    await peer.wait('ATTEMPTING');
    await peer.wait('ENTERED');
    log('parent', 'PARENT_RELEASE');
    const complete = await peer.wait('COMPLETE');
    await peer.exited;
    return { events, oracle: orderingOracle(events), peerResult: { ok: complete.ok }, peerPid: peer.pid, syntheticOracle };
}

// 3. Post-acquire failure: the peer fails after acquiring; cleanup is proven by a SUBSEQUENT real peer acquiring.
async function postAcquireFailure() {
    const { events, log } = newLog();
    const user = 'probe_post_acquire';
    const { store } = await parentStore(user, {});
    const failing = spawnPeer({ user, label: 'failing-peer', fail: 'after-acquire', log, name: 'failingPeer' });
    await failing.wait('READY'); failing.start(); await failing.wait('ATTEMPTING'); await failing.wait('ENTERED');
    const failedComplete = await failing.wait('COMPLETE'); await failing.exited;
    const afterFailure = { lockPresent: await exists(lockPath(store)), namespacePresent: await exists(namespacePath(store)) };
    const next = spawnPeer({ user, label: 'subsequent-peer', log, name: 'subsequentPeer' });
    await next.wait('READY'); next.start(); await next.wait('ATTEMPTING'); await next.wait('ENTERED');
    const nextComplete = await next.wait('COMPLETE'); await next.exited;
    return {
        events, point: 'AFTER_ACQUIRE_BEFORE_MUTATION', failingPeer: { pid: failing.pid, ok: failedComplete.ok, error: failedComplete.error },
        afterFailure, subsequentPeer: { pid: next.pid, ok: nextComplete.ok, entered: events.some(e => e.source === 'subsequentPeer' && e.event === 'ENTERED') },
        lockReleasedAfterSubsequent: !(await exists(lockPath(store))), recordsAfterSubsequent: await listRecords(store),
    };
}

// 4. Rollback adversaries: real peer fails after the production security mutation; semantic pre-state must be restored.
async function rollback(kind) {
    const { events, log } = newLog();
    const user = `probe_rollback_${kind.toLowerCase()}`;
    const { store } = await parentStore(user, {});
    await fs.promises.mkdir(namespacePath(store));
    let fixtureError = null;
    try { await lib.applyAdversary(namespacePath(store), kind); } catch (error) { fixtureError = error.message; }
    const before = await lib.measureSecurity(namespacePath(store));
    const result = { kind, fixtureCreated: fixtureError === null, fixtureDiagnostic: fixtureError, preStateTuple: before.tuple, preStatePrivate: lib.isPrivateSecurity(before) };
    if (fixtureError !== null) {
        // Cannot construct this pre-state with the current token: the field is NOT exercised and NOT claimed.
        await fs.promises.rm(namespacePath(store), { recursive: true, force: true });
        return { ...result, exercised: false, passed: false, status: 'UNEXERCISABLE_ON_THIS_HOST' };
    }
    const peer = spawnPeer({ user, label: `rollback-${kind}`, fail: 'after-security', log, name: 'peer' });
    await peer.wait('READY'); peer.start(); await peer.wait('ATTEMPTING');
    const complete = await peer.wait('COMPLETE'); await peer.exited;
    const after = await lib.measureSecurity(namespacePath(store));
    const securityMutated = events.some(e => e.event === 'SECURITY_MUTATED');
    const equal = isDeepStrictEqual(before.tuple, after.tuple);
    const recordsAfterRollback = await listRecords(store);
    const lockReleased = !(await exists(lockPath(store)));
    // Positive control on the same namespace: with no injected fault the production path privatizes it.
    const control = spawnPeer({ user, label: `control-${kind}`, log, name: 'controlPeer' });
    await control.wait('READY'); control.start(); await control.wait('ATTEMPTING');
    const controlComplete = await control.wait('COMPLETE'); await control.exited;
    const finalMeasure = await lib.measureSecurity(namespacePath(store));
    return {
        ...result, exercised: true, peerPid: peer.pid, peerFailure: complete.error, securityMutatedBeforeFailure: securityMutated,
        postRollbackTuple: after.tuple, semanticPreStateEqualsPostRollback: equal, recordsAfterRollback,
        lockReleased, controlRun: { ok: controlComplete.ok, privateAfter: lib.isPrivateSecurity(finalMeasure) },
        passed: !complete.ok && equal && securityMutated && recordsAfterRollback.length === 0 && lockReleased,
        status: !complete.ok && equal && securityMutated && recordsAfterRollback.length === 0 && lockReleased ? 'PASSED' : 'FAILED', events,
    };
}

async function guarded(name, run) {
    try { evidence.scenarios[name] = await run(); }
    catch (error) { evidence.scenarios[name] = { error: error.message, passed: false }; }
}

await guarded('orderingPositive', orderingPositive);
await guarded('orderingNegativeControl', orderingNegativeControl);
await guarded('postAcquireFailure', postAcquireFailure);
for (const kind of ['EXTRA_ALLOW', 'DENY', 'INHERITED', 'WRONG_OWNER']) await guarded(`rollback_${kind}`, () => rollback(kind));

// Security tuples of the real artifacts the positive scenario published.
const positive = evidence.scenarios.orderingPositive;
if (positive?.namespaceDir) {
    const [rootSec, nsSec, fileSec] = [await lib.measureSecurity(root), await lib.measureSecurity(positive.namespaceDir), positive.recordFile ? await lib.measureSecurity(positive.recordFile) : null];
    evidence.security = {
        currentSid: rootSec.currentSid, root: rootSec.tuple, namespaceDirectory: nsSec.tuple, recordFile: fileSec?.tuple ?? null,
        namespacePrivate: lib.isPrivateSecurity(nsSec), crossCheckTargets: { namespaceDirectory: positive.namespaceDir, recordFile: positive.recordFile },
    };
}

const s = evidence.scenarios;
const rollbackKinds = ['EXTRA_ALLOW', 'DENY', 'INHERITED', 'WRONG_OWNER'];
const field = {
    productionPathPeer: !!s.orderingPositive?.peerResult?.ok && !!s.orderingPositive?.peerPid && s.orderingPositive.peerPid !== process.pid,
    deterministicBarrierProtocol: ['READY', 'START_ATTEMPT', 'ATTEMPTING', 'PARENT_RELEASE', 'ENTERED', 'COMPLETE'].every(name => s.orderingPositive?.events?.some(e => e.event === name)),
    enteredBeforeReleaseOracle: s.orderingPositive?.oracle?.verdict === 'ACCEPT' && s.orderingNegativeControl?.oracle?.verdict === 'REJECT'
        && syntheticOracle.earlyEntry === 'REJECT' && syntheticOracle.validOrder === 'ACCEPT',
    postAcquireFailureInjection: s.postAcquireFailure?.failingPeer?.ok === false && s.postAcquireFailure?.afterFailure?.lockPresent === false && s.postAcquireFailure?.subsequentPeer?.ok === true,
    semanticSecurityTuple: !!evidence.security?.namespacePrivate && !!evidence.security?.recordFile,
    rollbackExactness: rollbackKinds.every(kind => s[`rollback_${kind}`]?.passed === true),
};
for (const kind of rollbackKinds) {
    const item = s[`rollback_${kind}`];
    if (!item?.passed) evidence.limitations.push({ field: `rollbackExactness.adversaries.${kind}`, status: item?.status ?? 'FAILED', diagnostic: item?.fixtureDiagnostic ?? item?.error ?? null });
}
evidence.fieldResults = field;
evidence.finalEvidenceHashBinding = 'OWNED_BY_WORKER_RETURN_GATE_CAPTURE_NOT_THIS_PROBE';
evidence.independentProbeRequired = { owner: 'LOCAL_REVIEWER_NOT_IMPLEMENTATION_WORKER', workerReturnDisposition: 'PENDING_REVIEWER_EXECUTION' };
evidence.status = Object.values(field).every(Boolean) ? 'ALL_EXERCISED_FIELDS_PASSED' : 'BLOCKED_WITH_REASON';
fs.writeFileSync(out, JSON.stringify(evidence, null, 2) + '\n');
console.log(JSON.stringify({ status: evidence.status, fieldResults: field, limitations: evidence.limitations, out }, null, 2));
process.exit(evidence.status === 'ALL_EXERCISED_FIELDS_PASSED' ? 0 : 2);
