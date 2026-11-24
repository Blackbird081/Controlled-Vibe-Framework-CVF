import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { SQLiteKeyedAtomicRecordStore } from '../../../../../../../CVF_EXECUTION_PLANE_FOUNDATION/src/mao/atomic.sqlite.record.store';

const provenanceMock = vi.hoisted(() => vi.fn());
vi.mock('@/lib/middleware-auth', () => ({ resolveVerifiedSessionProvenance: provenanceMock }));

import * as routeModule from './route';
import { POST } from './route';
import { computeServiceRequestSignature, _testOnlyResetReplayLedger } from '@/lib/service-token-auth';
import {
    LINEAGE_CONFIG_ENV,
    finalize,
    parseLineageConfig,
    provisionTenantMetadata,
    requestKey,
    reserve,
    resolveServiceIdentity,
    resolveSessionIdentity,
    settle,
    type LineageConfig,
    type LineageIdentity,
} from '@/lib/server/canonical-web-lineage';

const nativeSource = path.resolve(process.cwd(), '../../CVF_EXECUTION_PLANE_FOUNDATION/src/mao/atomic.sqlite.record.store.ts');
const nodeRequire = createRequire(nativeSource);
const NAMESPACE = 'cvf-web-lineage-route-test';
const SERVICE_TOKEN = 'route-test-service-token-0123456789';
const URL_PATH = 'http://localhost/api/execute/lineage';

let directory = '';
let config: LineageConfig;
const qualified = (userId: string, orgId = 'org-a', teamId = 'team-1') => ({ qualified: true as const, userId, orgId, teamId, role: 'user', oauthProvider: 'google', oauthSubject: `sub-${userId}`, expiresAt: Date.now() + 60_000 });

function buildConfig(overrides: Record<string, unknown> = {}): LineageConfig {
    const parsed = parseLineageConfig(JSON.stringify({
        schema: 'cvf.webLineageConfig.v1', revision: 1, directory, namespace: NAMESPACE,
        tenants: [{ tenantId: 'org-a', activeSlots: 5, archiveSlots: 5 }, { tenantId: 'org-b', activeSlots: 5, archiveSlots: 5 }],
        servicePrincipal: { principalId: 'svc-1', tenantId: 'org-a' },
        ...overrides,
    }));
    if (!parsed.ok) throw new Error(parsed.reason);
    return parsed.config;
}
function useConfig(value: LineageConfig | null): void {
    if (value) vi.stubEnv(LINEAGE_CONFIG_ENV, JSON.stringify(value)); else vi.stubEnv(LINEAGE_CONFIG_ENV, '');
}
function identityFor(userId: string): LineageIdentity {
    const resolved = resolveSessionIdentity(config, { qualified: true, userId, orgId: 'org-a', teamId: 'team-1' });
    if (!resolved.ok) throw new Error(resolved.reason);
    return resolved.value;
}
function record(identity: LineageIdentity, id: string): void {
    const ref = { canonicalId: id, contractRevision: 'contract-1', sourceRevision: 'src-1' };
    expect(reserve(config, identity, ref).ok).toBe(true);
    expect(settle(config, identity, ref, 1, { attemptOutcome: 'invoked', callbackAttemptIndex: 0, provider: 'alibaba', model: 'qwen-plus', gatewayReceiptIds: ['rcpt-1'] }).ok).toBe(true);
    expect(finalize(config, identity, ref, { disposition: 'COMPLETED' }).ok).toBe(true);
}
function request(body: string, headers: Record<string, string> = {}): NextRequest {
    return new NextRequest(URL_PATH, { method: 'POST', body, headers: { 'content-type': 'application/json', ...headers } });
}
function signedHeaders(body: string, token = SERVICE_TOKEN, configured = SERVICE_TOKEN): Record<string, string> {
    const timestamp = String(Date.now());
    return { 'x-cvf-service-token': token, 'x-cvf-service-timestamp': timestamp, 'x-cvf-service-signature': computeServiceRequestSignature(configured, timestamp, body) };
}
const idBody = (canonicalId: string) => JSON.stringify({ canonicalId });

