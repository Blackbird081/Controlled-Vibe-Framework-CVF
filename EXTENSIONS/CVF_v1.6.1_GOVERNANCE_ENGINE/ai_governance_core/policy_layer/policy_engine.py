import json


class PolicyEngine:

    def __init__(self, policy_path="policy_layer/policy_registry.json"):
        with open(policy_path, "r") as f:
            self.policies = json.load(f)

    def evaluate(self, violations):

        actions = []

        for violation in violations:
            if violation in self.policies:
                actions.append(self.policies[violation])

        return actions