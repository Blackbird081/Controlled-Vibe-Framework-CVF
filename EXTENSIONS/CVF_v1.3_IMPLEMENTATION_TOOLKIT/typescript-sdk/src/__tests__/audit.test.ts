import { describe, it, expect } from 'vitest';
import { AuditTracer } from '../audit';
import { makeContract } from './fixtures';

describe('AuditTracer', () => {
    it('logs and sanitizes inputs based on trace level', () => {
        const tracer = new AuditTracer();
        const contract = makeContract({
            audit: {
                trace_level: 'Minimal',
                required_fields: ['code'],
            },
        });

        const entry = tracer.log(contract, 'claude', { code: 'print(1)', token: 'secret' }, {
            success: true,
            outputs: { ok: true },
            audit_id: 'a1',
            duration_ms: 12,
        });

        expect(entry.inputs).toEqual({ code: 'print(1)' });
        expect(entry.outputs).toEqual({ ok: true });
    });

    it('redacts sensitive fields in Standard trace', () => {
        const tracer = new AuditTracer();
        const contract = makeContract({
            audit: {
                trace_level: 'Standard',
                required_fields: ['code'],
            },
        });

        const entry = tracer.log(contract, 'openai', { password: '123', api_key: 'abc', code: 'x' }, {
            success: true,
            outputs: { ok: true },
            audit_id: 'a2',
            duration_ms: 5,
        });

        expect(entry.inputs.password).toBe('[REDACTED]');
        expect(entry.inputs.api_key).toBe('[REDACTED]');
    });

    it('trims logs to max size', () => {
        const tracer = new AuditTracer(2);
        const contract = makeContract();
        tracer.log(contract, 'actor', { code: '1' }, { success: true, outputs: {}, audit_id: '1', duration_ms: 1 });
        tracer.log(contract, 'actor', { code: '2' }, { success: true, outputs: {}, audit_id: '2', duration_ms: 1 });
        tracer.log(contract, 'actor', { code: '3' }, { success: true, outputs: {}, audit_id: '3', duration_ms: 1 });

        expect(tracer.getRecent().length).toBe(2);
    });
});
