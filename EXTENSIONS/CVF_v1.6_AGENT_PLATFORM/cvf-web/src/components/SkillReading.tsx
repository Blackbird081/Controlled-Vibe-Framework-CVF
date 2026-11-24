// Text Encoding Exception: Vietnamese labels are part of the Skills reading view.
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Skill } from '@/types/skill';
import { SessionExpiredNotice, SignInNotice } from './SessionExpiredNotice';
import { TechnicalDetails } from './TechnicalDetails';

const projectionHeadings = new Set(['Projection Boundary', 'Source Trace', 'Review Artifacts', 'Metadata']);

export function skillReadingParts(raw: string, projection = false) {
    const lines = raw.split(/\r?\n/);
    let headingIndex = lines.findIndex(line => line.trim());
    if (headingIndex < 0) headingIndex = 0;
    const start = /^#\s+/.test(lines[headingIndex] ?? '') ? headingIndex + 1 : headingIndex;
    const body = lines.slice(0, start);
    const metadata: string[] = [];
    let front = true;
    let technicalSection = false;

    for (let i = start; i < lines.length; i++) {
        const line = lines[i];
        const heading = line.match(/^##\s+(.+?)\s*$/)?.[1];
        if (heading) technicalSection = projection && projectionHeadings.has(heading);
        const leadingQuote = front && /^>\s*\*\*(?:Domain|Difficulty|CVF Version|Skill Version|Last Updated|Inspired by|ASSF|Runtime eligible|Adapter|Source):/i.test(line);
        const leadingTable = front && /^\|.*\|\s*$/.test(line) &&
            (/\b(?:metadata|version|field|value|attribute|property)\b/i.test(line) || metadata.at(-1)?.trim().startsWith('|'));
        if (technicalSection || leadingQuote || leadingTable) {
            metadata.push(line);
        } else {
            if (line.trim()) front = false;
            body.push(line);
        }
    }

    return { body: body.join('\n').trim(), metadata: metadata.join('\n').trim() };
}

export function SkillTechnicalDetails({ skill, metadata, vi, components }: {
    skill: Skill;
    metadata: string;
    vi: boolean;
    components?: Components;
}) {
    const certified = skill.assfProjectionClass === 'CERTIFIED_PACKAGE_PROJECTION';
    if (!metadata && !certified && !skill.runtimePackageProjection && !skill.canonicalRoot) return null;

    return (
        <TechnicalDetails className="mb-4" label={vi ? 'Chi tiết kỹ thuật' : 'Technical details'}>
                {certified && (
                    <>
                        <div className="font-semibold">Certified ASSF</div>
                        <div>ASSF package projection</div>
                        <div>Certification: {skill.certificationState}</div>
                        <div>UAT: {skill.uatState}</div>
                    </>
                )}
                {skill.runtimePackageProjection && (
                    <>
                        <div>Runtime package</div>
                        <div>Runtime eligible: {skill.runtimeEligible ? 'YES' : 'NO'}</div>
                        <div>Activation: {skill.activationDecision}</div>
                        {skill.primaryDomain && <div>Domain: {skill.primaryDomain}</div>}
                    </>
                )}
                {skill.externalCliMcpDisposition && <div>Adapter: {skill.externalCliMcpDisposition}</div>}
                {skill.canonicalRoot && <div className="break-all">Source: {skill.canonicalRoot}</div>}
                {metadata && (
                    <div className="prose prose-sm max-w-none overflow-x-auto dark:prose-invert">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{metadata}</ReactMarkdown>
                    </div>
                )}
        </TechnicalDetails>
    );
}

export function SkillLoadMessage({ expired, vi }: { expired: boolean; vi: boolean }) {
    if (expired) return <SessionExpiredNotice vi={vi} />;
    return <SignInNotice
        vi={vi}
        message={vi ? 'Không tải được kỹ năng. Hãy tải lại trang hoặc đăng nhập lại.' : 'Skills could not be loaded. Reload the page or sign in again.'}
    />;
}
