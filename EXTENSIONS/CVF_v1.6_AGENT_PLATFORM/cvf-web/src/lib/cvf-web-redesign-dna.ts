const WEB_DNA_TEMPLATE_IDS = new Set(['web_build_handoff', 'web_ux_redesign_system']);
const WEB_DNA_SKILL_IDS = new Set(['cvf_web_ux_redesign_system']);

export function shouldAttachCvfWebRedesignDna(input: {
  templateId?: string;
  templateName?: string;
  skillIds?: string[];
}): boolean {
  const templateId = input.templateId?.trim();
  if (templateId && WEB_DNA_TEMPLATE_IDS.has(templateId)) return true;

  if (input.skillIds?.some(skillId => WEB_DNA_SKILL_IDS.has(skillId.trim()))) {
    return true;
  }

  const templateName = input.templateName?.toLowerCase() ?? '';
  return templateName.includes('web') && (
    templateName.includes('handoff')
    || templateName.includes('ux')
    || templateName.includes('giao diện')
    || templateName.includes('bàn giao')
  );
}

export const CVF_WEB_REDESIGN_DNA_APPENDIX = `## CVF Web Redesign DNA

Apply this UI/UX DNA when the request is about building or redesigning a website, dashboard, admin surface, docs surface, landing page, or product shell.

- Canonical source: use the root CVF DESIGN.md as the visual contract. External references and Claude Design prototypes are learning material only.
- Runtime independence: do not require Claude Design at build time. Treat Claude Design prototypes as historical source material only.
- Experience tone: professional command workspace; premium, structured, calm, precise, operational.
- Layout: fixed left navigation for apps/dashboards; topbar/action strip; scrollable content; max-width content lanes for reading surfaces; no marketing hero unless the user explicitly asks for a landing page.
- Rhythm: 24-32px page padding, 16-20px grid gaps, compact dense cards for operational data, clear section separation.
- Color: dark-primary shell, layered panels, thin alpha borders, one primary accent by default. Prefer indigo #5b5cf6 unless domain branding gives a better accent. Use semantic colors only for status.
- Typography: strong 24-26px page headings, compact 13-14px section titles, 12-13.5px body/table text, uppercase 9-11px metadata labels, bold KPI numerals.
- Components: stat strips/KPI cards, pill filters, grouped action buttons, badge status, split-pane docs/search layouts, tables with sticky context, meaningful empty/loading/error states.
- Effects: subtle hover lift, alpha borders, restrained shadows, 120-180ms transitions. Avoid random gradient blobs, generic AI glows, nested cards, over-rounded pills, or one-off decorative surfaces.
- Build guardrail: preserve existing routes, auth, API payloads, data contracts, state stores, parsers, and integrations unless the user explicitly approves runtime changes.

For a web handoff packet, use these headings exactly:
1. Website Goal
2. Target Users
3. Required Pages and Flows
4. CVF Web Redesign DNA
5. UX / Visual Direction
6. Protected Constraints
7. Agent Build Instructions
8. Acceptance Checklist

Do not invent concrete route names, endpoint paths, payload fields, database schemas, auth mechanisms, or integration details that the user did not provide. If the user only says "preserve the existing API/auth/routes", repeat that constraint as protected scope instead of fabricating examples.`;
