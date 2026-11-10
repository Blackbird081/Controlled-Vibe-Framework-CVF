import path from 'node:path';
import fs from 'node:fs';
import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
];

const runtimeTsconfig = process.env.CVF_NEXT_TSCONFIG_PATH;
if (runtimeTsconfig) {
  if (!/^tsconfig\.cvf-runtime-[a-f0-9]{32}\.json$/.test(runtimeTsconfig)) {
    throw new Error('CVF_NEXT_TSCONFIG_PATH_INVALID');
  }
  const configFile = path.join(__dirname, runtimeTsconfig);
  const info = fs.lstatSync(configFile);
  if (!info.isFile() || info.isSymbolicLink() || info.nlink !== 1) {
    throw new Error('CVF_NEXT_TSCONFIG_FILE_INVALID');
  }
}

const nextConfig: NextConfig = {
  ...(runtimeTsconfig ? { typescript: { tsconfigPath: runtimeTsconfig } } : {}),
  distDir: process.env.NEXT_DIST_DIR || '.next',
  outputFileTracingRoot: path.resolve(__dirname, '../../..'),
  serverExternalPackages: ['better-sqlite3', 'typescript'],
  transpilePackages: [
    'cvf-guard-contract',
    'cvf-control-plane-foundation',
    'cvf-learning-plane-foundation',
    'cvf-refinery',
    'cvf-truth-kernel',
    'cvf-truth-flow',
    'cvf-model-gateway',
  ],
  turbopack: {
    // TypeScript ESM packages use explicit .js extensions in their internal
    // imports. Turbopack must try .ts/.tsx before .js when transpiling LPF.
    resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
  webpack(config) {
    config.resolve.modules = [...(config.resolve.modules ?? ['node_modules']), path.resolve(__dirname, 'node_modules')];
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      '.js': ['.ts', '.tsx', '.js'],
    };
    return config;
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/',
        has: [
          {
            type: 'query',
            key: 'template',
            value: '(?<template>.+)',
          },
        ],
        destination: '/home?template=:template',
        permanent: false,
      },
      {
        source: '/',
        has: [
          {
            type: 'query',
            key: 'category',
            value: '(?<category>.+)',
          },
        ],
        destination: '/home?category=:category',
        permanent: false,
      },
      {
        source: '/',
        destination: '/landing',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
