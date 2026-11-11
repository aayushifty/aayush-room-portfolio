import { CINEMA_CLIPS } from '@/data/portfolio';

export interface ScrubFrameState {
  activeClip: 0 | 1 | 2;
  secondaryClip: 0 | 1 | 2 | null;
  blendAlpha: number; // 0 = full activeClip, >0 = crossfading from secondaryClip -> activeClip
  clipProgress: [number, number, number];
  frameIndex: number;
  totalFrames: number;
  globalProgress: number;
}

type ClipIndex = 0 | 1 | 2;

const MAX_DECODED_WINDOW = 28;
const KEYFRAME_STRIDE = 32;
const MAX_CONCURRENT_FETCHES = 6;
const MAX_FETCH_ATTEMPTS = 2;

interface FrameTask {
  clip: ClipIndex;
  frame: number;
  pin: boolean;
}

function padFrame(indexOneBased: number): string {
  return String(indexOneBased).padStart(3, '0');
}

const FRAME_CACHE_VERSION = '20261111v2';

function getFrameUrl(clipIndex: ClipIndex, frameIdxZeroBased: number): string {
  const clip = CINEMA_CLIPS[clipIndex];
  const clamped = Math.max(0, Math.min(clip.frameCount - 1, frameIdxZeroBased));
  return `${clip.frameDir}/${padFrame(clamped + 1)}.webp?v=${FRAME_CACHE_VERSION}`;
}

/**
 * Manages high-quality WebP frame fetching and an LRU-bounded ImageBitmap cache
 * so scrolling across 480 720p frames stays instant and razor sharp in both directions.
 */
export class FrameSequenceStore {
  private blobs: Map<string, Blob> = new Map();
  private inFlightFetch: Set<string> = new Set();
  private focusQueue: FrameTask[] = [];
  private anchorQueue: FrameTask[] = [];
  private queuedAnchors: Set<string> = new Set();
  private bitmaps: Map<string, ImageBitmap> = new Map();
  private pinnedBitmaps: Map<string, ImageBitmap> = new Map();
  private inFlightDecode: Set<string> = new Set();
  private failedAttempts: Map<string, number> = new Map();
  private lastFailureAt: Map<string, number> = new Map();
  private listeners: Set<() => void> = new Set();

  private priorityClip: ClipIndex = 0;
  private priorityFrame = 0;
  private pumpRunning = false;
  private pumpScheduled = false;
  private active = false;
  private sessionId = 0;

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  public setFocus(clip: ClipIndex, frame: number): void {
    this.priorityClip = clip;
    this.priorityFrame = frame;
    this.rebuildFocusQueue(clip, frame, 4);
    this.schedulePump();
  }

  public startPreloadAll(): void {
    this.sessionId += 1;
    this.active = true;
    this.pumpRunning = false;
    this.pumpScheduled = false;
    this.focusQueue = [];
    this.anchorQueue = [];
    this.queuedAnchors.clear();
    this.inFlightFetch.clear();
    this.inFlightDecode.clear();
    this.failedAttempts.clear();
    this.lastFailureAt.clear();

    // Queue hero opening frames for all 3 acts + closing finale first so every scroll zone renders cleanly within RTT #1
    const criticalAnchors: Array<[ClipIndex, number]> = [
      [0, 0],
      [1, 0],
      [2, 0],
      [1, Math.min(64, CINEMA_CLIPS[1].frameCount - 1)],
      [2, Math.min(48, CINEMA_CLIPS[2].frameCount - 1)],
      [2, CINEMA_CLIPS[2].frameCount - 1],
    ];
    for (const [c, f] of criticalAnchors) {
      this.enqueueAnchor(c, f, true);
    }

    for (let c = 0 as ClipIndex; c <= 2; c = (c + 1) as ClipIndex) {
      const total = CINEMA_CLIPS[c].frameCount;
      for (let f = 0; f < total; f += KEYFRAME_STRIDE) {
        this.enqueueAnchor(c, f, true);
      }
      this.enqueueAnchor(c, total - 1, true);
    }

    this.schedulePump();
  }

