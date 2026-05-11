import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // React Compiler rules (react-hooks v7) that produce false positives for
      // the common async-load-in-effect pattern and inline JSX sub-trees.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/static-components': 'off',
      // Context files legitimately export both the context object and the
      // consumer hook — fast-refresh warning is not actionable here.
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
])
