module.exports = {
    env: {
        es2021: true,
        node: true,
        browser: true
    },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:prettier/recommended'
    ],
    overrides: [],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
    },
    plugins: ['@typescript-eslint', 'prettier'],
    rules: {
        'no-console': 1,
        '@typescript-eslint/no-explicit-any': 0
    }
};
