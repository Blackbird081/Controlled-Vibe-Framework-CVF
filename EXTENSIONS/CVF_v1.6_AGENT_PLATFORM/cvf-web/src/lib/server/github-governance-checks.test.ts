import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadGovernanceCheckRuns, GOVERNANCE_CHECK_CACHE_MS } from './github-governance-checks';

const repo = 'Blackbird081/Controlled-Vibe-Framework-CVF';
const sha = '8593454f' + 'a'.repeat(32);
const at = '2026-11-25T12:00:00Z';
const run = (id: number, conclusion: string | null, status = 'completed') => ({
    id, event: 'push', head_branch: 'main', head_repository: { full_name: repo },
    head_sha: sha, run_started_at: at, created_at: at, status, conclusion,
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.useRealTimers();
});

describe('public governance check results', () => {
    it('uses the three named public workflows and only runs from the repository main branch', async () => {
        const fetch = vi.fn(async (url: string) => {
            const parsed = new URL(url);
            expect(parsed.origin).toBe('https://api.github.com');
            expect(parsed.searchParams.get('branch')).toBe('main');
            const filename = parsed.pathname.split('/').at(-2);
            const entries =
                filename === 'documentation-testing.yml'
                    ? [{ ...run(1, 'success'), event: 'pull_request' }, run(2, 'success')]
                    : filename === 'cvf-static-ci.yml' ? [run(3, 'failure')] : [run(4, null, 'in_progress')];
            return Response.json({ workflow_runs: entries });
        });
        vi.stubGlobal('fetch', fetch);
        const result = await loadGovernanceCheckRuns(repo);
        expect(fetch).toHaveBeenCalledTimes(3);
        expect(fetch.mock.calls.map(([url]) => new URL(url).pathname.split('/').at(-2))).toEqual([
            'documentation-testing.yml', 'cvf-static-ci.yml', 'public-sync-preflight.yml',
        ]);
        expect(result.map(row => row.state)).toEqual(['passed', 'failed', 'running']);
        expect(result[0]).toMatchObject({ sha, startedAt: at, href: `https://github.com/${repo}/actions/runs/2` });
    });

    it.each([403, 429])('reports rate limit or forbidden response %d as unavailable', async (status) => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status })));
        const result = await loadGovernanceCheckRuns('test-org/governance-example');
        expect(result.map(row => row.state)).toEqual(['unavailable','unavailable','unavailable']);
        expect(result.every(row => !('href' in row))).toBe(true);
    });

    it('shares in-flight requests and replaces expired success with honest failure', async () => {
        vi.useFakeTimers({ toFake: ['Date'] });
        const cacheRepo = 'example-org/isolated-cache';
        const fetch = vi.fn(async () => Response.json({
            workflow_runs: [{ ...run(5,'success'), head_repository: { full_name: cacheRepo } }],
        }));
        vi.stubGlobal('fetch', fetch);
        const [one, two] = await Promise.all([loadGovernanceCheckRuns(cacheRepo), loadGovernanceCheckRuns(cacheRepo)]);
        expect(one).toEqual(two);
        expect(one[0].state).toBe('passed');
        expect(fetch).toHaveBeenCalledTimes(3);
        vi.setSystemTime(Date.now() + GOVERNANCE_CHECK_CACHE_MS - 1);
        expect((await loadGovernanceCheckRuns(cacheRepo))[0].state).toBe('passed');
        expect(fetch).toHaveBeenCalledTimes(3);
        vi.setSystemTime(Date.now() + 1);
        fetch.mockRejectedValue(new TypeError('Network unavailable'));
        const unavailable = await loadGovernanceCheckRuns(cacheRepo);
        expect(unavailable[0]).toEqual({ workflow: 'documentation', state:'unavailable' });
        expect(fetch).toHaveBeenCalledTimes(6);
    });

    it('distinguishes an empty run list from failed transport, and rejects invented run details', async () => {
        const fetch = vi.fn()
            .mockResolvedValueOnce(Response.json({ workflow_runs: [] }))
            .mockResolvedValueOnce(Response.json({ workflow_runs: 'invalid' }))
            .mockResolvedValueOnce(Response.json({ workflow_runs: [{ ...run(5,'success'), head_repository: { full_name: 'test-org/empty' }, head_sha: 'unauthentic' }] }));
        vi.stubGlobal('fetch', fetch);
        const result = await loadGovernanceCheckRuns('test-org/empty');
        expect(result.map(row => row.state)).toEqual(['noRun','unavailable','unavailable']);
    });

    it('lets configuration select a repository without accepting a URL', async () => {
        const fetch = vi.fn(async () => Response.json({ workflow_runs: [] }));
        vi.stubGlobal('fetch', fetch);
        vi.stubEnv('CVF_GOVERNANCE_GITHUB_REPOSITORY','https://example.invalid/owner/repo');
        expect((await loadGovernanceCheckRuns()).every(row => row.state === 'unavailable')).toBe(true);
        expect(fetch).not.toHaveBeenCalled();
    });
});
