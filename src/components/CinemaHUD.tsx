import React from 'react';
import { CINEMA_CLIPS } from '@/data/portfolio';
import { NAV_SCROLL_TARGETS } from '@/lib/scrollBeats';
import { cn } from '@/lib/utils';

export interface CinemaHUDProps {
  activeAct: 0 | 1 | 2;
  onNavigateSection: (sectionId: string) => void;
  progressBarRef: React.RefObject<HTMLDivElement | null>;
  timecodeRef: React.RefObject<HTMLSpanElement | null>;
}

const PRIMARY_NAV_ITEMS = NAV_SCROLL_TARGETS.filter(
  (item) => item.id !== 'section-contact'
);

export const CinemaHUD: React.FC<CinemaHUDProps> = ({
  activeAct,
  onNavigateSection,
  progressBarRef,
  timecodeRef,
}) => {
  const activeClip = CINEMA_CLIPS[activeAct];

  return (
    <header className="cinema-hud-arrive pointer-events-none fixed inset-x-0 top-0 z-40 pb-6">
      <a
        href="#cinema-runway"
        className="skip-link visually-hidden pointer-events-auto"
      >
        Skip to portfolio timeline
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
          className="pointer-events-auto font-display text-base font-extrabold tracking-wide text-white transition hover:text-[#f5c46b] sm:text-xl [text-shadow:0_2px_12px_rgb(0_0_0/0.85)]"
        >
          Aayush Bhatta
        </button>

        <nav
          aria-label="Primary"
          className="pointer-events-auto flex items-center gap-5 sm:gap-7"
        >
          {PRIMARY_NAV_ITEMS.map((item) => {
            const isHighlighted = activeAct === item.act;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigateSection(item.id)}
                className={cn(
                  'hidden min-h-9 font-sans text-xs tracking-wide transition md:inline-flex md:items-center [text-shadow:0_2px_10px_rgb(0_0_0/0.85)]',
                  isHighlighted
                    ? 'font-bold text-[#f5c46b]'
                    : 'font-medium text-slate-200/85 hover:text-white'
                )}
              >
                {item.label}
              </button>
            );
          })}

          <span
            ref={timecodeRef}
            aria-label="Timeline position"
            className="hidden font-mono-tech text-[11px] font-medium tracking-[0.14em] text-slate-300/90 tabular-nums sm:inline-flex [text-shadow:0_2px_10px_rgb(0_0_0/0.85)]"
          >
            00:00 / 00:30
          </span>

          <button
            type="button"
            onClick={() => onNavigateSection('section-contact')}
            className="cinema-link-action min-h-9 font-sans text-xs font-bold tracking-wide text-[#f5c46b] hover:text-white"
          >
            Contact
          </button>
        </nav>
      </div>
    </header>
  );
};
