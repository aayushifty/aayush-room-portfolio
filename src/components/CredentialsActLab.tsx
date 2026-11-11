import React, { useState } from 'react';
import {
  ArrowUpRight,
  Award,
  Check,
  Copy,
  Mail,
  RotateCcw,
} from 'lucide-react';
import {
  BEYOND_PILLARS,
  CredentialItem,
  CREDENTIALS,
  PROFILE,
  SOCIAL_PROFILES,
} from '@/data/portfolio';
import { BeatTimingSpec } from '@/lib/scrollBeats';
import { SoloBeatStage } from '@/components/SoloBeatStage';
import { cn } from '@/lib/utils';

export interface CredentialsActLabProps {
  onSelectCredential: (item: CredentialItem) => void;
  onReplayFromStart?: () => void;
}

// Exact frame timings for Act III (clip 2: frames 526..719, 21.92s..30.00s)
const BEAT_DOUBLE_LEFT: BeatTimingSpec = {
  clip: 2,
  inStart: 0.01,
  inEnd: 0.055,
  outStart: 0.232,
  outEnd: 0.266,
  gesture: 'double-left',
};

const BEAT_DOUBLE_RIGHT: BeatTimingSpec = {
  clip: 2,
  inStart: 0.272,
  inEnd: 0.318,
  outStart: 0.495,
  outEnd: 0.532,
  gesture: 'double-right',
};

const BEAT_NAVY_UPRIGHT: BeatTimingSpec = {
  clip: 2,
  inStart: 0.542,
  inEnd: 0.592,
  outStart: 0.735,
  outEnd: 0.775,
  gesture: 'navy-upright',
};

const BEAT_POINT_DOWN_CONTACT: BeatTimingSpec = {
  clip: 2,
  inStart: 0.785,
  inEnd: 0.84,
  outStart: 1.0,
  outEnd: 1.0,
  gesture: 'point-down',
  holdEnd: true,
};

function pickCredential(id: string): CredentialItem {
  return CREDENTIALS.find((c) => c.id === id) ?? CREDENTIALS[0];
}

interface CredentialSoloRowProps {
  item: CredentialItem;
  alignText: 'left' | 'right';
  onInspect: (item: CredentialItem) => void;
}

const CredentialSoloRow: React.FC<CredentialSoloRowProps> = ({
  item,
  alignText,
  onInspect,
}) => {
  const isRight = alignText === 'right';
  return (
    <button
      type="button"
      onClick={() => onInspect(item)}
      className={cn(
        'group w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 backdrop-blur-sm transition hover:border-teal-300/60 hover:bg-black/60',
        isRight ? 'text-left md:text-right' : 'text-left'
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between gap-2',
          isRight && 'md:flex-row-reverse'
        )}
      >
        <span className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-teal-300/90">
          {item.badge} · {item.year}
        </span>
        <ArrowUpRight
          className="h-3.5 w-3.5 shrink-0 text-teal-300/75 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white"
          aria-hidden="true"
        />
      </div>
      <p className="mt-0.5 text-xs font-semibold leading-snug text-white">
        {item.title}
      </p>
      <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-slate-300/90">
        {item.issuer}
      </p>
    </button>
  );
};

