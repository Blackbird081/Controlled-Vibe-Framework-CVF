// W123-T1: execution-continuity.test.ts
// Covers CP1 continuity model + CP5 parity object assertions.

import { describe, it, expect } from 'vitest';
import {
    buildContinuationExecution,
    buildRootExecution,
    getThreadExecutions,
    getRootExecution,
    getParentExecution,
    buildEvidenceSnapshot,
    buildContinuityParityObject,
} from './execution-continuity';
import type { Execution } from '@/types';

// ── helpers ─────────────────────────────────────────────────────────────────

function makeExecution(overrides: Partial<Execution> = {}): Execution {
    return {
        id: `exec_${Math.random().toString(36).slice(2, 8)}`,
        templateId: 'app_builder',
        templateName: 'App Builder',
        category: 'development',
        input: { goal: 'build a task manager' },
        intent: 'Build task management app',
        status: 'completed',
        result: 'accepted',
        createdAt: new Date('2026-04-27T08:00:00Z'),
        ...overrides,
    };
}

// ── CP1: buildRootExecution ──────────────────────────────────────────────────

describe('buildRootExecution', () => {
    it('sets threadId === id and rootExecutionId === id', () => {
        const base = makeExecution({ id: 'root_1' });
        const root = buildRootExecution(base);
        expect(root.threadId).toBe('root_1');
        expect(root.rootExecutionId).toBe('root_1');
        expect(root.parentExecutionId).toBeUndefined();
    });

    it('carries optional projectLabel, knowledgeCollectionId, starterSource', () => {
        const base = makeExecution({ id: 'root_2' });
        const root = buildRootExecution(base, {
            projectLabel: 'My Project',
            knowledgeCollectionId: 'col_abc',
            starterSource: 'wizard',
        });
        expect(root.projectLabel).toBe('My Project');
        expect(root.knowledgeCollectionId).toBe('col_abc');
        expect(root.starterSource).toBe('wizard');
    });

    it('defaults starterSource to template when omitted', () => {
        const root = buildRootExecution(makeExecution({ id: 'root_3' }));
        expect(root.starterSource).toBe('template');
    });
});

// ── CP1: buildContinuationExecution ─────────────────────────────────────────

describe('buildContinuationExecution', () => {
    it('links to parent thread: threadId, rootExecutionId, parentExecutionId', () => {
        const parent = buildRootExecution(makeExecution({ id: 'parent_1' }));
        const child = buildContinuationExecution({
            templateId: 'app_builder',
            templateName: 'App Builder',
            input: { goal: 'add authentication' },
            intent: 'Add auth to task manager',
            parentExecution: parent,
        });
        expect(child.threadId).toBe('parent_1');
        expect(child.rootExecutionId).toBe('parent_1');
        expect(child.parentExecutionId).toBe('parent_1');
        expect(child.starterSource).toBe('history-followup');
    });

    it('inherits threadId from parent (not root) when chaining multiple levels', () => {
        const root = buildRootExecution(makeExecution({ id: 'root_x' }));
        const child1 = buildContinuationExecution({
            templateId: 'app_builder',
            templateName: 'App Builder',
            input: { goal: 'step 2' },
            intent: 'step 2',
            parentExecution: root,
        });
        const child2 = buildContinuationExecution({
            templateId: 'app_builder',
            templateName: 'App Builder',
            input: { goal: 'step 3' },
            intent: 'step 3',
            parentExecution: child1,
        });
        expect(child2.threadId).toBe('root_x');
        expect(child2.rootExecutionId).toBe('root_x');
        expect(child2.parentExecutionId).toBe(child1.id);
    });

    it('carries knowledgeCollectionId from parent by default', () => {
        const parent = buildRootExecution(makeExecution({ id: 'p_k' }), {
            knowledgeCollectionId: 'col_project',
        });
        const child = buildContinuationExecution({
            templateId: 'app_builder',
            templateName: 'App Builder',
            input: { goal: 'continue' },
            intent: 'continue',
            parentExecution: parent,
        });
        expect(child.knowledgeCollectionId).toBe('col_project');
    });

    it('carries projectLabel from parent when not overridden', () => {
        const parent = buildRootExecution(makeExecution({ id: 'p_lbl' }), {
            projectLabel: 'Task App',
        });
        const child = buildContinuationExecution({
            templateId: 'app_builder',
            templateName: 'App Builder',
            input: { goal: 'next step' },
            intent: 'next step',
            parentExecution: parent,
        });
        expect(child.projectLabel).toBe('Task App');
    });

    it('overrides projectLabel when provided', () => {
        const parent = buildRootExecution(makeExecution({ id: 'p_lbl2' }), {
            projectLabel: 'Old Label',
        });
        const child = buildContinuationExecution({
            templateId: 'app_builder',
            templateName: 'App Builder',
            input: { goal: 'new focus' },
            intent: 'new focus',
            parentExecution: parent,
            projectLabel: 'New Label',
        });
        expect(child.projectLabel).toBe('New Label');
    });
});

