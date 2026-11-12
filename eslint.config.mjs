import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import { defineConfig } from 'eslint/config';
export default defineConfig({
  files: [
    'src/components/botanical/**/*.{ts,mjs}',
    'scripts/{verify-brass-review,record-botanical-review}.mjs',
    'tests/brass-journey.test.mjs',
    'tests/botanical-browser/*.ts',
  ],
  extends: [js.configs.recommended, ...tseslint.configs.recommended],
  languageOptions: { globals: { ...globals.browser, ...globals.node } },
});
