import React, { useEffect, useRef } from 'react';
import {
  HERO_POSTER_URL,
  VIDEO_ASSET_URL,
} from '@/lib/frameScrubEngine';
import { applyFingertips } from '@/lib/fingertips';
import {
  applyBeatVisuals,
  resolveUnifiedTimeline,
  VIDEO_DURATION_SECONDS,
} from '@/lib/scrollBeats';

export interface CinemaStageCanvasProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  reducedMotion: boolean;
  onActChange: (actIndex: 0 | 1 | 2) => void;
  onScrollProgress?: (globalProgress: number) => void;
}

export const CinemaStageCanvas: React.FC<CinemaStageCanvasProps> = ({
  videoRef,
  reducedMotion,
  onActChange,
  onScrollProgress,
}) => {
  const stageBoxRef = useRef<HTMLDivElement | null>(null);
  const posterRef = useRef<HTMLImageElement | null>(null);
  const videoLayerRef = useRef<HTMLDivElement | null>(null);
  const lastActRef = useRef<0 | 1 | 2>(0);
  const maxScrollRef = useRef<number>(6000);
  const desiredTimeRef = useRef<number>(0);

  const reducedMotionRef = useRef(reducedMotion);
  reducedMotionRef.current = reducedMotion;

  const onActChangeRef = useRef(onActChange);
  const onScrollProgressRef = useRef(onScrollProgress);
  onActChangeRef.current = onActChange;
  onScrollProgressRef.current = onScrollProgress;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const posterImg = posterRef.current;
    const videoLayer = videoLayerRef.current;

    let rafId: number | null = null;
    let watchdogTimer: number | null = null;
    let revealFallbackTimer: number | null = null;
    let seekStartedAt = 0;
    let hasFirstFrame = false;
    let blobUrl: string | null = null;
    const abortCtrl = new AbortController();

    video.defaultMuted = true;
    video.muted = true;
    // One download, held in memory: every scroll seek is then local. Streaming the URL while
    // also fetching it made two transfers fight over the connection and stalled seeks on real networks.
    const root = document.documentElement;
    void fetch(VIDEO_ASSET_URL, { signal: abortCtrl.signal })
      .then(async (res) => {
        if (!res.ok || !res.body) throw new Error(`reel ${res.status}`);
        // Read in chunks so the loading line can show real progress
        const total = Number(res.headers.get('content-length')) || 0;
        const reader = res.body.getReader();
        const chunks: BlobPart[] = [];
        let loaded = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          loaded += value.byteLength;
          if (total) root.style.setProperty('--reel-load', (loaded / total).toFixed(3));
        }
        return new Blob(chunks, { type: 'video/mp4' });
      })
      .then((blob) => {
        if (abortCtrl.signal.aborted) return;
        blobUrl = URL.createObjectURL(blob);
        video.src = blobUrl;
        video.load();
        root.dataset.reelReady = 'true';
      })
      .catch(() => {
        // Fall back to plain streaming if the in-memory download fails (e.g. low memory, flaky fetch)
        if (abortCtrl.signal.aborted) return;
        video.src = VIDEO_ASSET_URL;
        video.load();
        root.dataset.reelReady = 'true';
      });

    const measureMaxScroll = (): void => {
      maxScrollRef.current = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
    };

    const getDuration = (): number =>
      Number.isFinite(video.duration) && video.duration > 1
        ? video.duration
        : VIDEO_DURATION_SECONDS;

    const revealVideo = (): void => {
      if (hasFirstFrame) return;
      hasFirstFrame = true;
      video.style.opacity = '1';
      if (posterImg) {
        posterImg.style.opacity = '0';
        window.setTimeout(() => {
          if (hasFirstFrame && posterImg) {
            posterImg.style.display = 'none';
          }
        }, 220);
      }
    };

    const flushSeek = (): void => {
      if (video.readyState < 1) return;
      if (!video.paused) {
        video.pause();
      }

      const now = performance.now();
      if (video.seeking && now - seekStartedAt < 420) {
        if (watchdogTimer === null) {
          watchdogTimer = window.setTimeout(() => {
            watchdogTimer = null;
            flushSeek();
          }, 450);
        }
        return;
      }

      if (watchdogTimer !== null) {
        window.clearTimeout(watchdogTimer);
        watchdogTimer = null;
      }

      const dur = getDuration();
      const clamped = Math.max(0, Math.min(dur - 0.01, desiredTimeRef.current));
      if (Math.abs(video.currentTime - clamped) > 0.018) {
        seekStartedAt = now;
        video.currentTime = clamped;
      }
    };

    // Media time of the frame currently on screen (-1 until the first frame is presented).
    // Text is painted from this, not from the scroll target: during a fast scroll the decoder
    // lags a few frames, and text driven by scroll would run ahead of the hand in the picture.
    let shownTime = -1;
    let frameCallbackId = 0;

    const paintOverlays = (): void => {
      const t = shownTime >= 0 ? shownTime : desiredTimeRef.current;
      const state = resolveUnifiedTimeline(t / getDuration(), 1);
      applyBeatVisuals(state, reducedMotionRef.current);
      applyFingertips(t);
      if (state.activeClip !== lastActRef.current) {
        lastActRef.current = state.activeClip;
        onActChangeRef.current(state.activeClip);
      }
    };

    const onFramePresented = (_now: number, meta: VideoFrameCallbackMetadata): void => {
      shownTime = meta.mediaTime;
      paintOverlays();
      frameCallbackId = video.requestVideoFrameCallback(onFramePresented);
    };
    if ('requestVideoFrameCallback' in video) {
      frameCallbackId = video.requestVideoFrameCallback(onFramePresented);
    }

    const syncTimeline = (): void => {
      const state = resolveUnifiedTimeline(window.scrollY, maxScrollRef.current);
      const dur = getDuration();
      desiredTimeRef.current = Math.max(0, Math.min(dur - 0.01, state.globalProgress * dur));

      if (videoLayer && !reducedMotionRef.current) {
        const drift = 1 + Math.sin(state.globalProgress * Math.PI) * 0.006;
        videoLayer.style.transform = `translate3d(0, 0, 0) scale(${drift.toFixed(4)})`;
      } else if (videoLayer) {
        videoLayer.style.transform = 'none';
      }

      flushSeek();

      paintOverlays();
      onScrollProgressRef.current?.(state.globalProgress);
    };

    const scheduleSync = (): void => {
      measureMaxScroll();
      if (rafId === null) {
        rafId = window.requestAnimationFrame(() => {
          rafId = null;
          syncTimeline();
        });
      }
    };

    const onLoadedData = (): void => {
      if (Math.abs(video.currentTime - desiredTimeRef.current) <= 0.35 || desiredTimeRef.current <= 0.15) {
        revealVideo();
      } else {
        flushSeek();
      }
    };

    const onSeeked = (): void => {
      revealVideo();
      // also covers browsers without requestVideoFrameCallback and hidden tabs where it does not fire
      shownTime = video.currentTime;
      paintOverlays();
      flushSeek();
    };

    const onCanPlay = (): void => {
      if (Math.abs(video.currentTime - desiredTimeRef.current) <= 0.35 || desiredTimeRef.current <= 0.15) {
        revealVideo();
      }
      flushSeek();
    };

    video.addEventListener('loadedmetadata', flushSeek);
    video.addEventListener('loadeddata', onLoadedData);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('seeked', onSeeked);

    revealFallbackTimer = window.setTimeout(() => {
      if (video.readyState >= 2) {
        revealVideo();
      }
    }, 1800);

    const stageOverlay = document.getElementById('cinema-stage-beats');
    const mutationObserver = stageOverlay
      ? new MutationObserver(() => {
          syncTimeline();
        })
      : null;
    if (stageOverlay && mutationObserver) {
      mutationObserver.observe(stageOverlay, { childList: true, subtree: true });
    }

    const resizeObserver = new ResizeObserver(() => {
      measureMaxScroll();
      syncTimeline();
    });
    resizeObserver.observe(document.body);

    measureMaxScroll();
    syncTimeline();

    window.addEventListener('scroll', scheduleSync, { passive: true });
    window.addEventListener('resize', scheduleSync, { passive: true });

    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    let ptrTargetX = 0;
    let ptrTargetY = 0;
    let ptrCurX = 0;
    let ptrCurY = 0;
    let ptrRafId: number | null = null;

    const tickPointer = (): void => {
      ptrCurX += (ptrTargetX - ptrCurX) * 0.085;
      ptrCurY += (ptrTargetY - ptrCurY) * 0.085;
      if (stageOverlay) {
        stageOverlay.style.setProperty('--ptr-x', ptrCurX.toFixed(4));
        stageOverlay.style.setProperty('--ptr-y', ptrCurY.toFixed(4));
      }
      if (Math.abs(ptrTargetX - ptrCurX) > 0.004 || Math.abs(ptrTargetY - ptrCurY) > 0.004) {
        ptrRafId = window.requestAnimationFrame(tickPointer);
      } else {
        ptrRafId = null;
      }
    };

    const onPointerMove = (e: PointerEvent): void => {
      if (reducedMotionRef.current || !finePointer) return;
      ptrTargetX = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
      ptrTargetY = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
      if (ptrRafId === null) {
        ptrRafId = window.requestAnimationFrame(tickPointer);
      }
    };

    if (finePointer && !reducedMotion && stageOverlay) {
      window.addEventListener('pointermove', onPointerMove, { passive: true });
    } else if (stageOverlay) {
      stageOverlay.style.setProperty('--ptr-x', '0');
      stageOverlay.style.setProperty('--ptr-y', '0');
    }

    return () => {
      abortCtrl.abort();
      if (watchdogTimer !== null) window.clearTimeout(watchdogTimer);
      if (revealFallbackTimer !== null) window.clearTimeout(revealFallbackTimer);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      if (ptrRafId !== null) window.cancelAnimationFrame(ptrRafId);
      mutationObserver?.disconnect();
      resizeObserver.disconnect();
      video.removeEventListener('loadedmetadata', flushSeek);
      video.removeEventListener('loadeddata', onLoadedData);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('seeked', onSeeked);
      if (frameCallbackId) video.cancelVideoFrameCallback(frameCallbackId);
      window.removeEventListener('scroll', scheduleSync);
      window.removeEventListener('resize', scheduleSync);
      window.removeEventListener('pointermove', onPointerMove);
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [reducedMotion, videoRef]);

  return (
    <div
      ref={stageBoxRef}
      className="fixed inset-0 z-0 overflow-hidden bg-[#06080d] pointer-events-none select-none"
      aria-hidden="true"
    >
      <div className="reel-loadbar" />
      <img
        ref={posterRef}
        src={HERO_POSTER_URL}
        alt=""
        width={1280}
        height={720}
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover object-[50%_24%] transition-opacity duration-200"
      />

      <div
        ref={videoLayerRef}
        className="absolute inset-0 h-full w-full origin-[50%_24%]"
      >
        <video
          ref={videoRef}
          poster={HERO_POSTER_URL}
          width={1280}
          height={720}
          preload="auto"
          playsInline
          muted
          disablePictureInPicture
          className="block h-full w-full object-cover object-[50%_24%] opacity-0 transition-opacity duration-200"
        />
      </div>

      {/* CSS Scroll-Driven Atmospheric Rim Aura (composited on modern engines) */}
      <div className="cinema-scroll-aura pointer-events-none absolute inset-0" />

      {/* Feather only outer viewport edges lightly so video clarity stays vivid */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(6,8,13,0.34) 0%, rgba(6,8,13,0) 14%, rgba(6,8,13,0) 78%, rgba(6,8,13,0.44) 100%)',
        }}
      />

      <div className="cinema-grain absolute inset-0 opacity-[0.02]" />
    </div>
  );
};
