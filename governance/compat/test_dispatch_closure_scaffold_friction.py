#!/usr/bin/env python3
"""Dedicated regression suite for dispatch and closure scaffold friction repair (CVF-WRS-FR2).

Verifies:
1. Raw memory release invariant: generated baseline and work order independently carry
   rawMemoryReleased=false in their Claim Boundary, satisfying the raw memory release
   consumer gate without relying on an appended worker skeleton, while deleted tokens
   are refused.
2. Continuation Rule B: generated work order contains mandatory Rule B guidance,
   omits legacy optional guidance, preserves stable completionReviewPath, and satisfies
   the continuation chain consumer under positive, negative, and exempt conditions.
3. Public export disposition: generated artifacts contain the public export disposition
   block with DEFERRED_PRIVATE_ONLY, and removal triggers consumer refusal.
"""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

COMPAT_DIR = Path(__file__).resolve().parent
if str(COMPAT_DIR) not in sys.path:
    sys.path.insert(0, str(COMPAT_DIR))

from build_dispatch_packet_scaffold import (
    ScaffoldArgs,
    build_gc018_baseline,
    build_work_order,
    build_worker_return_skeleton,
    detect_triggers,
)
import check_continuation_chain as cont_chain
import check_public_export_disposition as pub_gate
import check_raw_memory_release_invariant as raw_gate


class TestRawMemoryBoundary(unittest.TestCase):
    """REQ-1: Independent rawMemoryReleased=false in baseline and work order."""

    BATCH_IDS = ("ALPHA-BATCH-01", "BETA-BATCH-02")
    PACKET_KINDS = ("generic-worker-dispatch", "source-intake")

    def _make_args(self, batch_id: str, packet_kind: str) -> ScaffoldArgs:
        return ScaffoldArgs(
            packet_kind=packet_kind,
            batch_id=batch_id,
            title=f"Memory write and retrieval update for {batch_id}",
            date="2026-10-04",
            base="8482be833d8518a485e9ad66f1e9c6aa336b40e3",
            commit_mode="WORKER_MUST_NOT_COMMIT",
            dependencies=[],
        )

    def test_baseline_and_work_order_positive_pass_with_and_without_skeleton(self) -> None:
        """Baseline and work-order carry rawMemoryReleased=false independently."""
        for batch_id in self.BATCH_IDS:
            for packet_kind in self.PACKET_KINDS:
                args = self._make_args(batch_id, packet_kind)
                active = detect_triggers(args)
                baseline = build_gc018_baseline(args, active)
                work_order = build_work_order(args, active)
                skeleton = build_worker_return_skeleton(args)
                work_order_with_skeleton = f"{work_order}\n\n{skeleton}"

                baseline_path = f"docs/baselines/CVF_GC018_{batch_id}_2026-10-04.md"
                wo_path = f"docs/work_orders/CVF_AGENT_WORK_ORDER_{batch_id}_2026-10-04.md"

                # Baseline checks
                self.assertIsNotNone(raw_gate.MEMORY_SURFACE_PATTERN.search(baseline))
                self.assertIsNotNone(raw_gate.RAW_RELEASE_FALSE_PATTERN.search(baseline))
                v_baseline = raw_gate.diagnose_raw_memory_release_invariant(baseline_path, baseline)
                self.assertEqual(v_baseline, [], f"Baseline failed for {batch_id}/{packet_kind}")

                # Work order without skeleton checks
                self.assertIsNotNone(raw_gate.MEMORY_SURFACE_PATTERN.search(work_order))
                self.assertIsNotNone(raw_gate.RAW_RELEASE_FALSE_PATTERN.search(work_order))
                v_wo = raw_gate.diagnose_raw_memory_release_invariant(wo_path, work_order)
                self.assertEqual(v_wo, [], f"Standalone work-order failed for {batch_id}/{packet_kind}")

                # Work order with appended skeleton checks
                v_wo_skel = raw_gate.diagnose_raw_memory_release_invariant(wo_path, work_order_with_skeleton)
                self.assertEqual(v_wo_skel, [], f"Appended work-order failed for {batch_id}/{packet_kind}")

    def test_deleted_token_negative_refusal(self) -> None:
        """Consumer rejects baseline and work order when raw token is deleted."""
        args = self._make_args("TEST-NEG", "generic-worker-dispatch")
        active = detect_triggers(args)
        baseline = build_gc018_baseline(args, active)
        work_order = build_work_order(args, active)

        mutated_baseline = baseline.replace("rawMemoryReleased=false", "")
        mutated_wo = work_order.replace("rawMemoryReleased=false", "")

        self.assertIsNone(raw_gate.RAW_RELEASE_FALSE_PATTERN.search(mutated_baseline))
        self.assertIsNone(raw_gate.RAW_RELEASE_FALSE_PATTERN.search(mutated_wo))

        v_base = raw_gate.diagnose_raw_memory_release_invariant("docs/baselines/CVF_TEST.md", mutated_baseline)
        self.assertTrue(any(v["type"] == "raw_memory_release_false_missing" for v in v_base))

        v_wo = raw_gate.diagnose_raw_memory_release_invariant("docs/work_orders/CVF_TEST.md", mutated_wo)
        self.assertTrue(any(v["type"] == "raw_memory_release_false_missing" for v in v_wo))