  public getBestBitmap(clip: ClipIndex, targetFrame: number): ImageBitmap | null {
    const exactKey = `${clip}:${targetFrame}`;
    const exact = this.bitmaps.get(exactKey) ?? this.pinnedBitmaps.get(exactKey);
    if (exact) {
      if (this.bitmaps.has(exactKey)) {
        this.bitmaps.delete(exactKey);
        this.bitmaps.set(exactKey, exact);
      }
      return exact;
    }

    if (this.blobs.has(exactKey)) {
      void this.decodeCachedBlob(clip, targetFrame, false);
    } else if (this.active) {
      this.enqueueImmediateFocus(clip, targetFrame, false);
      this.schedulePump();
    }

    // Nearest decoded fallback within the same clip (no blank flashes during fast scrub)
    let bestDist = Number.POSITIVE_INFINITY;
    let bestBmp: ImageBitmap | null = null;
    const prefix = `${clip}:`;

    for (const [k, bmp] of this.bitmaps) {
      if (!k.startsWith(prefix)) continue;
      const idx = Number(k.slice(prefix.length));
      const d = Math.abs(idx - targetFrame);
      if (d < bestDist) {
        bestDist = d;
        bestBmp = bmp;
      }
    }

    for (const [k, bmp] of this.pinnedBitmaps) {
      if (!k.startsWith(prefix)) continue;
      const idx = Number(k.slice(prefix.length));
      const d = Math.abs(idx - targetFrame);
      if (d < bestDist) {
        bestDist = d;
        bestBmp = bmp;
      }
    }

    return bestBmp;
  }

  public getLoadedCount(): number {
    return this.blobs.size;
  }

  public getTotalCount(): number {
    return CINEMA_CLIPS.reduce((acc, clip) => acc + clip.frameCount, 0);
  }

  private canFetchKey(key: string): boolean {
    if (this.blobs.has(key) || this.inFlightFetch.has(key)) return false;
    const attempts = this.failedAttempts.get(key) ?? 0;
    if (attempts >= MAX_FETCH_ATTEMPTS) return false;
    const failedAt = this.lastFailureAt.get(key);
    if (failedAt !== undefined && performance.now() - failedAt < 600) return false;
    return true;
  }

  private enqueueAnchor(clip: ClipIndex, frame: number, pin: boolean): void {
    if (!this.active) return;
    const total = CINEMA_CLIPS[clip].frameCount;
    if (frame < 0 || frame >= total) return;

    const key = `${clip}:${frame}`;
    if (this.bitmaps.has(key) || this.pinnedBitmaps.has(key)) return;
    if (this.blobs.has(key)) {
      void this.decodeCachedBlob(clip, frame, pin);
      return;
    }
    if (!this.canFetchKey(key) || this.queuedAnchors.has(key)) return;

    this.queuedAnchors.add(key);
    this.anchorQueue.push({ clip, frame, pin });
  }

  private enqueueImmediateFocus(clip: ClipIndex, frame: number, pin: boolean): void {
    if (!this.active) return;
    const total = CINEMA_CLIPS[clip].frameCount;
    if (frame < 0 || frame >= total) return;

    const key = `${clip}:${frame}`;
    if (this.bitmaps.has(key) || this.pinnedBitmaps.has(key) || !this.canFetchKey(key)) return;
    if (!this.focusQueue.some((item) => item.clip === clip && item.frame === frame)) {
      this.focusQueue.unshift({ clip, frame, pin });
    }
  }

  private rebuildFocusQueue(clip: ClipIndex, centerFrame: number, radius: number): void {
    const nextQueue: FrameTask[] = [];
    const seen = new Set<string>();
    const total = CINEMA_CLIPS[clip].frameCount;

    const tryPush = (f: number): void => {
      if (f < 0 || f >= total) return;
      const key = `${clip}:${f}`;
      if (seen.has(key)) return;
      seen.add(key);
      if (this.bitmaps.has(key) || this.pinnedBitmaps.has(key)) return;
      if (this.blobs.has(key)) {
        void this.decodeCachedBlob(clip, f, false);
        return;
      }
      if (this.canFetchKey(key)) {
        nextQueue.push({ clip, frame: f, pin: false });
      }
    };

    tryPush(centerFrame);
    for (let offset = 1; offset <= radius; offset++) {
      tryPush(centerFrame + offset);
      tryPush(centerFrame - offset);
    }

    // Replace stale scroll lookahead cleanly so instant jumps fetch current frames immediately
    this.focusQueue = nextQueue;
  }

