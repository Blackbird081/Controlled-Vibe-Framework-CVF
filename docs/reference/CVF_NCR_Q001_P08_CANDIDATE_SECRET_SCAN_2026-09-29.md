# CVF NCR Q001 P08 Candidate Secret Scan

Memory class: POINTER_RECORD

Status: BOUNDED_CANDIDATE_AND_SYNTHETIC_ARTIFACT_SCAN

docType: reference

Date: 2026-09-29

## Purpose

Record a secret-safe P08 check for the selected `cvf-web` HTML review packet candidate. Local owns verification and technical disposition. This check is a candidate diagnostic, not a CVF release gate or comprehensive DLP claim.

## Scope / Method

`scripts/scan_cvf_q001_candidate_secrets.py` enumerates Git-visible tracked and unignored untracked files under `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web`. It scans text extensions and extensionless files, reports skipped and unreadable counts, and fails on any unreadable target. The one icon is outside its text scope. Ignored `.env.local` is not read; the report records only its presence. An explicitly supplied HTML artifact is scanned regardless of extension. The report contains paths and line numbers only, never matching text or secret values.

The scanner reuses the release policy's pattern list and adds AWS access-key ID and GitHub fine-grained PAT shapes. Nine pre-existing non-live test lines are admitted only by exact candidate-relative path, line number, and SHA-256 of the whole line. A new match anywhere in a test tree, or a changed value at one of those positions, is not exempt. The canonical release bundle's broader repository scan and policy are unchanged.

## Local Evidence

At base HEAD `4254e38f0`, the scan command was:

`python scripts/scan_cvf_q001_candidate_secrets.py --artifact .cvf/runtime/q001-p08-artifact.html --json`

It returned `PASS`: 1,009 files considered; 1,008 scanned (1,007 candidate text files and one HTML); one icon skipped by extension; zero unreadable; nine exact fixture lines allowed; zero findings. `ignoredLocalEnvPresent=true` is metadata only. The HTML was generated from a synthetic, credential-free export through the local production-built Web route; it remained `DRAFT_UNACCEPTED`. Its SHA-256 was `9f0ae4dfd879a050dbff653c672a76677b2524436db81aec78134695091512b4`, with 2,687 bytes. The ignored local artifact is not a committed acceptance artifact.

`python -m unittest scripts/test_scan_cvf_q001_candidate_secrets.py -v` passed 4/4. Tests checked a new synthetic secret in a test file, a synthetic GitHub PAT substituted at an allowlisted path and line, a secret-bearing HTML artifact, and an unreadable artifact. Each fails closed; report serialization omits the synthetic secret value. The clean candidate check also requires all nine fixture fingerprints and zero unreadable files.

The pre-existing full-repository release scanner, run as the isolated `check_secrets(False)` function before this change, returned six path/line findings in pinned `.private_reference` source mirrors. It has broader legacy fixture/placeholder skips and is not replaced or marked passing by this Q001 check. No full release bundle or provider call was run for this bounded diagnostic.

## Claim Boundary

This establishes a reproducible, secret-safe candidate-source scan and one synthetic generated-HTML scan under the named pattern policy. It does not scan the operator's downloaded HTML, ignored local credentials, all repository mirrors, build outputs, external data sinks, logs, or future artifacts. Pattern scanning can miss credentials outside its signatures. P08 remains partial until its full candidate/artifact and release-profile scope is reconciled; Q001/R0, provider governance, artifact acceptance, retention and deployment stay open.

## Epistemic Process Block

### Expected Result / Prediction

The selected candidate and synthetic HTML should have no unreviewed matches; known fixtures should be exact exceptions, while new synthetic secrets should fail without value disclosure.

### Evidence Comparison

The candidate plus HTML scan returned zero findings with nine exact fixture fingerprints. Four negative/positive boundary tests passed and the reported metadata contained no synthetic secret values.

### Contradiction Or Gap Disposition

The existing full-repository scanner's six pinned-mirror findings and broad legacy exemptions are outside this Q001 candidate result. The ignored OAuth config and operator-downloaded HTML were not scanned. They remain separate scope decisions, not implicit passes.

### Claim Update

P08 has bounded evidence for the selected source candidate and one synthetic HTML output only. Full P08 and Q001/R0 exit remain open.
