import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Execution } from '@/types';
import { trackEvent } from '@/lib/analytics';

interface ExecutionStore {
    executions: Execution[];
    currentExecution: Execution | null;

    addExecution: (execution: Execution) => void;
    updateExecution: (id: string, updates: Partial<Execution>) => void;
    setCurrentExecution: (execution: Execution | null) => void;
    getExecutionById: (id: string) => Execution | undefined;
}

export const useExecutionStore = create<ExecutionStore>()(
    persist(
        (set, get) => ({
            executions: [],
            currentExecution: null,

            addExecution: (execution) => {
                trackEvent('execution_created', {
                    templateId: execution.templateId,
                    templateName: execution.templateName,
                    category: execution.category,
                });
                return set((state) => ({
                    executions: [execution, ...state.executions],
                    currentExecution: execution,
                }));
            },

            updateExecution: (id, updates) => {
                const existing = get().executions.find((e) => e.id === id);
                const context = existing
                    ? {
                        templateId: existing.templateId,
                        templateName: existing.templateName,
                        category: existing.category,
                    }
                    : {};
                if (updates.status === 'completed') {
                    trackEvent('execution_completed', {
                        id,
                        qualityScore: updates.qualityScore,
                        ...context,
                    });
                }
                if (updates.result === 'accepted') {
                    trackEvent('execution_accepted', { id, ...context });
                }
                if (updates.result === 'rejected') {
                    trackEvent('execution_rejected', { id, ...context });
                }

                return set((state) => ({
                    executions: state.executions.map((e) =>
                        e.id === id ? { ...e, ...updates } : e
                    ),
                    currentExecution: state.currentExecution?.id === id
                        ? { ...state.currentExecution, ...updates }
                        : state.currentExecution,
                }));
            },

            setCurrentExecution: (execution) => set({ currentExecution: execution }),

            getExecutionById: (id) => get().executions.find((e) => e.id === id),
        }),
        {
            name: 'cvf-executions-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
