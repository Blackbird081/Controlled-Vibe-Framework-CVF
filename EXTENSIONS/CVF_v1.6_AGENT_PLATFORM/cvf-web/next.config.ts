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
  webpack(config, { isServer }) {
    // serverExternalPackages only externalizes packages imported from this app. The lineage journal store lives in
    // CVF_EXECUTION_PLANE_FOUNDATION and requires better-sqlite3 from there, so webpack bundled the native package and its
    // `bindings` lookup failed at runtime (every journal operation became UNAVAILABLE in `next start`). Keep it external.
    if (isServer) {
      const externals = Array.isArray(config.externals) ? config.externals : config.externals ? [config.externals] : [];
      config.externals = [...externals, { 'better-sqlite3': 'commonjs better-sqlite3' }];
    }
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
};

export default nextConfig;
