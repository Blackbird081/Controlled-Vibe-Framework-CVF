import { describe, it, expect } from 'vitest'
import {
  SandboxIsolationContract,
  createSandboxIsolationContract,
  createDefaultSandboxConfig,
  DEFAULT_SANDBOX_RESOURCE_LIMITS,
  DEFAULT_SANDBOX_FILESYSTEM_POLICY,
  DEFAULT_SANDBOX_NETWORK_POLICY,
} from '../simulation/sandbox.isolation.contract'
import type {
  SandboxExecutor,
  SandboxCommand,
  SandboxConfig,
  SandboxResult,
} from '../simulation/sandbox.isolation.contract'

// --- Test helpers ---

function createTestExecutor(overrides?: Partial<SandboxResult>): SandboxExecutor {
  return {
    platform: 'stub',
    async execute(command: SandboxCommand, config: SandboxConfig): Promise<SandboxResult> {
      return {
        sandboxId: `test-${command.taskId}`,
        status: 'COMPLETED',
        startedAt: '2026-04-08T00:00:00.000Z',
        completedAt: '2026-04-08T00:00:01.000Z',
        exitCode: 0,
        stdout: `executed: ${command.command}`,
        stderr: '',
        containmentViolations: [],
        resourceUsage: { cpuTimeMs: 100, memoryPeakMb: 32, outputBytes: 50 },
        platform: config.platform,
        ...overrides,
      }
    },
  }
}

function createFailingExecutor(): SandboxExecutor {
  return {
    platform: 'stub',
    async execute(command: SandboxCommand, config: SandboxConfig): Promise<SandboxResult> {
      return {
        sandboxId: `fail-${command.taskId}`,
        status: 'FAILED',
        startedAt: '2026-04-08T00:00:00.000Z',
        completedAt: '2026-04-08T00:00:00.500Z',
        exitCode: 1,
        stdout: '',
        stderr: 'command not found',
        containmentViolations: [],
        resourceUsage: { cpuTimeMs: 50, memoryPeakMb: 10, outputBytes: 17 },
        platform: config.platform,
      }
    },
  }
}

const testCommand: SandboxCommand = {
  taskId: 'test-task-001',
  command: 'echo hello',
}

// --- Tests ---

