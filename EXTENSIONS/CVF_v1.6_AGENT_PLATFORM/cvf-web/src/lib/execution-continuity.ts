// W123-T1: Execution continuity helpers
// Provides factory functions and selectors for building and querying
// continuation threads. All state lives in useExecutionStore (Zustand/localStorage).

import type { Execution, ExecutionEvidenceSnapshot } from '@/types';

export interface ContinuationInput {
    templateId: string;
    templateName: string;
    category?: Execution['category'];
    input: Record<string, string>;
    intent: string;
    parentExecution: Execution;
    projectLabel?: string;
}

/**
 * Build a new child execution linked to the given parent.
 * Preserves threadId/rootExecutionId/projectLabel/knowledgeCollectionId from parent.
 */
export function buildContinuationExecution(opts: ContinuationInput): Execution {
    const parent = opts.parentExecution;
    const threadId = parent.threadId ?? parent.id;
    const rootExecutionId = parent.rootExecutionId ?? parent.id;

    return {
        id: `exec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        templateId: opts.templateId,
        templateName: opts.templateName,
        category: opts.category ?? parent.category,
        input: opts.input,
        intent: opts.intent,
        status: 'processing',
        createdAt: new Date(),
        // continuity chain
        threadId,
        rootExecutionId,
        parentExecutionId: parent.id,
        projectLabel: opts.projectLabel ?? parent.projectLabel,
        knowledgeCollectionId: parent.knowledgeCollectionId,
        starterSource: 'history-followup',
    };
}

/**
 * Build a root execution (first in a new thread).
 * threadId === id and rootExecutionId === id.
 */
export function buildRootExecution(
    base: Omit<Execution, 'threadId' | 'rootExecutionId' | 'parentExecutionId'>,
    opts?: { projectLabel?: string; knowledgeCollectionId?: string; starterSource?: Execution['starterSource'] }
): Execution {
    return {
        ...base,
        threadId: base.id,
        rootExecutionId: base.id,
        projectLabel: opts?.projectLabel,
        knowledgeCollectionId: opts?.knowledgeCollectionId,
        starterSource: opts?.starterSource ?? 'template',
    };
}

/**
 * Return all executions in the same thread, sorted oldest-first.
 */
export function getThreadExecutions(executions: Execution[], threadId: string): Execution[] {
    return executions
        .filter((e) => e.threadId === threadId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

/**
 * Return the root execution of a thread.
 */
export function getRootExecution(executions: Execution[], rootExecutionId: string): Execution | undefined {
    return executions.find((e) => e.id === rootExecutionId);
}

/**
 * Return the parent execution of a given child execution.
 */
export function getParentExecution(executions: Execution[], childExecution: Execution): Execution | undefined {
    if (!childExecution.parentExecutionId) return undefined;
    return executions.find((e) => e.id === childExecution.parentExecutionId);
}

/**
 * Extract a lightweight evidence snapshot from a GovernanceEvidenceReceipt-shaped object.
 * Accepts the loose shape returned by the execute route to avoid a hard type dependency.
 */
export function buildEvidenceSnapshot(
    receipt: Record<string, unknown> | undefined
): ExecutionEvidenceSnapshot | undefined {
    if (!receipt) return undefined;
    return {
        decision: typeof receipt.decision === 'string' ? receipt.decision : undefined,
        riskLevel: typeof receipt.riskLevel === 'string' ? receipt.riskLevel : undefined,
        provider: typeof receipt.provider === 'string' ? receipt.provider : undefined,
        model: typeof receipt.model === 'string' ? receipt.model : undefined,
        policySnapshotId: typeof receipt.policySnapshotId === 'string' ? receipt.policySnapshotId : undefined,
        knowledgeCollectionId: typeof receipt.knowledgeCollectionId === 'string' ? receipt.knowledgeCollectionId : undefined,
        receiptId: typeof receipt.receiptId === 'string' ? receipt.receiptId : undefined,
    };
}

/**
 * Declared W123 continuity parity object.
 * For a parent run and its follow-up child, this object must be reconstructable
 * from the child execution's stored metadata.
 */
export interface ContinuityParityObject {
    threadId: string;
    rootExecutionId: string;
    parentExecutionId: string;
    templateId: string;
    knowledgeCollectionId?: string;
    previousReceiptId?: string;
}

export function buildContinuityParityObject(
    child: Execution
): ContinuityParityObject | null {
    if (!child.threadId || !child.rootExecutionId || !child.parentExecutionId) {
        return null;
    }
    return {
        threadId: child.threadId,
        rootExecutionId: child.rootExecutionId,
        parentExecutionId: child.parentExecutionId,
        templateId: child.templateId,
        knowledgeCollectionId: child.knowledgeCollectionId,
        previousReceiptId: child.evidenceReceiptSnapshot?.receiptId,
    };
}
