/**
 * Install @yydscjy/dsh-cyrene-pet into the dsh web profile:
 *   1. copy package.json / lib / assets into $DSH_HOME\profiles\node_modules\@yydscjy\dsh-cyrene-pet
 *   2. add the plugin row to $DSH_HOME\profiles\web\cordis.patch.yml (idempotent)
 *   3. write .install.log in the workspace with the outcome
 */
import { mkdirSync, copyFileSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dshHome = process.env.DSH_HOME || join(process.env.USERPROFILE || 'C:\\Users\\Administrator', '.dsh');
const target = join(dshHome, 'profiles', 'node_modules', '@yydscjy', 'dsh-cyrene-pet');
const patchFile = join(dshHome, 'profiles', 'web', 'cordis.patch.yml');
const log = [];

try {
  // 1. copy package files
  mkdirSync(join(target, 'lib'), { recursive: true });
  mkdirSync(join(target, 'assets'), { recursive: true });
  for (const f of ['package.json', 'lib/index.js', 'lib/invariant.js', 'lib/client.js']) {
    copyFileSync(join(root, f), join(target, f));
    log.push('copied ' + f);
  }
  const assets = [
    'UI_Spine_PlayerReturnRecall3.7_Avater.skel',
    'UI_Spine_PlayerReturnRecall3.7_Avater.atlas',
    'UI_Spine_PlayerReturnRecall3.7_Avater.png',
    'UI_Spine_PlayerReturnRecall3.7_Avater_2.png',
  ];
  for (const a of assets) {
    copyFileSync(join(root, 'assets', a), join(target, 'assets', a));
    log.push('copied assets/' + a);
  }

  // 2. patch cordis.patch.yml (idempotent, always valid YAML)
  const COMMENT_HEADER = [
    '# Your patch layer for this dsh profile, applied after every bundle layer:',
    '# a top-level YAML array of loader patch entries (id-targeted config',
    '# overrides, disables, and insert lists; `!!js` expressions allowed).',
  ].join('\n');
  const ENTRY = "- insert:\n    - id: cyrene-pet\n      name: '@yydscjy/dsh-cyrene-pet'\n";

  let yaml = existsSync(patchFile) ? readFileSync(patchFile, 'utf8') : '';
  if (yaml.includes('cyrene-pet')) {
    log.push('patch: cyrene-pet already present, skipped');
  } else {
    // Strip a lone empty flow-array line ("[]") 閳?appending after it is
    // invalid YAML (a flow sequence cannot be followed by more list items).
    const cleaned = yaml.replace(/^\[\s*\]\s*$/m, '').trimEnd();
    const body = cleaned.length ? cleaned + '\n' : COMMENT_HEADER + '\n';
    const newYaml = body + ENTRY;
    writeFileSync(patchFile, newYaml, 'utf8');
    log.push('patch: added cyrene-pet row to ' + patchFile);
  }

  log.push('OK');
  writeFileSync(join(root, '.install.log'), log.join('\n') + '\n', 'utf8');
  process.exit(0);
} catch (e) {
  log.push('ERROR: ' + (e && e.stack ? e.stack : String(e)));
  writeFileSync(join(root, '.install.log'), log.join('\n') + '\n', 'utf8');
  process.exit(1);
}

