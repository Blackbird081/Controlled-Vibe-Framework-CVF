class PromptDomain:

    def evaluate(self, context):

        prompt = context.get("prompt", "")

        if "ignore previous instructions" in prompt.lower():
            return {
                "violations": ["PROMPT_INJECTION"],
                "score": 0
            }

        return {
            "violations": [],
            "score": 100
        }