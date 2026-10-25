#!/usr/bin/env python3
"""Fail-closed preflight for a pending CVF public-sync projection."""

from __future__ import annotations

import argparse
import hashlib
import json
import posixpath
import re
import subprocess
import sys
import shutil
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "governance/compat"))
from guard_binding_catalog import DOCS_DECLARED_JOBS, DOCS_PRIVATE_JOBS, DOCS_PUBLIC_PROFILE_JOBS, private_binding, require_public_projection
from guard_binding_catalog import PUBLIC_FROZEN_MARKDOWN_SHA256, PUBLIC_NATIVE_MARKDOWN_RULES, PUBLIC_FROZEN_PUBLIC_BASE_BINDINGS, PUBLIC_MARKDOWN_LAYOUT_COMPATIBILITY


def markdown_style_groups(paths: set[str]) -> dict[str, list[str]]:
    groups = {"frozen": [], "ordinary": []}
    for path in sorted(paths):
        if not path.lower().endswith(".md"):
            continue
        group = "frozen" if path in PUBLIC_FROZEN_MARKDOWN_SHA256 else "native_" + "_".join(sorted(PUBLIC_NATIVE_MARKDOWN_RULES[path])) if path in PUBLIC_NATIVE_MARKDOWN_RULES else "ordinary"
        groups.setdefault(group, []).append(path)
    return groups


def markdown_rule_profile(config: dict, disabled_rules: tuple[str, ...] = ()) -> dict:
    if set(disabled_rules) - {"MD025", "MD036", "MD041"}:
        raise ValueError("A native artifact interpretation cannot disable table/link or arbitrary style rules")
    profile = dict(config)
    profile["MD024"] = {"siblings_only": True}
    profile.update({rule: False for rule in disabled_rules})
    return profile


def frozen_markdown_violations(root: Path, paths: set[str]) -> list[dict[str, str]]:
    violations = []
    for path in sorted(PUBLIC_FROZEN_MARKDOWN_SHA256):
        target = root / path
        if not target.is_file() or frozen_canonical_bytes(target.read_bytes(), PUBLIC_FROZEN_MARKDOWN_SHA256[path]) is None:
            violations.append({"code": "FROZEN_MARKDOWN_BYTES_CHANGED", "detail": path})
    return violations


def frozen_canonical_bytes(raw: bytes, expected_sha256: str) -> bytes | None:
    """Recognize a Git text checkout without accepting content normalization."""
    if hashlib.sha256(raw).hexdigest() == expected_sha256:
        return raw
    canonical = raw.replace(b"\r\n", b"\n")
    return canonical if hashlib.sha256(canonical).hexdigest() == expected_sha256 else None


def markdown_layout_compatibility_violations(root: Path) -> list[dict[str, str]]:
    issues = []
    for path, entry in sorted(PUBLIC_MARKDOWN_LAYOUT_COMPATIBILITY.items()):
        target = root / path
        accepted = {*entry["inputSha256"], entry["formattedSha256"]}
        if not target.is_file() or not any(frozen_canonical_bytes(target.read_bytes(), digest) is not None for digest in accepted):
            issues.append({"code": "MARKDOWN_COMPATIBILITY_REVIEW_REQUIRED", "detail": path})
    return issues


def emit_frozen_public_markdown(root: Path, paths: set[str]) -> list[str]:
    """Emit accepted Git blob bytes into the public projection only."""
    violations = frozen_markdown_violations(root, paths)
    if violations:
        raise ValueError("Frozen content drift must be repaired at its owner before projection")
    emitted = []
    for path in sorted(PUBLIC_FROZEN_MARKDOWN_SHA256):
        expected = PUBLIC_FROZEN_MARKDOWN_SHA256[path]
        source_ref = PUBLIC_FROZEN_PUBLIC_BASE_BINDINGS.get(path, "HEAD")
        blob = subprocess.run(["git", "-C", str(root), "show", f"{source_ref}:{path}"], capture_output=True)
        if blob.returncode and path == "docs/CVF_ARCHITECTURE_DECISIONS_ARCHIVE_ADR011-015.md":
            baseline = resolve_commit(root, "HEAD", "first ADR archive projection base")
            canonical = frozen_canonical_bytes((root / path).read_bytes(), expected)
            if baseline != "30c5e53f33cc9a0be72dc4faa83d61b930b4a8c3" or canonical is None:
                raise ValueError("New sealed ADR archive requires its exact admitted first-sync bytes")
            (root / path).write_bytes(canonical)
            emitted.append(path)
            continue
        if blob.returncode and path == "docs/evidence/archive/EXPORT_MANIFEST_2026-05-09.md":
            baseline = resolve_commit(root, "HEAD", "first archive projection base")
            if baseline != "30c5e53f33cc9a0be72dc4faa83d61b930b4a8c3":
                raise ValueError("May 9 archive lineage fallback is valid only at the admitted first public baseline")
            blob = subprocess.run(["git", "-C", str(root), "show", "30c5e53f33cc9a0be72dc4faa83d61b930b4a8c3:docs/EXPORT_MANIFEST.md"], capture_output=True)
        if blob.returncode or hashlib.sha256(blob.stdout).hexdigest() != expected:
            raise ValueError(f"Accepted source Git blob does not match frozen pin: {path}")
        (root / path).write_bytes(blob.stdout)
        emitted.append(path)
    return emitted


