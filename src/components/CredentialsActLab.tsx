import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Award,
  Check,
  Code2,
  Copy,
  FileCheck2,
  Github,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  Mountain,
  Music,
  Sparkles,
  Video,
} from 'lucide-react';
import {
  BEYOND_PILLARS,
  CREDENTIALS,
  CredentialItem,
  PROFILE,
  SOCIAL_PROFILES,
  SocialProfile,
} from '@/data/portfolio';
import { beatDataAttrs } from '@/lib/scrollBeats';
import { runScopedViewTransition } from '@/lib/viewTransitions';
import { cn } from '@/lib/utils';
import { SoloBeatStage } from '@/components/SoloBeatStage';

export interface CredentialsActLabProps {
  onSelectCredential: (credential: CredentialItem) => void;
}

const CREDENTIAL_CATEGORIES = [
  'All Credentials',
  'Certifications',
  'MUN & Debate',
  'Hackathons & Leadership',
] as const;

type CredCategory = (typeof CREDENTIAL_CATEGORIES)[number];

function PillarIcon({ id }: { id: string }): React.ReactNode {
  switch (id) {
    case 'athletics':
      return <Mountain className="h-4 w-4 text-teal-300" aria-hidden="true" />;
    case 'music':
      return <Music className="h-4 w-4 text-violet-300" aria-hidden="true" />;
    default:
      return <Sparkles className="h-4 w-4 text-amber-300" aria-hidden="true" />;
  }
}

function SocialIcon({ kind }: { kind: SocialProfile['kind'] }): React.ReactNode {
  switch (kind) {
    case 'github':
      return <Github className="h-4 w-4 text-slate-200" aria-hidden="true" />;
    case 'linkedin':
      return <Linkedin className="h-4 w-4 text-teal-300" aria-hidden="true" />;
    case 'instagram':
      return <Instagram className="h-4 w-4 text-violet-300" aria-hidden="true" />;
    case 'tiktok':
      return <Video className="h-4 w-4 text-teal-200" aria-hidden="true" />;
    case 'dev':
      return <Code2 className="h-4 w-4 text-amber-300" aria-hidden="true" />;
    case 'globe':
      return <Globe className="h-4 w-4 text-slate-200" aria-hidden="true" />;
  }
}

