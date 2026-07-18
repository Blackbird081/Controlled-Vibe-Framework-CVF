export function validateDose(dose, expiryUtc, actionTimeUtcIso) {
    const reasons = [];
    if (dose.trim().length === 0) {
        reasons.push("EMPTY_DOSE");
    }
    const expiryMs = Date.parse(expiryUtc);
    const nowMs = Date.parse(actionTimeUtcIso);
    if (Number.isNaN(expiryMs)) {
        reasons.push("INVALID_EXPIRY_UTC");
    }
    else if (!Number.isNaN(nowMs) && expiryMs <= nowMs) {
        reasons.push("EXPIRY_NOT_FUTURE");
    }
    return { valid: reasons.length === 0, reasons };
}
