import json
from datetime import datetime
from .override_validator import OverrideValidator


class OverrideEngine:

    def __init__(self, registry_path, schema_path):
        with open(registry_path, "r") as f:
            self.registry = json.load(f)

        self.validator = OverrideValidator(schema_path)

    def is_override_allowed(self, project, issue_type):

        for override in self.registry["overrides"]:

            self.validator.validate(override)

            if not override["active"]:
                continue

            if override["project"] != project:
                continue

            if override["type"] != issue_type:
                continue

            expiry = datetime.strptime(
                override["expires_at"], "%Y-%m-%d"
            )

            if expiry < datetime.now():
                continue

            return True

        return False