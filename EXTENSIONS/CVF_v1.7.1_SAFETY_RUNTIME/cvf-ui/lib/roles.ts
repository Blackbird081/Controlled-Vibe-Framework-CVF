export type Role = "ADMIN" | "OPERATOR" | "VIEWER";

export function canExecute(role: Role) {
  return role === "ADMIN" || role === "OPERATOR";
}

export function canApprove(role: Role) {
  return role === "ADMIN";
}