import { CINEMA_CLIPS } from '@/data/portfolio';
import type { ScrubFrameState } from '@/lib/frameScrubEngine';

export type Gesture = 'wave' | 'turn' | 'calm' | 'point-right' | 'point-left' | 'point-up' | 'both';

export interface BeatTimingSpec {
  clip: 0 | 1 | 2;
  inStart: number;
  inEnd: number;
  outStart: number;
  outEnd: number;
  /** What he is doing in the footage while this block is up */
  gesture?: Gesture;
  /** Keep visible through clip end (e.g. downward contact dock) */
  holdEnd?: boolean;
  /** Already active at exact start of clip (e.g. opening wave greeting) */
  holdStart?: boolean;
}

export interface NavScrollTarget {
  id: string;
  label: string;
  act: 0 | 1 | 2;
  globalProgress: number;
}

/** The reel is 30s: three 10s rooms (studio, glass office, night lab), 240 frames each @ 24 fps. */
const ACT_SECONDS = 10;
const CLIP1_BOUNDARY = 1 / 3;
const CLIP2_BOUNDARY = 2 / 3;
export const VIDEO_DURATION_SECONDS = 30;

/** Beat timing from absolute reel seconds, with a short fade at each end. */
export function span(
  t0: number,
  t1: number,
  opts: Pick<BeatTimingSpec, 'gesture' | 'holdStart' | 'holdEnd'> & {
    /** second the block is fully formed (default: a short fade after t0) */
    formed?: number;
    /** second it starts to break up (default: a short fade before t1) */
    fading?: number;
  } = {}
): BeatTimingSpec {
  const clip = Math.min(2, Math.floor(t0 / ACT_SECONDS)) as 0 | 1 | 2;
  const p = (t: number): number => Number(((t - clip * ACT_SECONDS) / ACT_SECONDS).toFixed(4));
  const fade = Math.min(0.3, (t1 - t0) / 3);
  const { formed = t0 + fade, fading = t1 - fade, ...rest } = opts;
  return { clip, inStart: p(t0), inEnd: p(formed), outStart: p(fading), outEnd: p(t1), ...rest };
}

export const NAV_SCROLL_TARGETS: readonly NavScrollTarget[] = [
  { id: 'act-studio', label: 'Studio', act: 0, globalProgress: 0.0 },
  { id: 'act-works', label: 'Work', act: 1, globalProgress: 10.6 / 30 },
  { id: 'act-credentials', label: 'Honors', act: 2, globalProgress: 20.6 / 30 },
  { id: 'section-contact', label: 'Contact', act: 2, globalProgress: 29.4 / 30 },
];

export const SECTION_PROGRESS_MAP: Record<string, number> = Object.fromEntries(
  NAV_SCROLL_TARGETS.map((t) => [t.id, t.globalProgress])
);

export function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge1 === edge0) {
    return x >= edge1 ? 1 : 0;
  }
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * Resolve continuous 480-frame (20.03s) timeline cleanly across 3 seamless contiguous acts.
 * Zero crossfade blendAlpha is needed because clip1 -> clip2 -> clip3 are continuous cuts
 * from the exact same 20s capture; secondaryClip purely pre-warms boundary frames.
 */
export function resolveUnifiedTimeline(scrollY: number, maxScroll: number): ScrubFrameState {
  const g = clamp01(maxScroll > 0 ? scrollY / maxScroll : 0);

  let activeClip: 0 | 1 | 2 = 0;
  let secondaryClip: 0 | 1 | 2 | null = null;
  let p0 = 0;
  let p1 = 0;
  let p2 = 0;

  if (g < CLIP1_BOUNDARY) {
    activeClip = 0;
    p0 = clamp01(g / CLIP1_BOUNDARY);
  } else if (g < CLIP2_BOUNDARY) {
    activeClip = 1;
    p0 = 1;
    p1 = clamp01((g - CLIP1_BOUNDARY) / (CLIP2_BOUNDARY - CLIP1_BOUNDARY));
  } else {
    activeClip = 2;
    p0 = 1;
    p1 = 1;
    p2 = clamp01((g - CLIP2_BOUNDARY) / (1 - CLIP2_BOUNDARY));
  }

  const clipProgress: [number, number, number] = [p0, p1, p2];
  const activeCount = CINEMA_CLIPS[activeClip].frameCount;
  const activeP = clipProgress[activeClip];
  const frameIndex = Math.min(activeCount - 1, Math.round(activeP * (activeCount - 1)));

  // Anticipatory boundary pre-warm hint without double-exposure blending
  if (activeClip === 0 && activeCount - frameIndex <= 18) {
    secondaryClip = 1;
  } else if (activeClip === 1 && activeCount - frameIndex <= 18) {
    secondaryClip = 2;
  }

  return {
    activeClip,
    secondaryClip,
    blendAlpha: 0,
    clipProgress,
    frameIndex,
    totalFrames: activeCount,
    globalProgress: g,
  };
}

