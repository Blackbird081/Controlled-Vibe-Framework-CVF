# CVF Knowledge Absorption Priority Guard

**Control ID:** `GC-043`
**Guard Class:** `CONTINUITY_AND_DECISION_GUARD`
**Status:** Active canonical rule for future knowledge absorption, repo-derived skill intake, and post-closure extension planning.
**Applies to:** all humans and AI agents drafting knowledge-intake assessments, synthesis roadmaps, skill/knowledge normalization packets, or proposing CVF expansion from external repo knowledge.
**Enforced by:** `governance/compat/check_knowledge_absorption_priority_compat.py`

## Purpose

- keep `CVF` as the governing root when new repo knowledge, skill patterns, or doctrine inputs are absorbed
- stop future packets from jumping straight into `implementation-first expansion` before doctrine and governance convergence are explicit
- standardize one mandatory priority order for post-closure knowledge uplift work

## Rule

When CVF absorbs or evaluates knowledge from external repos, external skill systems, or post-closure knowledge packets, the default sequence is mandatory:

1. doctrine-first absorption
2. governance-first absorption
3. owner-surface mapping into existing CVF canon and existing CVF owner surfaces
4. only then, and only if still justified, bounded implementation follow-up

`implementation-first expansion` is forbidden by default.

It may be opened only when all of the following are true:

- the doctrine/governance-first absorption step is already complete
- the active packet explicitly cites `docs/reference/CVF_KNOWLEDGE_ABSORPTION_AND_EXTENSION_PRIORITY_STANDARD_2026-04-13.md`
- a fresh operator decision exists
- a fresh explicit `GC-018` continuation state authorizes the next bounded implementation wave

## Mandatory Canonical References

Future knowledge-absorption or extension packets must treat these as canonical:

- `docs/reference/CVF_KNOWLEDGE_ABSORPTION_AND_EXTENSION_PRIORITY_STANDARD_2026-04-13.md`
- `docs/assessments/CVF_EXECUTIVE_VALUE_PRIORITIZATION_NOTE_2026-04-13.md`

The current best-practice exemplar is:

- `docs/roadmaps/CVF_GRAPHIFY_LLM_POWERED_PALACE_SYNTHESIS_ONLY_ROADMAP_2026-04-13.md`

That lane is canonical evidence that the next safe value-creating move after external knowledge assessment is often synthesis and owner-surface mapping, not direct implementation.

## Required Packet Posture

When a roadmap or assessment packet proposes new knowledge absorption or repo-derived extension, it must explicitly preserve all of the following:

- `CVF is the root`
- `owner-surface mapping` into current CVF canon or owner surfaces
- `no new surface by default`
- `implementation remains blocked` unless a fresh decision explicitly reopens it

For the planning/default lane, at least one of these posture boundaries must be explicit:

- `SYNTHESIS-ONLY`
- `NO IMPLEMENTATION`
- `no code changes`
- `no runtime changes`
- `No-New-Surface Rule`

## Enforcement Surface

- repo-level compatibility enforcement runs through `governance/compat/check_knowledge_absorption_priority_compat.py`
- local pre-push enforcement runs through `governance/compat/run_local_governance_hook_chain.py`
- CI enforcement runs through `.github/workflows/documentation-testing.yml`

The compatibility gate verifies that:

- the standard, executive note, guard, policy, control matrix, bootstrap, docs index, and handoff remain aligned
- the Graphify / LLM-Powered / Palace roadmap remains a canonical exemplar
- changed knowledge-absorption roadmaps keep the standard reference and doctrine/governance-first boundary markers
- the repo does not silently drift back toward `implementation-first expansion` as the default

## Related Artifacts

- `docs/reference/CVF_KNOWLEDGE_ABSORPTION_AND_EXTENSION_PRIORITY_STANDARD_2026-04-13.md`
- `docs/assessments/CVF_EXECUTIVE_VALUE_PRIORITIZATION_NOTE_2026-04-13.md`
- `docs/roadmaps/CVF_GRAPHIFY_LLM_POWERED_PALACE_SYNTHESIS_ONLY_ROADMAP_2026-04-13.md`
- `docs/reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md`
- `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md`

## Final Clause

If external knowledge cannot be absorbed into CVF doctrine, governance, and existing owner surfaces first, it has not yet earned the right to open native CVF implementation work.
