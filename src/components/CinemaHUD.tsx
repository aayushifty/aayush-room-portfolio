import React from 'react';
import { Pause, Volume2 } from 'lucide-react';
import { CINEMA_CLIPS } from '@/data/portfolio';
import { NAV_SCROLL_TARGETS } from '@/lib/scrollBeats';
import { cn } from '@/lib/utils';

export interface CinemaHUDProps {
  activeAct: 0 | 1 | 2;
  onNavigateSection: (sectionId: string) => void;
  progressBarRef: React.RefObject<HTMLDivElement | null>;
  timecodeRef: React.RefObject<HTMLSpanElement | null>;
  isAutoPlaying: boolean;
  onToggleAutoPlay: () => void;
}

const PRIMARY_NAV_ITEMS = NAV_SCROLL_TARGETS.filter(
  (item) => item.id !== 'section-contact'
);

export const CinemaHUD: React.FC<CinemaHUDProps> = ({
  activeAct,
  onNavigateSection,
  progressBarRef,
  timecodeRef,
  isAutoPlaying,
  onToggleAutoPlay,
}) => {
  const activeClip = CINEMA_CLIPS[activeAct];

  return (
    <header className="cinema-hud-arrive pointer-events-none fixed inset-x-0 top-0 z-40 bg-gradient-to-b from-[#06080d]/75 via-[#06080d]/28 to-transparent pb-6">
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

      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 pt-3.5 sm:px-10 sm:pt-4">
        <button
          type="button"
          onClick={() => onNavigateSection('act-studio')}
          className="pointer-events-auto font-display text-sm font-bold tracking-wide text-white/95 transition hover:text-[#e8c589] sm:text-lg"
        >
          Aayush Bhatta
        </button>

        <nav
          aria-label="Primary"
          className="pointer-events-auto flex items-center gap-3 sm:gap-5 md:gap-6"
        >
          {PRIMARY_NAV_ITEMS.map((item) => {
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
                    : 'text-slate-300/80 hover:text-white'
                )}
              >
                {item.label}
              </button>
            );
          })}

          <span
            ref={timecodeRef}
            aria-label="Timeline position"
            className="hidden rounded-full border border-white/10 bg-black/35 px-2.5 py-1 font-mono-tech text-[10px] tracking-[0.14em] text-slate-300/90 tabular-nums sm:inline-flex"
          >
            00:00 / 00:30
          </span>

          <button
            type="button"
            onClick={onToggleAutoPlay}
            aria-pressed={isAutoPlaying}
            className={cn(
              'inline-flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono-tech text-[10px] uppercase tracking-[0.16em] transition sm:px-3',
              isAutoPlaying
                ? 'border-amber-300/70 bg-amber-300/20 text-[#fef3c7] shadow-[0_0_16px_rgba(245,196,107,0.2)]'
                : 'border-white/15 bg-black/45 text-slate-200 hover:border-amber-300/50 hover:text-white'
            )}
          >
            {isAutoPlaying ? (
              <>
                <Pause className="h-3 w-3" aria-hidden="true" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Volume2 className="h-3 w-3 text-[#f5c46b]" aria-hidden="true" />
                <span>Play Reel</span>
              </>
            )}
          </button>

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
