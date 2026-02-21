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

    def evaluate_all(self, context):

        results = []

        for domain in self.domains:
            results.append(domain.evaluate(context))

        return results