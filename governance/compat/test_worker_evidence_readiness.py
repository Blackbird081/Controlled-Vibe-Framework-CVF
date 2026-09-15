#!/usr/bin/env python3
"""Focused unit, integration, and negative tests for
`worker_evidence_readiness.py`.

Uses synthetic minimal fixtures shaped like the parked R4 defect classes
(37/39 mismatch, 41/60 missing-candidate mismatch, partial-as-full claim,
missing hashes, stale digest, current placeholders) per work order
requirement 3 -- never by editing or copying the real parked R4 files.

Rework note (2026-09-14): a Local reviewer probe found the initial pass's
`evaluate_worker_return()` never called a resolver at all (F1), never
reached the structural/path-safety helpers it defined (F2), and could never
successfully parse a reuse-binding field because the field-line regex
cannot match a dotted/slashed key (F3). Every end-to-end fixture below now
sets up a genuinely resolvable source (a `SnapshotResolver`-shaped
directory tree, or a real temporary Git repository for the Git-path proof)
so `evaluate_worker_return()` -- the real top-level entrypoint, not an
isolated helper -- actually exercises source-identity resolution, strict
JSON parsing, path-safety/symlink rejection, and the dedicated reuse-binding
sub-table end to end.
"""

from __future__ import annotations

import hashlib
import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


_COMPAT_DIR = Path(__file__).resolve().parent
_MODULE_PATH = _COMPAT_DIR / "worker_evidence_readiness.py"
_SPEC = importlib.util.spec_from_file_location("worker_evidence_readiness", _MODULE_PATH)
if _SPEC is None or _SPEC.loader is None:
    raise RuntimeError(f"Unable to load module from {_MODULE_PATH}")
wer = importlib.util.module_from_spec(_SPEC)
sys.modules[_SPEC.name] = wer
_SPEC.loader.exec_module(wer)


CONTRACT_WORK_ORDER = f"""# Work Order
{wer.EVIDENCE_READINESS_CONTRACT_TOKEN}
"""

NO_CONTRACT_WORK_ORDER = """# Work Order
No evidence readiness contract here.
"""

# A snapshot pin (used with SnapshotResolver auto-selection): must NOT look
# like a hex Git sha/ref, so `_default_resolver_for` chooses SnapshotResolver.
SNAPSHOT_PIN = "snapshot-2026-09-14"


def _binding_block(
    *,
    audit_path: str,
    audit_sha256: str,
    manifest_path: str,
    rows: list[tuple[str, str, int, str, str]],
    source_root: str = "src",
    source_pin: str = SNAPSHOT_PIN,
    reuse_rows: list[tuple[str, str, str, str]] | None = None,
    extra_fields: str = "",
) -> str:
    """`reuse_rows` entries are 4-tuples: `(path, priorArtifactSha256,
    priorArtifactPath, priorBlobSha256)` -- `priorArtifactPath` is the
    generation-2 reuse-table column (F3 continued) pointing at real,
    independently readable bytes the checker hashes to verify
    `priorArtifactSha256`."""

    lines = [
        wer.EVIDENCE_BINDING_HEADING,
        "",
        f"{wer.BINDING_SCHEMA_FIELD}: {wer.BINDING_SCHEMA_VALUE}",
        f"auditPath: {audit_path}",
        f"auditSha256: {audit_sha256}",
        f"discoveryManifestPath: {manifest_path}",
        f"sourceRoot: {source_root}",
        f"sourcePin: {source_pin}",
        extra_fields,
        "",
        "| path | blobSha256 | lineCount | readSpans | status |",
        "| --- | --- | --- | --- | --- |",
    ]
    for path, blob, line_count, spans, status in rows:
        lines.append(f"| {path} | {blob} | {line_count} | {spans} | {status} |")
    if reuse_rows:
        lines.append("")
        lines.append(wer.REUSE_BINDING_HEADING)
        lines.append("")
        lines.append("| path | priorArtifactSha256 | priorArtifactPath | priorBlobSha256 |")
        lines.append("| --- | --- | --- | --- |")
        for path, prior_artifact, prior_artifact_path, prior_blob in reuse_rows:
            lines.append(f"| {path} | {prior_artifact} | {prior_artifact_path} | {prior_blob} |")
    lines.append("")
    return "\n".join(lines)


class ApplicabilityTests(unittest.TestCase):
    def test_not_applicable_without_contract_token(self) -> None:
        result = wer.evaluate_worker_return(
            return_text="# Return\nno binding block\n",
            work_order_text=NO_CONTRACT_WORK_ORDER,
            repo_root=_COMPAT_DIR,
        )
        self.assertFalse(result.applicable)
        self.assertTrue(result.is_clean)

    def test_applicable_but_missing_binding_heading_fails(self) -> None:
        result = wer.evaluate_worker_return(
            return_text="# Return\nno binding block\n",
            work_order_text=CONTRACT_WORK_ORDER,
            repo_root=_COMPAT_DIR,
        )
        self.assertTrue(result.applicable)
        self.assertFalse(result.is_clean)
        self.assertTrue(any("lacks" in issue.message for issue in result.issues))

    def test_worker_cannot_opt_out_by_tampering_with_return_alone(self) -> None:
        """Applicability comes only from the trusted work order; a return
        that merely omits self-declaring the contract is still caught."""
        return_text = "# Return\nStatus: COMPLETE_PENDING_REVIEW\n"
        result = wer.evaluate_worker_return(
            return_text=return_text,
            work_order_text=CONTRACT_WORK_ORDER,
            repo_root=_COMPAT_DIR,
        )
        self.assertTrue(result.applicable)
        self.assertFalse(result.is_clean)


