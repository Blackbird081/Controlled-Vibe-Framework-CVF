import { resolve } from 'node:path';

export default {
  resolve: {
    alias: [
      {
        find: /^cvf-control-plane-foundation$/,
        replacement: resolve(__dirname, '../CVF_CONTROL_PLANE_FOUNDATION/src/index.ts'),
      },
      {
        find: /^cvf-guard-contract$/,
        replacement: resolve(__dirname, '../CVF_GUARD_CONTRACT/src/index.ts'),
      },
      {
        find: /^cvf-guard-contract\/(.*)$/,
        replacement: resolve(__dirname, '../CVF_GUARD_CONTRACT/src/$1'),
      },
    ],
  },
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts'],
    },
  },
};
