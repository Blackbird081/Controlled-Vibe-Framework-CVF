import hashlib
import json


class ApprovalTokenEngine:

    @staticmethod
    def generate_token(override):
        payload = json.dumps(override, sort_keys=True)
        return hashlib.sha256(payload.encode()).hexdigest()