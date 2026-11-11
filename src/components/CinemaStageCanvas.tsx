import React, { useEffect, useRef } from 'react';
import { CINEMA_CLIPS } from '@/data/portfolio';
import {
  FrameSequenceStore,
  ScrubFrameState,
  drawCoverBitmap,
} from '@/lib/frameScrubEngine';
import { applyBeatVisuals, resolveUnifiedTimeline } from '@/lib/scrollBeats';

export interface CinemaStageCanvasProps {
  store: FrameSequenceStore;
  reducedMotion: boolean;
  onActChange: (actIndex: 0 | 1 | 2) => void;
  onScrollProgress?: (globalProgress: number) => void;
}

export const CinemaStageCanvas: React.FC<CinemaStageCanvasProps> = ({
  store,
  reducedMotion,
  onActChange,
  onScrollProgress,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const posterRef = useRef<HTMLImageElement | null>(null);
  const currentScrollRef = useRef<number>(0);
  const targetScrollRef = useRef<number>(0);
  const lastActRef = useRef<0 | 1 | 2>(0);
  const maxScrollRef = useRef<number>(6000);

  const reducedMotionRef = useRef(reducedMotion);
  reducedMotionRef.current = reducedMotion;

  const onActChangeRef = useRef(onActChange);
  const onScrollProgressRef = useRef(onScrollProgress);
  onActChangeRef.current = onActChange;
  onScrollProgressRef.current = onScrollProgress;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId: number | null = null;
    let lastTimestamp = performance.now();

    const measureMaxScroll = (): void => {
      maxScrollRef.current = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
    };

    const resizeCanvas = (): void => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.floor(window.innerWidth * dpr));
      const h = Math.max(1, Math.floor(window.innerHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      measureMaxScroll();
    };

    const renderState = (state: ScrubFrameState): void => {
      const w = canvas.width;
      const h = canvas.height;
      const activeBmp = store.getBestBitmap(state.activeClip, state.frameIndex);

      const subtleDrift = reducedMotionRef.current
        ? 1.0
        : 1.0 + Math.sin(state.globalProgress * Math.PI) * 0.018;

      if (state.secondaryClip !== null) {
        // Pre-warm boundary frames of the upcoming continuous segment before scroll arrives
        store.getBestBitmap(state.secondaryClip, 0);
        store.getBestBitmap(state.secondaryClip, 2);
      }

      if (state.secondaryClip !== null && state.blendAlpha > 0 && state.blendAlpha < 1) {
        const outClip = state.secondaryClip;
        const outTotal = CINEMA_CLIPS[outClip].frameCount;
        const outFrame = Math.min(
          outTotal - 1,
          Math.max(0, Math.round(state.clipProgress[outClip] * (outTotal - 1)))
        );
        const outBmp = store.getBestBitmap(outClip, outFrame);

        if (outBmp || activeBmp) {
          ctx.fillStyle = '#06080d';
          ctx.fillRect(0, 0, w, h);

          if (outBmp) {
            drawCoverBitmap(
              ctx,
              outBmp,
              w,
              h,
              1.02 + state.blendAlpha * 0.02,
              1 - state.blendAlpha
            );
          }

          if (activeBmp) {
            drawCoverBitmap(
              ctx,
              activeBmp,
              w,
              h,
              1.03 - state.blendAlpha * 0.03,
              state.blendAlpha
            );
          }

          if (posterRef.current && posterRef.current.style.display !== 'none') {
            posterRef.current.style.display = 'none';
          }
        }
      } else if (activeBmp) {
        ctx.fillStyle = '#06080d';
        ctx.fillRect(0, 0, w, h);
        drawCoverBitmap(ctx, activeBmp, w, h, subtleDrift, 1);
        if (posterRef.current && posterRef.current.style.display !== 'none') {
          posterRef.current.style.display = 'none';
        }
      }

      store.setFocus(state.activeClip, state.frameIndex);

      applyBeatVisuals(state, reducedMotionRef.current);

      if (state.activeClip !== lastActRef.current) {
        lastActRef.current = state.activeClip;
        onActChangeRef.current(state.activeClip);
      }
      onScrollProgressRef.current?.(state.globalProgress);
    };

    const tick = (now: number): void => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTimestamp) / 1000));
      lastTimestamp = now;

      const target = targetScrollRef.current;
      const current = currentScrollRef.current;

      if (reducedMotionRef.current || Math.abs(target - current) > window.innerHeight * 2.5) {
        currentScrollRef.current = target;
      } else {
        const factor = 1 - Math.exp(-24 * dt);
        currentScrollRef.current = current + (target - current) * factor;
      }

      const delta = Math.abs(target - currentScrollRef.current);
      const effectiveScroll = delta < 0.35 ? target : currentScrollRef.current;
      if (delta < 0.35) {
        currentScrollRef.current = target;
      }

      renderState(resolveUnifiedTimeline(effectiveScroll, maxScrollRef.current));

      if (delta >= 0.35 && !reducedMotionRef.current) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        rafId = null;
      }
    };

    const wakeLoop = (): void => {
      targetScrollRef.current = window.scrollY;
      measureMaxScroll();
      if (rafId === null) {
        lastTimestamp = performance.now();
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const syncStatic = (): void => {
      targetScrollRef.current = window.scrollY;
      currentScrollRef.current = window.scrollY;
      measureMaxScroll();
      renderState(resolveUnifiedTimeline(window.scrollY, maxScrollRef.current));
    };

    const unsubscribeStore = store.subscribe(() => {
      if (rafId === null) {
        renderState(resolveUnifiedTimeline(currentScrollRef.current, maxScrollRef.current));
      }
    });

    const stageOverlay = document.getElementById('cinema-stage-beats');
    const mutationObserver = stageOverlay
      ? new MutationObserver(() => {
          renderState(resolveUnifiedTimeline(currentScrollRef.current, maxScrollRef.current));
        })
      : null;
    if (stageOverlay && mutationObserver) {
      mutationObserver.observe(stageOverlay, { childList: true, subtree: true });
    }

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
      syncStatic();
    });
    resizeObserver.observe(document.body);

    syncStatic();

    window.addEventListener('scroll', wakeLoop, { passive: true });
    window.addEventListener('resize', resizeCanvas, { passive: true });

    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    let ptrTargetX = 0;
    let ptrTargetY = 0;
    let ptrCurX = 0;
    let ptrCurY = 0;
    let ptrRafId: number | null = null;

    const tickPointer = (): void => {
      ptrCurX += (ptrTargetX - ptrCurX) * 0.075;
      ptrCurY += (ptrTargetY - ptrCurY) * 0.075;
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

    if (finePointer && !reducedMotion) {
      window.addEventListener('pointermove', onPointerMove, { passive: true });
    } else {
      document.documentElement.style.setProperty('--ptr-x', '0');
      document.documentElement.style.setProperty('--ptr-y', '0');
    }

    return () => {
      mutationObserver?.disconnect();
      resizeObserver.disconnect();
      unsubscribeStore();
      window.removeEventListener('scroll', wakeLoop);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('pointermove', onPointerMove);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      if (ptrRafId !== null) window.cancelAnimationFrame(ptrRafId);
    };
  }, [store, reducedMotion]);

  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden bg-[#06080d] pointer-events-none select-none"
      aria-hidden="true"
    >
      <img
        ref={posterRef}
        src="/frames/clip1/001.webp"
        alt=""
        width={1280}
        height={720}
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover object-[50%_24%]"
      />
      <canvas
        ref={canvasRef}
        className="relative block h-full w-full"
      />

      {/* CSS Scroll-Driven Atmospheric Rim Aura (composited on modern engines) */}
      <div className="cinema-scroll-aura pointer-events-none absolute inset-0" />

      {/* Feathered side breathing room keeping center column open while grounding flank copy */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, rgba(6,8,13,0.42) 0%, rgba(6,8,13,0.14) 20%, rgba(6,8,13,0) 36%, rgba(6,8,13,0) 64%, rgba(6,8,13,0.14) 80%, rgba(6,8,13,0.42) 100%)',
        }}
      />

      {/* Top/bottom subtle edge breathing room */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(6,8,13,0.34) 0%, rgba(6,8,13,0) 14%, rgba(6,8,13,0) 76%, rgba(6,8,13,0.48) 100%)',
        }}
      />

      <div className="cinema-grain absolute inset-0 opacity-[0.03]" />
    </div>
  );
};
