/**
 * @cyrene/dsh-pet — browser half.
 *
 * A Spine desk pet (Q版昔涟 Avatar) that floats over the whole app
 * (`shell.overlay`), driven by the current conversation snapshot:
 *   - Loop animation plays continuously; FadeIn plays as entrance / on click.
 *   - Mood (idle / thinking / working / asking / error) changes playback
 *     speed and overlays effects (attention pulse, error tint).
 *   - A speech bubble surfaces usage, tool activity, and permission requests;
 *     pending approvals/questions get inline quick-answer buttons.
 *   - Drag to move; double-click toggles a token-usage HUD.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { SpinePlayer, Skeleton, AnimationState, AnimationStateData, Vector2 } from '@esotericsoftware/spine-player';

const PET_ID = 'cyrene-pet';
const ASSET_BASE = '/pet-assets/';
const SKEL_URL = ASSET_BASE + 'UI_Spine_PlayerReturnRecall3.7_Avater.skel';
const ATLAS_URL = ASSET_BASE + 'UI_Spine_PlayerReturnRecall3.7_Avater.atlas';
const STORE_KEY = 'cyrene-pet-pos';

/* ------------------------------------------------------------------ */
/* module-scope CSS (injected once, DSH style-tag convention)          */
/* ------------------------------------------------------------------ */
const css = `
.cyrene-pet-host{position:fixed;z-index:9999;pointer-events:auto;user-select:none;cursor:grab;touch-action:none;filter:drop-shadow(0 10px 24px rgba(140,40,80,.35))}
.cyrene-pet-host.dragging{cursor:grabbing;filter:none}
.cyrene-pet-canvas{position:relative;width:300px;height:390px;pointer-events:none}
.cyrene-pet-canvas .spine-player,.cyrene-pet-canvas .spine-player-canvas{width:100%;height:100%}
.cyrene-pet-bubble{position:absolute;left:50%;bottom:calc(100% + 6px);transform:translateX(-50%);min-width:180px;max-width:340px;padding:8px 12px;border-radius:14px;background:rgba(255,226,238,.96);color:#7a3350;font:12px/1.5 "Segoe UI",system-ui,sans-serif;box-shadow:0 6px 20px rgba(200,60,120,.35);border:1px solid rgba(255,140,190,.7);white-space:pre-wrap;pointer-events:auto}
.cyrene-pet-bubble::after{content:"";position:absolute;left:50%;bottom:-6px;transform:translateX(-50%);border:6px solid transparent;border-top-color:rgba(255,226,238,.96)}
.cyrene-pet-bubble .bt{display:block;font-weight:600;margin-bottom:2px;color:#d23f76}
.cyrene-pet-bubble .bb{display:block;color:#8a4060}
.cyrene-pet-actions{display:flex;gap:6px;margin-top:6px;flex-wrap:wrap}
.cyrene-pet-actions button{border:1px solid rgba(255,255,255,.5);background:rgba(210,63,118,.85);color:#fff;border-radius:8px;padding:3px 10px;font-size:12px;cursor:pointer}
.cyrene-pet-actions button:hover{background:rgba(190,45,100,.9)}
.cyrene-pet-ring{position:absolute;inset:-14px;border-radius:50%;border:3px solid rgba(255,150,195,.8);opacity:0;pointer-events:none}
.cyrene-pet-host.mood-asking .cyrene-pet-ring{animation:cyrene-pulse 1.1s ease-out infinite}
.cyrene-pet-host.mood-asking .cyrene-pet-canvas{filter:drop-shadow(0 0 18px rgba(255,150,195,.7))}
.cyrene-pet-host.mood-error .cyrene-pet-canvas{filter:drop-shadow(0 0 14px rgba(255,120,140,.5)) saturate(.85)}
.cyrene-pet-host.mood-working .cyrene-pet-canvas{filter:drop-shadow(0 0 10px rgba(140,230,180,.4))}
@keyframes cyrene-pulse{0%{transform:scale(.92);opacity:.9}100%{transform:scale(1.25);opacity:0}}
.cyrene-pet-hud{position:absolute;left:calc(100% + 10px);top:6px;min-width:190px;padding:10px 12px;border-radius:12px;background:rgba(255,226,238,.96);color:#7a3350;font:12px/1.7 "Segoe UI",system-ui,sans-serif;box-shadow:0 8px 24px rgba(200,60,120,.4);border:1px solid rgba(255,140,190,.65);pointer-events:auto;z-index:10}
.cyrene-pet-hud.left{left:auto;right:calc(100% + 10px)}
.cyrene-pet-hud h4{margin:0 0 6px;font-size:12px;color:#d23f76}
.cyrene-pet-hud .row{display:flex;justify-content:space-between;gap:12px}
.cyrene-pet-hud .row b{color:#4a1f33}
.cyrene-pet-hud .hint{color:#c05f8d;margin-top:6px;font-size:11px}
.cyrene-pet-controls{position:fixed;z-index:100000;pointer-events:auto}
.cyrene-pet-debug-btn{position:absolute;width:22px;height:22px;background:none;border:none;padding:0;color:#ff8ab8;font-size:16px;line-height:1;cursor:pointer;display:grid;place-items:center;pointer-events:auto}
.cyrene-pet-debug-btn:hover{color:#ffb3d1}
.cyrene-pet-resize{position:absolute;right:0;bottom:0;z-index:21;width:22px;height:22px;cursor:nwse-resize;pointer-events:auto;opacity:.8;background:linear-gradient(135deg,transparent 42%,rgba(255,179,209,.95) 42%,rgba(255,179,209,.95) 52%,transparent 52%),linear-gradient(135deg,transparent 68%,rgba(255,179,209,.55) 68%,rgba(255,179,209,.55) 78%,transparent 78%)}
.cyrene-pet-resize:hover{opacity:1}
.cyrene-pet-win{position:fixed;z-index:100000;width:222px;background:rgba(255,226,238,.98);border:1px solid rgba(255,140,190,.7);border-radius:12px;box-shadow:0 10px 32px rgba(200,60,120,.45);overflow:hidden;pointer-events:auto;font:12px/1.7 "Segoe UI",system-ui,sans-serif;color:#7a3350}
.cyrene-pet-win-title{display:flex;align-items:center;justify-content:space-between;padding:7px 10px;background:linear-gradient(90deg,#ffb3d1,#ff8ab8);color:#fff;font-weight:600;font-size:12px;cursor:move;user-select:none}
.cyrene-pet-win-close{background:none;border:none;color:#fff;font-size:15px;line-height:1;cursor:pointer;padding:1px 7px;border-radius:6px}
.cyrene-pet-win-close:hover{background:rgba(255,255,255,.35)}
.cyrene-pet-win-body{padding:10px 12px;max-height:62vh;overflow-y:auto}
.cyrene-pet-win-body h4{margin:0 0 4px;font-size:12px;color:#d23f76}
.cyrene-pet-win-body .sec{margin:8px 0 3px;font-size:11px;color:#c05f8d;border-top:1px solid rgba(210,63,118,.3);padding-top:5px}
.cyrene-pet-win-body label{display:flex;align-items:center;gap:6px;cursor:pointer}
.cyrene-pet-win-body label input{accent-color:#ff6fa8;cursor:pointer}
.cyrene-pet-win-body .zoomrow{display:flex;align-items:center;gap:8px;margin-top:4px}
.cyrene-pet-win-body .zoomrow input[type=range]{flex:1;cursor:pointer;min-width:0;accent-color:#ff6fa8}
.cyrene-pet-win-body .zoomrow b{min-width:38px;text-align:right;color:#7a3350}
.cyrene-pet-host.outline{outline:2px dashed rgba(255,80,80,.9);outline-offset:2px}
.cyrene-pet-host.no-glow{filter:none}
.cyrene-pet-host.no-glow .cyrene-pet-canvas{filter:none !important}
`;

