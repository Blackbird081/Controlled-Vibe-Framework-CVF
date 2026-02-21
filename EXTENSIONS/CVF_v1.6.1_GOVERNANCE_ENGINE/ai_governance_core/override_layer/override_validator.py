import json


class OverrideValidator:

    def __init__(self, schema_path):
        with open(schema_path, "r") as f:
            self.schema = json.load(f)

    def validate(self, override):
        for field in self.schema["required_fields"]:
            if field not in override:
                raise ValueError(f"Missing required field: {field}")