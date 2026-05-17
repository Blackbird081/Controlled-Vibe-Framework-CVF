import json


class RBACEngine:

    def __init__(
        self,
        user_path="identity_layer/user_registry.json",
        permission_path="identity_layer/permission_matrix.json"
    ):
        with open(user_path, "r") as f:
            self.users = json.load(f)["users"]

        with open(permission_path, "r") as f:
            self.permissions = json.load(f)

    def get_role(self, username):
        for user in self.users:
            if user["name"] == username:
                return user["role"]
        return None

    def has_permission(self, username, action):

        role = self.get_role(username)

        if role is None:
            return False

        allowed_roles = self.permissions.get(action, [])

        return role in allowed_roles