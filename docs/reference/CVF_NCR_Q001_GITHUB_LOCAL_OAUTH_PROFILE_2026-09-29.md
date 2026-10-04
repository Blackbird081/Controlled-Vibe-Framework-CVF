# CVF NCR Q001 GitHub Local OAuth Profile

Memory class: POINTER_RECORD

Status: OAUTH_SESSION_ROUTE_AND_LOCAL_RECEIPT_OBSERVED_BOUNDED

docType: reference

Date: 2026-09-29

## Purpose

Record the exact local GitHub OAuth setup and bounded Q001 sign-in, session route, and receipt evidence. Local owns private-CVF verification and final technical disposition.

## Scope / Applies To

Applies to the operator's selected local Q001 GitHub sign-in profile and Local verification of its account binding, callback, session, and receipt. The operator selected `admin` for the comprehensive test and controls the GitHub OAuth App. Local owns the technical evidence disposition.

## Fixed Profile Inputs

| Input | Value / evidence |
|---|---|
| Provider | `github`, selected by operator |
| Browser origin, `NEXTAUTH_URL`, and `AUTH_URL` | `http://localhost:3000`; both local variables must name the same origin |
| GitHub OAuth App homepage | `http://localhost:3000` |
| GitHub OAuth App authorization callback | `http://localhost:3000/api/auth/callback/github` |
| Public account candidate | `Blackbird081`; `https://api.github.com/users/Blackbird081` returned numeric ID `206422451` on 2026-09-29 |
| Auth.js subject representation | Installed GitHub provider converts profile `id` to string; candidate `providerAccountId` is `"206422451"` |
| CVF binding | `provider=github`, `providerAccountId="206422451"`, `userId=usr_github_206422451`, `role=admin`, `orgId=org_cvf`, `teamId=team_exec`; operator selected `admin` for the local test |
| Local config | Ignored `.env.local` has the binding, provider, both origin variables, a locally generated session secret, and the operator-provided GitHub client pair; no values are committed |

The first local production build passed, `/login` returned 200, Auth.js exposed only `github`, and anonymous `/api/auth/me` returned 401. The first GitHub authorization stopped with `redirect_uri is not associated with this application`: Auth.js advertised `http://localhost:3000/api/auth/callback/github` while the operator had been given `127.0.0.1`. After the local origin and GitHub App redirect were aligned, one callback produced `InvalidCheck: pkceCodeVerifier value could not be parsed`. A local cookie-jar probe showed the sign-in request creates the PKCE cookie and sends GitHub the exact `localhost` redirect. The operator retried from a fresh Firefox Private session on `localhost` and reported `/api/auth/me` as `authenticated=true`, `user=Blackbird081`, `userId=usr_github_206422451`, `role=admin`, `orgId=org_cvf`, `teamId=team_exec`, `impersonation=null`. The earlier PKCE failure is consistent with stale or cross-origin cookies, but its exact browser-side cause was not independently observed.

The GitHub login email is not the CVF authority key. The public account lookup identifies a candidate only; control of that account must be established by a real OAuth callback.

## Operator Configuration

1. Register one GitHub OAuth App under the intended GitHub account or organization at GitHub Settings > Developer settings > OAuth apps > New OAuth App. Use the homepage and callback above. GitHub's [OAuth App registration guide](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app) describes these fields. Do not put private CVF paths or secrets in the public application name or description.
2. Put the generated client ID and client secret in the controlled local configuration as `GITHUB_ID` and `GITHUB_SECRET`. The ignored `cvf-web/.env.local` already contains the other Q001 values and a generated `NEXTAUTH_SECRET`; `git check-ignore` confirms `.env.local` is ignored. Do not send secret values through chat or commit them.
3. Keep the reviewed `CVF_OAUTH_IDENTITY_BINDINGS_JSON` keyed to subject `"206422451"`; do not substitute the username or email. The distinct CVF user ID keeps admin audit attribution separate from the seeded mock admin. `admin` can access admin API routes; owner-only actions still require `owner`.
4. Run the web package on the local browser origin above with the real configuration. If port/origin changes, update `NEXTAUTH_URL`, `AUTH_URL`, and the OAuth App callback together. GitHub's [authorization flow and redirect rules](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps) govern the callback match.

## Bounded Verification