describe('SandboxIsolationContract', () => {
  describe('factory', () => {
    it('creates a contract via factory function', () => {
      const contract = createSandboxIsolationContract()
      expect(contract).toBeInstanceOf(SandboxIsolationContract)
    })

    it('defaults to stub executor', () => {
      const contract = createSandboxIsolationContract()
      expect(contract.getPlatform()).toBe('stub')
    })

    it('accepts a custom executor', () => {
      const executor = createTestExecutor()
      const contract = createSandboxIsolationContract({ executor })
      expect(contract.getPlatform()).toBe('stub')
    })
  })

  describe('execute', () => {
    it('executes a command and returns a result', async () => {
      const contract = createSandboxIsolationContract({
        executor: createTestExecutor(),
      })

      const result = await contract.execute(testCommand)

      expect(result.status).toBe('COMPLETED')
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('echo hello')
      expect(result.platform).toBe('stub')
    })

    it('records result in audit log', async () => {
      const contract = createSandboxIsolationContract({
        executor: createTestExecutor(),
      })

      expect(contract.getAuditLog()).toHaveLength(0)
      await contract.execute(testCommand)
      expect(contract.getAuditLog()).toHaveLength(1)
      expect(contract.getAuditLog()[0].status).toBe('COMPLETED')
    })

    it('accumulates multiple results in audit log', async () => {
      const contract = createSandboxIsolationContract({
        executor: createTestExecutor(),
      })

      await contract.execute(testCommand)
      await contract.execute({ taskId: 'task-2', command: 'ls' })
      await contract.execute({ taskId: 'task-3', command: 'pwd' })

      expect(contract.getAuditLog()).toHaveLength(3)
    })

    it('handles failed execution', async () => {
      const contract = createSandboxIsolationContract({
        executor: createFailingExecutor(),
      })

      const result = await contract.execute(testCommand)

      expect(result.status).toBe('FAILED')
      expect(result.exitCode).toBe(1)
      expect(result.stderr).toBe('command not found')
    })

    it('merges partial config with defaults', async () => {
      const contract = createSandboxIsolationContract({
        executor: createTestExecutor(),
      })

      const result = await contract.execute(testCommand, { timeoutMs: 5000 })

      expect(result.status).toBe('COMPLETED')
    })

    it('generates sandboxId when executor returns empty', async () => {
      const executor: SandboxExecutor = {
        platform: 'stub',
        async execute(): Promise<SandboxResult> {
          return {
            sandboxId: '',
            status: 'COMPLETED',
            startedAt: '2026-04-08T00:00:00.000Z',
            completedAt: '2026-04-08T00:00:00.100Z',
            exitCode: 0,
            stdout: 'ok',
            stderr: '',
            containmentViolations: [],
            resourceUsage: { cpuTimeMs: 10, memoryPeakMb: 5, outputBytes: 2 },
            platform: 'stub',
          }
        },
      }

      const contract = createSandboxIsolationContract({
        executor,
        generateId: () => 'generated-id-001',
      })

      const result = await contract.execute(testCommand)
      expect(result.sandboxId).toBe('generated-id-001')
    })

    it('preserves sandboxId when executor provides one', async () => {
      const contract = createSandboxIsolationContract({
        executor: createTestExecutor({ sandboxId: 'custom-id' }),
      })

      const result = await contract.execute(testCommand)
      expect(result.sandboxId).toBe('custom-id')
    })

    it('fails closed when config has zero timeout', async () => {
      const contract = createSandboxIsolationContract({
        executor: createTestExecutor(),
      })

      const result = await contract.execute(testCommand, { timeoutMs: 0 })

      expect(result.status).toBe('FAILED')
      expect(result.exitCode).toBe(-1)
      expect(result.stderr).toContain('Config validation failed')
      expect(result.stderr).toContain('timeoutMs must be positive')
    })

    it('fails closed when config has negative resource limits', async () => {
      const contract = createSandboxIsolationContract({
        executor: createTestExecutor(),
      })

      const result = await contract.execute(testCommand, {
        resourceLimits: { maxCpuTimeMs: -1, maxMemoryMb: 0, maxOutputBytes: -5 },
      })

      expect(result.status).toBe('FAILED')
      expect(result.stderr).toContain('maxCpuTimeMs must be positive')
    })

    it('fails closed when config has unrestricted egress', async () => {
      const contract = createSandboxIsolationContract({
        executor: createTestExecutor(),
      })

      const result = await contract.execute(testCommand, {
        networkPolicy: { allowEgress: true, allowedHosts: [] },
      })

      expect(result.status).toBe('FAILED')
      expect(result.stderr).toContain('allowEgress')
    })

    it('records failed-closed result in audit log', async () => {
      const contract = createSandboxIsolationContract({
        executor: createTestExecutor(),
      })

      await contract.execute(testCommand, { timeoutMs: -1 })

      expect(contract.getAuditLog()).toHaveLength(1)
      expect(contract.getAuditLog()[0].status).toBe('FAILED')
    })

    it('does not call executor when config is invalid', async () => {
      let executorCalled = false
      const trackingExecutor: SandboxExecutor = {
        platform: 'stub',
        async execute(): Promise<SandboxResult> {
          executorCalled = true
          return {
            sandboxId: 'should-not-reach',
            status: 'COMPLETED',
            startedAt: '2026-04-10T00:00:00.000Z',
            completedAt: '2026-04-10T00:00:00.100Z',
            exitCode: 0,
            stdout: '',
            stderr: '',
            containmentViolations: [],
            resourceUsage: { cpuTimeMs: 0, memoryPeakMb: 0, outputBytes: 0 },
            platform: 'stub',
          }
        },
      }

      const contract = createSandboxIsolationContract({ executor: trackingExecutor })
      await contract.execute(testCommand, { timeoutMs: 0 })

      expect(executorCalled).toBe(false)
    })

    it('passes command args and env through', async () => {
      let capturedCommand: SandboxCommand | null = null
      const executor: SandboxExecutor = {
        platform: 'stub',
        async execute(cmd: SandboxCommand, config: SandboxConfig): Promise<SandboxResult> {
          capturedCommand = cmd
          return {
            sandboxId: 'cap-1',
            status: 'COMPLETED',
            startedAt: '2026-04-08T00:00:00.000Z',
            completedAt: '2026-04-08T00:00:00.100Z',
            exitCode: 0,
            stdout: '',
            stderr: '',
            containmentViolations: [],
            resourceUsage: { cpuTimeMs: 0, memoryPeakMb: 0, outputBytes: 0 },
            platform: 'stub',
          }
        },
      }

      const contract = createSandboxIsolationContract({ executor })
      await contract.execute({
        taskId: 'env-test',
        command: 'node',
        args: ['script.js', '--flag'],
        env: { NODE_ENV: 'sandbox' },
        workingDir: '/tmp/sandbox',
      })

      expect(capturedCommand).not.toBeNull()
      expect(capturedCommand!.args).toEqual(['script.js', '--flag'])
      expect(capturedCommand!.env).toEqual({ NODE_ENV: 'sandbox' })
      expect(capturedCommand!.workingDir).toBe('/tmp/sandbox')
    })
  })

  describe('validateConfig', () => {
    it('validates a correct default config', () => {
      const contract = createSandboxIsolationContract()
      const config = createDefaultSandboxConfig()
      const result = contract.validateConfig(config)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('rejects zero timeout', () => {
      const contract = createSandboxIsolationContract()
      const config = createDefaultSandboxConfig()
      config.timeoutMs = 0

      const result = contract.validateConfig(config)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('timeoutMs must be positive')
    })

    it('rejects negative CPU limit', () => {
      const contract = createSandboxIsolationContract()
      const config = createDefaultSandboxConfig()
      config.resourceLimits.maxCpuTimeMs = -1

      const result = contract.validateConfig(config)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('maxCpuTimeMs must be positive')
    })

    it('rejects zero memory limit', () => {
      const contract = createSandboxIsolationContract()
      const config = createDefaultSandboxConfig()
      config.resourceLimits.maxMemoryMb = 0

      const result = contract.validateConfig(config)
      expect(result.valid).toBe(false)
    })

    it('rejects zero output limit', () => {
      const contract = createSandboxIsolationContract()
      const config = createDefaultSandboxConfig()
      config.resourceLimits.maxOutputBytes = 0

      const result = contract.validateConfig(config)
      expect(result.valid).toBe(false)
    })

    it('warns on unrestricted egress', () => {
      const contract = createSandboxIsolationContract()
      const config = createDefaultSandboxConfig()
      config.networkPolicy.allowEgress = true
      config.networkPolicy.allowedHosts = []

      const result = contract.validateConfig(config)
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('allowEgress')
    })

    it('allows egress with explicit hosts', () => {
      const contract = createSandboxIsolationContract()
      const config = createDefaultSandboxConfig()
      config.networkPolicy.allowEgress = true
      config.networkPolicy.allowedHosts = ['api.example.com']

      const result = contract.validateConfig(config)
      expect(result.valid).toBe(true)
    })

    it('warns on write with no paths and no tempDir', () => {
      const contract = createSandboxIsolationContract()
      const config = createDefaultSandboxConfig()
      config.filesystemPolicy.allowWrite = true
      config.filesystemPolicy.writePaths = []
      config.filesystemPolicy.allowTempDir = false

      const result = contract.validateConfig(config)
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('allowWrite')
    })

    it('accepts write with tempDir enabled', () => {
      const contract = createSandboxIsolationContract()
      const config = createDefaultSandboxConfig()
      config.filesystemPolicy.allowWrite = true
      config.filesystemPolicy.writePaths = []
      config.filesystemPolicy.allowTempDir = true

      const result = contract.validateConfig(config)
      expect(result.valid).toBe(true)
    })

    it('can accumulate multiple errors', () => {
      const contract = createSandboxIsolationContract()
      const config = createDefaultSandboxConfig()
      config.timeoutMs = -1
      config.resourceLimits.maxCpuTimeMs = -1
      config.resourceLimits.maxMemoryMb = -1

      const result = contract.validateConfig(config)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('defaults', () => {
    it('has correct default resource limits', () => {
      expect(DEFAULT_SANDBOX_RESOURCE_LIMITS.maxCpuTimeMs).toBe(30_000)
      expect(DEFAULT_SANDBOX_RESOURCE_LIMITS.maxMemoryMb).toBe(256)
      expect(DEFAULT_SANDBOX_RESOURCE_LIMITS.maxOutputBytes).toBe(1_048_576)
    })

    it('has correct default filesystem policy', () => {
      expect(DEFAULT_SANDBOX_FILESYSTEM_POLICY.allowRead).toBe(true)
      expect(DEFAULT_SANDBOX_FILESYSTEM_POLICY.allowWrite).toBe(false)
      expect(DEFAULT_SANDBOX_FILESYSTEM_POLICY.allowTempDir).toBe(true)
    })

    it('has correct default network policy', () => {
      expect(DEFAULT_SANDBOX_NETWORK_POLICY.allowEgress).toBe(false)
      expect(DEFAULT_SANDBOX_NETWORK_POLICY.allowedHosts).toEqual([])
    })

    it('createDefaultSandboxConfig produces valid config', () => {
      const config = createDefaultSandboxConfig()
      const contract = createSandboxIsolationContract()
      const result = contract.validateConfig(config)

      expect(result.valid).toBe(true)
      expect(config.platform).toBe('worker_threads')
      expect(config.timeoutMs).toBe(30_000)
    })

    it('createDefaultSandboxConfig accepts platform override', () => {
      const config = createDefaultSandboxConfig('docker')
      expect(config.platform).toBe('docker')
    })
  })
})
