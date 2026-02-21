from core.utils import load_json, save_json
import datetime


class ApprovalWorkflow:

    def __init__(self, path="registry/approvals.json"):
        self.path = path

    def request_approval(self, project_name, status, score):
        approvals = load_json(self.path)

        approvals[project_name] = {
            "status": "PENDING",
            "requested_at": str(datetime.datetime.utcnow()),
            "score": score,
            "initial_status": status
        }

        save_json(self.path, approvals)

    def approve(self, project_name, approver):
        approvals = load_json(self.path)
        approvals[project_name]["status"] = "APPROVED"
        approvals[project_name]["approved_by"] = approver
        save_json(self.path, approvals)