import json
from ledger_layer.hash_engine import HashEngine


class RegistryIntegrity:

    def __init__(
        self,
        snapshot_path="tamper_detection/integrity_snapshot.json"
    ):
        self.snapshot_path = snapshot_path

    def snapshot(self, file_paths):

        snapshot_data = {}

        for path in file_paths:
            with open(path, "r") as f:
                content = json.load(f)

            snapshot_data[path] = HashEngine.generate_hash(content)

        with open(self.snapshot_path, "w") as f:
            json.dump(snapshot_data, f, indent=2)

    def validate(self):

        with open(self.snapshot_path, "r") as f:
            stored = json.load(f)

        for path, expected_hash in stored.items():

            with open(path, "r") as f:
                content = json.load(f)

            current_hash = HashEngine.generate_hash(content)

            if current_hash != expected_hash:
                return False

        return True