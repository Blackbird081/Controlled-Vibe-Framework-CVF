from .token_engine import TokenEngine
from .drift_engine import DriftEngine
from .freeze_engine import FreezeEngine


class BrandGuardian:

    def __init__(self):
        self.token_engine = TokenEngine()
        self.drift_engine = DriftEngine()
        self.freeze_engine = FreezeEngine()

    def protect(self, approved_system, new_system):
        approved_tokens = self.token_engine.tokenize(approved_system)
        new_tokens = self.token_engine.tokenize(new_system)

        drift_result = self.drift_engine.compare(
            approved_tokens,
            new_tokens
        )

        freeze_result = self.freeze_engine.evaluate(drift_result)

        return {
            "drift": drift_result,
            "freeze": freeze_result
        }