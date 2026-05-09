#!/usr/bin/env node

import { createHmac } from 'node:crypto';
import { readFile } from 'node:fs/promises';

function parseArgs(argv) {
  const args = new Map();

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (!current.startsWith('--')) continue;
    args.set(current.slice(2), argv[index + 1]);
    index += 1;
  }

  return args;
}

function usage() {
  console.error('Usage: node tools/verify-audit-csv.mjs --file <path> --key <signing-key>');
}

function computeSignature(body, key) {
  return createHmac('sha256', key).update(body, 'utf8').digest('hex');
}

const args = parseArgs(process.argv.slice(2));
const file = args.get('file');
const key = args.get('key');

if (!file || !key) {
  usage();
  process.exit(1);
}

const raw = await readFile(file, 'utf8');
const lines = raw.split('\n');

const signatureLineIndex = lines.findIndex(line => line.startsWith('# CVF-AUDIT-SIGNATURE: '));
if (signatureLineIndex < 0) {
  console.error('FAIL: CSV does not contain a signature trailer.');
  process.exit(1);
}

const body = lines.slice(0, signatureLineIndex).join('\n');
const signatureLine = lines[signatureLineIndex];
const expectedSignature = signatureLine.split('hmac-sha256:')[1]?.trim();

if (!expectedSignature) {
  console.error('FAIL: Signature trailer is malformed.');
  process.exit(1);
}

const actualSignature = computeSignature(body, key);
if (actualSignature !== expectedSignature) {
  console.error('FAIL: Signature mismatch.');
  process.exit(1);
}

console.log('PASS: Signature verified.');
