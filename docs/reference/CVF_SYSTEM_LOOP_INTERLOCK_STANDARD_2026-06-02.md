# CVF System Loop Interlock Standard

Memory class: FULL_RECORD

Status: ACTIVE

docType: reference

Date: 2026-06-02

Control ID: GC-052

---

## Purpose

CVF is a system only when outputs from one governed loop become typed,
discoverable, and verifiable inputs to the next governed loop.

This standard defines the **System Loop Interlock** contract: every material
loop-to-loop connection must declare its upstream loop, output artifact,
signal contract, downstream loop, input artifact, routing rule, evidence, and
automation boundary.

Without this contract, planes can look complete while running as isolated
parallel tracks. That is not sufficient for CVF.

---

## Scope

This standard applies to loop connections within a plane and across planes,
including but not limited to:

- scan loop to learning loop;
- learning loop to work-order/roadmap loop;
- memory loop to retrieval loop;
- retrieval loop to answer/product loop;
- runtime proof loop to governance closure loop;
- user feedback loop to learning plane;
- public-sync loop to product catalog loop.

---

## Registry

Canonical registry:

`docs/reference/CVF_SYSTEM_LOOP_INTERLOCK_REGISTRY_2026-06-02.json`

Machine checker:

`governance/compat/check_system_loop_interlock.py`

The registry is the front door for interloop connectivity. It does not replace
the source artifacts; it points to the source artifacts and declares how a
downstream loop consumes them.

---

## Required Registry Fields

Each registry connection must include:

| Field | Meaning |
| --- | --- |
| `id` | Stable connection ID |
| `status` | `ACTIVE`, `PARKED`, `PROPOSED`, or `DEPRECATED` |
| `upstreamLoop` | Loop that produces the signal |
| `upstreamPlane` | Plane or system area that owns the producer |
| `outputArtifact` | Artifact path where the upstream output is recorded |
| `outputSignal` | Named signal or data shape emitted by the upstream loop |
| `signalContract` | Canonical contract/standard/checker that defines the signal |
| `downstreamLoop` | Loop that consumes the signal |
| `downstreamPlane` | Plane or system area that owns the consumer |
| `inputArtifact` | Artifact path where the downstream loop receives or tracks the signal |
| `routingRule` | Deterministic rule for moving output into downstream input |
| `evidenceRefs` | Existing artifacts proving this connection |
| `automationLevel` | `MACHINE_CHECKED`, `STRUCTURAL_GUARDED`, `HUMAN_ROUTED`, or `PARKED` |
| `claimBoundary` | What this connection does not prove |

---

## Interlock Requirements

An interloop connection is valid only when:

1. The upstream loop has a named output signal.
2. The downstream loop has a named input artifact or intake contract.
3. The routing rule says how output becomes input.
4. Evidence refs point to existing files.
5. Machine-checked or structural-guarded connections are wired into the relevant
   autorun or local hook chain.
6. The claim boundary blocks overclaiming. A connection can prove traceability
   without proving semantic correctness, runtime behavior, production readiness,
   or autonomous mutation.

## Work Order Dispatch Requirement

When a work order produces output that another loop must consume, the work order
must include a `System Loop Interlock Requirement` section or an equivalent
literal heading.

For corpus scan work, that section must name:

- GC-051 registry path;
- finding packet path or creation rule;
- downstream F2G/Learning Loop input;
- required finding fields (`defectClass`, `learningLane`, `nextAction`, and
  action evidence);
- the boundary that the routing does not authorize autonomous mutation,
  runtime implementation, guard changes, or public claims.

This makes the orchestrator responsible for handing the worker a real loop
connection, not just a report-writing assignment.

---

## Initial Mandatory Connection

The first active connection is:

`scan-loop-to-learning-loop`

It connects:

- upstream: GC-051 Corpus Scan Registry findings;
- downstream: Finding-To-Governance / Learning Signal Intake;
- output signal: scan finding with `disposition`, `defectClass`, `learningLane`,
  and action evidence;
- downstream input: F2G disposition plus learning signal intake candidate.

This connection is machine-checked for structure and artifact existence. It
does not automatically create roadmaps, work orders, runtime mutations, or
provider changes.

---

## Boundaries / Non-Goals

- No autonomous mutation of rules, guards, prompts, runtime behavior, memory
  policy, or provider routing.
- No claim that every semantic finding is correct.
- No claim that every possible loop is already connected.
- No hidden scheduler or background worker is introduced by this standard.
- No public readiness or production readiness claim.

---

## Verification / Evidence

Run:

```powershell
python governance/compat/check_system_loop_interlock.py --enforce
```

Autorun and local hook chains must include this checker before claiming a
loop/plane is system-connected.

---

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this standard references private provenance governance loops and
internal artifact paths. Public export requires a separate public-readiness
review.
