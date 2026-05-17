from core.utils import load_json, save_json, generate_hash
import datetime


class RegistryManager:

    def __init__(self, path="registry/design_registry.json"):
        self.path = path

    def register(self, project_name: str, design_system: dict):
        registry = load_json(self.path)

        version = registry.get(project_name, {}).get("version", 0) + 1

        entry = {
            "version": version,
            "timestamp": str(datetime.datetime.utcnow()),
            "hash": generate_hash(design_system),
            "design_system": design_system
        }

        registry[project_name] = entry
        save_json(self.path, registry)

        return entry