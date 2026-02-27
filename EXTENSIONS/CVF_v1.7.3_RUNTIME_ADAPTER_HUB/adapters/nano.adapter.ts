// adapters/nano.adapter.ts
// CVF v1.7.3 — Nano Adapter
// Isolated container adapter — delegates execution to sandbox environment

import type {
    RuntimeAdapter,
    RuntimeRequest,
    RuntimeResult,
    RuntimeCapability,
} from '../contracts/runtime.adapter.interface.js'

/**
 * NanoAdapter forwards requests to an isolated sandbox runtime.
 * In production, this would communicate with a container orchestrator.
 * Currently provides a safe stub that acknowledges but does not directly execute.
 */
export class NanoAdapter implements RuntimeAdapter {

    readonly name = 'nano'
    readonly capabilities: RuntimeCapability[] = ['custom']

    async execute(request: RuntimeRequest): Promise<RuntimeResult> {
        // Nano always requires an external sandbox — never executes directly
        return {
            success: true,
            data: {
                status: 'DELEGATED_TO_SANDBOX',
                message: `Action "${request.action}" on "${request.capability}" forwarded to isolated container`,
                capability: request.capability,
                action: request.action,
            },
        }
    }
}