let cssInjected = false;
function ensureCss() {
  if (cssInjected || typeof document === 'undefined') return;
  cssInjected = true;
  const tagId = PET_ID + '/styles';
  if (document.querySelector('style[data-plugin-css="' + tagId + '"]')) return;
  const tag = document.createElement('style');
  tag.dataset.plugin = PET_ID;
  tag.dataset.pluginCss = tagId;
  tag.textContent = css;
  document.head.appendChild(tag);
}
ensureCss();

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */
function fmt(n) {
  return n == null || Number.isNaN(n) ? '–' : Number(n).toLocaleString('en-US');
}

/** Aggregate TokenUsage across finalized assistant nodes. */
function sumUsage(nodes) {
  let input = 0, output = 0, cacheRead = 0, cacheWrite = 0, reasoning = 0, reqs = 0;
  for (const n of nodes || []) {
    if (n && n.kind === 'assistant' && n.usage) {
      const u = n.usage;
      input += u.inputTokens ?? 0;
      output += u.outputTokens ?? 0;
      cacheRead += u.cacheReadTokens ?? 0;
      cacheWrite += u.cacheWriteTokens ?? 0;
      reasoning += u.reasoningTokens ?? 0;
      reqs++;
    }
  }
  return { input, output, cacheRead, cacheWrite, reasoning, reqs };
}

