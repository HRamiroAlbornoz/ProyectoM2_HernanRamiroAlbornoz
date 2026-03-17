import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        include: ['tests/**/*.test.js'],
        reporter: 'verbose',
        coverage: {
            provider: 'v8',
            include: ['routes/**/*.js'],
            exclude: ['db/**', 'node_modules/**'],
        },
    },
});