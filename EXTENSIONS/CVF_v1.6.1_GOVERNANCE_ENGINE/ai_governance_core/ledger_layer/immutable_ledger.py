import json
import os
import threading
from .block_builder import BlockBuilder

_ledger_lock = threading.Lock()


class ImmutableLedger:

    def __init__(self, ledger_path="ledger_layer/ledger_chain.json"):
        self.ledger_path = ledger_path
        self.builder = BlockBuilder()

        if not os.path.exists(self.ledger_path):
            os.makedirs(os.path.dirname(self.ledger_path), exist_ok=True)
            with open(self.ledger_path, "w") as f:
                json.dump([], f)
        self._read_chain()

    def _read_chain(self):
        with open(self.ledger_path, "r") as f:
            chain = json.load(f)
        if not isinstance(chain, list):
            raise ValueError("Governance ledger must be a JSON block list")
        return chain

    def read_chain(self):
        """Return the JSON ledger through the common consumer interface."""
        return self._read_chain()

    def append_event(self, event_payload):
        with _ledger_lock:
            chain = self._read_chain()

            previous_hash = chain[-1]["hash"] if chain else "GENESIS"

            block = self.builder.build_block(previous_hash, event_payload)

            chain.append(block)

            with open(self.ledger_path, "w") as f:
                json.dump(chain, f, indent=2)

            return block
