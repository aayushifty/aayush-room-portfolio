import React from 'react';
import { CINEMA_CLIPS } from '@/data/portfolio';
import { cn } from '@/lib/utils';

export interface CinemaHUDProps {
  activeAct: 0 | 1 | 2;
  onNavigateSection: (sectionId: string) => void;
  progressBarRef: React.RefObject<HTMLDivElement | null>;
}

const NAV_ITEMS = [
  { id: 'act-studio', label: 'Studio', act: 0 },
  { id: 'act-works', label: 'Systems', act: 1 },
  { id: 'act-credentials', label: 'Credentials', act: 2 },
] as const;

export const CinemaHUD: React.FC<CinemaHUDProps> = ({
  activeAct,
  onNavigateSection,
  progressBarRef,
}) => {
  const activeClip = CINEMA_CLIPS[activeAct];

  return (
    <header className="cinema-hud-arrive pointer-events-none fixed inset-x-0 top-0 z-40 pb-6">
      <a href="#main-content" className="skip-link visually-hidden pointer-events-auto">
        Skip to main content
      </a>

      {/* Subtle hairline top scroll indicator */}
      <div className="h-[1.5px] w-full bg-white/[0.06]" aria-hidden="true">
        <div
          id="scroll-progress-bar"
          ref={progressBarRef}
          className="h-full w-full transition-colors duration-500"
          style={{
            backgroundColor: activeClip.accentHex,
          }}
        />
      </div>

      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-5 pt-4 sm:px-10">
        <button
          type="button"
          onClick={() => onNavigateSection('act-studio')}
          className="pointer-events-auto font-display text-base font-bold tracking-wide text-white/95 transition hover:text-[#e8c589] sm:text-lg"
        >
          Aayush Bhatta
        </button>

        <nav aria-label="Primary" className="pointer-events-auto flex items-center gap-5 sm:gap-7">
          {NAV_ITEMS.map((item) => {
            const isHighlighted = activeAct === item.act;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigateSection(item.id)}
                className={cn(
                  'hidden min-h-9 font-sans text-xs font-medium tracking-wide transition md:inline-flex md:items-center',
                  isHighlighted
                    ? 'text-[#e8c589]'
                    : 'text-slate-300/75 hover:text-white'
                )}
              >
                {item.label}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => onNavigateSection('section-contact')}
            className="cinema-link-action min-h-9 font-sans text-xs font-semibold tracking-wide text-[#e8c589] hover:text-white"
          >
            Contact
          </button>
        </nav>
      </div>
    </header>
  );
};
