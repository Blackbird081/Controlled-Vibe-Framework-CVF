from .dsl_parser import DSLParser
from .dsl_executor import DSLExecutor


class DSLEngine:

    def __init__(self, policy_file="policy_dsl/policies.dsl"):
        self.parser = DSLParser()
        self.executor = DSLExecutor()

        with open(policy_file, "r") as f:
            dsl_text = f.read()

        self.rules = self.parser.parse(dsl_text)

    def evaluate(self, context):

        actions = self.executor.execute(self.rules, context)

        return actions