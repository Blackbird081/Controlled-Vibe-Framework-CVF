// adapters/worker.thread.sandbox.adapter.ts
// CVF v1.7.3 — WorkerThread Sandbox Adapter
// Track 5B: Best-effort delegated execution using Node.js worker_threads.
// NOTE: worker_threads provide thread isolation but NOT a security boundary
// for filesystem/network/process containment. Pre-execution policy checks
// enforce governance constraints; physical containment requires a real
// sandbox platform (docker, v8_isolate) behind the SandboxExecutor interface.
// RFR-R5 / F9: this adapter declares WORKER_THREAD_GUARANTEE_PROFILE, which
// is false for every one of the eight canonical isolation dimensions.
// SandboxIsolationContract evaluates that profile before this adapter is
// ever invoked, so a caller requiring SECURITY_BOUNDARY_REQUIRED never
// reaches worker_threads at all; only an explicit BEST_EFFORT_EXPLICIT
// requirement (empty requiredDimensions) can select this adapter. It also
// never spreads host process.env into the worker or child process -- only
// the caller's explicitly supplied command.env crosses the boundary.
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
    IsolationGuaranteeProfile,
} from './sandbox.types.js'
import { evaluateIsolationAdmission } from './sandbox.types.js'

let workerIdCounter = 0

/**
 * worker_threads share the host process's memory space, filesystem access,
 * network stack, and syscall surface. None of the eight canonical isolation
 * dimensions are guaranteed by this platform; every entry is truthfully
 * false. Advisory pre/post-execution policy checks below remain useful
 * governance signals, but they are not a substitute for any of these
 * guarantees and must never be described as one.
 */
export const WORKER_THREAD_GUARANTEE_PROFILE: IsolationGuaranteeProfile = Object.freeze({
    filesystem: false,
    network: false,
    process: false,
    environment: false,
    credential: false,
    ipc: false,
    persistence: false,
    host: false,
})

export class WorkerThreadSandboxAdapter implements SandboxExecutor {
    readonly platform = 'worker_threads' as const
    readonly guaranteeProfile = WORKER_THREAD_GUARANTEE_PROFILE

    async execute(command: SandboxCommand, config: SandboxConfig): Promise<SandboxResult> {
        const sandboxId = `wt-${++workerIdCounter}-${Date.now()}`
        const startedAt = new Date().toISOString()
        const violations: ContainmentViolation[] = []
        const isolationAdmission = evaluateIsolationAdmission(
            config.isolationRequirement,
            WORKER_THREAD_GUARANTEE_PROFILE,
            { requestedPlatform: config.platform, executorPlatform: this.platform },
        )

        // Fail closed at the adapter itself (not only the calling contract):
        // an unsupported isolation requirement rejects before any worker or
        // child process is created, even when this adapter is invoked
        // directly without going through SandboxIsolationContract.
        if (isolationAdmission.verdict === 'REJECTED') {
            const now = new Date().toISOString()
            return {
                sandboxId,
                status: 'CONTAINMENT_VIOLATION',
                startedAt,
                completedAt: now,
                exitCode: -1,
                stdout: '',
                stderr: `Isolation admission rejected: ${isolationAdmission.detail}`,
                containmentViolations: [],
                resourceUsage: { cpuTimeMs: 0, memoryPeakMb: 0, outputBytes: 0 },
                platform: 'worker_threads',
                isolationAdmission,
            }
        }

        // Pre-execution policy checks (synchronous governance validation)
        if (config.networkPolicy.allowEgress && config.networkPolicy.allowedHosts.length === 0) {
            violations.push({
                type: 'NETWORK_EGRESS' as ContainmentViolationType,
                detail: 'Unrestricted egress attempted — blocked by sandbox policy',
                detectedAt: startedAt,
            })
        }

        if (!config.filesystemPolicy.allowRead && !config.filesystemPolicy.allowWrite) {
            // No filesystem access at all — block commands that reference paths
            if (command.workingDir) {
                violations.push({
                    type: 'FILESYSTEM_BREACH' as ContainmentViolationType,
                    detail: 'workingDir specified but filesystem access is fully denied',
                    detectedAt: startedAt,
                })
            }
        }

        if (!config.filesystemPolicy.allowWrite) {
            const writeIndicators = ['--write', '-w', '--output', '-o', '>', '>>', 'tee ']
            if (command.args?.some(a => writeIndicators.some(ind => a.includes(ind)))) {
                violations.push({
                    type: 'FILESYSTEM_BREACH' as ContainmentViolationType,
                    detail: 'Write operation attempted with allowWrite=false',
                    detectedAt: startedAt,
                })
            }
        }

        // Reject empty or whitespace-only commands
        if (!command.command || command.command.trim().length === 0) {
            violations.push({
                type: 'UNAUTHORIZED_SYSCALL' as ContainmentViolationType,
                detail: 'Empty command rejected',
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
                isolationAdmission,
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
                isolationAdmission,
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
                isolationAdmission,
            }
        }
    }

    private runInWorker(
        command: SandboxCommand,
        config: SandboxConfig,
    ): Promise<Omit<SandboxResult, 'isolationAdmission'>> {
        return new Promise((resolve, reject) => {
            const startTime = Date.now()
            const startedAt = new Date().toISOString()

            // Worker inline script: executes command in an isolated thread
            // Uses execFileSync (non-shell) to prevent shell injection.
            // Command and args are passed as separate array elements, never concatenated.
            // RFR-R5 / F9: the child process environment is constructed only
            // from the explicit command environment; the host process.env is
            // never spread in, so no ambient credential or host variable can
            // cross into the child unless the caller supplied it explicitly.
            const workerCode = `
                const { parentPort, workerData } = require('worker_threads');
                const { execFileSync } = require('child_process');

                try {
                    const options = {
                        timeout: workerData.timeoutMs,
                        maxBuffer: workerData.maxOutputBytes,
                        env: { ...workerData.env },
                    };

                    if (workerData.workingDir) {
                        options.cwd = workerData.workingDir;
                    }

                    const stdout = execFileSync(
                        workerData.command,
                        workerData.args || [],
                        options
                    );
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
                env: { ...(command.env ?? {}) },
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
