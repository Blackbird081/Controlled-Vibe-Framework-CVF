class DataExposureDomain:

    def evaluate(self, context):

        metadata = context.get("metadata", {})

        if metadata.get("contains_pii"):
            return {
                "violations": ["PII_EXPOSURE"],
                "score": 0
            }

        return {
            "violations": [],
            "score": 100
        }