import { defineConfig } from 'vitest/config';

// Module-local offline runner, independent of default Web setup and local-env/provider loaders.
export default defineConfig({
    test: {
        environment: 'node',
        setupFiles: [],
        include: ['src/lib/server/law-readout-pilot.offline.test.ts'],
        testTimeout: 5000,
    },
});
