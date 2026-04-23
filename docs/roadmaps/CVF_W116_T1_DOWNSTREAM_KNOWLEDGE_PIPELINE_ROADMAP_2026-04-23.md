# CVF W116-T1 Downstream Knowledge Pipeline Roadmap

> Date: 2026-04-23
> Status: PLANNED
> Memory class: SUMMARY_RECORD
> Scope class: KNOWLEDGE-NATIVE PRODUCT VALUE / DOWNSTREAM EXTENSION
> Predecessor: W114-T1 (Non-Coder Value Maximization), W116 is a direct extension of the +0.775 knowledge-native delta
> Wave ID: W116

## 0. Problem Statement

W101/W102 proved that knowledge-native context improves governed output by `+0.775 delta`. But the knowledge base is CVF's own hardcoded collection — downstream projects cannot inject their own knowledge.

Current gap:
- A non-coder bootstraps a downstream CVF workspace for their own project.
- Their project has docs, specs, or README files relevant to their tasks.
- CVF ignores those files entirely and only uses CVF's own global knowledge.
- The +0.775 benefit does not extend to project-specific queries.

## 1. Goal

> A downstream CVF workspace can place `.md` files in a `knowledge/` folder, and CVF-governed `/api/execute` runs will inject that project knowledge into the system prompt — improving output quality on project-specific queries.

No vector store or external service required for the initial delivery. File-based ingestion and keyword scoring is sufficient to prove the value increment.

## 2. Architecture Boundary

Allowed changes:
- `scripts/new-cvf-workspace.ps1` — generate `knowledge/` stub
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/knowledge-retrieval.ts` — extend to accept downstream knowledge input
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/route.ts` — knowledge path reads downstream chunks when provided
- New file ingestion script (PowerShell or Node.js) under `scripts/`
- `.cvf/manifest.json` schema — add optional `knowledgePath` field

Not allowed:
- External vector stores, embedding APIs, or semantic search (out of scope for this wave)
- Changes to governance runtime, Guard Contract, or RBAC
- Changes to existing enterprise org/team scope enforcement (that is W117)
- Knowledge ingestion as an automatic background daemon

## 3. Current State

The existing in-memory knowledge retrieval (`src/lib/knowledge-retrieval.ts`) uses keyword-based scoring against hardcoded `KNOWLEDGE_COLLECTIONS`. The `knowledge-context-injector.ts` accepts a pre-formatted string and appends it to the system prompt. The injection path works end-to-end; what is missing is a way to feed project-specific content into it.

## 4. Checkpoints

### CP1: Workspace Knowledge Folder Convention

Deliver:
- `.cvf/manifest.json` gains an optional `knowledgePath` field (default value: `"knowledge/"`).
- `scripts/new-cvf-workspace.ps1` creates a `knowledge/` folder with a stub `README.md` explaining what to put there.
- `scripts/check_cvf_workspace_agent_enforcement.ps1` gains one optional check: if `knowledgePath` is declared in manifest, the folder exists. Missing folder is a warn, not a fail.
- Update the downstream AGENTS template to mention the knowledge folder.

Acceptance:
- Bootstrap generates `knowledge/README.md` stub when folder is absent.
- Doctor reports knowledge folder presence/absence without hard-failing.
- Manifest schema accepts `knowledgePath` without breaking existing manifests that lack it.

### CP2: File Ingestion Script

Deliver:
- New `scripts/ingest_cvf_downstream_knowledge.ps1` (or `.js`) that:
  - reads all `.md` files from the configured `knowledgePath`
  - splits each file into paragraph-level chunks (max ~400 words per chunk)
  - extracts keywords from each chunk (noun phrases, title tokens)
  - outputs `knowledge/_index.json` with: `[{ id, sourceFile, content, keywords }]`
- Script accepts `-KnowledgePath` and `-OutputIndex` parameters.

Acceptance:
- Script runs on a folder with 3-5 `.md` files and produces valid JSON.
- Chunks stay ≤ 400 words.
- Keywords are non-empty for every chunk.
- Script does not require any external service.

### CP3: API Ingest Endpoint

Deliver:
- New route: `POST /api/knowledge/ingest` (project-scoped, no org/team enforcement at this layer).
  - Body: `{ chunks: KnowledgeChunk[], collectionId: string }`
  - Loads chunks into the in-process knowledge store for the current server session.
  - Returns `{ accepted: number }`.
- The in-process store extends the existing `KNOWLEDGE_COLLECTIONS` array at runtime (no write to disk; session-scoped).

Acceptance:
- POST with 5 chunks returns `{ accepted: 5 }`.
- Subsequent `/api/execute` calls can retrieve those chunks via the existing keyword scorer.
- Unit tests cover: ingest → query → chunk present in result.

### CP4: Execute-Path Integration

Deliver:
- `/api/execute` request body may include `knowledgeCollectionId` referencing a collection added via `/api/knowledge/ingest`.
- When present, the knowledge retrieval path queries that collection in addition to global collections.
- Response `knowledgeInjection` field reports which collection was used.
- Web UI: Settings or workspace page gains a "Load Project Knowledge" button that triggers ingest from a configured index path.

Acceptance:
- A request with `knowledgeCollectionId` set to a downstream collection returns chunks from that collection.
- A request without `knowledgeCollectionId` still uses global collections as before (no regression).
- `knowledgeInjection.chunkCount > 0` is present in the response when downstream chunks are injected.

### CP5: Live Evidence

Deliver:
- Create a small sample knowledge folder (`knowledge/sample-project-spec.md`) with 5 distinct project facts.
- Run `/api/execute` with a query that should use one of those facts, on the Alibaba lane.
- Confirm: response output reflects the project fact, `knowledgeInjection.chunkCount > 0`.
- Record a `delta` metric: same query without project knowledge vs with project knowledge.
- Assessment filed at `docs/assessments/CVF_W116_T1_DOWNSTREAM_KNOWLEDGE_PIPELINE_ASSESSMENT_2026-04-23.md`.

Acceptance:
- At least 2/3 project-fact queries show the injected fact reflected in output.
- `delta` is positive (with-knowledge output scores higher on relevance).
- Release gate PASS after CP5.

## 5. Verification Rules

```bash
# After each CP: unit tests + lint + build
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npm run test:run
npm run lint
npm run build

# CP5 live evidence (requires DASHSCOPE_API_KEY / ALIBABA_API_KEY)
python scripts/run_cvf_release_gate_bundle.py --json
```

Mock mode valid only for unit tests. The live delta claim in CP5 requires a real API call.

## 6. Non-Goals

- Semantic / embedding-based search (no vector store in this wave).
- Knowledge base versioning or history.
- Multi-user knowledge sharing (org/team scoping — that is W117).
- Automatic re-ingestion on file changes (daemon / file-watcher).
- Knowledge from non-markdown formats (PDF, DOCX, HTML).

## 7. Relationship to W117

W116 proves file-based downstream knowledge works for a single project without org/team scoping.
W117 (D1.4b RAG Chunk Enforcement) builds on W116's infrastructure to add:
- writable persistent store (beyond session-scoped memory)
- org/team scope enforcement per collection
- admin CRUD UI

Run W116 before W117 to avoid building the persistent store before the ingestion path is proven.

## 8. Exit Criteria

W116 closes when:
- Bootstrap generates knowledge folder stub.
- Ingestion script produces valid chunk index from `.md` files.
- API ingest endpoint loads chunks into session store.
- Execute path uses downstream chunks when collection id is provided.
- Live evidence shows positive delta on project-specific queries.
- Full release gate PASS.
