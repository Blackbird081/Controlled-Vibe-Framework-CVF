import { createMaoInvocationIdentity, validateMaoInvocationRequest, type MaoInvocationRequest, type MaoInvocationResult } from './delegation.adapter.contract';
import type { MaoOperationalLaunchRequest } from './operational.worker.launcher';
import type { MaoFileRunStore } from './durable.run.store';
import type { MaoLifecycleController } from './lifecycle.controller.contract';
import type { MaoEventLedgerEntry } from './event.ledger.contract';
import { currentStateOf, hasIdempotencyKeyPrefix, milestoneIdempotencyKey } from './operational.worker.launcher.reconciliation';

export interface MaoAsyncInferencePort<T> {
  invoke(request: MaoInvocationRequest, options: { signal?: AbortSignal }): Promise<{ invocationResult: MaoInvocationResult; payload?: T }>;
}
export type MaoAsyncLaunchResult<T> =
  | { ok: true; replayed: false; invocationResult: Extract<MaoInvocationResult, {ok:true}>; payload: T; durableEvidence: readonly MaoEventLedgerEntry[] }
  | { ok: false; reason: string; detail: string; durableEvidence: readonly MaoEventLedgerEntry[] };

/** One bounded invocation on a pre-created graph. Existing sync launch remains separate. */
export async function launchMaoAsync<T>(store: MaoFileRunStore, lifecycle: MaoLifecycleController,
  request: MaoOperationalLaunchRequest, port: MaoAsyncInferencePort<T>, options: { signal?: AbortSignal } = {}): Promise<MaoAsyncLaunchResult<T>> {
  const evidence: MaoEventLedgerEntry[] = [];
  const failure = (reason: string, detail: string): MaoAsyncLaunchResult<T> => ({ ok: false, reason, detail, durableEvidence: evidence });
  if (request.timeoutCeilingMs !== undefined && request.timeoutCeilingMs !== null && (!Number.isSafeInteger(request.timeoutCeilingMs) || request.timeoutCeilingMs < 0)) return failure('INVALID_TIMEOUT', 'Timeout must be a nonnegative safe integer.');
  if (request.delegation) return failure('DELEGATION_UNSUPPORTED', 'Single-worker async launch does not admit delegation.');
  if (options.signal?.aborted) return failure('CANCELLED_BEFORE_START', 'Request cancelled before invocation.');
  const resumed = await store.resumeRun(request.taskGraphId);
  if (!resumed.ok) return failure('DURABLE_STORE_REJECTED', resumed.reason);
  const {graph, events} = resumed;
  const graphCeiling = graph.authorityEnvelope.budget.wallClockCeilingMs;
  if (graphCeiling !== null && (!Number.isSafeInteger(graphCeiling) || graphCeiling < 0)) return failure('INVALID_TIMEOUT', 'Graph ceiling must be a nonnegative safe integer.');
  const ceilings = [request.timeoutCeilingMs, graphCeiling].filter((v): v is number => v !== undefined && v !== null);
  const effectiveCeiling = ceilings.length ? Math.min(...ceilings) : null;
  const multiTask = graph.tasks.length > 1;
  const target = graph.tasks.find(task => task.taskId === request.taskId);
  if (!target) return failure('UNKNOWN_OR_NON_RUNNABLE_TASK', multiTask ? 'The target task is not declared in this graph.' : 'Exactly one graph task is required.');
  if (!multiTask && (graph.authorityEnvelope.budget.maxInvocations !== 1 || graph.authorityEnvelope.budget.maxConcurrentRoles !== 1)) return failure('UNKNOWN_OR_NON_RUNNABLE_TASK', 'Exactly one graph task is required.');
  if (hasIdempotencyKeyPrefix(events, request.taskId, request.launchIdempotencyKey) || currentStateOf(events, request.taskId) !== null)
    return failure('DUPLICATE_LAUNCH_ADAPTER_NOT_CALLED', 'Existing task history is not replayed.');
  if (multiTask) {
    // Multi-task graphs: strictly sequential starts and a hard invocation budget, read from existing durable events only.
    if (graph.tasks.some(task => task.taskId !== request.taskId && ['admitted', 'running'].includes(currentStateOf(events, task.taskId) ?? '')))
      return failure('UNKNOWN_OR_NON_RUNNABLE_TASK', 'Another task of this graph is admitted or running; starts are sequential only.');
    if (new Set(events.filter(event => event.eventType === 'INVOCATION_STARTED').map(event => event.taskId)).size >= graph.authorityEnvelope.budget.maxInvocations)
      return failure('INVOCATION_BUDGET_EXHAUSTED', 'The authority invocation budget is exhausted.');
  }
  if (!lifecycle.mayStartNewChild(request.taskId)) return failure('CANCELLATION_BLOCKS_NEW_CHILD', 'Cancellation blocks admission.');
  const invocation: MaoInvocationRequest = { graph, admission: request.admission, taskId: request.taskId, capability: request.capability,
    inputManifest: request.inputManifest, idempotencyKey: request.launchIdempotencyKey, startedAt: lifecycle.clock.now(), adapterId: 'cvf-web-canonical-gateway' };
  const rejected = validateMaoInvocationRequest(invocation);
  if (rejected) return failure('ADAPTER_REJECTED', rejected.reason);
  const append = async (eventType: 'GRAPH_COMPILED' | 'TASK_ADMITTED' | 'INVOCATION_STARTED' | 'INVOCATION_COMPLETED', resultingState: 'planned'|'admitted'|'running'|'succeeded', suffix: string, occurredAt = lifecycle.clock.now()): Promise<boolean> => {
    try {
      const result = await store.appendEvent(request.taskGraphId, { taskGraphId: request.taskGraphId, taskId: request.taskId, eventType, resultingState, occurredAt,
        idempotencyKey: milestoneIdempotencyKey(request.launchIdempotencyKey, suffix) });
      if (!result.ok) return false;
      evidence.push(result.appendedEntry); return true;
    } catch { return false; }
  };
  if (!(await append('GRAPH_COMPILED','planned','TASK_PLANNED'))) return failure('LIFECYCLE_MILESTONE_PERSISTENCE_FAILED', 'Planned state unconfirmed.');
  if (options.signal?.aborted || !lifecycle.mayStartNewChild(request.taskId)) return failure('CANCELLED_BEFORE_START', 'Request cancelled before admission.');
  if (!(await append('TASK_ADMITTED','admitted','TASK_ADMITTED'))) return failure('LIFECYCLE_MILESTONE_PERSISTENCE_FAILED', 'Admission unconfirmed.');
  if (options.signal?.aborted || !lifecycle.mayStartNewChild(request.taskId)) return failure('CANCELLED_BEFORE_START', 'Request cancelled before start.');
  invocation.startedAt = lifecycle.clock.now();
  if (!(await append('INVOCATION_STARTED','running','INVOCATION_STARTED',invocation.startedAt))) return failure('LIFECYCLE_MILESTONE_PERSISTENCE_FAILED', 'Start unconfirmed; port not called.');
  if (options.signal?.aborted || !lifecycle.mayStartNewChild(request.taskId)) return failure('OUTCOME_UNKNOWN', 'Started milestone committed; cancellation does not prove outcome.');
  let timer: ReturnType<typeof setTimeout> | undefined;
  let abortListener: (() => void) | undefined;
  const interrupted = new Promise<never>((_, reject) => {
    if (options.signal) { abortListener = () => reject(new Error('cancelled')); options.signal.addEventListener('abort', abortListener, {once:true}); if (options.signal.aborted) abortListener(); }
    if (effectiveCeiling !== null) timer = setTimeout(() => reject(new Error('timeout')), effectiveCeiling);
  });
  const timedOut = () => lifecycle.checkTimeout(invocation.startedAt, effectiveCeiling).timedOut;
  try {
    const result = await Promise.race([port.invoke(invocation, {signal:options.signal}), interrupted]);
    if (!result.invocationResult.ok || result.payload === undefined || options.signal?.aborted || timedOut() || !lifecycle.mayStartNewChild(request.taskId)) return failure('OUTCOME_UNKNOWN', 'Invocation outcome or payload unconfirmed.');
    const r = result.invocationResult.receipt, identity = createMaoInvocationIdentity(invocation);
    const validUtc = (value: string) => Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
    const observedNow = lifecycle.clock.now();
    if (result.invocationResult.replayed || r.adapterId !== invocation.adapterId || !validUtc(r.completedAt ?? '') || !validUtc(observedNow) || Date.parse(r.completedAt!) < Date.parse(invocation.startedAt) || Date.parse(r.completedAt!) > Date.parse(observedNow) || r.taskId !== request.taskId || r.authorityHash !== graph.authorityEnvelope.authorityHash || r.idempotencyKey !== request.launchIdempotencyKey ||
        r.role !== target.role || r.diagnosticClass !== null || r.invocationId !== identity.invocationId || r.attemptId !== identity.attemptId || r.inputManifestHash !== identity.inputManifestHash || r.startedAt !== invocation.startedAt || r.completedAt === null)
      return failure('OUTCOME_UNKNOWN', 'Actual receipt does not match the admitted attempt.');
    const current = await store.resumeRun(request.taskGraphId);
    if (!current.ok || currentStateOf(current.events,request.taskId) !== 'running' || options.signal?.aborted || timedOut() || !lifecycle.mayStartNewChild(request.taskId)) return failure('OUTCOME_UNKNOWN', 'Running state changed or could not be confirmed.');
    if (!(await append('INVOCATION_COMPLETED','succeeded','INVOCATION_COMPLETED'))) return failure('OUTCOME_UNKNOWN', 'Completion persistence unconfirmed.');
    if (options.signal?.aborted || timedOut() || !lifecycle.mayStartNewChild(request.taskId)) return failure('OUTCOME_UNKNOWN', 'Completion elapsed or cancellation was observed.');
    return {ok:true,replayed:false,invocationResult:result.invocationResult,payload:result.payload,durableEvidence:evidence};
  } catch { return failure('OUTCOME_UNKNOWN', 'Invocation interrupted or failed after start.'); }
  finally { if (timer !== undefined) clearTimeout(timer); if (abortListener) options.signal?.removeEventListener('abort',abortListener); }
}
