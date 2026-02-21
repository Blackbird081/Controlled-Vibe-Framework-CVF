import json
from datetime import datetime


class ApprovalEngine:

    def __init__(
        self,
        registry_path="approval_layer/approval_registry.json"
    ):
        self.registry_path = registry_path

    def request_approval(self, project, decision, requested_by):

        record = {
            "project": project,
            "decision": decision,
            "requested_by": requested_by,
            "status": "PENDING",
            "timestamp": datetime.utcnow().isoformat()
        }

        with open(self.registry_path, "r") as f:
            data = json.load(f)

        data["approvals"].append(record)

        with open(self.registry_path, "w") as f:
            json.dump(data, f, indent=2)

        return record

    def approve(self, project, approver):

        with open(self.registry_path, "r") as f:
            data = json.load(f)

        for record in data["approvals"]:
            if record["project"] == project and record["status"] == "PENDING":
                record["status"] = "APPROVED"
                record["approved_by"] = approver
                record["approved_at"] = datetime.utcnow().isoformat()

        with open(self.registry_path, "w") as f:
            json.dump(data, f, indent=2)