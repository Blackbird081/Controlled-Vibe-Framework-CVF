export function validateRoutingScope(scope) {
    const missing = [scope.recipient, scope.role, scope.task, scope.phase].some((value) => value.trim().length === 0);
    if (missing) {
        return { valid: false, reasons: ["INCOMPLETE_ROUTING_SCOPE"] };
    }
    return { valid: true, reasons: [] };
}
