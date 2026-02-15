import { promises as fs } from 'fs';
import path from 'path';
import type { Metadata } from 'next';
import { DOCS, DOC_META } from '@/data/docs-data';
import { DocContent } from './DocContent';

/* ------------------------------------------------------------------ */
/*  SSG: pre-build all doc pages at build time                         */
/* ------------------------------------------------------------------ */

export function generateStaticParams() {
    return DOCS.flatMap(cat => cat.items.map(item => ({ slug: item.slug })));
}

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
    const { slug } = await params;
    const meta = DOC_META[slug];
    return {
        title: meta ? `${meta.title.en} — CVF Docs` : 'CVF Documentation',
        description: meta
            ? `${meta.title.en} — ${meta.category.en} | Controlled Vibe Framework`
            : 'Controlled Vibe Framework Documentation',
    };
}

/* ------------------------------------------------------------------ */
/*  Server Component: read markdown files at build time                */
/* ------------------------------------------------------------------ */

async function readMarkdown(lang: string, slug: string): Promise<string> {
    try {
        const filePath = path.join(process.cwd(), 'public', 'content', lang, `${slug}.md`);
        return await fs.readFile(filePath, 'utf-8');
    } catch {
        return '';
    }
}

export default async function DocDetailPage(
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const meta = DOC_META[slug];

    // Read both language versions at build time — no client-side fetch needed
    const [contentEn, contentVi] = await Promise.all([
        readMarkdown('en', slug),
        readMarkdown('vi', slug),
    ]);

    const hasContent = contentEn.length > 0 || contentVi.length > 0;

    return (
        <DocContent
            slug={slug}
            contentEn={contentEn}
            contentVi={contentVi}
            hasContent={hasContent}
            meta={meta ? {
                title: meta.title,
                category: meta.category,
                categoryIcon: meta.categoryIcon,
            } : null}
        />
    );
}
