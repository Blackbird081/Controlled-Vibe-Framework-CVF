# CVF CI1-T6 Checker Decision

Memory class: FULL_RECORD

Status: CLOSED_PASS_BOUNDED

docType: reference

Date: 2026-06-02

executionBaseHead: `0808aa8d`

## Purpose

Record the per-gap checker decision for the six normalization gaps identified
during CI1-T5 adversarial sampling of the cross-corpus index model. This
document is the output artifact of CI1-T6 and the primary gate condition for
CI1-T7 (LPCI Intake Bridge).

## Scope

Applies to: CI1-T6 Checker Decision execution under CVF Corpus Intelligence
roadmap. This reference document is the primary per-gap governance decision
table for the six normalization gaps identified in CI1-T5 adversarial sampling.

Downstream applicability: CI1-T7 LPCI Intake Bridge dispatch gate; future
corpus intelligence readiness packet authoring; checker spec stub
implementation roadmaps; vocabulary extension maintenance for the T4 model.

Owner surface: CVF corpus intelligence governance layer.

## Authority Chain

| Authority | Path |
| --- | --- |
| CI1-T6 GC-018 | `docs/baselines/CVF_GC018_CI1_T6_CHECKER_DECISION_2026-06-02.md` |
| CI1-T6 work order | `docs/work_orders/CVF_WO_CI1_T6_CHECKER_DECISION_2026-06-02.md` |
| CI1-T5 results | `docs/corpus-intelligence/CVF_CI1_T5_CLASSIFICATION_SAMPLING_RESULTS.json` |
| CI1 roadmap | `docs/roadmaps/CVF_CI1_CORPUS_INTELLIGENCE_OPERATIONALIZATION_ROADMAP_2026-06-02.md` |

## Input Summary

T5 sampling produced 15 records over 5 categories (13 PASS, 2 PASS_WITH_GAP,
0 FAIL). Six normalization gaps were identified and routed to CI1-T6:

| gapId | T5 category | T5 t6Category |
| --- | --- | --- |
| NR-04 | STRUCTURAL_CHECK_CANDIDATE | per-file sourceHash missing |
| NR-05 | STRUCTURAL_CHECK_CANDIDATE | normalizedPath undefined algorithm |
| NR-11 | STRUCTURAL_CHECK_CANDIDATE | DEFER vs ACCEPT_SUMMARY_ONLY merge rule |
| NR-03-vocab | STRUCTURAL_CHECK_CANDIDATE | CONTROL_PLANE_ADAPTERS missing from NR-03 list |
| NR-06 | DOCUMENTATION_ONLY_GAP | per-file sensitivity — uniformly restricted corpora |
| NR-07 | DOCUMENTATION_ONLY_GAP | Language field — no canonical facet equivalent |

## Decision Evaluation Method

Each gap was evaluated on three axes:

1. **Enforceability** — can a machine checker unambiguously evaluate this
   without understanding corpus semantics?
2. **Precondition completeness** — is a written standard or algorithm needed
   before a checker can be written?
3. **Risk if unresolved** — what governance failure does leaving this gap
   open enable?

Source references: T5 `normalizationGaps` array and `t6Inputs` block in
`docs/corpus-intelligence/CVF_CI1_T5_CLASSIFICATION_SAMPLING_RESULTS.json`.

---

## Decision Table

