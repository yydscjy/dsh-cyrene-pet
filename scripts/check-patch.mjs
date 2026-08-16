/**
 * Validate the profile cordis.patch.yml parses as a YAML array (the same
 * shape the dsh loader expects), using the js-yaml shipped with the harness.
 */
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const yaml = require('D:/nodejs/node_cache/_npx/1e7f6d9597241db0/node_modules/js-yaml');

const patchFile = join(process.env.DSH_HOME || 'C:\\Users\\Administrator\\.dsh', 'profiles', 'web', 'cordis.patch.yml');
const outPath = join(process.cwd(), '.patchcheck.txt');

try {
  const text = readFileSync(patchFile, 'utf8');
  const doc = yaml.load(text);
  const isArray = Array.isArray(doc);
  const lines = [];
  lines.push('parse OK, isArray=' + isArray + ', items=' + (isArray ? doc.length : 'n/a'));
  lines.push('content:');
  lines.push(text);
  writeFileSync(outPath, lines.join('\n'), 'utf8');
  process.exit(isArray ? 0 : 1);
} catch (e) {
  writeFileSync(outPath, 'YAML ERROR: ' + (e && e.message ? e.message : String(e)) + '\n', 'utf8');
  process.exit(1);
}