- Completed bounded: production build passed with real local config; local HTTP probes saw only GitHub, `/login` 200, anonymous `/api/auth/me` 401; operator-relayed authenticated session JSON matched the reviewed CVF admin binding. No codes, tokens, cookies, client secret, or signed headers were recorded.
- Completed bounded by operator report: `/admin/audit-log` opened in the same Firefox Private GitHub session. Local did not inspect its browser cookie or page contents.
- Verify an unbound account is denied if one is available, and that removing the binding invalidates subsequent use after controlled configuration propagation. Do not infer immediate revocation from source tests.
- The exact route-auth proof from one later browser export is recorded below. A single warm response time is not a first-run or latency-distribution measurement. Keep `DRAFT_UNACCEPTED` distinct from a receipt `ALLOW` decision.

## Local Work Transfer Receipt Attempt

On 2026-09-29, Local started the current Governance Engine on `127.0.0.1:8000` with a separate ignored ledger at `.cvf/runtime/q001-github-receipt-20260929/ledger_chain.json`. Engine health and CVF Web's `/api/governance/health` both returned `healthy`; the ledger was empty before the browser export. The operator used Work Transfer and relayed the resulting HTML, generated at `2026-09-29T05:25:12.200Z`, with the explicit `DRAFT / UNACCEPTED` notice and receipt anchor `transfer-1dbdb2e0-39d5-45c4-8d15-2900dff4b775`.

The engine ledger then contained one block. Local recomputed its SHA-256 hash and `GENESIS` link, and independently read the same request ID through `/api/v1/ledger`: `artifact-proof-transfer-1dbdb2e0-39d5-45c4-8d15-2900dff4b775-1790659512204`. The block's decision was `ALLOW`; block hash was `90ec72d1f44d67e50485b0e67e40fb46560e718fa4e2ad0fe0ccbf11e1b7d410`. No engine error was logged. A subsequent operator-provided screenshot of Work Transfer shows `Blackbird081`/`Admin` in the sidebar, the matching export anchor, the UI's governance `ALLOW` note, and the explicit draft/unaccepted notice. Current `ArtifactExportPanel.tsx` renders that note only when `governanceReceipt.decision === 'ALLOW'`; `proof.ts` returns a receipt object only with status `PRESENT`. Thus the screenshot and source support a bounded displayed-receipt inference, not a direct inspection of the response JSON. The browser component sends no service-token header and the route requires either a valid token or session; `session` auth mode is likewise a source-supported inference, not a directly captured route-auth proof. The selected historical audit record names `usr_2 (admin)`; that record's actor must not be confused with the current GitHub subject `usr_github_206422451`. First/warm end-to-end latency remains unmeasured.

## Bounded Local Latency Probe

With the same production-built CVF Web and local engine already warm, Local sent five sequential synthetic `POST /api/artifacts/export` requests using the configured service token and per-request HMAC signature. No browser cookie, user text or external provider call entered this probe. All five returned HTTP 200, `routeGovernanceProof.authMode=service_token`, receipt status `PRESENT`, decision `ALLOW` and state `DRAFT_UNACCEPTED`. Elapsed client times were 59.8, 10.8, 9.6, 10.1 and 9.0 ms; median 10.1 ms, attempts 2-5 range 9.0-10.8 ms. Local recomputed all six ledger block hashes and previous-hash links, including the earlier browser-triggered block, and joined each of the five new receipt IDs to a distinct ledger request ID. Six-block tip hash: `95172cb62f2d04dd40fdf6bf5771eea7075ccfe454a99c139129f81db663964f`.

This small, same-host warm sample is diagnostic only. The first request includes a new Node client's connection setup; it is not a cold CVF Web or engine start. It cannot establish a latency distribution, timeout policy, hosted behavior or GitHub-session export time.

## Direct Browser Session Route Proof

On 2026-09-29, Local temporarily placed a transparent same-host HTTP relay on `localhost:3000` in front of a second instance of the same production-built CVF Web on port 3001. The relay forwarded request and response bytes and recorded only the export response's selected status/proof fields and elapsed time in ignored local runtime storage. It did not persist cookies, tokens, request bodies, response HTML, or raw headers. Before the operator action, `/login` returned HTTP 200, the proxied engine health was `healthy`, and anonymous `/api/auth/me` returned 401. The operator refreshed Work Transfer in the existing GitHub-authenticated Firefox Private window and triggered one HTML export.

