import hashlib
import json


class HashEngine:

    @staticmethod
    def generate_hash(payload):

        serialized = json.dumps(payload, sort_keys=True)
        return hashlib.sha256(serialized.encode()).hexdigest()