  private async decodeCachedBlob(clip: ClipIndex, frame: number, pin: boolean): Promise<void> {
    if (!this.active) return;
    const sid = this.sessionId;
    const key = `${clip}:${frame}`;
    const blob = this.blobs.get(key);
    if (!blob || this.bitmaps.has(key) || this.pinnedBitmaps.has(key)) return;
    if (this.inFlightDecode.has(key)) return;

    this.inFlightDecode.add(key);
    try {
      const bitmap = await createImageBitmap(blob);
      if (!this.active || sid !== this.sessionId) {
        bitmap.close();
        return;
      }
      if (pin) {
        this.pinnedBitmaps.set(key, bitmap);
      } else {
        this.insertLruBitmap(key, bitmap);
      }
      if (clip === this.priorityClip && (pin || Math.abs(frame - this.priorityFrame) <= 16)) {
        this.notify();
      }
    } catch {
      // Ignore transient decode abort
    } finally {
      this.inFlightDecode.delete(key);
    }
  }

  private async fetchAndDecode(clip: ClipIndex, frame: number, pin: boolean): Promise<void> {
    if (!this.active) return;
    const sid = this.sessionId;
    const key = `${clip}:${frame}`;

    if (!this.blobs.has(key)) {
      if (!this.canFetchKey(key)) return;
      this.inFlightFetch.add(key);
      try {
        const res = await fetch(getFrameUrl(clip, frame), {
          priority: frame === 0 ? 'high' : 'auto',
        } as RequestInit);
        if (!res.ok) {
          this.failedAttempts.set(key, (this.failedAttempts.get(key) ?? 0) + 1);
          this.lastFailureAt.set(key, performance.now());
          return;
        }
        const blob = await res.blob();
        if (!this.active || sid !== this.sessionId) return;
        this.blobs.set(key, blob);
        this.failedAttempts.delete(key);
        this.lastFailureAt.delete(key);
      } catch {
        this.failedAttempts.set(key, (this.failedAttempts.get(key) ?? 0) + 1);
        this.lastFailureAt.set(key, performance.now());
        return;
      } finally {
        this.inFlightFetch.delete(key);
      }
    }

    if (pin || (clip === this.priorityClip && Math.abs(frame - this.priorityFrame) <= 10)) {
      await this.decodeCachedBlob(clip, frame, pin);
    }
  }

  private insertLruBitmap(key: string, bitmap: ImageBitmap): void {
    if (this.bitmaps.has(key)) {
      const prev = this.bitmaps.get(key);
      this.bitmaps.delete(key);
      prev?.close();
    }
    this.bitmaps.set(key, bitmap);

    while (this.bitmaps.size > MAX_DECODED_WINDOW) {
      const oldestKey = this.bitmaps.keys().next().value;
      if (!oldestKey) break;
      const oldest = this.bitmaps.get(oldestKey);
      this.bitmaps.delete(oldestKey);
      oldest?.close();
    }
  }

  private schedulePump(): void {
    if (this.pumpRunning || this.pumpScheduled || !this.active) return;
    this.pumpScheduled = true;
    const sid = this.sessionId;
    window.setTimeout(() => {
      this.pumpScheduled = false;
      if (this.active && sid === this.sessionId && !this.pumpRunning) {
        void this.pumpFrames();
      }
    }, 16);
  }

  private buildNextBgBatch(limit: number): FrameTask[] {
    const clipOrder: ClipIndex[] = [
      this.priorityClip,
      ((this.priorityClip + 1) % 3) as ClipIndex,
      ((this.priorityClip + 2) % 3) as ClipIndex,
    ];
    const batch: FrameTask[] = [];

    for (const c of clipOrder) {
      const total = CINEMA_CLIPS[c].frameCount;
      const center = c === this.priorityClip ? this.priorityFrame : 0;
      for (let d = 0; d < total; d++) {
        const up = center + d;
        const down = center - d;
        if (up < total) {
          const k = `${c}:${up}`;
          if (this.canFetchKey(k) && !this.queuedAnchors.has(k)) {
            batch.push({ clip: c, frame: up, pin: false });
            if (batch.length >= limit) return batch;
          }
        }
        if (d > 0 && down >= 0) {
          const k = `${c}:${down}`;
          if (this.canFetchKey(k) && !this.queuedAnchors.has(k)) {
            batch.push({ clip: c, frame: down, pin: false });
            if (batch.length >= limit) return batch;
          }
        }
      }
    }
    return batch;
  }

