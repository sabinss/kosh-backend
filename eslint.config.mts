import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';

export default defineConfig([
    // 1. Global JS & TS recommended rules
    {
        files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
        plugins: { js },
        extends: ['js/recommended'],
    },

    // 2. Base TypeScript recommended config
    ...tseslint.configs.recommendedTypeChecked,

    // 3. Environment & Parser Options (Crucial for Node.js + Type-aware rules)
    {
        languageOptions: {
            globals: {
                ...globals.node, // Switched from browser to Node.js environment
            },
            parserOptions: {
                project: true, // Enables type-aware linting using your tsconfig.json
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            // --- Senior Node.js & TypeScript Safety Rules ---

            // Forces you to handle or await every promise (prevents unhandled rejections)
            '@typescript-eslint/no-floating-promises': 'error',

            // Disallows awaiting values that are not promises
            '@typescript-eslint/await-thenable': 'error',

            // Bans the 'any' type to enforce strong typing
            '@typescript-eslint/no-explicit-any': 'error',

            // Flags redundant type checks that are always true/false
            '@typescript-eslint/no-unnecessary-condition': 'warn',

            // --- Clean Code & Operations ---

            // Discourages console.log in favor of structured loggers (Pino/Winston)
            'no-console': ['warn', { allow: ['warn', 'error'] }],

            // Enforces const for variables that never change
            'prefer-const': 'error',
            // add dot notation for object properties
            'dot-notation': 'error',

            // Unused variables should error out, but allow leading underscores for ignored args
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],
        },
    },

    // 4. Exclude build artifacts and config files from strict type-checking if needed
    {
        ignores: ['dist/**', 'node_modules/**', 'build/**'],
    },
]);
