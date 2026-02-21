from datetime import datetime
from .hash_engine import HashEngine


class BlockBuilder:

    def build_block(self, previous_hash, event_payload):

        block = {
            "timestamp": datetime.utcnow().isoformat(),
            "previous_hash": previous_hash,
            "event": event_payload
        }

        block_hash = HashEngine.generate_hash(block)

        block["hash"] = block_hash

        return block