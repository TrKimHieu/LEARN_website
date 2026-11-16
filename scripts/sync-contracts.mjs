import { createHash } from 'node:crypto';
import { readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

// Inspect bounded npm tar bytes without extracting or running untrusted package code.
function packageMetadata(bytes) {
  const tar = gunzipSync(bytes, { maxOutputLength: 50 * 1024 * 1024 });
  const files = new Map();
  for (let offset = 0; offset + 512 <= tar.length;) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every((b) => b === 0)) break;
    const name = header.subarray(0, 100).toString('utf8').replace(/\0.*$/s, '');
    const sizeText = header.subarray(124, 136).toString('ascii').replace(/\0.*$/s, '').trim();
    if (!/^[0-7]+$/.test(sizeText)) throw new Error('Invalid artifact tar size.');
    const size = parseInt(sizeText, 8);
    const start = offset + 512;
    if (start + size > tar.length) throw new Error('Truncated artifact tar.');
    if (files.has(name)) throw new Error('Duplicate artifact entry.');
    files.set(name, tar.subarray(start, start + size));
    offset = start + Math.ceil(size / 512) * 512;
  }
  const meta = files.get('package/package.json');
  if (!meta || !files.has('package/dist/index.js') || !files.has('package/dist/index.d.ts')) {
    throw new Error('Artifact must contain compiled JS, declarations and package metadata.');
  }
  return JSON.parse(meta.toString('utf8'));
}

export async function syncContracts({ root, source }) {
  const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  const pin = manifest.dependencies?.['@learn/api-contracts'];
  const match = /^file:vendor\/(learn-api-contracts-((\d+)\.\d+\.\d+)\.tgz)$/.exec(pin ?? '');
  if (!match) throw new Error('Contracts must pin a versioned vendor artifact.');
  const [, filename, version, major] = match;
  if (major !== '1') throw new Error('Unsupported contracts major; review compatibility before upgrading.');
  const checksums = JSON.parse(await readFile(join(root, 'vendor/checksums.json'), 'utf8'));
  const expected = checksums[filename];
  if (!/^[a-f0-9]{64}$/.test(expected ?? '')) throw new Error('Missing trusted SHA-256 for pinned artifact.');
  const target = join(root, 'vendor', filename);
  const bytes = await readFile(source ? resolve(source) : target);
  if (bytes.length > 10 * 1024 * 1024) throw new Error('Contracts artifact too large.');
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  if (sha256 !== expected) throw new Error('Contracts SHA-256 mismatch.');
  const meta = packageMetadata(bytes);
  if (meta.name !== '@learn/api-contracts' || meta.version !== version) {
    throw new Error('Contracts artifact identity/version mismatch.');
  }
  if (meta.main !== './dist/index.js' || meta.types !== './dist/index.d.ts') {
    throw new Error('Unsupported contracts artifact entry points.');
  }
  if (source && resolve(source) !== resolve(target)) {
    const temp = join(dirname(target), `.${basename(target)}.${process.pid}.tmp`);
    try {
      await writeFile(temp, bytes, { flag: 'wx' });
      await rename(temp, target);
    } finally { await unlink(temp).catch((error) => { if (error.code !== 'ENOENT') throw error; }); }
  }
  return { version, sha256 };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 2 || args[0] !== '--source')) {
    console.error('Usage: npm run sync:contracts -- [--source /path/to/released.tgz]');
    process.exitCode = 1;
  } else {
    try {
      const result = await syncContracts({ root: resolve(dirname(fileURLToPath(import.meta.url)), '..'), source: args[1] });
      console.log(`Verified @learn/api-contracts ${result.version} SHA-256 ${result.sha256}`);
    } catch (error) { console.error(error.message); process.exitCode = 1; }
  }
}
