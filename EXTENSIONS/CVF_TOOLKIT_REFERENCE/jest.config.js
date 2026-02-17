/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/__tests__'],
    testMatch: ['**/*.test.ts'],
    moduleNameMapper: {
        '^@core/(.*)$': '<rootDir>/02_TOOLKIT_CORE/$1',
        '^@adapters/(.*)$': '<rootDir>/03_ADAPTER_LAYER/$1',
        '^@extensions/(.*)$': '<rootDir>/04_EXTENSION_LAYER/$1',
        '^@providers/(.*)$': '<rootDir>/07_AI_PROVIDER_ABSTRACTION/$1'
    },
    collectCoverageFrom: [
        '02_TOOLKIT_CORE/**/*.ts',
        '!02_TOOLKIT_CORE/**/*.spec.md',
        '!02_TOOLKIT_CORE/interfaces.ts'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov'],
    verbose: true
}
