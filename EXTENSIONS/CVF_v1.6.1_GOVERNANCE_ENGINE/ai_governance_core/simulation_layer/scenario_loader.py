import json


class ScenarioLoader:

    def __init__(self, path="simulation_layer/sample_scenarios.json"):
        self.path = path

    def load(self):
        with open(self.path, "r") as f:
            return json.load(f)["scenarios"]