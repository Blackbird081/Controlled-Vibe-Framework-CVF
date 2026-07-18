import { expect, test } from '@playwright/test';

test.describe('SOT3 A5R1 development import-chain regression', () => {
  test('invalid execute payload reaches the route and returns JSON without a provider call', async ({ request }) => {
    const response = await request.post('/api/execute', { data: {} });
    const contentType = response.headers()['content-type'] ?? '';

    expect(response.status()).toBe(401);
    expect(contentType).toContain('application/json');

    const body = await response.json();
    expect(body).toEqual(expect.objectContaining({ error: expect.any(String) }));
  });
});
