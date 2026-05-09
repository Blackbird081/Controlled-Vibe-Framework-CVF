export type TemplateIntentValue = string | string[] | number | boolean | null | undefined;

const TEMPLATE_PLACEHOLDER_PATTERN = /\[([A-Za-z0-9_]+)\]/g;

export function formatTemplateIntentValue(value: TemplateIntentValue): string {
    if (Array.isArray(value)) {
        const joined = value.map(item => String(item).trim()).filter(Boolean).join(', ');
        return joined || 'N/A';
    }

    if (value === null || value === undefined) {
        return 'N/A';
    }

    const formatted = String(value).trim();
    return formatted || 'N/A';
}

export function renderTemplateIntent(
    intentPattern: string,
    values: Record<string, TemplateIntentValue>,
): string {
    return intentPattern.replace(
        TEMPLATE_PLACEHOLDER_PATTERN,
        (_placeholder, key: string) => formatTemplateIntentValue(values[key]),
    );
}

export function hasTemplatePlaceholders(value: string): boolean {
    return TEMPLATE_PLACEHOLDER_PATTERN.test(value);
}
