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

export const VIDEO_ASSET_URL = '/video/aayush-reel.mp4?v=20261112r30-2k-fast';
export const HERO_POSTER_URL = '/frames/clip1/001.webp?v=20261112r30';

export function getClipMeta(clipIndex: 0 | 1 | 2) {
  return CINEMA_CLIPS[clipIndex];
}
