// CVF v1.8 — Execution ID Generator
// Every execution gets a unique, traceable ID

import { randomUUID } from 'crypto'

export function generateExecutionId(): string {
    const timestamp = Date.now().toString(36)
    const random = randomUUID().replace(/-/g, '').slice(0, 8)
    return `cvf-exec-${timestamp}-${random}`
}

export function isValidExecutionId(id: string): boolean {
    return /^cvf-exec-[a-z0-9]+-[a-z0-9]{8}$/.test(id)
}
