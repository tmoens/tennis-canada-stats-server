// eslint.config.mjs
import typescriptEslintParser from '@typescript-eslint/parser';
import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
    {
        // Specify the files ESLint should process
        // files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
        files: ['**/*.ts', '**/*.tsx'],

        // Define the parser to understand TypeScript
        languageOptions: {
            parser: typescriptEslintParser,
            parserOptions: {
                ecmaVersion: 'latest', // Use the latest ECMAScript version
                // sourceType: 'module', // Allows for the use of imports
            },
        },

        // Extend ESLint rules with plugins
        plugins: {
            '@typescript-eslint': typescriptEslintPlugin,
            prettier: prettierPlugin,
            // import: importPlugin,
        },

        // Specify ESLint rules and configurations
        rules: {
            // General ESLint recommendations
            'no-console': 'warn',
            'no-unused-vars': 'off', // Disabled in favor of @typescript-eslint/no-unused-vars

            // TypeScript-specific rules
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-non-null-assertion': 'warn',

            // Import sorting and grouping
            // 'import/order': [
            //     'error',
            //     {
            //         'newlines-between': 'always',
            //         alphabetize: { order: 'asc', caseInsensitive: true },
            //     },
            // ],

            // Prettier configuration
            'prettier/prettier': 'error', // Ensure Prettier formatting

        },

        settings: {
        },
    },
];
