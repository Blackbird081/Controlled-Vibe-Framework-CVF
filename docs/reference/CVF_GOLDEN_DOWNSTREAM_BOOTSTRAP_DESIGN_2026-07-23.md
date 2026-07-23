# CVF Golden Downstream Bootstrap — Design

- Tranche: `CVF-BSL-T1`
- Date: 2026-07-23
- Phase: DESIGN
- Status: APPROVED
- Depends on: `CVF_GOLDEN_DOWNSTREAM_BOOTSTRAP_LEARNING_INTAKE_2026-07-23.md`

## Design decision

The public core will own one canonical downstream catalog starter kit and one
executable validator/generator contract. `new-cvf-workspace.ps1` will install
that kit into a new downstream project and parameterize only project identity
and bootstrap metadata.

The generated downstream sources of truth are:

```text
docs/catalog/ARTIFACT_REGISTRY.json
docs/catalog/MODULE_REGISTRY.json
```

The generated human views are:

```text
docs/INDEX.md
docs/catalog/MODULE_CATALOG.md
```

The generated project owns an executable catalog manager that validates both
registries and deterministically renders both views. The workspace doctor
invokes the manager in check mode when the governed catalog kit is present.

## Component boundary

1. Bootstrap entrypoint
   - resolves workspace/core/project topology;
   - installs project artifacts without overwriting project-owned content;
   - delegates catalog starter-kit creation to a bounded helper/template
     surface;
   - stays below 600 lines after refactoring.
2. Catalog starter kit
   - includes closed schemas/vocabularies;
   - registers its own authority surfaces;
   - begins with zero source-backed modules;
   - contains no application-specific names other than the parameterized
     project identity.
3. Project catalog manager
   - uses the standard library only;
   - has `--check` and `--write`;
   - rejects missing paths, escapes, Windows separators, duplicates, invalid
     statuses/controls and hand-edited generated views;
   - computes metrics from source truth.
4. Workspace doctor
   - preserves compatibility with older downstream projects;
   - requires governed-catalog validation for newly generated kit versions;
   - reports catalog failure as a blocking project failure.
5. Golden-downstream harness
   - uses a temporary workspace outside the public-core checkout;
   - bootstraps an empty Git repository twice;
   - proves preservation and idempotency;
   - tests negative drift cases on disposable copies;
   - removes its temporary artifacts.

## Alternatives rejected

- Keep hand-authored Index/Catalog and rely on reviewer discipline: rejected
  because G1 demonstrated an avoidable catalog gate and drift risk.
- Put application-specific G1 files directly in the core: rejected because
  project identity and artifact inventory must be generated, not copied
  verbatim.
- Make the doctor silently regenerate drifted views: rejected because check
  mode must fail closed; writes remain an explicit maintainer action.
- Require third-party schema packages: rejected because fresh bootstrap must
  work with PowerShell, Git and the Python standard library already used by
  the public kit.
- Run provider-backed proof: rejected because the tranche asserts structural
  bootstrap behavior, not AI governance behavior.

## Compatibility

Existing downstream repositories without the new catalog-kit marker remain
supported by the existing doctor checks. Re-running bootstrap must preserve
project-owned registries and artifacts; it may add only missing starter-kit
surfaces and must report any manual merge requirement explicitly.
