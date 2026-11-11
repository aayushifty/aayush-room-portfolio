import React, { useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Github, Maximize2, Terminal } from 'lucide-react';
import { PROJECTS, ProjectItem } from '@/data/portfolio';
import { beatDataAttrs } from '@/lib/scrollBeats';
import { runScopedViewTransition } from '@/lib/viewTransitions';
import { cn } from '@/lib/utils';
import { SoloBeatStage } from '@/components/SoloBeatStage';

export interface WorksActPenthouseProps {
  onSelectProject: (project: ProjectItem) => void;
}

const CATEGORIES = [
  'All Systems',
  'Local Systems',
  'Computer Vision',
  'IoT & Mobile',
  'Spatial Web',
] as const;

type FilterCategory = (typeof CATEGORIES)[number];

export const WorksActPenthouse: React.FC<WorksActPenthouseProps> = ({
  onSelectProject,
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('All Systems');
  const [selectedFilteredIdx, setSelectedFilteredIdx] = useState(0);
  const worksScopeRef = useRef<HTMLDivElement | null>(null);

  const filteredProjects = useMemo(() => {
    if (activeFilter === 'All Systems') return PROJECTS;
    return PROJECTS.filter((p) => p.category === activeFilter);
  }, [activeFilter]);

  const activeFilteredProject =
    filteredProjects[Math.min(selectedFilteredIdx, Math.max(0, filteredProjects.length - 1))] ??
    filteredProjects[0];

  const handleSelectCategory = (category: FilterCategory): void => {
    if (category === activeFilter) return;
    runScopedViewTransition(worksScopeRef.current, () => {
      setActiveFilter(category);
      setSelectedFilteredIdx(0);
    });
  };

  const handleSelectTab = (idx: number): void => {
    if (idx === selectedFilteredIdx) return;
    runScopedViewTransition(worksScopeRef.current, () => {
      setSelectedFilteredIdx(idx);
    });
  };

  return (
    <div
      ref={worksScopeRef}
      id="act-works"
      aria-labelledby="heading-works"
      className="scoped-vt-container pointer-events-none absolute inset-0"
    >
      {/* Unboxed Floating Act II Filter Bar */}
      <div
        {...beatDataAttrs({
          clip: 1,
          inStart: 0.05,
          inEnd: 0.085,
          outStart: 0.92,
          outEnd: 0.952,
        })}
        className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center bg-[linear-gradient(0deg,rgba(6,8,13,0.72)_0%,rgba(6,8,13,0)_100%)] px-4 pb-4 pt-8 sm:pb-6"
      >
        <div
          data-beat-stage="true"
          className="pointer-events-auto flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:gap-x-7"
          role="group"
          aria-label="Filter projects by discipline"
        >
          {CATEGORIES.map((category) => {
            const selected = activeFilter === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => handleSelectCategory(category)}
                aria-pressed={selected}
                className={cn(
                  'min-h-8 font-sans text-xs tracking-wide transition sm:min-h-9',
                  selected
                    ? 'font-semibold text-[#f5c46b]'
                    : 'text-slate-300/75 hover:text-white'
                )}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      {activeFilter !== 'All Systems' && activeFilteredProject ? (
        /* Filtered Solo Spotlight: STRICTLY ONE unboxed block visible at a time */
        <SoloBeatStage
          align="left"
          bottomInset
          className="filtered-projects-beat"
          timing={{
            clip: 1,
            inStart: 0.05,
            inEnd: 0.085,
            outStart: 0.92,
            outEnd: 0.952,
          }}
        >
          <div className="vt-spotlight-card">
            {filteredProjects.length > 1 && (
              <div
                className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2"
                role="tablist"
                aria-label={`${activeFilter} projects`}
              >
                {filteredProjects.map((proj, idx) => {
                  const isCurrent = proj.id === activeFilteredProject.id;
                  return (
                    <button
                      key={proj.id}
                      type="button"
                      role="tab"
                      aria-selected={isCurrent}
                      onClick={() => handleSelectTab(idx)}
                      className={cn(
                        'min-h-8 font-mono-tech text-[11px] tracking-[0.12em] transition',
                        isCurrent
                          ? 'font-semibold text-[#f5c46b]'
                          : 'text-slate-400 hover:text-white'
                      )}
                    >
                      {String(idx + 1).padStart(2, '0')} · {proj.title}
                    </button>
                  );
                })}
              </div>
            )}
            <ProjectSoloBlock
              project={activeFilteredProject}
              displayIndex={selectedFilteredIdx + 1}
              totalCount={filteredProjects.length}
              onSelectProject={onSelectProject}
            />
          </div>
        </SoloBeatStage>
      ) : (
        <>
          {/* Beat 2.1: Chapter II Opening */}
          <SoloBeatStage
            align="left"
            bottomInset
            timing={{
              clip: 1,
              inStart: 0.05,
              inEnd: 0.08,
              outStart: 0.115,
              outEnd: 0.14,
            }}
          >
            <div>
              <p className="cinema-kicker flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5 text-[#f5c46b]" aria-hidden="true" />
                <span>Selected Works</span>
              </p>
              <h2
                id="heading-works"
                className="cinema-display-title cinema-scene-title mt-2"
              >
                Engineered{' '}
                <span className="cinema-gold-shimmer block text-[#f5c46b]">Built Systems</span>
              </h2>
              <div className="cinema-accent-beam mt-3 w-20" aria-hidden="true" />
              <p className="cinema-subtitle mt-3 text-xs sm:mt-3.5 sm:text-base">
                Seven engineered builds spanning autonomous agents, computer vision instruments,
                and resilient offline builds.
              </p>
            </div>
          </SoloBeatStage>

          {/* Beats 2.2 – 2.8: Every Project Solo Alternating Right / Left */}
          {PROJECTS.map((project, idx) => {
            const start = 0.146 + idx * 0.112;
            const timing = {
              clip: 1 as const,
              inStart: Number(start.toFixed(3)),
              inEnd: Number((start + 0.03).toFixed(3)),
              outStart: Number((start + 0.078).toFixed(3)),
              outEnd: Number((start + 0.104).toFixed(3)),
            };
            const align = idx % 2 === 0 ? 'right' : 'left';

            return (
              <SoloBeatStage key={project.id} align={align} bottomInset timing={timing}>
                <ProjectSoloBlock
                  project={project}
                  displayIndex={idx + 1}
                  totalCount={PROJECTS.length}
                  onSelectProject={onSelectProject}
                />
              </SoloBeatStage>
            );
          })}
        </>
      )}
    </div>
  );
};

interface ProjectSoloBlockProps {
  project: ProjectItem;
  displayIndex: number;
  totalCount: number;
  onSelectProject: (project: ProjectItem) => void;
}

function ProjectSoloBlock({
  project,
  displayIndex,
  totalCount,
  onSelectProject,
}: ProjectSoloBlockProps): React.ReactElement {
  return (
    <article>
      <div className="flex items-center justify-between gap-2">
        <span className="cinema-kicker">
          {project.category} · {project.year}
        </span>
        <span className="font-mono-tech text-[11px] tracking-[0.18em] text-white/60">
          {String(displayIndex).padStart(2, '0')} / {String(totalCount).padStart(2, '0')}
        </span>
      </div>

      <div>
        <h3 className="cinema-display-title cinema-scene-title mt-2">
          {project.title}
        </h3>
        <div className="cinema-accent-beam mt-3 w-16" aria-hidden="true" />
        <p className="mt-2.5 font-sans text-xs font-medium tracking-wide text-[#f5c46b] sm:text-sm">
          {project.subtitle}
        </p>
      </div>

      <div>
        <p className="mt-2.5 font-mono-tech text-[11px] tracking-wider text-teal-200/90 sm:text-xs">
          {project.highlightMetric}
        </p>

        <p className="cinema-subtitle mt-2.5 text-xs sm:text-sm">
          {project.summary}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-6">
        <button
          type="button"
          onClick={() => onSelectProject(project)}
          className="cinema-link-action font-sans text-xs font-semibold uppercase tracking-[0.14em] text-[#f5c46b] hover:text-white"
        >
          <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Inspect Dossier</span>
        </button>

        {project.liveUrl && (
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="cinema-link-action font-sans text-xs font-medium uppercase tracking-[0.14em] text-teal-200 hover:text-white"
          >
            <span>Live Demo</span>
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        )}

        {project.githubUrl && (
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="cinema-link-action font-sans text-xs font-medium uppercase tracking-[0.14em] text-slate-300 hover:text-white"
          >
            <Github className="h-3.5 w-3.5" aria-hidden="true" />
            <span>GitHub</span>
          </a>
        )}
      </div>
    </article>
  );
}