| gapId | sourceFromT5 | problem | decision | checkerAction | standardAction | downstreamImpact | blocksCI1T7 | rationale |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| NR-04 | Both T2 and T3 provide only manifest-level hash. Per-file hash not computed in either packet. | Without per-file hash, a structural checker cannot detect per-file drift between corpus scan and downstream retrieval. Manifest-level hash is a weaker drift guarantee. | STRUCTURAL_CHECK_REQUIRED | CHECKER_SPEC_STUB — future checker validates that each classification-ledger row includes a `sourceHash` field or that the packet provides an explicit `manifestProxyException` declaration. | Define `per-file sourceHash requirement` in the corpus-intelligence readiness packet template: either `sourceHash` per row or `manifestHashProxy: true` plus documented trade-off. | Corpus Intelligence Readiness Packet Template; future T2/T3 successors; LPCI ingestion integrity. | NO — CI1-T7 may proceed; checker implementation is a future tranche. | A checker spec stub provides governance traceability now; implementation is separated per GC-018 forbidden scope. Per-file hash is the correct long-term control; manifest proxy with explicit exception is acceptable interim state. |
| NR-05 | T2 does not declare normalizedPath field; T3 declares field but defers per-file application. | Path normalization algorithm is undefined across packets. Cross-packet path matching without a canonical rule produces ad-hoc normalization that is unverifiable by a checker. | STANDARD_REQUIRED_FIRST | CHECKER_SPEC_STUB — after the standard defines the algorithm, a checker validates that each row's `normalizedPath` matches the canonical form (forward-slash, lowercase, trailing separator stripped). Standard must precede checker authoring. | Define `CVF Corpus Path Normalization Algorithm` in the readiness packet template or a new reference doc: forward-slash separator, all lowercase, no trailing separator, relative to corpus root. | Corpus Intelligence Readiness Packet Template; cross-packet path matching in T4 normalization; LPCI query routing. | NO — CI1-T7 may proceed; standard authoring is a future tranche. | A checker that validates paths without a defined algorithm would produce false positives on legitimate platform-specific paths. Standard-first prevents checker thrash. T3 has already reserved the field name; a standard can specify the algorithm without breaking T3 compatibility. |
| NR-11 | T2 uses DEFER for bounded acceptance with deferred implementation; T3 uses ACCEPT_SUMMARY_ONLY for semantically equivalent state. T4 maps both as DIRECT_MAP without a canonical merge rule. | Cross-packet disposition queries can return inconsistent results for the same semantic state (deferred implementation). LPCI routing based on disposition requires a canonical merge rule. | STANDARD_REQUIRED_FIRST | CHECKER_SPEC_STUB — after the standard defines the canonical merged disposition, a checker validates that any packet using DEFER on an implemented-but-deferred row includes a `dispositionAlias` annotation pointing to the canonical merge value. | Define canonical disposition merge rule in `CVF Corpus Intelligence Classification Standard` (new doc or extension of readiness template): DEFER (T2 style) and ACCEPT_SUMMARY_ONLY (T3 style) both resolve to canonical value `ACCEPT_DEFERRED` for cross-packet queries; original packet value is preserved as `rawDisposition`. | T4 normalization rules NR-11; cross-packet disposition query layer; LPCI classification routing. | NO — CI1-T7 may proceed; standard authoring is a future tranche. | A vocabulary merge rule is a one-paragraph written standard; it does not require a checker to be useful. Checker becomes viable only after the standard is written and the canonical value is defined. T3 ACCEPT_SUMMARY_ONLY is the preferred future vocabulary; DEFER is the T2 legacy term. |
| NR-03-vocab | T4 NR-03 vocabulary list omits CONTROL_PLANE_ADAPTERS which appears in T3 classification ledger row C4. | NR-03 vocabulary is incomplete. Future packets using CONTROL_PLANE_ADAPTERS lack a canonical definition reference. A checker validating ownerSurface values would reject valid T3 rows. | VOCABULARY_EXTENSION_REQUIRED | VOCABULARY_EXTENSION — add `CONTROL_PLANE_ADAPTERS` to NR-03 `valueVocabulary` in `CVF_CROSS_CORPUS_INDEX_MODEL.json`. After extension, a checker may optionally validate ownerSurface values against the updated vocabulary list. | Update NR-03 `valueVocabulary` in `docs/corpus-intelligence/CVF_CROSS_CORPUS_INDEX_MODEL.json` to include `CONTROL_PLANE_ADAPTERS` with definition: surface for CVF control-plane adapter layer (IS1-class generic adapters; mediation between external agents and CVF governance). | T4 normalization rules NR-03; future corpus packets; LPCI ownerSurface routing filter. | NO — CI1-T7 may proceed; T4 model vocabulary extension is a bounded low-risk edit. | CONTROL_PLANE_ADAPTERS is already in T3; the only gap is the T4 model vocabulary list. Extending the list is a documentation correction, not a new governance concept. Checker is optional and deferred to post-vocabulary extension. |
| NR-06 | T2 states sensitivity at corpus level only; T3 states 'restricted' explicitly per-file. | Per-file sensitivity is not guaranteed across packets. Mixed-sensitivity corpora would have undeclared per-file exposure in packets following the T2 pattern. | DOCUMENTATION_ONLY | DOCUMENTATION_ENTRY — add a note to the readiness packet template: packets covering a mixed-sensitivity corpus must state sensitivity per classification-ledger row; packets covering a uniformly restricted corpus may state sensitivity at corpus level with an explicit `uniformSensitivity: true` declaration. | Add guidance note to `docs/reference/CVF_CORPUS_INTELLIGENCE_READINESS_PACKET_TEMPLATE_2026-06-02.md`: uniformly restricted corpora may use corpus-level sensitivity declaration; mixed-sensitivity corpora require per-row `sensitivity` field. | Readiness packet template; future packet authors. Both T2 and T3 pilot corpora are uniformly restricted — no retroactive correction needed. | NO | Both pilot corpora are uniformly restricted; no active risk. A documentation entry prevents future mixed-sensitivity corpora from silently omitting per-row sensitivity. A machine checker would add noise on the many uniform-sensitivity packets and is not warranted. |
| NR-07 | T2 Language field (Vietnamese/English) has no canonical equivalent in T4 commonFacets. | Bilingual corpus content cannot be filtered by language using the common facet schema. Retrieval queries on language-specific content cannot use a structured filter. | DOCUMENTATION_ONLY | DOCUMENTATION_ENTRY — add `primaryLanguage` as an optional extension field to the readiness packet template `commonFacets` section: ISO 639-1 two-letter code, e.g. `vi`, `en`. Non-primary languages listed in `secondaryLanguages: []`. | Add `primaryLanguage` and `secondaryLanguages` optional fields to `CVF_CORPUS_INTELLIGENCE_READINESS_PACKET_TEMPLATE_2026-06-02.md` commonFacets section. Update T4 model `commonFacets` schema note to reference optional language extension fields. | Readiness packet template; T4 model `commonFacets` schema; LPCI language-aware retrieval (future, advisory only). | NO | Language filtering is a retrieval quality improvement, not a governance integrity risk. No checker is warranted — open vocabulary for language codes makes checker maintenance expensive. Optional extension fields in the template are sufficient for authoring guidance. |