/** Derive the pet mood from the conversation snapshot. */
function deriveMood(snap) {
  if (!snap) return 'idle';
  const pending = snap.pending && snap.pending.length ? snap.pending : [];
  if (pending.length) return 'asking';
  if (snap.lastAgentError) return 'error';
  if (snap.running && snap.runningCalls && snap.runningCalls.length) return 'working';
  if (snap.running || snap.partial) return 'thinking';
  return 'idle';
}

/** Human-readable summary of the first pending interaction + quick actions. */
function pendingSummary(pending) {
  const p = pending && pending[0];
  if (!p) return null;
  if (p.kind === 'approval') {
    const pl = p.payload || {};
    return {
      title: '请求权限',
      text: (pl.toolName ? '工具 ' + pl.toolName + ' 需要授权' : '需要授权') + (pl.reason ? '：' + pl.reason : ''),
      buttons: [
        { label: '允许一次', respond: () => p.respond({ ok: true, value: { sessionId: p.sessionId, approvalId: pl.approvalId, outcome: 'allowed-once' } }) },
        { label: '拒绝', respond: () => p.respond({ ok: true, value: { sessionId: p.sessionId, approvalId: pl.approvalId, outcome: 'rejected' } }) },
      ],
    };
  }
  if (p.kind === 'question') {
    const qs = (p.payload && p.payload.questions) || [];
    const q = qs[0];
    return {
      title: q && q.header ? q.header : '提问',
      text: q ? q.question : '有提问待回答',
      buttons: ((q && q.options) || []).map((opt) => ({
        label: opt.label,
        respond: () => p.respond({ ok: true, value: { sessionId: p.sessionId, answer: { answers: [{ id: q.id, selected: [opt.label] }] } } }),
      })),
    };
  }
  return null;
}

const REACTIONS = [
  '嘿嘿，点我做什么呀？',
  '我一直在看着你工作哦～',
  '要加油呀！',
  '铛铛～昔涟来啦！',
  '今天的任务也要顺顺利利！',
];

function randomReaction() {
  return REACTIONS[Math.floor(Math.random() * REACTIONS.length)];
}

