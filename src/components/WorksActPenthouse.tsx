import React, { useMemo, useRef, useState } from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { PROJECTS, ProjectItem } from '@/data/portfolio';
import { beatDataAttrs } from '@/lib/scrollBeats';
import { runScopedViewTransition } from '@/lib/viewTransitions';
import { SoloBeatStage } from '@/components/SoloBeatStage';
import { cn } from '@/lib/utils';

export interface WorksActPenthouseProps {
  onSelectProject: (item: ProjectItem) => void;
}

const CATEGORIES = [
  'All',
  'Local Systems',
  'Computer Vision',
  'IoT & Mobile',
  'Spatial Web',
] as const;

type ProjectCategory = (typeof CATEGORIES)[number];

interface ProjectSoloBlockProps {
  project: ProjectItem;
  indexLabel: string;
  alignText: 'left' | 'right';
  onInspect: (item: ProjectItem) => void;
  navSlot?: React.ReactNode;
}

const ProjectSoloBlock: React.FC<ProjectSoloBlockProps> = ({
  project,
  indexLabel,
  alignText,
  onInspect,
  navSlot,
}) => {
  const isRight = alignText === 'right';

  return (
    <article className={isRight ? 'md:text-right' : undefined}>
      <div className="cinema-kicker">
        <strong className="font-extrabold text-[#f5c46b]">{indexLabel}</strong> ·{' '}
        {project.category} · {project.year}
      </div>

      <h3 className="cinema-display-title cinema-scene-title mt-2.5">
        {project.title}
      </h3>

      <div
        className={cn('cinema-accent-beam mt-3 w-16', isRight && 'md:ml-auto')}
        aria-hidden="true"
      />

      <p className="mt-3 font-sans text-xs font-extrabold tracking-wide text-[#f5c46b] sm:text-sm [text-shadow:0_2px_12px_rgb(0_0_0/0.95)]">
        {project.highlightMetric}
      </p>

      <p
        className={cn(
          'cinema-subtitle mt-2.5 text-xs sm:text-sm',
          isRight && 'md:ml-auto'
        )}
      >
        {project.summary}
      </p>

      <div
        className={cn(
          'mt-4 flex flex-wrap items-center gap-5',
          isRight && 'md:justify-end'
        )}
      >
        <button
          type="button"
          onClick={() => onInspect(project)}
          className="cinema-link-action font-sans text-sm font-bold text-[#f5c46b] hover:text-white"
        >
          <span>Inspect Architecture</span>
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </button>

        {project.liveUrl ? (
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noreferrer"
            className="cinema-link-action font-sans text-xs font-bold text-slate-100 hover:text-[#f5c46b]"
          >
            <span>Explore Live Build</span>
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        ) : project.githubUrl ? (
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="cinema-link-action font-sans text-xs font-bold text-slate-100 hover:text-[#f5c46b]"
          >
            <span>View Repository</span>
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        ) : null}
      </div>

      {navSlot}
    </article>
  );
};

// Synchronized to Act II (clip 1: frames 240..383, 10.00s..16.00s)
const FEATURED_WORKS: Array<{
  projectId: string;
  indexLabel: string;
  align: 'left' | 'right';
  inStart: number;
  inEnd: number;
  outStart: number;
  outEnd: number;
}> = [
  {
    projectId: 'jarvis',
    indexLabel: '01 / 07',
    align: 'left',
    inStart: 0.172,
    inEnd: 0.205,
    outStart: 0.305,
    outEnd: 0.336,
  },
  {
    projectId: 'forge-city',
    indexLabel: '02 / 07',
    align: 'left',
    inStart: 0.340,
    inEnd: 0.374,
    outStart: 0.474,
    outEnd: 0.506,
  },
  {
    projectId: 'handchord',
    indexLabel: '03 / 07',
    align: 'right',
    inStart: 0.510,
    inEnd: 0.544,
    outStart: 0.644,
    outEnd: 0.676,
  },
  {
    projectId: 'offlinepay',
    indexLabel: '04 / 07',
    align: 'left',
    inStart: 0.680,
    inEnd: 0.714,
    outStart: 0.808,
    outEnd: 0.840,
  },
  {
    projectId: 'ar-linkedin-suite',
    indexLabel: '05 / 07',
    align: 'right',
    inStart: 0.844,
    inEnd: 0.878,
    outStart: 0.962,
    outEnd: 0.992,
  },
];

