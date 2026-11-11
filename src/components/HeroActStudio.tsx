import React from 'react';
import {
  ArrowDown,
  ArrowUpRight,
  Cpu,
  Eye,
  Mic,
  Pause,
  Radio,
  Volume2,
} from 'lucide-react';
import {
  AI_PRACTICE_PILLARS,
  DISCIPLINES,
  Discipline,
  PROFILE,
} from '@/data/portfolio';
import { SoloBeatStage } from '@/components/SoloBeatStage';

export interface HeroActStudioProps {
  onNavigateSection: (sectionId: string) => void;
  isAutoPlaying?: boolean;
  onToggleAutoPlay?: () => void;
}

function DisciplineIcon({ name }: { name: Discipline['iconName'] }): React.ReactElement {
  const iconClass = 'h-4 w-4 text-[#f5c46b]';
  switch (name) {
    case 'cpu':
      return <Cpu className={iconClass} aria-hidden="true" />;
    case 'eye':
      return <Eye className={iconClass} aria-hidden="true" />;
    case 'circuit':
      return <Radio className={iconClass} aria-hidden="true" />;
    case 'mic':
      return <Mic className={iconClass} aria-hidden="true" />;
  }
}

export const HeroActStudio: React.FC<HeroActStudioProps> = ({
  onNavigateSection,
  isAutoPlaying = false,
  onToggleAutoPlay,
}) => {
  return (
    <section
      id="act-studio"
      aria-labelledby="heading-studio"
      className="pointer-events-none absolute inset-0"
    >
      {/* Beat 0 (0.00s - 2.15s): Spoken "Hi, I'm Aayush." Opening Wave Subtitle Lockup */}
      <SoloBeatStage
        id="beat-intro-greet"
        align="center"
        vertical="end"
        bottomInset
        ariaLabelledBy="intro-greet-heading"
        timing={{
          clip: 0,
          inStart: 0,
          inEnd: 0,
          outStart: 0.188,
          outEnd: 0.222,
          gesture: 'intro-wave',
          holdStart: true,
        }}
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-2 flex flex-wrap items-center justify-center gap-3">
            <span className="inline-flex items-center gap-2 font-mono-tech text-[11px] font-bold uppercase tracking-[0.2em] text-slate-200 [text-shadow:0_2px_12px_rgb(0_0_0/0.95)]">
              <span className="cinema-wave-bars" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span>00:00 · Introduction</span>
            </span>

            {onToggleAutoPlay && (
              <>
                <span aria-hidden="true" className="text-white/30">
                  ·
                </span>
                <button
                  type="button"
                  onClick={onToggleAutoPlay}
                  className="cinema-link-action min-h-8 font-mono-tech text-[11px] font-bold uppercase tracking-[0.18em] text-[#f5c46b] hover:text-white"
                >
                  {isAutoPlaying ? (
                    <>
                      <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Pause Reel</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Watch With Sound</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>

          <h1
            id="intro-greet-heading"
            className="cinema-display-title cinema-hero-title"
          >
            <span className="cinema-word-reveal">Hi,</span>{' '}
            <span className="cinema-word-reveal cinema-word-delay-1">I&rsquo;m</span>{' '}
            <strong className="cinema-word-reveal cinema-word-delay-2 cinema-gold-shimmer font-extrabold">
              Aayush.
            </strong>
          </h1>

          <p className="cinema-subtitle mt-2.5 text-sm sm:text-base">
            <strong className="font-bold text-white">{PROFILE.fullName}</strong>{' '}
            <span className="font-bold text-[#f5c46b]">({PROFILE.handle})</span> ·
            Builder of quiet, perceptual software —{' '}
            <strong className="font-semibold text-white">{PROFILE.location}</strong>
          </p>

          <button
            type="button"
            onClick={() => onNavigateSection('beat-hero')}
            className="cinema-link-action mt-3 font-mono-tech text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-200 hover:text-[#f5c46b]"
          >
            <span>Scroll to enter</span>
            <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </SoloBeatStage>

      {/* Beat 1 (2.25s - 4.30s): Right Flank — Original Hero Copy Preserved */}
      <SoloBeatStage
        id="beat-hero"
        align="right"
        ariaLabelledBy="heading-studio"
        timing={{
          clip: 0,
          inStart: 0.224,
          inEnd: 0.264,
          outStart: 0.395,
          outEnd: 0.432,
          gesture: 'turn-left',
        }}
      >
        <div className="md:text-right">
          <p className="cinema-kicker">{PROFILE.fullName}</p>

          <h2
            id="heading-studio"
            className="cinema-display-title cinema-hero-title mt-3"
          >
            Engineering{' '}
            <strong className="cinema-gold-shimmer font-extrabold">Living</strong>{' '}
            Software
          </h2>

          <div
            className="cinema-accent-beam mt-4 w-24 md:ml-auto"
            aria-hidden="true"
          />

          <p className="cinema-subtitle mt-4 text-sm sm:text-base md:ml-auto">
            I am{' '}
            <strong className="font-bold text-white">
              {PROFILE.fullName} ({PROFILE.handle})
            </strong>{' '}
            from <strong className="font-bold text-white">{PROFILE.location}</strong>{' '}
            — building autonomous systems, multimodal AI, and interactive tools.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-6 md:justify-end">
            <button
              type="button"
              onClick={() => onNavigateSection('act-works')}
              className="cinema-link-action font-sans text-sm font-bold text-[#f5c46b] hover:text-white"
            >
              <span>Selected Systems</span>
              <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onNavigateSection('section-contact')}
              className="cinema-link-action font-sans text-sm font-semibold text-white hover:text-[#f5c46b]"
            >
              <span>Contact</span>
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </SoloBeatStage>

      {/* Beat 2 (4.35s - 6.20s): Turntable Profile — Core AI Practice */}
      <SoloBeatStage
        id="beat-identity"
        align="left"
        ariaLabelledBy="heading-identity"
        timing={{
          clip: 0,
          inStart: 0.435,
          inEnd: 0.475,
          outStart: 0.585,
          outEnd: 0.620,
          gesture: 'turn-right',
        }}
      >
        <div>
          <p className="cinema-kicker">Core Practice</p>

          <h2
            id="heading-identity"
            className="cinema-display-title cinema-scene-title mt-2.5"
          >
            Building With{' '}
            <strong className="cinema-gold-shimmer font-extrabold">
              Intelligence
            </strong>
          </h2>

          <div className="cinema-accent-beam mt-3 w-20" aria-hidden="true" />

          <p className="mt-3 font-sans text-sm font-bold text-[#f5c46b] sm:text-base">
            AI Developer · Agentic &amp; Multimodal Systems
          </p>

          <div className="mt-4 space-y-3">
            {AI_PRACTICE_PILLARS.map((pillar) => (
              <div key={pillar.id}>
                <h3 className="font-sans text-xs font-extrabold tracking-wide text-white sm:text-sm">
                  {pillar.label}
                </h3>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-200/90 sm:text-[13px] [text-shadow:0_2px_10px_rgb(0_0_0/0.92)]">
                  {pillar.summary}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-200/90 [text-shadow:0_2px_10px_rgb(0_0_0/0.92)]">
            <span className="font-semibold text-white">{PROFILE.location}</span>
            <span>{PROFILE.academic}</span>
            <a
              href="https://github.com/aayushbhatta230-ux"
              target="_blank"
              rel="noreferrer"
              className="cinema-link-action font-semibold text-[#f5c46b] hover:text-white"
            >
              <span>GitHub Profile</span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </SoloBeatStage>

      {/* Beats 1.4 - 1.7 (6.25s - 9.68s): Core Disciplines Alternating Right / Left */}
      {DISCIPLINES.map((discipline, idx) => {
        const starts = [0.625, 0.710, 0.795, 0.880] as const;
        const inEnds = [0.650, 0.735, 0.820, 0.905] as const;
        const outStarts = [0.682, 0.767, 0.852, 0.938] as const;
        const outEnds = [0.706, 0.791, 0.876, 0.968] as const;
        const align = idx % 2 === 0 ? 'right' : 'left';

        return (
          <SoloBeatStage
            key={discipline.id}
            id={idx === 0 ? 'beat-disciplines' : undefined}
            align={align}
            timing={{
              clip: 0,
              inStart: starts[idx],
              inEnd: inEnds[idx],
              outStart: outStarts[idx],
              outEnd: outEnds[idx],
            }}
          >
            <article className={align === 'right' ? 'md:text-right' : undefined}>
              <div
                className={`cinema-kicker flex items-center gap-2 ${
                  align === 'right' ? 'md:justify-end' : ''
                }`}
              >
                <DisciplineIcon name={discipline.iconName} />
                <span>Discipline {discipline.index}</span>
              </div>

              <h3 className="cinema-display-title cinema-scene-title mt-2.5">
                {discipline.title}
              </h3>

              <div
                className={`cinema-accent-beam mt-3 w-16 ${
                  align === 'right' ? 'md:ml-auto' : ''
                }`}
                aria-hidden="true"
              />

              <p className="mt-3 font-sans text-xs font-extrabold tracking-wide text-[#f5c46b] sm:text-sm [text-shadow:0_2px_12px_rgb(0_0_0/0.94)]">
                {discipline.tagline}
              </p>

              <p
                className={`cinema-subtitle mt-2.5 text-xs sm:text-sm ${
                  align === 'right' ? 'md:ml-auto' : ''
                }`}
              >
                {discipline.summary}
              </p>
            </article>
          </SoloBeatStage>
        );
      })}
    </section>
  );
};
