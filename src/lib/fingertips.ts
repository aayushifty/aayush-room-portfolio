/// <reference types="vite/client" />
/**
 * Index-fingertip positions read off the reel at 4 samples per second.
 * Each sample is [seconds, x, y] with x/y as fractions of the 16:9 video frame.
 * Blocks tagged data-tip="<name>" are pinned to the interpolated point, so the text
 * rises, holds and drops with the hand.
 */
type Sample = readonly [t: number, x: number, y: number];

const TRACKS: Record<string, readonly Sample[]> = {
  // glass office
  'office-right': [[11.0, 0.645, 0.545], [11.25, 0.675, 0.385], [11.5, 0.745, 0.445], [11.75, 0.762, 0.49], [12.25, 0.756, 0.51], [12.5, 0.74, 0.745]],
  'office-left': [[13.0, 0.334, 0.65], [13.25, 0.31, 0.6], [13.5, 0.31, 0.63], [13.75, 0.32, 0.64], [14.0, 0.39, 0.79]],
  'office-both-l': [[14.5, 0.296, 0.455], [14.75, 0.18, 0.555], [15.0, 0.176, 0.6], [15.75, 0.184, 0.61], [16.0, 0.24, 0.755]],
  'office-both-r': [[14.5, 0.676, 0.45], [14.75, 0.804, 0.55], [15.0, 0.81, 0.59], [15.75, 0.81, 0.61], [16.0, 0.78, 0.75]],
  'office-up': [[16.5, 0.726, 0.445], [16.75, 0.704, 0.22], [17.0, 0.776, 0.17], [17.5, 0.776, 0.185], [17.75, 0.77, 0.215], [18.0, 0.71, 0.55]],
  // night lab
  'lab-right': [[21.0, 0.616, 0.675], [21.25, 0.644, 0.49], [21.5, 0.704, 0.6], [21.75, 0.696, 0.575], [22.0, 0.694, 0.585], [22.25, 0.67, 0.745]],
  'lab-left': [[22.75, 0.326, 0.7], [23.0, 0.31, 0.605], [23.25, 0.304, 0.65], [23.75, 0.314, 0.66], [24.0, 0.366, 0.865]],
  'lab-both-l': [[24.5, 0.314, 0.48], [24.75, 0.18, 0.555], [25.0, 0.18, 0.6], [25.25, 0.186, 0.59], [25.5, 0.264, 0.78]],
  'lab-both-r': [[24.5, 0.716, 0.47], [24.75, 0.826, 0.555], [25.0, 0.826, 0.61], [25.25, 0.82, 0.59], [25.5, 0.786, 0.735]],
  'lab-up': [[25.75, 0.78, 0.665], [26.0, 0.75, 0.29], [26.25, 0.81, 0.265], [26.5, 0.8, 0.275], [26.75, 0.796, 0.315], [27.0, 0.74, 0.69]],
};

/** Linear interpolation along a track, clamped to its first and last sample. */
export function fingertipAt(track: string, t: number): [x: number, y: number] | null {
  const samples = TRACKS[track];
  if (!samples) return null;
  if (t <= samples[0][0]) return [samples[0][1], samples[0][2]];
  for (let i = 1; i < samples.length; i++) {
    const [t1, x1, y1] = samples[i];
    if (t <= t1) {
      const [t0, x0, y0] = samples[i - 1];
      const k = (t - t0) / (t1 - t0);
      return [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k];
    }
  }
  const last = samples[samples.length - 1];
  return [last[1], last[2]];
}

/** Where the finger rests during the gesture: the sample nearest the middle of the track. */
function holdPoint(track: string): [x: number, y: number] | null {
  const samples = TRACKS[track];
  if (!samples) return null;
  return fingertipAt(track, (samples[0][0] + samples[samples.length - 1][0]) / 2);
}

type Fit = 'beside' | 'above' | 'dock';

/**
 * Pin every visible fingertip block to its finger for reel time `t`.
 * Chooses how the block sits by the room actually left on screen:
 *   beside – next to the finger, on the side it points to
 *   above  – compact, directly over the hand (window too narrow to fit beside);
 *            when the finger is raised near the top bar, just the title beside the finger
 *   dock   – bottom of the screen (phones: the hands are cropped out of frame)
 */
