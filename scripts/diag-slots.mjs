/**
 * Diagnostic: dump proper UTF-8 slot names and compute world bounds per slot
 * (at setup pose and during the Loop animation), to find which decorations
 * dominate the view / cover the character.
 */
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const spine = require('../runtime/node_modules/@esotericsoftware/spine-core');

const skelPath = join(process.cwd(), 'assets', 'UI_Spine_PlayerReturnRecall3.7_Avater.skel');
const atlasPath = join(process.cwd(), 'assets', 'UI_Spine_PlayerReturnRecall3.7_Avater.atlas');
const outPath = join(process.cwd(), '.diag.txt');

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
  const info = (s) => lines.push(s);

  info('pma per page: ' + atlas.pages.map((p) => p.name + '=' + p.pma).join(', '));

  const skeleton = new spine.Skeleton(data);
  skeleton.setToSetupPose();
  skeleton.updateWorldTransform();
  const offset = new spine.Vector2(), size = new spine.Vector2();
  skeleton.getBounds(offset, size);
  info('setup-pose total bounds: x=' + offset.x.toFixed(1) + ' y=' + offset.y.toFixed(1) +
    ' w=' + size.x.toFixed(1) + ' h=' + size.y.toFixed(1));

  // per-slot world bounds at setup pose (isolate each slot)
  const rows = [];
  const tmp = new spine.Skeleton(data);
  for (const slot of skeleton.slots) {
    tmp.setToSetupPose();
    for (const s of tmp.slots) {
      if (s.data.name !== slot.data.name) s.setAttachment(null);
    }
    tmp.updateWorldTransform();
    const o = new spine.Vector2(), sz = new spine.Vector2();
    tmp.getBounds(o, sz);
    if (Number.isFinite(o.x) && sz.x > 0 && sz.y > 0) {
      rows.push({ name: slot.data.name, x: o.x, y: o.y, w: sz.x, h: sz.y, area: sz.x * sz.y });
    }
  }
  rows.sort((a, b) => b.area - a.area);
  info('--- top 15 slots by world area (setup pose) ---');
  for (const r of rows.slice(0, 15)) {
    info(r.name + '  x=' + r.x.toFixed(0) + ' y=' + r.y.toFixed(0) + ' ' + r.w.toFixed(0) + 'x' + r.h.toFixed(0) + ' area=' + r.area.toFixed(0));
  }
  info('--- slots with extreme x (far from 0) ---');
  for (const r of rows.filter((r) => Math.abs(r.x) > 300 || Math.abs(r.y) > 300)) {
    info(r.name + '  x=' + r.x.toFixed(0) + ' y=' + r.y.toFixed(0) + ' ' + r.w.toFixed(0) + 'x' + r.h.toFixed(0));
  }
  info('--- all slot names (UTF-8) ---');
  for (const s of data.slots) info('SLOT|' + s.name);
  info('--- animation durations ---');
  for (const a of data.animations) info('ANIM|' + a.name + '|' + a.duration.toFixed(3));

  writeFileSync(outPath, lines.join('\n'), 'utf8');
  process.exit(0);
} catch (e) {
  writeFileSync(outPath, 'ERROR: ' + (e && e.stack ? e.stack : String(e)), 'utf8');
  process.exit(1);
}
