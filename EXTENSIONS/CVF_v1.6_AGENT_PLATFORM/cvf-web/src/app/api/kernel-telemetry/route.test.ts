import { describe, expect, it } from 'vitest';
import { GET } from './route';

describe('kernel monitoring without a data source', () => {
    it('leaves requests, risk history and measured values empty on repeated reads', async () => {
        for (const load of [await GET(), await GET()]) {
            expect(load.status).toBe(200);
            expect(await load.json()).toEqual({ traces: [], riskHistory: [], stats: null });
        }
    });
});
