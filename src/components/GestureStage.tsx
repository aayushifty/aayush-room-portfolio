import React, { useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpRight, Check, Copy } from 'lucide-react';
import {
  BEYOND_PILLARS,
  CREDENTIALS,
  DISCIPLINES,
  PROFILE,
  PROJECTS,
  SOCIAL_PROFILES,
  type CredentialItem,
  type ProjectItem,
} from '@/data/portfolio';
import { beatDataAttrs, span, type Gesture } from '@/lib/scrollBeats';

export interface GestureStageProps {
  onSelectProject: (item: ProjectItem) => void;
  onSelectCredential: (item: CredentialItem) => void;
  onBackToTop: () => void;
}

/**
 * Where a block sits. `side` anchors are in video-frame units so text tracks the footage:
 * u = horizontal distance from frame centre (0.29 ≈ just past a fingertip at 75% / 25%),
 * v = vertical position (0 top, 1 bottom) of the block's centre.
 */
type Place =
  | { kind: 'low' }
  | { kind: 'side'; side: 'left' | 'right'; u: number; v: number };

/** How a block appears, in place: plain fade, focus pull, directional wipe, or dot formation. */
type Fx = 'fade' | 'focus' | 'wipe' | 'dots';

interface BeatProps {
  t0: number;
  t1: number;
  fx: Fx;
  gesture: Gesture;
  place: Place;
  holdStart?: boolean;
  holdEnd?: boolean;
  id?: string;
  children: React.ReactNode;
}

const Beat: React.FC<BeatProps> = ({ t0, t1, fx, gesture, place, holdStart, holdEnd, id, children }) => {
  const align = place.kind === 'side' ? place.side : 'bottom';
  const anchorStyle =
    place.kind === 'side'
      ? ({ '--u': place.u, '--v': place.v } as React.CSSProperties)
      : undefined;

  return (
    <section
      id={id}
      className="gs-beat"
      data-fx={fx}
      data-align={align}
      data-act={Math.min(2, Math.floor(t0 / 10))}
      {...beatDataAttrs(span(t0, t1, { gesture, holdStart, holdEnd }))}
    >
      <div
        className={`gs-anchor gs-${place.kind}`}
        data-side={place.kind === 'side' ? place.side : undefined}
        style={anchorStyle}
      >
        <div
          data-beat-stage="true"
          className="cinema-flank-container pointer-events-auto"
        >
          {children}
        </div>
      </div>
    </section>
  );
};

/** Headline with the accented part wrapped in pipes, e.g. "Beyond the |screen|". */
const Title: React.FC<{ text: string }> = ({ text }) => (
  <>
    {text.split('|').map((segment, s) =>
      s % 2 ? (
        <strong key={s} className="gs-accent">
          {segment}
        </strong>
      ) : (
        <React.Fragment key={s}>{segment}</React.Fragment>
      )
    )}
  </>
);

interface Tip {
  /** fingertip track in lib/fingertips.ts */
  track: string;
  /** which way the finger points: decides which side of it the block sits */
  dir: 'left' | 'right' | 'up';
  node: React.ReactNode;
}

/** A beat whose blocks are pinned to tracked fingertips (one per pointing hand). */
const TipBeat: React.FC<{
  /** hand starts to rise / finger reaches its hold / hand starts to lower / hand is down */
  t0: number;
  rise: number;
  lower: number;
  t1: number;
  fx: Fx;
  gesture: Gesture;
  tips: Tip[];
}> = ({ t0, rise, lower, t1, fx, gesture, tips }) => (
  <section
    className="gs-beat"
    data-fx={fx}
    data-tips="true"
    data-act={Math.min(2, Math.floor(t0 / 10))}
    {...beatDataAttrs(span(t0, t1, { gesture, formed: rise, fading: lower }))}
  >
    {tips.map((tip) => (
      <React.Fragment key={tip.track}>
        <div className="gs-anchor gs-tip" data-tip={tip.track} data-dir={tip.dir}>
          <div data-beat-stage="true" className="cinema-flank-container pointer-events-auto">
            {tip.node}
          </div>
        </div>
        <i className="gs-spark" aria-hidden="true" />
      </React.Fragment>
    ))}
  </section>
);

