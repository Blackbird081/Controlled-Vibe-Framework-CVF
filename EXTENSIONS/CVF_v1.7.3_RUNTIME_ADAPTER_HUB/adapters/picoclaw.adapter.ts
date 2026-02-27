// adapters/picoclaw.adapter.ts
// CVF v1.7.3 — PicoClaw Runtime Adapter
// Lightweight adapter: filesystem only (self-contained, minimal footprint)

import type {
    RuntimeAdapter,
    RuntimeRequest,
    RuntimeResult,
    RuntimeCapability,
} from '../contracts/runtime.adapter.interface.js'
import { executeFilesystemAction } from './base.adapter.js'

export class PicoClawAdapter implements RuntimeAdapter {

    readonly name = 'picoclaw'
    readonly capabilities: RuntimeCapability[] = ['filesystem']

    async execute(request: RuntimeRequest): Promise<RuntimeResult> {
        try {
            if (request.capability === 'filesystem') {
                return executeFilesystemAction(request)
            }

            return { success: false, error: `PicoClaw only supports filesystem. Got: ${request.capability}` }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err)
            return { success: false, error: message }
        }
    }
}
