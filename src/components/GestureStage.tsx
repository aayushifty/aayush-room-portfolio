import React, { useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpRight, Check, Copy, RotateCcw } from 'lucide-react';
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
  onReplayFromStart: () => void;
  onBackToTop: () => void;
}

/**
 * Where a block sits. `side` anchors are in video-frame units so text tracks the footage:
 * u = horizontal distance from frame centre (0.29 ≈ just past a fingertip at 75% / 25%),
 * v = vertical position (0 top, 1 bottom) of the block's centre.
 */
type Place =
  | { kind: 'low' }
  | { kind: 'split' }
  | { kind: 'side'; side: 'left' | 'right'; u: number; v: number; trace?: boolean };

interface BeatProps {
  t0: number;
  t1: number;
  gesture: Gesture;
  place: Place;
  holdStart?: boolean;
  holdEnd?: boolean;
  id?: string;
  children: React.ReactNode;
}

const Beat: React.FC<BeatProps> = ({ t0, t1, gesture, place, holdStart, holdEnd, id, children }) => {
  const align =
    place.kind === 'side' ? place.side : place.kind === 'split' ? 'split' : 'bottom';
  const anchorStyle =
    place.kind === 'side'
      ? ({ '--u': place.u, '--v': place.v } as React.CSSProperties)
      : undefined;

  return (
    <section
      id={id}
      className="gs-beat"
      data-align={align}
      data-act={Math.min(2, Math.floor(t0 / 10))}
      {...beatDataAttrs(span(t0, t1, { gesture, holdStart, holdEnd }))}
    >
      <div
        className={`gs-anchor gs-${place.kind}`}
        data-side={place.kind === 'side' ? place.side : undefined}
        data-trace={place.kind === 'side' && place.trace ? 'true' : undefined}
        style={anchorStyle}
      >
        <div
          data-beat-stage="true"
          className={
            place.kind === 'split'
              ? 'pointer-events-auto'
              : 'cinema-flank-container pointer-events-auto'
          }
        >
          {children}
        </div>
      </div>
    </section>
  );
};

const Accent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <strong className="gs-accent">{children}</strong>
);

interface ItemProps {
  index: string;
  kicker: string;
  title: string;
  line: string;
  metric?: string;
  /** 'end' right-aligns the block so it finishes at the fingertip pointing left */
  text: 'start' | 'end';
  onOpen: () => void;
  contained?: boolean;
}

const Item: React.FC<ItemProps> = ({ index, kicker, title, line, metric, text, onOpen, contained }) => (
  <article data-text={text} className={contained ? 'cinema-flank-container' : undefined}>
    <span className="gs-index" aria-hidden="true">
      {index}
    </span>
    <p className="cinema-kicker">{kicker}</p>
    <h3 className="cinema-display-title cinema-scene-title mt-1.5">{title}</h3>
    <div className="cinema-accent-beam mt-3 w-16" aria-hidden="true" />
    <p className="cinema-subtitle mt-3 text-sm sm:text-[0.95rem]">{line}</p>
    {metric ? <p className="gs-metric mt-2">{metric}</p> : null}
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
  'national-hackathons': 'Hackathon Finalist',
  'mahakumbha-2022': 'MahaKumbha Nationals',
  'trinity-science': 'Grade 12 Science',
};
const short = (id: string, fallback: string): string => SHORT[id] ?? fallback;

