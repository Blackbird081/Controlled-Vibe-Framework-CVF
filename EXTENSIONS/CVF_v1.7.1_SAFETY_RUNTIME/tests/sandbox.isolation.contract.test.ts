import { describe, it, expect } from 'vitest'
import {
  SandboxIsolationContract,
  createSandboxIsolationContract,
  createDefaultSandboxConfig,
  createDefaultIsolationRequirement,
  evaluateIsolationAdmission,
  isCompleteIsolationGuaranteeProfile,
  ISOLATION_DIMENSIONS,
  DEFAULT_SANDBOX_RESOURCE_LIMITS,
  DEFAULT_SANDBOX_FILESYSTEM_POLICY,
  DEFAULT_SANDBOX_NETWORK_POLICY,
} from '../simulation/sandbox.isolation.contract'
import type {
  SandboxExecutor,
  SandboxCommand,
  SandboxConfig,
  SandboxResult,
  IsolationDimension,
  IsolationGuaranteeProfile,
  IsolationRequirement,
} from '../simulation/sandbox.isolation.contract'

// --- Test helpers ---

/** A fully-guaranteed profile: a stub-like executor that touches nothing real. */
const FULL_GUARANTEE_PROFILE: IsolationGuaranteeProfile = {
  filesystem: true,
  network: true,
  process: true,
  environment: true,
  credential: true,
  ipc: true,
  persistence: true,
  host: true,
}

/** A zero-guarantee profile: an executor that guarantees nothing (e.g. worker_threads). */
const NO_GUARANTEE_PROFILE: IsolationGuaranteeProfile = {
  filesystem: false,
  network: false,
  process: false,
  environment: false,
  credential: false,
  ipc: false,
  persistence: false,
  host: false,
}

function createTestExecutor(
  overrides?: Partial<SandboxResult>,
  guaranteeProfile: IsolationGuaranteeProfile = FULL_GUARANTEE_PROFILE,
): SandboxExecutor {
  return {
    platform: 'stub',
    guaranteeProfile,
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
        isolationAdmission: evaluateIsolationAdmission(config.isolationRequirement, guaranteeProfile),
        ...overrides,
      }
    },
  }
}

function createFailingExecutor(): SandboxExecutor {
  return {
    platform: 'stub',
    guaranteeProfile: FULL_GUARANTEE_PROFILE,
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
        isolationAdmission: evaluateIsolationAdmission(config.isolationRequirement, FULL_GUARANTEE_PROFILE),
      }
    },
  }
}

