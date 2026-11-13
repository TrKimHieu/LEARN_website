import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, cp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { syncContracts } from './sync-contracts.mjs';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Phiên bản đang ghim trong package.json, để test không phải sửa mỗi lần nâng contracts.
const pinnedSpec = JSON.parse(await readFile(join(repo, 'package.json'), 'utf8')).dependencies['@learn/api-contracts'];
const pinned = /learn-api-contracts-(\d+\.\d+\.\d+)\.tgz$/.exec(pinnedSpec)[1];
const pinnedTgz = `vendor/learn-api-contracts-${pinned}.tgz`;
async function fixture(run) {
  const root = await mkdtemp(join(tmpdir(), 'learn-contracts-'));
  try {
    await cp(join(repo, 'vendor'), join(root, 'vendor'), { recursive: true });
    await cp(join(repo, 'package.json'), join(root, 'package.json'));
    await run(root);
  } finally { await rm(root, { recursive: true, force: true }); }
}
test('validates the actual released artifact independently of backend source', () => fixture(async (root) => {
  const result = await syncContracts({ root });
  assert.equal(result.version, pinned);
}));
test('tampered and missing sources fail, keeping the previous artifact intact', () => fixture(async (root) => {
  const target = join(root, pinnedTgz);
  const before = await readFile(target);
  const bad = join(root, 'bad.tgz');
  await writeFile(bad, Buffer.from('private or damaged bytes'));
  await assert.rejects(syncContracts({ root, source: bad }), /SHA-256/);
  await assert.rejects(syncContracts({ root, source: join(root, 'missing.tgz') }), /ENOENT/);
  assert.deepEqual(await readFile(target), before);
}));
test('a checksum alone cannot hide an incompatible package version', () => fixture(async (root) => {
  const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  manifest.dependencies['@learn/api-contracts'] = 'file:vendor/learn-api-contracts-2.0.0.tgz';
  await writeFile(join(root, 'package.json'), JSON.stringify(manifest));
  await assert.rejects(syncContracts({ root }), /Unsupported contracts major/);
}));
test('source can restore the pinned artifact only after verification', () => fixture(async (root) => {
  const target = join(root, pinnedTgz);
  await writeFile(target, 'broken');
  await syncContracts({ root, source: join(repo, pinnedTgz) });
  assert.deepEqual(await readFile(target), await readFile(join(repo, pinnedTgz)));
}));