export const CredentialsActLab: React.FC<CredentialsActLabProps> = ({
  onSelectCredential,
}) => {
  const [activeCategory, setActiveCategory] = useState<CredCategory>('All Credentials');
  const [selectedFilteredIdx, setSelectedFilteredIdx] = useState(0);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const credsScopeRef = useRef<HTMLDivElement | null>(null);

  const visibleCredentials = useMemo(() => {
    if (activeCategory === 'All Credentials') return CREDENTIALS;
    return CREDENTIALS.filter((c) => c.category === activeCategory);
  }, [activeCategory]);

  const activeFilteredCredential =
    visibleCredentials[Math.min(selectedFilteredIdx, Math.max(0, visibleCredentials.length - 1))] ??
    visibleCredentials[0];

  const handleSelectCategory = (category: CredCategory): void => {
    if (category === activeCategory) return;
    runScopedViewTransition(credsScopeRef.current, () => {
      setActiveCategory(category);
      setSelectedFilteredIdx(0);
    });
  };

  const handleSelectTab = (idx: number): void => {
    if (idx === selectedFilteredIdx) return;
    runScopedViewTransition(credsScopeRef.current, () => {
      setSelectedFilteredIdx(idx);
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
          inStart: 0.052,
          inEnd: 0.085,
          outStart: 0.8,
          outEnd: 0.83,
        })}
        className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center bg-[linear-gradient(0deg,rgba(6,8,13,0.72)_0%,rgba(6,8,13,0)_100%)] px-4 pb-4 pt-8 sm:pb-6"
      >
        <div
          data-beat-stage="true"
          className="pointer-events-auto flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:gap-x-7"
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
                  'min-h-8 font-sans text-xs tracking-wide transition sm:min-h-9',
                  selected
                    ? 'font-semibold text-teal-300'
                    : 'text-slate-300/75 hover:text-white'
                )}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      {activeCategory !== 'All Credentials' && activeFilteredCredential ? (
        /* Filtered Solo Spotlight: STRICTLY ONE unboxed record visible at a time */
        <SoloBeatStage
          align="left"
          bottomInset
          className="filtered-creds-beat"
          timing={{
            clip: 2,
            inStart: 0.052,
            inEnd: 0.085,
            outStart: 0.8,
            outEnd: 0.83,
          }}
        >
          <div className="vt-spotlight-card">
            {visibleCredentials.length > 1 && (
              <div
                className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2"
                role="tablist"
                aria-label={`${activeCategory} records`}
              >
                {visibleCredentials.map((cred, idx) => {
                  const isCurrent = cred.id === activeFilteredCredential.id;
                  return (
                    <button
                      key={cred.id}
                      type="button"
                      role="tab"
                      aria-selected={isCurrent}
                      onClick={() => handleSelectTab(idx)}
                      className={cn(
                        'min-h-8 font-mono-tech text-[11px] tracking-[0.12em] transition',
                        isCurrent
                          ? 'font-semibold text-teal-300'
                          : 'text-slate-400 hover:text-white'
                      )}
                    >
                      {String(idx + 1).padStart(2, '0')} · {cred.year}
                    </button>
                  );
                })}
              </div>
            )}
            <CredentialSoloBlock
              cred={activeFilteredCredential}
              displayIndex={selectedFilteredIdx + 1}
              totalCount={visibleCredentials.length}
              onSelectCredential={onSelectCredential}
            />
          </div>
        </SoloBeatStage>
      ) : (
        <>
          {/* Beat 3.1: Credentials & Honors Opening */}
          <SoloBeatStage
            align="right"
            bottomInset
            timing={{
              clip: 2,
              inStart: 0.052,
              inEnd: 0.085,
              outStart: 0.118,
              outEnd: 0.145,
            }}
          >
            <div>
              <p className="cinema-kicker flex items-center gap-2">
                <Award className="h-3.5 w-3.5 text-teal-300" aria-hidden="true" />
                <span>Credentials &amp; Honors</span>
              </p>
              <h2
                id="heading-credentials"
                className="cinema-display-title cinema-scene-title mt-2"
              >
                Certifications{' '}
                <span className="block text-teal-300">&amp; Honors</span>
              </h2>
              <div className="cinema-accent-beam cinema-accent-beam-teal mt-3 w-20" aria-hidden="true" />
              <p className="cinema-subtitle mt-3 text-xs sm:mt-3.5 sm:text-base">
                Seven verified records bridging clinical behavioral neuroscience, UN Nepal
                diplomacy, national debating, hackathons, and student leadership.
              </p>
            </div>
          </SoloBeatStage>

          {/* Beats 3.2 – 3.8: Each Credential Solo Alternating Left / Right */}
          {CREDENTIALS.map((cred, idx) => {
            const start = 0.15 + idx * 0.084;
            const timing = {
              clip: 2 as const,
              inStart: Number(start.toFixed(3)),
              inEnd: Number((start + 0.025).toFixed(3)),
              outStart: Number((start + 0.055).toFixed(3)),
              outEnd: Number((start + 0.079).toFixed(3)),
            };
            const align = idx % 2 === 0 ? 'left' : 'right';

            return (
              <SoloBeatStage key={cred.id} align={align} bottomInset timing={timing}>
                <CredentialSoloBlock
                  cred={cred}
                  displayIndex={idx + 1}
                  totalCount={CREDENTIALS.length}
                  onSelectCredential={onSelectCredential}
                />
              </SoloBeatStage>
            );
          })}

          {/* Beat 3.9: Beyond Engineering */}
          <SoloBeatStage
            align="right"
            bottomInset
            timing={{
              clip: 2,
              inStart: 0.738,
              inEnd: 0.768,
              outStart: 0.8,
              outEnd: 0.83,
            }}
          >
            <article>
              <p className="cinema-kicker text-violet-300">Beyond Engineering</p>
              <h3 className="cinema-display-title cinema-scene-title mt-2">
                Discipline Beyond{' '}
                <span className="block text-teal-300">The Screen</span>
              </h3>
              <div className="mt-4 space-y-3.5">
                {BEYOND_PILLARS.map((pillar) => (
                  <div key={pillar.id}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="inline-flex items-center gap-2 font-sans text-xs font-semibold tracking-wide text-white sm:text-sm">
                        <PillarIcon id={pillar.id} />
                        {pillar.title}
                      </span>
                      <span className="font-mono-tech text-[10px] tracking-wider text-teal-300">
                        {pillar.metric}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-300/90">
                      {pillar.description}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          </SoloBeatStage>
        </>
      )}

      {/* Beat 3.10: Direct Contact */}
      <SoloBeatStage
        id="section-contact"
        ariaLabelledBy="heading-contact"
        align="center"
        timing={{
          clip: 2,
          inStart: 0.84,
          inEnd: 0.895,
          outStart: 1.0,
          outEnd: 1.0,
          holdEnd: true,
        }}
      >
        <div>
          <div className="flex flex-col justify-between gap-6 pb-8 md:flex-row md:items-end">
            <div>
              <p className="cinema-kicker">Direct Contact</p>
              <h2
                id="heading-contact"
                className="cinema-display-title cinema-scene-title mt-2.5"
              >
                Let’s build something{' '}
                <span className="cinema-gold-shimmer block text-[#f5c46b]">unforgettable</span>
              </h2>
              <div className="cinema-accent-beam mt-3 w-20" aria-hidden="true" />
              <p className="cinema-subtitle mt-3 text-xs sm:mt-4 sm:text-base">
                Open to engineering collaborations, autonomous system research, intelligent
                products, and ambitious builders worldwide from Kathmandu, Nepal.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6 sm:gap-7">
              <a
                href={`mailto:${PROFILE.email}`}
                className="cinema-link-action font-sans text-xs font-semibold uppercase tracking-[0.14em] text-[#e8c589] hover:text-white"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                <span>Send Email</span>
              </a>

              <button
                type="button"
                onClick={handleCopyEmail}
                className="cinema-link-action font-mono-tech text-xs text-white/90 hover:text-[#e8c589]"
              >
                {copiedEmail ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-teal-300" aria-hidden="true" />
                    <span>Copied Email</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-300" aria-hidden="true" />
                    <span>{PROFILE.email}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <span className="visually-hidden" aria-live="polite">
            {copiedEmail ? `Copied ${PROFILE.email} to clipboard` : ''}
          </span>

          <ul className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
            {SOCIAL_PROFILES.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex min-h-11 items-center justify-between gap-2 transition hover:translate-x-1"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <SocialIcon kind={social.kind} />
                    <div className="truncate">
                      <div className="font-sans text-xs font-semibold tracking-wide text-white transition group-hover:text-[#e8c589] sm:text-sm">
                        {social.label}
                      </div>
                      <div className="truncate font-mono-tech text-[10px] text-slate-300/75 sm:text-[11px]">
                        {social.handle}
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight
                    className="h-3.5 w-3.5 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#e8c589] sm:h-4 sm:w-4"
                    aria-hidden="true"
                  />
                </a>
              </li>
            ))}
          </ul>

          <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 font-mono-tech text-[10px] tracking-[0.14em] text-slate-400/80 sm:text-[11px]">
            <p>© 2026 Aayush Bhatta · Kathmandu, Nepal</p>
          </footer>
        </div>
      </SoloBeatStage>
    </div>
  );
};

