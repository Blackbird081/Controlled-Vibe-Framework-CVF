import { describe, it, expect, beforeEach } from 'vitest';
import {
  executeInSandbox,
  validateWebSandboxConfig,
  getSandboxAuditLog,
  type WebSandboxRequest,
} from './sandbox-contract-adapter';

describe('sandbox-contract-adapter', () => {
  describe('executeInSandbox — valid config', () => {
    it('returns success for a valid request', async () => {
      const req: WebSandboxRequest = { code: 'console.log("hello")' };
      const result = await executeInSandbox(req);
      expect(result.success).toBe(true);
      expect(result.platform).toBe('stub');
      expect(result.violations).toHaveLength(0);
    });

    it('records result in audit log', async () => {
      const req: WebSandboxRequest = { code: 'x = 1' };
      await executeInSandbox(req);
      const log = getSandboxAuditLog();
      expect(log.length).toBeGreaterThan(0);
    });

    it('uses provided platform in result', async () => {
      const req: WebSandboxRequest = { code: 'x', platform: 'stub' };
      const result = await executeInSandbox(req);
      expect(result.platform).toBe('stub');
    });
  });

  describe('executeInSandbox — invalid config (fail-closed)', () => {
    it('fails closed when timeoutMs is zero', async () => {
      const req: WebSandboxRequest = { code: 'x', timeoutMs: 0 };
      const result = await executeInSandbox(req);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/Invalid sandbox config/);
      expect(result.error).toMatch(/timeoutMs must be positive/);
      expect(result.output).toBe('');
      expect(result.executionTimeMs).toBe(0);
    });

    it('fails closed when maxMemoryMb is zero', async () => {
      const req: WebSandboxRequest = { code: 'x', maxMemoryMb: 0 };
      const result = await executeInSandbox(req);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/Invalid sandbox config/);
      expect(result.error).toMatch(/maxMemoryMb must be positive/);
    });

    it('fails closed when maxMemoryMb is negative', async () => {
      const req: WebSandboxRequest = { code: 'x', maxMemoryMb: -1 };
      const result = await executeInSandbox(req);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/Invalid sandbox config/);
    });

    it('records FAILED result in audit log when config is invalid', async () => {
      const before = getSandboxAuditLog().length;
      await executeInSandbox({ code: 'x', timeoutMs: 0 });
      const after = getSandboxAuditLog();
      expect(after.length).toBe(before + 1);
      const entry = after[after.length - 1];
      expect(entry.status).toBe('FAILED');
      expect(entry.exitCode).toBe(1);
      expect(entry.stderr).toMatch(/timeoutMs must be positive/);
    });

    it('does not execute stub when config is invalid', async () => {
      const result = await executeInSandbox({ code: 'danger', timeoutMs: -1 });
      expect(result.success).toBe(false);
      expect(result.output).toBe('');
    });
  });

  describe('validateWebSandboxConfig', () => {
    it('returns valid for default-like request', () => {
      const result = validateWebSandboxConfig({ code: 'x' });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('returns invalid for zero timeoutMs', () => {
      const result = validateWebSandboxConfig({ code: 'x', timeoutMs: 0 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('timeoutMs must be positive');
    });

    it('returns invalid for zero maxMemoryMb', () => {
      const result = validateWebSandboxConfig({ code: 'x', maxMemoryMb: 0 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('maxMemoryMb must be positive');
    });
  });
});
