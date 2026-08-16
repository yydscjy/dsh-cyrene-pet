/**
 * Load a Spine .skel binary with the downloaded runtime and print the
 * skeleton's animation, skin, and slot names. Used to (a) verify the runtime
 * can parse the model and (b) design the harness-event -> animation mapping.
 */
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const spine = require('../runtime/node_modules/@esotericsoftware/spine-core');

const skelPath = join(process.cwd(), 'assets', 'UI_Spine_PlayerReturnRecall3.7_Avater.skel');
const outPath = join(process.cwd(), '.animations.txt');

try {
  const data = readFileSync(skelPath);
  const atlasText = readFileSync(join(process.cwd(), 'assets', 'UI_Spine_PlayerReturnRecall3.7_Avater.atlas'), 'utf8');
  const atlas = new spine.TextureAtlas(atlasText);
  // Fake texture: parsing only needs image width/height for uv math.
  class FakeTexture extends spine.Texture {
    getImage() { return { width: 2048, height: 2048 }; }
    setFilters() {}
    setWraps() {}
    dispose() {}
  }
  for (const page of atlas.pages) page.setTexture(new FakeTexture());
  const atlasLoader = new spine.AtlasAttachmentLoader(atlas);
  const binary = new spine.SkeletonBinary(atlasLoader);
  const skeletonData = binary.readSkeletonData(data);
  const lines = [];
  lines.push('skeleton version: ' + skeletonData.version);
  lines.push('animations (' + skeletonData.animations.length + '):');
  for (const a of skeletonData.animations) lines.push('  ' + a.name);
  lines.push('skins (' + skeletonData.skins.length + '):');
  for (const s of skeletonData.skins) lines.push('  ' + s.name);
  lines.push('slots (' + skeletonData.slots.length + '):');
  for (const s of skeletonData.slots) lines.push('  ' + s.name);
  lines.push('bones (' + skeletonData.bones.length + '):');
  for (const b of skeletonData.bones) lines.push('  ' + b.name);
  writeFileSync(outPath, lines.join('\n'), 'utf8');
  process.exit(0);
} catch (e) {
  writeFileSync(outPath, 'ERROR: ' + (e && e.stack ? e.stack : String(e)), 'utf8');
  process.exit(1);
}