interface CachedBeatState {
  phase: 'before' | 'active' | 'after';
  opacityKey: string;
  visible: boolean;
  uKey: string;
}

const beatCache = new WeakMap<HTMLElement, CachedBeatState>();

/**
 * Direct compositor-only DOM sync across all scroll-driven choreographed beat elements.
 * Skips redundant style writes on untouched inactive beats so scroll frames stay sub-millisecond.
 */
export function applyBeatVisuals(
  state: ScrubFrameState,
  reducedMotion: boolean
): void {
  const beats = document.querySelectorAll<HTMLElement>('[data-cinema-beat]');
  for (let i = 0; i < beats.length; i++) {
    const el = beats[i];
    const clipIdx = Number(el.dataset.beatClip ?? '0') as 0 | 1 | 2;
    const inStart = Number(el.dataset.inStart ?? '0');
    const inEnd = Number(el.dataset.inEnd ?? '0.1');
    const outStart = Number(el.dataset.outStart ?? '0.8');
    const outEnd = Number(el.dataset.outEnd ?? '1');
    const holdStart = el.dataset.holdStart === 'true';
    const holdEnd = el.dataset.holdEnd === 'true';

    const p = state.clipProgress[clipIdx];
    const activeStart = holdStart ? -0.01 : inStart;
    const activeEnd = holdEnd ? 1.01 : outEnd;

    let alpha = 0;
    let phase: 'before' | 'active' | 'after' = 'before';

    if (p < activeStart) {
      alpha = 0;
      phase = 'before';
    } else if (p > activeEnd) {
      alpha = 0;
      phase = 'after';
    } else if (clipIdx !== state.activeClip) {
      // Strictly gate beats to their owning continuous segment so neighboring clips never bleed
      alpha = 0;
      phase = clipIdx > state.activeClip ? 'before' : 'after';
    } else {
      const enterAlpha = holdStart ? 1 : smoothstep(inStart, inEnd, p);
      const exitAlpha = holdEnd ? 1 : 1 - smoothstep(outStart, outEnd, p);
      alpha = clamp01(Math.min(enterAlpha, exitAlpha));
      phase = alpha > 0.08 ? 'active' : p < (inStart + outEnd) * 0.5 ? 'before' : 'after';
    }

    const mid = (inEnd + outStart) * 0.5;
    const halfSpan = Math.max(0.05, (outEnd - inStart) * 0.5);
    const centeredU = clamp01(((p - mid) / halfSpan) * 0.5 + 0.5) * 2 - 1;

    const visible = alpha > 0.005;
    const opacityKey = visible ? alpha.toFixed(3) : '0';
    const uKey = visible ? (reducedMotion ? '0' : centeredU.toFixed(3)) : phase === 'before' ? '-1' : '1';

    const prev = beatCache.get(el);
    if (
      prev &&
      prev.phase === phase &&
      prev.opacityKey === opacityKey &&
      prev.visible === visible &&
      prev.uKey === uKey
    ) {
      continue;
    }

    if (!prev || prev.opacityKey !== opacityKey) {
      el.style.opacity = opacityKey;
      // exposed so fingertip blocks can grow out of the finger as they fade in
      el.style.setProperty('--beat-a', opacityKey);
    }
    if (!prev || prev.uKey !== uKey) {
      el.style.setProperty('--beat-u', uKey);
    }
    if (!prev || prev.visible !== visible) {
      el.style.visibility = visible ? 'visible' : 'hidden';
    }
    if (!prev || prev.phase !== phase) {
      el.dataset.beatPhase = phase;
    }

    beatCache.set(el, { phase, opacityKey, visible, uKey });
  }
}

/** Convenience builder for JSX data-* attributes on sticky beat layers */
export function beatDataAttrs(spec: BeatTimingSpec): Record<string, string> {
  return {
    'data-cinema-beat': 'true',
    'data-beat-clip': String(spec.clip),
    'data-in-start': String(spec.inStart),
    'data-in-end': String(spec.inEnd),
    'data-out-start': String(spec.outStart),
    'data-out-end': String(spec.outEnd),
    ...(spec.gesture ? { 'data-gesture': spec.gesture } : {}),
    ...(spec.holdStart ? { 'data-hold-start': 'true' } : {}),
    ...(spec.holdEnd ? { 'data-hold-end': 'true' } : {}),
  };
}
