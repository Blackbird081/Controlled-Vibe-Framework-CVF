// adapters/openclaw.adapter.ts
// CVF v1.7.3 — OpenClaw Runtime Adapter
// Most capable adapter: filesystem + http + shell (with safety timeout)

import { exec } from 'child_process'
import type {
    RuntimeAdapter,
    RuntimeRequest,
    RuntimeResult,
    RuntimeCapability,
} from '../contracts/runtime.adapter.interface.js'
import { executeFilesystemAction, executeHttpAction } from './base.adapter.js'

const SHELL_TIMEOUT_MS = 10_000 // 10 second timeout for shell commands

export class OpenClawAdapter implements RuntimeAdapter {

    readonly name = 'openclaw'
    readonly capabilities: RuntimeCapability[] = ['filesystem', 'shell', 'http']

    async execute(request: RuntimeRequest): Promise<RuntimeResult> {
        try {
            switch (request.capability) {
                case 'filesystem':
                    return executeFilesystemAction(request)

                case 'shell':
                    return await this.executeShell(request)

                case 'http':
                    return await executeHttpAction(request)

                default:
                    return { success: false, error: `Unsupported capability: ${request.capability}` }
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err)
            return { success: false, error: message }
        }
    }

    private executeShell(request: RuntimeRequest): Promise<RuntimeResult> {
        const payload = request.payload ?? {}
        const command = payload['command'] as string | undefined

        if (!command) {
            return Promise.resolve({ success: false, error: 'Missing required field: payload.command' })
        }

        return new Promise((resolve) => {
            const child = exec(command, { timeout: SHELL_TIMEOUT_MS }, (error, stdout, stderr) => {
                if (error) {
                    resolve({ success: false, error: error.message })
                } else {
                    resolve({ success: true, data: stdout || stderr })
                }
            })

            // Safety: kill on timeout
            setTimeout(() => {
                child.kill('SIGTERM')
            }, SHELL_TIMEOUT_MS + 500)
        })
    }
}
