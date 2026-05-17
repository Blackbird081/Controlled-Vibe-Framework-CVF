/**
 * CSV loader — parse skills_index.csv and skill_reasoning.csv.
 * Pure Node.js, no dependencies.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function parseCSV(text) {
  const lines = text.split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === '"') {
        if (inQuotes && j + 1 < line.length && line[j + 1] === '"') {
          current += '"';
          j++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    values.push(current);

    const row = {};
    for (let h = 0; h < headers.length; h++) {
      row[headers[h]] = (values[h] || '').trim();
    }
    if (row[headers[0]]) records.push(row);
  }

  return records;
}

export function loadSkillsIndex(customPath = null) {
  const dataDir = resolve(__dirname, '..', 'data');
  const filePath = customPath || resolve(dataDir, 'skills_index.csv');
  const text = readFileSync(filePath, 'utf-8');
  return parseCSV(text);
}

export function loadReasoningRules(customPath = null) {
  const dataDir = resolve(__dirname, '..', 'data');
  const filePath = customPath || resolve(dataDir, 'skill_reasoning.csv');
  const text = readFileSync(filePath, 'utf-8');
  return parseCSV(text);
}

export const DOMAIN_NAMES = {
  ai_ml_evaluation: 'AI/ML Evaluation',
  app_development: 'App Development',
  business_analysis: 'Business Analysis',
  content_creation: 'Content Creation',
  finance_analytics: 'Finance & Analytics',
  hr_operations: 'HR & Operations',
  legal_contracts: 'Legal & Contracts',
  marketing_seo: 'Marketing & SEO',
  product_ux: 'Product & UX',
  security_compliance: 'Security & Compliance',
  technical_review: 'Technical Review',
  web_development: 'Web Development',
};

export const FIELD_WEIGHTS = {
  skill_name: 3.0,
  keywords: 2.5,
  description: 2.0,
  domain: 1.5,
  phases: 1.0,
};
