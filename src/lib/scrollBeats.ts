import { CINEMA_CLIPS } from '@/data/portfolio';
import type { ScrubFrameState } from '@/lib/frameScrubEngine';

export interface BeatTimingSpec {
  clip: 0 | 1 | 2;
  inStart: number;
  inEnd: number;
  outStart: number;
  outEnd: number;
  /** Keep visible through clip end (e.g. final contact transmission) */
  holdEnd?: boolean;
  /** Already active at exact start of clip */
  holdStart?: boolean;
}

export interface NavScrollTarget {
  id: string;
  label: string;
  act: 0 | 1 | 2;
  /** Target global progress [0..1] landing squarely inside an active beat */
  globalProgress: number;
}

export const NAV_SCROLL_TARGETS: readonly NavScrollTarget[] = [
  { id: 'act-studio', label: 'Studio', act: 0, globalProgress: 0.0 },
  { id: 'act-works', label: 'Systems', act: 1, globalProgress: 0.352 },
  { id: 'act-credentials', label: 'Credentials', act: 2, globalProgress: 0.698 },
  { id: 'section-contact', label: 'Contact', act: 2, globalProgress: 0.985 },
];

export const SECTION_PROGRESS_MAP: Record<string, number> = {
  'act-studio': 0.0,
  'beat-hero': 0.081,
  'act-works': 0.352,
  'act-credentials': 0.698,
  'section-contact': 0.985,
};

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / Math.max(0.0001, edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * Computes active clip, optical dissolve blend alpha, and per-clip normalized
 * progress directly from global scroll ratio [0..1].
 */
export function resolveUnifiedTimeline(scrollY: number, maxScroll: number): ScrubFrameState {
  const safeMax = Math.max(1, maxScroll);
  const g = clamp01(scrollY / safeMax);

  const p0 = clamp01(g / 0.335);
  const p1 = clamp01((g - 0.32) / (0.68 - 0.32));
  const p2 = clamp01((g - 0.665) / (1.0 - 0.665));

  let activeClip: 0 | 1 | 2 = 0;
  let secondaryClip: 0 | 1 | 2 | null = null;
  let blendAlpha = 0;

  if (g < 0.32) {
    activeClip = 0;
  } else if (g < 0.348) {
    activeClip = 1;
    secondaryClip = 0;
    blendAlpha = smoothstep(0.32, 0.348, g);
  } else if (g < 0.665) {
    activeClip = 1;
  } else if (g < 0.692) {
    activeClip = 2;
    secondaryClip = 1;
    blendAlpha = smoothstep(0.665, 0.692, g);
  } else {
    activeClip = 2;
  }

  const clipProgress: [number, number, number] = [p0, p1, p2];
  const totalFrames = CINEMA_CLIPS[activeClip].frameCount;
  const frameIndex = Math.min(
    totalFrames - 1,
    Math.max(0, Math.round(clipProgress[activeClip] * (totalFrames - 1)))
  );

  return {
    activeClip,
    secondaryClip,
    blendAlpha,
    clipProgress,
    frameIndex,
    totalFrames,
    globalProgress: g,
  };
}

/**
 * Synchronizes unified CSS physics-spring beat phases (`before` / `active` / `after`) and
 * continuous scroll parallax drift without incremental line-by-line drip delays.
 */
export function applyBeatVisuals(
  state: ScrubFrameState,
  reducedMotion: boolean
): void {
  const isJumping =
    typeof document !== 'undefined' &&
    document.documentElement.dataset.cinemaJumping === 'true';

  const beatNodes = document.querySelectorAll<HTMLElement>('[data-cinema-beat]');
  for (const el of beatNodes) {
    const clip = Number(el.dataset.beatClip ?? '0') as 0 | 1 | 2;
    const inStart = Number(el.dataset.inStart ?? '0');
    const outStart = Number(el.dataset.outStart ?? '0.8');
    const outEnd = Number(el.dataset.outEnd ?? '0.95');
    const holdStart = el.dataset.holdStart === 'true';
    const holdEnd = el.dataset.holdEnd === 'true';

    const clipLocal = state.clipProgress[clip];
    const activeStart = holdStart ? -0.01 : inStart;
    const activeEnd = holdEnd ? 1.01 : (outStart + outEnd) * 0.5;

    let phase: 'before' | 'active' | 'after';
    if (isJumping || state.activeClip !== clip) {
      phase = clip < state.activeClip ? 'after' : 'before';
    } else if (clipLocal < activeStart) {
      phase = 'before';
    } else if (clipLocal >= activeEnd) {
      phase = 'after';
    } else {
      phase = 'active';
    }

    if (el.dataset.beatPhase !== phase) {
      el.dataset.beatPhase = phase;
    }

    if (phase === 'active') {
      const spanStart = Math.max(0, activeStart);
      const u = clamp01((clipLocal - spanStart) / Math.max(0.01, activeEnd - spanStart));
      const centeredU = u - 0.5;
      const parallaxY = reducedMotion ? 0 : -centeredU * 16;
      el.style.setProperty('--beat-u', reducedMotion ? '0' : centeredU.toFixed(4));
      el.style.transform = reducedMotion
        ? 'none'
        : `translate3d(0, ${parallaxY.toFixed(2)}px, 0)`;
      el.removeAttribute('aria-hidden');
    } else {
      el.style.setProperty('--beat-u', '0');
      el.style.transform = reducedMotion ? 'none' : 'translate3d(0, 0, 0)';
      el.setAttribute('aria-hidden', 'true');
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
    ...(spec.holdStart ? { 'data-hold-start': 'true' } : {}),
    ...(spec.holdEnd ? { 'data-hold-end': 'true' } : {}),
  };
}
