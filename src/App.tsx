import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Lenis from 'lenis';
import { CINEMA_CLIPS, CredentialItem, ProjectItem } from '@/data/portfolio';
import { FrameSequenceStore } from '@/lib/frameScrubEngine';
import { SECTION_PROGRESS_MAP } from '@/lib/scrollBeats';
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

  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const jumpTimerRef = useRef<number | null>(null);

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
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.92,
      touchMultiplier: 1.1,
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
    if (dossierSelection) {
      lenisRef.current?.stop();
    } else {
      lenisRef.current?.start();
    }
  }, [dossierSelection]);

  useEffect(() => {
    const clip = CINEMA_CLIPS[activeAct];
    document.documentElement.style.setProperty('--act-accent', clip.accentHex);
    document.documentElement.style.setProperty('--act-accent-soft', clip.accentSoft);
  }, [activeAct]);

  const handleNavigateSection = useCallback((sectionId: string) => {
    const targetProgress = SECTION_PROGRESS_MAP[sectionId];
    if (typeof targetProgress !== 'number') return;

    const maxScroll = Math.max(
      1,
      document.documentElement.scrollHeight - window.innerHeight
    );
    const targetY = Math.round(targetProgress * maxScroll);
    const distance = Math.abs(targetY - window.scrollY);

    if (lenisRef.current) {
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
        duration: 1.2,
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
  }, []);

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

  return (
    <div className="relative min-h-screen bg-[#06080d] text-slate-100">
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
      />

      {/* Opening blank-void dissolve revealing solo portrait before typography */}
      <div
        className="cinema-intro-curtain pointer-events-none fixed inset-0 z-50 bg-[#06080d]"
        aria-hidden="true"
      />

      {/* Unified Sticky Scroll-Cinema Runway */}
      <main id="cinema-runway" className="relative z-10 h-[1950vh]">
        <div
          id="cinema-stage-beats"
          className="cinema-perspective-stage sticky top-0 h-[100dvh] w-full overflow-hidden"
        >
          <HeroActStudio onNavigateSection={handleNavigateSection} />
          <WorksActPenthouse onSelectProject={handleSelectProject} />
          <CredentialsActLab onSelectCredential={handleSelectCredential} />
        </div>
      </main>

      <DossierDialog
        selection={dossierSelection}
        onClose={handleCloseDossier}
      />
    </div>
  );
}
