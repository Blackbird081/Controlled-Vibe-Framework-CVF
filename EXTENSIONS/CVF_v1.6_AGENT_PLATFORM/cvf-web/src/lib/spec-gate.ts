export type SpecGateStatus = 'PASS' | 'CLARIFY' | 'FAIL';

export interface SpecGateField {
    id: string;
    label: string;
    required: boolean;
}

export interface SpecGateResult {
    status: SpecGateStatus;
    missing: SpecGateField[];
    requiredCount: number;
    providedCount: number;
}

export function evaluateSpecGate(
    fields: SpecGateField[],
    values: Record<string, string>
): SpecGateResult {
    const requiredFields = fields.filter(field => field.required);
    const missing = requiredFields.filter(field => {
        const value = values[field.id];
        return !value || !value.trim() || value.trim().toLowerCase() === 'n/a';
    });
    const providedCount = Object.values(values).filter(v => v && v.trim()).length;

    let status: SpecGateStatus;
    if (requiredFields.length === 0) {
        status = providedCount > 0 ? 'PASS' : 'CLARIFY';
    } else if (missing.length === 0) {
        status = 'PASS';
    } else if (missing.length === requiredFields.length && providedCount === 0) {
        status = 'FAIL';
    } else {
        status = 'CLARIFY';
    }

    return {
        status,
        missing,
        requiredCount: requiredFields.length,
        providedCount,
    };
}