def validate_markdown_format_inputs(root: Path, authorized_paths: set[str]) -> list[str]:
    """Formatting owns clean HEAD documents plus explicitly admitted inputs."""
    unowned = sorted(set(pending_paths(root)) - authorized_paths)
    if unowned:
        raise ValueError("Unowned pending input cannot gain formatter ownership: " + ", ".join(unowned[:20]))
    return sorted(authorized_paths)


def markdown_command_batches(paths: list[str], command: list[str], *, windows: bool | None = None) -> list[list[str]]:
    """Budget the complete quoted command, including native CLI flags."""
    windows = sys.platform == "win32" if windows is None else windows
    # npx.cmd and npm's CLI wrapper both traverse cmd.exe's 8191-character
    # limit. Reserve over 2000 characters for wrapper expansion; measuring only
    # relative paths misses executable/config/output paths and their quoting.
    budget = 6000 if windows else 18000

    def command_size(values: list[str]) -> int:
        quoted = subprocess.list2cmdline(values)
        return len(quoted.encode("utf-16-le")) // 2 if windows else len(quoted.encode("utf-8"))

    batches, current = [], []
    for path in paths:
        if command_size(command + [path]) > budget:
            raise ValueError("A single Markdown path plus CLI prefix exceeds the safe command budget")
        if current and command_size(command + current + [path]) > budget:
            batches.append(current)
            current = []
        current.append(path)
    if current:
        batches.append(current)
    return batches


# Exact public Git preimages only; private DEFERRED artifacts are not copied.
PUBLIC_TABLE_LAYOUT_REPAIRS = {
    'docs/reference/agent_system_skills/CVF_ASSF_COMPOSITION_CONTROL_CONTRACT.md': (
        '59c95ed99c9fa437f26d718211bce03c0324789eeeeb61292cfa22bffa23a193', 'aa230ef40cf64721ed1d7e36a4a08fa7b8e02ab5e8cbbc53a6e3157ad508c66f',
        'extends|replaces|capabilityClaims|compositionFailureDisposition',
        'extends\\|replaces\\|capabilityClaims\\|compositionFailureDisposition',
    ),
    'docs/reference/external_agent_review/CVF_EXTERNAL_ABSORPTION_CONDITIONAL_REOPEN_INDEX.md': (
        'e24f7bfc8d24c9d872ef51540747a79445c34679d9ee478b3099bb7e7c3b1b60', '2ae5f296c9937f26cc84f8b23401785e93464e8d4d9330b962ec1824bb9a2d42',
        '| Enumeration command | `rg -n "PACKAGE_CANDIDATE|RUNTIME_CANDIDATE|CHECKER_CANDIDATE|DEFER_WITH_REOPEN_CONDITION|DEFERRED_WITH_REOPEN_CONDITION|VALUE_PARKED"',
        '| Enumeration command | `rg -n "PACKAGE_CANDIDATE\\|RUNTIME_CANDIDATE\\|CHECKER_CANDIDATE\\|DEFER_WITH_REOPEN_CONDITION\\|DEFERRED_WITH_REOPEN_CONDITION\\|VALUE_PARKED"',
    ),
    'docs/reference/governance_control_index/CVF_GOVERNANCE_CONTROL_INDEX.md': (
        'd8e26a496bac6a8660b8a661adbc6c40e53aaddc9a85910f7434fa4732ca9dd1', 'b0bf151ecd2a088b7aaf17bf03081651db494ea097811af868c3b28886ab8ddb',
        "`Select-String -Pattern '^\\\\| `GC-'`",
        "``Select-String -Pattern '^\\\\\\| `GC-'``",
    ),
    'docs/reference/review_cost_control/README.md': (
        '8aff8c69ad17118bf3892fb1fa0fc689085bb1211eeea6ef71a69292c9e18916', '501ee60060f4003251ba374eb3ea370cd2102c253708f45f1b8f0cb84956f826',
        '| Manifest delta | MATCH |\nThis is a two-file reference family',
        '| Manifest delta | MATCH |\n\nThis is a two-file reference family',
    ),
}


def repair_public_table_layout(root: Path, paths: set[str]) -> list[str]:
    """Repair four known public-only table layouts without adopting private text."""
    repaired = []
    for path, (old_sha, new_sha, old, new) in PUBLIC_TABLE_LAYOUT_REPAIRS.items():
        if path not in paths or path in PUBLIC_FROZEN_MARKDOWN_SHA256:
            continue
        target = root / path
        canonical = frozen_canonical_bytes(target.read_bytes(), old_sha)
        if canonical is None:
            continue
        candidate = canonical.decode("utf-8").replace(old, new).encode("utf-8")
        if hashlib.sha256(candidate).hexdigest() != new_sha:
            raise RuntimeError(f"Public table repair postimage mismatch: {path}")
        target.write_bytes(candidate)
        repaired.append(path)
    return repaired