export const GestureStage: React.FC<GestureStageProps> = ({
  onSelectProject,
  onSelectCredential,
  onReplayFromStart,
  onBackToTop,
}) => {
  const [copied, setCopied] = useState(false);

  const copyEmail = (): void => {
    void navigator.clipboard?.writeText(PROFILE.email).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    });
  };

  const projectItem = (id: string, index: string, text: 'start' | 'end', contained = false) => {
    const p = project(id);
    return (
      <Item
        index={index}
        kicker={`${p.category} · ${p.year}`}
        title={short(p.id, p.title)}
        line={p.subtitle}
        metric={p.highlightMetric}
        text={text}
        contained={contained}
        onOpen={() => onSelectProject(p)}
      />
    );
  };

  const credentialItem = (id: string, index: string, text: 'start' | 'end', contained = false) => {
    const c = credential(id);
    return (
      <Item
        index={index}
        kicker={`${c.category} · ${c.year}`}
        title={short(c.id, c.title)}
        line={c.issuer}
        text={text}
        contained={contained}
        onOpen={() => onSelectCredential(c)}
      />
    );
  };

  const discipline = (i: number, text: 'start' | 'end') => {
    const d = DISCIPLINES[i];
    return (
      <article data-text={text}>
        <span className="gs-index" aria-hidden="true">
          {d.index}
        </span>
        <h3 className="cinema-display-title cinema-scene-title mt-1.5">{d.title}</h3>
        <div className="cinema-accent-beam mt-3 w-16" aria-hidden="true" />
        <p className="cinema-subtitle mt-3 text-sm sm:text-base">{d.tagline}</p>
      </article>
    );
  };

  return (
    <>
      {/* ───────── 0–10s · studio · grey hoodie ───────── */}

      {/* 0.0–1.7s: he waves at the camera — the greeting is the subtitle to that wave */}
      <Beat id="act-studio" t0={0} t1={1.75} gesture="wave" place={{ kind: 'low' }} holdStart>
        <p className="cinema-kicker">{PROFILE.location}</p>
        <h1 className="cinema-display-title cinema-hero-title mt-2">
          <span className="cinema-word-reveal">Hi,</span>{' '}
          <span className="cinema-word-reveal cinema-word-delay-1">I’m</span>{' '}
          <span className="cinema-word-reveal cinema-word-delay-2">
            <Accent>Aayush.</Accent>
          </span>
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
      <Beat t0={1.95} t1={3.4} gesture="turn" place={{ kind: 'side', side: 'right', u: 0.16, v: 0.47 }}>
        <article data-text="start">
          <p className="cinema-kicker">
            {PROFILE.fullName} · {PROFILE.handle}
          </p>
          <h2 className="cinema-display-title cinema-scene-title mt-1.5">
            Engineering <Accent>living</Accent> software
          </h2>
          <div className="cinema-accent-beam mt-3 w-16" aria-hidden="true" />
          <p className="cinema-subtitle mt-3 text-sm sm:text-base">
            Systems that plan, perceive and act on their own, built in Kathmandu.
          </p>
        </article>
      </Beat>

      {/* 3.6–4.9s: back to camera, the workstation is in view */}
      <Beat t0={3.6} t1={4.9} gesture="turn" place={{ kind: 'side', side: 'left', u: 0.16, v: 0.5 }}>
        {discipline(0, 'end')}
      </Beat>

      {/* 5.05–6.3s: coming back round */}
      <Beat t0={5.05} t1={6.3} gesture="turn" place={{ kind: 'side', side: 'right', u: 0.17, v: 0.5 }}>
        {discipline(1, 'start')}
      </Beat>

      {/* 6.6–9.75s: facing camera, lights dim — two calm beats either side of him */}
      <Beat t0={6.6} t1={8.1} gesture="calm" place={{ kind: 'side', side: 'left', u: 0.17, v: 0.5 }}>
        {discipline(2, 'end')}
      </Beat>
      <Beat t0={8.3} t1={9.75} gesture="calm" place={{ kind: 'side', side: 'right', u: 0.17, v: 0.5 }}>
        {discipline(3, 'start')}
      </Beat>

      {/* ───────── 10–20s · glass office · pink tee ───────── */}

      <Beat id="act-works" t0={10.25} t1={10.9} gesture="calm" place={{ kind: 'low' }}>
        <p className="cinema-kicker">Selected work</p>
        <h2 className="cinema-display-title cinema-hero-title mt-2">
          Things I’ve <Accent>built</Accent>
        </h2>
      </Beat>

      {/* 11.0–12.45s: points screen-right, fingertip ≈ (75%, 48%) */}
      <Beat t0={11.0} t1={12.45} gesture="point-right" place={{ kind: 'side', side: 'right', u: 0.29, v: 0.47, trace: true }}>
        {projectItem('jarvis', '01', 'start')}
      </Beat>

      {/* 12.95–13.95s: points screen-left, fingertip ≈ (31%, 60%) */}
      <Beat t0={12.95} t1={13.95} gesture="point-left" place={{ kind: 'side', side: 'left', u: 0.235, v: 0.58, trace: true }}>
        {projectItem('forge-city', '02', 'end')}
      </Beat>

      {/* 14.4–15.85s: both index fingers out to the sides — two builds at once */}
      <Beat t0={14.4} t1={15.85} gesture="both" place={{ kind: 'split' }}>
        {projectItem('handchord', '03', 'start', true)}
        {projectItem('offlinepay', '04', 'end', true)}
      </Beat>

      {/* 16.4–17.8s: looks and points up-right, fingertip ≈ (75%, 22%) */}
      <Beat t0={16.4} t1={17.8} gesture="point-up" place={{ kind: 'side', side: 'right', u: 0.305, v: 0.46 }}>
        {projectItem('ar-linkedin-suite', '05', 'start')}
      </Beat>

      {/* 18.1–19.8s: hands down, calm — the full index */}
      <Beat t0={18.1} t1={19.8} gesture="calm" place={{ kind: 'low' }}>
        <p className="cinema-kicker">The full index</p>
        <h2 className="cinema-display-title cinema-scene-title mt-2">
          {PROJECTS.length} builds, <Accent>all shipped</Accent>
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

      <Beat id="act-credentials" t0={20.3} t1={20.9} gesture="calm" place={{ kind: 'low' }}>
        <p className="cinema-kicker">Away from the keyboard</p>
        <h2 className="cinema-display-title cinema-hero-title mt-2">
          Honors &amp; <Accent>diplomacy</Accent>
        </h2>
      </Beat>

      {/* 21.0–22.35s: points screen-right, fingertip ≈ (73%, 60%) */}
      <Beat t0={21.0} t1={22.35} gesture="point-right" place={{ kind: 'side', side: 'right', u: 0.28, v: 0.56, trace: true }}>
        {credentialItem('nyc-mun-2023', '01', 'start')}
      </Beat>

      {/* 22.9–23.9s: points screen-left, fingertip ≈ (31%, 65%) */}
      <Beat t0={22.9} t1={23.9} gesture="point-left" place={{ kind: 'side', side: 'left', u: 0.235, v: 0.62, trace: true }}>
        {credentialItem('mun-13-record', '02', 'end')}
      </Beat>

      {/* 24.4–25.4s: both fingers out */}
      <Beat t0={24.4} t1={25.4} gesture="both" place={{ kind: 'split' }}>
        {credentialItem('nimhans-cbt', '03', 'start', true)}
        {credentialItem('school-captain', '04', 'end', true)}
      </Beat>

      {/* 25.9–26.9s: points up-right, fingertip ≈ (74%, 30%) */}
      <Beat t0={25.9} t1={26.9} gesture="point-up" place={{ kind: 'side', side: 'right', u: 0.315, v: 0.52 }}>
        {credentialItem('national-hackathons', '05', 'start')}
      </Beat>

      {/* 27.2–28.4s: calm — life off-screen and the full honors index */}
      <Beat t0={27.2} t1={28.4} gesture="calm" place={{ kind: 'low' }}>
        <p className="cinema-kicker">{BEYOND_PILLARS.map((b) => b.title.split(/[,&]/)[0].trim()).join(' · ')}</p>
        <h2 className="cinema-display-title cinema-scene-title mt-2">
          Beyond the <Accent>screen</Accent>
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
      <Beat id="section-contact" t0={28.6} t1={30} gesture="calm" place={{ kind: 'low' }} holdEnd>
        <p className="cinema-kicker">Direct contact</p>
        <h2 className="cinema-display-title cinema-hero-title mt-2">
          Let’s build something <Accent>unforgettable</Accent>
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
          <button type="button" className="cinema-link-action gs-link" onClick={onReplayFromStart}>
            <RotateCcw size={13} aria-hidden="true" /> Replay with sound
          </button>
          <button type="button" className="cinema-link-action gs-link" onClick={onBackToTop}>
            <ArrowUp size={13} aria-hidden="true" /> Back to top
          </button>
        </p>
      </Beat>
    </>
  );
};
