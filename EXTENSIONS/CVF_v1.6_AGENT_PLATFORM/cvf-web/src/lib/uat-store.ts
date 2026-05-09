import fs from 'fs';
import path from 'path';

type StorageMode = 'fs' | 's3';

const DEFAULT_FS_ROOT = path.resolve(process.cwd(), '../../../governance/skill-library/uat/results');
const STORAGE_MODE: StorageMode = (process.env.CVF_UAT_STORAGE as StorageMode) || 'fs';
const FS_ROOT = process.env.CVF_UAT_ROOT ? path.resolve(process.env.CVF_UAT_ROOT) : DEFAULT_FS_ROOT;

// S3 support: only works at runtime when @aws-sdk/client-s3 is installed
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _s3Mod: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _s3Client: any = null;

async function requireS3() {
    if (_s3Mod) return _s3Mod;
    try {
        // Use variable to prevent bundler from resolving at build time
        const pkg = '@aws-sdk/' + 'client-s3';
        _s3Mod = await (Function('p', 'return import(p)')(pkg));
        return _s3Mod;
    } catch {
        return null;
    }
}

async function getS3Client() {
    if (_s3Client) return _s3Client;
    const mod = await requireS3();
    if (!mod) return null;
    _s3Client = new mod.S3Client({
        region: process.env.AWS_REGION || process.env.CVF_UAT_S3_REGION || 'us-east-1',
    });
    return _s3Client;
}

const S3_BUCKET = process.env.CVF_UAT_S3_BUCKET || '';
const S3_PREFIX = process.env.CVF_UAT_S3_PREFIX || '';

function buildFsPath(skillId: string) {
    return path.join(FS_ROOT, `UAT-${skillId}.md`);
}

function buildS3Key(skillId: string) {
    return `${S3_PREFIX ? `${S3_PREFIX.replace(/\/?$/, '/')}` : ''}UAT-${skillId}.md`;
}

async function readFromFs(skillId: string): Promise<string> {
    const filePath = buildFsPath(skillId);
    if (!fs.existsSync(filePath)) return '';
    return fs.readFileSync(filePath, 'utf-8');
}

async function writeToFs(skillId: string, content: string): Promise<string> {
    const filePath = buildFsPath(skillId);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const tmpPath = `${filePath}.tmp-${Date.now()}`;
    fs.writeFileSync(tmpPath, content, 'utf-8');
    fs.renameSync(tmpPath, filePath);
    return filePath;
}

async function readFromS3(skillId: string): Promise<string> {
    const client = await getS3Client();
    if (!client) return '';
    try {
        const mod = await requireS3();
        const key = buildS3Key(skillId);
        const resp = await client.send(new mod.GetObjectCommand({
            Bucket: S3_BUCKET,
            Key: key,
        }));
        const body = await resp.Body?.transformToString();
        return body || '';
    } catch {
        return '';
    }
}

async function writeToS3(skillId: string, content: string): Promise<string> {
    const client = await getS3Client();
    if (!client) throw new Error('S3 client not configured');
    const mod = await requireS3();
    const key = buildS3Key(skillId);
    await client.send(new mod.PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: content,
        ContentType: 'text/markdown',
    }));
    return `s3://${S3_BUCKET}/${key}`;
}

export async function loadUat(skillId: string): Promise<string> {
    if (STORAGE_MODE === 's3') {
        const content = await readFromS3(skillId);
        if (content) return content;
        // fallback to fs if exists
        return readFromFs(skillId);
    }
    return readFromFs(skillId);
}

export async function saveUat(skillId: string, content: string): Promise<string> {
    if (STORAGE_MODE === 's3') {
        return writeToS3(skillId, content);
    }
    return writeToFs(skillId, content);
}