---

## NR-03-vocab Vocabulary Extension (Bounded Action)

The following extension to the T4 model `normalizationRules[2]` (`NR-03`)
`valueVocabulary` list is authorized under VOCABULARY_EXTENSION_REQUIRED
without a separate tranche, as it is a correction of an existing gap in the
committed T4 model:

```json
{
  "value": "CONTROL_PLANE_ADAPTERS",
  "definition": "Surface for the CVF control-plane adapter layer — IS1-class generic agent adapters that mediate between external agents and the CVF governance control plane.",
  "source": "T3 classification ledger row C4 (DIRECT_MAP); CVF_GC018_IS1_GENERIC_AGENT_ADAPTER_2026-05-31.md"
}
```

This entry must be added to `normalizationRules[2].valueVocabulary` in
`docs/corpus-intelligence/CVF_CROSS_CORPUS_INDEX_MODEL.json` in the same
commit that closes CI1-T6. This is the only runtime artifact authorized in
this tranche.

---

## Checker Spec Stubs

The following stubs record future checker intent without implementing code.
They are governance traceability artifacts, not executable checks.

### Stub 1 — per-file sourceHash checker (NR-04)

```text
checker-id: check_corpus_packet_source_hash
trigger: any new corpus intelligence readiness packet file added to docs/audits/
rule: each classification-ledger row must include a sourceHash field, OR
      the packet-level manifest must declare manifestHashProxy: true with
      an explicit documented trade-off.
prerequisite: NR-04 standard entry in readiness packet template (STANDARD_REQUIRED_FIRST satisfied for this stub to become executable).
implementation-tranche: separate governed roadmap; not authorized in CI1-T6.
```

### Stub 2 — normalizedPath algorithm checker (NR-05)

```text
checker-id: check_corpus_packet_normalized_path
trigger: any new corpus intelligence readiness packet file added to docs/audits/
rule: each classification-ledger row that includes a normalizedPath field
      must match canonical form: forward-slash separator, all lowercase,
      no trailing separator, relative to corpus root.
prerequisite: CVF Corpus Path Normalization Algorithm standard written
              (STANDARD_REQUIRED_FIRST; not yet written).
implementation-tranche: separate governed roadmap; not authorized in CI1-T6.
```

### Stub 3 — disposition vocabulary merge checker (NR-11)

```text
checker-id: check_corpus_packet_disposition_canonical
trigger: any new corpus intelligence readiness packet file added to docs/audits/
rule: any row using DEFER disposition must include a dispositionAlias annotation
      pointing to the canonical merged value (ACCEPT_DEFERRED) when the
      deferred state represents bounded acceptance with deferred implementation.
prerequisite: CVF Corpus Intelligence Classification Standard merge rule written
              (STANDARD_REQUIRED_FIRST; not yet written).
implementation-tranche: separate governed roadmap; not authorized in CI1-T6.
```

---

## CI1-T7 Gate