interface CredentialSoloBlockProps {
  cred: CredentialItem;
  displayIndex: number;
  totalCount: number;
  onSelectCredential: (credential: CredentialItem) => void;
}

function CredentialSoloBlock({
  cred,
  displayIndex,
  totalCount,
  onSelectCredential,
}: CredentialSoloBlockProps): React.ReactElement {
  return (
    <article>
      <div className="flex items-center justify-between gap-2">
        <span className="cinema-kicker text-teal-300">
          {cred.badge} · {cred.year}
        </span>
        <span className="font-mono-tech text-[11px] tracking-[0.18em] text-white/60">
          {String(displayIndex).padStart(2, '0')} / {String(totalCount).padStart(2, '0')}
        </span>
      </div>

      <div>
        <h3 className="cinema-display-title cinema-scene-title mt-2">
          {cred.title}
        </h3>
        <div className="cinema-accent-beam cinema-accent-beam-teal mt-3 w-16" aria-hidden="true" />
        <p className="mt-2 font-sans text-xs font-medium tracking-wide text-violet-300 sm:text-sm">
          {cred.issuer}
        </p>
      </div>

      <div>
        <p className="cinema-subtitle mt-2.5 text-xs sm:text-sm">
          {cred.summary}
        </p>

        {cred.signatories && (
          <p className="mt-2.5 hidden text-xs leading-relaxed text-teal-200/90 sm:block">
            {cred.signatories}
          </p>
        )}
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={() => onSelectCredential(cred)}
          className="cinema-link-action font-sans text-xs font-semibold uppercase tracking-[0.14em] text-teal-300 hover:text-white"
        >
          <FileCheck2 className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Inspect Credential Record</span>
        </button>
      </div>
    </article>
  );
}
