import { CINEMA_CLIPS } from '@/data/portfolio';

export interface ScrubFrameState {
  activeClip: 0 | 1 | 2;
  secondaryClip: 0 | 1 | 2 | null;
  blendAlpha: number;
  clipProgress: [number, number, number];
  frameIndex: number;
  totalFrames: number;
  globalProgress: number;
}

declare global {
  interface Window {
    /** Set by the inline script in index.html: the start reel for this device. */
    __reel?: { url: string };
  }
}

/** The start reel: 720p, under 4 MB, so the whole film is playable within seconds of opening. */
export const pickReelUrl = (): string => window.__reel?.url ?? '/video/aayush-reel-720.mp4?v=20261112s8';

/**
 * The sharpest reel this screen can actually show, fetched after the light one and swapped in.
 * A tall phone draws the frame over 2000 px high, so it needs the 2K master as much as a desktop does.
 * Null on data-saver or 2G: they stay on the 720p start reel. Low-memory devices get 1080p.
 */
export function pickUpgradeUrl(): string | null {
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
    deviceMemory?: number;
  };
  const conn = nav.connection;
  if (conn?.saveData || conn?.effectiveType === '2g' || conn?.effectiveType === 'slow-2g') return null;
  // No screen-size test: the window can be measured mid-layout or resized later, and the 2K
  // master drawn smaller than its pixels is simply at its crispest.
  const lowMemory = nav.deviceMemory !== undefined && nav.deviceMemory <= 2;
  // low-memory devices take the lighter 1080p copy rather than the 25 MB master
  return lowMemory ? '/video/aayush-reel-1080.mp4?v=20261112s8' : '/video/aayush-reel.mp4?v=20261112s8';
}

export const HERO_POSTER_URL = '/frames/clip1/001.webp?v=20261112s4';

export function getClipMeta(clipIndex: 0 | 1 | 2) {
  return CINEMA_CLIPS[clipIndex];
}
