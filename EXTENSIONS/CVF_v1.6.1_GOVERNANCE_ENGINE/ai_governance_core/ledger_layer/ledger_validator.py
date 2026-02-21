import json
from .hash_engine import HashEngine


class LedgerValidator:

    def __init__(self, ledger_path="ledger_layer/ledger_chain.json"):
        self.ledger_path = ledger_path

    def validate_chain(self):

        with open(self.ledger_path, "r") as f:
            chain = json.load(f)

        previous_hash = "GENESIS"

        for block in chain:

            expected_hash = HashEngine.generate_hash({
                "timestamp": block["timestamp"],
                "previous_hash": block["previous_hash"],
                "event": block["event"]
            })

            if block["hash"] != expected_hash:
                return False

            if block["previous_hash"] != previous_hash:
                return False

            previous_hash = block["hash"]

        return True