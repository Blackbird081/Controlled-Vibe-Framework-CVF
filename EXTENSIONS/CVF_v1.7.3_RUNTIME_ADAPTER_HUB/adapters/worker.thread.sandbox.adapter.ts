// adapters/worker.thread.sandbox.adapter.ts
// CVF v1.7.3 — WorkerThread Sandbox Adapter
// Track 5B: First concrete sandbox executor using Node.js worker_threads.
// Doctrine basis: CVF_ARCHITECTURE_PRINCIPLES.md §7 (Isolation), §11 (Composability)
// Wiring target: SandboxIsolationContract executor interface

import { Worker } from 'worker_threads'
import type {
    SandboxExecutor,
    SandboxCommand,
    SandboxConfig,
    SandboxResult,
    ContainmentViolation,
    ContainmentViolationType,
} from '../../CVF_v1.7.1_SAFETY_RUNTIME/simulation/sandbox.isolation.contract.js'

let workerIdCounter = 0

export class WorkerThreadSandboxAdapter implements SandboxExecutor {
    readonly platform = 'worker_threads' as const

    async execute(command: SandboxCommand, config: SandboxConfig): Promise<SandboxResult> {
        const sandboxId = `wt-${++workerIdCounter}-${Date.now()}`
        const startedAt = new Date().toISOString()
        const violations: ContainmentViolation[] = []

        // Pre-execution policy checks (synchronous governance validation)
        if (config.networkPolicy.allowEgress && config.networkPolicy.allowedHosts.length === 0) {
            violations.push({
                type: 'NETWORK_EGRESS' as ContainmentViolationType,
                detail: 'Unrestricted egress attempted — blocked by sandbox policy',
                detectedAt: startedAt,
            })
        }

        if (!config.filesystemPolicy.allowWrite && command.args?.some(a => a.includes('--write') || a.includes('-w'))) {
            violations.push({
                type: 'FILESYSTEM_BREACH' as ContainmentViolationType,
                detail: 'Write operation attempted with allowWrite=false',
                detectedAt: startedAt,
            })
        }

        // If pre-execution violations found, return without executing
        if (violations.length > 0) {
            return {
                sandboxId,
                status: 'CONTAINMENT_VIOLATION',
                startedAt,
                completedAt: new Date().toISOString(),
                exitCode: -1,
                stdout: '',
                stderr: violations.map(v => `[${v.type}] ${v.detail}`).join('\n'),
                containmentViolations: violations,
                resourceUsage: { cpuTimeMs: 0, memoryPeakMb: 0, outputBytes: 0 },
                platform: 'worker_threads',
            }
        }

        // Execute command in worker thread with timeout enforcement
        try {
            const result = await this.runInWorker(command, config)

            // Post-execution resource limit checks
            if (result.resourceUsage.cpuTimeMs > config.resourceLimits.maxCpuTimeMs) {
                violations.push({
                    type: 'RESOURCE_LIMIT_EXCEEDED',
                    detail: `CPU time ${result.resourceUsage.cpuTimeMs}ms exceeded limit ${config.resourceLimits.maxCpuTimeMs}ms`,
                    detectedAt: new Date().toISOString(),
                })
            }

            if (result.resourceUsage.outputBytes > config.resourceLimits.maxOutputBytes) {
                violations.push({
                    type: 'RESOURCE_LIMIT_EXCEEDED',
                    detail: `Output ${result.resourceUsage.outputBytes} bytes exceeded limit ${config.resourceLimits.maxOutputBytes} bytes`,
                    detectedAt: new Date().toISOString(),
                })
            }

            return {
                ...result,
                sandboxId,
                containmentViolations: violations,
                status: violations.length > 0 ? 'CONTAINMENT_VIOLATION' : result.status,
                platform: 'worker_threads',
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err)
            const isTimeout = message.includes('timeout') || message.includes('TIMEOUT')

            return {
                sandboxId,
                status: isTimeout ? 'TIMEOUT' : 'FAILED',
                startedAt,
                completedAt: new Date().toISOString(),
                exitCode: -1,
                stdout: '',
                stderr: message,
                containmentViolations: isTimeout
                    ? [{
                        type: 'TIMEOUT_EXCEEDED',
                        detail: `Execution exceeded timeout of ${config.timeoutMs}ms`,
                        detectedAt: new Date().toISOString(),
                    }]
                    : [],
                resourceUsage: { cpuTimeMs: 0, memoryPeakMb: 0, outputBytes: 0 },
                platform: 'worker_threads',
            }
        }
    }

    private runInWorker(command: SandboxCommand, config: SandboxConfig): Promise<SandboxResult> {
        return new Promise((resolve, reject) => {
            const startTime = Date.now()
            const startedAt = new Date().toISOString()

            // Worker inline script: executes the command in an isolated thread
            const workerCode = `
                const { parentPort, workerData } = require('worker_threads');
                const { execSync } = require('child_process');

                try {
                    const cmd = workerData.args && workerData.args.length > 0
                        ? workerData.command + ' ' + workerData.args.join(' ')
                        : workerData.command;

                    const options = {
                        timeout: workerData.timeoutMs,
                        maxBuffer: workerData.maxOutputBytes,
                        env: { ...process.env, ...workerData.env },
                    };

                    if (workerData.workingDir) {
                        options.cwd = workerData.workingDir;
                    }

                    const stdout = execSync(cmd, options);
                    parentPort.postMessage({
                        exitCode: 0,
                        stdout: stdout ? stdout.toString() : '',
                        stderr: '',
                    });
                } catch (err) {
                    parentPort.postMessage({
                        exitCode: err.status || 1,
                        stdout: err.stdout ? err.stdout.toString() : '',
                        stderr: err.stderr ? err.stderr.toString() : err.message,
                    });
                }
            `

            const worker = new Worker(workerCode, {
                eval: true,
                workerData: {
                    command: command.command,
                    args: command.args ?? [],
                    env: command.env ?? {},
                    workingDir: command.workingDir,
                    timeoutMs: config.timeoutMs,
                    maxOutputBytes: config.resourceLimits.maxOutputBytes,
                },
                resourceLimits: {
                    maxOldGenerationSizeMb: config.resourceLimits.maxMemoryMb,
                },
            })

            const timeoutHandle = setTimeout(() => {
                worker.terminate()
                reject(new Error(`Worker timeout: exceeded ${config.timeoutMs}ms`))
            }, config.timeoutMs + 1000) // grace period

            worker.on('message', (msg: { exitCode: number; stdout: string; stderr: string }) => {
                clearTimeout(timeoutHandle)
                const cpuTimeMs = Date.now() - startTime
                const outputBytes = Buffer.byteLength(msg.stdout + msg.stderr, 'utf-8')

                resolve({
                    sandboxId: '',
                    status: msg.exitCode === 0 ? 'COMPLETED' : 'FAILED',
                    startedAt,
                    completedAt: new Date().toISOString(),
                    exitCode: msg.exitCode,
                    stdout: msg.stdout,
                    stderr: msg.stderr,
                    containmentViolations: [],
                    resourceUsage: {
                        cpuTimeMs,
                        memoryPeakMb: 0,
                        outputBytes,
                    },
                    platform: 'worker_threads',
                })
            })

            worker.on('error', (err) => {
                clearTimeout(timeoutHandle)
                reject(err)
            })

            worker.on('exit', (code) => {
                clearTimeout(timeoutHandle)
                if (code !== 0) {
                    reject(new Error(`Worker exited with code ${code}`))
                }
            })
        })
    }
}