// ── CP1: thread selectors ────────────────────────────────────────────────────

describe('getThreadExecutions', () => {
    it('returns executions sharing threadId sorted oldest-first', () => {
        const root = buildRootExecution(
            makeExecution({ id: 't1', createdAt: new Date('2026-04-27T09:00:00Z') })
        );
        const child = buildContinuationExecution({
            templateId: 'app_builder',
            templateName: 'App Builder',
            input: { goal: 'step 2' },
            intent: 'step 2',
            parentExecution: root,
        });
        // patch child id to deterministic value for test
        const childWithTime = { ...child, createdAt: new Date('2026-04-27T10:00:00Z') };
        const unrelated = makeExecution({ id: 'other' });
        const all = [childWithTime, root, unrelated];
        const thread = getThreadExecutions(all, 't1');
        expect(thread.length).toBe(2);
        expect(thread[0].id).toBe('t1');
        expect(thread[1].id).toBe(childWithTime.id);
    });

    it('returns empty array when threadId has no matches', () => {
        const execs = [makeExecution({ id: 'e1' })];
        expect(getThreadExecutions(execs, 'nonexistent')).toEqual([]);
    });
});

describe('getRootExecution', () => {
    it('finds execution by id', () => {
        const root = makeExecution({ id: 'root_find' });
        const execs = [root, makeExecution({ id: 'other' })];
        expect(getRootExecution(execs, 'root_find')?.id).toBe('root_find');
    });

    it('returns undefined for unknown id', () => {
        expect(getRootExecution([], 'missing')).toBeUndefined();
    });
});

describe('getParentExecution', () => {
    it('returns parent when parentExecutionId is set', () => {
        const parent = makeExecution({ id: 'par_1' });
        const child = makeExecution({ parentExecutionId: 'par_1' });
        expect(getParentExecution([parent, child], child)?.id).toBe('par_1');
    });

    it('returns undefined for root execution (no parentExecutionId)', () => {
        const root = makeExecution({});
        expect(getParentExecution([root], root)).toBeUndefined();
    });
});

// ── CP1: buildEvidenceSnapshot ───────────────────────────────────────────────

describe('buildEvidenceSnapshot', () => {
    it('extracts known fields from receipt-shaped object', () => {
        const receipt = {
            decision: 'ALLOW',
            riskLevel: 'NORMAL',
            provider: 'alibaba',
            model: 'qwen-turbo',
            policySnapshotId: 'psnap_1',
            knowledgeCollectionId: 'col_1',
            receiptId: 'rcpt_1',
            extra: 'ignored',
        };
        const snap = buildEvidenceSnapshot(receipt);
        expect(snap).toEqual({
            decision: 'ALLOW',
            riskLevel: 'NORMAL',
            provider: 'alibaba',
            model: 'qwen-turbo',
            policySnapshotId: 'psnap_1',
            knowledgeCollectionId: 'col_1',
            receiptId: 'rcpt_1',
        });
    });

    it('returns undefined for undefined input', () => {
        expect(buildEvidenceSnapshot(undefined)).toBeUndefined();
    });

    it('handles missing fields gracefully', () => {
        const snap = buildEvidenceSnapshot({ decision: 'BLOCK' });
        expect(snap?.decision).toBe('BLOCK');
        expect(snap?.riskLevel).toBeUndefined();
    });
});

// ── CP5: buildContinuityParityObject ────────────────────────────────────────

describe('buildContinuityParityObject', () => {
    it('returns full parity object for a well-formed child execution', () => {
        const parent = buildRootExecution(makeExecution({ id: 'root_parity' }), {
            knowledgeCollectionId: 'col_parity',
        });
        const child = buildContinuationExecution({
            templateId: 'app_builder',
            templateName: 'App Builder',
            input: { goal: 'parity test' },
            intent: 'parity',
            parentExecution: parent,
        });
        const childWithReceipt = {
            ...child,
            evidenceReceiptSnapshot: { receiptId: 'rcpt_parity', decision: 'ALLOW' },
        };
        const parity = buildContinuityParityObject(childWithReceipt);
        expect(parity).not.toBeNull();
        expect(parity!.threadId).toBe('root_parity');
        expect(parity!.rootExecutionId).toBe('root_parity');
        expect(parity!.parentExecutionId).toBe('root_parity');
        expect(parity!.templateId).toBe('app_builder');
        expect(parity!.knowledgeCollectionId).toBe('col_parity');
        expect(parity!.previousReceiptId).toBe('rcpt_parity');
    });

    it('returns null for a root execution (no parentExecutionId)', () => {
        const root = buildRootExecution(makeExecution({ id: 'root_no_parity' }));
        expect(buildContinuityParityObject(root)).toBeNull();
    });

    it('returns null when threadId is missing', () => {
        const exec = makeExecution({ parentExecutionId: 'some_parent', rootExecutionId: 'some_root' });
        expect(buildContinuityParityObject(exec)).toBeNull();
    });
});
