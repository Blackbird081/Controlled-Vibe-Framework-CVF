import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';

import type { ApprovalRequestSnapshot } from './store';
import {
    buildApprovalRequestSnapshot,
    computeApprovalRequestHash,
} from './approval-binding';

const ACTOR = {
    actorId: 'operator-1',
    actorOrgId: null,
    actorTeamId: 'team-1',
    actorAuthMode: 'session' as const,
};

function hashJson(value: unknown): string {
    return createHash('sha256').update(JSON.stringify(value), 'utf8').digest('hex');
}

function minimalSnapshot(overrides: Partial<ApprovalRequestSnapshot> = {}): ApprovalRequestSnapshot {
    return {
        templateId: 'tpl-1',
        templateName: 'Template One',
        intent: 'run safely',
        ...overrides,
    };
}

describe('canonical approval request binding', () => {
    it('omits normalized optional undefined while retaining schema-defined null', () => {
        const snapshot = buildApprovalRequestSnapshot({
            templateId: 'tpl-1',
            templateName: 'Template One',
            intent: ' run safely ',
            model: ' ',
            cvfPhase: undefined,
            inputs: undefined,
        }, 'test-provider', ACTOR);

        expect(Object.values(snapshot)).not.toContain(undefined);
        expect(Object.prototype.hasOwnProperty.call(snapshot, 'model')).toBe(false);
        expect(Object.prototype.hasOwnProperty.call(snapshot, 'cvfPhase')).toBe(false);
        expect(Object.prototype.hasOwnProperty.call(snapshot, 'inputs')).toBe(false);
        expect(snapshot.knowledgeCollectionId).toBeNull();
        expect(snapshot.actorOrgId).toBeNull();
    });

    it('projects recognized root and input keys in ordinal order', () => {
        const snapshot = buildApprovalRequestSnapshot({
            templateId: 'tpl-1',
            templateName: 'Template One',
            intent: 'run safely',
            inputs: { z: 'last', A: 'first', a: 'middle' },
            cvfRiskLevel: 'R3',
            cvfPhase: 'BUILD',
        }, 'test-provider', ACTOR);

        expect(Object.keys(snapshot)).toEqual([
            'actorAuthMode', 'actorId', 'actorOrgId', 'actorTeamId',
            'cvfPhase', 'cvfRiskLevel', 'inputs', 'intent',
            'knowledgeCollectionId', 'provider', 'templateId', 'templateName',
        ]);
        expect(Object.keys(snapshot.inputs!)).toEqual(['A', 'a', 'z']);
    });

    it('hashes insertion-order variants of the same recognized data identically', () => {
        const left = minimalSnapshot({
            provider: 'test-provider',
            inputs: { z: '3', A: '1', a: '2' },
        });
        const right = {
            inputs: { a: '2', z: '3', A: '1' },
            provider: 'test-provider',
            intent: 'run safely',
            templateName: 'Template One',
            templateId: 'tpl-1',
        } as ApprovalRequestSnapshot;

        expect(computeApprovalRequestHash(left)).toBe(computeApprovalRequestHash(right));
    });

    it('uses the UTF-8 compact JSON bytes of the ordinal exact projection', () => {
        const snapshot = minimalSnapshot({
            inputs: { z: 'cu\u1ed1i', A: 'first', a: 'middle' },
            intent: 'ch\u1ea1y an to\u00e0n',
            provider: 'test-provider',
        });
        const expectedPreimage = '{"inputs":{"A":"first","a":"middle","z":"cu\u1ed1i"},"intent":"ch\u1ea1y an to\u00e0n","provider":"test-provider","templateId":"tpl-1","templateName":"Template One"}';
        const expectedDigest = '78a5e2c47f7bb1d95734664a2c739566ebfa5cb817ced95c854e436295982e7a';

        expect(computeApprovalRequestHash(snapshot)).toBe(expectedDigest);
        expect(hashJson(JSON.parse(expectedPreimage))).toBe(expectedDigest);
        expect(expectedDigest).toMatch(/^[0-9a-f]{64}$/);
    });

    it('fails closed on integer-index input keys that ordinary objects cannot serialize ordinally', () => {
        expect(() => computeApprovalRequestHash(minimalSnapshot({
            inputs: { 10: 'ten', 2: 'two', a: 'letter' },
        }))).toThrow(/integer-index/i);
        expect(() => buildApprovalRequestSnapshot({
            templateId: 'tpl-1', templateName: 'Template One', intent: 'run safely',
            inputs: { 10: 'ten', 2: 'two', a: 'letter' },
        }, 'test-provider', ACTOR)).toThrow(/integer-index/i);
    });

    it.each([
        ['unknown key', () => computeApprovalRequestHash({ ...minimalSnapshot(), extra: true } as unknown as ApprovalRequestSnapshot)],
        ['own undefined', () => computeApprovalRequestHash({ ...minimalSnapshot(), model: undefined })],
        ['symbol value', () => computeApprovalRequestHash({ ...minimalSnapshot(), provider: Symbol('provider') } as unknown as ApprovalRequestSnapshot)],
        ['non-plain object', () => computeApprovalRequestHash(Object.assign(new (class Snapshot {})(), minimalSnapshot()) as ApprovalRequestSnapshot)],
        ['invalid required type', () => computeApprovalRequestHash({ ...minimalSnapshot(), intent: 3 } as unknown as ApprovalRequestSnapshot)],
        ['invalid nullable type', () => computeApprovalRequestHash({ ...minimalSnapshot(), actorOrgId: false } as unknown as ApprovalRequestSnapshot)],
        ['invalid input value', () => computeApprovalRequestHash(minimalSnapshot({ inputs: { goal: 3 } as unknown as Record<string, string> }))],
    ])('rejects %s', (_label, action) => {
        expect(action).toThrow(TypeError);
    });

    it('rejects symbol keys, non-enumerable properties and accessors without invoking getters', () => {
        const symbolKey = { ...minimalSnapshot(), [Symbol('hidden')]: 'value' };
        expect(() => computeApprovalRequestHash(symbolKey)).toThrow(/symbol keys/i);

        const nonEnumerable = minimalSnapshot();
        Object.defineProperty(nonEnumerable, 'model', { value: 'hidden', enumerable: false });
        expect(() => computeApprovalRequestHash(nonEnumerable)).toThrow(/enumerable data property/i);

        const getter = vi.fn(() => 'must-not-run');
        const accessor = minimalSnapshot();
        Object.defineProperty(accessor, 'provider', { get: getter, enumerable: true });
        expect(() => computeApprovalRequestHash(accessor)).toThrow(/enumerable data property/i);
        expect(getter).not.toHaveBeenCalled();
    });

    it('rejects nested symbols and accessors without invoking getters', () => {
        const getter = vi.fn(() => 'must-not-run');
        const inputs = { goal: 'safe', [Symbol('hidden')]: 'value' } as Record<string, string>;
        expect(() => computeApprovalRequestHash(minimalSnapshot({ inputs }))).toThrow(/symbol keys/i);

        const accessorInputs: Record<string, string> = {};
        Object.defineProperty(accessorInputs, 'goal', { get: getter, enumerable: true });
        expect(() => computeApprovalRequestHash(minimalSnapshot({ inputs: accessorInputs }))).toThrow(/enumerable data property/i);
        expect(getter).not.toHaveBeenCalled();
    });

    it('does not accept the legacy order-sensitive digest as the canonical digest', () => {
        const legacySnapshot = {
            templateId: 'tpl-1',
            templateName: 'Template One',
            intent: 'run safely',
            inputs: { z: '3', A: '1', a: '2' },
            provider: 'test-provider',
        } satisfies ApprovalRequestSnapshot;

        expect(hashJson(legacySnapshot)).not.toBe(computeApprovalRequestHash(legacySnapshot));
    });
});