That `POST /api/artifacts/export` returned HTTP 200 and `success=true` in 85.7 ms measured at the relay, with `routeGovernanceProof.authMode=session`, `actorId=usr_github_206422451`, route decision `ALLOW`, receipt status `PRESENT`, receipt decision `ALLOW`, and `governanceState=DRAFT_UNACCEPTED`. Receipt ID and attempt ID both were `artifact-proof-transfer-1dbdb2e0-39d5-45c4-8d15-2900dff4b775-1790668534339`. The engine ledger grew from six to seven blocks; its last block had that request ID, decision `ALLOW`, previous hash `95172cb62f2d04dd40fdf6bf5771eea7075ccfe454a99c139129f81db663964f`, and tip hash `24ad1bce923c04cddcf08227f64031e3883ec8acf35136d358bddd5353920b4d`. Local recomputed all seven block hashes with the engine's sorted-key JSON SHA-256 method and checked every previous-hash link; all passed. The operator confirmed the export completed. Local then removed the relay and second Web instance and restored direct production-built Web on port 3000; `/login` returned 200 and engine health remained `healthy`.

This directly establishes the session auth mode and ledger join for one local browser export. The 85.7 ms is a single warm same-host relay observation, not a browser navigation measurement, cold-start result, percentile, timeout distribution, or hosted target. The selected Work Transfer record still names historical actor `usr_2`; route actor `usr_github_206422451` is the authenticated caller, not a rewrite of that audit record.

## Bounded Ledger Snapshot Restore Check

Local copied the six-block synthetic ledger to an ignored backup path, then copied that file to a separate restore path. SHA-256 of source, backup and restored files matched: `d9fda5194d0204820f90a9ac77663a4c5341ac2e4e47d78496f129296a750842`. A second local Governance Engine started on `127.0.0.1:8101` with `CVF_GOVERNANCE_LEDGER_PATH` pointing at the restored copy. Its `/api/v1/ledger` returned six blocks with the same request IDs and tip hash as the primary engine. Local stopped the second engine; the primary remained healthy. This proves only that one quiescent local snapshot is readable by the current engine. It does not establish online backup consistency, retention duration, multi-writer safety, encrypted/off-machine backup, restore under failure, RPO or RTO.

## Claim Boundary

Existing source tests cover the binding contract. The local production build and operator-relayed real GitHub login plus admin page access establish a bounded authenticated admin UI path for the selected account; Local did not inspect the browser cookie or GitHub token. The later browser-triggered local export directly returned session route proof, `ALLOW` receipt and draft/unaccepted state, and reached the engine ledger with a valid hash and matching request ID. Five service-token exports and one session export provide small warm-path diagnostics, and one offline snapshot was readable by a second local engine. They do not establish latency distribution or durable backup policy. Binding revocation, provider governance behavior, artifact acceptance, deployment, and production readiness remain separate proof obligations. The Governance Engine was not running during the earlier OAuth check; it ran in an isolated local profile for the later receipt attempts. P11 and public export remain parked.

## Epistemic Process Block

### Expected Result / Prediction

With the GitHub redirect and local browser origin aligned, a clean callback for account ID `206422451` should yield the explicit CVF admin binding and no mock credential authority.

### Evidence Comparison

The first mismatched redirect failed, the next callback failed its PKCE cookie check, and a clean Firefox Private retry returned the expected `/api/auth/me` fields by operator report. The server's unauthenticated route probes and provider listing were observed locally. A later Work Transfer export returned draft HTML by operator report and created one independently hash-checked engine ledger event with a matching receipt anchor. Five subsequent synthetic service-token requests returned distinct receipts joined to a valid six-block chain. One additional GitHub-session browser export returned direct route proof and a receipt joined to the seventh hash-valid ledger block.

### Contradiction Or Gap Disposition

The first two failures were not success evidence. The clean retry and same-session admin page access support the bounded login/access claim. The later screenshot plus ledger support a displayed `ALLOW` receipt and draft export; the additional browser export directly confirms `session` route auth mode and actor. The exact cause of the PKCE cookie failure remains open.

### Claim Update

Q001 GitHub login, selected admin session, admin page access and Work Transfer `ALLOW`/draft display have operator-observed evidence in the local profile. A later direct response confirms session route auth, GitHub actor, receipt and hash-valid ledger join in 85.7 ms through a temporary local relay; the separate service-token probe gives a bounded warm local latency sample. One quiescent ledger snapshot was restored by a second engine. First-run and distributed OAuth-path latency, durable backup/retention and artifact acceptance remain open.