def run_public_markdown(root: Path, *, fix: bool, command: list[str] | None = None, authorized_paths: set[str] | None = None) -> dict:
    """Run native markdownlint against declared formats, with bounded output."""
    require_public_projection(root)
    if fix:
        if authorized_paths is None:
            raise ValueError("Formatting requires an explicit pre-format ownership manifest")
        validate_markdown_format_inputs(root, authorized_paths)
    tracked = git(root, "ls-files", "-z")
    if tracked.returncode:
        raise RuntimeError("Cannot enumerate the public Markdown candidate")
    paths = set(tracked.stdout.split("\0")) | set(pending_paths(root))
    groups = markdown_style_groups(paths)
    compatibility_issues = markdown_layout_compatibility_violations(root)
    if fix and compatibility_issues:
        raise ValueError("Changed legacy layout requires explicit compatibility renewal: " + ", ".join(item["detail"] for item in compatibility_issues[:20]))
    emitted = emit_frozen_public_markdown(root, paths) if fix else []
    before = {path: hashlib.sha256((root / path).read_bytes()).hexdigest()
              for group, group_paths in groups.items() if group != "frozen" for path in group_paths if (root / path).is_file()}
    layout_repairs = repair_public_table_layout(root, set(before)) if fix else []
    violations = frozen_markdown_violations(root, paths)
    violations.extend(compatibility_issues)
    config_path = root / ".markdownlintrc"
    config = json.loads(config_path.read_text(encoding="utf-8"))
    if command is None:
        npx = shutil.which("npx")
        if not npx:
            raise RuntimeError("Pinned markdownlint-cli 0.47.0 requires npx")
        command = [npx, "--yes", "markdownlint-cli@0.47.0"]
    diagnostics = Path(tempfile.mkdtemp(prefix="cvf-public-markdown-"))
    findings = []
    executions = []
    for group in groups:
        if group == "frozen":
            continue
        disabled = tuple(group.removeprefix("native_").split("_")) if group.startswith("native_") else ()
        profile = markdown_rule_profile(config, disabled)
        profile_path = diagnostics / f"{group}-config.json"
        profile_path.write_text(json.dumps(profile), encoding="utf-8")
        # The planning output name is at least as long as every real batch
        # ordinal, so each eventual invocation remains inside the same budget.
        ordinal_bound = "9" * len(str(len(groups[group])))
        planning_output = diagnostics / f"{group}-{ordinal_bound}.json"
        planning_command = command + ["--config", str(profile_path), "--json", "--output", str(planning_output)]
        if fix:
            planning_command.append("--fix")
        batches = markdown_command_batches(groups[group], planning_command)
        for ordinal, batch in enumerate(batches):
            output = diagnostics / f"{group}-{ordinal}.json"
            argv = command + ["--config", str(profile_path), "--json", "--output", str(output)]
            if fix:
                argv.append("--fix")
            active = list(batch)
            rows = []
            passes = []
            seen_states = set()
            for round_index in range(3 if fix else 1):
                previous = {path: hashlib.sha256((root / path).read_bytes()).hexdigest() for path in active}
                state = tuple(sorted(previous.items()))
                if state in seen_states:
                    break
                seen_states.add(state)
                proc = subprocess.run(argv + active, cwd=root, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=180)
                if proc.returncode not in (0, 1) or not output.is_file():
                    raise RuntimeError(f"markdownlint failed to produce {group} findings; exit={proc.returncode}; {proc.stderr[-1000:]}")
                latest = json.loads(output.read_text(encoding="utf-8")) if output.stat().st_size else []
                rows = [row for row in rows if row["fileName"].replace("\\", "/") not in active] + latest
                passes.append({"round": round_index + 1, "files": len(active), "findings": len(latest), "exit": proc.returncode})
                if not fix:
                    break
                fixable = {row["fileName"].replace("\\", "/") for row in latest if row.get("fixInfo")}
                active = sorted(path for path in fixable if path in previous and (root / path).is_file()
                                and hashlib.sha256((root / path).read_bytes()).hexdigest() != previous[path])
                if not active:
                    break
            findings.extend(rows)
            executions.append({"class": group, "batch": ordinal, "files": len(batch), "exit": proc.returncode, "passes": passes})
    violations.extend(frozen_markdown_violations(root, paths))
    violations.extend(markdown_layout_compatibility_violations(root))
    findings_path = diagnostics / "findings.json"
    findings_path.write_text(json.dumps(findings, separators=(",", ":")), encoding="utf-8")
    changed = [path for path, digest in before.items() if not (root / path).is_file()
               or hashlib.sha256((root / path).read_bytes()).hexdigest() != digest]
    return {"status": "PASS" if not findings and not violations else "REJECT", "fix": fix,
            "groups": {key: len(value) for key, value in groups.items()}, "findings": len(findings),
            "findingsPath": str(findings_path), "violations": violations, "executions": executions,
            "diagnosticRoot": str(diagnostics), "changedPaths": sorted(changed),
            "frozenGitBlobsEmitted": len(emitted),
            "publicLayoutPreimagesRepaired": layout_repairs,
            "claimBoundary": "PUBLIC_MARKDOWN_FORMAT_AND_FROZEN_BYTE_INTEGRITY_ONLY"}


def documentation_jobs(text: str) -> dict[str, str]:
    # Event keys use the same two-space indentation as jobs. Restrict parsing
    # to the jobs mapping so push/pull_request can never become dependencies.
    _, separator, jobs_text = text.partition("\njobs:\n")
    if not separator:
        return {}
    return {match.group(1): match.group(0) for match in re.finditer(
        r"^  ([a-z][a-z0-9-]+):\n.*?(?=^  [a-z][a-z0-9-]+:|\Z)", jobs_text, re.M | re.S
    )}


