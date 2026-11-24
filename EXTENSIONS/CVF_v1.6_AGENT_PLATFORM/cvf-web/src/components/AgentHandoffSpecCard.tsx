'use client';

import type { AgentHandoffSpec, HandoffCriterionStatus } from '@/lib/agent-handoff-spec';

const STATUS_CLASS: Record<HandoffCriterionStatus, string> = {
    MET: 'text-green-700 dark:text-green-300',
    UNMET: 'text-red-700 dark:text-red-300',
    UNVERIFIED: 'text-gray-700 dark:text-gray-300',
};

/** Compact view of the English agent handoff spec that the exported pack carries in full. */
export function AgentHandoffSpecCard({ spec }: { spec: AgentHandoffSpec }) {
    const rework = spec.readiness === 'REWORK_REQUIRED';
    return (
        <div data-testid="agent-handoff-spec" className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Agent Handoff Spec</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${rework ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200'}`}>
                    {spec.readiness}
                </span>
            </div>
            <p className="text-sm text-gray-800 dark:text-gray-200">{spec.goal}</p>
            <ul className="space-y-1 text-sm">
                {spec.acceptanceCriteria.map(item => (
                    <li key={item.id} className="text-gray-700 dark:text-gray-300">
                        <strong className={STATUS_CLASS[item.status]}>{item.status}</strong> {item.criterion}
                    </li>
                ))}
            </ul>
            <div>
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Remaining Work</div>
                <ol className="list-decimal pl-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    {spec.remainingWork.map((item, i) => <li key={i}>{item}</li>)}
                </ol>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">The downloaded pack contains the full spec, the original request verbatim and a machine-readable copy.</p>
        </div>
    );
}
