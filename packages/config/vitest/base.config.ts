import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'packages/**/*.test.ts',
      'apps/api/src/**/*.test.ts',
      // Worker chứa pipeline AI — phần logic phức tạp nhất repo — mà trước đây nằm
      // ngoài glob nên không test nào chạm tới.
      'apps/worker/src/**/*.test.ts',
      // Logic thuần ở web (parser, helper) — không render component, không cần jsdom.
      'apps/web/src/**/*.test.ts',
    ],
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
});
