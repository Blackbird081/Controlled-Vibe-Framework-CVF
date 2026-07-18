import unittest

from governance.compat import check_external_provider_skill_usage_trace as checker


class ExternalProviderSkillUsageTraceTests(unittest.TestCase):
    def test_no_usage_claim_passes_without_block(self) -> None:
        text = "This artifact defines a policy for when agents use provider skills."
        self.assertEqual(checker.check_text("docs/reviews/example.md", text), [])

    def test_usage_claim_requires_trace_block(self) -> None:
        text = "The worker used openai-docs skill and consumed its answer."
        violations = checker.check_text("docs/reviews/example.md", text)
        self.assertTrue(any("requires" in violation.message for violation in violations))

    def test_usage_claim_requires_used_disposition(self) -> None:
        text = """
The worker invoked external provider skill output.

## External Provider Skill Usage Trace

| Field | Value |
|---|---|
| Usage disposition | NOT_USED_WITH_REASON |
| Provider skill name | openai-docs |
| Provider owner | Codex |
| Invocation context | documentation lookup |
| Output consumed by CVF | source citation routing |
| CVF source-of-truth promotion path | source verification block |
| Evidence artifact | this review |
| Authority boundary | not CVF canonical authority until source-verified |
"""
        violations = checker.check_text("docs/reviews/example.md", text)
        self.assertTrue(any("Usage disposition" in violation.message for violation in violations))

    def test_complete_trace_passes(self) -> None:
        text = """
The worker used provider skill openai-docs for documentation lookup.

## External Provider Skill Usage Trace

| Field | Value |
|---|---|
| Usage disposition | USED_WITH_TRACE |
| Provider skill name | openai-docs |
| Provider owner | Codex |
| Invocation context | documentation lookup |
| Output consumed by CVF | source citation routing |
| CVF source-of-truth promotion path | Source Verification Block in this review |
| Evidence artifact | docs/reviews/example.md |
| Authority boundary | provider output is not CVF canonical authority until source-verified |
"""
        self.assertEqual(checker.check_text("docs/reviews/example.md", text), [])

    def test_template_before_actual_trace_uses_actual_trace(self) -> None:
        text = """
## Required External Provider Skill Usage Trace

```text
## External Provider Skill Usage Trace

| Field | Value |
|---|---|
| Usage disposition | USED_WITH_TRACE or NOT_USED_WITH_REASON |
```

## External Provider Skill Usage Trace

| Field | Value |
|---|---|
| Usage disposition | NOT_USED_WITH_REASON |
| Provider skill name | N/A with reason |
| Provider owner | N/A with reason |
| Invocation context | N/A with reason |
| Output consumed by CVF | N/A with reason |
| CVF source-of-truth promotion path | N/A with reason |
| Evidence artifact | docs/reference/example.md |
| Authority boundary | no provider output; provider output would be not CVF canonical authority |
"""
        self.assertEqual(checker.check_text("docs/reference/example.md", text), [])

    def test_incomplete_used_trace_fails(self) -> None:
        text = """
providerSkillUsed: true

## External Provider Skill Usage Trace

| Field | Value |
|---|---|
| Usage disposition | USED_WITH_TRACE |
| Provider skill name | N/A with reason |
| Provider owner | Codex |
| Invocation context | docs lookup |
| Output consumed by CVF | summary |
| CVF source-of-truth promotion path | review |
| Evidence artifact | docs/reviews/example.md |
| Authority boundary | provider output is not CVF canonical authority until source-verified |
"""
        violations = checker.check_text("docs/reviews/example.md", text)
        self.assertTrue(any("Provider skill name" in violation.message for violation in violations))


if __name__ == "__main__":
    unittest.main()
