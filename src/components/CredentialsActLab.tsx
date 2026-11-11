import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowUp,
  ArrowUpRight,
  Award,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Mail,
  RotateCcw,
} from 'lucide-react';
import {
  BEYOND_PILLARS,
  CREDENTIALS,
  CredentialItem,
  PROFILE,
  SOCIAL_PROFILES,
} from '@/data/portfolio';
import { beatDataAttrs } from '@/lib/scrollBeats';
import { runScopedViewTransition } from '@/lib/viewTransitions';
import { SoloBeatStage } from '@/components/SoloBeatStage';
import { cn } from '@/lib/utils';

type CredentialCategory = CredentialItem['category'];

export interface CredentialsActLabProps {
  onSelectCredential: (item: CredentialItem) => void;
  onReplayFromStart?: () => void;
}

const CREDENTIAL_CATEGORIES: Array<'All' | CredentialCategory> = [
  'All',
  'Certifications',
  'MUN & Debate',
  'Hackathons & Leadership',
];

interface CredentialSoloBlockProps {
  credential: CredentialItem;
  indexLabel: string;
  alignText: 'left' | 'right';
  onInspect: (item: CredentialItem) => void;
  navSlot?: React.ReactNode;
}

const CredentialSoloBlock: React.FC<CredentialSoloBlockProps> = ({
  credential,
  indexLabel,
  alignText,
  onInspect,
  navSlot,
}) => {
  const isRight = alignText === 'right';

  return (
    <article className={isRight ? 'md:text-right' : undefined}>
      <div
        className={cn(
          'cinema-kicker flex items-center gap-2 text-teal-300',
          isRight && 'md:justify-end'
        )}
      >
        <Award className="h-3.5 w-3.5" aria-hidden="true" />
        <span>
          <strong className="font-extrabold text-teal-200">{indexLabel}</strong> ·{' '}
          {credential.category}
        </span>
      </div>

      <h3 className="cinema-display-title cinema-scene-title mt-2.5">
        {credential.title}
      </h3>

      <div
        className={cn(
          'cinema-accent-beam cinema-accent-beam-teal mt-3 w-16',
          isRight && 'md:ml-auto'
        )}
        aria-hidden="true"
      />

      <p className="mt-3 font-sans text-xs font-extrabold text-teal-300 sm:text-sm [text-shadow:0_2px_12px_rgb(0_0_0/0.95)]">
        {credential.issuer} · {credential.badge}
      </p>

      <p
        className={cn(
          'cinema-subtitle mt-2.5 text-xs sm:text-sm',
          isRight && 'md:ml-auto'
        )}
      >
        {credential.summary}
      </p>

      {credential.signatories && (
        <p
          className={cn(
            'mt-2 max-w-[44ch] text-xs font-semibold text-teal-200/95 [text-shadow:0_2px_10px_rgb(0_0_0/0.92)]',
            isRight && 'md:ml-auto'
          )}
        >
          {credential.signatories}
        </p>
      )}

      <div className={cn('mt-4', isRight && 'md:flex md:justify-end')}>
        <button
          type="button"
          onClick={() => onInspect(credential)}
          className="cinema-link-action font-sans text-sm font-bold text-teal-300 hover:text-white"
        >
          <span>View Credential</span>
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {navSlot}
    </article>
  );
};

// Synchronized to Act III (clip 2: frames 384..479, 16.00s..20.03s)
const FEATURED_CREDENTIALS: Array<{
  credentialId: string;
  indexLabel: string;
  align: 'left' | 'right';
  inStart: number;
  inEnd: number;
  outStart: number;
  outEnd: number;
}> = [
  {
    credentialId: 'nimhans-cbt',
    indexLabel: '01 / 07',
    align: 'right',
    inStart: 0.185,
    inEnd: 0.220,
    outStart: 0.322,
    outEnd: 0.355,
  },
  {
    credentialId: 'nyc-mun-2023',
    indexLabel: '02 / 07',
    align: 'left',
    inStart: 0.360,
    inEnd: 0.395,
    outStart: 0.495,
    outEnd: 0.526,
  },
  {
    credentialId: 'mun-13-record',
    indexLabel: '03 / 07',
    align: 'right',
    inStart: 0.530,
    inEnd: 0.562,
    outStart: 0.625,
    outEnd: 0.652,
  },
];