class PathSafetyTests(unittest.TestCase):
    def test_rejects_traversal(self) -> None:
        with self.assertRaises(wer.EvidenceReadinessError):
            wer.normalize_source_relative_path("../secret.txt")

    def test_rejects_absolute_path(self) -> None:
        with self.assertRaises(wer.EvidenceReadinessError):
            wer.normalize_source_relative_path("/etc/passwd")

    def test_rejects_windows_absolute_path(self) -> None:
        with self.assertRaises(wer.EvidenceReadinessError):
            wer.normalize_source_relative_path("C:/secret.txt")

    def test_normalizes_backslashes(self) -> None:
        self.assertEqual(wer.normalize_source_relative_path("a\\b\\c.ts"), "a/b/c.ts")

    def test_rejects_duplicate_json_keys(self) -> None:
        with self.assertRaises(wer.EvidenceReadinessError):
            wer.parse_strict_json('{"a": 1, "a": 2}', source_label="fixture")

    def test_resolve_contained_path_rejects_traversal(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(wer.EvidenceReadinessError):
                wer.resolve_contained_path(Path(tmp), "../outside.txt")

    def test_resolve_contained_path_accepts_safe_relative_path(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            resolved = wer.resolve_contained_path(root, "a/b.txt")
            self.assertEqual(resolved, root / "a" / "b.txt")

    @unittest.skipUnless(hasattr(Path, "symlink_to"), "symlinks not supported")
    def test_resolve_contained_path_rejects_symlink_escape(self) -> None:
        """F2: a textually safe relative path must still be rejected if a
        path component is a symlink pointing outside the repo root."""
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / "repo"
            outside = Path(tmp) / "outside"
            root.mkdir()
            outside.mkdir()
            (outside / "secret.txt").write_text("top secret", encoding="utf-8")
            link = root / "escape_link"
            try:
                link.symlink_to(outside, target_is_directory=True)
            except OSError:
                self.skipTest("symlink creation not permitted in this environment")
            with self.assertRaises(wer.EvidenceReadinessError):
                wer.resolve_contained_path(root, "escape_link/secret.txt")


class ReadSpanTests(unittest.TestCase):
    def test_parses_multiple_spans(self) -> None:
        self.assertEqual(wer.parse_read_spans("1-10;20-30"), ((1, 10), (20, 30)))

    def test_rejects_malformed_span(self) -> None:
        with self.assertRaises(wer.EvidenceReadinessError):
            wer.parse_read_spans("10-5")

    def test_full_coverage_true_when_spans_union_covers_all_lines(self) -> None:
        row = wer.EvidenceRow(path="a.ts", blob_sha256="x", line_count=10, read_spans=((1, 10),), status="READ")
        self.assertTrue(row.covers_full())

    def test_partial_read_cannot_satisfy_full_claim(self) -> None:
        """Defect class: partial-as-full claim."""
        row = wer.EvidenceRow(path="a.ts", blob_sha256="x", line_count=100, read_spans=((1, 40),), status="READ")
        self.assertFalse(row.covers_full())


class CandidateSetReconciliationTests(unittest.TestCase):
    def test_missing_candidate_is_reported(self) -> None:
        """Defect class: 41/60 missing-candidate mismatch (synthetic small analog)."""
        declared = ("a.ts", "b.ts", "c.ts")
        rows = (
            wer.EvidenceRow(path="a.ts", blob_sha256="1", line_count=1, read_spans=((1, 1),), status="READ"),
            wer.EvidenceRow(path="b.ts", blob_sha256="2", line_count=1, read_spans=((1, 1),), status="READ"),
        )
        issues = wer.reconcile_candidate_set(declared, rows)
        self.assertTrue(any("c.ts" in issue.pointer for issue in issues))

    def test_unknown_row_path_is_reported(self) -> None:
        declared = ("a.ts",)
        rows = (
            wer.EvidenceRow(path="a.ts", blob_sha256="1", line_count=1, read_spans=((1, 1),), status="READ"),
            wer.EvidenceRow(path="ghost.ts", blob_sha256="2", line_count=1, read_spans=((1, 1),), status="READ"),
        )
        issues = wer.reconcile_candidate_set(declared, rows)
        self.assertTrue(any("ghost.ts" in issue.pointer for issue in issues))

    def test_duplicate_row_path_is_reported(self) -> None:
        declared = ("a.ts",)
        rows = (
            wer.EvidenceRow(path="a.ts", blob_sha256="1", line_count=1, read_spans=((1, 1),), status="READ"),
            wer.EvidenceRow(path="a.ts", blob_sha256="1", line_count=1, read_spans=((1, 1),), status="READ"),
        )
        issues = wer.reconcile_candidate_set(declared, rows)
        self.assertTrue(any("duplicate" in issue.message for issue in issues))

    def test_exact_partition_is_clean(self) -> None:
        declared = ("a.ts", "b.ts")
        rows = (
            wer.EvidenceRow(path="a.ts", blob_sha256="1", line_count=1, read_spans=((1, 1),), status="READ"),
            wer.EvidenceRow(path="b.ts", blob_sha256="2", line_count=0, read_spans=(), status="EXCLUDED"),
        )
        issues = wer.reconcile_candidate_set(declared, rows)
        self.assertEqual(issues, [])


class DigestBindingTests(unittest.TestCase):
    def test_matching_digest_is_clean(self) -> None:
        audit_bytes = b'{"schemaVersion": "x"}'
        digest = hashlib.sha256(audit_bytes).hexdigest()
        issues = wer.validate_digest_binding({"auditSha256": digest}, audit_bytes)
        self.assertEqual(issues, [])

    def test_stale_digest_is_reported(self) -> None:
        """Defect class: stale digest."""
        audit_bytes = b'{"schemaVersion": "x"}'
        stale = hashlib.sha256(b"different bytes").hexdigest()
        issues = wer.validate_digest_binding({"auditSha256": stale}, audit_bytes)
        self.assertTrue(any("stale digest" in issue.message for issue in issues))

    def test_missing_audit_digest_field_is_reported(self) -> None:
        """Defect class: missing hashes."""
        issues = wer.validate_digest_binding({}, b"anything")
        self.assertTrue(any("missing audit digest" in issue.message for issue in issues))

    def test_unreadable_audit_bytes_is_reported(self) -> None:
        issues = wer.validate_digest_binding({"auditSha256": "abc"}, None)
        self.assertTrue(any("could not be read" in issue.message for issue in issues))


class AuditJsonStructureTests(unittest.TestCase):
    """F2: parse_strict_json must actually be reached for the bound audit
    artifact, not merely hashed as opaque bytes."""

    def test_non_json_audit_is_reported(self) -> None:
        issues = wer.validate_audit_json_structure({"auditPath": "a.json"}, b"not json at all", ())
        self.assertTrue(any("not valid JSON" in issue.message for issue in issues))

    def test_duplicate_key_json_audit_is_reported(self) -> None:
        issues = wer.validate_audit_json_structure(
            {"auditPath": "a.json"}, b'{"a": 1, "a": 2}', ()
        )
        self.assertTrue(any("duplicate JSON key" in issue.message for issue in issues))

    def test_valid_json_audit_is_clean(self) -> None:
        issues = wer.validate_audit_json_structure(
            {"auditPath": "a.json"}, b'{"schemaVersion": "cvf.evidenceAudit.v1"}', ()
        )
        self.assertEqual(issues, [])

    def test_mismatched_structural_count_is_reported(self) -> None:
        rows = (wer.EvidenceRow(path="a.ts", blob_sha256="1", line_count=1, read_spans=((1, 1),), status="READ"),)
        issues = wer.validate_audit_json_structure(
            {"auditPath": "a.json"}, b'{"totalCount": 99}', rows
        )
        self.assertTrue(any("count does not match" in issue.message for issue in issues))


class CurrentPlaceholderTests(unittest.TestCase):
    def test_current_placeholder_in_binding_field_is_reported(self) -> None:
        """Defect class: current placeholders (readiness claim left unfilled)."""
        issues = wer.validate_no_current_placeholders({"auditPath": "TO_FILL"}, ())
        self.assertTrue(any("placeholder" in issue.message for issue in issues))

    def test_historical_prose_elsewhere_does_not_trip_the_scan(self) -> None:
        """Historical fail/fix entries recorded as prose must stay valid; the
        scan is bounded to structured binding fields/rows only."""
        result = wer.evaluate_worker_return(
            return_text=(
                "# Return\n"
                "Historical note: a prior audit used WORKER_MUST_CAPTURE_AT_START "
                "as a documented example of a fixed defect class.\n"
                + _binding_block(
                    audit_path="docs/audits/fixture_audit.json",
                    audit_sha256="0" * 64,
                    manifest_path="does/not/exist/manifest.txt",
                    rows=[],
                )
            ),
            work_order_text=CONTRACT_WORK_ORDER,
            repo_root=_COMPAT_DIR,
        )
        self.assertTrue(result.applicable)
        self.assertFalse(
            any("Historical note" in issue.render() for issue in result.issues)
        )


class ReuseBindingParsingTests(unittest.TestCase):
    """F3: the dedicated `### Reuse Bindings` sub-table must round-trip a
    dotted/slashed row path, unlike the previous scalar field-line scheme
    whose regex could never match such a key."""

    def test_parse_reuse_rows_round_trips_dotted_slashed_path(self) -> None:
        section = (
            wer.EVIDENCE_BINDING_HEADING
            + "\n\n"
            + wer.REUSE_BINDING_HEADING
            + "\n\n"
            "| path | priorArtifactSha256 | priorArtifactPath | priorBlobSha256 |\n"
            "| --- | --- | --- | --- |\n"
            "| src/a.ts | " + ("a" * 64) + " | docs/prior.json | " + ("b" * 64) + " |\n"
        )
        parsed = wer.parse_reuse_rows(section)
        self.assertIn("src/a.ts", parsed)
        self.assertEqual(parsed["src/a.ts"]["priorArtifactSha256"], "a" * 64)
        self.assertEqual(parsed["src/a.ts"]["priorArtifactPath"], "docs/prior.json")
        self.assertEqual(parsed["src/a.ts"]["priorBlobSha256"], "b" * 64)

    def test_old_dotted_field_line_key_never_matched_the_field_parser(self) -> None:
        """Counter-evidence for the reviewer's exact F3 probe claim: the old
        `_FIELD_LINE_RE`-based scheme's key grammar cannot match a dotted or
        slashed key at all, confirmed directly against the (still-present,
        unrelated) generic field-line parser."""
        text = "reuse.src/a.ts.priorArtifactSha256: " + ("a" * 64) + "\n"
        fields = wer.parse_binding_fields(wer.EVIDENCE_BINDING_HEADING + "\n\n" + text)
        self.assertNotIn("reuse.src/a.ts.priorArtifactSha256", fields)

    def test_reuse_subtable_rows_are_excluded_from_main_row_table(self) -> None:
        section = _binding_block(
            audit_path="a.json",
            audit_sha256="0" * 64,
            manifest_path="m.txt",
            rows=[("a.ts", "blobA", 1, "1-1", "REUSED")],
            reuse_rows=[("a.ts", "c" * 64, "docs/prior.json", "blobA")],
        )
        raw_rows = wer.parse_binding_rows(section)
        self.assertEqual(len(raw_rows), 1)
        self.assertEqual(raw_rows[0]["path"], "a.ts")


class ReuseBindingValidationTests(unittest.TestCase):
    def test_reuse_without_prior_digest_is_reported(self) -> None:
        rows = (wer.EvidenceRow(path="a.ts", blob_sha256="1", line_count=1, read_spans=(), status="REUSED"),)
        issues = wer.validate_reuse_bindings(rows, {}, current_audit_sha256="x")
        self.assertTrue(any("lacks a reuse-source" in issue.message for issue in issues))

    def test_reuse_self_hash_cycle_is_reported(self) -> None:
        rows = (wer.EvidenceRow(path="a.ts", blob_sha256="1", line_count=1, read_spans=(), status="REUSED"),)
        issues = wer.validate_reuse_bindings(
            rows, {"a.ts": {"priorArtifactSha256": "same", "priorBlobSha256": "1"}}, current_audit_sha256="same"
        )
        self.assertTrue(any("self-hash cycle" in issue.message for issue in issues))

    def test_reuse_invalidated_by_changed_source_identity(self) -> None:
        rows = (wer.EvidenceRow(path="a.ts", blob_sha256="NEW", line_count=1, read_spans=(), status="REUSED"),)
        issues = wer.validate_reuse_bindings(
            rows, {"a.ts": {"priorArtifactSha256": "prior", "priorBlobSha256": "OLD"}}, current_audit_sha256="current"
        )
        self.assertTrue(any("source identity changed" in issue.message for issue in issues))

    def test_reuse_missing_prior_artifact_path_is_reported(self) -> None:
        """F3 continued: a reuse binding with no priorArtifactPath locator at
        all is itself an issue -- a bare digest is not independently
        verifiable against real bytes."""
        rows = (wer.EvidenceRow(path="a.ts", blob_sha256="1", line_count=1, read_spans=(), status="REUSED"),)
        issues = wer.validate_reuse_bindings(
            rows,
            {"a.ts": {"priorArtifactSha256": "a" * 64, "priorBlobSha256": "1"}},
            current_audit_sha256="x",
        )
        self.assertTrue(any("priorArtifactPath" in issue.pointer for issue in issues))

    def test_reuse_prior_artifact_digest_verified_against_real_bytes(self) -> None:
        """F3 continued: with a repo_root and a resolvable priorArtifactPath,
        a priorArtifactSha256 that matches the real bytes at that path is
        clean; a fabricated one that does not match the real bytes is
        rejected, even though the reuse chain is otherwise internally
        self-consistent (worker-declared strings all agree with each
        other)."""
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            prior_path = root / "docs" / "prior_audit.json"
            prior_path.parent.mkdir(parents=True)
            prior_bytes = _binding_block(audit_path="prior.json", audit_sha256="a" * 64, manifest_path="manifest.txt", rows=[("a.ts", "1", 1, "1-1", "READ")]).encode("utf-8")
            prior_path.write_bytes(prior_bytes)
            real_digest = hashlib.sha256(prior_bytes).hexdigest()

            rows = (wer.EvidenceRow(path="a.ts", blob_sha256="1", line_count=1, read_spans=(), status="REUSED"),)

            clean_issues = wer.validate_reuse_bindings(
                rows,
                {
                    "a.ts": {
                        "priorArtifactSha256": real_digest,
                        "priorArtifactPath": "docs/prior_audit.json",
                        "priorBlobSha256": "1",
                    }
                },
                current_audit_sha256="current",
                repo_root=root,
            )
            self.assertEqual(clean_issues, [])

            fabricated_digest = "f" * 64
            rejected_issues = wer.validate_reuse_bindings(
                rows,
                {
                    "a.ts": {
                        "priorArtifactSha256": fabricated_digest,
                        "priorArtifactPath": "docs/prior_audit.json",
                        "priorBlobSha256": "1",
                    }
                },
                current_audit_sha256="current",
                repo_root=root,
            )
            self.assertTrue(
                any(
                    "does not match the real bytes" in issue.message
                    for issue in rejected_issues
                )
            )

    def test_reuse_fabricated_self_consistent_chain_with_no_real_artifact_is_rejected(self) -> None:
        """F3 continued, entrypoint-adjacent unit proof: a fully
        self-consistent fabricated chain (matching blobSha256,
        matching priorBlobSha256, a distinct priorArtifactSha256) that does
        NOT correspond to any real prior artifact bytes must be rejected,
        not pass because the worker-declared strings agree with each other."""
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            rows = (wer.EvidenceRow(path="a.ts", blob_sha256="realblob", line_count=1, read_spans=(), status="REUSED"),)
            issues = wer.validate_reuse_bindings(
                rows,
                {
                    "a.ts": {
                        "priorArtifactSha256": "a" * 64,
                        "priorArtifactPath": "docs/never_written.json",
                        "priorBlobSha256": "realblob",
                    }
                },
                current_audit_sha256="different-from-prior",
                repo_root=root,
            )
            self.assertTrue(
                any(
                    "does not resolve to a real, readable prior artifact" in issue.message
                    for issue in issues
                )
            )


class SourceIdentityResolutionTests(unittest.TestCase):
    """F1: validate_source_identity must actually be reachable and must
    reject a fabricated/unresolvable source, using both resolver kinds
    directly (unit-level; the entrypoint-level proof lives in
    EndToEndFixtureTests below)."""

    def test_snapshot_resolver_reads_real_file_digest(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            snap = root / "src" / SNAPSHOT_PIN
            snap.mkdir(parents=True)
            data = b"hello world\n"
            (snap / "a.ts").write_bytes(data)
            resolver = wer.SnapshotResolver(repo_root=root)
            resolved = resolver.resolve_blob_shas("src", SNAPSHOT_PIN, ("a.ts",))
            self.assertEqual(resolved["a.ts"], hashlib.sha256(data).hexdigest())

    def test_snapshot_resolver_returns_none_for_missing_file(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "src" / SNAPSHOT_PIN).mkdir(parents=True)
            resolver = wer.SnapshotResolver(repo_root=root)
            resolved = resolver.resolve_blob_shas("src", SNAPSHOT_PIN, ("nope.ts",))
            self.assertIsNone(resolved["nope.ts"])

    def test_validate_source_identity_rejects_unresolvable_row(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "src" / SNAPSHOT_PIN).mkdir(parents=True)
            resolver = wer.SnapshotResolver(repo_root=root)
            rows = (
                wer.EvidenceRow(path="ghost.ts", blob_sha256="deadbeef", line_count=1, read_spans=((1, 1),), status="READ"),
            )
            issues = wer.validate_source_identity(rows, source_root="src", source_pin=SNAPSHOT_PIN, resolver=resolver)
            self.assertTrue(any("could not be resolved" in i.message for i in issues))

    def test_validate_source_identity_rejects_mismatched_digest(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            snap = root / "src" / SNAPSHOT_PIN
            snap.mkdir(parents=True)
            (snap / "a.ts").write_bytes(b"real content\n")
            resolver = wer.SnapshotResolver(repo_root=root)
            rows = (
                wer.EvidenceRow(path="a.ts", blob_sha256="f" * 64, line_count=1, read_spans=((1, 1),), status="READ"),
            )
            issues = wer.validate_source_identity(rows, source_root="src", source_pin=SNAPSHOT_PIN, resolver=resolver)
            self.assertTrue(any("does not match the resolved source identity" in i.message for i in issues))

    def test_validate_source_identity_accepts_matching_digest(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            snap = root / "src" / SNAPSHOT_PIN
            snap.mkdir(parents=True)
            data = b"real content\n"
            (snap / "a.ts").write_bytes(data)
            resolver = wer.SnapshotResolver(repo_root=root)
            rows = (
                wer.EvidenceRow(
                    path="a.ts",
                    blob_sha256=hashlib.sha256(data).hexdigest(),
                    line_count=1,
                    read_spans=((1, 1),),
                    status="READ",
                ),
            )
            issues = wer.validate_source_identity(rows, source_root="src", source_pin=SNAPSHOT_PIN, resolver=resolver)
            self.assertEqual(issues, [])

    def test_snapshot_resolver_line_count_matches_correct_declaration(self) -> None:
        """F1 continued (generation 2): a row with correct blobSha256 AND a
        correct lineCount is clean."""
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            snap = root / "src" / SNAPSHOT_PIN
            snap.mkdir(parents=True)
            data = b"line1\nline2\nline3\n"  # 3 lines
            (snap / "a.ts").write_bytes(data)
            resolver = wer.SnapshotResolver(repo_root=root)
            rows = (
                wer.EvidenceRow(
                    path="a.ts",
                    blob_sha256=hashlib.sha256(data).hexdigest(),
                    line_count=3,
                    read_spans=((1, 3),),
                    status="READ",
                ),
            )
            issues = wer.validate_source_identity(rows, source_root="src", source_pin=SNAPSHOT_PIN, resolver=resolver)
            self.assertEqual(issues, [])

    def test_snapshot_resolver_rejects_fabricated_line_count_with_correct_blob(self) -> None:
        """F1 continued (generation 2): a row can declare a correct
        blobSha256 (proving only the bytes match) but a fabricated
        lineCount; this must now be caught, not silently accepted."""
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            snap = root / "src" / SNAPSHOT_PIN
            snap.mkdir(parents=True)
            data = b"line1\nline2\nline3\n"  # really 3 lines
            (snap / "a.ts").write_bytes(data)
            resolver = wer.SnapshotResolver(repo_root=root)
            rows = (
                wer.EvidenceRow(
                    path="a.ts",
                    blob_sha256=hashlib.sha256(data).hexdigest(),  # correct
                    line_count=999,  # fabricated
                    read_spans=((1, 3),),
                    status="READ",
                ),
            )
            issues = wer.validate_source_identity(rows, source_root="src", source_pin=SNAPSHOT_PIN, resolver=resolver)
            self.assertTrue(
                any(
                    i.pointer == "/rows/a.ts/lineCount"
                    and "does not match the resolved source's actual line count" in i.message
                    for i in issues
                )
            )


class EndToEndFixtureTests(unittest.TestCase):
    """End-to-end evaluate_worker_return() over synthetic minimal fixtures
    reproducing the named R4-shaped defect classes on disk, never by
    touching the real parked R4 files. Every fixture here sets up a real,
    resolvable source snapshot under `src/<pin>/...` so
    `evaluate_worker_return()` actually reaches source-identity resolution
    (F1), not merely internal-consistency checks."""

    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.repo_root = Path(self._tmp.name)

    def tearDown(self) -> None:
        self._tmp.cleanup()

    def _write(self, rel_path: str, content: str | bytes) -> Path:
        full = self.repo_root / rel_path
        full.parent.mkdir(parents=True, exist_ok=True)
        if isinstance(content, bytes):
            full.write_bytes(content)
        else:
            full.write_text(content, encoding="utf-8")
        return full

    def _write_source(self, rel_path_under_snapshot: str, content: bytes) -> str:
        """Write a real file under `src/<SNAPSHOT_PIN>/...` and return its
        sha256 hex digest, for use as a row's `blobSha256`."""
        full = self.repo_root / "src" / SNAPSHOT_PIN / rel_path_under_snapshot
        full.parent.mkdir(parents=True, exist_ok=True)
        full.write_bytes(content)
        return hashlib.sha256(content).hexdigest()

    def test_clean_fixture_is_clean(self) -> None:
        audit_bytes = json.dumps({"schemaVersion": "cvf.evidenceAudit.v1", "totalCount": 2}).encode("utf-8")
        self._write("docs/audits/fixture_audit.json", audit_bytes)
        self._write("docs/manifests/fixture_manifest.txt", "a.ts\nb.ts\n")
        digest_a = self._write_source("a.ts", b"1234567890\n" * 10)  # 10 lines
        digest_b = self._write_source("b.ts", b"12345\n" * 5)  # 5 lines
        digest = hashlib.sha256(audit_bytes).hexdigest()
        return_text = "# Return\n" + _binding_block(
            audit_path="docs/audits/fixture_audit.json",
            audit_sha256=digest,
            manifest_path="docs/manifests/fixture_manifest.txt",
            rows=[
                ("a.ts", digest_a, 10, "1-10", "READ"),
                ("b.ts", digest_b, 5, "1-5", "READ"),
            ],
        )
        result = wer.evaluate_worker_return(
            return_text=return_text, work_order_text=CONTRACT_WORK_ORDER, repo_root=self.repo_root
        )
        self.assertTrue(result.applicable)
        self.assertTrue(result.is_clean, result.render_issues())
        self.assertEqual(result.row_count, 2)
        self.assertEqual(result.candidate_count, 2)

    def test_correct_blob_but_fabricated_line_count_is_rejected_via_entrypoint(self) -> None:
        """F1 continued (generation 2) proof via the real entrypoint: a row
        declares a correct blobSha256 (bytes genuinely match) but a
        fabricated lineCount. A correct digest alone must not be enough to
        pass -- this is the exact gap the second reviewer probe found."""
        audit_bytes = json.dumps({"schemaVersion": "cvf.evidenceAudit.v1"}).encode("utf-8")
        self._write("docs/audits/fixture_audit.json", audit_bytes)
        self._write("docs/manifests/fixture_manifest.txt", "a.ts\n")
        digest_a = self._write_source("a.ts", b"1234567890\n" * 10)  # really 10 lines
        digest = hashlib.sha256(audit_bytes).hexdigest()
        return_text = "# Return\n" + _binding_block(
            audit_path="docs/audits/fixture_audit.json",
            audit_sha256=digest,
            manifest_path="docs/manifests/fixture_manifest.txt",
            rows=[("a.ts", digest_a, 999, "1-10", "READ")],  # fabricated lineCount
        )
        result = wer.evaluate_worker_return(
            return_text=return_text, work_order_text=CONTRACT_WORK_ORDER, repo_root=self.repo_root
        )
        self.assertFalse(result.is_clean)
        self.assertTrue(
            any(
                i.pointer == "/rows/a.ts/lineCount"
                and "does not match the resolved source's actual line count" in i.message
                for i in result.issues
            )
        )

    def test_source_pin_na_with_real_blob_rows_is_rejected_via_entrypoint(self) -> None:
        """F1 continued (generation 2) proof: `sourcePin: N/A` with rows that
        have a real blobSha256 and READ status must be rejected -- the
        N/A-escape-hatch gap is closed, not silently exempted from
        verification just because the worker wrote N/A."""
        audit_bytes = json.dumps({"schemaVersion": "cvf.evidenceAudit.v1"}).encode("utf-8")
        self._write("docs/audits/fixture_audit.json", audit_bytes)
        self._write("docs/manifests/fixture_manifest.txt", "a.ts\n")
        digest = hashlib.sha256(audit_bytes).hexdigest()
        return_text = "# Return\n" + _binding_block(
            audit_path="docs/audits/fixture_audit.json",
            audit_sha256=digest,
            manifest_path="docs/manifests/fixture_manifest.txt",
            source_pin="N/A",
            rows=[("a.ts", "f" * 64, 5, "1-5", "READ")],
        )
        result = wer.evaluate_worker_return(
            return_text=return_text, work_order_text=CONTRACT_WORK_ORDER, repo_root=self.repo_root
        )
        self.assertFalse(result.is_clean)
        self.assertTrue(
            any(
                i.pointer == "/binding/sourcePin"
                and "rows claiming real evidence" in i.message
                for i in result.issues
            )
        )

    def test_source_pin_na_with_no_rows_claiming_evidence_is_clean_via_entrypoint(self) -> None:
        """F1 continued (generation 2) counter-proof: a binding with
        `sourcePin: N/A` and ONLY EXCLUDED rows (no populated blobSha256, no
        READ/REUSED status) is a legitimate skip and must still evaluate
        cleanly -- proves the fix did not just make N/A always an error."""
        audit_bytes = json.dumps({"schemaVersion": "cvf.evidenceAudit.v1"}).encode("utf-8")
        self._write("docs/audits/fixture_audit.json", audit_bytes)
        self._write("docs/manifests/fixture_manifest.txt", "a.ts\n")
        digest = hashlib.sha256(audit_bytes).hexdigest()
        return_text = "# Return\n" + _binding_block(
            audit_path="docs/audits/fixture_audit.json",
            audit_sha256=digest,
            manifest_path="docs/manifests/fixture_manifest.txt",
            source_pin="N/A_WITH_REASON",
            rows=[("a.ts", "", 0, "none", "EXCLUDED")],
        )
        result = wer.evaluate_worker_return(
            return_text=return_text, work_order_text=CONTRACT_WORK_ORDER, repo_root=self.repo_root
        )
        self.assertTrue(result.is_clean, result.render_issues())

    def test_nonexistent_source_path_fabricated_pin_fabricated_digest_is_rejected(self) -> None:
        """F1 proof: a fixture with a nonexistent source path, a fabricated
        pin, and a fabricated digest must now be correctly rejected by
        `evaluate_worker_return()`, the real entrypoint -- this is the exact
        shape the reviewer's probe found passing clean before the fix."""
        audit_bytes = json.dumps({"schemaVersion": "cvf.evidenceAudit.v1"}).encode("utf-8")
        self._write("docs/audits/fixture_audit.json", audit_bytes)
        self._write("docs/manifests/fixture_manifest.txt", "ghost.ts\n")
        digest = hashlib.sha256(audit_bytes).hexdigest()
        return_text = "# Return\n" + _binding_block(
            audit_path="docs/audits/fixture_audit.json",
            audit_sha256=digest,
            manifest_path="docs/manifests/fixture_manifest.txt",
            source_pin="fabricated-pin-does-not-exist",
            rows=[("ghost.ts", "f" * 64, 5, "1-5", "READ")],
        )
        result = wer.evaluate_worker_return(
            return_text=return_text, work_order_text=CONTRACT_WORK_ORDER, repo_root=self.repo_root
        )
        self.assertTrue(result.applicable)
        self.assertFalse(result.is_clean)
        self.assertTrue(any("could not be resolved" in i.message for i in result.issues))

    def test_fabricated_digest_against_real_resolvable_source_is_rejected(self) -> None:
        """F1 proof, second shape: the source path DOES exist and resolves,
        but the declared blobSha256 is fabricated -- must be rejected on
        digest mismatch, not silently accepted."""
        audit_bytes = json.dumps({"schemaVersion": "cvf.evidenceAudit.v1"}).encode("utf-8")
        self._write("docs/audits/fixture_audit.json", audit_bytes)
        self._write("docs/manifests/fixture_manifest.txt", "a.ts\n")
        self._write_source("a.ts", b"real content\n")
        digest = hashlib.sha256(audit_bytes).hexdigest()
        return_text = "# Return\n" + _binding_block(
            audit_path="docs/audits/fixture_audit.json",
            audit_sha256=digest,
            manifest_path="docs/manifests/fixture_manifest.txt",
            rows=[("a.ts", "f" * 64, 1, "1-1", "READ")],
        )
        result = wer.evaluate_worker_return(
            return_text=return_text, work_order_text=CONTRACT_WORK_ORDER, repo_root=self.repo_root
        )
        self.assertFalse(result.is_clean)
        self.assertTrue(any("does not match the resolved source identity" in i.message for i in result.issues))

    def test_reproduces_missing_candidate_mismatch_defect_class(self) -> None:
        """Synthetic analog of the R4 41/60-shaped missing-candidate mismatch:
        declared manifest names more candidates than processing rows cover."""
        audit_bytes = json.dumps({"schemaVersion": "cvf.evidenceAudit.v1"}).encode("utf-8")
        self._write("docs/audits/fixture_audit.json", audit_bytes)
        self._write("docs/manifests/fixture_manifest.txt", "\n".join(f"f{i}.ts" for i in range(1, 6)))
        digest = hashlib.sha256(audit_bytes).hexdigest()
        rows = []
        for i in range(1, 4):  # only 3 of 5
            blob = self._write_source(f"f{i}.ts", f"line{i}\n".encode())
            rows.append((f"f{i}.ts", blob, 1, "1-1", "READ"))
        return_text = "# Return\n" + _binding_block(
            audit_path="docs/audits/fixture_audit.json",
            audit_sha256=digest,
            manifest_path="docs/manifests/fixture_manifest.txt",
            rows=rows,
        )
        result = wer.evaluate_worker_return(
            return_text=return_text, work_order_text=CONTRACT_WORK_ORDER, repo_root=self.repo_root
        )
        self.assertFalse(result.is_clean)
        missing = [i for i in result.issues if "f4.ts" in i.pointer or "f5.ts" in i.pointer]
        self.assertEqual(len(missing), 2)

    def test_reproduces_partial_as_full_defect_class(self) -> None:
        audit_bytes = json.dumps({"schemaVersion": "cvf.evidenceAudit.v1"}).encode("utf-8")
        self._write("docs/audits/fixture_audit.json", audit_bytes)
        self._write("docs/manifests/fixture_manifest.txt", "a.ts\n")
        blob = self._write_source("a.ts", ("x\n" * 100).encode())
        digest = hashlib.sha256(audit_bytes).hexdigest()
        return_text = "# Return\n" + _binding_block(
            audit_path="docs/audits/fixture_audit.json",
            audit_sha256=digest,
            manifest_path="docs/manifests/fixture_manifest.txt",
            rows=[("a.ts", blob, 100, "1-30", "READ")],
        )
        result = wer.evaluate_worker_return(
            return_text=return_text, work_order_text=CONTRACT_WORK_ORDER, repo_root=self.repo_root
        )
        self.assertFalse(result.is_clean)
        self.assertTrue(any("partial read span cannot satisfy" in i.message for i in result.issues))

    def test_reproduces_stale_digest_defect_class(self) -> None:
        audit_bytes = json.dumps({"schemaVersion": "cvf.evidenceAudit.v1"}).encode("utf-8")
        self._write("docs/audits/fixture_audit.json", audit_bytes)
        self._write("docs/manifests/fixture_manifest.txt", "a.ts\n")
        blob = self._write_source("a.ts", b"x\n")
        return_text = "# Return\n" + _binding_block(
            audit_path="docs/audits/fixture_audit.json",
            audit_sha256="f" * 64,
            manifest_path="docs/manifests/fixture_manifest.txt",
            rows=[("a.ts", blob, 1, "1-1", "READ")],
        )
        result = wer.evaluate_worker_return(
            return_text=return_text, work_order_text=CONTRACT_WORK_ORDER, repo_root=self.repo_root
        )
        self.assertFalse(result.is_clean)
        self.assertTrue(any("stale digest" in i.message for i in result.issues))

    def test_reproduces_missing_hashes_defect_class(self) -> None:
        self._write("docs/audits/fixture_audit.json", b"{}")
        self._write("docs/manifests/fixture_manifest.txt", "a.ts\n")
        return_text = (
            "# Return\n"
            f"{wer.EVIDENCE_BINDING_HEADING}\n\n"
            f"{wer.BINDING_SCHEMA_FIELD}: {wer.BINDING_SCHEMA_VALUE}\n"
            "auditPath: docs/audits/fixture_audit.json\n"
            "discoveryManifestPath: docs/manifests/fixture_manifest.txt\n"
            "sourceRoot: fixture_source\n"
            "sourcePin: 0000000000000000000000000000000000000\n"
        )
        result = wer.evaluate_worker_return(
            return_text=return_text, work_order_text=CONTRACT_WORK_ORDER, repo_root=self.repo_root
        )
        self.assertFalse(result.is_clean)
        self.assertTrue(any("auditSha256" in i.pointer for i in result.issues))

    def test_reproduces_current_placeholder_defect_class(self) -> None:
        audit_bytes = b"{}"
        self._write("docs/audits/fixture_audit.json", audit_bytes)
        self._write("docs/manifests/fixture_manifest.txt", "a.ts\n")
        digest = hashlib.sha256(audit_bytes).hexdigest()
        return_text = "# Return\n" + _binding_block(
            audit_path="docs/audits/fixture_audit.json",
            audit_sha256=digest,
            manifest_path="docs/manifests/fixture_manifest.txt",
            rows=[("a.ts", "TO_FILL", 1, "1-1", "READ")],
        )
        result = wer.evaluate_worker_return(
            return_text=return_text, work_order_text=CONTRACT_WORK_ORDER, repo_root=self.repo_root
        )
        self.assertFalse(result.is_clean)
        self.assertTrue(any("placeholder" in i.message for i in result.issues))

    def test_39_vs_37_style_reconciliation_undercount_defect_class(self) -> None:
        """Synthetic analog of the R4 37/39 mismatch: a reconciliation note
        field claims one total while the actual declared candidate count
        (from the independent discovery manifest) is different; the
        candidate-set reconciliation must key off the manifest, not the
        claimed total, and still catch the two silently-dropped paths."""
        audit_bytes = json.dumps({"schemaVersion": "cvf.evidenceAudit.v1"}).encode("utf-8")
        self._write("docs/audits/fixture_audit.json", audit_bytes)
        # Manifest declares 39 analog-scaled down to 7 for a fast fixture.
        manifest_paths = [f"seed{i}.ts" for i in range(1, 6)] + ["dep1.ts", "dep2.ts"]
        self._write("docs/manifests/fixture_manifest.txt", "\n".join(manifest_paths))
        digest = hashlib.sha256(audit_bytes).hexdigest()
        # Processing rows silently omit dep1.ts and dep2.ts (the "37 not 39" bug).
        rows = []
        for i, p in enumerate(manifest_paths[:5]):
            blob = self._write_source(p, f"line{i}\n".encode())
            rows.append((p, blob, 1, "1-1", "READ"))
        return_text = "# Return\n" + _binding_block(
            audit_path="docs/audits/fixture_audit.json",
            audit_sha256=digest,
            manifest_path="docs/manifests/fixture_manifest.txt",
            rows=rows,
        )
        result = wer.evaluate_worker_return(
            return_text=return_text, work_order_text=CONTRACT_WORK_ORDER, repo_root=self.repo_root
        )
        self.assertFalse(result.is_clean)
        dropped = [i for i in result.issues if "dep1.ts" in i.pointer or "dep2.ts" in i.pointer]
        self.assertEqual(len(dropped), 2)

    def test_non_json_audit_content_rejected_via_entrypoint(self) -> None:
        """F2 proof via the real entrypoint: non-JSON audit content."""
        audit_bytes = b"this is not json {{{"
        self._write("docs/audits/fixture_audit.json", audit_bytes)
        self._write("docs/manifests/fixture_manifest.txt", "a.ts\n")
        blob = self._write_source("a.ts", b"x\n")
        digest = hashlib.sha256(audit_bytes).hexdigest()
        return_text = "# Return\n" + _binding_block(
            audit_path="docs/audits/fixture_audit.json",
            audit_sha256=digest,
            manifest_path="docs/manifests/fixture_manifest.txt",
            rows=[("a.ts", blob, 1, "1-1", "READ")],
        )
        result = wer.evaluate_worker_return(
            return_text=return_text, work_order_text=CONTRACT_WORK_ORDER, repo_root=self.repo_root
        )
        self.assertFalse(result.is_clean)
        self.assertTrue(any("not valid JSON" in i.message for i in result.issues))

    def test_duplicate_key_json_audit_rejected_via_entrypoint(self) -> None:
        """F2 proof via the real entrypoint: duplicate-key JSON audit."""
        audit_bytes = b'{"a": 1, "a": 2}'
        self._write("docs/audits/fixture_audit.json", audit_bytes)
        self._write("docs/manifests/fixture_manifest.txt", "a.ts\n")
        blob = self._write_source("a.ts", b"x\n")
        digest = hashlib.sha256(audit_bytes).hexdigest()
        return_text = "# Return\n" + _binding_block(
            audit_path="docs/audits/fixture_audit.json",
            audit_sha256=digest,
            manifest_path="docs/manifests/fixture_manifest.txt",
            rows=[("a.ts", blob, 1, "1-1", "READ")],
        )
        result = wer.evaluate_worker_return(
            return_text=return_text, work_order_text=CONTRACT_WORK_ORDER, repo_root=self.repo_root
        )
        self.assertFalse(result.is_clean)
        self.assertTrue(any("duplicate JSON key" in i.message for i in result.issues))

    def test_absolute_path_binding_field_rejected_via_entrypoint(self) -> None:
        """F2 proof via the real entrypoint: a binding field itself
        (auditPath) using an absolute path must be rejected, not just
        manifest rows."""
        audit_bytes = b"{}"
        self._write("docs/manifests/fixture_manifest.txt", "a.ts\n")
        digest = hashlib.sha256(audit_bytes).hexdigest()
        return_text = "# Return\n" + _binding_block(
            audit_path="/etc/passwd",
            audit_sha256=digest,
            manifest_path="docs/manifests/fixture_manifest.txt",
            rows=[("a.ts", "f" * 64, 1, "1-1", "READ")],
        )
        result = wer.evaluate_worker_return(
            return_text=return_text, work_order_text=CONTRACT_WORK_ORDER, repo_root=self.repo_root
        )
        self.assertFalse(result.is_clean)
        self.assertTrue(
            any(i.pointer == "/binding/auditPath" and "absolute" in i.message for i in result.issues)
        )

    @unittest.skipUnless(hasattr(Path, "symlink_to"), "symlinks not supported")
    def test_symlink_escape_attempt_rejected_via_entrypoint(self) -> None:
        """F2 proof via the real entrypoint: a discoveryManifestPath routed
        through a symlinked directory component that escapes repo_root."""
        outside = Path(tempfile.mkdtemp())
        try:
            (outside / "manifest.txt").write_text("a.ts\n", encoding="utf-8")
            link = self.repo_root / "escape_link"
            try:
                link.symlink_to(outside, target_is_directory=True)
            except OSError:
                self.skipTest("symlink creation not permitted in this environment")
            audit_bytes = b"{}"
            self._write("docs/audits/fixture_audit.json", audit_bytes)
            digest = hashlib.sha256(audit_bytes).hexdigest()
            return_text = "# Return\n" + _binding_block(
                audit_path="docs/audits/fixture_audit.json",
                audit_sha256=digest,
                manifest_path="escape_link/manifest.txt",
                rows=[("a.ts", "f" * 64, 1, "1-1", "READ")],
            )
            result = wer.evaluate_worker_return(
                return_text=return_text, work_order_text=CONTRACT_WORK_ORDER, repo_root=self.repo_root
            )
            self.assertFalse(result.is_clean)
            self.assertTrue(
                any("symlink" in i.message or "escapes" in i.message for i in result.issues)
            )
        finally:
            import shutil

            shutil.rmtree(outside, ignore_errors=True)

    def test_valid_reuse_binding_passes_via_entrypoint(self) -> None:
        """F3 proof, part (a): a valid REUSED row with a correct, resolvable
        prior-artifact binding passes through evaluate_worker_return() (the
        real entrypoint) with no reuse-related issue. Generation 2: the row's
        own current source (blobSha256) is now also resolved (like a READ
        row), and priorArtifactSha256 is checked against real bytes at
        priorArtifactPath -- both must be genuine for a clean result."""
        audit_bytes = json.dumps({"schemaVersion": "cvf.evidenceAudit.v1"}).encode("utf-8")
        self._write("docs/audits/fixture_audit.json", audit_bytes)
        self._write("docs/manifests/fixture_manifest.txt", "a.ts\n")
        blob = self._write_source("a.ts", b"reused content\n")
        digest = hashlib.sha256(audit_bytes).hexdigest()
        prior_bytes = _binding_block(audit_path="prior.json", audit_sha256="a" * 64, manifest_path="manifest.txt", rows=[("a.ts", blob, 1, "1-1", "READ")]).encode("utf-8")
        self._write("docs/audits/prior_audit.json", prior_bytes)
        prior_artifact_digest = hashlib.sha256(prior_bytes).hexdigest()
        return_text = "# Return\n" + _binding_block(
            audit_path="docs/audits/fixture_audit.json",
            audit_sha256=digest,
            manifest_path="docs/manifests/fixture_manifest.txt",
            rows=[("a.ts", blob, 1, "1-1", "REUSED")],
            reuse_rows=[("a.ts", prior_artifact_digest, "docs/audits/prior_audit.json", blob)],
        )
        result = wer.evaluate_worker_return(
            return_text=return_text, work_order_text=CONTRACT_WORK_ORDER, repo_root=self.repo_root
        )
        self.assertTrue(result.is_clean, result.render_issues())

    def test_reused_row_with_fabricated_current_blob_rejected_via_entrypoint(self) -> None:
        """F3 continued proof: a REUSED row's own claimed current source
        (blobSha256) must now be resolved against the real resolver exactly
        like a READ row -- a fabricated/mismatched blobSha256 on a REUSED
        row is caught the same way F1 catches a READ row, even when the
        reuse chain fields are otherwise well-formed."""
        audit_bytes = json.dumps({"schemaVersion": "cvf.evidenceAudit.v1"}).encode("utf-8")
        self._write("docs/audits/fixture_audit.json", audit_bytes)
        self._write("docs/manifests/fixture_manifest.txt", "a.ts\n")
        self._write_source("a.ts", b"reused content\n")
        digest = hashlib.sha256(audit_bytes).hexdigest()
        prior_bytes = b'{"schemaVersion": "prior.v1"}'
        self._write("docs/audits/prior_audit.json", prior_bytes)
        prior_artifact_digest = hashlib.sha256(prior_bytes).hexdigest()
        fabricated_blob = "f" * 64
        return_text = "# Return\n" + _binding_block(
            audit_path="docs/audits/fixture_audit.json",
            audit_sha256=digest,
            manifest_path="docs/manifests/fixture_manifest.txt",
            rows=[("a.ts", fabricated_blob, 1, "1-1", "REUSED")],
            reuse_rows=[("a.ts", prior_artifact_digest, "docs/audits/prior_audit.json", fabricated_blob)],
        )
        result = wer.evaluate_worker_return(
            return_text=return_text, work_order_text=CONTRACT_WORK_ORDER, repo_root=self.repo_root
        )
        self.assertFalse(result.is_clean)
        self.assertTrue(
            any("does not match the resolved source identity" in i.message for i in result.issues)
        )

    def test_mutated_reuse_digest_rejected_via_entrypoint(self) -> None:
        """F3 proof, part (b): mutating the artifact digest after the
        binding was recorded causes evaluate_worker_return() (the real
        entrypoint) to reject the reuse."""
        audit_bytes = json.dumps({"schemaVersion": "cvf.evidenceAudit.v1"}).encode("utf-8")
        self._write("docs/audits/fixture_audit.json", audit_bytes)
        self._write("docs/manifests/fixture_manifest.txt", "a.ts\n")
        blob = self._write_source("a.ts", b"reused content\n")
        digest = hashlib.sha256(audit_bytes).hexdigest()
        prior_bytes = b'{"schemaVersion": "prior.v1"}'
        self._write("docs/audits/prior_audit.json", prior_bytes)
        return_text = "# Return\n" + _binding_block(
            audit_path="docs/audits/fixture_audit.json",
            audit_sha256=digest,
            manifest_path="docs/manifests/fixture_manifest.txt",
            rows=[("a.ts", blob, 1, "1-1", "REUSED")],
            # priorArtifactSha256 mutated to equal the *current* audit
            # digest -- a self-hash cycle, one of the two named mutation
            # shapes the work order calls out.
            reuse_rows=[("a.ts", digest, "docs/audits/prior_audit.json", blob)],
        )
        result = wer.evaluate_worker_return(
            return_text=return_text, work_order_text=CONTRACT_WORK_ORDER, repo_root=self.repo_root
        )
        self.assertFalse(result.is_clean)
        self.assertTrue(any("self-hash cycle" in i.message for i in result.issues))

    def test_mutated_reuse_source_blob_rejected_via_entrypoint(self) -> None:
        """F3 proof, part (b) alternate shape: mutating the source blob
        digest after reuse was recorded (source changed underneath the
        reuse claim) is rejected through the real entrypoint."""
        audit_bytes = json.dumps({"schemaVersion": "cvf.evidenceAudit.v1"}).encode("utf-8")
        self._write("docs/audits/fixture_audit.json", audit_bytes)
        self._write("docs/manifests/fixture_manifest.txt", "a.ts\n")
        blob = self._write_source("a.ts", b"reused content\n")
        digest = hashlib.sha256(audit_bytes).hexdigest()
        prior_bytes = b'{"schemaVersion": "prior.v1"}'
        self._write("docs/audits/prior_audit.json", prior_bytes)
        prior_artifact_digest = hashlib.sha256(prior_bytes).hexdigest()
        stale_prior_blob = "b" * 64  # does not match the row's current blobSha256
        return_text = "# Return\n" + _binding_block(
            audit_path="docs/audits/fixture_audit.json",
            audit_sha256=digest,
            manifest_path="docs/manifests/fixture_manifest.txt",
            rows=[("a.ts", blob, 1, "1-1", "REUSED")],
            reuse_rows=[("a.ts", prior_artifact_digest, "docs/audits/prior_audit.json", stale_prior_blob)],
        )
        result = wer.evaluate_worker_return(
            return_text=return_text, work_order_text=CONTRACT_WORK_ORDER, repo_root=self.repo_root
        )
        self.assertFalse(result.is_clean)
        self.assertTrue(any("source identity changed" in i.message for i in result.issues))

    def test_reuse_fabricated_self_consistent_chain_rejected_via_entrypoint(self) -> None:
        """F3 continued proof, entrypoint-level: a REUSED row with a
        fabricated but internally self-consistent reuse chain (matching
        blobSha256, matching priorBlobSha256, a distinct priorArtifactSha256)
        that does NOT correspond to any real prior-artifact bytes this repo
        can read must be rejected -- not pass because the worker's own
        claims agree with each other."""
        audit_bytes = json.dumps({"schemaVersion": "cvf.evidenceAudit.v1"}).encode("utf-8")
        self._write("docs/audits/fixture_audit.json", audit_bytes)
        self._write("docs/manifests/fixture_manifest.txt", "a.ts\n")
        blob = self._write_source("a.ts", b"reused content\n")
        digest = hashlib.sha256(audit_bytes).hexdigest()
        fabricated_prior_digest = "a" * 64
        return_text = "# Return\n" + _binding_block(
            audit_path="docs/audits/fixture_audit.json",
            audit_sha256=digest,
            manifest_path="docs/manifests/fixture_manifest.txt",
            rows=[("a.ts", blob, 1, "1-1", "REUSED")],
            # Self-consistent: priorBlobSha256 matches the row's real blob,
            # priorArtifactSha256 is distinct from the current audit digest
            # (no self-hash cycle) -- but priorArtifactPath points at a file
            # that was never written, so there are no real bytes behind the
            # claimed digest at all.
            reuse_rows=[("a.ts", fabricated_prior_digest, "docs/audits/never_written_prior.json", blob)],
        )
        result = wer.evaluate_worker_return(
            return_text=return_text, work_order_text=CONTRACT_WORK_ORDER, repo_root=self.repo_root
        )
        self.assertFalse(result.is_clean)
        self.assertTrue(
            any(
                "does not resolve to a real, readable prior artifact" in i.message
                for i in result.issues
            )
        )



if __name__ == "__main__":
    unittest.main()