beforeEach(() => {
    directory = mkdtempSync(path.join(tmpdir(), 'cvf-web-lineage-route-'));
    SQLiteKeyedAtomicRecordStore.initialize(directory);
    config = buildConfig();
    expect(provisionTenantMetadata(config).ok).toBe(true);
    useConfig(config);
    vi.stubEnv('CVF_SERVICE_TOKEN', SERVICE_TOKEN);
    _testOnlyResetReplayLedger();
    provenanceMock.mockReset();
    provenanceMock.mockResolvedValue({ qualified: false, reason: 'NO_SESSION' });
});
afterEach(() => {
    vi.unstubAllEnvs();
    rmSync(directory, { recursive: true, force: true });
});

describe('POST /api/execute/lineage', () => {
    it('exports POST only, on the Node runtime', () => {
        expect(routeModule.runtime).toBe('nodejs');
        expect(Object.keys(routeModule).filter(key => ['GET', 'PUT', 'PATCH', 'DELETE'].includes(key))).toEqual([]);
    });

    it('returns the caller\'s own ordered history with 200 and no-store', async () => {
        record(identityFor('user-1'), 'env-own');
        provenanceMock.mockResolvedValue(qualified('user-1'));
        const response = await POST(request(idBody('env-own')));
        expect(response.status).toBe(200);
        expect(response.headers.get('cache-control')).toBe('no-store');
        expect(response.headers.get('retry-after')).toBeNull();
        const body = await response.json();
        expect(body).toMatchObject({ success: true, canonicalId: 'env-own', recordingStatus: 'CONFIRMED' });
        expect(body.lineage).toMatchObject({ state: 'FINALIZED', location: 'ACTIVE', automaticRetryAllowed: false });
        expect(body.lineage.history).toHaveLength(1);
        expect(body.lineage.history[0].observation).toMatchObject({ attemptOutcome: 'invoked', provider: 'alibaba' });
        expect(JSON.stringify(body)).not.toMatch(/user-1|team-1|sub-user-1/);
    });

    it('returns 404 for a foreign owner, another tenant and an unknown id, indistinguishably', async () => {
        record(identityFor('user-1'), 'env-foreign');
        provenanceMock.mockResolvedValue(qualified('user-2'));
        const foreign = await POST(request(idBody('env-foreign')));
        provenanceMock.mockResolvedValue(qualified('user-1', 'org-b'));
        const otherTenant = await POST(request(idBody('env-foreign')));
        provenanceMock.mockResolvedValue(qualified('user-1'));
        const unknown = await POST(request(idBody('env-never-seen')));
        for (const response of [foreign, otherTenant, unknown]) expect(response.status).toBe(404);
        expect(await foreign.json()).toEqual(await unknown.json());
    });

    it('returns 503 JOURNAL_UNAVAILABLE for a corrupt own record, never an empty history', async () => {
        const Database = nodeRequire('better-sqlite3') as new (file: string) => { prepare(sql: string): { run(...a: unknown[]): unknown }; close(): void };
        const db = new Database(path.join(directory, 'cvf-keyvalue-store.sqlite'));
        db.prepare('INSERT INTO atomic_key_value_store(namespace,id,revision,item_json,updated_at) VALUES (?,?,0,?,?)').run(NAMESPACE, requestKey('org-a', 'env-corrupt'), 'CORRUPT{', '2026-11-12T00:00:00.000Z');
        db.close();
        provenanceMock.mockResolvedValue(qualified('user-1'));
        const response = await POST(request(idBody('env-corrupt')));
        expect(response.status).toBe(503);
        expect(response.headers.get('retry-after')).toBeNull();
        const body = await response.json();
        expect(body).toMatchObject({ success: false, code: 'JOURNAL_UNAVAILABLE' });
        expect(body.lineage).toBeUndefined();
        expect(body.history).toBeUndefined();
    });

    it('returns 503 JOURNAL_NOT_READY for missing configuration, unknown tenant and missing custody', async () => {
        provenanceMock.mockResolvedValue(qualified('user-1'));
        useConfig(null);
        const missing = await POST(request(idBody('env-1')));
        expect(missing.status).toBe(503);
        expect(await missing.json()).toMatchObject({ code: 'JOURNAL_NOT_READY' });

        useConfig(config);
        provenanceMock.mockResolvedValue(qualified('user-1', 'org-unconfigured'));
        const unknownTenant = await POST(request(idBody('env-1')));
        expect(unknownTenant.status).toBe(503);
        expect(await unknownTenant.json()).toMatchObject({ code: 'JOURNAL_NOT_READY' });

        useConfig(buildConfig({ directory: path.join(directory, 'missing-subdirectory') }));
        provenanceMock.mockResolvedValue(qualified('user-1'));
        const noCustody = await POST(request(idBody('env-1')));
        expect(noCustody.status).toBe(503);
        expect(await noCustody.json()).toMatchObject({ code: 'JOURNAL_NOT_READY' });
    });

    it('rejects malformed bodies with 400 and oversize bodies with 413', async () => {
        provenanceMock.mockResolvedValue(qualified('user-1'));
        const bad = [
            'not json', '[]', 'null', '{}', '{"canonicalId":7}', '{"canonicalId":"has space"}', '{"canonicalId":""}',
            JSON.stringify({ canonicalId: 'env-1', extra: true }), JSON.stringify({ canonicalId: 'x'.repeat(101) }), JSON.stringify({ id: 'env-1' }),
        ];
        for (const body of bad) expect((await POST(request(body))).status, body).toBe(400);
        const oversize = await POST(request(JSON.stringify({ canonicalId: 'env-1', pad: 'x'.repeat(5000) })));
        expect(oversize.status).toBe(413);
    });

    it('requires authentication: no session, unqualified session, wrong token or wrong signature give 401', async () => {
        record(identityFor('user-1'), 'env-auth');
        const body = idBody('env-auth');
        expect((await POST(request(body))).status).toBe(401);
        for (const reason of ['DEVELOPMENT_FALLBACK', 'IMPERSONATED', 'EXPIRED', 'NOT_OAUTH_BOUND']) {
            provenanceMock.mockResolvedValue({ qualified: false, reason });
            expect((await POST(request(body))).status, reason).toBe(401);
        }
        provenanceMock.mockResolvedValue({ qualified: false, reason: 'NO_SESSION' });
        expect((await POST(request(body, signedHeaders(body, 'wrong-token')))).status).toBe(401);
        expect((await POST(request(body, signedHeaders(body, SERVICE_TOKEN, 'other-secret')))).status).toBe(401);
        expect((await POST(request(body, { ...signedHeaders(body), 'x-cvf-service-signature': '' }))).status).toBe(401);
        // The signature covers the raw body: a signature for another body does not authorize this one.
        const other = idBody('env-other');
        expect((await POST(request(body, signedHeaders(other)))).status).toBe(401);
    });

    it('accepts a signed service request for the configured principal only', async () => {
        const service = resolveServiceIdentity(config, true);
        if (!service.ok) throw new Error('service identity');
        record(service.value, 'env-svc');
        record(identityFor('user-1'), 'env-session');
        const body = idBody('env-svc');
        const ok = await POST(request(body, signedHeaders(body)));
        expect(ok.status).toBe(200);
        expect(await ok.json()).toMatchObject({ success: true, canonicalId: 'env-svc', lineage: { ownerKind: 'service' } });
        // A service caller cannot read a session-owned record.
        const sessionBody = idBody('env-session');
        _testOnlyResetReplayLedger();
        expect((await POST(request(sessionBody, signedHeaders(sessionBody)))).status).toBe(404);
        // Without a configured principal mapping the verified service request is refused as not ready.
        useConfig(buildConfig({ servicePrincipal: undefined }));
        _testOnlyResetReplayLedger();
        const unmapped = await POST(request(body, signedHeaders(body)));
        expect(unmapped.status).toBe(503);
        expect(await unmapped.json()).toMatchObject({ code: 'JOURNAL_NOT_READY' });
        // Reassigning the principal does not transfer history.
        useConfig(buildConfig({ servicePrincipal: { principalId: 'svc-2', tenantId: 'org-a' } }));
        _testOnlyResetReplayLedger();
        expect((await POST(request(body, signedHeaders(body)))).status).toBe(404);
    });
});