Verdict: T7_READY

All six gaps have been decided. No BLOCKED verdict. Summary:

| gapId | decision | blocksCI1T7 |
| --- | --- | --- |
| NR-04 | STRUCTURAL_CHECK_REQUIRED | NO |
| NR-05 | STANDARD_REQUIRED_FIRST | NO |
| NR-11 | STANDARD_REQUIRED_FIRST | NO |
| NR-03-vocab | VOCABULARY_EXTENSION_REQUIRED | NO |
| NR-06 | DOCUMENTATION_ONLY | NO |
| NR-07 | DOCUMENTATION_ONLY | NO |

CI1-T7 LPCI Intake Bridge may be opened once CI1-T6 artifacts are committed
and the reviewer updates the session front door and handoff accordingly.

Rationale: the structural checker specs (NR-04/NR-05/NR-11) produce stubs
only; their implementation is deferred to future tranches and does not block
LPCI design work. The vocabulary extension (NR-03-vocab) is a bounded
documentation correction. The documentation-only decisions (NR-06/NR-07)
require no blocker resolution.

---

## Downstream Routing

The following actions are authorized but not implemented in CI1-T6:

| Action | Downstream owner | Priority |
| --- | --- | --- |
| Author `CVF Corpus Path Normalization Algorithm` standard | future tranche | LOW (before T3-successor packets) |
| Author `CVF Corpus Intelligence Classification Standard` merge rule | future tranche | LOW (before cross-packet disposition queries) |
| Extend readiness packet template — sensitivity note | future tranche | LOW (before mixed-sensitivity corpus packet) |
| Extend readiness packet template — language fields | future tranche | LOW (before language-filtered retrieval) |
| Implement check_corpus_packet_source_hash checker | future governed roadmap | DEFERRED |
| Implement check_corpus_packet_normalized_path checker | future governed roadmap | DEFERRED |
| Implement check_corpus_packet_disposition_canonical checker | future governed roadmap | DEFERRED |

---

## Finding-To-Governance Learning Disposition

Runtime/provider/cost learning lane: N/A_WITH_REASON — CI1-T6 is a
documentation-only decision tranche with no provider calls, no live proof,
and no runtime behavior changes. All findings are governance/control-plane or
documentation-only learning.

| Finding | Defect class | Learning lane | Disposition | Next action |
| --- | --- | --- | --- | --- |
| NR-04 — manifest-only hash gap | MACHINE_GATE_GAP | GOVERNANCE_CONTROL_PLANE | MACHINE_CHECK_CANDIDATE | Spec stub recorded; add standard entry to readiness packet template; implement checker in future governed roadmap |
| NR-05 — undefined path normalization algorithm | RULE_GAP | GOVERNANCE_CONTROL_PLANE | MACHINE_CHECK_CANDIDATE | Spec stub recorded; author CVF Corpus Path Normalization Algorithm standard first; checker implementation deferred |
| NR-11 — DEFER vs ACCEPT_SUMMARY_ONLY vocabulary gap | RULE_GAP | GOVERNANCE_CONTROL_PLANE | MACHINE_CHECK_CANDIDATE | Spec stub recorded; author disposition merge rule standard; checker implementation deferred |
| NR-03-vocab — CONTROL_PLANE_ADAPTERS missing from NR-03 | RULE_GAP | GOVERNANCE_CONTROL_PLANE | RULE_ADDED | T4 model vocabulary extension applied in this tranche |
| NR-06 — per-file sensitivity undeclared for uniform corpora | RULE_GAP | DOCUMENTATION_ONLY_LEARNING | RULE_ADDED | Documentation entry required in readiness packet template before mixed-sensitivity corpus packet |
| NR-07 — language field absent from commonFacets | RULE_GAP | DOCUMENTATION_ONLY_LEARNING | RULE_ADDED | Optional extension fields to be added to readiness packet template and T4 model commonFacets schema note |

---

## Claim Boundary

CI1-T6 decides governance gap disposition only. It does not:

- implement any checker, guard, or test file;
- modify runtime source (`EXTENSIONS/`, `governance/compat/`);
- authorize LPCI chatbot implementation, provider calls, live proof, or
  public-sync;
- claim universal semantic correctness, production readiness, hosted
  readiness, or legal correctness;
- extend scope beyond the six T5 normalization gaps.

The NR-03-vocab vocabulary extension to `CVF_CROSS_CORPUS_INDEX_MODEL.json`
is the only data file modification authorized in this tranche; it is a
bounded correction of an existing committed model.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY
