import { describe, it, expect } from 'vitest';
import {
    buildGovernanceEnvelope,
    generatePolicySnapshotId,
    appendAuditEventToEnvelope,
    type WebGovernanceEnvelope,
} from './web-governance-envelope';

describe('web-governance-envelope', () => {
    describe('generatePolicySnapshotId', () => {
        it('returns a string starting with pol-', () => {
            const id = generatePolicySnapshotId();
            expect(id).toMatch(/^pol-\d{8}-\d{4}$/);
        });

        it('returns unique ids on successive calls', () => {
            const a = generatePolicySnapshotId();
            const b = generatePolicySnapshotId();
            expect(a).not.toBe(b);
        });
    });

    describe('buildGovernanceEnvelope', () => {
        it('returns a valid envelope with required fields', () => {
            const env = buildGovernanceEnvelope({
                routeId: '/api/execute',
                surfaceClass: 'governance-execution',
                evidenceMode: 'live',
            });

            expect(env.envelopeId).toMatch(/^env-/);
            expect(env.routeId).toBe('/api/execute');
            expect(env.surfaceClass).toBe('governance-execution');
            expect(env.evidenceMode).toBe('live');
            expect(env.policySnapshotId).toMatch(/^pol-/);
            expect(env.trancheRef).toBe('W112-T1');
            expect(env.auditEventIds).toEqual([]);
            expect(typeof env.requestTimestamp).toBe('string');
        });

        it('captures actorId and actorRole from input', () => {
            const env = buildGovernanceEnvelope({
                routeId: '/api/approvals',
                surfaceClass: 'governance-execution',
                evidenceMode: 'live',
                actorId: 'user-abc',
                actorRole: 'admin',
            });
            expect(env.actorId).toBe('user-abc');
            expect(env.actorRole).toBe('admin');
        });

        it('defaults missing optional fields to null', () => {
            const env = buildGovernanceEnvelope({
                routeId: '/api/execute',
                surfaceClass: 'governance-execution',
                evidenceMode: 'live',
            });
            expect(env.actorId).toBeNull();
            expect(env.actorRole).toBeNull();
            expect(env.phase).toBeNull();
            expect(env.riskLevel).toBeNull();
            expect(env.providerLane).toBeNull();
        });

        it('captures phase and riskLevel', () => {
            const env = buildGovernanceEnvelope({
                routeId: '/api/execute',
                surfaceClass: 'governance-execution',
                evidenceMode: 'live',
                phase: 'BUILD',
                riskLevel: 'R2',
            });
            expect(env.phase).toBe('BUILD');
            expect(env.riskLevel).toBe('R2');
        });

        it('captures providerLane', () => {
            const env = buildGovernanceEnvelope({
                routeId: '/api/execute',
                surfaceClass: 'governance-execution',
                evidenceMode: 'live',
                providerLane: 'alibaba',
            });
            expect(env.providerLane).toBe('alibaba');
        });

        it('assigns unique envelopeIds on each call', () => {
            const a = buildGovernanceEnvelope({ routeId: '/api/execute', surfaceClass: 'governance-execution', evidenceMode: 'live' });
            const b = buildGovernanceEnvelope({ routeId: '/api/execute', surfaceClass: 'governance-execution', evidenceMode: 'live' });
            expect(a.envelopeId).not.toBe(b.envelopeId);
        });

        it('assigns unique policySnapshotIds on each call', () => {
            const a = buildGovernanceEnvelope({ routeId: '/api/execute', surfaceClass: 'governance-execution', evidenceMode: 'live' });
            const b = buildGovernanceEnvelope({ routeId: '/api/execute', surfaceClass: 'governance-execution', evidenceMode: 'live' });
            expect(a.policySnapshotId).not.toBe(b.policySnapshotId);
        });

        it('supports policy-mutation surface class', () => {
            const env = buildGovernanceEnvelope({
                routeId: '/api/governance/knowledge/compile',
                surfaceClass: 'policy-mutation',
                evidenceMode: 'live',
            });
            expect(env.surfaceClass).toBe('policy-mutation');
        });

        it('supports ui_mock evidence mode', () => {
            const env = buildGovernanceEnvelope({
                routeId: '/api/execute',
                surfaceClass: 'governance-execution',
                evidenceMode: 'ui_mock',
            });
            expect(env.evidenceMode).toBe('ui_mock');
        });

        it('includes pre-existing auditEventIds from input', () => {
            const env = buildGovernanceEnvelope({
                routeId: '/api/execute',
                surfaceClass: 'governance-execution',
                evidenceMode: 'live',
                auditEventIds: ['evt-001', 'evt-002'],
            });
            expect(env.auditEventIds).toEqual(['evt-001', 'evt-002']);
        });
    });

    describe('appendAuditEventToEnvelope', () => {
        it('appends event id to envelope auditEventIds', () => {
            const env = buildGovernanceEnvelope({
                routeId: '/api/execute',
                surfaceClass: 'governance-execution',
                evidenceMode: 'live',
            });
            appendAuditEventToEnvelope(env, 'evt-123');
            expect(env.auditEventIds).toContain('evt-123');
        });

        it('can append multiple events sequentially', () => {
            const env = buildGovernanceEnvelope({
                routeId: '/api/execute',
                surfaceClass: 'governance-execution',
                evidenceMode: 'live',
            });
            appendAuditEventToEnvelope(env, 'evt-A');
            appendAuditEventToEnvelope(env, 'evt-B');
            appendAuditEventToEnvelope(env, 'evt-C');
            expect(env.auditEventIds).toEqual(['evt-A', 'evt-B', 'evt-C']);
        });

        it('mutates the envelope in place (same reference)', () => {
            const env: WebGovernanceEnvelope = buildGovernanceEnvelope({
                routeId: '/api/execute',
                surfaceClass: 'governance-execution',
                evidenceMode: 'live',
            });
            const before = env.auditEventIds;
            appendAuditEventToEnvelope(env, 'evt-X');
            expect(env.auditEventIds).toBe(before);
        });
    });
});
