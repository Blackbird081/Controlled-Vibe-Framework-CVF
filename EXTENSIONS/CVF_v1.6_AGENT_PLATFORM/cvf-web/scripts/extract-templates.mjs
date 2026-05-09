/**
 * Script: Extract templates from templates.ts into JSON.
 * Run: node scripts/extract-templates.mjs
 *
 * Creates public/data/templates.json from the compiled templates.
 */
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

async function main() {
    // Dynamic import of the compiled templates
    // We need to build first, or use tsx
    const { templates } = await import('../src/lib/templates.ts');

    // Group by category
    const byCategory = {};
    for (const t of templates) {
        const cat = t.category || 'other';
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(t);
    }

    // Write full templates file
    const outDir = path.join(rootDir, 'public', 'data');
    mkdirSync(outDir, { recursive: true });

    writeFileSync(
        path.join(outDir, 'templates.json'),
        JSON.stringify(templates, null, 2),
        'utf-8'
    );

    // Write per-category files
    for (const [cat, catTemplates] of Object.entries(byCategory)) {
        writeFileSync(
            path.join(outDir, `templates-${cat}.json`),
            JSON.stringify(catTemplates, null, 2),
            'utf-8'
        );
    }

    console.log(`✅ Exported ${templates.length} templates to ${outDir}`);
    console.log(`   Categories: ${Object.keys(byCategory).join(', ')}`);
    for (const [cat, arr] of Object.entries(byCategory)) {
        console.log(`   ${cat}: ${arr.length} templates`);
    }
}

main().catch(console.error);