  private async pumpFrames(): Promise<void> {
    if (!this.active || this.pumpRunning) return;
    const sid = this.sessionId;
    this.pumpRunning = true;

    let bgCursor = 0;
    let bgBatch: FrameTask[] = [];
    let lastBgClip: ClipIndex = this.priorityClip;

    const shiftValidFocus = (): { item: FrameTask; urgent: boolean } | null => {
      while (this.focusQueue.length > 0) {
        const next = this.focusQueue.shift()!;
        const key = `${next.clip}:${next.frame}`;
        if (this.canFetchKey(key)) {
          return { item: next, urgent: true };
        }
      }
      return null;
    };

    const shiftValidAnchor = (): { item: FrameTask; urgent: boolean } | null => {
      while (this.anchorQueue.length > 0) {
        const next = this.anchorQueue.shift()!;
        const key = `${next.clip}:${next.frame}`;
        this.queuedAnchors.delete(key);
        if (this.canFetchKey(key)) {
          return { item: next, urgent: true };
        }
      }
      return null;
    };

    const takeNext = (): { item: FrameTask; urgent: boolean } | null => {
      // On initial top view, land cross-act hero anchors first so any scroll jump has an immediate frame
      const atInitialRest = this.priorityClip === 0 && this.priorityFrame <= 2;
      if (atInitialRest) {
        const heroAnchor = shiftValidAnchor();
        if (heroAnchor) return heroAnchor;
        const focusJob = shiftValidFocus();
        if (focusJob) return focusJob;
      } else {
        const focusJob = shiftValidFocus();
        if (focusJob) return focusJob;
        const heroAnchor = shiftValidAnchor();
        if (heroAnchor) return heroAnchor;
      }

      if (lastBgClip !== this.priorityClip || bgCursor >= bgBatch.length) {
        lastBgClip = this.priorityClip;
        bgBatch = this.buildNextBgBatch(24);
        bgCursor = 0;
      }
      while (bgCursor < bgBatch.length) {
        const next = bgBatch[bgCursor++];
        const key = `${next.clip}:${next.frame}`;
        if (this.canFetchKey(key)) {
          return { item: next, urgent: false };
        }
      }
      return null;
    };

    try {
      const worker = async (): Promise<void> => {
        while (this.active && sid === this.sessionId) {
          const job = takeNext();
          if (!job) break;
          await this.fetchAndDecode(job.item.clip, job.item.frame, job.item.pin);
          if (!job.urgent && this.active && sid === this.sessionId) {
            await new Promise<void>((resolve) => window.setTimeout(resolve, 24));
          }
        }
      };
      await Promise.all(Array.from({ length: MAX_CONCURRENT_FETCHES }, () => worker()));
      if (this.active && sid === this.sessionId) {
        this.notify();
      }
    } finally {
      this.pumpRunning = false;
    }
  }

  public dispose(): void {
    this.active = false;
    this.pumpRunning = false;
    this.sessionId += 1;
    this.focusQueue = [];
    this.anchorQueue = [];
    this.queuedAnchors.clear();
    this.inFlightFetch.clear();
    this.inFlightDecode.clear();
    this.failedAttempts.clear();
    this.lastFailureAt.clear();
    this.blobs.clear();
    for (const bmp of this.bitmaps.values()) {
      bmp.close();
    }
    for (const bmp of this.pinnedBitmaps.values()) {
      bmp.close();
    }
    this.bitmaps.clear();
    this.pinnedBitmaps.clear();
  }
}

export function drawCoverBitmap(
  ctx: CanvasRenderingContext2D,
  bmp: ImageBitmap,
  canvasWidth: number,
  canvasHeight: number,
  scaleBoost = 1.0,
  alpha = 1.0
): void {
  const imgRatio = bmp.width / bmp.height;
  const viewRatio = canvasWidth / canvasHeight;

  let drawW = canvasWidth;
  let drawH = canvasHeight;

  if (viewRatio > imgRatio) {
    drawW = canvasWidth;
    drawH = canvasWidth / imgRatio;
  } else {
    drawH = canvasHeight;
    drawW = canvasHeight * imgRatio;
  }

  drawW *= scaleBoost;
  drawH *= scaleBoost;

  // Upper-focal bias keeps curly hair crown and downward hands safe on wide screens
  const dx = (canvasWidth - drawW) * 0.5;
  const dy = (canvasHeight - drawH) * 0.24;

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.globalAlpha = alpha;
  ctx.drawImage(bmp, dx, dy, drawW, drawH);
  ctx.restore();
}