export function applyFingertips(t: number): void {
  const W = document.documentElement.clientWidth;
  const H = document.documentElement.clientHeight;
  // rendered box of the object-cover 16:9 video, positioned at 50% 24%
  const vidW = Math.max(W, (H * 16) / 9);
  const vidH = Math.max(H, (W * 9) / 16);
  const gap = Math.min(34, Math.max(14, W * 0.022));
  const margin = W * 0.024;

  const sections = document.querySelectorAll<HTMLElement>('.gs-beat[data-tips]');
  for (let s = 0; s < sections.length; s++) {
    const section = sections[s];
    if (section.style.visibility === 'hidden') continue;

    const anchors = section.querySelectorAll<HTMLElement>('.gs-tip');
    const placed: Array<{ el: HTMLElement; sx: number; sy: number; room: number; fit: Fit; tight: boolean }> = [];
    let anyDock = false;

    for (let i = 0; i < anchors.length; i++) {
      const el = anchors[i];
      const point = fingertipAt(el.dataset.tip ?? '', t);
      if (!point) continue;
      const sx = W / 2 + (point[0] - 0.5) * vidW;
      const sy = (H - vidH) * 0.24 + point[1] * vidH;
      // The layout is chosen from where the finger HOLDS, not where it is this frame,
      // so a block never jumps between layouts while the hand is moving.
      const hold = holdPoint(el.dataset.tip ?? '') ?? point;
      const hx = W / 2 + (hold[0] - 0.5) * vidW;
      const hy = (H - vidH) * 0.24 + hold[1] * vidH;
      const room = (el.dataset.dir === 'left' ? hx : W - hx) - gap - margin;
      const fit: Fit = W < 700 || hx <= 0 || hx >= W ? 'dock' : room >= 190 ? 'beside' : 'above';
      if (fit === 'dock') anyDock = true;
      // tight: too little space between the top bar and the finger to stack a block over the hand
      placed.push({ el, sx, sy, room, fit, tight: fit === 'above' && hy - 48 < 200 });
    }

    const dock = anyDock ? String(placed.length) : '';
    if ((section.dataset.dock ?? '') !== dock) {
      if (dock) section.dataset.dock = dock;
      else delete section.dataset.dock;
    }

    for (const p of placed) {
      const fit: Fit = anyDock ? 'dock' : p.fit;
      const isLeft = p.el.dataset.dir === 'left';
      // text runs away from the finger when beside it, and hugs the screen edge when stacked above
      const text = fit === 'dock' ? 'start' : (fit === 'beside') === isLeft ? 'end' : 'start';
      const spark = p.el.nextElementSibling as HTMLElement | null;
      for (const node of [p.el, spark]) {
        if (!node) continue;
        node.style.setProperty('--fx', `${p.sx.toFixed(1)}px`);
        node.style.setProperty('--fxr', `${(W - p.sx).toFixed(1)}px`);
        node.style.setProperty('--fy', `${p.sy.toFixed(1)}px`);
        node.style.setProperty('--fyb', `${(H - p.sy).toFixed(1)}px`);
        if (node.dataset.fit !== fit) node.dataset.fit = fit;
      }
      p.el.style.setProperty('--room', `${Math.max(0, p.room).toFixed(0)}px`);
      p.el.style.setProperty('--gap', `${gap.toFixed(0)}px`);
      if (p.el.dataset.text !== text) p.el.dataset.text = text;
      // tight: only the title and its link fit between the top bar and a raised finger
      p.el.toggleAttribute('data-tight', fit === 'above' && p.tight);
    }
  }
}

// Self-check: tracks are time-ordered and stay inside the frame (dev only)
if (import.meta.env.DEV) {
  for (const [name, samples] of Object.entries(TRACKS)) {
    samples.forEach(([t, x, y], i) => {
      console.assert(i === 0 || t > samples[i - 1][0], `fingertips: ${name} not time-ordered at ${t}`);
      console.assert(x > 0 && x < 1 && y > 0 && y < 1, `fingertips: ${name} leaves the frame at ${t}`);
    });
  }
}
