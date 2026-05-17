from policy_dsl.dsl_engine import DSLEngine
from .scenario_loader import ScenarioLoader
from .impact_analyzer import ImpactAnalyzer


class PolicySimulationEngine:

    def __init__(self, policy_file):
        self.dsl = DSLEngine(policy_file=policy_file)
        self.loader = ScenarioLoader()
        self.analyzer = ImpactAnalyzer()

    def run(self, baseline_policy_file):

        baseline_engine = DSLEngine(policy_file=baseline_policy_file)

        scenarios = self.loader.load()

        baseline_results = []
        new_results = []

        for scenario in scenarios:

            base_actions = baseline_engine.evaluate(scenario)
            new_actions = self.dsl.evaluate(scenario)

            baseline_results.append({
                "id": scenario["id"],
                "decision": base_actions[0] if base_actions else "APPROVED"
            })

            new_results.append({
                "id": scenario["id"],
                "decision": new_actions[0] if new_actions else "APPROVED"
            })

        impact = self.analyzer.compare(baseline_results, new_results)

        return {
            "baseline": baseline_results,
            "new_policy": new_results,
            "impact": impact
        }