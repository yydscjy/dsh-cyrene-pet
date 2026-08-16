/**
 * Module-level smoke test for the built client bundle: simulate the DSH
 * client module system (window.__ModuleLoader__), evaluate the bundle, then
 * materialize the factory with stubbed require/document to verify it exports
 * the expected { apply, inject } shape without throwing.
 */
const fs = require('fs');
const path = require('path');

const out = path.join(process.cwd(), '.smoke.txt');
const bundle = fs.readFileSync(path.join(process.cwd(), 'lib', 'client.js'), 'utf8');

const loaded = [];
global.window = {
  __ModuleLoader__: { load: (h) => loaded.push(h) },
};
const docStub = {
  querySelector: () => null,
  createElement: () => ({ dataset: {}, style: {}, setAttribute() {}, appendChild() {}, }),
  head: { appendChild: () => {} },
};
global.document = docStub;

const reactStub = {
  createElement: () => null,
  Fragment: null,
  useState: () => [undefined, () => {}],
  useEffect: () => {},
  useRef: () => ({ current: null }),
  useMemo: (f) => f(),
  useCallback: (f) => f,
  useSyncExternalStore: () => null,
};
const requireStub = (spec) => {
  if (spec === 'react') return reactStub;
  return {};
};

const result = [];
try {
  // Execute the bundle: registers the handoff on window.__ModuleLoader__.
  (0, eval)(bundle);
  result.push('load calls: ' + loaded.length);
  if (loaded.length !== 1) throw new Error('expected exactly one load() call');
  const handoff = loaded[0];
  result.push('id: ' + handoff.id);
  result.push('factory type: ' + typeof handoff.factory);
  const exportsObj = handoff.factory(requireStub);
  result.push('exports keys: ' + Object.keys(exportsObj).sort().join(','));
  result.push('inject: ' + JSON.stringify(exportsObj.inject));
  result.push('apply type: ' + typeof exportsObj.apply);
  fs.writeFileSync(out, result.join('\n'), 'utf8');
  process.exit(0);
} catch (e) {
  fs.writeFileSync(out, 'ERROR: ' + (e && e.stack ? e.stack : String(e)), 'utf8');
  process.exit(1);
}
