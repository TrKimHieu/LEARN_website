import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ESLint } from 'eslint';
import boundary from '../config/boundary-rules.mjs';

test('standalone source layout retains cross-feature import protection', async () => {
  const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: [{
    files: ['**/*.ts'], plugins: {boundary}, rules: {'boundary/no-cross-feature-import':'error'},
  }]});
  const results = await eslint.lintText("import { secret } from '@/features/other/internal';\n", {filePath:'src/features/courses/example.ts'});
  assert.equal(results[0].errorCount,1);
  const allowed = await eslint.lintText("import { shared } from '@/components/shared/example';\n", {filePath:'src/features/courses/example.ts'});
  assert.equal(allowed[0].errorCount,0);
});
