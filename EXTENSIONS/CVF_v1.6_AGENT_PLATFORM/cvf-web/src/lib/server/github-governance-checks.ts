import { GOVERNANCE_CHECK_WORKFLOWS, type GovernanceCheckRun, type GovernanceWorkflow } from '@/lib/governance-check-runs';

export const GOVERNANCE_CHECK_CACHE_MS = 10 * 60_000;
const publicRepository = 'Blackbird081/Controlled-Vibe-Framework-CVF';
const workflows = Object.keys(GOVERNANCE_CHECK_WORKFLOWS) as GovernanceWorkflow[];
const running = new Set(['queued', 'requested', 'waiting', 'pending', 'in_progress']);
const failed = new Set(['failure', 'timed_out', 'startup_failure', 'action_required', 'stale']);
const notPassed = new Set(['cancelled', 'neutral', 'skipped']);
const repositoryPattern = /^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9_][A-Za-z0-9_.-]*$/;

type GitHubRun = {
    id: number;
    status: string;
    conclusion: string | null;
    event: string;
    head_branch: string;
    head_repository: { full_name: string } | null;
    head_sha: string;
    run_started_at?: string;
    created_at: string;
};

function projectRun(workflow: GovernanceWorkflow, repo: string, run: GitHubRun): GovernanceCheckRun {
    const startedAt = run.run_started_at ?? run.created_at;
    if (!Number.isSafeInteger(run.id) || run.id <= 0 || !/^[a-f0-9]{40}$/.test(run.head_sha)
        || typeof startedAt !== 'string' || !Number.isFinite(Date.parse(startedAt))) {
        return { workflow, state: 'unavailable' };
    }
    const identity = { workflow, startedAt, sha: run.head_sha, href: `https://github.com/${repo}/actions/runs/${run.id}` };
    if (running.has(run.status)) return { ...identity, state: 'running' };
    if (run.status === 'completed') {
        const conclusion = run.conclusion ?? '';
        if (conclusion === 'success') return { ...identity, state: 'passed' };
        if (failed.has(conclusion)) return { ...identity, state: 'failed' };
        if (notPassed.has(conclusion)) return { ...identity, state: 'notPassed' };
    }
    return { workflow, state: 'unavailable' };
}

async function fetchRun(repo: string, workflow: GovernanceWorkflow): Promise<GovernanceCheckRun> {
    const filename = GOVERNANCE_CHECK_WORKFLOWS[workflow];
    const url = `https://api.github.com/repos/${repo}/actions/workflows/${filename}/runs?branch=main&per_page=10&exclude_pull_requests=true`;
    try {
        const response = await fetch(url, {
            headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'CVF-Governance-Checks' },
            signal: AbortSignal.timeout(5_000),
            cache: 'no-store',
            redirect: 'error',
        });
        if (!response.ok) return { workflow, state: 'unavailable' };
        const data: { workflow_runs?: GitHubRun[] } = await response.json();
        if (!Array.isArray(data?.workflow_runs)) return { workflow, state: 'unavailable' };
        // Even a PR fork can have a branch named main; require this repository's own branch.
        const run = data.workflow_runs.find(item =>
            item?.head_branch === 'main' && typeof item.event === 'string' && !item.event.startsWith('pull_request')
            && typeof item.head_repository?.full_name === 'string'
            && item.head_repository.full_name.toLowerCase() === repo.toLowerCase(),
        );
        return run ? projectRun(workflow, repo, run) : { workflow, state: 'noRun' };
    } catch {
        return { workflow, state: 'unavailable' };
    }
}

let cached: { repo: string; expiresAt: number; result: Promise<GovernanceCheckRun[]> } | undefined;

export function loadGovernanceCheckRuns(
    repository = process.env.CVF_GOVERNANCE_GITHUB_REPOSITORY ?? publicRepository,
): Promise<GovernanceCheckRun[]> {
    const repo = repository.trim();
    if (!repositoryPattern.test(repo) || repo.endsWith('.git')) {
        return Promise.resolve(workflows.map(workflow => ({ workflow, state: 'unavailable' })));
    }
    const now = Date.now();
    if (cached?.repo === repo && cached.expiresAt > now) return cached.result;
    const result = Promise.all(workflows.map(workflow => fetchRun(repo, workflow)));
    // Keep a single cache entry per server instance and coalesce concurrent requests.
    // An expired entry is never reused if a refresh fails.
    cached = { repo, expiresAt: now + GOVERNANCE_CHECK_CACHE_MS, result };
    return result;
}
