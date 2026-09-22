import { fileURLToPath } from 'node:url';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import jsxA11y from 'eslint-plugin-jsx-a11y';

/** Root của monorepo — config ở packages/config/eslint/, nên tính lại từ vị trí file. */
const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: repoRoot,
      },
    },
  },
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/build/**',
      '**/.next/**',
      '**/coverage/**',
      '**/generated/**',
      '**/next-env.d.ts',
      'apps/web/.next/**',
      'eslint.config.mjs',
      'packages/config/**',
      '**/.prettierrc.*',
      'vitest.config.ts',
      'vitest.int.config.ts',
      '**/*.config.*',
      // Mã vendor Blob Studio — nguồn gốc và bản chép vào app.
      // Xem docs/adr/006-mascot-dong-blob-studio.md
      'CircleMascot/**',
      'apps/web/src/components/mascot/CircleAvatar.tsx',
      'docs/exports/**',
      'scripts/**',
      '.github/**',
    ],
  },
  // Chỉ áp cho JSX của web app. Bắt các lỗi a11y tĩnh (thiếu alt, label không
  // gắn control, onClick trên thẻ không tương tác, aria sai) ngay lúc lint thay
  // vì để lọt tới vòng audit thủ công.
  {
    files: ['apps/web/src/**/*.tsx'],
    plugins: { 'jsx-a11y': jsxA11y },
    rules: jsxA11y.flatConfigs.recommended.rules,
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    },
  },
);
