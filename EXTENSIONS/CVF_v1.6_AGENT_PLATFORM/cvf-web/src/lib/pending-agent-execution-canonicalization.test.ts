import { describe, expect, it } from 'vitest';

import {
    CanonicalizationError,
    canonicalizeToJson,
    validateEnvironmentIdentity,
} from './pending-agent-execution';

// ---------------------------------------------------------------------------
// 2. Rejection of unsupported JS values
// ---------------------------------------------------------------------------

describe('2. canonicalizer hard-rejects unsupported values', () => {
    it('rejects undefined', () => {
        expect(() => canonicalizeToJson(undefined)).toThrow(CanonicalizationError);
    });

    it('rejects undefined-valued object property', () => {
        expect(() => canonicalizeToJson({ a: undefined })).toThrow(CanonicalizationError);
    });

    it('rejects sparse array holes', () => {
        const sparse = [1, , 3];
        expect(() => canonicalizeToJson(sparse)).toThrow(CanonicalizationError);
    });

    it('rejects NaN', () => {
        expect(() => canonicalizeToJson({ a: NaN })).toThrow(CanonicalizationError);
    });

    it('rejects Infinity and -Infinity', () => {
        expect(() => canonicalizeToJson({ a: Infinity })).toThrow(CanonicalizationError);
        expect(() => canonicalizeToJson({ a: -Infinity })).toThrow(CanonicalizationError);
    });

    it('rejects bigint', () => {
        expect(() => canonicalizeToJson({ a: BigInt(1) })).toThrow(CanonicalizationError);
    });

    it('rejects symbol', () => {
        expect(() => canonicalizeToJson({ a: Symbol('x') })).toThrow(CanonicalizationError);
    });

    it('rejects functions', () => {
        expect(() => canonicalizeToJson({ a: () => 1 })).toThrow(CanonicalizationError);
    });

    it('rejects Date instances', () => {
        expect(() => canonicalizeToJson({ a: new Date() })).toThrow(CanonicalizationError);
    });

    it('rejects class instances (non-plain prototype)', () => {
        class Foo {
            x = 1;
        }
        expect(() => canonicalizeToJson({ a: new Foo() })).toThrow(CanonicalizationError);
    });

    it('rejects cyclic references', () => {
        const obj: Record<string, unknown> = { a: 1 };
        obj.self = obj;
        expect(() => canonicalizeToJson(obj)).toThrow(CanonicalizationError);
    });

    it('rejects lone surrogates, symbol keys, accessors, and non-enumerable fields', () => {
        expect(() => canonicalizeToJson({ value: '\ud800' })).toThrow(CanonicalizationError);
        const symbolKeyed = { value: 'ok', [Symbol('hidden')]: 'hidden' };
        expect(() => canonicalizeToJson(symbolKeyed)).toThrow(CanonicalizationError);
        const accessor: Record<string, unknown> = {};
        Object.defineProperty(accessor, 'value', { enumerable: true, get: () => 'x' });
        expect(() => canonicalizeToJson(accessor)).toThrow(CanonicalizationError);
        const hidden = { value: 'ok' };
        Object.defineProperty(hidden, 'secret', { enumerable: false, value: 'x' });
        expect(() => canonicalizeToJson(hidden)).toThrow(CanonicalizationError);
    });

    it('rejects unknown environment identity keys', () => {
        expect(() =>
            validateEnvironmentIdentity({
                nodeEnv: 'test',
                runtimeName: 'vitest',
                deploymentBoundary: 'single_process_non_production',
                extraKey: 'x',
            }),
        ).toThrow(CanonicalizationError);
    });

    it('rejects secret-like environment key', () => {
        expect(() =>
            validateEnvironmentIdentity({
                nodeEnv: 'test',
                runtimeName: 'vitest',
                deploymentBoundary: 'single_process_non_production',
                apiKey: 'shhh',
            } as unknown as Record<string, unknown>),
        ).toThrow(CanonicalizationError);
    });

    it('rejects secret-like environment value', () => {
        expect(() =>
            validateEnvironmentIdentity({
                nodeEnv: 'test-secret-token-value',
                runtimeName: 'vitest',
                deploymentBoundary: 'single_process_non_production',
            }),
        ).toThrow(CanonicalizationError);
    });

    it('rejects deploymentBoundary values other than the fixed literal', () => {
        expect(() =>
            validateEnvironmentIdentity({
                nodeEnv: 'test',
                runtimeName: 'vitest',
                deploymentBoundary: 'production',
            }),
        ).toThrow(CanonicalizationError);
    });
});
