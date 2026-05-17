class LLMOutputDomain:

    def evaluate(self, context):

        output = context.get("llm_output", "")

        violations = []

        if "confidential" in output.lower():
            violations.append("DATA_LEAK_RISK")

        return {
            "violations": violations,
            "score": 100 - (len(violations) * 40)
        }