def project_documentation_workflow(text: str) -> str:
    """Explicit distribution projection; private defaults remain in source."""
    jobs = documentation_jobs(text)
    if set(jobs) != DOCS_DECLARED_JOBS:
        raise ValueError("Unknown or missing Docs job: classify the complete job set before projection")
    for job, block in jobs.items():
        if job in DOCS_PRIVATE_JOBS:
            text = text.replace(block, "")
        elif job in DOCS_PUBLIC_PROFILE_JOBS or job == "canon-summary-evidence-separation":
            if job == "conformance-artifact-consistency":
                block, removed = re.subn(
                    r"(?m)^      - name: Rebuild conformance artifacts\n        run: \|\n          python scripts/run_cvf_cross_extension_conformance.py\n\n?",
                    "", block,
                )
                if removed != 1:
                    raise ValueError("Expected exactly one private conformance execution step")
            projected, count = re.subn(r"(python governance/compat/[^\s]+\.py)(?! --profile)",
                                      r"\1 --profile public", block)
            if count != 1:
                raise ValueError(f"Expected exactly one profile command for {job}")
            if job == "enterprise-evidence-pack":
                projected, count = re.subn(r" --packet docs/reviews/[^\s]+", "", projected)
                if count != 1:
                    raise ValueError("Expected one private enterprise packet argument to remove from public scope")
            text = text.replace(jobs[job], projected)
        elif job == "markdown-lint":
            projected, count = re.subn(
                r"          markdownlint --config \.markdownlintrc .*?--ignore \.git",
                "          python scripts/check_cvf_public_sync_candidate.py --lint-public-markdown --public-root .",
                block, flags=re.S,
            )
            if count != 1:
                raise ValueError("Expected one full Markdown profile invocation")
            text = text.replace(block, projected)
    active = sorted(DOCS_DECLARED_JOBS - set(DOCS_PRIVATE_JOBS) - {"status-check"})
    text, count = re.subn(r"(?m)^    needs: \[.*\]$", "    needs: [" + ", ".join(active) + "]", text)
    if count != 1:
        raise ValueError("Expected one complete status needs list")
    declarations = "".join(f"# CVF_DOCS_PRIVATE_ONLY {job}: {reason}\n" for job, reason in sorted(DOCS_PRIVATE_JOBS.items()))
    return declarations + text


def documentation_projection_violations(text: str) -> list[dict[str, str]]:
    violations = []
    jobs = documentation_jobs(text)
    expected = DOCS_DECLARED_JOBS - set(DOCS_PRIVATE_JOBS)
    if set(jobs) != expected:
        violations.append({"code": "DOCS_JOB_CLASSIFICATION_MISMATCH", "detail": f"missing={sorted(expected-set(jobs))}; extra={sorted(set(jobs)-expected)}"})
    for job, reason in DOCS_PRIVATE_JOBS.items():
        if f"# CVF_DOCS_PRIVATE_ONLY {job}: {reason}\n" not in text:
            violations.append({"code": "DOCS_PRIVATE_DISPOSITION_MISSING", "detail": job})
    for job in DOCS_PUBLIC_PROFILE_JOBS | {"canon-summary-evidence-separation"}:
        if job in jobs and " --profile public" not in jobs[job]:
            violations.append({"code": "DOCS_PUBLIC_PROFILE_MISSING", "detail": job})
    if "--packet" in jobs.get("enterprise-evidence-pack", ""):
        violations.append({"code": "DOCS_PUBLIC_PRIVATE_PACKET", "detail": "Public normative validation must not claim private packet readiness"})
    if "scripts/run_cvf_cross_extension_conformance.py" in jobs.get("conformance-artifact-consistency", ""):
        violations.append({"code": "DOCS_PUBLIC_PRIVATE_CONFORMANCE_RUNNER", "detail": "Public registry schema validation must not execute private conformance proof"})
    match = re.search(r"(?m)^    needs: \[([^\]]*)\]$", jobs.get("status-check", ""))
    dependencies = {value.strip() for value in match.group(1).split(",")} if match else set()
    if dependencies != expected - {"status-check"}:
        violations.append({"code": "DOCS_STATUS_COVERAGE_MISMATCH", "detail": "Status must depend on every applicable job"})
    if "toJSON(needs)" not in jobs.get("status-check", "") or "sys.exit" not in jobs.get("status-check", ""):
        violations.append({"code": "DOCS_STATUS_NOT_ENFORCING", "detail": "Result aggregation must fail closed"})
    if "--lint-public-markdown" not in jobs.get("markdown-lint", ""):
        violations.append({"code": "DOCS_STYLE_PROFILE_MISSING", "detail": "Public Markdown must retain class and byte-integrity checks"})
    return violations


