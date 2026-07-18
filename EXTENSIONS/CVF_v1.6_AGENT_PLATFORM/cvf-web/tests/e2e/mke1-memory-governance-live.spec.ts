import { test, expect } from '@playwright/test';
import { seedStorageWithAlibaba, login } from './utils';

test.describe('MKE1-E3 Memory Live Governance Proof', () => {
  test.beforeEach(async ({ page }) => {
    await seedStorageWithAlibaba(page);
  });

  test('REVOKED proof fixture blocks execution before provider call', async ({ page }) => {
    await login(page);

    const response = await page.request.post('/api/execute', {
      data: {
        templateId: 'mke1-e3-revoked-proof',
        templateName: 'MKE1-E3 Revoked Proof',
        intent: 'live governance proof: revoked memory blocks execution',
        inputs: { prompt: 'governance proof' },
        provider: 'alibaba',
        memoryGovernanceProof: { revoked: true },
      },
    });

    expect(response.status()).toBe(400);

    const json = await response.json();

    expect(json.success).toBe(false);
    expect(json.enforcement.status).toBe('BLOCK');
    expect(json.enforcement.reasons).toContain('memory_access_revoked');
    expect(json.model).toBe('blocked');
    expect(json.output).toBeUndefined();
  });
});
