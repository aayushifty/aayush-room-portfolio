import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Lenis from 'lenis';
import { CINEMA_CLIPS, CredentialItem, ProjectItem } from '@/data/portfolio';
import { FrameSequenceStore } from '@/lib/frameScrubEngine';
import { SECTION_PROGRESS_MAP, VIDEO_DURATION_SECONDS } from '@/lib/scrollBeats';
import { CinemaStageCanvas } from '@/components/CinemaStageCanvas';
import { CinemaHUD } from '@/components/CinemaHUD';
import { HeroActStudio } from '@/components/HeroActStudio';
import { WorksActPenthouse } from '@/components/WorksActPenthouse';
import { CredentialsActLab } from '@/components/CredentialsActLab';
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const jumpTimerRef = useRef<number | null>(null);
  const autoPlayRafRef = useRef<number | null>(null);

  const store = useMemo(() => new FrameSequenceStore(), []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent): void => {
      setReducedMotion(e.matches);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    store.startPreloadAll();
    return () => store.dispose();
  }, [store]);

  useEffect(() => {
    if (reducedMotion) {
      lenisRef.current?.destroy();
      lenisRef.current = null;
      return;
    }

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.05,
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
    } else {
      lenisRef.current?.start();
    }
  }, [dossierSelection, isAutoPlaying]);

  useEffect(() => {
    const clip = CINEMA_CLIPS[activeAct];
    document.documentElement.style.setProperty('--act-accent', clip.accentHex);
    document.documentElement.style.setProperty('--act-accent-soft', clip.accentSoft);
  }, [activeAct]);

  const stopAutoPlay = useCallback(() => {
    if (autoPlayRafRef.current !== null) {
      window.cancelAnimationFrame(autoPlayRafRef.current);
      autoPlayRafRef.current = null;
    }
    const audio = audioRef.current;
    if (audio && !audio.paused) {
      audio.pause();
    }
    setIsAutoPlaying(false);
  }, []);

  const startPlaybackFrom = useCallback((startSec: number) => {
    const audio = audioRef.current;
    if (audio) {
      const beginAudio = (): void => {
        try {
          if (Math.abs(audio.currentTime - startSec) > 0.05) {
            audio.currentTime = startSec;
          }
          const playPromise = audio.play();
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => {
              // Browser blocked audio output — timer clock fallback keeps visual playback active
            });
          }
        } catch {
          // Ignore seek error before metadata loads; rAF clock advances smoothly
        }
      };

      if (audio.readyState >= 1) {
        beginAudio();
      } else {
        audio.addEventListener('loadedmetadata', beginAudio, { once: true });
        audio.load();
      }
    }
    setIsAutoPlaying(true);
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
    const startOffsetSec = curProgress * VIDEO_DURATION_SECONDS;
    const startPerfMs = performance.now();
    let lastAudioTime = audioRef.current ? audioRef.current.currentTime : 0;
    let lastAudioTickMs = performance.now();

    const stepPlayback = (now: number): void => {
      const currentMax = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const audio = audioRef.current;
      const duration =
        audio && Number.isFinite(audio.duration) && audio.duration > 1
          ? audio.duration
          : VIDEO_DURATION_SECONDS;

      const wallSec = startOffsetSec + (now - startPerfMs) / 1000;
      let elapsedSec = wallSec;

      if (audio && !audio.paused && !audio.ended) {
        if (Math.abs(audio.currentTime - lastAudioTime) > 0.015) {
          lastAudioTime = audio.currentTime;
          lastAudioTickMs = now;
        }
        // Only lock scroll to audio clock while audio decoder is actually advancing in real time
        if (audio.currentTime > 0.05 && now - lastAudioTickMs < 350) {
          elapsedSec = audio.currentTime;
        }
      }

      const progress = Math.min(1, Math.max(0, elapsedSec / duration));
      window.scrollTo({ top: progress * currentMax, behavior: 'auto' });

      if (progress >= 1 || audio?.ended) {
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
        jumpTimerRef.current = window.setTimeout(finishJump, 1180);

        lenisRef.current.scrollTo(targetY, {
          duration: 1.15,
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
    window.scrollTo({ top: 0, behavior: 'auto' });
    startPlaybackFrom(0);
  }, [startPlaybackFrom, stopAutoPlay]);

  return (
    <div className="relative min-h-screen bg-[#06080d] text-slate-100">
      <audio
        ref={audioRef}
        src="/audio/intro-reel.m4a"
        preload="none"
        playsInline
        className="hidden"
      />

      <CinemaStageCanvas
        store={store}
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
      <main id="cinema-runway" className="relative z-10 h-[1950vh]">
        <div
          id="cinema-stage-beats"
          className="cinema-perspective-stage sticky top-0 h-[100dvh] w-full overflow-hidden"
        >
          <HeroActStudio
            onNavigateSection={handleNavigateSection}
            isAutoPlaying={isAutoPlaying}
            onToggleAutoPlay={handleToggleAutoPlay}
          />
          <WorksActPenthouse onSelectProject={handleSelectProject} />
          <CredentialsActLab
            onSelectCredential={handleSelectCredential}
            onReplayFromStart={handleReplayFromStart}
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
