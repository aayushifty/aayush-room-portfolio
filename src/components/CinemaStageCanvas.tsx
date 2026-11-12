import React, { useEffect, useRef } from 'react';
import {
  HERO_POSTER_URL,
  pickReelUrl,
  pickUpgradeUrl,
} from '@/lib/frameScrubEngine';
import { restTime } from '@/lib/restFrames';
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

const ROOM_ACCENTS = ['#f5c46b', '#ffb4c4', '#7fe9df'];

export const CinemaStageCanvas: React.FC<CinemaStageCanvasProps> = ({
  videoRef,
  reducedMotion,
  onActChange,
  onScrollProgress,
}) => {
  const stageBoxRef = useRef<HTMLDivElement | null>(null);
  const posterRef = useRef<HTMLImageElement | null>(null);
  const latchRef = useRef<HTMLCanvasElement | null>(null);
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

    let rafId: number | null = null;
    let watchdogTimer: number | null = null;
    let restTimer: number | null = null;
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
    // Once the light reel is running, fetch the sharpest one this screen can show and swap it in.
    // The frame on screen is held in a canvas while the element reloads, so the swap is not seen.
    // While the page rests on the opening frame, the full-quality poster stays up until the sharp
    // reel is in; the light reel is shown only if the visitor starts scrolling before that.
    let awaitingUpgrade = pickUpgradeUrl() !== null;
    const settle = (): void => {
      awaitingUpgrade = false;
      if (video.readyState >= 2) revealVideo();
    };

    const upgradeReel = async (): Promise<void> => {
      const hiUrl = pickUpgradeUrl();
      if (!hiUrl) {
        settle();
        return;
      }
      try {
        const res = await fetch(hiUrl, { signal: abortCtrl.signal });
        if (!res.ok) {
          settle();
          return;
        }
        const hi = await res.blob();
        if (abortCtrl.signal.aborted) return;
        const latch = latchRef.current;
        if (latch && video.videoWidth) {
          latch.width = video.videoWidth;
          latch.height = video.videoHeight;
          latch.getContext('2d')?.drawImage(video, 0, 0);
          latch.style.opacity = '1';
        }
        const old = blobUrl;
        let released = false;
        const release = (): void => {
          if (released) return;
          released = true;
          if (latch) latch.style.opacity = '0';
          if (old) URL.revokeObjectURL(old);
          settle();
        };
        video.addEventListener(
          'loadeddata',
          () => {
            if (desiredTimeRef.current <= 0.15) release();
            else video.addEventListener('seeked', release, { once: true });
            // no seek happens when the new reel already sits on the wanted frame
            window.setTimeout(release, 1200);
          },
          { once: true }
        );
        blobUrl = URL.createObjectURL(hi);
        video.src = blobUrl;
        video.load();
      } catch {
        // the light reel keeps playing
        settle();
      }
    };

    const reelUrl = pickReelUrl();
    // take the download index.html already started; a second mount (StrictMode) fetches again
    const early = window.__reel?.res;
    if (window.__reel) window.__reel.res = undefined;
    void (early ?? fetch(reelUrl, { signal: abortCtrl.signal }))
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
          if (total) {
            root.style.setProperty('--reel-load', (loaded / total).toFixed(3));
            root.style.setProperty('--reel-pct', String(Math.round((loaded / total) * 100)));
          }
        }
        return new Blob(chunks, { type: 'video/mp4' });
      })
      .then((blob) => {
        if (abortCtrl.signal.aborted) return;
        blobUrl = URL.createObjectURL(blob);
        video.src = blobUrl;
        video.load();
        root.dataset.reelReady = 'true';
        void upgradeReel();
      })
      .catch(() => {
        // Fall back to plain streaming if the in-memory download fails (e.g. low memory, flaky fetch)
        if (abortCtrl.signal.aborted) return;
        awaitingUpgrade = false;
        video.src = reelUrl;
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
      if (awaitingUpgrade && desiredTimeRef.current <= 0.15) return;
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
      if (video.seeking && now - seekStartedAt < 1500) {
        if (watchdogTimer === null) {
          watchdogTimer = window.setTimeout(() => {
            watchdogTimer = null;
            flushSeek();
          }, 1550);
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

    // Scrolling forward PLAYS the reel toward the scroll position, sped up to catch it, so the
    // decoder presents every frame in order. Seeking each scroll step re-decodes from the last
    // keyframe every time (23-110 ms measured), which showed about 1 frame in 5 under a wheel.
    // Seeks remain for scrolling back, long jumps, and landing on the exact frame at rest.
    const drive = (): void => {
      const ahead = desiredTimeRef.current - video.currentTime;
      if (!reducedMotionRef.current && video.readyState >= 2 && !video.seeking && ahead > 0.06 && ahead < 4) {
        video.playbackRate = Math.min(2.5, Math.max(0.75, ahead * 3));
        if (video.paused) void video.play().catch(flushSeek);
        return;
      }
      flushSeek();
    };

    // Media time of the frame currently on screen (-1 until the first frame is presented).
    // Text is painted from this, not from the scroll target: during a fast scroll the decoder
    // lags a few frames, and text driven by scroll would run ahead of the hand in the picture.
    let shownTime = -1;
    let frameCallbackId = 0;

    const paintOverlays = (): void => {
      const target = desiredTimeRef.current;
      // Lock text to the rendered video frame during active scrubbing, but never freeze
      // overlays behind scroll if the decoder falls >0.75s behind or has not jumped yet.
      const t =
        shownTime >= 0 && (!video.paused || Math.abs(target - shownTime) <= 0.75)
          ? shownTime
          : target;
      const state = resolveUnifiedTimeline(t / getDuration(), 1);
      applyBeatVisuals(state, reducedMotionRef.current);
      applyFingertips(t);
      // stage light: tinted by the room on screen, blooming for a few frames as one room cuts to the next
      const rootStyle = document.documentElement.style;
      rootStyle.setProperty('--room-accent', ROOM_ACCENTS[state.activeClip] ?? ROOM_ACCENTS[0]);
      rootStyle.setProperty('--cut', Math.max(0, 1 - Math.min(Math.abs(t - 10), Math.abs(t - 20)) / 0.3).toFixed(3));
      if (state.activeClip !== lastActRef.current) {
        lastActRef.current = state.activeClip;
        onActChangeRef.current(state.activeClip);
      }
    };

    const onFramePresented = (_now: number, meta: VideoFrameCallbackMetadata): void => {
      shownTime = meta.mediaTime;
      paintOverlays();
      if (!video.paused) drive();
      frameCallbackId = video.requestVideoFrameCallback(onFramePresented);
    };
    if ('requestVideoFrameCallback' in video) {
      frameCallbackId = video.requestVideoFrameCallback(onFramePresented);
    }

    // Frames caught mid-gesture are motion-blurred in the footage. When scrolling stops on one,
    // the film eases on to the nearest calm frame (restAt) and waits there until the scroll
    // position passes it, so a held picture is always a sharp one.
    let lastRaw = -1;
    let restAt = -1;
    const settleOnRest = (): void => {
      restTimer = null;
      const r = Math.min(getDuration() - 0.01, restTime(lastRaw));
      if (Math.abs(r - lastRaw) < 0.02) return;
      restAt = r;
      desiredTimeRef.current = r;
      drive();
    };

    const syncTimeline = (): void => {
      const state = resolveUnifiedTimeline(window.scrollY, maxScrollRef.current);
      const dur = getDuration();
      const raw = Math.max(0, Math.min(dur - 0.01, state.globalProgress * dur));
      if (Math.abs(raw - lastRaw) > 0.004) {
        const forward = raw > lastRaw;
        lastRaw = raw;
        // keep waiting only while the scroll is still heading toward the rest frame
        if (restAt >= 0 && forward !== raw < restAt) restAt = -1;
        if (restTimer !== null) window.clearTimeout(restTimer);
        restTimer = window.setTimeout(settleOnRest, 180);
      }
      desiredTimeRef.current = restAt >= 0 ? restAt : raw;

      drive();

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
      if (watchdogTimer !== null) {
        window.clearTimeout(watchdogTimer);
        watchdogTimer = null;
      }
      revealVideo();
      // also covers browsers without requestVideoFrameCallback and hidden tabs where it does not fire
      shownTime = video.currentTime;
      paintOverlays();
      drive();
    };

    const onCanPlay = (): void => {
      if (Math.abs(video.currentTime - desiredTimeRef.current) <= 0.35 || desiredTimeRef.current <= 0.15) {
        revealVideo();
      }
      drive();
    };

    video.addEventListener('loadedmetadata', flushSeek);
    video.addEventListener('loadeddata', onLoadedData);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('seeked', onSeeked);
    // if the browser pauses playback itself (hidden tab, power saving), still land on the exact frame
    video.addEventListener('pause', flushSeek);

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
      document.documentElement.style.setProperty('--ptr-x', ptrCurX.toFixed(4));
      document.documentElement.style.setProperty('--ptr-y', ptrCurY.toFixed(4));
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
      if (restTimer !== null) window.clearTimeout(restTimer);
      if (revealFallbackTimer !== null) window.clearTimeout(revealFallbackTimer);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      if (ptrRafId !== null) window.cancelAnimationFrame(ptrRafId);
      mutationObserver?.disconnect();
      resizeObserver.disconnect();
      video.removeEventListener('loadedmetadata', flushSeek);
      video.removeEventListener('loadeddata', onLoadedData);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('pause', flushSeek);
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
        <canvas
          ref={latchRef}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[50%_24%] opacity-0"
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

      <div className="reel-pointer-light" />
      <div className="reel-cut" />
      <div className="cinema-grain absolute inset-0 opacity-[0.02]" />
    </div>
  );
};
