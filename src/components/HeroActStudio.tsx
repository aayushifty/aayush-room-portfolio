import React from 'react';
import { ArrowDown, ArrowRight, Pause, Volume2 } from 'lucide-react';
import {
  AI_PRACTICE_PILLARS,
  DISCIPLINES,
  PROFILE,
} from '@/data/portfolio';
import { BeatTimingSpec } from '@/lib/scrollBeats';
import { SoloBeatStage } from '@/components/SoloBeatStage';

export interface HeroActStudioProps {
  onNavigateSection: (sectionId: string) => void;
  isAutoPlaying?: boolean;
  onToggleAutoPlay?: () => void;
}

const BEAT_INTRO_GREET: BeatTimingSpec = {
  clip: 0,
  inStart: 0,
  inEnd: 0,
  outStart: 0.21,
  outEnd: 0.25,
  gesture: 'intro-wave',
  holdStart: true,
};

const BEAT_IDENTITY: BeatTimingSpec = {
  clip: 0,
  inStart: 0.255,
  inEnd: 0.31,
  outStart: 0.56,
  outEnd: 0.615,
  gesture: 'turn-left',
};

const BEAT_DISCIPLINES: BeatTimingSpec = {
  clip: 0,
  inStart: 0.62,
  inEnd: 0.675,
  outStart: 0.915,
  outEnd: 0.965,
  gesture: 'turn-right',
};