interface ItemProps {
  kicker: string;
  title: string;
  line: string;
  onOpen: () => void;
}

const Item: React.FC<ItemProps> = ({ kicker, title, line, onOpen }) => (
  <article>
    <p className="cinema-kicker">{kicker}</p>
    <h3 className="cinema-display-title cinema-scene-title mt-1.5">
      <Title text={title} />
    </h3>
    <div className="cinema-accent-beam mt-3 w-16" aria-hidden="true" />
    <p className="cinema-subtitle mt-3 text-sm sm:text-[0.95rem]">{line}</p>
    <button type="button" className="cinema-link-action gs-link mt-1.5" onClick={onOpen}>
      Open the full story <ArrowUpRight size={14} aria-hidden="true" />
    </button>
  </article>
);

const project = (id: string): ProjectItem => PROJECTS.find((p) => p.id === id) ?? PROJECTS[0];
const credential = (id: string): CredentialItem =>
  CREDENTIALS.find((c) => c.id === id) ?? CREDENTIALS[0];

/** Short display names: the full titles live in the dossier, these have to fit beside a hand */
const SHORT: Record<string, string> = {
  jarvis: 'JARVIS v4',
  'forge-city': 'FORGE City',
  handchord: 'HandChord',
  offlinepay: 'OfflinePay',
  'ar-linkedin-suite': 'Henshin FX',
  'trinity-teaching': 'Trinity Teaching',
  'ullens-room': 'Ullens Idea Lab',
  'nyc-mun-2023': 'UN Delegate, Switzerland',
  'mun-13-record': '13 MUNs · 6× Best Delegate',
  'nimhans-cbt': 'CBT Certified',
  'school-captain': 'School Captain ×2',
  'national-hackathons': 'Hackathon Winner & Finalist',
  'mahakumbha-2022': 'MahaKumbha Nationals',
  'trinity-science': 'Grade 12 Science',
};
const short = (id: string, fallback: string): string => SHORT[id] ?? fallback;

