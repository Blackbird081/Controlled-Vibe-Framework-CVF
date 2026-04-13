# CVF W71-T1 Post-Closure Knowledge Native Adoption Roadmap — 2026-04-13

Memory class: SUMMARY_RECORD

## 1. Executive Decision

Recommended next bounded wave:

`W71-T1 — Post-Closure Knowledge Native Adoption`

This wave exists to take the promoted knowledge from `CVF ADDING NEW` and `Windows_Skill_Normalization` from:

`integrated + verified + bounded runnable inheritance`

to:

`CVF-native / default-governed / canonically adopted`

This is the correct next move if the operator goal is:

`make the absorbed knowledge 100% part of CVF rather than a bounded post-closure uplift`

## 2. Why This Wave Exists

The current repo truth is already much stronger than “reference only”:

- useful source material was independently evaluated, rebutted, curated, and promoted into canon
- CPF and LPF gained bounded helper realization
- `cvf-web` gained a runnable inheritance path through `POST /api/governance/external-assets/prepare`
- W67→W70 delivered a usable governed registry/operator lane around that inheritance path

But the same repo truth still says this uplift is not yet fully native:

- many promoted docs still carry `internal design draft` posture
- bounded helper surfaces exist, but they are not yet treated as default CVF doctrine everywhere they apply
- some heavy items remain intentionally deferred by boundary discipline
- the architecture whitepaper still describes this as a post-closure uplift rather than a fully assimilated canon layer

So the correct next wave is not provider work and not a new intake theory.
It is a native-adoption wave.

## 3. What “100% Part Of CVF” Means

For this wave, the phrase means all four conditions below are satisfied:

1. **Canon-native**
- the important promoted materials no longer sit primarily under `internal design draft`
- their final status is explicit: `canonical`, `bounded invariant`, `reference appendix`, or `deferred by design`

2. **Runtime-native**
- the most important promoted semantics are no longer just exposed through a side route
- they are treated as normal governed CVF behavior inside the bounded surfaces where they belong

3. **Governance-native**
- review, registry, and diagnostic flows use the promoted semantics as first-class policy inputs
- agent handoff and whitepaper no longer describe them mainly as uplifted extras

4. **Quality-native**
- tests prove the adopted semantics are stable
- docs, code, and UI tell the same story

If these four conditions are not met, the knowledge is integrated, but not yet “100% part of CVF”.

## 4. Scope

### In Scope

- reclassification of promoted post-closure docs from draft posture to final CVF posture where justified
- native adoption of promoted semantics across `CPF`, `LPF`, and `cvf-web` where already bounded and proven
- review/governance flow alignment for external-asset preparation and registry readiness
- architecture/readme/handoff updates that remove “semi-external uplift” ambiguity
- tests required to prove the native posture

### Out Of Scope

- reopening PVV/API-key/provider lanes
- modifying `/api/execute`
- storage backend migration
- Docker / new physical sandbox work
- broad new architecture exploration unrelated to the promoted knowledge packets
- pretending future-facing heavy items are done when they are still intentionally deferred

## 5. Native-Adoption Rule

The next agent must preserve this rule:

- only promote to full CVF-native status what has both doctrinal fit and implementation evidence
- if a promoted item still lacks evidence, it must be explicitly classified as `deferred by design`, not hand-waved into canon
- no “paper-native only” promotion is allowed
- no “runtime-native only” hack is allowed without canon/doc alignment

This wave is about convergence of doctrine, implementation, and evidence.

## 6. Control Points

### CP1 — Canon Posture Finalization

Deliver:

- audit the post-closure promoted docs one more time as a family
- classify each one into:
  - `canonical`
  - `reference appendix`
  - `bounded invariant`
  - `deferred by design`

Acceptance criteria:

- no important promoted file remains in an ambiguous “sort of draft, sort of canon” state
- `README`, whitepaper, and handoff use the same posture vocabulary
- a clear promotion/finalization matrix exists

Primary targets:

- `CVF_SEMANTIC_POLICY_INTENT_REGISTRY.md`
- `CVF_W7_EXTERNAL_ASSET_INTAKE_PROFILE.md`
- `CVF_W7_EXECUTION_ENVIRONMENT_NORMALIZATION_POLICY.md`
- `CVF_W7_WINDOWS_COMPATIBILITY_EVALUATION_CHECKLIST.md`
- `CVF_PLANNER_TRIGGER_HEURISTICS.md`
- `CVF_PROVISIONAL_EVALUATION_SIGNAL_CANDIDATES.md`
- `CVF_W7_EXTERNAL_ASSET_COMPILER_GUIDE.md`
- W7/CLI family docs

### CP2 — Native Governance Adoption

