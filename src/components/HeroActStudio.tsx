import React from 'react';
import {
  ArrowDown,
  ArrowRight,
  Cpu,
  Eye,
  Layers,
  MapPin,
  Mic,
  Sparkles,
} from 'lucide-react';
import {
  AI_PRACTICE_PILLARS,
  DISCIPLINES,
  Discipline,
  PROFILE,
} from '@/data/portfolio';
import { SoloBeatStage } from '@/components/SoloBeatStage';
import { beatDataAttrs } from '@/lib/scrollBeats';

export interface HeroActStudioProps {
  onNavigateSection: (sectionId: string) => void;
}

function DisciplineIcon({ name }: { name: Discipline['iconName'] }): React.ReactNode {
  switch (name) {
    case 'cpu':
      return <Cpu className="h-4 w-4 text-slate-200" aria-hidden="true" />;
    case 'eye':
      return <Eye className="h-4 w-4 text-teal-300" aria-hidden="true" />;
    case 'circuit':
      return <Sparkles className="h-4 w-4 text-amber-300" aria-hidden="true" />;
    case 'mic':
      return <Mic className="h-4 w-4 text-violet-300" aria-hidden="true" />;
  }
}

export const HeroActStudio: React.FC<HeroActStudioProps> = ({ onNavigateSection }) => {
  return (
    <div id="act-studio" aria-labelledby="main-content" className="contents">
      {/* Beat 0.0: Opening Solo Portrait Curtain — pure character first */}
      <div
        data-align="center"
        {...beatDataAttrs({
          clip: 0,
          inStart: -0.05,
          inEnd: 0.0,
          outStart: 0.025,
          outEnd: 0.075,
          holdStart: true,
        })}
        className="pointer-events-none absolute inset-x-0 bottom-7 z-20 flex justify-center px-4 sm:bottom-9"
      >
        <div data-beat-stage="true">
          <button
            type="button"
            onClick={() => onNavigateSection('beat-hero')}
            className="cinema-hud-arrive cinema-link-action pointer-events-auto font-sans text-xs font-medium tracking-[0.2em] uppercase text-white/80 hover:text-[#e8c589]"
          >
            <span>Scroll to enter</span>
            <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Beat 1.1: Unboxed Editorial Hero Lockup (Lower-Left) */}
      <SoloBeatStage
        align="left"
        vertical="end"
        timing={{
          clip: 0,
          inStart: 0.155,
          inEnd: 0.21,
          outStart: 0.285,
          outEnd: 0.325,
        }}
      >
        <div>
          <p className="cinema-kicker mb-2.5 flex flex-wrap items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-[#f5c46b]" aria-hidden="true" />
            <span>AI Developer · {PROFILE.location}</span>
          </p>

          <h1
            id="main-content"
            tabIndex={-1}
            className="cinema-display-title cinema-hero-title outline-none"
          >
            Aayush{' '}
            <span className="cinema-gold-shimmer block text-[#f5c46b]">Bhatta</span>
          </h1>

          <div className="cinema-accent-beam mt-3.5 w-24" aria-hidden="true" />

          <p className="cinema-subtitle mt-3.5 text-sm sm:mt-4 sm:text-base">
            {PROFILE.headline}.{' '}
            <span className="text-slate-300/80">{PROFILE.academic}.</span>
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-6 sm:mt-6 sm:gap-7">
            <button
              type="button"
              onClick={() => onNavigateSection('act-works')}
              className="cinema-link-action font-sans text-xs font-semibold uppercase tracking-[0.16em] text-white hover:text-[#f5c46b]"
            >
              <span>Explore Selected Works</span>
              <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onNavigateSection('section-contact')}
              className="cinema-link-action font-sans text-xs font-semibold uppercase tracking-[0.16em] text-[#f5c46b] hover:text-white"
            >
              <span>Get in Touch</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onNavigateSection('act-credentials')}
              className="cinema-link-action font-sans text-xs font-medium uppercase tracking-[0.16em] text-slate-300/85 hover:text-[#f5c46b]"
            >
              Credentials
            </button>
          </div>
        </div>
      </SoloBeatStage>

      {/* Beat 1.2: AI Developer Profile (Right Flank) */}
      <SoloBeatStage
        align="right"
        timing={{
          clip: 0,
          inStart: 0.335,
          inEnd: 0.38,
          outStart: 0.44,
          outEnd: 0.475,
        }}
      >
        <article>
          <p className="cinema-kicker">Profile & Craft</p>
          <h2 className="cinema-display-title cinema-scene-title mt-2">
            Engineering{' '}
            <span className="cinema-gold-shimmer block text-[#f5c46b]">Living Software</span>
          </h2>
          <div className="cinema-accent-beam mt-3 w-20" aria-hidden="true" />

          <p className="cinema-subtitle mt-3 text-xs sm:mt-3.5 sm:text-sm">
            {PROFILE.leadBio}
          </p>

          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 sm:mt-6">
            {PROFILE.facts.map((fact) => (
              <div key={fact.label}>
                <dt className="font-mono-tech text-[10px] uppercase tracking-[0.16em] text-[#f5c46b]/85">
                  {fact.label}
                </dt>
                <dd className="mt-0.5 font-sans text-xs font-semibold text-white">
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
        </article>
      </SoloBeatStage>

      {/* Beat 1.3: How I Work with AI (Left Flank — zero tech stacks) */}
      <SoloBeatStage
        align="left"
        timing={{
          clip: 0,
          inStart: 0.485,
          inEnd: 0.525,
          outStart: 0.58,
          outEnd: 0.61,
        }}
      >
        <article>
          <div className="cinema-kicker flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-[#f5c46b]" aria-hidden="true" />
            <span>Craft & Method</span>
          </div>
          <h3 className="cinema-display-title cinema-scene-title mt-2">
            Building With{' '}
            <span className="cinema-gold-shimmer block text-[#f5c46b]">Intelligence</span>
          </h3>
          <div className="cinema-accent-beam mt-3 w-20" aria-hidden="true" />

          <div className="mt-4 space-y-4 sm:mt-5">
            {AI_PRACTICE_PILLARS.map((pillar) => (
              <div key={pillar.id}>
                <div className="font-mono-tech text-[10px] uppercase tracking-[0.18em] text-[#f5c46b] sm:text-[11px]">
                  {pillar.label}
                </div>
                <p className="mt-0.5 font-sans text-xs leading-relaxed text-slate-100/90">
                  {pillar.summary}
                </p>
              </div>
            ))}
          </div>
        </article>
      </SoloBeatStage>

      {/* Beats 1.4 – 1.7: Core Disciplines Alternating Right / Left */}
      {DISCIPLINES.map((discipline, idx) => {
        const starts = [0.618, 0.700, 0.782, 0.864] as const;
        const inEnds = [0.644, 0.726, 0.808, 0.890] as const;
        const outStarts = [0.672, 0.754, 0.836, 0.916] as const;
        const outEnds = [0.693, 0.775, 0.857, 0.939] as const;
        const align = idx % 2 === 0 ? 'right' : 'left';

        return (
          <SoloBeatStage
            key={discipline.id}
            align={align}
            timing={{
              clip: 0,
              inStart: starts[idx],
              inEnd: inEnds[idx],
              outStart: outStarts[idx],
              outEnd: outEnds[idx],
            }}
          >
            <article>
              <div className="cinema-kicker flex items-center gap-2">
                <DisciplineIcon name={discipline.iconName} />
                <span>Discipline {discipline.index}</span>
              </div>

              <h3 className="cinema-display-title cinema-scene-title mt-2.5">
                {discipline.title}
              </h3>

              <div className="cinema-accent-beam mt-3 w-16" aria-hidden="true" />

              <p className="mt-3 font-sans text-xs font-medium tracking-wide text-[#f5c46b] sm:text-sm">
                {discipline.tagline}
              </p>

              <p className="cinema-subtitle mt-2.5 text-xs sm:text-sm">
                {discipline.summary}
              </p>
            </article>
          </SoloBeatStage>
        );
      })}
    </div>
  );
};