export const GestureStage: React.FC<GestureStageProps> = ({
  onSelectProject,
  onSelectCredential,
  onBackToTop,
}) => {
  const [copied, setCopied] = useState(false);

  const copyEmail = (): void => {
    void navigator.clipboard?.writeText(PROFILE.email).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    });
  };

  const projectItem = (id: string) => {
    const p = project(id);
    return (
      <Item
        kicker={`${p.category} · ${p.year}`}
        title={short(p.id, p.title)}
        line={p.subtitle}
        onOpen={() => onSelectProject(p)}
      />
    );
  };

  const credentialItem = (id: string) => {
    const c = credential(id);
    return (
      <Item
        kicker={`${c.category} · ${c.year}`}
        title={short(c.id, c.title)}
        line={c.issuer}
        onOpen={() => onSelectCredential(c)}
      />
    );
  };

  const discipline = (i: number, text: 'start' | 'end') => {
    const d = DISCIPLINES[i];
    return (
      <article data-text={text}>
        <h3 className="cinema-display-title cinema-scene-title mt-1.5">
          <Title text={d.title} />
        </h3>
        <div className="cinema-accent-beam mt-3 w-16" aria-hidden="true" />
        <p className="cinema-subtitle mt-3 text-sm sm:text-base">{d.tagline}</p>
      </article>
    );
  };

  return (
    <>
      {/* ───────── 0–10s · studio · grey hoodie ───────── */}

      {/* 0.0–1.7s: he waves at the camera — the greeting is the subtitle to that wave */}
      <Beat id="act-studio" t0={0} fx="fade" t1={1.75} gesture="wave" place={{ kind: 'low' }} holdStart>
        <p className="cinema-kicker">{PROFILE.location}</p>
        <h1 className="cinema-display-title cinema-hero-title mt-2">
          <Title text="Hi, I’m |Aayush.|" />
        </h1>
        <p className="cinema-subtitle mx-auto mt-3 text-sm sm:text-base">
          I build software that sees, listens and gets things done.
        </p>
        <p className="gs-cue mt-5" aria-live="polite">
          <span className="gs-cue-loading">Loading the reel…</span>
          <span className="gs-cue-ready">
            Scroll to begin <ArrowDown size={13} aria-hidden="true" />
          </span>
        </p>
      </Beat>

      {/* 2.0–3.4s: he turns to profile, facing screen-right — the line sits where he looks */}
      <Beat t0={1.95} fx="focus" t1={3.4} gesture="turn" place={{ kind: 'side', side: 'right', u: 0.16, v: 0.47 }}>
        <article data-text="start">
          <p className="cinema-kicker">
            {PROFILE.fullName} · {PROFILE.handle}
          </p>
          <h2 className="cinema-display-title cinema-scene-title mt-1.5">
            <Title text="Engineering |living| software" />
          </h2>
          <div className="cinema-accent-beam mt-3 w-16" aria-hidden="true" />
          <p className="cinema-subtitle mt-3 text-sm sm:text-base">
            Systems that plan, perceive and act on their own, built in Kathmandu.
          </p>
        </article>
      </Beat>

      {/* 3.6–4.9s: back to camera, the workstation is in view */}
      <Beat t0={3.6} fx="wipe" t1={4.9} gesture="turn" place={{ kind: 'side', side: 'left', u: 0.16, v: 0.5 }}>
        {discipline(0, 'end')}
      </Beat>

      {/* 5.05–6.3s: coming back round */}
      <Beat t0={5.05} fx="dots" t1={6.3} gesture="turn" place={{ kind: 'side', side: 'right', u: 0.17, v: 0.5 }}>
        {discipline(1, 'start')}
      </Beat>

      {/* 6.6–9.75s: facing camera, lights dim — two calm beats either side of him */}
      <Beat t0={6.6} fx="focus" t1={8.1} gesture="calm" place={{ kind: 'side', side: 'left', u: 0.17, v: 0.5 }}>
        {discipline(2, 'end')}
      </Beat>
      <Beat t0={8.3} fx="wipe" t1={9.75} gesture="calm" place={{ kind: 'side', side: 'right', u: 0.17, v: 0.5 }}>
        {discipline(3, 'start')}
      </Beat>

      {/* ───────── 10–20s · glass office · pink tee ───────── */}

      <Beat id="act-works" t0={10.25} fx="focus" t1={10.9} gesture="calm" place={{ kind: 'low' }}>
        <p className="cinema-kicker">Selected work</p>
        <h2 className="cinema-display-title cinema-hero-title mt-2">
          <Title text="Things I’ve |built|" />
        </h2>
      </Beat>

      {/* 11.0–12.45s: points screen-right, fingertip ≈ (75%, 48%) */}
      <TipBeat t0={11} fx="wipe" rise={11.5} lower={12.25} t1={12.6} gesture="point-right" tips={[{ track: 'office-right', dir: 'right', node: projectItem('jarvis') }]} />

      {/* 12.95–13.95s: points screen-left, fingertip ≈ (31%, 60%) */}
      <TipBeat t0={12.9} fx="dots" rise={13.25} lower={13.75} t1={14.05} gesture="point-left" tips={[{ track: 'office-left', dir: 'left', node: projectItem('forge-city') }]} />

      {/* 14.4–15.85s: both index fingers out to the sides — two builds at once */}
      <TipBeat
        t0={14.45} fx="focus"
        rise={15}
        lower={15.75}
        t1={16.05}
        gesture="both"
        tips={[
          { track: 'office-both-l', dir: 'left', node: projectItem('handchord') },
          { track: 'office-both-r', dir: 'right', node: projectItem('offlinepay') },
        ]}
      />

      {/* 16.4–17.8s: looks and points up-right, fingertip ≈ (75%, 22%) */}
      <TipBeat t0={16.5} fx="wipe" rise={17} lower={17.75} t1={18.05} gesture="point-up" tips={[{ track: 'office-up', dir: 'up', node: projectItem('ar-linkedin-suite') }]} />

      {/* 18.1–19.8s: hands down, calm — the full index */}
      <Beat t0={18.1} fx="fade" t1={19.8} gesture="calm" place={{ kind: 'low' }}>
        <p className="cinema-kicker">The full index</p>
        <h2 className="cinema-display-title cinema-scene-title mt-2">
          <Title text={`${PROJECTS.length} builds, |all shipped|`} />
        </h2>
        <p className="gs-row mt-4">
          {PROJECTS.map((p) => (
            <button key={p.id} type="button" className="cinema-link-action gs-link" onClick={() => onSelectProject(p)}>
              {short(p.id, p.title)}
            </button>
          ))}
        </p>
      </Beat>

      {/* ───────── 20–30s · night lab · navy jacket ───────── */}

      <Beat id="act-credentials" t0={20.3} fx="dots" t1={20.9} gesture="calm" place={{ kind: 'low' }}>
        <p className="cinema-kicker">Away from the keyboard</p>
        <h2 className="cinema-display-title cinema-hero-title mt-2">
          <Title text="Honors & |diplomacy|" />
        </h2>
      </Beat>

      {/* 21.0–22.35s: points screen-right, fingertip ≈ (73%, 60%) */}
      <TipBeat t0={21} fx="focus" rise={21.5} lower={22} t1={22.35} gesture="point-right" tips={[{ track: 'lab-right', dir: 'right', node: credentialItem('nyc-mun-2023') }]} />

      {/* 22.9–23.9s: points screen-left, fingertip ≈ (31%, 65%) */}
      <TipBeat t0={22.7} fx="wipe" rise={23} lower={23.75} t1={24.05} gesture="point-left" tips={[{ track: 'lab-left', dir: 'left', node: credentialItem('mun-13-record') }]} />

      {/* 24.4–25.4s: both fingers out */}
      <TipBeat
        t0={24.45} fx="dots"
        rise={25}
        lower={25.25}
        t1={25.6}
        gesture="both"
        tips={[
          { track: 'lab-both-l', dir: 'left', node: credentialItem('nimhans-cbt') },
          { track: 'lab-both-r', dir: 'right', node: credentialItem('school-captain') },
        ]}
      />

      {/* 25.9–26.9s: points up-right, fingertip ≈ (74%, 30%) */}
      <TipBeat t0={25.75} fx="fade" rise={26.25} lower={26.75} t1={27.05} gesture="point-up" tips={[{ track: 'lab-up', dir: 'up', node: credentialItem('national-hackathons') }]} />

      {/* 27.2–28.4s: calm — life off-screen and the full honors index */}
      <Beat t0={27.2} fx="wipe" t1={28.4} gesture="calm" place={{ kind: 'low' }}>
        <p className="cinema-kicker">{BEYOND_PILLARS.map((b) => b.title.split(/[,&]/)[0].trim()).join(' · ')}</p>
        <h2 className="cinema-display-title cinema-scene-title mt-2">
          <Title text="Beyond the |screen|" />
        </h2>
        <p className="gs-row mt-4">
          {CREDENTIALS.map((c) => (
            <button key={c.id} type="button" className="cinema-link-action gs-link" onClick={() => onSelectCredential(c)}>
              {short(c.id, c.title)}
            </button>
          ))}
        </p>
      </Beat>

      {/* 28.6–30s: final still frame — contact holds to the end */}
      <Beat id="section-contact" t0={28.6} fx="focus" t1={30} gesture="calm" place={{ kind: 'low' }} holdEnd>
        <p className="cinema-kicker">Direct contact</p>
        <h2 className="cinema-display-title cinema-hero-title mt-2">
          <Title text="Let’s build something |unforgettable|" />
        </h2>
        <p className="gs-row mt-4">
          <a className="cinema-link-action gs-link gs-link-strong" href={`mailto:${PROFILE.email}`}>
            {PROFILE.email}
          </a>
          <button type="button" className="cinema-link-action gs-link" onClick={copyEmail}>
            {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
            {copied ? 'Copied' : 'Copy email'}
          </button>
        </p>
        <p className="gs-row mt-1">
          {SOCIAL_PROFILES.map((s) => (
            <a key={s.label} className="cinema-link-action gs-link" href={s.href} target="_blank" rel="noreferrer">
              {s.label} <ArrowUpRight size={13} aria-hidden="true" />
            </a>
          ))}
        </p>
        <p className="gs-row mt-1">
          <button type="button" className="cinema-link-action gs-link" onClick={onBackToTop}>
            <ArrowUp size={13} aria-hidden="true" /> Back to top
          </button>
        </p>
      </Beat>
    </>
  );
};
