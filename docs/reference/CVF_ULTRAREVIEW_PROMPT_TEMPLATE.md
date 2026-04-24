You are reviewing a large monorepo called Controlled Vibe Framework (CVF).

CVF is a governance-first control plane for AI-assisted software development. It is not a normal app-only repo. The key concern is whether governance claims are actually enforced in executable code.

Important project constraints:
- Any claim about governance behavior must be backed by real provider-backed behavior, not mock-only UI.
- Mock mode is allowed only for pure UI structure checks and must not be treated as proof of governance.
- The main risk categories in this repo are:
  - governance bypass
  - approval-flow bypass
  - DLP/output-validation gaps
  - provider-routing mistakes
  - audit trail / persistence defects
  - UI claims that overstate actual enforcement
  - non-coder flows that look governed but are only cosmetic

Recent remediations to verify rather than trust:
- approval store persistence and request-hash binding in approvals/execute
- CI governance hook invocation in .github/workflows
- service-token request signing and per-token rate-limit isolation on /api/execute
- break-glass TTL enforcement in admin session handling
- service-token inline knowledgeContext blocking on /api/execute
- output-validation exhaustion blocking instead of returning invalid output

Treat the remediations above as recently changed code: look for incomplete adoption, regressions, or equivalent gaps elsewhere rather than assuming they are correct.

This repository is very large and contains many markdown files. Do NOT spend meaningful review budget on markdown or documentation.

Read these two files first for repository rules and context:
- ./AGENTS.md
- ./CLAUDE.md

Then focus on these directories, in this priority order:
1. ./EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib
2. ./EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api
3. ./EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/(dashboard)
4. ./EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components
5. ./scripts
6. ./.github/workflows
7. ./.githooks

Also inspect these root-level release/build/config files if present:
- ./package.json
- ./netlify.toml
- ./.gitignore
- ./.github/workflows/**
- ./.githooks/**

Ignore these paths unless needed for direct code tracing:
- ./docs/**
- ./REVIEW/**
- ./ECOSYSTEM/**
- ./CVF_SKILL_LIBRARY/**
- ./public/**
- ./node_modules/**
- ./.next/**
- ./coverage/**
- ./v1.0/**
- ./v1.1/**
- ./EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/generated/**

Primary review goal:
Find real bugs, security issues, governance enforcement gaps, behavioral regressions, and mismatches between product claims and actual executable behavior.

Prioritize findings in this order:
1. Governance enforcement gaps
   - request paths that bypass policy/risk/approval checks
   - code paths where CVF appears to govern but does not actually enforce
   - mock/demo flows that could be mistaken for live governance proof
2. Auth / RBAC / impersonation issues
   - missing server-side checks
   - admin UI with weak backend enforcement
3. Provider routing / execution defects
   - unsafe fallbacks
   - provider selection drift
   - hidden behavior differences between configured providers
4. DLP / output validation / approval-flow issues
   - skipped validators
   - incomplete refusal handling
   - post-checks not actually enforced
5. Knowledge store / persistence / audit issues
   - write paths without audit
   - in-memory vs persistent divergence
   - retrieval or CRUD behavior that can lose evidence or create inconsistency
6. Non-coder governed-path regressions
   - help/home/starter path/processing/result flows
   - evidence receipt visibility and correctness
   - UI paths that navigate correctly but do not preserve governed behavior
7. Release-gate integrity
   - scripts or checks that may pass without actual live-governance proof
   - CI/CD or deployment workflows that can bypass intended enforcement
   - local hook chains that appear required but are not actually wired into release-critical paths
   - mismatches between package scripts, workflow jobs, Netlify/build config, and claimed release gates

Review rules:
- Trust executable code and tests more than documentation.
- Treat docs, roadmap language, help text, and marketing copy as non-authoritative unless code proves the behavior.
- Focus on high-signal issues, not style.
- Ignore cosmetic lint nits unless they hide a real defect.
- If an issue depends on an assumption, state the assumption.
- Prefer fewer, stronger findings over many weak ones.

Output format:
1. Findings first, ordered by severity.
2. For each finding include:
   - severity: critical / high / medium
   - title
   - why it matters
   - exact file references
   - exploit/regression scenario
   - recommended fix direction
3. Then include:
   - open questions / assumptions
   - residual risks not fully verified
   - highest-priority files for manual follow-up

If no major issues are found, say so explicitly, but still list residual risks and test gaps.

Do not start with a repo summary. Findings first.
