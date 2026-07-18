import { describe, it, expect } from 'vitest';
import {
    buildEvidenceReceipt,
    buildGovernanceTrace,
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

    describe('buildGovernanceTrace', () => {
        it('builds bounded default trace entries from receipt metadata', () => {
            const env = buildGovernanceEnvelope({
                routeId: '/api/execute',
                surfaceClass: 'governance-execution',
                evidenceMode: 'live',
                riskLevel: 'R2',
            });

            const trace = buildGovernanceTrace({
                envelope: env,
                decision: 'ALLOW',
                provider: 'alibaba',
                model: 'qwen-turbo',
                routingDecision: 'alibaba',
                knowledgeSource: 'project',
                knowledgeInjected: true,
                knowledgeCollectionId: 'collection-1',
                knowledgeChunkCount: 2,
                approvalId: 'approval-1',
                validationHint: 'ok',
                aifMemoryReinjection: { status: 'SKIPPED' } as never,
            });

            expect(trace?.map((entry) => entry.stage)).toEqual([
                'enforcement',
                'routing',
                'knowledge',
                'approval',
                'memory',
                'validation',
            ]);
            expect(trace?.[0]).toMatchObject({
                stage: 'enforcement',
                policyId: env.policySnapshotId,
                decision: 'ALLOW',
            });
            expect(trace?.every((entry) => Array.isArray(entry.parametersChecked))).toBe(true);
            expect(trace?.every((entry) => Array.isArray(entry.constraintsApplied))).toBe(true);
        });

        it('sanitizes explicit trace entries and drops unsupported fields', () => {
            const env = buildGovernanceEnvelope({
                routeId: '/api/execute',
                surfaceClass: 'governance-execution',
                evidenceMode: 'live',
            });

            const receipt = buildEvidenceReceipt({
                envelope: env,
                governanceTrace: [
                    {
                        stage: 'routing',
                        policyId: 'policy-1',
                        decision: 'chosen',
                        summary: 'Provider lane selected.',
                        parametersChecked: ['provider'],
                        constraintsApplied: ['bounded summary'],
                        rawPrompt: 'please leak this',
                        providerKey: 'sk-test-secret',
                        privateMemory: 'internal memory',
                    },
                    {
                        stage: 'unknown',
                        policyId: 'policy-2',
                        decision: 'ignored',
                        summary: 'ignored',
                        parametersChecked: ['ignored'],
                        constraintsApplied: ['ignored'],
                    },
                ] as never,
            });

            expect(receipt.governanceTrace).toEqual([
                {
                    stage: 'routing',
                    policyId: 'policy-1',
                    decision: 'chosen',
                    summary: 'Provider lane selected.',
                    parametersChecked: ['provider'],
                    constraintsApplied: ['bounded summary'],
                },
            ]);
            const serialized = JSON.stringify(receipt.governanceTrace);
            expect(serialized).not.toContain('sk-test-secret');
            expect(serialized).not.toContain('please leak this');
            expect(serialized).not.toContain('internal memory');
        });

        it('redacts unsafe explicit trace values instead of replaying them', () => {
            const env = buildGovernanceEnvelope({
                routeId: '/api/execute',
                surfaceClass: 'governance-execution',
                evidenceMode: 'live',
            });

            const trace = buildGovernanceTrace({
                envelope: env,
                governanceTrace: [{
                    stage: 'validation',
                    policyId: 'sk-unsafe-policy',
                    decision: 'secret value',
                    summary: 'raw prompt should not be repeated',
                    parametersChecked: ['system prompt'],
                    constraintsApplied: ['private memory'],
                }] as never,
            });

            expect(trace).toEqual([{
                stage: 'validation',
                policyId: env.policySnapshotId,
                decision: 'recorded',
                summary: 'validation checkpoint recorded',
                parametersChecked: ['bounded checkpoint metadata'],
                constraintsApplied: ['summary-only receipt trace'],
            }]);
        });

        it('adds bounded runtime telemetry with sanitized trace count', () => {
            const env = buildGovernanceEnvelope({
                routeId: '/api/execute',
                surfaceClass: 'governance-execution',
                evidenceMode: 'live',
            });

            const receipt = buildEvidenceReceipt({
                envelope: env,
                decision: 'ALLOW',
                provider: 'alibaba',
                model: 'qwen-turbo',
                runtimeTelemetry: {
                    schemaVersion: 'cvf.runtimeTelemetry.v1',
                    providerLatencyMs: 321,
                    routeElapsedMs: 456,
                    tokenUsage: {
                        inputTokens: 12,
                        outputTokens: 34,
                        totalTokens: 46,
                    },
                    estimatedCostUSD: 0.000148,
                    costEstimateSource: 'cvf_model_pricing_table_or_fallback',
                    redactionApplied: true,
                    claimBoundary: 'summary_only_no_raw_prompt_output_key_or_provider_payload',
                },
            });

            expect(receipt.runtimeTelemetry).toEqual({
                schemaVersion: 'cvf.runtimeTelemetry.v1',
                providerLatencyMs: 321,
                routeElapsedMs: 456,
                tokenUsage: {
                    inputTokens: 12,
                    outputTokens: 34,
                    totalTokens: 46,
                },
                estimatedCostUSD: 0.000148,
                costEstimateSource: 'cvf_model_pricing_table_or_fallback',
                governanceTraceEntryCount: 2,
                redactionApplied: true,
                claimBoundary: 'summary_only_no_raw_prompt_output_key_or_provider_payload',
            });
            expect(JSON.stringify(receipt.runtimeTelemetry)).not.toMatch(/sk-|BASE_SYSTEM_PROMPT|private memory/i);
        });

        it('adds receipt integrity metadata without leaking the signing secret', () => {
            const envelope = buildGovernanceEnvelope({
                routeId: '/api/execute',
                surfaceClass: 'governance-execution',
                evidenceMode: 'live',
                riskLevel: 'R1',
                providerLane: 'alibaba',
            });

            const receipt = buildEvidenceReceipt({
                envelope,
                decision: 'ALLOW',
                riskLevel: 'R1',
                provider: 'alibaba',
                model: 'qwen-turbo',
                routingDecision: 'ALLOW',
                receiptIntegrity: {
                    signingSecret: 'builder-test-secret',
                    externalAnchorId: 'anchor-builder-test',
                },
            });

            expect(receipt.receiptIntegrity).toMatchObject({
                schemaVersion: 'cvf.receiptIntegrity.v1',
                canonicalization: 'stable-json-v1',
                digestAlgorithm: 'sha256',
                hmacAlgorithm: 'hmac-sha256',
                signatureStatus: 'SIGNED',
                externalAnchorStatus: 'PROVIDED',
                externalAnchorId: 'anchor-builder-test',
                redactionApplied: true,
                claimBoundary: 'local_receipt_integrity_only_no_third_party_immutability_without_external_anchor',
            });
            expect(receipt.receiptIntegrity?.receiptHash).toMatch(/^[a-f0-9]{64}$/);
            expect(receipt.receiptIntegrity?.signatureDigest).toMatch(/^[a-f0-9]{64}$/);
            expect(JSON.stringify(receipt)).not.toContain('builder-test-secret');
        });
    });
});