def project_root_classification(source_root: Path, public_root: Path) -> None:
    """Project declared distribution roots, retaining their source classes."""
    public_roots = {
        ".github", ".githooks", "ECOSYSTEM", "EXTENSIONS",
        "docs", "governance", "scripts", "tools", "v1.0", "v1.1", "workspace_templates",
    }
    rel = "governance/compat/CVF_ROOT_FOLDER_LIFECYCLE_REGISTRY.json"
    data = json.loads((source_root / rel).read_text(encoding="utf-8"))
    entries = {entry["path"]: entry for entry in data["roots"]}
    # A mapped hook or workspace template is a public packaging surface;
    # all product source roots retain their original lifecycle/exposure class.
    for name in (".githooks", "workspace_templates"):
        entries.setdefault(name, {"path": name, "lifecycleClass": "ACTIVE_CANONICAL", "exposureClass": "PUBLIC_DOCS_ONLY"})
    missing = public_roots - set(entries)
    if missing:
        raise ValueError(f"Public roots lack source classification: {sorted(missing)}")
    data["roots"] = [entries[name] for name in sorted(public_roots)]
    data["projectionBoundary"] = "Public distribution roots only; private source registry remains authoritative for provenance. Classification alone does not authorize publication."
    (public_root / rel).write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def write_public_change_evidence(public_root: Path, source_commit: str) -> None:
    """Bind the complete projected pending delta before preflight/staging."""
    if not re.fullmatch(r"[0-9a-f]{40}", source_commit):
        raise ValueError("sourceCommit must be a full source commit SHA")
    manifest = public_root / "docs/EXPORT_MANIFEST.md"
    text = manifest.read_text(encoding="utf-8")
    if "## Public Change Evidence\n" not in text:
        raise ValueError("The public change summary must be authored before projection")
    evidence = {
        "schemaVersion": "cvf.publicChangeEvidence.v1",
        "publicBase": resolve_commit(public_root, "HEAD", "public base"),
        "sourceCommit": source_commit,
        "changedPaths": [path for path in pending_paths(public_root) if path != "docs/EXPORT_MANIFEST.md"],
        "claimBoundary": "PUBLIC_CHANGE_TRACEABILITY_NOT_PRIVATE_CLOSURE",
    }
    block = "```public-change-evidence-json\n" + json.dumps(evidence, separators=(",", ":")) + "\n```"
    pattern = r"```public-change-evidence-json\n.*?\n```"
    before, heading, after = text.partition("## Public Change Evidence\n")
    section, next_heading, remainder = after.partition("\n## ")
    if re.search(pattern, section, re.S):
        section = re.sub(pattern, lambda _: block, section, flags=re.S)
    else:
        section = section.rstrip() + "\n\n" + block + "\n"
    text = before + heading + section + next_heading + remainder
    manifest.write_text(text, encoding="utf-8")


def project_system_chain(source_root: Path, public_root: Path) -> None:
    """Project reviewed private pins into source-only public fingerprints."""
    from check_system_chain_map_freshness import PRIVATE_INVOCATION_PATHS, TOP_LEVEL_FINGERPRINT_KEYS
    relative = "docs/reference/system_chain/CVF_SYSTEM_CHAIN_MAP.json"
    data = json.loads((source_root / relative).read_text(encoding="utf-8"))
    fingerprints = [fp for lane in data["lanes"] for fp in lane["sourceFingerprints"]]
    fingerprints.extend(data[key] for key in TOP_LEVEL_FINGERPRINT_KEYS)
    for fp in fingerprints:
        source = source_root / fp["path"]
        if not source.is_file() or hashlib.sha256(source.read_bytes()).hexdigest() != fp["sha256"]:
            raise ValueError(f"Unreviewed private source drift prevents map projection: {fp['path']}")
        projected = public_root / fp["path"]
        fp["provenanceSha256"] = fp["sha256"]
        if projected.is_file():
            fp["sha256"] = hashlib.sha256(projected.read_bytes().replace(b"\r\n", b"\n")).hexdigest()
            fp["publicDisposition"] = "PUBLIC_SOURCE_ONLY_NOT_INVOCATION_PROOF"
        elif private_binding(fp["path"]) or fp["path"] in PRIVATE_INVOCATION_PATHS:
            fp["publicDisposition"] = "PRIVATE_PROVENANCE_NOT_PUBLIC_PROOF"
        else:
            raise ValueError(f"Required public map source missing: {fp['path']}")
    data["publicProofBoundary"] = "PRIVATE_INVOCATION_NOT_PUBLIC_PROOF"
    for lane in data["lanes"]:
        lane["publicProofDisposition"] = "STATIC_SOURCE_REVIEW_NOT_RUNTIME_PROOF"
        if lane["laneId"] == "RUNTIME_TO_ENFORCEMENT":
            lane["publicInvocationDisposition"] = "PRIVATE_INVOCATION_NOT_PUBLIC_PROOF"
    (public_root / relative).write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    coverage_path = "docs/reference/system_chain/CVF_SYSTEM_CHAIN_LIVE_PROOF_COVERAGE.json"
    coverage = json.loads((source_root / coverage_path).read_text(encoding="utf-8"))
    coverage["publicProofBoundary"] = "Retained private bounded proof descriptions are not public proof; this projection verifies source shape only."
    for item in coverage["useCases"]:
        item["publicProofDisposition"] = "PRIVATE_PROVENANCE_NOT_PUBLIC_PROOF"
    for item in coverage["lanes"]:
        item["publicProofDisposition"] = "STATIC_SOURCE_REVIEW_NOT_RUNTIME_PROOF"
    (public_root / coverage_path).write_text(json.dumps(coverage, indent=2) + "\n", encoding="utf-8")
    workflow = public_root / ".github/workflows/system-chain-map-freshness.yml"
    text = (source_root / ".github/workflows/system-chain-map-freshness.yml").read_text(encoding="utf-8")
    command = "python governance/compat/check_system_chain_map_freshness.py --enforce"
    if text.count(command) != 1:
        raise ValueError("Expected one explicit weekly system-map profile command")
    workflow.write_text(text.replace(command, command.replace(" --enforce", " --profile public --enforce")), encoding="utf-8")