export const CredentialsActLab: React.FC<CredentialsActLabProps> = ({
  onSelectCredential,
  onReplayFromStart,
}) => {
  const [activeCategory, setActiveCategory] = useState<'All' | CredentialCategory>('All');
  const [selectedFilteredIdx, setSelectedFilteredIdx] = useState(0);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const credsScopeRef = useRef<HTMLDivElement | null>(null);

  const filteredCredentials = useMemo(() => {
    if (activeCategory === 'All') return CREDENTIALS;
    return CREDENTIALS.filter((c) => c.category === activeCategory);
  }, [activeCategory]);

  const activeCredential =
    filteredCredentials[
      Math.min(selectedFilteredIdx, filteredCredentials.length - 1)
    ] ?? CREDENTIALS[0];

  const handleSelectCategory = (category: 'All' | CredentialCategory): void => {
    runScopedViewTransition(credsScopeRef.current, () => {
      setActiveCategory(category);
      setSelectedFilteredIdx(0);
    });
  };

  const handleStepCredential = (delta: number): void => {
    const count = filteredCredentials.length;
    if (count <= 1) return;
    runScopedViewTransition(credsScopeRef.current, () => {
      setSelectedFilteredIdx((idx) => (idx + delta + count) % count);
    });
  };

  const handleCopyEmail = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(PROFILE.email);
      setCopiedEmail(true);
      window.setTimeout(() => setCopiedEmail(false), 2400);
    } catch {
      window.location.href = `mailto:${PROFILE.email}`;
    }
  };

  const scrollBackToTop = (): void => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      ref={credsScopeRef}
      id="act-credentials"
      aria-labelledby="heading-credentials"
      className="scoped-vt-container pointer-events-none absolute inset-0"
    >
      {/* Unboxed Floating Act III Filter Bar */}
      <div
        {...beatDataAttrs({
          clip: 2,
          inStart: 0.02,
          inEnd: 0.06,
          outStart: 0.77,
          outEnd: 0.805,
        })}
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center bg-[linear-gradient(0deg,rgba(6,8,13,0.78)_0%,rgba(6,8,13,0)_100%)] px-4 pb-4 pt-8 sm:pb-6"
      >
        <div
          data-beat-stage="true"
          className="pointer-events-auto flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:gap-x-8"
          role="group"
          aria-label="Filter achievements by category"
        >
          {CREDENTIAL_CATEGORIES.map((category) => {
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
                    ? 'border-teal-300 font-extrabold text-teal-300'
                    : 'border-transparent font-medium text-slate-200/80 hover:text-white'
                )}
              >
                {category === 'All' ? 'All Credentials' : category}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Filtered Spotlight Mode */}
      {activeCategory !== 'All' && filteredCredentials.length > 0 && (
        <SoloBeatStage
          align="left"
          bottomInset
          ariaLabelledBy="heading-credentials"
          timing={{
            clip: 2,
            inStart: 0.015,
            inEnd: 0.055,
            outStart: 0.77,
            outEnd: 0.805,
          }}
        >
          <div className="vt-spotlight-card">
            <CredentialSoloBlock
              credential={activeCredential}
              indexLabel={`0${selectedFilteredIdx + 1} / 0${filteredCredentials.length}`}
              alignText="left"
              onInspect={onSelectCredential}
              navSlot={
                filteredCredentials.length > 1 ? (
                  <div className="mt-4 flex items-center gap-5 text-xs">
                    <button
                      type="button"
                      onClick={() => handleStepCredential(-1)}
                      className="cinema-link-action font-sans font-bold text-slate-200 hover:text-white"
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                      <span>Previous</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStepCredential(1)}
                      className="cinema-link-action font-sans font-bold text-teal-300 hover:text-white"
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

      {/* Default Scroll Choreography */}
      {activeCategory === 'All' && (
        <>
          {/* Beat 3.0 (16.00s - 16.70s): Act III Intro over dual-hand spark symmetry */}
          <SoloBeatStage
            align="left"
            bottomInset
            ariaLabelledBy="heading-credentials"
            timing={{
              clip: 2,
              inStart: 0.008,
              inEnd: 0.048,
              outStart: 0.148,
              outEnd: 0.180,
              gesture: 'both-up',
            }}
          >
            <div>
              <p className="cinema-kicker text-teal-300">Honors &amp; Diplomacy</p>
              <h2
                id="heading-credentials"
                className="cinema-display-title cinema-scene-title mt-2.5"
              >
                Certifications &amp;{' '}
                <strong className="cinema-teal-shimmer font-extrabold">
                  Honors
                </strong>
              </h2>
              <div
                className="cinema-accent-beam cinema-accent-beam-teal mt-3 w-20"
                aria-hidden="true"
              />
              <p className="cinema-subtitle mt-3.5 text-sm sm:text-base">
                Formal clinical training, United Nations diplomacy, national
                parliamentary debate, and two-term school leadership.
              </p>
            </div>
          </SoloBeatStage>

          {FEATURED_CREDENTIALS.map((beat) => {
            const cred =
              CREDENTIALS.find((item) => item.id === beat.credentialId) ??
              CREDENTIALS[0];
            return (
              <SoloBeatStage
                key={cred.id}
                align={beat.align}
                bottomInset
                timing={{
                  clip: 2,
                  inStart: beat.inStart,
                  inEnd: beat.inEnd,
                  outStart: beat.outStart,
                  outEnd: beat.outEnd,
                }}
              >
                <CredentialSoloBlock
                  credential={cred}
                  indexLabel={beat.indexLabel}
                  alignText={beat.align}
                  onInspect={onSelectCredential}
                />
              </SoloBeatStage>
            );
          })}
        </>
      )}

      {/* Beat 3.6 (18.60s - 19.22s): Discipline Beyond The Screen */}
      <SoloBeatStage
        id="beat-beyond"
        align="left"
        bottomInset
        ariaLabelledBy="heading-beyond"
        timing={{
          clip: 2,
          inStart: 0.654,
          inEnd: 0.688,
          outStart: 0.778,
          outEnd: 0.808,
        }}
      >
        <div>
          <p className="cinema-kicker text-teal-300">Beyond Engineering</p>
          <h2
            id="heading-beyond"
            className="cinema-display-title cinema-scene-title mt-2.5"
          >
            Discipline{' '}
            <strong className="cinema-teal-shimmer font-extrabold">
              Beyond The Screen
            </strong>
          </h2>
          <div
            className="cinema-accent-beam cinema-accent-beam-teal mt-3 w-20"
            aria-hidden="true"
          />

          <div className="mt-4 space-y-3">
            {BEYOND_PILLARS.map((pillar) => (
              <div key={pillar.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-sans text-xs font-extrabold text-white sm:text-sm [text-shadow:0_2px_10px_rgb(0_0_0/0.92)]">
                    {pillar.title}
                  </h3>
                  <span className="font-mono-tech text-[11px] font-bold text-teal-300 [text-shadow:0_2px_10px_rgb(0_0_0/0.92)]">
                    {pillar.metric}
                  </span>
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-200/90 sm:text-[13px] [text-shadow:0_2px_10px_rgb(0_0_0/0.92)]">
                  {pillar.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </SoloBeatStage>

      {/* Beat 3.7 (19.25s - 20.03s): Final Direct Contact & Open Profiles (Clean Cardless Portrait Finale) */}
      <SoloBeatStage
        id="section-contact"
        align="center"
        vertical="end"
        ariaLabelledBy="heading-contact"
        timing={{
          clip: 2,
          inStart: 0.812,
          inEnd: 0.855,
          outStart: 1.0,
          outEnd: 1.0,
          gesture: 'point-down',
          holdEnd: true,
        }}
      >
        <div className="text-center">
          <p className="cinema-kicker text-[#f5c46b]">Direct Contact</p>

          <h2
            id="heading-contact"
            className="cinema-display-title cinema-scene-title mt-1.5 sm:mt-2.5"
          >
            Let&rsquo;s build something{' '}
            <strong className="cinema-gold-shimmer font-extrabold">
              unforgettable
            </strong>
          </h2>

          <p className="cinema-subtitle mx-auto mt-2 text-xs sm:mt-3 sm:text-base">
            Available for technical collaboration, ambitious engineering teams,
            and impactful real-world products.
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 sm:mt-5 sm:gap-x-7 sm:gap-y-3">
            <a
              href={`mailto:${PROFILE.email}`}
              className="cinema-link-action font-sans text-xs font-extrabold text-[#f5c46b] hover:text-white sm:text-sm"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              <span>{PROFILE.email}</span>
            </a>

            <button
              type="button"
              onClick={() => void handleCopyEmail()}
              className="cinema-link-action font-sans text-xs font-bold text-slate-100 hover:text-[#f5c46b] sm:text-sm"
            >
              {copiedEmail ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" aria-hidden="true" />
                  <span>Copy Email</span>
                </>
              )}
            </button>

            {onReplayFromStart && (
              <button
                type="button"
                onClick={onReplayFromStart}
                className="cinema-link-action font-sans text-xs font-bold text-teal-300 hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Replay Reel</span>
              </button>
            )}

            <button
              type="button"
              onClick={scrollBackToTop}
              className="cinema-link-action font-sans text-xs font-bold text-slate-200 hover:text-[#f5c46b]"
            >
              <span>Back to Top</span>
              <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-x-3 gap-y-1.5 sm:mt-6 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-7 sm:gap-y-2.5">
            {SOCIAL_PROFILES.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target={social.href.startsWith('http') ? '_blank' : undefined}
                rel={social.href.startsWith('http') ? 'noreferrer' : undefined}
                className="cinema-link-action group flex-col items-center gap-0.5 text-center"
              >
                <span className="flex items-center gap-1 font-sans text-[11px] font-bold text-white group-hover:text-[#f5c46b] sm:text-xs">
                  {social.label}
                  <ArrowUpRight className="h-3 w-3 opacity-80" aria-hidden="true" />
                </span>
                <span className="hidden font-mono-tech text-[11px] font-medium text-slate-300/90 group-hover:text-white sm:inline">
                  {social.handle}
                </span>
              </a>
            ))}
          </div>
        </div>
      </SoloBeatStage>
    </div>
  );
};
