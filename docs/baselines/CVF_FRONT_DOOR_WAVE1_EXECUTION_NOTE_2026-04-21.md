# CVF Front-Door Rewrite — Wave 1 Execution Note

Memory class: SUMMARY_RECORD

> Date: 2026-04-21
> Class: PRODUCT / CORPUS_QUALITY / FRONT_DOOR_REWRITE
> Status: FILED — Wave 1 delivered
> Authority: `docs/roadmaps/CVF_FRONT_DOOR_REWRITE_ROADMAP_2026-04-20.md`

---

## Scope

Wave 1 covers the two immediate front-door hygiene targets:

1. resolve the `web_build_handoff` posture so it is no longer `UNSCREENED_LEGACY`
2. remove the `architecture_review` reject surface from strict front-door linkage

This note is an overlay on top of the 2026-04-15 rescreen baseline, not a rewrite of that historical wave.

---

## Decision Summary

| Target | Wave 1 decision | Result |
|---|---|---|
| `web_build_handoff` | Promote from `UNSCREENED_LEGACY` to `TRUSTED_FOR_VALUE_PROOF` | Remains on strict front door as a trusted supporting template |
| `architecture_review` | Remove strict front-door linkage from `02_architecture_review` | Template remains available as power-user / internal-only surface, but no longer contaminates strict front-door discovery |

---

## Why `web_build_handoff` Was Promoted

`web_build_handoff` now satisfies the front-door standard in the same way the trusted subset requires:

- plain-language intake only; no framework or stack choice is pushed onto the user
- required preservation guard is explicit through `mustPreserve`
- governed packet/export contract is explicit in the template
- live governed-path validation already exists through `route.web-build-handoff.alibaba.live.test.ts`
- front-door packet audit confirms packet-ready export/runtime behavior

Wave 1 treats this as sufficient for promotion into `TRUSTED_FOR_VALUE_PROOF` as a supporting front-door surface.

`web_build_handoff` is **not** added to the frozen benchmark subset. It is trusted supporting front-door surface only.

---

## Why `architecture_review` Was Removed From Strict Front Door

The 2026-04-15 rescreen already classified `architecture_review` as `REJECT_FOR_NON_CODER_FRONTDOOR`.

Wave 1 therefore does not attempt to rewrite it in place. Instead it removes the strict front-door linkage so the visible governed subset no longer inherits a reject-class template through the `02_architecture_review` skill mapping.

The template may remain in the platform for advanced or internal use, consistent with the quarantine note.

---

## Template Class Overrides

| Template ID | Override Class | Reason |
|---|---|---|
| `web_build_handoff` | `TRUSTED_FOR_VALUE_PROOF` | Wave 1 promotion after shared packet standard + live path + front-door audit alignment |

---

## Front-Door Linkage Changes

| Change | Impact |
|---|---|
| Remove `architecture_review -> technical_review::02_architecture_review` mapping from strict front-door skill map | Reject-class template no longer appears in linked front-door surfaces |

---

## Resulting Strict Front-Door Snapshot

After Wave 1:

- front-door visible skills remain `42`
- unique linked front-door templates reduce from `51` to `50`
- `TRUSTED_FOR_VALUE_PROOF` linked templates increase from `39` to `40`
- `REVIEW_REQUIRED` linked templates remain `10`
- linked `REJECT_FOR_NON_CODER_FRONTDOOR` templates drop to `0`
- linked `UNSCREENED_LEGACY` templates drop to `0`

Remaining rewrite debt after Wave 1 is therefore the 10 `REVIEW_REQUIRED` linked templates plus any mixed-skill naming or lane-splitting cleanup recorded in the roadmap.

---

## Follow-On Rule

Wave 1 is complete, but the strict front door is **not yet all-trusted** because 10 linked templates remain `REVIEW_REQUIRED`.

The next execution wave should therefore be the plain-language rewrite batch from the roadmap, not new corpus expansion.

---

*Filed: 2026-04-21 — front-door rewrite Wave 1*