RELATIVE_SPECIFIER = re.compile(
    r"(?:from\s*|import\s*\(\s*|require\s*\(\s*|import\s+)['\"](?P<path>\.{1,2}/[^'\"]+)['\"]"
)
FORBIDDEN_PENDING = (
    re.compile(r"(^|/)\.cvf/(runtime|config)(/|$)", re.IGNORECASE),
    re.compile(r"(^|/)(coverage|test-results|playwright-report)(/|$)", re.IGNORECASE),
    re.compile(r"(^|/)\.next(?:-|/|$)", re.IGNORECASE),
    re.compile(r"\.(?:log|tmp|pyc|tsbuildinfo)$", re.IGNORECASE),
    re.compile(r"\.jsonl$", re.IGNORECASE),
)
SOURCE_EXTENSIONS = (".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs")


def normalize_remote(url: str) -> str:
    return url.strip().rstrip("/").removesuffix(".git").lower()


def git(root: Path, *args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", "-C", str(root), *args],
        text=True,
        encoding="utf-8",
        errors="strict",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )


def pending_paths(root: Path) -> list[str]:
    paths: set[str] = set()
    for args in (("diff", "--name-only", "-z"), ("diff", "--cached", "--name-only", "-z"), ("ls-files", "--others", "--exclude-standard", "-z")):
        result = git(root, *args)
        if result.returncode != 0:
            raise RuntimeError(result.stderr.strip() or f"git {' '.join(args)} failed")
        paths.update(path for path in result.stdout.split("\0") if path)
    return sorted(paths)


def module_exists(source: Path, specifier: str, root: Path, candidate_paths: set[str]) -> bool:
    # Ambient ignored files are not part of the projected candidate.
    source_rel = source.relative_to(root).as_posix()
    return any(
        candidate in candidate_paths and (root / candidate).is_file()
        for candidate in module_candidate_paths(source_rel, specifier)
    )


def resolve_commit(root: Path, ref: str, label: str) -> str:
    result = git(root, "rev-parse", "--verify", "--end-of-options", f"{ref}^{{commit}}")
    if result.returncode != 0:
        raise RuntimeError(f"unable to resolve {label} commit")
    return result.stdout.strip()


def module_candidate_paths(source_rel: str, specifier: str) -> list[str]:
    base = posixpath.normpath(posixpath.join(posixpath.dirname(source_rel), specifier))
    candidates = [base, *(f"{base}{ext}" for ext in SOURCE_EXTENSIONS)]
    candidates.extend(f"{base}/index{ext}" for ext in SOURCE_EXTENSIONS)
    suffix = Path(base).suffix
    if suffix in {".js", ".jsx", ".mjs", ".cjs"}:
        stem = base[: -len(suffix)]
        candidates.extend(f"{stem}{ext}" for ext in (".ts", ".tsx"))
    return candidates


def baseline_already_missing(root: Path, baseline_ref: str, source_rel: str, specifier: str) -> bool:
    old_source = git(root, "show", f"{baseline_ref}:{source_rel}")
    if old_source.returncode != 0:
        return False
    old_specifiers = {match.group("path") for match in RELATIVE_SPECIFIER.finditer(old_source.stdout)}
    if specifier not in old_specifiers:
        return False
    return not any(
        git(root, "cat-file", "-e", f"{baseline_ref}:{candidate}").returncode == 0
        for candidate in module_candidate_paths(source_rel, specifier)
    )


def diff_hygiene_detail(root: Path, output: str) -> str:
    """Keep Git hygiene strict while recognizing Markdown prose hard breaks."""
    remaining = []
    lines = output.splitlines()
    index = 0
    while index < len(lines):
        header = lines[index]
        match = re.fullmatch(r"(.+\.md):(\d+): trailing whitespace\.", header)
        allowed = False
        if match and index + 1 < len(lines) and lines[index + 1].startswith("+"):
            added = lines[index + 1][1:]
            target = root / match.group(1)
            body = target.read_text(encoding="utf-8").splitlines() if target.is_file() else []
            line_number = int(match.group(2))
            fence = None
            for line in body[:line_number - 1]:
                token = re.match(r"^ {0,3}(`{3,}|~{3,})", line)
                if token:
                    value = token.group(1)
                    if fence is None:
                        fence = value
                    elif value[0] == fence[0] and len(value) >= len(fence):
                        fence = None
            allowed = (0 < line_number <= len(body) and body[line_number - 1] == added
                       and added.endswith("  ") and not added.endswith("   ")
                       and added.rstrip(" ") == added[:-2] and added[:-2].strip() != ""
                       and not added.startswith(("    ", "\t")) and fence is None)
        if allowed:
            index += 2
        else:
            remaining.append(header)
            index += 1
    return "\n".join(remaining).strip()