class TestContinuationRuleBGuidanceAndEnforcement(unittest.TestCase):
    """REQ-2: Continuation Rule B guidance and consumer enforcement."""

    def test_generated_work_order_guidance_text(self) -> None:
        """Optional guidance is absent and explicit Rule B guidance is present."""
        args = ScaffoldArgs(
            packet_kind="generic-worker-dispatch",
            batch_id="CVF-TEST-RULEB",
            title="Rule B Guidance Verification",
            date="2026-10-04",
            base="8482be833d8518a485e9ad66f1e9c6aa336b40e3",
            commit_mode="WORKER_MUST_NOT_COMMIT",
            dependencies=[],
        )
        work_order = build_work_order(args, detect_triggers(args))

        # Unconditional optional guidance must be completely absent
        self.assertNotIn(
            "(optional; prefer repairing evidence in the worker return per gotcha 30)",
            work_order,
        )

        # Explicit continuation Rule B guidance must be present
        self.assertIn(
            "required for CLOSED non-exempt work orders under continuation Rule B",
            work_order,
        )
        self.assertIn("exemption applies only from existing registry", work_order)
        self.assertIn(
            "| completionReviewPath | `docs/reviews/CVF_CVF-TEST-RULEB_COMPLETION_2026-10-04.md`",
            work_order,
        )

    def test_continuation_rule_b_isolated_enforcement(self) -> None:
        """Rule B consumer refuses uncompleted closed orders, accepts matching review, and respects exemptions."""
        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_root = Path(tmp_dir)
            wo_dir = tmp_root / "work_orders"
            rev_dir = tmp_root / "reviews"
            wo_dir.mkdir()
            rev_dir.mkdir()

            wo_file = wo_dir / "CVF_AGENT_WORK_ORDER_WRS_RULEB_TEST_2026-10-04.md"
            wo_content = (
                "# CVF Agent Work Order - Test Rule B\n\n"
                "GC-018 required: No\n\n"
                "Status: CLOSED\n\n"
                "## Purpose\n\nTest continuation rule B behavior.\n"
            )
            wo_file.write_text(wo_content, encoding="utf-8")

            # 1. Negative refusal: non-exempt closed work order without completion review
            violations_neg = cont_chain._check_work_orders(wo_dir, rev_dir, exemptions=set())
            self.assertTrue(
                any(
                    v.get("rule") == "B" and "no completion review" in v.get("issue", "")
                    for v in violations_neg
                ),
                f"Expected Rule B violation, got: {violations_neg}",
            )

            # 2. Positive pass: named matching completion review added
            completion_file = rev_dir / "CVF_WRS_RULEB_TEST_COMPLETION_2026-10-04.md"
            completion_file.write_text(
                "# Completion Review\n\nWork order reference: WRS_RULEB_TEST\n",
                encoding="utf-8",
            )
            violations_pos = cont_chain._check_work_orders(wo_dir, rev_dir, exemptions=set())
            rule_b_pos = [v for v in violations_pos if v.get("rule") == "B"]
            self.assertEqual(rule_b_pos, [], f"Expected clean Rule B, got: {rule_b_pos}")

            # 3. Exemption respected: completion review removed, but filename in exemptions
            completion_file.unlink()
            violations_exempt = cont_chain._check_work_orders(
                wo_dir, rev_dir, exemptions={wo_file.name}
            )
            rule_b_exempt = [v for v in violations_exempt if v.get("rule") == "B"]
            self.assertEqual(rule_b_exempt, [], f"Expected exempted Rule B, got: {rule_b_exempt}")


