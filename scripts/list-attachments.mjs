/**
 * Enumerate attachments per slot from the default skin (correct API),
 * to see what expression material exists (mouth shapes, eye layers, ...).
 */
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const spine = require('../runtime/node_modules/@esotericsoftware/spine-core');

const skelPath = join(process.cwd(), 'assets', 'UI_Spine_PlayerReturnRecall3.7_Avater.skel');
const atlasPath = join(process.cwd(), 'assets', 'UI_Spine_PlayerReturnRecall3.7_Avater.atlas');
const outPath = join(process.cwd(), '.attachments.txt');

try {
  const atlasText = readFileSync(atlasPath, 'utf8');
  const atlas = new spine.TextureAtlas(atlasText);
  class FakeTexture extends spine.Texture {
    getImage() { return { width: 2048, height: 2048 }; }
    setFilters() {}
    setWraps() {}
    dispose() {}
  }
  for (const page of atlas.pages) page.setTexture(new FakeTexture());
  const loader = new spine.AtlasAttachmentLoader(atlas);
  const binary = new spine.SkeletonBinary(loader);
  const data = binary.readSkeletonData(readFileSync(skelPath));

  const lines = [];
  const skin = data.defaultSkin;
  const entries = skin.getAttachments();
  const bySlot = new Map();
  for (const e of entries) {
    const slotName = data.slots[e.slotIndex] ? data.slots[e.slotIndex].name : ('#' + e.slotIndex);
    if (!bySlot.has(slotName)) bySlot.set(slotName, []);
    bySlot.get(slotName).push(e.name);
  }

  lines.push('--- facial slots ---');
  const face = ['嘴', 'A眉毛', 'A眼角', 'A眼影', 'A睫毛', 'A眼白', 'A眼珠', 'A双眼皮', 'B闭眼', 'A脸', '鼻子', '发', '发  高亮', '发影子'];
  for (const f of face) {
    if (bySlot.has(f)) lines.push(f + ' (' + bySlot.get(f).length + '): ' + bySlot.get(f).join(' | '));
  }
  lines.push('--- all slots with >1 attachment ---');
  for (const [name, arr] of bySlot) {
    if (arr.length > 1) lines.push(name + ' (' + arr.length + '): ' + arr.join(' | '));
  }
  lines.push('--- total attachments: ' + entries.length + ' ---');
  writeFileSync(outPath, lines.join('\n'), 'utf8');
  process.exit(0);
} catch (e) {
  writeFileSync(outPath, 'ERROR: ' + (e && e.stack ? e.stack : String(e)), 'utf8');
  process.exit(1);
}
