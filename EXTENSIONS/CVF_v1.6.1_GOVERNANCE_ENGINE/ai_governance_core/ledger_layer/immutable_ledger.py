import json
import os
from .block_builder import BlockBuilder


class ImmutableLedger:

    def __init__(self, ledger_path="ledger_layer/ledger_chain.json"):
        self.ledger_path = ledger_path
        self.builder = BlockBuilder()

        if not os.path.exists(self.ledger_path):
            with open(self.ledger_path, "w") as f:
                json.dump([], f)

    def append_event(self, event_payload):

        with open(self.ledger_path, "r") as f:
            chain = json.load(f)

        previous_hash = chain[-1]["hash"] if chain else "GENESIS"

        block = self.builder.build_block(previous_hash, event_payload)

        chain.append(block)

        with open(self.ledger_path, "w") as f:
            json.dump(chain, f, indent=2)

        return block