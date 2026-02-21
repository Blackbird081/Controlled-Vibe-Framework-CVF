import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Execution } from '@/types';
import { trackEvent } from '@/lib/analytics';
import type { LedgerBlock, GovernanceConnectionStatus } from '@/types/governance-engine';
import { validateChain, type ChainValidationResult } from '@/lib/ledger-validator';

interface ExecutionStore {
    executions: Execution[];
    currentExecution: Execution | null;

    addExecution: (execution: Execution) => void;
    updateExecution: (id: string, updates: Partial<Execution>) => void;
    setCurrentExecution: (execution: Execution | null) => void;
    getExecutionById: (id: string) => Execution | undefined;

    // Governance Engine state
    ledgerEntries: LedgerBlock[];
    ledgerValid: boolean;
    ledgerValidation: ChainValidationResult | null;
    lastLedgerSync: string | null;
    governanceConnectionStatus: GovernanceConnectionStatus;
    governanceVersion: string | null;

    fetchLedger: () => Promise<void>;
    validateLedger: () => Promise<void>;
    checkGovernanceHealth: () => Promise<void>;
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

            // ── Governance Engine ──────────────────────────────

            ledgerEntries: [],
            ledgerValid: true,
            ledgerValidation: null,
            lastLedgerSync: null,
            governanceConnectionStatus: 'disconnected',
            governanceVersion: null,

            fetchLedger: async () => {
                try {
                    const res = await fetch('/api/governance/ledger?limit=500');
                    const json = await res.json();
                    if (json.success && json.data) {
                        const entries = json.data.entries || [];
                        const validation = await validateChain(entries);
                        set({
                            ledgerEntries: entries,
                            ledgerValid: validation.valid,
                            ledgerValidation: validation,
                            lastLedgerSync: new Date().toISOString(),
                        });
                    }
                } catch {
                    // Silently fail — ledger sync is best-effort
                }
            },

            validateLedger: async () => {
                const entries = get().ledgerEntries;
                const validation = await validateChain(entries);
                set({
                    ledgerValid: validation.valid,
                    ledgerValidation: validation,
                });
            },

            checkGovernanceHealth: async () => {
                try {
                    set({ governanceConnectionStatus: 'checking' });
                    const res = await fetch('/api/governance/health');
                    const json = await res.json();
                    if (json.success) {
                        set({
                            governanceConnectionStatus: 'connected',
                            governanceVersion: json.version || null,
                        });
                    } else {
                        set({ governanceConnectionStatus: 'disconnected', governanceVersion: null });
                    }
                } catch {
                    set({ governanceConnectionStatus: 'disconnected', governanceVersion: null });
                }
            },
        }),
        {
            name: 'cvf-executions-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