class TestPublicExportDisposition(unittest.TestCase):
    """REQ-3: Public export disposition presence and negative refusal."""

    def test_public_export_disposition_positive(self) -> None:
        """Generated baseline and work-order carry valid DEFERRED_PRIVATE_ONLY export block."""
        args = ScaffoldArgs(
            packet_kind="generic-worker-dispatch",
            batch_id="TEST-PUB",
            title="Public Export Verification",
            date="2026-10-04",
            base="8482be833d8518a485e9ad66f1e9c6aa336b40e3",
            commit_mode="WORKER_MUST_NOT_COMMIT",
            dependencies=[],
        )
        active = detect_triggers(args)
        baseline = build_gc018_baseline(args, active)
        work_order = build_work_order(args, active)

        for doc in (baseline, work_order):
            self.assertIn(pub_gate.REQUIRED_SECTION, doc)
            section = pub_gate._extract_section(doc, pub_gate.REQUIRED_SECTION)
            self.assertIn("DEFERRED_PRIVATE_ONLY", section)
            self.assertIn("public-sync", section)
            # The unfinished reason lists alternative dispositions. It must
            # refuse closure until the author selects the truthful private lane.
            unfinished = "# Local closure fixture\nStatus: CLOSED\n" + doc
            self.assertTrue(
                any(
                    v["type"] == "public_export_disposition_invalid"
                    for v in pub_gate._validate_export_disposition(
                        "docs/roadmaps/CVF_LOCAL_PUBLIC_BOUNDARY.md", unfinished
                    )
                )
            )
            completed_section = section.split("Reason:", 1)[0] + (
                "Reason: isolated private fixture; public-facing changes require "
                "the sibling public-sync clone.\n"
            )
            closure = unfinished.replace(section, completed_section)
            self.assertEqual(
                pub_gate._validate_export_disposition(
                    "docs/roadmaps/CVF_LOCAL_PUBLIC_BOUNDARY.md", closure
                ),
                [],
            )
            # Delete only the boundary from the actual generated section;
            # retain the section, disposition and reason as the negative control.
            mutated = closure.replace(
                completed_section, completed_section.replace("public-sync", "export scope")
            )
            self.assertTrue(
                any(
                    v["type"] == "public_sync_boundary_missing"
                    for v in pub_gate._validate_export_disposition(
                        "docs/roadmaps/CVF_LOCAL_PUBLIC_BOUNDARY.md", mutated
                    )
                )
            )

    def test_removed_public_export_negative_control(self) -> None:
        """Consumer flags missing export disposition on closure target."""
        closure_text_without_export = (
            "# Roadmap Closure\n\n"
            "Status: CLOSED\n\n"
            "## Purpose\n\n"
            "Completed wave.\n"
        )
        violations = pub_gate._validate_export_disposition(
            "docs/roadmaps/CVF_TEST_ROADMAP.md", closure_text_without_export
        )
        self.assertTrue(
            any(v.get("type") == "public_export_disposition_missing" for v in violations),
            f"Expected public_export_disposition_missing, got: {violations}",
        )


if __name__ == "__main__":
    unittest.main()