Deliver:

- review/governance flow uses the promoted semantics as first-class checks
- registry-readiness and review-required behavior are expressed in terms that match the promoted canon
- external-asset preparation and registry surfaces stop feeling like a sidecar experiment

Acceptance criteria:

- the prepared asset lane clearly reflects semantic intent, intake normalization, environment awareness, planner clarity, and provisional signal posture as normal governed CVF behavior
- no duplicate “mini doctrine” exists in UI or route code
- docs and code agree on what is authoritative

### CP3 — Native Runtime Adoption

Deliver:

- bounded runtime inheritance path is normalized as an official CVF surface, not just a post-closure proof
- the most important promoted helpers are wired where they logically belong inside current bounded surfaces
- unnecessary “uplift” wording is removed where the surface is now fully operational

Acceptance criteria:

- `POST /api/governance/external-assets/prepare` and its surrounding operator flows are documented as an official CVF-native governed surface
- CPF/LPF helper surfaces used by that lane are treated as normal foundations, not experimental attachments
- runtime behavior remains clearly separated from provider-lane execution

### CP4 — Architecture / Handoff / Readme Assimilation

Deliver:

- whitepaper updated so the post-closure knowledge is described as part of present CVF, not mainly as an add-on
- `docs/reference/README.md` updated to reflect final posture
- `AGENT_HANDOFF.md` updated so future agents do not mentally separate this knowledge from the rest of CVF

Acceptance criteria:

- architecture narrative, repo readme, and handoff all express the same truth
- the uplift language remains only where it is historically useful, not where it causes present-tense ambiguity

### CP5 — Quality Closure

Deliver:

- test strategy and proving commands for the adopted surfaces
- explicit list of what is still deferred even after W71

Acceptance criteria:

- the wave ends with a clean line between “now native” and “still deferred”
- no future agent has to rediscover what was truly absorbed vs merely archived

## 7. Mandatory Execution Order

The next agent must execute in this order:

1. read this roadmap and current handoff/whitepaper
2. finalize posture classification first
3. update canon and architecture wording second
4. then align bounded code/runtime surfaces
5. then prove the changed surfaces with focused tests/build
6. then update handoff and final closure docs last

Do not start with code changes alone.
Do not start with only wording edits.
This wave is specifically about aligning both.

## 8. Minimum Files Likely In Scope

- `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md`
- `docs/reference/README.md`
- `AGENT_HANDOFF.md`
- promoted W7/CLI and external-asset reference docs
- bounded `cvf-web` governance surfaces around `/prepare`, `/register`, `/retire`, and the operator page
- relevant CPF/LPF helper files only where native-adoption alignment truly requires it

## 9. Mandatory Tests

Minimum proving commands depend on touched surfaces, but at least:

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web && npx vitest run src/app/api/governance/external-assets/prepare/route.test.ts src/app/api/governance/external-assets/register/route.test.ts src/app/api/governance/external-assets/retire/route.test.ts
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web && npx tsc --noEmit
```

If UI or route behavior changes materially:

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web && npm run test:run
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web && npm run build
```

If CPF or LPF surfaces are materially changed, the next agent must run the smallest proving commands that cover those exact surfaces instead of defaulting to unrelated full-suite churn.

## 10. Required Questions This Wave Must Answer

The wave is not done unless it answers these explicitly:

1. Which promoted docs are now fully canonical?
2. Which promoted docs remain reference-only?
3. Which heavy items remain intentionally deferred?
4. Which bounded runtime surfaces now count as official CVF-native behavior?
5. What exactly still prevents “100% adoption” after the wave, if anything?

## 11. Definition Of Done

This wave is done when:

- the absorbed post-closure knowledge is no longer described mainly as an uplift
- final posture is explicit for every important promoted artifact
- the important bounded runtime/governance surfaces are treated as normal CVF surfaces
- docs, handoff, and code tell the same story
- tests/build prove the touched adoption surfaces
- the remaining deferred items are explicitly few, bounded, and named

## 12. Canonical References

- `docs/assessments/CVF_ADDING_NEW_IMPLEMENTATION_CLOSURE_2026-04-12.md`
- `docs/assessments/CVF_WINDOWS_SKILL_NORMALIZATION_PROMOTION_MAP_2026-04-12.md`
- `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md`
- `docs/reference/README.md`
- `AGENT_HANDOFF.md`

## 13. Next-Agent Instruction

Do not treat the absorbed knowledge as “already fully native” without proving it.

Do not treat it as “still only auxiliary” either.

The correct next move is:

`finish the canon-native, governance-native, runtime-native, and quality-native adoption of the post-closure knowledge so it becomes unambiguously part of CVF itself`