export const CredentialsActLab: React.FC<CredentialsActLabProps> = ({
  onSelectCredential,
  onReplayFromStart,
}) => {
  const [copiedEmail, setCopiedEmail] = useState(false);

  const nycMun = pickCredential('nyc-mun-2023');
  const munRecord = pickCredential('mun-13-record');
  const mahakumbha = pickCredential('mahakumbha-2022');

  const cbt = pickCredential('nimhans-cbt');
  const hackathons = pickCredential('national-hackathons');
  const captain = pickCredential('school-captain');
  const trinityHonours = pickCredential('trinity-science');

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
    <div aria-label="Act III — Credentials, Life & Direct Reach">
      {/* Beat 8 (22.00s - 24.05s): Both Hands Point Screen-Left -> Top-Left Diplomacy Sanctuary */}
      <SoloBeatStage
        id="beat-double-left"
        timing={BEAT_DOUBLE_LEFT}
        align="top-left"
        ariaLabelledBy="diplomacy-heading"
      >
        <div className="cinema-flank-scrim-left space-y-2.5 text-left">
          <div className="space-y-1">
            <p className="cinema-kicker inline-flex items-center gap-1.5 font-mono-tech text-[10px] uppercase tracking-[0.26em] text-teal-300">
              <Award className="h-3 w-3" aria-hidden="true" />
              <span>Diplomacy &amp; Rhetoric · Gesture Left</span>
            </p>
            <h2
              id="diplomacy-heading"
              className="cinema-display-title text-2xl text-white sm:text-3xl"
            >
              Representing &amp; Debating
            </h2>
          </div>

          <div className="cinema-accent-beam cinema-accent-beam-teal h-[2px] w-14 bg-gradient-to-r from-[#2dd4bf] to-transparent" />

          <div className="space-y-2">
            {[nycMun, munRecord, mahakumbha].map((cred) => (
              <CredentialSoloRow
                key={cred.id}
                item={cred}
                alignText="left"
                onInspect={onSelectCredential}
              />
            ))}
          </div>
        </div>
      </SoloBeatStage>

      {/* Beat 9 (24.15s - 26.20s): Both Hands Point Screen-Right -> Clinical, Hackathons & Leadership */}
      <SoloBeatStage
        id="beat-double-right"
        timing={BEAT_DOUBLE_RIGHT}
        align="right"
        ariaLabelledBy="recognition-heading"
      >
        <div className="cinema-flank-scrim-right space-y-2.5 text-left md:text-right">
          <div className="space-y-1">
            <p className="cinema-kicker font-mono-tech text-[10px] uppercase tracking-[0.26em] text-teal-300">
              Credentials &amp; Leadership
            </p>
            <h2
              id="recognition-heading"
              className="cinema-display-title text-2xl text-white sm:text-3xl"
            >
              Clinical, Builds &amp; Merit
            </h2>
          </div>

          <div className="cinema-accent-beam cinema-accent-beam-teal h-[2px] w-14 bg-gradient-to-r from-[#2dd4bf] to-transparent md:ml-auto md:bg-gradient-to-l" />

          <div className="space-y-2">
            {[cbt, hackathons, captain, trinityHonours].map((cred) => (
              <CredentialSoloRow
                key={cred.id}
                item={cred}
                alignText="right"
                onInspect={onSelectCredential}
              />
            ))}
          </div>
        </div>
      </SoloBeatStage>

      {/* Beat 10 (26.32s - 28.15s): Navy Hoodie Morph + Diagonal Up-Right -> Lower-Right Beyond Screen */}
      <SoloBeatStage
        id="beat-navy-upright"
        timing={BEAT_NAVY_UPRIGHT}
        align="right-mid-low"
        ariaLabelledBy="beyond-heading"
      >
        <div className="cinema-flank-scrim-right space-y-2.5 text-left md:text-right">
          <div className="space-y-1">
            <p className="cinema-kicker font-mono-tech text-[10px] uppercase tracking-[0.26em] text-teal-300">
              Outside The Terminal
            </p>
            <h2
              id="beyond-heading"
              className="cinema-display-title text-2xl text-white sm:text-3xl"
            >
              Beyond The Screen
            </h2>
          </div>

          <div className="cinema-accent-beam cinema-accent-beam-teal h-[2px] w-14 bg-gradient-to-r from-[#2dd4bf] to-transparent md:ml-auto md:bg-gradient-to-l" />

          <ul className="space-y-2">
            {BEYOND_PILLARS.map((pillar) => (
              <li
                key={pillar.id}
                className="rounded-lg border border-white/10 bg-black/45 px-3 py-2 backdrop-blur-sm"
              >
                <p className="font-mono-tech text-[10px] uppercase tracking-[0.2em] text-teal-300/90">
                  {pillar.metric}
                </p>
                <p className="text-xs font-semibold text-white">
                  {pillar.title}
                </p>
                <p className="line-clamp-2 text-[11px] leading-snug text-slate-300">
                  {pillar.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </SoloBeatStage>

      {/* Beat 11 (28.28s - 30.00s): Both Hands Point Downward -> Bottom-Center Contact Convergence */}
      <SoloBeatStage
        id="section-contact"
        timing={BEAT_POINT_DOWN_CONTACT}
        align="bottom-center"
        ariaLabelledBy="contact-heading"
      >
        <div className="cinema-lower-veil flex flex-col items-center rounded-2xl border border-white/15 bg-black/65 px-5 py-4 text-center shadow-2xl backdrop-blur-md sm:px-7">
          <p className="font-mono-tech text-[10px] uppercase tracking-[0.28em] text-teal-300">
            {PROFILE.handle} · {PROFILE.location}
          </p>
          <h2
            id="contact-heading"
            className="cinema-display-title mt-1 text-2xl text-white sm:text-3xl"
          >
            Start a Conversation
          </h2>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2.5">
            <a
              href={`mailto:${PROFILE.email}`}
              className="inline-flex min-h-9 items-center gap-2 rounded-full bg-teal-400 px-4 py-1.5 font-sans text-xs font-semibold text-slate-950 transition hover:bg-teal-300"
            >
              <Mail className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{PROFILE.email}</span>
            </a>

            <button
              type="button"
              onClick={handleCopyEmail}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3.5 py-1.5 font-mono-tech text-[11px] uppercase tracking-[0.16em] text-slate-100 transition hover:border-teal-300/60 hover:bg-white/10"
            >
              {copiedEmail ? (
                <>
                  <Check className="h-3.5 w-3.5 text-teal-300" aria-hidden="true" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Copy</span>
                </>
              )}
            </button>

            {onReplayFromStart && (
              <button
                type="button"
                onClick={onReplayFromStart}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-3.5 py-1.5 font-mono-tech text-[11px] uppercase tracking-[0.16em] text-slate-300 transition hover:border-white/40 hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Replay</span>
              </button>
            )}
          </div>

          <nav
            aria-label="Social profiles"
            className="mt-3 flex flex-wrap items-center justify-center gap-1.5 border-t border-white/10 pt-2.5"
          >
            {SOCIAL_PROFILES.filter((s) => s.kind !== 'globe').map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                title={social.handle}
                className="inline-flex min-h-7 items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 font-mono-tech text-[10px] tracking-wide text-slate-300 transition hover:border-teal-300/50 hover:bg-teal-400/15 hover:text-white"
              >
                <span>{social.label}</span>
                <ArrowUpRight className="h-2.5 w-2.5 opacity-70" aria-hidden="true" />
              </a>
            ))}
          </nav>
        </div>
      </SoloBeatStage>
    </div>
  );
};
