import React, { useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { PROJECTS, ProjectItem } from '@/data/portfolio';
import { BeatTimingSpec } from '@/lib/scrollBeats';
import { runScopedViewTransition } from '@/lib/viewTransitions';
import { SoloBeatStage } from '@/components/SoloBeatStage';
import { cn } from '@/lib/utils';

export interface WorksActPenthouseProps {
  onSelectProject: (item: ProjectItem) => void;
}

type ProjectFilterCategory =
  | 'All'
  | 'Local Systems'
  | 'Computer Vision'
  | 'IoT & Mobile'
  | 'Spatial Web';

const FILTER_OPTIONS: readonly ProjectFilterCategory[] = [
  'All',
  'Local Systems',
  'Computer Vision',
  'IoT & Mobile',
  'Spatial Web',
];

// Exact frame timings for Act II (clip 1: frames 240..525, 10.00s..21.92s)
const BEAT_POINT_RIGHT_1: BeatTimingSpec = {
  clip: 1,
  inStart: 0.095,
  inEnd: 0.132,
  outStart: 0.252,
  outEnd: 0.282,
  gesture: 'point-right',
};

const BEAT_POINT_LEFT_1: BeatTimingSpec = {
  clip: 1,
  inStart: 0.283,
  inEnd: 0.312,
  outStart: 0.402,
  outEnd: 0.432,
  gesture: 'point-left',
};

const BEAT_BOTH_UP: BeatTimingSpec = {
  clip: 1,
  inStart: 0.434,
  inEnd: 0.465,
  outStart: 0.576,
  outEnd: 0.606,
  gesture: 'both-up',
};

const BEAT_SWEEP_CALM: BeatTimingSpec = {
  clip: 1,
  inStart: 0.608,
  inEnd: 0.642,
  outStart: 0.804,
  outEnd: 0.838,
  gesture: 'calm-floor',
};

const BEAT_POINT_UPRIGHT_1: BeatTimingSpec = {
  clip: 1,
  inStart: 0.842,
  inEnd: 0.872,
  outStart: 0.966,
  outEnd: 0.996,
  gesture: 'point-upright',
};

function findProject(id: string): ProjectItem {
  return PROJECTS.find((p) => p.id === id) ?? PROJECTS[0];
}

interface GestureCueRuleProps {
  side: 'left-origin' | 'right-origin' | 'up-origin';
}

/**
 * Minimal architectural hairline trace aligning typography edge to the active pointing finger.
 */
const GestureCueRule: React.FC<GestureCueRuleProps> = ({ side }) => (
  <div
    aria-hidden="true"
    className={cn(
      'cinema-pointer-cue hidden items-center gap-2 md:inline-flex',
      side === 'right-origin' ? 'flex-row-reverse md:ml-auto' : 'flex-row'
    )}
  >
    <span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b] shadow-[0_0_10px_#f59e0b]" />
    <span
      className={cn(
        'h-px w-10',
        side === 'right-origin'
          ? 'bg-gradient-to-l from-[#f59e0b]/90 to-transparent'
          : 'bg-gradient-to-r from-[#f59e0b]/90 to-transparent'
      )}
    />
    <span className="font-mono-tech text-[9px] uppercase tracking-[0.22em] text-amber-200/80">
      {side === 'up-origin' ? 'Field cue' : 'Gesture cue'}
    </span>
  </div>
);

interface ProjectSoloBlockProps {
  indexLabel: string;
  project: ProjectItem;
  alignText: 'left' | 'right';
  cueSide: 'left-origin' | 'right-origin' | 'up-origin';
  onSelect: (item: ProjectItem) => void;
  compact?: boolean;
}

const ProjectSoloBlock: React.FC<ProjectSoloBlockProps> = ({
  indexLabel,
  project,
  alignText,
  cueSide,
  onSelect,
  compact = false,
}) => {
  const isRight = alignText === 'right';
  return (
    <article
      className={cn(
        'space-y-2.5',
        isRight ? 'text-left md:text-right' : 'text-left'
      )}
    >
      <div className="space-y-1">
        <GestureCueRule side={cueSide} />
        <p className="cinema-kicker font-mono-tech text-[10px] uppercase tracking-[0.26em] text-amber-300/90">
          {indexLabel} · {project.category} · {project.year}
        </p>
        <h2
          className={cn(
            'cinema-display-title text-white',
            compact
              ? 'cinema-card-title text-xl sm:text-2xl md:text-3xl'
              : 'cinema-scene-title'
          )}
        >
          {project.title}
        </h2>
      </div>

      <div
        className={cn(
          'cinema-accent-beam h-[2px] w-14 bg-gradient-to-r from-[#f59e0b] to-transparent',
          isRight && 'md:ml-auto md:bg-gradient-to-l'
        )}
      />

      <p
        className={cn(
          'font-mono-tech text-[11px] tracking-wide text-amber-100/90',
          compact && 'hidden sm:block'
        )}
      >
        {project.highlightMetric}
      </p>

      <p
        className={cn(
          'cinema-subtitle text-xs leading-relaxed text-slate-200 sm:text-sm',
          compact && 'line-clamp-2 md:line-clamp-none'
        )}
      >
        {project.summary}
      </p>

      <div className={cn(compact ? 'pt-0.5' : 'pt-1', isRight && 'md:flex md:justify-end')}>
        <button
          type="button"
          onClick={() => onSelect(project)}
          className={cn(
            'cinema-link-action inline-flex items-center gap-1.5 font-mono-tech text-[11px] font-semibold uppercase tracking-[0.2em] text-[#f59e0b] hover:text-white',
            compact ? 'min-h-8 md:min-h-9' : 'min-h-9'
          )}
        >
          <span>Inspect Dossier</span>
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </article>
  );
};

export const WorksActPenthouse: React.FC<WorksActPenthouseProps> = ({
  onSelectProject,
}) => {
  const [filterCategory, setFilterCategory] =
    useState<ProjectFilterCategory>('All');
  const spotlightListRef = useRef<HTMLDivElement | null>(null);

  const jarvis = findProject('jarvis');
  const forgeCity = findProject('forge-city');
  const ullensLab = findProject('ullens-room');
  const handChord = findProject('handchord');
  const arSuite = findProject('ar-linkedin-suite');
  const offlinePay = findProject('offlinepay');
  const trinitySuite = findProject('trinity-teaching');

  const filteredQuickList = useMemo(
    () =>
      filterCategory === 'All'
        ? PROJECTS
        : PROJECTS.filter((p) => p.category === filterCategory),
    [filterCategory]
  );

  const handleFilterChange = (category: ProjectFilterCategory): void => {
    runScopedViewTransition(spotlightListRef.current, () => {
      setFilterCategory(category);
    });
  };

  return (
    <div aria-label="Act II — Hand-Choreographed Systems Showcase">
      {/* Beat 3 (11.15s - 13.35s): Right Index Finger Points Screen-Right */}
      <SoloBeatStage
        id="beat-point-right-1"
        timing={BEAT_POINT_RIGHT_1}
        align="right"
      >
        <div className="cinema-flank-scrim-right">
          <ProjectSoloBlock
            indexLabel="01 / AUTONOMOUS CORE"
            project={jarvis}
            alignText="right"
            cueSide="left-origin"
            onSelect={onSelectProject}
          />
        </div>
      </SoloBeatStage>

      {/* Beat 4 (13.40s - 15.15s): Left Index Finger Points Screen-Left */}
      <SoloBeatStage
        id="beat-point-left-1"
        timing={BEAT_POINT_LEFT_1}
        align="left"
      >
        <div className="cinema-flank-scrim-left space-y-4">
          <ProjectSoloBlock
            indexLabel="02 / SWARM SYSTEMS"
            project={forgeCity}
            alignText="left"
            cueSide="right-origin"
            onSelect={onSelectProject}
          />

          <div className="border-t border-white/10 pt-2.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-slate-400">
                  Companion · Spatial Web
                </p>
                <p className="text-xs font-semibold text-white">
                  {ullensLab.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectProject(ullensLab)}
                className="inline-flex min-h-8 items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 font-mono-tech text-[10px] uppercase tracking-[0.16em] text-amber-200 transition hover:border-amber-300/60 hover:bg-amber-300/15"
              >
                Open <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </SoloBeatStage>

      {/* Beat 5 (15.20s - 17.20s): Both Index Fingers Raised Symmetrically (Split Dual Wings) */}
      <SoloBeatStage id="beat-both-up" timing={BEAT_BOTH_UP} align="split">
        <div className="cinema-flank-scrim-left pointer-events-auto w-full rounded-xl bg-black/55 p-2.5 backdrop-blur-sm md:w-[275px] md:bg-transparent md:p-0 md:backdrop-blur-none lg:w-[305px]">
          <ProjectSoloBlock
            indexLabel="03 / LEFT HAND GESTURE"
            project={handChord}
            alignText="left"
            cueSide="right-origin"
            onSelect={onSelectProject}
            compact
          />
        </div>

        <div className="cinema-flank-scrim-right pointer-events-auto w-full rounded-xl bg-black/55 p-2.5 backdrop-blur-sm md:w-[275px] md:bg-transparent md:p-0 md:backdrop-blur-none lg:w-[305px]">
          <ProjectSoloBlock
            indexLabel="04 / RIGHT HAND VISION"
            project={arSuite}
            alignText="right"
            cueSide="left-origin"
            onSelect={onSelectProject}
            compact
          />
        </div>
      </SoloBeatStage>

      {/* Beat 6 (17.30s - 19.95s): Calm Smile — Uncluttered Office Architecture & Filter Explorer */}
      <SoloBeatStage
        id="beat-sweep-calm"
        timing={BEAT_SWEEP_CALM}
        align="lower-left"
        ariaLabelledBy="calm-index-heading"
      >
        <div className="cinema-flank-scrim-left space-y-3 text-left">
          <div className="flex items-center gap-2 font-mono-tech text-[10px] uppercase tracking-[0.24em] text-amber-300">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            <span>System Index · Quiet Architecture</span>
          </div>
          <h2
            id="calm-index-heading"
            className="cinema-display-title text-2xl text-white sm:text-3xl"
          >
            Seven Live Builds
          </h2>

          <div
            role="tablist"
            aria-label="Filter projects by discipline"
            className="flex flex-wrap gap-1.5"
          >
            {FILTER_OPTIONS.map((cat) => {
              const isSelected = filterCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => handleFilterChange(cat)}
                  className={cn(
                    'min-h-7 rounded-full border px-2.5 py-0.5 font-mono-tech text-[10px] uppercase tracking-[0.14em] transition',
                    isSelected
                      ? 'border-amber-300/70 bg-amber-400/20 text-amber-100'
                      : 'border-white/15 bg-black/35 text-slate-300 hover:border-white/35 hover:text-white'
                  )}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div
            ref={spotlightListRef}
            className="scoped-vt-container vt-spotlight-card flex flex-wrap gap-1.5 pt-0.5"
          >
            {filteredQuickList.map((proj) => (
              <button
                key={proj.id}
                type="button"
                onClick={() => onSelectProject(proj)}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-white/15 bg-black/50 px-2.5 py-1 text-left text-xs font-medium text-slate-100 backdrop-blur-sm transition hover:border-amber-300/60 hover:text-white"
              >
                <span>{proj.title}</span>
                <ArrowUpRight className="h-3 w-3 text-amber-300" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      </SoloBeatStage>

      {/* Beat 7 (20.15s - 21.88s): Right Hand Points Up-Right -> Field & Offline Builds */}
      <SoloBeatStage
        id="beat-point-upright-1"
        timing={BEAT_POINT_UPRIGHT_1}
        align="right"
      >
        <div className="cinema-flank-scrim-right space-y-4">
          <ProjectSoloBlock
            indexLabel="05 / OFFLINE & FIELD"
            project={offlinePay}
            alignText="right"
            cueSide="up-origin"
            onSelect={onSelectProject}
          />

          <div className="border-t border-white/10 pt-2.5 text-left md:text-right">
            <p className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-slate-400">
              Classroom Companion
            </p>
            <div className="mt-1 flex items-center justify-between gap-2 md:flex-row-reverse">
              <p className="text-xs font-semibold text-white">
                {trinitySuite.title}
              </p>
              <button
                type="button"
                onClick={() => onSelectProject(trinitySuite)}
                className="inline-flex min-h-8 items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 font-mono-tech text-[10px] uppercase tracking-[0.16em] text-amber-200 transition hover:border-amber-300/60 hover:bg-amber-300/15"
              >
                Open <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </SoloBeatStage>
    </div>
  );
};
