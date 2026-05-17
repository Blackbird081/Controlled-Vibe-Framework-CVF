import { create } from 'zustand';
import { Execution } from '@/types';

interface ExecutionStore {
    executions: Execution[];
    currentExecution: Execution | null;

    addExecution: (execution: Execution) => void;
    updateExecution: (id: string, updates: Partial<Execution>) => void;
    setCurrentExecution: (execution: Execution | null) => void;
    getExecutionById: (id: string) => Execution | undefined;
}

export const useExecutionStore = create<ExecutionStore>((set, get) => ({
    executions: [],
    currentExecution: null,

    addExecution: (execution) => set((state) => ({
        executions: [execution, ...state.executions],
        currentExecution: execution,
    })),

    updateExecution: (id, updates) => set((state) => ({
        executions: state.executions.map((e) =>
            e.id === id ? { ...e, ...updates } : e
        ),
        currentExecution: state.currentExecution?.id === id
            ? { ...state.currentExecution, ...updates }
            : state.currentExecution,
    })),

    setCurrentExecution: (execution) => set({ currentExecution: execution }),

    getExecutionById: (id) => get().executions.find((e) => e.id === id),
}));