def check(args: argparse.Namespace) -> dict[str, object]:
    root = Path(args.public_root).resolve()
    violations: list[dict[str, str]] = []
    baseline_debt: list[dict[str, str]] = []
    if not (root / ".git").exists():
        violations.append({"code": "NOT_GIT_WORKTREE", "detail": str(root)})
        return {"status": "REJECT", "violations": violations, "pendingPaths": []}

    head_sha = resolve_commit(root, "HEAD", "HEAD")
    baseline_sha = resolve_commit(root, args.baseline_ref, "baseline")

    branch = git(root, "branch", "--show-current").stdout.strip()
    if args.expected_branch and branch != args.expected_branch:
        violations.append({"code": "WRONG_BRANCH", "detail": f"expected {args.expected_branch}; found {branch or 'detached'}"})

    remote = git(root, "remote", "get-url", "origin")
    if remote.returncode != 0 or normalize_remote(remote.stdout) != normalize_remote(args.expected_remote):
        violations.append({"code": "WRONG_REMOTE", "detail": remote.stdout.strip() or remote.stderr.strip()})

    pending = pending_paths(root)
    style_config = root / ".markdownlintrc"
    try:
        style = json.loads(style_config.read_text(encoding="utf-8"))
        if not isinstance(style, dict) or style.get("default") is not True or any(style.get(rule) is False for rule in ("MD034", "MD051", "MD055", "MD056")):
            raise ValueError("Required table/link style checks cannot be disabled")
    except (OSError, ValueError) as exc:
        violations.append({"code": "PUBLIC_STYLE_CONFIG_INVALID", "detail": str(exc)})
    documentation_workflow = root / ".github/workflows/documentation-testing.yml"
    try:
        require_public_projection(root)
    except ValueError as exc:
        violations.append({"code": "PUBLIC_CARRIER_INVALID", "detail": str(exc)})
    if documentation_workflow.exists():
        violations.extend(documentation_projection_violations(documentation_workflow.read_text(encoding="utf-8")))
    else:
        violations.append({"code": "DOCS_WORKFLOW_MISSING", "detail": "Public CVF core must retain its Docs workflow"})
    weekly = root / ".github/workflows/system-chain-map-freshness.yml"
    weekly_command = "python governance/compat/check_system_chain_map_freshness.py --profile public --enforce"
    if not weekly.is_file() or weekly.read_text(encoding="utf-8").count(weekly_command) != 1:
        violations.append({"code": "PUBLIC_WEEKLY_MAP_PROFILE_INVALID", "detail": "Scheduled public map validation requires its explicit public profile"})
    change_evidence = None
    from check_baseline_update_compat import classify_public_change_evidence
    manifest_path = root / "docs/EXPORT_MANIFEST.md"
    previous = git(root, "show", f"{head_sha}:docs/EXPORT_MANIFEST.md")
    change_evidence = classify_public_change_evidence(
        [], {path: ["M" if (root / path).exists() else "D"] for path in pending},
        manifest_path.read_text(encoding="utf-8").strip() if manifest_path.is_file() else "",
        previous.stdout.strip() if previous.returncode == 0 else "", head_sha,
    )
    if not change_evidence["compliant"]:
        violations.append({"code": "PUBLIC_CHANGE_EVIDENCE_INVALID", "detail": "Public same-delta evidence is missing, unchanged, incomplete, or does not cover the complete candidate"})
    authorized_items = []
    if args.authorized_paths_json:
        authorized_items = json.loads(
            Path(args.authorized_paths_json).read_text(encoding="utf-8-sig")
        )
    if not isinstance(authorized_items, list) or not all(isinstance(item, str) and item.strip() for item in authorized_items):
        raise RuntimeError("authorized paths must be a JSON string array")
    authorized = {item.replace("\\", "/") for item in authorized_items}
    for path in pending:
        if path not in authorized:
            violations.append({"code": "UNOWNED_PENDING_PATH", "detail": path})
        if any(pattern.search(path) for pattern in FORBIDDEN_PENDING):
            violations.append({"code": "GENERATED_OR_RUNTIME_RESIDUE", "detail": path})

    whitespace = git(root, "diff", "--check")
    if whitespace.returncode != 0:
        detail = diff_hygiene_detail(root, whitespace.stdout.rstrip("\r\n"))
        if detail or not whitespace.stdout.strip():
            violations.append({"code": "DIFF_HYGIENE", "detail": detail or whitespace.stderr.strip()})

    tracked = git(root, "ls-files", "-z")
    if tracked.returncode != 0:
        raise RuntimeError(tracked.stderr.strip() or "git ls-files failed")
    candidate_paths = {rel for rel in [*tracked.stdout.split("\0"), *pending] if rel}
    previous_tree = git(root, "ls-tree", "-r", "--name-only", "-z", baseline_sha)
    if previous_tree.returncode:
        raise RuntimeError("Cannot enumerate baseline byte-evidence paths")
    violations.extend(frozen_markdown_violations(root, candidate_paths | set(previous_tree.stdout.split("\0"))))
    violations.extend(markdown_layout_compatibility_violations(root))
    source_paths = sorted(rel for rel in candidate_paths if Path(rel).suffix.lower() in SOURCE_EXTENSIONS)
    source_hashes: dict[str, str] = {}
    for rel in source_paths:
        source = root / rel
        if not source.is_file() or source.suffix.lower() not in SOURCE_EXTENSIONS:
            continue
        raw = source.read_bytes()
        try:
            text = raw.decode("utf-8", errors="strict")
        except UnicodeDecodeError:
            violations.append({"code": "INVALID_SOURCE_ENCODING", "detail": rel})
            continue
        source_hashes[rel] = hashlib.sha256(raw).hexdigest()
        for match in RELATIVE_SPECIFIER.finditer(text):
            specifier = match.group("path")
            if not module_exists(source, specifier, root, candidate_paths):
                finding = {"code": "MISSING_RELATIVE_DEPENDENCY", "detail": f"{rel} -> {specifier}"}
                if baseline_already_missing(root, baseline_sha, rel, specifier):
                    baseline_debt.append(finding)
                else:
                    violations.append(finding)

    if resolve_commit(root, "HEAD", "HEAD") != head_sha:
        raise RuntimeError("HEAD changed during candidate inspection")
    return {
        "status": "PASS" if not violations else "REJECT",
        "pendingPaths": pending,
        "pendingPathCount": len(pending),
        "sourceFilesChecked": len(source_hashes),
        "sourceFilesConsidered": len(source_paths),
        "sourceFileSha256": source_hashes,
        "baselineRef": args.baseline_ref,
        "baselineSha": baseline_sha,
        "headSha": head_sha,
        "publicChangeEvidence": change_evidence,
        "baselineDebt": baseline_debt,
        "baselineDebtCount": len(baseline_debt),
        "violations": violations,
    }


