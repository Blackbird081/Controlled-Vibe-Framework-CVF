import { describe, expect, it } from 'vitest';
import type { CVFRole } from '../types';
import {
  ORCHESTRATOR_AUTHORITY_ROLES,
  ORCHESTRATOR_DELEGATION_PROFILES,
  ORCHESTRATOR_OVERREACH_DENY_RULES,
  WORKER_LANE_ROLES,
  canIssueWorkerLaneTicket,
  createWorkerLaneTicket,
  isOrchestratorAuthorityRole,
  orchestratorCoversAllRoles,
} from './orchestrator.contract';

describe('Phase D ORCHESTRATOR contract', () => {
  it('defines a delegation profile for every ORCHESTRATOR-eligible role', () => {
    expect(Object.keys(ORCHESTRATOR_DELEGATION_PROFILES).sort()).toEqual(
      [...ORCHESTRATOR_AUTHORITY_ROLES].sort(),
    );
    expect(orchestratorCoversAllRoles(ORCHESTRATOR_AUTHORITY_ROLES)).toBe(true);
  });

  it('keeps deny rules inside the canonical overreach vocabulary', () => {
    const vocabulary = new Set(ORCHESTRATOR_OVERREACH_DENY_RULES);

    for (const profile of Object.values(ORCHESTRATOR_DELEGATION_PROFILES)) {
      for (const denyRule of profile.denyRules) {
        expect(vocabulary.has(denyRule)).toBe(true);
      }
    }
  });

  it('prevents recursive self-delegation and requires worker-lane roles', () => {
    for (const authorityRole of ORCHESTRATOR_AUTHORITY_ROLES) {
      expect(canIssueWorkerLaneTicket(authorityRole, authorityRole)).toBe(false);
    }

    expect(canIssueWorkerLaneTicket('OPERATOR', 'BUILDER')).toBe(true);
    expect(canIssueWorkerLaneTicket('GOVERNOR', 'AI_AGENT')).toBe(true);
    expect(canIssueWorkerLaneTicket('OPERATOR', 'HUMAN')).toBe(false);
  });

  it('does not let BUILDER or AI_AGENT issue WorkerLaneTickets without ORCHESTRATOR authority', () => {
    const nonAuthorityRoles: readonly CVFRole[] = ['BUILDER', 'AI_AGENT'];

    for (const role of nonAuthorityRoles) {
      expect(isOrchestratorAuthorityRole(role)).toBe(false);
      expect(canIssueWorkerLaneTicket(role, 'ANALYST')).toBe(false);
    }
  });

  it('covers every current worker lane from at least one ORCHESTRATOR profile', () => {
    const coveredWorkers = new Set<CVFRole>();

    for (const profile of Object.values(ORCHESTRATOR_DELEGATION_PROFILES)) {
      for (const workerRole of profile.mayDelegateTo) {
        coveredWorkers.add(workerRole);
      }
    }

    expect([...coveredWorkers].sort()).toEqual([...WORKER_LANE_ROLES].sort());
  });

  it('flags worker memory write restriction in the ticket type', () => {
    const ticket = createWorkerLaneTicket({
      ticketId: 'ticket-phaseD-orchestrator-001',
      delegatingRole: 'OPERATOR',
      workerRole: 'BUILDER',
      taskScope: 'bounded contract-local implementation',
      allowedOutputClasses: ['code_patch', 'implementation_note'],
      delegationReceiptId: 'receipt-phaseD-orchestrator-001',
    });

    expect(ticket.receiptRequired).toBe(true);
    expect(ticket.memoryWriteBoundary.persistentTierWriteAllowed).toBe(false);
    expect(ticket.memoryWriteBoundary.archiveTierWriteAllowed).toBe(false);
    expect(ticket.memoryWriteBoundary.requiresOrchestratorDelegationReceipt).toBe(true);
  });
});
