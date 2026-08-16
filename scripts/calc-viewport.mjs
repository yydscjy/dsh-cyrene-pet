/**
 * Compute the world-space viewport that frames the character with the
 * swing/sparkle decoration slots hidden, per animation (union over time
 * steps). Output the rect to hardcode as the spine-player viewport config.
 */
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const spine = require('../runtime/node_modules/@esotericsoftware/spine-core');

const skelPath = join(process.cwd(), 'assets', 'UI_Spine_PlayerReturnRecall3.7_Avater.skel');
const atlasPath = join(process.cwd(), 'assets', 'UI_Spine_PlayerReturnRecall3.7_Avater.atlas');
const outPath = join(process.cwd(), '.viewport.txt');

const HIDDEN = new Set([
  '秋千-左','秋千-左2','秋千-左3','秋千-左4','秋千-右','秋千-右2','秋千-右3','秋千-右4',
  '秋千绳-左','秋千绳-右','秋千绳-右2','右秋千光1','右秋千光2','左秋千光1','左秋千光2',
  '右光点','右光点2','左光点','左光点2','小星星','银白叶子','银白叶子-光','右带子','右带子发光','左带子','左带子发光',
]);

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
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

  for (const anim of data.animations) {
    const skeleton = new spine.Skeleton(data);
    const state = new spine.AnimationState(new spine.AnimationStateData(data));
    state.setAnimation(0, anim.name, true);
    const steps = 100;
    const dt = anim.duration / steps;
    for (let i = 0; i < steps; i++) {
      state.update(dt);
      state.apply(skeleton);
      skeleton.updateWorldTransform();
      // hide decorations after the pose is applied
      for (const slot of skeleton.slots) {
        if (HIDDEN.has(slot.data.name) && slot.attachment != null) slot.setAttachment(null);
      }
      skeleton.updateWorldTransform();
      const o = new spine.Vector2(), sz = new spine.Vector2();
      skeleton.getBounds(o, sz);
      if (Number.isFinite(o.x) && sz.x > 0) {
        minX = Math.min(minX, o.x); maxX = Math.max(maxX, o.x + sz.x);
        minY = Math.min(minY, o.y); maxY = Math.max(maxY, o.y + sz.y);
      }
    }
    lines.push('anim ' + anim.name + ' dur=' + anim.duration.toFixed(2) + 's');
  }

  const w = maxX - minX, h = maxY - minY;
  lines.push('RESULT x=' + minX.toFixed(1) + ' y=' + minY.toFixed(1) + ' w=' + w.toFixed(1) + ' h=' + h.toFixed(1));
  lines.push('CENTER x=' + ((minX + maxX) / 2).toFixed(1) + ' y=' + ((minY + maxY) / 2).toFixed(1));
  writeFileSync(outPath, lines.join('\n'), 'utf8');
  process.exit(0);
} catch (e) {
  writeFileSync(outPath, 'ERROR: ' + (e && e.stack ? e.stack : String(e)), 'utf8');
  process.exit(1);
}