export const WorksActPenthouse: React.FC<WorksActPenthouseProps> = ({
  onSelectProject,
}) => {
  const [activeCategory, setActiveCategory] = useState<ProjectCategory>('All');
  const [selectedFilteredIdx, setSelectedFilteredIdx] = useState(0);
  const worksScopeRef = useRef<HTMLDivElement | null>(null);

  const filteredProjects = useMemo(() => {
    if (activeCategory === 'All') return PROJECTS;
    return PROJECTS.filter((item) => item.category === activeCategory);
  }, [activeCategory]);

  const activeProject =
    filteredProjects[Math.min(selectedFilteredIdx, filteredProjects.length - 1)] ??
    PROJECTS[0];

  const handleSelectCategory = (category: ProjectCategory): void => {
    runScopedViewTransition(worksScopeRef.current, () => {
      setActiveCategory(category);
      setSelectedFilteredIdx(0);
    });
  };

  const handleStepProject = (delta: number): void => {
    const count = filteredProjects.length;
    if (count <= 1) return;
    runScopedViewTransition(worksScopeRef.current, () => {
      setSelectedFilteredIdx((idx) => (idx + delta + count) % count);
    });
  };

  return (
    <div
      ref={worksScopeRef}
      id="act-works"
      aria-labelledby="heading-works"
      className="scoped-vt-container pointer-events-none absolute inset-0"
    >
      {/* Unboxed Floating Act II Category Bar */}
      <div
        {...beatDataAttrs({
          clip: 1,
          inStart: 0.03,
          inEnd: 0.075,
          outStart: 0.945,
          outEnd: 0.99,
        })}
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center bg-[linear-gradient(0deg,rgba(6,8,13,0.78)_0%,rgba(6,8,13,0)_100%)] px-4 pb-4 pt-8 sm:pb-6"
      >
        <div
          data-beat-stage="true"
          className="pointer-events-auto flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:gap-x-8"
          role="group"
          aria-label="Filter projects by discipline"
        >
          {CATEGORIES.map((category) => {
            const selected = activeCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => handleSelectCategory(category)}
                aria-pressed={selected}
                className={cn(
                  'min-h-8 border-b-2 pb-1 font-sans text-xs tracking-wide transition sm:min-h-9 sm:text-[13px] [text-shadow:0_2px_10px_rgb(0_0_0/0.9)]',
                  selected
                    ? 'border-[#f5c46b] font-extrabold text-[#f5c46b]'
                    : 'border-transparent font-medium text-slate-200/80 hover:text-white'
                )}
              >
                {category === 'All' ? 'All Systems' : category}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Filtered Spotlight Mode */}
      {activeCategory !== 'All' && filteredProjects.length > 0 && (
        <SoloBeatStage
          align="left"
          bottomInset
          ariaLabelledBy="heading-works"
          timing={{
            clip: 1,
            inStart: 0.015,
            inEnd: 0.055,
            outStart: 0.955,
            outEnd: 0.995,
          }}
        >
          <div className="vt-spotlight-card">
            <ProjectSoloBlock
              project={activeProject}
              indexLabel={`0${selectedFilteredIdx + 1} / 0${filteredProjects.length}`}
              alignText="left"
              onInspect={onSelectProject}
              navSlot={
                filteredProjects.length > 1 ? (
                  <div className="mt-4 flex items-center gap-5 text-xs">
                    <button
                      type="button"
                      onClick={() => handleStepProject(-1)}
                      className="cinema-link-action font-sans font-bold text-slate-200 hover:text-white"
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                      <span>Previous</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStepProject(1)}
                      className="cinema-link-action font-sans font-bold text-[#f5c46b] hover:text-white"
                    >
                      <span>Next</span>
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                ) : undefined
              }
            />
          </div>
        </SoloBeatStage>
      )}

      {/* Default Gesture-Choreographed Solo Sequence across 10.00s..16.00s */}
      {activeCategory === 'All' && (
        <>
          <SoloBeatStage
            align="left"
            bottomInset
            ariaLabelledBy="heading-works"
            timing={{
              clip: 1,
              inStart: 0.008,
              inEnd: 0.048,
              outStart: 0.135,
              outEnd: 0.168,
            }}
          >
            <div>
              <p className="cinema-kicker">Selected Work</p>
              <h2
                id="heading-works"
                className="cinema-display-title cinema-scene-title mt-2.5"
              >
                Engineered{' '}
                <strong className="cinema-gold-shimmer font-extrabold">
                  Built Systems
                </strong>
              </h2>
              <div className="cinema-accent-beam mt-3 w-20" aria-hidden="true" />
              <p className="cinema-subtitle mt-3.5 text-sm sm:text-base">
                <strong className="font-bold text-white">Seven live builds</strong> in
                autonomous agents, computer vision, hardware, and local AI.
              </p>
            </div>
          </SoloBeatStage>

          {FEATURED_WORKS.map((beat) => {
            const project =
              PROJECTS.find((item) => item.id === beat.projectId) ?? PROJECTS[0];
            return (
              <SoloBeatStage
                key={project.id}
                align={beat.align}
                bottomInset
                timing={{
                  clip: 1,
                  inStart: beat.inStart,
                  inEnd: beat.inEnd,
                  outStart: beat.outStart,
                  outEnd: beat.outEnd,
                  gesture: beat.align === 'left' ? 'point-left' : 'point-right',
                }}
              >
                <ProjectSoloBlock
                  project={project}
                  indexLabel={beat.indexLabel}
                  alignText={beat.align}
                  onInspect={onSelectProject}
                />
              </SoloBeatStage>
            );
          })}
        </>
      )}
    </div>
  );
};
