/**
 * Migrate the live dsh profile install from @cyrene/dsh-pet to
 * @linxin666/dsh-cyrene-pet: copy the renamed package in, rename the patch
 * row, remove the old manual install.
 */
import { mkdirSync, copyFileSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dshHome = process.env.DSH_HOME || join(process.env.USERPROFILE || 'C:\\Users\\Administrator', '.dsh');
const target = join(dshHome, 'profiles', 'node_modules', '@linxin666', 'dsh-cyrene-pet');
const oldTarget = join(dshHome, 'profiles', 'node_modules', '@cyrene', 'dsh-pet');
const patchFile = join(dshHome, 'profiles', 'web', 'cordis.patch.yml');
const log = [];

try {
  mkdirSync(join(target, 'lib'), { recursive: true });
  mkdirSync(join(target, 'assets'), { recursive: true });
  for (const f of ['package.json', 'cordis.patch.yml', 'lib/index.js', 'lib/invariant.js', 'lib/client.js']) {
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

  // rename the patch row
  let yaml = readFileSync(patchFile, 'utf8');
  const fixed = yaml.replace(/name: '@cyrene\/dsh-pet'/g, "name: '@linxin666/dsh-cyrene-pet'");
  if (fixed !== yaml) {
    writeFileSync(patchFile, fixed, 'utf8');
    log.push('patch: renamed row to @linxin666/dsh-cyrene-pet');
  } else {
    log.push('patch: no old name found (already renamed?)');
  }

  // remove the old manual install
  if (existsSync(oldTarget)) {
    rmSync(oldTarget, { recursive: true, force: true });
    log.push('removed old @cyrene/dsh-pet');
  } else {
    log.push('old @cyrene/dsh-pet not present');
  }

  log.push('OK');
  writeFileSync(join(root, '.migrate.log'), log.join('\n') + '\n', 'utf8');
  process.exit(0);
} catch (e) {
  log.push('ERROR: ' + (e && e.stack ? e.stack : String(e)));
  writeFileSync(join(root, '.migrate.log'), log.join('\n') + '\n', 'utf8');
  process.exit(1);
}
