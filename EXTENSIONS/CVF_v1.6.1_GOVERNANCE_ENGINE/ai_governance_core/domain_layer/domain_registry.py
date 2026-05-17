from .ui_domain import UIDomain
from .prompt_domain import PromptDomain
from .llm_output_domain import LLMOutputDomain
from .data_exposure_domain import DataExposureDomain


class DomainRegistry:

    def __init__(self):
        self.domains = [
            UIDomain(),
            PromptDomain(),
            LLMOutputDomain(),
            DataExposureDomain()
        ]
        self._registry = {}

    def evaluate_all(self, context):

        results = []

        for domain in self.domains:
            results.append(domain.evaluate(context))

        return results

    def update(self, artifact_id: str, decision_result) -> dict:
        """
        Update internal registry with governance evaluation state.
        Returns a snapshot dict.
        """
        self._registry[artifact_id] = {
            "artifact_id": artifact_id,
            "governance_state": (
                decision_result.final_decision.value
                if hasattr(decision_result, "final_decision")
                else str(decision_result)
            ),
            "evaluated": True,
        }
        return self._registry[artifact_id]