def main() -> int:
    if "--format-public-markdown" in sys.argv or "--lint-public-markdown" in sys.argv:
        markdown_parser = argparse.ArgumentParser(description="Native public Markdown format classes and frozen integrity")
        mode = markdown_parser.add_mutually_exclusive_group(required=True)
        mode.add_argument("--format-public-markdown", action="store_true")
        mode.add_argument("--lint-public-markdown", action="store_true")
        markdown_parser.add_argument("--public-root", required=True)
        markdown_parser.add_argument("--write-report")
        markdown_parser.add_argument("--authorized-paths-json")
        options = markdown_parser.parse_args()
        authorized = None
        if options.authorized_paths_json:
            values = json.loads(Path(options.authorized_paths_json).read_text(encoding="utf-8-sig"))
            if not isinstance(values, list) or not all(isinstance(path, str) for path in values):
                raise ValueError("Pre-format ownership must be a JSON path array")
            authorized = set(values)
        result = run_public_markdown(Path(options.public_root).resolve(), fix=options.format_public_markdown, authorized_paths=authorized)
        if options.write_report:
            Path(options.write_report).write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
        print(json.dumps({key: value for key, value in result.items() if key not in {"changedPaths", "executions"}}, indent=2))
        return 0 if result["status"] == "PASS" else 1
    if "--project-system-chain" in sys.argv:
        system_parser = argparse.ArgumentParser(description="Project reviewed system-chain source pins")
        system_parser.add_argument("--project-system-chain", action="store_true")
        system_parser.add_argument("--source-root", required=True)
        system_parser.add_argument("--public-root", required=True)
        options = system_parser.parse_args()
        project_system_chain(Path(options.source_root), Path(options.public_root))
        return 0
    if "--write-public-change-evidence" in sys.argv:
        evidence_parser = argparse.ArgumentParser(description="Bind the complete pending public delta")
        evidence_parser.add_argument("--write-public-change-evidence", action="store_true")
        evidence_parser.add_argument("--public-root", required=True)
        evidence_parser.add_argument("--source-commit", required=True)
        options = evidence_parser.parse_args()
        write_public_change_evidence(Path(options.public_root), options.source_commit)
        return 0
    if "--project-docs-workflow" in sys.argv:
        projection = argparse.ArgumentParser(description="Project the explicit Docs CI ownership profile")
        projection.add_argument("--project-docs-workflow", required=True)
        projection.add_argument("--output", required=True)
        projection.add_argument("--classification-source")
        projection.add_argument("--classification-target")
        options = projection.parse_args()
        source = Path(options.project_docs_workflow).read_text(encoding="utf-8")
        Path(options.output).write_text(project_documentation_workflow(source), encoding="utf-8")
        if options.classification_source and options.classification_target:
            project_root_classification(Path(options.classification_source), Path(options.classification_target))
        return 0
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--public-root", required=True)
    parser.add_argument("--authorized-paths-json")
    parser.add_argument("--expected-remote", required=True)
    parser.add_argument("--expected-branch")
    parser.add_argument("--baseline-ref", default="HEAD")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    try:
        result = check(args)
    except (OSError, RuntimeError, UnicodeError, json.JSONDecodeError) as exc:
        result = {"status": "ERROR", "violations": [{"code": "PREFLIGHT_ERROR", "detail": str(exc)}]}
    if args.json:
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print(f"CVF public-sync candidate preflight: {result['status']}")
        violations = result.get("violations", [])
        for violation in violations[:100]:
            print(f"- {violation['code']}: {violation['detail']}")
        if len(violations) > 100:
            print(f"- ... {len(violations) - 100} additional violations omitted from console output")
        if result.get("baselineDebtCount"):
            print(f"Baseline dependency debt (non-blocking): {result['baselineDebtCount']}")
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
