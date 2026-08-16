/**
 * Build the browser client bundle with rollup (pure JS, no child processes):
 * bundle src/client.js (React overlay + spine-player runtime) into
 * lib/client.js, wrapped in the `window.__ModuleLoader__.load({id, factory})`
 * handoff the DSH client module system expects.
 */
import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const { rollup } = require('../runtime/node_modules/rollup');
const { nodeResolve } = require('../runtime/node_modules/@rollup/plugin-node-resolve');

const PROLOGUE = [
  'window.__ModuleLoader__.load({',
  '  id: "@yydscjy/dsh-cyrene-pet",',
  '  factory: (require) => {',
  '    var module = { exports: {} };',
  '    var exports = module.exports;',
  '    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });',
].join('\n');

const EPILOGUE = [
  '    return module.exports;',
  '  }',
  '});',
].join('\n');

mkdirSync(join(process.cwd(), 'lib'), { recursive: true });

const bundle = await rollup({
  input: join(process.cwd(), 'src', 'client.js'),
  plugins: [
    nodeResolve({
      moduleDirectories: [join(process.cwd(), 'runtime', 'node_modules')],
    }),
  ],
  external: ['react'],
  onwarn: () => {}, // silence non-fatal warnings
});

await bundle.write({
  file: join(process.cwd(), 'lib', 'client.js'),
  format: 'cjs',
  banner: PROLOGUE,
  footer: EPILOGUE,
});

await bundle.close();

writeFileSync(
  join(process.cwd(), '.build.log'),
  'build ok: ' + new Date().toISOString() + '\n',
  'utf8',
);
