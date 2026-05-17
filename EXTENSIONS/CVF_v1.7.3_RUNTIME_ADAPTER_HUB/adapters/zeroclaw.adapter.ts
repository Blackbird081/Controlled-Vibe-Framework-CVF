// adapters/zeroclaw.adapter.ts
// CVF v1.7.3 — ZeroClaw Runtime Adapter
// HTTP-only adapter for low-latency external API calls

import type {
    RuntimeAdapter,
    RuntimeRequest,
    RuntimeResult,
    RuntimeCapability,
} from '../contracts/runtime.adapter.interface.js'
import { executeHttpAction } from './base.adapter.js'

export class ZeroClawAdapter implements RuntimeAdapter {

    readonly name = 'zeroclaw'
    readonly capabilities: RuntimeCapability[] = ['http']

    async execute(request: RuntimeRequest): Promise<RuntimeResult> {
        try {
            if (request.capability === 'http') {
                return await executeHttpAction(request)
            }

            return { success: false, error: `ZeroClaw only supports HTTP. Got: ${request.capability}` }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err)
            return { success: false, error: message }
        }
    }
}
