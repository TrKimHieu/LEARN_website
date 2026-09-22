/**
 * Entry shim tại root — ESLint flat config phải được phát hiện ở cwd repo.
 * Toàn bộ cấu hình thật nằm ở packages/config/eslint/config.mjs.
 */
export { default } from './packages/config/eslint/config.mjs';