/* debug layer toggles (persisted) */
const DEBUG_DEFAULTS = { canvas: true, bubble: true, hud: true, ring: true, glow: true, outline: false };
const DEBUG_ITEMS = [
  { key: 'canvas', label: '角色画布' },
  { key: 'bubble', label: '气泡' },
  { key: 'hud', label: '用量HUD' },
  { key: 'ring', label: '特效光环' },
  { key: 'glow', label: '辉光/阴影' },
  { key: 'outline', label: '容器边框' },
];
function loadDebug() {
  try {
    const raw = localStorage.getItem('cyrene-pet-debug');
    if (raw) return { ...DEBUG_DEFAULTS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEBUG_DEFAULTS };
}

/* model slot groups: hide scene-prop decorations that dwarf the character */
const MODEL_GROUPS = [
  {
    key: 'swing',
    label: '秋千+秋千光',
    slots: ['秋千-左', '秋千-左2', '秋千-左3', '秋千-左4', '秋千-右', '秋千-右2', '秋千-右3', '秋千-右4', '秋千绳-左', '秋千绳-右', '秋千绳-右2', '右秋千光1', '右秋千光2', '左秋千光1', '左秋千光2'],
  },
  {
    key: 'sparkle',
    label: '光点/星星/叶子/带子',
    slots: ['右光点', '右光点2', '左光点', '左光点2', '小星星', '银白叶子', '银白叶子-光', '右带子', '右带子发光', '左带子', '左带子发光'],
  },
  {
    key: 'sheng',
    label: '圣光(SHENG光柱)',
    slots: ['SHENG1', 'SHENG2'],
  },
  {
    key: 'halo',
    label: '光环',
    slots: ['光环', '光环发光', '光环2', '光环2发光'],
  },
  {
    key: 'skirt',
    label: '后裙摆',
    slots: ['后裙摆', '后裙摆_1', '后裙摆1', '后裙摆2', '后裙摆2发光', '后裙摆3', '后裙摆3发光', '后裙摆4', '后裙摆4发光', '后裙摆6', '后裙摆7'],
  },
];
const MODEL_HIDE_DEFAULT = { swing: true, sparkle: true, sheng: true, halo: false, skirt: false };
/* initial world viewport; recomputed dynamically whenever decorations change */
const PET_VIEWPORT = { x: -932, y: -102, width: 1879, height: 2271, padLeft: '10%', padRight: '10%', padTop: '10%', padBottom: '10%' };
function loadModelHide() {
  try {
    const raw = localStorage.getItem('cyrene-pet-modelhide');
    if (raw) return { ...MODEL_HIDE_DEFAULT, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...MODEL_HIDE_DEFAULT };
}

/* behavior toggles (persisted) */
const BEHAVIOR_DEFAULTS = { blink: true, mirror: false, hudLeft: false };
function loadBehavior() {
  try {
    const raw = localStorage.getItem('cyrene-pet-behavior');
    if (raw) return { ...BEHAVIOR_DEFAULTS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...BEHAVIOR_DEFAULTS };
}

/* Dynamic viewport: union of animation bounds over the currently-visible
 * slots. Used so the frame always contains the whole model — decorations
 * that are shown expand the frame, hidden ones shrink it. */
function computeViewport(player, hiddenSet) {
  try {
    const data = player.skeleton.data;
    const temp = new Skeleton(data);
    const state = new AnimationState(new AnimationStateData(data));
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    const anims = data.animations;
    if (!anims || !anims.length) return null;
    for (const anim of anims) {
      state.setAnimation(0, anim.name, true);
      const steps = 28;
      const dt = (anim.duration || 1) / steps;
      for (let i = 0; i < steps; i++) {
        state.update(dt);
        state.apply(temp);
        for (const slot of temp.slots) {
          if (hiddenSet.has(slot.data.name) && slot.attachment != null) slot.setAttachment(null);
        }
        temp.updateWorldTransform();
        const o = new Vector2(), sz = new Vector2();
        temp.getBounds(o, sz);
        if (Number.isFinite(o.x) && sz.x > 0 && sz.y > 0) {
          minX = Math.min(minX, o.x); maxX = Math.max(maxX, o.x + sz.x);
          minY = Math.min(minY, o.y); maxY = Math.max(maxY, o.y + sz.y);
        }
      }
    }
    if (!Number.isFinite(minX)) return null;
    const w = maxX - minX, h = maxY - minY;
    return {
      x: minX, y: minY, width: w, height: h,
      padLeft: '10%', padRight: '10%', padTop: '10%', padBottom: '10%',
    };
  } catch { return null; }
}

/* ------------------------------------------------------------------ */
/* the pet component                                                   */
/* ------------------------------------------------------------------ */
function PetOverlay({ useSessions, getSessionSource }) {
  const current = useSessions((s) => s.current);
  const source = current != null ? getSessionSource(current) : null;

  const subscribe = useCallback(
    (cb) => (source ? source.subscribe(cb) : () => {}),
    [source],
  );
  const getSnapshot = useCallback(() => (source ? source.getSnapshot() : null), [source]);
  const snap = useSyncExternalStore(subscribe, getSnapshot, () => null);

  const hostRef = useRef(null);
  const playerRef = useRef(null);
  const [player, setPlayer] = useState(null);
  const [anims, setAnims] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [pos, setPos] = useState(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p.x === 'number' && typeof p.y === 'number') return p;
      }
    } catch { /* ignore */ }
    return { x: Math.max(16, window.innerWidth - 340), y: Math.max(16, window.innerHeight - 430) };
  });
  const [dragging, setDragging] = useState(false);
  const [showHud, setShowHud] = useState(false);
  const [reaction, setReaction] = useState(null);
  const [showPanel, setShowPanel] = useState(false);
  const [winPos, setWinPos] = useState(() => {
    try {
      const raw = localStorage.getItem('cyrene-pet-winpos');
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p.x === 'number' && typeof p.y === 'number') return p;
      }
    } catch { /* ignore */ }
    return null;
  });
  const winPosRef = useRef(winPos);
  useEffect(() => { winPosRef.current = winPos; }, [winPos]);
  useEffect(() => {
    if (winPos) { try { localStorage.setItem('cyrene-pet-winpos', JSON.stringify(winPos)); } catch { /* ignore */ } }
  }, [winPos]);
  const winDragRef = useRef(null);
  const [zoom, setZoom] = useState(() => {
    try {
      const v = parseFloat(localStorage.getItem('cyrene-pet-zoom'));
      if (Number.isFinite(v) && v >= 0.5 && v <= 1.5) return v;
    } catch { /* ignore */ }
    return 1;
  });
  useEffect(() => {
    try { localStorage.setItem('cyrene-pet-zoom', String(zoom)); } catch { /* ignore */ }
  }, [zoom]);
  const zoomRef = useRef(zoom);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  const [debug, setDebug] = useState(loadDebug);
  useEffect(() => {
    try { localStorage.setItem('cyrene-pet-debug', JSON.stringify(debug)); } catch { /* ignore */ }
  }, [debug]);
  const [modelHide, setModelHide] = useState(loadModelHide);
  useEffect(() => {
    try { localStorage.setItem('cyrene-pet-modelhide', JSON.stringify(modelHide)); } catch { /* ignore */ }
  }, [modelHide]);
  const hiddenSet = useMemo(() => {
    const s = new Set();
    for (const g of MODEL_GROUPS) {
      if (modelHide[g.key]) for (const n of g.slots) s.add(n);
    }
    return s;
  }, [modelHide]);
  const hiddenRef = useRef(hiddenSet);
  useEffect(() => { hiddenRef.current = hiddenSet; }, [hiddenSet]);
  const [behavior, setBehavior] = useState(loadBehavior);
  useEffect(() => {
    try { localStorage.setItem('cyrene-pet-behavior', JSON.stringify(behavior)); } catch { /* ignore */ }
  }, [behavior]);
  const behaviorRef = useRef(behavior);
  useEffect(() => { behaviorRef.current = behavior; }, [behavior]);
  /* blink state machine (uses the B闭眼 closed-eyelid slot) */
  const blinkRef = useRef({ eyeIdx: -1, eyeAtt: null, nextAt: 0, closed: false, closedAt: 0 });
  const dragRef = useRef(null);
  const movedRef = useRef(false);

  /* mount the spine player once */
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    let disposed = false;
    const player = new SpinePlayer(host, {
      binaryUrl: SKEL_URL,
      atlasUrl: ATLAS_URL,
      animation: 'Loop',
      skin: 'default',
      alpha: true,
      premultipliedAlpha: false,
      showControls: false,
      showLoading: false,
      viewport: PET_VIEWPORT,
      success: (p) => {
        if (disposed) return;
        playerRef.current = p;
        setPlayer(p);
        const names = (p.skeleton && p.skeleton.data ? p.skeleton.data.animations : []).map((a) => a.name);
        setAnims(names);
        // init the blink slot (B闭眼)
        try {
          const sk = p.skeleton;
          const idx = sk.data.findSlotIndex('B闭眼');
          blinkRef.current.eyeIdx = idx;
          blinkRef.current.eyeAtt = idx >= 0 ? sk.getAttachment(idx, 'B闭眼') : null;
          blinkRef.current.nextAt = performance.now() + 1200 + Math.random() * 2500;
        } catch { /* ignore */ }
        if (names.includes('FadeIn')) {
          p.setAnimation('FadeIn', false);
          p.addAnimation('Loop', true);
        } else {
          p.setAnimation('Loop', true);
        }
        p.play();
      },
      error: (p, msg) => {
        if (!disposed) setLoadError(String(msg));
      },
      update: (p) => {
        const sk = p.skeleton;
        if (!sk) return;
        const beh = behaviorRef.current;
        // mirror
        sk.scaleX = beh.mirror ? -1 : 1;
        // blink (B闭眼 closed-eyelid layer)
        const b = blinkRef.current;
        if (b.eyeIdx >= 0 && sk.slots[b.eyeIdx]) {
          const eyeSlot = sk.slots[b.eyeIdx];
          if (beh.blink) {
            const now = performance.now();
            if (!b.closed) {
              if (now >= b.nextAt) {
                if (b.eyeAtt) eyeSlot.setAttachment(b.eyeAtt);
                b.closed = true;
                b.closedAt = now;
              }
            } else if (now - b.closedAt >= 130) {
              eyeSlot.setAttachment(null);
              b.closed = false;
              b.nextAt = now + 1800 + Math.random() * 3500;
            }
          } else if (eyeSlot.attachment != null) {
            eyeSlot.setAttachment(null);
            b.closed = false;
          }
        }
        // slot-group visibility (B闭眼 is owned by the blink logic above)
        const hs = hiddenRef.current;
        for (const slot of sk.slots) {
          const name = slot.data.name;
          if (name === 'B闭眼') continue;
          if (hs.has(name)) {
            if (slot.attachment != null) slot.setAttachment(null);
          } else if (slot.attachment == null && slot.data.attachmentName != null) {
            const a = sk.getAttachment(slot.data.index, slot.data.attachmentName);
            if (a) slot.setAttachment(a);
          }
        }
      },
    });
    return () => {
      disposed = true;
      try { player.dispose(); } catch { /* ignore */ }
      playerRef.current = null;
    };
  }, []);

  /* mood -> playback speed + effects */
  const mood = useMemo(() => deriveMood(snap), [snap]);
  useEffect(() => {
    if (!player) return;
    const speed = { idle: 1, thinking: 1.5, working: 1.8, asking: 1, error: 0.7 }[mood] ?? 1;
    player.speed = speed;
  }, [player, mood]);

  /* recompute the world viewport whenever the visible slot set changes, so
   * the whole (currently visible) model always fits the frame */
  useEffect(() => {
    if (!player || !player.skeleton) return;
    const vp = computeViewport(player, hiddenSet);
    if (!vp) return;
    try {
      const cfg = player.config.viewport;
      cfg.x = vp.x; cfg.y = vp.y; cfg.width = vp.width; cfg.height = vp.height;
      cfg.padLeft = vp.padLeft; cfg.padRight = vp.padRight; cfg.padTop = vp.padTop; cfg.padBottom = vp.padBottom;
      const cur = player.animationState && player.animationState.getCurrent(0);
      if (cur && cur.animation) player.setViewport(cur.animation);
    } catch { /* ignore */ }
  }, [player, hiddenSet]);

  /* drag — window listeners, no pointer capture (child buttons must get clicks) */
  const posRef = useRef(pos);
  useEffect(() => { posRef.current = pos; }, [pos]);
  const onPointerDown = useCallback((e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const host = hostRef.current;
    if (!host) return;
    const rect = host.getBoundingClientRect();
    dragRef.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
    movedRef.current = false;
    setDragging(true);
  }, []);
  useEffect(() => {
    if (!dragging) return undefined;
    const onMove = (e) => {
      const d = dragRef.current;
      if (!d) return;
      movedRef.current = true;
      const x = Math.min(Math.max(8, e.clientX - d.dx), window.innerWidth - 80);
      const y = Math.min(Math.max(8, e.clientY - d.dy), window.innerHeight - 80);
      const next = { x, y };
      posRef.current = next;
      setPos(next);
    };
    const onUp = () => {
      dragRef.current = null;
      setDragging(false);
      try { localStorage.setItem(STORE_KEY, JSON.stringify(posRef.current)); } catch { /* ignore */ }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragging]);

  /* click: entrance + reaction (only when not dragged) */
  const onPetClick = useCallback(() => {
    if (movedRef.current) {
      movedRef.current = false;
      return;
    }
    const p = playerRef.current;
    if (p && anims.includes('FadeIn')) {
      p.setAnimation('FadeIn', false);
      p.addAnimation('Loop', true);
    }
    setReaction(randomReaction());
    window.setTimeout(() => setReaction(null), 2600);
  }, [anims]);

  const onDoubleClick = useCallback(() => setShowHud((v) => !v), []);

  /* resize handle: drag bottom-right corner to change character size */
  const onResizeStart = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startZoom = zoomRef.current;
    const onMove = (ev) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      const next = Math.min(1.5, Math.max(0.5, startZoom + (dx + dy) / 220));
      zoomRef.current = next;
      setZoom(next);
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, []);

  /* open/close the settings window; first open places it near the pet */
  const togglePanel = useCallback(() => {
    setShowPanel((v) => {
      const next = !v;
      if (next && !winPosRef.current) {
        const W = 222, H = 520;
        const nx = Math.max(12, Math.min(pos.x + Math.max(0, Math.round(300 * zoom)) + 12, window.innerWidth - W - 12));
        const ny = Math.max(12, Math.min(pos.y, window.innerHeight - H - 12));
        winPosRef.current = { x: nx, y: ny };
        setWinPos({ x: nx, y: ny });
      }
      return next;
    });
  }, [pos, zoom]);

  /* drag the settings window by its title bar */
  const onWinTitleDown = useCallback((e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const base = winPosRef.current || { x: 100, y: 100 };
    winDragRef.current = { dx: e.clientX - base.x, dy: e.clientY - base.y };
    const onMove = (ev) => {
      const s = winDragRef.current;
      if (!s) return;
      const x = Math.max(8, Math.min(ev.clientX - s.dx, window.innerWidth - 60));
      const y = Math.max(8, Math.min(ev.clientY - s.dy, window.innerHeight - 30));
      winPosRef.current = { x, y };
      setWinPos({ x, y });
    };
    const onUp = () => {
      winDragRef.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, []);

  const usage = useMemo(() => sumUsage(snap ? snap.nodes : []), [snap]);
  const pending = snap && snap.pending && snap.pending.length ? snap.pending : [];
  const asking = pendingSummary(pending);
  const toolName =
    mood === 'working' && snap && snap.runningCalls && snap.runningCalls.length
      ? snap.runningCalls[0].name
      : null;
  const model = useMemo(() => {
    if (!snap || !snap.nodes) return null;
    for (let i = snap.nodes.length - 1; i >= 0; i--) {
      const n = snap.nodes[i];
      if (n.kind === 'assistant' && n.provenance) return n.provenance.model;
    }
    return null;
  }, [snap]);

  /* bubble copy */
  let bubbleTitle = '';
  let bubbleBody = '';
  if (loadError) {
    bubbleTitle = '加载失败';
    bubbleBody = loadError;
  } else if (!snap) {
    bubbleTitle = '待命中';
    bubbleBody = '还没有会话哦，等你开聊～';
  } else if (mood === 'asking' && asking) {
    bubbleTitle = asking.title + ' · 可点击下方直接应答';
    bubbleBody = asking.text;
  } else if (mood === 'working' && toolName) {
    bubbleTitle = '工作中';
    bubbleBody = '正在执行 ' + toolName + ' …';
  } else if (mood === 'thinking') {
    bubbleTitle = '思考中';
    bubbleBody = '正在思考，稍等一下哦…';
  } else if (mood === 'error') {
    bubbleTitle = '出错了';
    bubbleBody = '呜…刚才那一步出了点问题，看看会话里的报错吧。';
  } else {
    bubbleTitle = '待命中';
    bubbleBody =
      '本会话 tokens：输入 ' + fmt(usage.input) +
      ' · 输出 ' + fmt(usage.output) +
      (usage.cacheRead ? ' · 缓存 ' + fmt(usage.cacheRead) : '') +
      (model ? '\n模型：' + model : '');
  }

  /* ⚙ toggle button: hugs the pet's top-right corner (the settings window
   * itself is free-floating and unaffected by model size) */
  const ctrlX = Math.max(8, Math.min(pos.x + Math.max(0, Math.round(300 * zoom) - 26), window.innerWidth - 30));
  const ctrlY = pos.y + 2;

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      'div',
      {
      className:
        'cyrene-pet-host mood-' + mood +
        (dragging ? ' dragging' : '') +
        (debug.glow ? '' : ' no-glow') +
        (debug.outline ? ' outline' : ''),
      style: { left: pos.x, top: pos.y },
      onPointerDown,
      onClick: onPetClick,
      onDoubleClick: onDoubleClick,
      title: '双击查看用量 HUD',
    },
    React.createElement('div', { className: 'cyrene-pet-ring', style: debug.ring ? undefined : { visibility: 'hidden' } }),
    React.createElement('div', { ref: hostRef, className: 'cyrene-pet-canvas', style: { width: Math.round(300 * zoom) + 'px', height: Math.round(390 * zoom) + 'px', visibility: debug.canvas ? undefined : 'hidden' } }),
    debug.bubble && (bubbleTitle || bubbleBody) &&
      React.createElement(
        'div',
        { className: 'cyrene-pet-bubble', onClick: (e) => e.stopPropagation() },
        bubbleTitle ? React.createElement('span', { className: 'bt' }, bubbleTitle) : null,
        React.createElement('span', { className: 'bb' }, bubbleBody),
        asking && asking.buttons.length
          ? React.createElement(
              'div',
              { className: 'cyrene-pet-actions' },
              asking.buttons.map((b, i) =>
                React.createElement(
                  'button',
                  {
                    key: i,
                    onClick: (e) => {
                      e.stopPropagation();
                      try { b.respond().catch(() => { /* host rejected the response */ }); } catch { /* already settled */ }
                    },
                  },
                  b.label,
                ),
              ),
            )
          : null,
        reaction ? React.createElement('span', { className: 'bb' }, reaction) : null,
      ),
    showHud && debug.hud &&
      React.createElement(
        'div',
        { className: 'cyrene-pet-hud' + (behavior.hudLeft ? ' left' : ''), onClick: (e) => e.stopPropagation() },
        React.createElement('h4', null, 'Cyrene · 会话信息'),
        React.createElement('div', { className: 'row' }, React.createElement('span', null, '输入'), React.createElement('b', null, fmt(usage.input))),
        React.createElement('div', { className: 'row' }, React.createElement('span', null, '输出'), React.createElement('b', null, fmt(usage.output))),
        React.createElement('div', { className: 'row' }, React.createElement('span', null, '缓存读'), React.createElement('b', null, fmt(usage.cacheRead))),
        React.createElement('div', { className: 'row' }, React.createElement('span', null, '缓存写'), React.createElement('b', null, fmt(usage.cacheWrite))),
        React.createElement('div', { className: 'row' }, React.createElement('span', null, '推理'), React.createElement('b', null, fmt(usage.reasoning))),
        React.createElement('div', { className: 'row' }, React.createElement('span', null, '请求数'), React.createElement('b', null, fmt(usage.reqs))),
        React.createElement('div', { className: 'row' }, React.createElement('span', null, '模型'), React.createElement('b', null, model || '–')),
        React.createElement('div', { className: 'row' }, React.createElement('span', null, '状态'), React.createElement('b', null, snap ? (snap.running ? '运行中' : '空闲') : '–')),
        React.createElement('div', { className: 'row' }, React.createElement('span', null, '待处理请求'), React.createElement('b', null, fmt(pending.length))),
        React.createElement('div', { className: 'hint' }, '双击宠物开关此面板 · 拖动可移动位置'),
      ),
    React.createElement('div', { className: 'cyrene-pet-resize', title: '拖拽调整大小', style: showPanel ? undefined : { display: 'none' }, onPointerDown: onResizeStart }),
    ),
    React.createElement(
      'div',
      { className: 'cyrene-pet-controls', style: { left: ctrlX, top: ctrlY } },
      React.createElement(
        'button',
        {
          className: 'cyrene-pet-debug-btn',
          title: '打开/关闭设置窗口',
          onClick: (e) => {
            e.stopPropagation();
            togglePanel();
          },
        },
        '⚙',
      ),
    ),
    showPanel && winPos &&
      React.createElement(
        'div',
        { className: 'cyrene-pet-win', style: { left: winPos.x, top: winPos.y } },
        React.createElement(
          'div',
          { className: 'cyrene-pet-win-title', onPointerDown: onWinTitleDown },
          React.createElement('span', null, '桌宠设置'),
          React.createElement('button', { className: 'cyrene-pet-win-close', title: '关闭', onClick: () => setShowPanel(false) }, '×'),
        ),
        React.createElement(
          'div',
          { className: 'cyrene-pet-win-body' },
        React.createElement('div', { className: 'sec' }, '界面层'),
        DEBUG_ITEMS.map((item) =>
          React.createElement(
            'label',
            { key: item.key },
            React.createElement('input', {
              type: 'checkbox',
              checked: debug[item.key],
              onChange: () => setDebug((d) => ({ ...d, [item.key]: !d[item.key] })),
            }),
            item.label,
          ),
        ),
        React.createElement('div', { className: 'sec' }, '模型装饰（勾选=显示）'),
        MODEL_GROUPS.map((g) =>
          React.createElement(
            'label',
            { key: g.key },
            React.createElement('input', {
              type: 'checkbox',
              checked: !modelHide[g.key],
              onChange: () => setModelHide((d) => ({ ...d, [g.key]: !d[g.key] })),
            }),
            g.label,
          ),
        ),
        React.createElement('div', { className: 'sec' }, '行为'),
        React.createElement('label', null,
          React.createElement('input', {
            type: 'checkbox',
            checked: behavior.blink,
            onChange: () => setBehavior((b) => ({ ...b, blink: !b.blink })),
          }),
          '自动眨眼',
        ),
        React.createElement('label', null,
          React.createElement('input', {
            type: 'checkbox',
            checked: behavior.mirror,
            onChange: () => setBehavior((b) => ({ ...b, mirror: !b.mirror })),
          }),
          '模型镜像',
        ),
        React.createElement('label', null,
          React.createElement('input', {
            type: 'checkbox',
            checked: behavior.hudLeft,
            onChange: () => setBehavior((b) => ({ ...b, hudLeft: !b.hudLeft })),
          }),
          'HUD 放左侧',
        ),
        React.createElement('div', { className: 'sec' }, '大小'),
        React.createElement(
          'div',
          { className: 'zoomrow' },
          React.createElement('span', null, '缩放'),
          React.createElement('input', {
            type: 'range',
            min: '0.5',
            max: '1.5',
            step: '0.05',
            value: zoom,
            onChange: (e) => setZoom(parseFloat(e.target.value)),
          }),
          React.createElement('b', null, Math.round(zoom * 100) + '%'),
        ),
        ),
      ),
  );
}

/* ------------------------------------------------------------------ */
/* client plugin entry                                                 */
/* ------------------------------------------------------------------ */
/** Required services (cordis fiber inject — client side). */
export const inject = ['slots', 'sessions'];

/**
 * Client plugin body: contribute the pet into the frame-wide overlay.
 * @param ctx - client root context.
 */
export function apply(ctx) {
  ctx.effect(() => {
    return ctx.slots.inject('shell.overlay', () =>
      ctx.slots.register(
        {
          name: 'shell.overlay',
          id: PET_ID,
          order: 100,
          inject: () => ({
            getSessionSource: (sessionId) => {
              const binding = ctx.sessions.binding(sessionId);
              return binding ? binding.session : null;
            },
          }),
        },
        PetOverlay,
      ),
    );
  }, 'cyrene-pet: overlay registration');
}
