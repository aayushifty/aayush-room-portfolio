import { CINEMA_CLIPS } from '@/data/portfolio';
import type { ScrubFrameState } from '@/lib/frameScrubEngine';

export interface BeatTimingSpec {
  clip: 0 | 1 | 2;
  inStart: number;
  inEnd: number;
  outStart: number;
  outEnd: number;
  /** Semantic gesture name used for CSS entrance kinematics */
  gesture?:
    | 'intro-wave'
    | 'turn-left'
    | 'turn-right'
    | 'point-right'
    | 'point-left'
    | 'both-up'
    | 'calm-floor'
    | 'point-upright'
    | 'double-left'
    | 'double-right'
    | 'navy-upright'
    | 'point-down';
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

/**
 * Total video duration is 20.03s (480 frames @ 24 fps):
 *   Act I   (clip 0): frames 0..239   (240 frames, 00.00s..10.00s) -> g: 0.0000..0.5000
 *   Act II  (clip 1): frames 240..383 (144 frames, 10.00s..16.00s) -> g: 0.5000..0.8000
 *   Act III (clip 2): frames 384..479 ( 96 frames, 16.00s..20.03s) -> g: 0.8000..1.0000
 */
const CLIP1_BOUNDARY = 240 / 480; // 0.5
const CLIP2_BOUNDARY = 384 / 480; // 0.8
export const VIDEO_DURATION_SECONDS = 20.03;

export const NAV_SCROLL_TARGETS: readonly NavScrollTarget[] = [
  { id: 'act-studio', label: 'Studio', act: 0, globalProgress: 0.0 },
  { id: 'act-works', label: 'Systems', act: 1, globalProgress: 0.525 },
  { id: 'act-credentials', label: 'Credentials', act: 2, globalProgress: 0.816 },
  { id: 'section-contact', label: 'Contact', act: 2, globalProgress: 0.985 },
];

export const SECTION_PROGRESS_MAP: Record<string, number> = {
  'act-studio': 0.0,
  'beat-hero': 0.145,
  'beat-identity': 0.255,
  'beat-disciplines': 0.325,
  'act-works': 0.525,
  'act-credentials': 0.816,
  'beat-beyond': 0.942,
  'section-contact': 0.985,
};

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

/**
 * Direct compositor-only DOM sync across all scroll-driven choreographed beat elements.
 * Zero React re-renders during scroll frames.
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

    if (alpha > 0.005) {
      el.style.opacity = alpha.toFixed(4);
      el.style.setProperty('--beat-u', reducedMotion ? '0' : centeredU.toFixed(4));
      el.style.visibility = 'visible';
      el.dataset.beatPhase = phase;
    } else {
      el.style.opacity = '0';
      el.style.setProperty('--beat-u', phase === 'before' ? '-1' : '1');
      el.style.visibility = 'hidden';
      el.dataset.beatPhase = phase;
    }
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
