// adapters/base.adapter.ts
// CVF v1.7.3 — Shared base logic for filesystem operations
// Extracted to eliminate code duplication across adapters

import * as fs from 'fs'
import * as path from 'path'
import type { RuntimeRequest, RuntimeResult } from '../contracts/runtime.adapter.interface.js'

/**
 * Shared filesystem operations used by multiple adapters.
 * Each adapter can call these helpers instead of duplicating logic.
 */
export function executeFilesystemAction(request: RuntimeRequest): RuntimeResult {
    const payload = request.payload ?? {}
    const filePath = payload['path'] as string | undefined

    if (!filePath) {
        return { success: false, error: 'Missing required field: payload.path' }
    }

    switch (request.action) {
        case 'read': {
            if (!fs.existsSync(filePath)) {
                return { success: false, error: `File not found: ${filePath}` }
            }
            const data = fs.readFileSync(filePath, 'utf-8')
            return { success: true, data }
        }

        case 'write': {
            const content = payload['content'] as string | undefined
            if (content === undefined) {
                return { success: false, error: 'Missing required field: payload.content' }
            }
            const dir = path.dirname(filePath)
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true })
            }
            fs.writeFileSync(filePath, content, 'utf-8')
            return { success: true }
        }

        default:
            return { success: false, error: `Unsupported filesystem action: ${request.action}` }
    }
}

/**
 * Shared HTTP operations using native fetch (no axios dependency).
 */
export async function executeHttpAction(request: RuntimeRequest): Promise<RuntimeResult> {
    const payload = request.payload ?? {}
    const url = payload['url'] as string | undefined

    if (!url) {
        return { success: false, error: 'Missing required field: payload.url' }
    }

    const method = (payload['method'] as string) ?? 'GET'
    const headers = (payload['headers'] as Record<string, string>) ?? {}
    const body = payload['body'] as string | undefined

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30_000) // 30s timeout

    try {
        const response = await fetch(url, {
            method,
            headers,
            body,
            signal: controller.signal,
        })

        const data = await response.text()
        return {
            success: response.ok,
            data,
            error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
        }
    } finally {
        clearTimeout(timeout)
    }
}
