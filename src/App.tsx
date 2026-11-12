import React, { useCallback, useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import { CINEMA_CLIPS, CredentialItem, ProjectItem } from '@/data/portfolio';
import { SECTION_PROGRESS_MAP, VIDEO_DURATION_SECONDS } from '@/lib/scrollBeats';
import { CinemaStageCanvas } from '@/components/CinemaStageCanvas';
import { CinemaHUD } from '@/components/CinemaHUD';
import { GestureStage } from '@/components/GestureStage';
import { DossierDialog, DossierSelection } from '@/components/DossierDialog';

export default function App(): React.ReactElement {
  const [activeAct, setActiveAct] = useState<0 | 1 | 2>(0);
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );
  const [dossierSelection, setDossierSelection] = useState<DossierSelection>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const timecodeRef = useRef<HTMLSpanElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isAutoPlayingRef = useRef<boolean>(false);
  const dossierOpenRef = useRef<boolean>(false);
  const lenisRef = useRef<Lenis | null>(null);
  const jumpTimerRef = useRef<number | null>(null);
  const autoPlayRafRef = useRef<number | null>(null);

  dossierOpenRef.current = Boolean(dossierSelection);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent): void => {
      setReducedMotion(e.matches);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      lenisRef.current?.destroy();
      lenisRef.current = null;
      return;
    }

    const lenis = new Lenis({
      duration: 0.85,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1.15,
      touchMultiplier: 1.15,
    });
    lenisRef.current = lenis;

    let rafId = 0;
    const raf = (time: number): void => {
      lenis.raf(time);
      rafId = window.requestAnimationFrame(raf);
    };
    rafId = window.requestAnimationFrame(raf);

    return () => {
      window.cancelAnimationFrame(rafId);
      if (jumpTimerRef.current !== null) {
        window.clearTimeout(jumpTimerRef.current);
      }
      delete document.documentElement.dataset.cinemaJumping;
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (dossierSelection || isAutoPlaying) {
      lenisRef.current?.stop();
    } else if (lenisRef.current) {
      lenisRef.current.start();
      lenisRef.current.scrollTo(window.scrollY, {
        immediate: true,
        force: true,
      });
    }
  }, [dossierSelection, isAutoPlaying]);

  useEffect(() => {
    const clip = CINEMA_CLIPS[activeAct];
    document.documentElement.style.setProperty('--act-accent', clip.accentHex);
    document.documentElement.style.setProperty('--act-accent-soft', clip.accentSoft);
  }, [activeAct]);

  const stopAutoPlay = useCallback(() => {
    isAutoPlayingRef.current = false;
    if (autoPlayRafRef.current !== null) {
      window.cancelAnimationFrame(autoPlayRafRef.current);
      autoPlayRafRef.current = null;
    }
    const video = videoRef.current;
    if (video) {
      if (!video.paused) {
        video.pause();
      }
      video.muted = true;
    }
    if (!dossierOpenRef.current && lenisRef.current) {
      lenisRef.current.start();
      lenisRef.current.scrollTo(window.scrollY, {
        immediate: true,
        force: true,
      });
    }
    setIsAutoPlaying(false);
  }, []);

  const startPlaybackFrom = useCallback((startSec: number) => {
    isAutoPlayingRef.current = true;
    lenisRef.current?.stop();
    setIsAutoPlaying(true);

    const video = videoRef.current;
    if (!video) return;

    const beginVideo = (): void => {
      if (!isAutoPlayingRef.current) return;
      try {
        const safeDuration =
          Number.isFinite(video.duration) && video.duration > 0.5
            ? video.duration
            : VIDEO_DURATION_SECONDS;
        const clampedSec = Math.min(safeDuration - 0.04, Math.max(0, startSec));
        if (Math.abs(video.currentTime - clampedSec) > 0.04) {
          video.currentTime = clampedSec;
        }
        video.muted = false;
        const playPromise = video.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch((err: unknown) => {
            if (!isAutoPlayingRef.current) return;
            const isBlocked =
              err instanceof DOMException &&
              (err.name === 'NotAllowedError' || err.name === 'NotSupportedError');
            if (isBlocked || !video.muted) {
              // Retry muted when unmuted autoplay is restricted by the browser
              video.muted = true;
              video.play().catch(() => {
                // Wall-clock rAF fallback in stepPlayback keeps visual timeline moving
              });
            }
          });
        }
      } catch {
        // Ignore seek error before metadata loads; wall-clock rAF advances cleanly
      }
    };

    if (video.readyState >= 1) {
      beginVideo();
    } else {
      video.addEventListener('loadedmetadata', beginVideo, { once: true });
      video.load();
    }
  }, []);

  const handleToggleAutoPlay = useCallback(() => {
    if (isAutoPlaying) {
      stopAutoPlay();
      return;
    }

    const maxScroll = Math.max(
      1,
      document.documentElement.scrollHeight - window.innerHeight
    );
    const curProgress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    const restartFromTop = curProgress >= 0.96;
    const startSec = restartFromTop ? 0 : curProgress * VIDEO_DURATION_SECONDS;

    if (restartFromTop) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }

    startPlaybackFrom(startSec);
  }, [isAutoPlaying, startPlaybackFrom, stopAutoPlay]);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const maxScroll = Math.max(
      1,
      document.documentElement.scrollHeight - window.innerHeight
    );
    const curProgress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    let baseOffsetSec = curProgress * VIDEO_DURATION_SECONDS;
    let basePerfMs = performance.now();
    const effectStartMs = basePerfMs;
    let videoStartedPlaying = false;

    const stepPlayback = (now: number): void => {
      if (!isAutoPlayingRef.current) return;

      const currentMax = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const video = videoRef.current;
      const duration =
        video && Number.isFinite(video.duration) && video.duration > 1
          ? video.duration
          : VIDEO_DURATION_SECONDS;

      let elapsedSec = baseOffsetSec;

      if (video && !video.paused && !video.ended) {
        videoStartedPlaying = true;
        elapsedSec = video.currentTime;
        baseOffsetSec = elapsedSec;
        basePerfMs = now;
      } else if (
        video?.ended ||
        (videoStartedPlaying && video && video.currentTime >= duration - 0.04)
      ) {
        elapsedSec = duration;
      } else if (now - effectStartMs > 280) {
        elapsedSec = baseOffsetSec + (now - basePerfMs) / 1000;
        if (
          video &&
          video.paused &&
          !video.seeking &&
          video.readyState >= 1 &&
          Math.abs(video.currentTime - elapsedSec) > 0.05
        ) {
          video.currentTime = Math.min(duration - 0.04, elapsedSec);
        }
      }

      const progress = Math.min(1, Math.max(0, elapsedSec / duration));
      window.scrollTo({ top: progress * currentMax, behavior: 'auto' });

      if (progress >= 1 || video?.ended) {
        stopAutoPlay();
        return;
      }

      autoPlayRafRef.current = window.requestAnimationFrame(stepPlayback);
    };

    autoPlayRafRef.current = window.requestAnimationFrame(stepPlayback);

    const cancelOnManualInput = (): void => {
      stopAutoPlay();
    };

    const cancelOnScrollKey = (e: KeyboardEvent): void => {
      if (
        e.key === 'ArrowDown' ||
        e.key === 'ArrowUp' ||
        e.key === 'PageDown' ||
        e.key === 'PageUp' ||
        e.key === 'Home' ||
        e.key === 'End' ||
        e.key === ' '
      ) {
        stopAutoPlay();
      }
    };

    window.addEventListener('wheel', cancelOnManualInput, { passive: true });
    window.addEventListener('touchstart', cancelOnManualInput, { passive: true });
    window.addEventListener('keydown', cancelOnScrollKey);

    return () => {
      if (autoPlayRafRef.current !== null) {
        window.cancelAnimationFrame(autoPlayRafRef.current);
        autoPlayRafRef.current = null;
      }
      window.removeEventListener('wheel', cancelOnManualInput);
      window.removeEventListener('touchstart', cancelOnManualInput);
      window.removeEventListener('keydown', cancelOnScrollKey);
    };
  }, [isAutoPlaying, stopAutoPlay]);

  useEffect(() => {
    if (dossierSelection && isAutoPlaying) {
      stopAutoPlay();
    }
  }, [dossierSelection, isAutoPlaying, stopAutoPlay]);

  const handleNavigateSection = useCallback(
    (sectionId: string) => {
      stopAutoPlay();

      const targetProgress = SECTION_PROGRESS_MAP[sectionId];
      if (typeof targetProgress !== 'number') return;

      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const targetY = Math.round(targetProgress * maxScroll);
      const distance = Math.abs(targetY - window.scrollY);

      if (lenisRef.current) {
        lenisRef.current.start();
        lenisRef.current.scrollTo(window.scrollY, {
          immediate: true,
          force: true,
        });
        if (jumpTimerRef.current !== null) {
          window.clearTimeout(jumpTimerRef.current);
        }
        if (distance > window.innerHeight * 1.4) {
          document.documentElement.dataset.cinemaJumping = 'true';
        }
        const finishJump = (): void => {
          delete document.documentElement.dataset.cinemaJumping;
          window.dispatchEvent(new Event('scroll'));
        };
        jumpTimerRef.current = window.setTimeout(finishJump, 1040);

        lenisRef.current.scrollTo(targetY, {
          duration: 1.0,
          onComplete: () => {
            if (jumpTimerRef.current !== null) {
              window.clearTimeout(jumpTimerRef.current);
              jumpTimerRef.current = null;
            }
            finishJump();
          },
        });
      } else {
        delete document.documentElement.dataset.cinemaJumping;
        window.scrollTo({ top: targetY, behavior: 'auto' });
      }
    },
    [stopAutoPlay]
  );

  const handleScrollProgress = useCallback(
    (globalProgress: number) => {
      const needsJsProgress =
        reducedMotion ||
        typeof CSS === 'undefined' ||
        !CSS.supports('animation-timeline', 'scroll()');
      if (progressBarRef.current && needsJsProgress) {
        progressBarRef.current.style.transformOrigin = '0 50%';
        progressBarRef.current.style.transform = `scaleX(${globalProgress.toFixed(4)})`;
      }

      if (timecodeRef.current) {
        const currentSec = Math.min(
          Math.round(VIDEO_DURATION_SECONDS),
          Math.max(0, Math.round(globalProgress * VIDEO_DURATION_SECONDS))
        );
        const formatted = `00:${String(currentSec).padStart(2, '0')} / 00:${String(
          Math.round(VIDEO_DURATION_SECONDS)
        ).padStart(2, '0')}`;
        if (timecodeRef.current.textContent !== formatted) {
          timecodeRef.current.textContent = formatted;
        }
      }
    },
    [reducedMotion]
  );

  const handleSelectProject = useCallback((item: ProjectItem) => {
    setDossierSelection({ kind: 'project', item });
  }, []);

  const handleSelectCredential = useCallback((item: CredentialItem) => {
    setDossierSelection({ kind: 'credential', item });
  }, []);

  const handleCloseDossier = useCallback(() => {
    setDossierSelection(null);
  }, []);

  const handleReplayFromStart = useCallback(() => {
    stopAutoPlay();
    lenisRef.current?.stop();
    window.scrollTo({ top: 0, behavior: 'auto' });
    lenisRef.current?.scrollTo(0, { immediate: true, force: true });
    window.dispatchEvent(new Event('scroll'));
    startPlaybackFrom(0);
  }, [startPlaybackFrom, stopAutoPlay]);

  return (
    <div className="relative min-h-screen bg-[#06080d] text-slate-100">
      <CinemaStageCanvas
        videoRef={videoRef}
        isAutoPlayingRef={isAutoPlayingRef}
        reducedMotion={reducedMotion}
        onActChange={setActiveAct}
        onScrollProgress={handleScrollProgress}
      />

      <CinemaHUD
        activeAct={activeAct}
        onNavigateSection={handleNavigateSection}
        progressBarRef={progressBarRef}
        timecodeRef={timecodeRef}
        isAutoPlaying={isAutoPlaying}
        onToggleAutoPlay={handleToggleAutoPlay}
      />

      {/* Quick optical dissolve revealing wave greeting cleanly on first load */}
      <div
        className="cinema-intro-curtain pointer-events-none fixed inset-0 z-50 bg-[#06080d]"
        aria-hidden="true"
      />

      {/* Unified Sticky Scroll-Synced Runway */}
      <main id="cinema-runway" className="relative z-10 h-[3000vh]">
        <div
          id="cinema-stage-beats"
          className="cinema-perspective-stage sticky top-0 h-[100dvh] w-full overflow-hidden"
        >
          <GestureStage
            onSelectProject={handleSelectProject}
            onSelectCredential={handleSelectCredential}
            onReplayFromStart={handleReplayFromStart}
            onBackToTop={() => handleNavigateSection('act-studio')}
          />
        </div>
      </main>

      <DossierDialog
        selection={dossierSelection}
        onClose={handleCloseDossier}
      />
    </div>
  );
}