export const HeroActStudio: React.FC<HeroActStudioProps> = ({
  onNavigateSection,
  isAutoPlaying = false,
  onToggleAutoPlay,
}) => {
  return (
    <div aria-label="Act I — Introduction and Studio Turntable">
      {/* Beat 0 (0.00s - 2.35s): Opening Wave & Subtitle-Inspired Spoken Lockup */}
      <SoloBeatStage
        id="beat-intro-greet"
        timing={BEAT_INTRO_GREET}
        align="intro-bottom"
        ariaLabelledBy="intro-greet-heading"
      >
        <div className="cinema-lower-veil relative flex flex-col items-center px-3 py-2 text-center">
          <div className="mb-2.5 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
            <span className="cinema-voice-cue inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-white/15 bg-black/55 px-2.5 py-1 font-mono-tech text-[9.5px] uppercase tracking-[0.18em] text-slate-200 backdrop-blur-sm sm:px-3 sm:text-[10px] sm:tracking-[0.22em]">
              <span className="cinema-wave-bars" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              00:00 · Greeting
            </span>

            {onToggleAutoPlay && (
              <button
                type="button"
                onClick={onToggleAutoPlay}
                className="inline-flex min-h-7 items-center gap-1.5 whitespace-nowrap rounded-full border border-amber-300/40 bg-black/55 px-2.5 py-1 font-mono-tech text-[9.5px] uppercase tracking-[0.16em] text-[#f6d99a] backdrop-blur-sm transition hover:border-amber-200/70 hover:bg-amber-300/20 sm:bg-amber-300/12 sm:px-3 sm:text-[10px] sm:tracking-[0.18em]"
              >
                {isAutoPlaying ? (
                  <>
                    <Pause className="h-3 w-3" aria-hidden="true" />
                    Pause Reel
                  </>
                ) : (
                  <>
                    <Volume2 className="h-3 w-3" aria-hidden="true" />
                    Watch With Sound
                  </>
                )}
              </button>
            )}
          </div>

          <h1
            id="intro-greet-heading"
            className="cinema-hero-title cinema-subtitle-bloom text-balance font-extrabold tracking-tight text-white"
          >
            <span className="cinema-word-reveal">Hi,</span>{' '}
            <span className="cinema-word-reveal cinema-word-delay-1">I&rsquo;m</span>{' '}
            <span className="cinema-word-reveal cinema-word-delay-2 cinema-gold-shimmer">
              Aayush.
            </span>
          </h1>

          <p className="cinema-subtitle mt-2 max-w-xl text-sm font-normal leading-relaxed text-slate-200/95 sm:text-base">
            Builder of quiet, perceptual software —{' '}
            <span className="text-white/95">{PROFILE.location}</span> ·{' '}
            <span className="text-slate-300">{PROFILE.academic}</span>
          </p>

          <button
            type="button"
            onClick={() => onNavigateSection('beat-identity')}
            className="mt-3.5 inline-flex items-center gap-2 font-mono-tech text-[11px] uppercase tracking-[0.24em] text-slate-300/80 transition hover:text-white"
          >
            <span>Scroll to move with the sequence</span>
            <ArrowDown className="h-3.5 w-3.5 animate-bounce" aria-hidden="true" />
          </button>
        </div>
      </SoloBeatStage>

      {/* Beat 1 (2.65s - 6.10s): 360 Turntable Profile — Left Flank Identity */}
      <SoloBeatStage
        id="beat-identity"
        timing={BEAT_IDENTITY}
        align="left"
        ariaLabelledBy="identity-heading"
      >
        <div className="cinema-flank-scrim-left space-y-3.5 text-left">
          <div className="space-y-1.5">
            <p className="cinema-kicker font-mono-tech text-[11px] uppercase tracking-[0.26em] text-slate-300">
              {PROFILE.handle} · Profile
            </p>
            <h2
              id="identity-heading"
              className="cinema-display-title cinema-scene-title text-white"
            >
              {PROFILE.fullName}
            </h2>
          </div>

          <div className="cinema-accent-beam h-[2px] w-16 bg-gradient-to-r from-[#f59e0b] via-amber-200 to-transparent" />

          <p className="cinema-subtitle text-sm leading-relaxed text-slate-200">
            {PROFILE.leadBio}
          </p>

          <dl className="grid grid-cols-1 gap-1.5 pt-1 text-xs">
            {PROFILE.facts.map((fact) => (
              <div
                key={fact.label}
                className="flex items-baseline justify-between gap-3 border-b border-white/10 pb-1"
              >
                <dt className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-slate-400">
                  {fact.label}
                </dt>
                <dd className="text-right font-medium text-slate-100">
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>

          <ul className="space-y-1.5 pt-1">
            {AI_PRACTICE_PILLARS.map((pillar) => (
              <li key={pillar.id} className="text-xs leading-snug text-slate-300">
                <span className="font-semibold text-white">{pillar.label}: </span>
                <span className="text-slate-300/90">{pillar.summary}</span>
              </li>
            ))}
          </ul>
        </div>
      </SoloBeatStage>

      {/* Beat 2 (6.25s - 9.65s): Return Front Smile — Right Flank Disciplines */}
      <SoloBeatStage
        id="beat-disciplines"
        timing={BEAT_DISCIPLINES}
        align="right"
        ariaLabelledBy="disciplines-heading"
      >
        <div className="cinema-flank-scrim-right space-y-3.5 text-left md:text-right">
          <div className="space-y-1.5">
            <p className="cinema-kicker font-mono-tech text-[11px] uppercase tracking-[0.26em] text-amber-200/90">
              Engineering Focus
            </p>
            <h2
              id="disciplines-heading"
              className="cinema-display-title cinema-scene-title text-white"
            >
              Craft &amp; Practice
            </h2>
          </div>

          <div className="cinema-accent-beam h-[2px] w-16 bg-gradient-to-r from-[#f59e0b] to-transparent md:ml-auto md:bg-gradient-to-l" />

          <ul className="space-y-2.5">
            {DISCIPLINES.map((disc, idx) => (
              <li key={disc.id} className="space-y-0.5">
                <div className="flex items-baseline gap-2 md:justify-end">
                  <span className="font-mono-tech text-[10px] text-amber-300/80">
                    0{idx + 1}
                  </span>
                  <h3 className="text-xs font-semibold tracking-wide text-white">
                    {disc.title}
                  </h3>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  {disc.tagline}
                </p>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-4 pt-1 md:justify-end">
            <button
              type="button"
              onClick={() => onNavigateSection('act-works')}
              className="cinema-link-action inline-flex items-center gap-1.5 font-mono-tech text-[11px] uppercase tracking-[0.2em] text-[#f59e0b] hover:text-white"
            >
              <span>Systems Showcase</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </SoloBeatStage>
    </div>
  );
};