/** An executor that guarantees nothing, for proving fail-closed admission. */
function createNoGuaranteeExecutor(): SandboxExecutor {
  let executeCallCount = 0
  return {
    platform: 'stub',
    guaranteeProfile: NO_GUARANTEE_PROFILE,
    async execute(command: SandboxCommand, config: SandboxConfig): Promise<SandboxResult> {
      executeCallCount += 1
      return {
        sandboxId: `no-guarantee-${command.taskId}`,
        status: 'COMPLETED',
        startedAt: '2026-04-08T00:00:00.000Z',
        completedAt: '2026-04-08T00:00:01.000Z',
        exitCode: 0,
        stdout: `executed: ${command.command} (call #${executeCallCount})`,
        stderr: '',
        containmentViolations: [],
        resourceUsage: { cpuTimeMs: 10, memoryPeakMb: 8, outputBytes: 5 },
        platform: config.platform,
        isolationAdmission: evaluateIsolationAdmission(config.isolationRequirement, NO_GUARANTEE_PROFILE),
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
        guaranteeProfile: FULL_GUARANTEE_PROFILE,
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
            isolationAdmission: evaluateIsolationAdmission(
              createDefaultIsolationRequirement(),
              FULL_GUARANTEE_PROFILE,
            ),
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
        guaranteeProfile: FULL_GUARANTEE_PROFILE,
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
            isolationAdmission: evaluateIsolationAdmission(
              createDefaultIsolationRequirement(),
              FULL_GUARANTEE_PROFILE,
            ),
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
        guaranteeProfile: FULL_GUARANTEE_PROFILE,
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
            isolationAdmission: evaluateIsolationAdmission(
              config.isolationRequirement,
              FULL_GUARANTEE_PROFILE,
            ),
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

    it('createDefaultSandboxConfig defaults to SECURITY_BOUNDARY_REQUIRED with all eight dimensions', () => {
      const config = createDefaultSandboxConfig()
      expect(config.isolationRequirement.mode).toBe('SECURITY_BOUNDARY_REQUIRED')
      expect([...config.isolationRequirement.requiredDimensions].sort()).toEqual(
        [...ISOLATION_DIMENSIONS].sort(),
      )
    })
  })

  describe('isolation dimension admission (RFR-R5 / F9)', () => {
    it('the canonical vocabulary is exactly the eight required dimensions', () => {
      expect([...ISOLATION_DIMENSIONS].sort()).toEqual(
        ['credential', 'environment', 'filesystem', 'host', 'ipc', 'network', 'persistence', 'process'].sort(),
      )
    })

    it('createDefaultIsolationRequirement requires every canonical dimension under SECURITY_BOUNDARY_REQUIRED', () => {
      const requirement = createDefaultIsolationRequirement()
      expect(requirement.mode).toBe('SECURITY_BOUNDARY_REQUIRED')
      expect(requirement.requiredDimensions.length).toBe(ISOLATION_DIMENSIONS.length)
    })

    it('admits a fully-guaranteed executor under the default security requirement', () => {
      const admission = evaluateIsolationAdmission(createDefaultIsolationRequirement(), FULL_GUARANTEE_PROFILE)
      expect(admission.verdict).toBe('ADMITTED')
      expect(admission.unsupportedRequiredDimensions).toEqual([])
      expect(admission.dimensions).toHaveLength(ISOLATION_DIMENSIONS.length)
    })

    it('rejects the default security requirement against a zero-guarantee executor and names every missing dimension', () => {
      const admission = evaluateIsolationAdmission(createDefaultIsolationRequirement(), NO_GUARANTEE_PROFILE)
      expect(admission.verdict).toBe('REJECTED')
      expect(admission.reasonCode).toBe('UNSUPPORTED_DIMENSION')
      expect([...admission.unsupportedRequiredDimensions].sort()).toEqual([...ISOLATION_DIMENSIONS].sort())
    })

    it.each(ISOLATION_DIMENSIONS)(
      'rejects when only `%s` is required and unsupported',
      (dimension: IsolationDimension) => {
        const requirement: IsolationRequirement = {
          mode: 'SECURITY_BOUNDARY_REQUIRED',
          requiredDimensions: [dimension],
        }
        const profile: IsolationGuaranteeProfile = { ...FULL_GUARANTEE_PROFILE, [dimension]: false }
        const admission = evaluateIsolationAdmission(requirement, profile)
        expect(admission.verdict).toBe('REJECTED')
        expect(admission.unsupportedRequiredDimensions).toEqual([dimension])
      },
    )

    it('rejects BEST_EFFORT_EXPLICIT with non-empty required dimensions as inconsistent', () => {
      const admission = evaluateIsolationAdmission(
        { mode: 'BEST_EFFORT_EXPLICIT', requiredDimensions: ['network'] },
        NO_GUARANTEE_PROFILE,
      )
      expect(admission.verdict).toBe('REJECTED')
      expect(admission.reasonCode).toBe('INCONSISTENT_BEST_EFFORT_REQUIREMENT')
    })

    it('admits BEST_EFFORT_EXPLICIT with empty required dimensions against a zero-guarantee executor', () => {
      const admission = evaluateIsolationAdmission(
        { mode: 'BEST_EFFORT_EXPLICIT', requiredDimensions: [] },
        NO_GUARANTEE_PROFILE,
      )
      expect(admission.verdict).toBe('ADMITTED')
      expect(admission.mode).toBe('BEST_EFFORT_EXPLICIT')
    })

    it('rejects an unknown dimension deterministically', () => {
      const admission = evaluateIsolationAdmission(
        {
          mode: 'SECURITY_BOUNDARY_REQUIRED',
          requiredDimensions: ['filesystem', 'not_a_real_dimension' as IsolationDimension],
        },
        FULL_GUARANTEE_PROFILE,
      )
      expect(admission.verdict).toBe('REJECTED')
      expect(admission.reasonCode).toBe('UNKNOWN_DIMENSION')
    })

    it('rejects a duplicate dimension deterministically', () => {
      const admission = evaluateIsolationAdmission(
        { mode: 'SECURITY_BOUNDARY_REQUIRED', requiredDimensions: ['network', 'network'] },
        FULL_GUARANTEE_PROFILE,
      )
      expect(admission.verdict).toBe('REJECTED')
      expect(admission.reasonCode).toBe('DUPLICATE_DIMENSION')
    })

    it('rejects SECURITY_BOUNDARY_REQUIRED with an incomplete dimension set as MISSING_DIMENSION', () => {
      const admission = evaluateIsolationAdmission(
        { mode: 'SECURITY_BOUNDARY_REQUIRED', requiredDimensions: ['filesystem', 'network'] },
        FULL_GUARANTEE_PROFILE,
      )
      expect(admission.verdict).toBe('REJECTED')
      expect(admission.reasonCode).toBe('MISSING_DIMENSION')
    })

    it('rejects a malformed (incomplete) guarantee profile', () => {
      const malformed = { filesystem: true } as unknown as IsolationGuaranteeProfile
      const admission = evaluateIsolationAdmission(createDefaultIsolationRequirement(), malformed)
      expect(admission.verdict).toBe('REJECTED')
      expect(admission.reasonCode).toBe('MALFORMED_GUARANTEE_PROFILE')
      expect(admission.dimensions).toHaveLength(ISOLATION_DIMENSIONS.length)
    })

    it('rejects a malformed requirement object', () => {
      const malformed = { mode: 'NOT_A_REAL_MODE' } as unknown as IsolationRequirement
      const admission = evaluateIsolationAdmission(malformed, FULL_GUARANTEE_PROFILE)
      expect(admission.verdict).toBe('REJECTED')
      expect(admission.reasonCode).toBe('MALFORMED_REQUIREMENT')
    })

    it('isCompleteIsolationGuaranteeProfile accepts a complete profile and rejects incomplete/extra-key profiles', () => {
      expect(isCompleteIsolationGuaranteeProfile(FULL_GUARANTEE_PROFILE)).toBe(true)
      expect(isCompleteIsolationGuaranteeProfile({ filesystem: true })).toBe(false)
      expect(
        isCompleteIsolationGuaranteeProfile({ ...FULL_GUARANTEE_PROFILE, extraDimension: true }),
      ).toBe(false)
      expect(isCompleteIsolationGuaranteeProfile(null)).toBe(false)
      expect(isCompleteIsolationGuaranteeProfile('not-an-object')).toBe(false)
    })

    it('fails closed without invoking accessors or throwing on hostile profiles and requirements', () => {
      const accessorProfile = Object.defineProperty(
        { ...FULL_GUARANTEE_PROFILE },
        'filesystem',
        { enumerable: true, get: () => { throw new Error('must not execute getter') } },
      ) as IsolationGuaranteeProfile
      const symbolProfile = {
        ...FULL_GUARANTEE_PROFILE,
        [Symbol('hidden')]: true,
      } as IsolationGuaranteeProfile
      const hostileRequirement = Object.defineProperty(
        { requiredDimensions: [] },
        'mode',
        { enumerable: true, get: () => { throw new Error('must not execute getter') } },
      ) as unknown as IsolationRequirement

      for (const hostileProfile of [accessorProfile, symbolProfile]) {
        const result = evaluateIsolationAdmission(createDefaultIsolationRequirement(), hostileProfile)
        expect(result.reasonCode).toBe('MALFORMED_GUARANTEE_PROFILE')
        expect(result.dimensions).toHaveLength(ISOLATION_DIMENSIONS.length)
      }
      const requirementResult = evaluateIsolationAdmission(hostileRequirement, FULL_GUARANTEE_PROFILE)
      expect(requirementResult.reasonCode).toBe('MALFORMED_REQUIREMENT')
      expect(requirementResult.dimensions).toHaveLength(ISOLATION_DIMENSIONS.length)
    })

    it('rejects config platform mismatch before invoking the executor', async () => {
      let called = false
      const executor = createTestExecutor()
      const trackingExecutor: SandboxExecutor = {
        ...executor,
        async execute(command, config) {
          called = true
          return executor.execute(command, config)
        },
      }
      const contract = createSandboxIsolationContract({ executor: trackingExecutor })
      const result = await contract.execute(testCommand, { platform: 'docker' })

      expect(called).toBe(false)
      expect(result.isolationAdmission.reasonCode).toBe('PLATFORM_MISMATCH')
      expect(result.isolationAdmission.dimensions).toHaveLength(ISOLATION_DIMENSIONS.length)
    })

    it('rejects the default security config before the executor is ever called, and evidence names every missing dimension', async () => {
      const executor = createNoGuaranteeExecutor()
      const contract = createSandboxIsolationContract({ executor })

      const result = await contract.execute(testCommand)

      expect(result.status).toBe('FAILED')
      expect(result.isolationAdmission.verdict).toBe('REJECTED')
      expect(result.isolationAdmission.reasonCode).toBe('UNSUPPORTED_DIMENSION')
      expect([...result.isolationAdmission.unsupportedRequiredDimensions].sort()).toEqual(
        [...ISOLATION_DIMENSIONS].sort(),
      )
      expect(result.stdout).toBe('')
      expect(result.stdout).not.toContain('call #')
    })

    it('admits explicit best-effort execution against a zero-guarantee executor and calls it exactly once', async () => {
      const executor = createNoGuaranteeExecutor()
      const contract = createSandboxIsolationContract({ executor })

      const result = await contract.execute(testCommand, {
        isolationRequirement: { mode: 'BEST_EFFORT_EXPLICIT', requiredDimensions: [] },
      })

      expect(result.status).toBe('COMPLETED')
      expect(result.isolationAdmission.verdict).toBe('ADMITTED')
      expect(result.isolationAdmission.mode).toBe('BEST_EFFORT_EXPLICIT')
      expect(result.stdout).toContain('call #1')
    })

    it('records the rejected isolation admission result in the audit log without calling the executor', async () => {
      const executor = createNoGuaranteeExecutor()
      const contract = createSandboxIsolationContract({ executor })

      await contract.execute(testCommand)

      expect(contract.getAuditLog()).toHaveLength(1)
      expect(contract.getAuditLog()[0].isolationAdmission.verdict).toBe('REJECTED')
      expect(contract.getAuditLog()[0].status).toBe('FAILED')
    })

    it('a fully-guaranteed executor completes successfully under the default security requirement', async () => {
      const executor = createTestExecutor(undefined, FULL_GUARANTEE_PROFILE)
      const contract = createSandboxIsolationContract({ executor })

      const result = await contract.execute(testCommand)

      expect(result.status).toBe('COMPLETED')
      expect(result.isolationAdmission.verdict).toBe('ADMITTED')
    })

    it('binds the contract-computed admission instead of trusting executor-returned evidence', async () => {
      const forgedAdmission = evaluateIsolationAdmission(
        { mode: 'BEST_EFFORT_EXPLICIT', requiredDimensions: [] },
        NO_GUARANTEE_PROFILE,
      )
      const executor = createTestExecutor({ isolationAdmission: forgedAdmission })
      const contract = createSandboxIsolationContract({ executor })

      const result = await contract.execute(testCommand)

      expect(result.isolationAdmission.mode).toBe('SECURITY_BOUNDARY_REQUIRED')
      expect(result.isolationAdmission.detail).toContain('All required isolation dimensions')
    })

    it('snapshots a valid executor profile at construction and ignores later mutation', async () => {
      const mutableProfile = { ...FULL_GUARANTEE_PROFILE }
      const executor = createTestExecutor(undefined, mutableProfile)
      const contract = createSandboxIsolationContract({ executor })
      mutableProfile.filesystem = false

      const result = await contract.execute(testCommand)

      expect(result.isolationAdmission.verdict).toBe('ADMITTED')
      expect(result.isolationAdmission.dimensions.find((entry) => entry.dimension === 'filesystem')?.guaranteed).toBe(true)
    })

    it('never claims guaranteed containment in best-effort admission evidence wording', () => {
      const admission = evaluateIsolationAdmission(
        { mode: 'BEST_EFFORT_EXPLICIT', requiredDimensions: [] },
        NO_GUARANTEE_PROFILE,
      )
      expect(admission.detail.toLowerCase()).not.toContain('guaranteed containment')
      expect(admission.detail.toLowerCase()).toContain('not a security boundary')
    })
  })
})
