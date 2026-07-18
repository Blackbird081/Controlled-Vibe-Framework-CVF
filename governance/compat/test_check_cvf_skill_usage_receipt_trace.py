import unittest

from governance.compat import check_cvf_skill_usage_receipt_trace as checker


class CvfSkillUsageReceiptTraceTests(unittest.TestCase):
    def test_no_usage_claim_passes_without_block(self) -> None:
        text = "This artifact defines a policy for when agents use CVF skills."
        self.assertEqual(checker.check_text("docs/reviews/example.md", text), [])

    def test_usage_claim_requires_trace_block(self) -> None:
        text = (
            "The worker loaded ASSF runtime package body and consumed its "
            "guidance in this review."
        )
        violations = checker.check_text("docs/reviews/example.md", text)
        self.assertTrue(any("requires" in violation.message for violation in violations))

    def test_usage_claim_requires_used_disposition(self) -> None:
        text = """
The worker used CVF skill package guidance for the artifact.

## CVF Skill Usage Receipt Trace

| Field | Value |
|---|---|
| Usage disposition | NOT_USED_WITH_REASON |
| CVF skill id | cvf-engineering-code-review-quality |
| Package root | docs/reference/agent_system_skills/packages/cvf-engineering-code-review-quality/SKILL.md |
| Invocation context | review |
| Receipt evidence | skillUsageReceipt output |
| Output consumed by CVF | review guidance |
| Truth packet or source path | docs/reference/agent_system_skills/truth/packets/cvf-engineering-code-review-quality.json |
| Authority boundary | receipt does not grant authority or bypass work-order scope |
"""
        violations = checker.check_text("docs/reviews/example.md", text)
        self.assertTrue(any("Usage disposition" in violation.message for violation in violations))

    def test_complete_trace_passes(self) -> None:
        text = """
The worker used CVF skill package guidance for the artifact.

## CVF Skill Usage Receipt Trace

| Field | Value |
|---|---|
| Usage disposition | USED_WITH_RECEIPT |
| CVF skill id | cvf-engineering-code-review-quality |
| Package root | docs/reference/agent_system_skills/packages/cvf-engineering-code-review-quality/SKILL.md |
| Invocation context | review |
| Receipt evidence | skillUsageReceipt receiptId sha256:1111111111111111111111111111111111111111111111111111111111111111 |
| Output consumed by CVF | review guidance |
| Truth packet or source path | docs/reference/agent_system_skills/truth/packets/cvf-engineering-code-review-quality.json |
| Authority boundary | receipt proves body read only and does not grant authority or bypass work-order scope |
"""
        self.assertEqual(checker.check_text("docs/reviews/example.md", text), [])

    def test_incomplete_used_trace_fails(self) -> None:
        text = """
cvfSkillUsed: true

## CVF Skill Usage Receipt Trace

| Field | Value |
|---|---|
| Usage disposition | USED_WITH_RECEIPT |
| CVF skill id | N/A with reason |
| Package root | docs/reference/agent_system_skills/packages/example/SKILL.md |
| Invocation context | review |
| Receipt evidence | output without hash |
| Output consumed by CVF | review guidance |
| Truth packet or source path | docs/reference/agent_system_skills/truth/packets/example.json |
| Authority boundary | receipt proves body read only |
"""
        violations = checker.check_text("docs/reviews/example.md", text)
        self.assertTrue(any("CVF skill id" in violation.message for violation in violations))
        self.assertTrue(any("Receipt evidence" in violation.message for violation in violations))
        self.assertTrue(any("Authority boundary" in violation.message for violation in violations))

    def test_template_before_actual_trace_uses_actual_trace(self) -> None:
        text = """
## Required CVF Skill Usage Receipt Trace

```text
## CVF Skill Usage Receipt Trace

| Field | Value |
|---|---|
| Usage disposition | USED_WITH_RECEIPT or NOT_USED_WITH_REASON |
```

## CVF Skill Usage Receipt Trace

| Field | Value |
|---|---|
| Usage disposition | NOT_USED_WITH_REASON |
| CVF skill id | N/A with reason: no CVF runtime package output consumed |
| Package root | N/A with reason: no CVF runtime package output consumed |
| Invocation context | N/A with reason: policy template only |
| Receipt evidence | N/A with reason: no skillUsageReceipt output consumed |
| Output consumed by CVF | N/A with reason: none |
| Truth packet or source path | N/A with reason: none |
| Authority boundary | no CVF package output; any future receipt does not grant authority |
"""
        self.assertEqual(checker.check_text("docs/reference/example.md", text), [])


if __name__ == "__main__":
    unittest.main()
