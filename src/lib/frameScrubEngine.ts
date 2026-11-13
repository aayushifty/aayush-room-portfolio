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
 * Desktops get the 2K master; phones get 1080p, which every phone decoder handles.
 * Null on data-saver or 2G: they stay on the 720p start reel. Phones and low-memory devices get 1080p.
 */
export function pickUpgradeUrl(): string | null {
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
    deviceMemory?: number;
  };
  const conn = nav.connection;
  if (conn?.saveData || conn?.effectiveType === '2g' || conn?.effectiveType === 'slow-2g') return null;
  const lowMemory = nav.deviceMemory !== undefined && nav.deviceMemory <= 2;
  // Phones take the 1080p copy: many cannot hardware-decode 2560x1440, and it is a third of the
  // download on mobile data. screen.* is the physical display, unaffected by layout or resizing.
  const phone = matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 768;
  return lowMemory || phone ? '/video/aayush-reel-1080.mp4?v=20261112s8' : '/video/aayush-reel.mp4?v=20261112s8';
}

export const HERO_POSTER_URL = '/frames/clip1/001.webp?v=20261112s4';

export function getClipMeta(clipIndex: 0 | 1 | 2) {
  return CINEMA_CLIPS[clipIndex];
}
