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

const MAX_DECODED_WINDOW = 42;
const KEYFRAME_STRIDE = 24;
const MAX_CONCURRENT_FETCHES = 3;
const MAX_FETCH_ATTEMPTS = 2;

function padFrame(indexOneBased: number): string {
  return String(indexOneBased).padStart(3, '0');
}

const FRAME_CACHE_VERSION = '20261111';

function getFrameUrl(clipIndex: ClipIndex, frameIdxZeroBased: number): string {
  const clip = CINEMA_CLIPS[clipIndex];
  const clamped = Math.max(0, Math.min(clip.frameCount - 1, frameIdxZeroBased));
  return `${clip.frameDir}/${padFrame(clamped + 1)}.webp?v=${FRAME_CACHE_VERSION}`;
}

/**
 * Manages compressed WebP frame fetching and an LRU-bounded ImageBitmap cache
 * so scrolling across 432 720p frames stays instant in both directions without VRAM bloat.
 */
export class FrameSequenceStore {
  private blobs: Map<string, Blob> = new Map();
  private inFlightFetch: Set<string> = new Set();
  private urgentQueue: Array<{ clip: ClipIndex; frame: number; pin: boolean }> = [];
  private queuedKeys: Set<string> = new Set();
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
    this.enqueueFocusWindow(clip, frame, 14);
    this.schedulePump();
  }

  public startPreloadAll(): void {
    this.sessionId += 1;
    this.active = true;
    this.pumpRunning = false;
    this.pumpScheduled = false;
    this.urgentQueue = [];
    this.queuedKeys.clear();
    this.inFlightFetch.clear();
    this.inFlightDecode.clear();
    this.failedAttempts.clear();
    this.lastFailureAt.clear();

    // Prioritize anchor frame 0 of each clip, deferring background scrub preload cleanly
    this.enqueueFrame(0, 0, true, true);
    this.enqueueFrame(1, 0, true, true);
    this.enqueueFrame(2, 0, true, true);

    for (let c = 0 as ClipIndex; c <= 2; c = (c + 1) as ClipIndex) {
      const total = CINEMA_CLIPS[c].frameCount;
      for (let f = 0; f < total; f += KEYFRAME_STRIDE) {
        this.enqueueFrame(c, f, true, false);
      }
      this.enqueueFrame(c, total - 1, true, false);
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
    } else {
      this.enqueueFrame(clip, targetFrame, false, true);
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

  private enqueueFrame(clip: ClipIndex, frame: number, pin: boolean, front: boolean): void {
    if (!this.active) return;
    const total = CINEMA_CLIPS[clip].frameCount;
    if (frame < 0 || frame >= total) return;

    const key = `${clip}:${frame}`;
    if (this.bitmaps.has(key) || this.pinnedBitmaps.has(key)) return;
    if (this.blobs.has(key)) {
      void this.decodeCachedBlob(clip, frame, pin);
      return;
    }
    if (!this.canFetchKey(key) || this.queuedKeys.has(key)) return;

    this.queuedKeys.add(key);
    const task = { clip, frame, pin };
    if (front) {
      this.urgentQueue.unshift(task);
    } else {
      this.urgentQueue.push(task);
    }
  }

  private enqueueFocusWindow(clip: ClipIndex, centerFrame: number, radius: number): void {
    // Trim stale urgent lookahead so fast scrolling prioritizes the current viewport region
    if (this.urgentQueue.length > 72) {
      this.urgentQueue.length = 24;
      this.queuedKeys = new Set(this.urgentQueue.map((item) => `${item.clip}:${item.frame}`));
    }
    for (let offset = radius; offset >= 1; offset--) {
      this.enqueueFrame(clip, centerFrame - offset, false, true);
      this.enqueueFrame(clip, centerFrame + offset, false, true);
    }
    this.enqueueFrame(clip, centerFrame, false, true);
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
      if (clip === this.priorityClip && Math.abs(frame - this.priorityFrame) <= 16) {
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

  private buildNextBgBatch(limit: number): Array<{ clip: ClipIndex; frame: number; pin: boolean }> {
    const clipOrder: ClipIndex[] = [
      this.priorityClip,
      ((this.priorityClip + 1) % 3) as ClipIndex,
      ((this.priorityClip + 2) % 3) as ClipIndex,
    ];
    const batch: Array<{ clip: ClipIndex; frame: number; pin: boolean }> = [];

    for (const c of clipOrder) {
      const total = CINEMA_CLIPS[c].frameCount;
      const center = c === this.priorityClip ? this.priorityFrame : 0;
      for (let d = 0; d < total; d++) {
        const up = center + d;
        const down = center - d;
        if (up < total) {
          const k = `${c}:${up}`;
          if (this.canFetchKey(k) && !this.queuedKeys.has(k)) {
            batch.push({ clip: c, frame: up, pin: false });
            if (batch.length >= limit) return batch;
          }
        }
        if (d > 0 && down >= 0) {
          const k = `${c}:${down}`;
          if (this.canFetchKey(k) && !this.queuedKeys.has(k)) {
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
    let bgBatch: Array<{ clip: ClipIndex; frame: number; pin: boolean }> = [];

    const takeNext = (): { item: { clip: ClipIndex; frame: number; pin: boolean }; urgent: boolean } | null => {
      while (this.urgentQueue.length > 0) {
        const next = this.urgentQueue.shift()!;
        const key = `${next.clip}:${next.frame}`;
        this.queuedKeys.delete(key);
        if (this.canFetchKey(key)) {
          return { item: next, urgent: true };
        }
      }
      if (bgCursor >= bgBatch.length) {
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
            await new Promise<void>((resolve) => window.setTimeout(resolve, 16));
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
    this.urgentQueue = [];
    this.queuedKeys.clear();
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
  ctx.globalAlpha = alpha;
  ctx.drawImage(bmp, dx, dy, drawW, drawH);
  ctx.restore();
}

