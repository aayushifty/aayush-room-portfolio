export type ActId = 'studio' | 'penthouse' | 'lab';

export interface CinemaClipConfig {
  id: ActId;
  clipIndex: 0 | 1 | 2;
  actRoman: string;
  label: string;
  sceneTitle: string;
  subtitle: string;
  frameDir: string;
  frameCount: number;
  accentHex: string;
  accentSoft: string;
}

export interface Discipline {
  id: string;
  index: string;
  title: string;
  tagline: string;
  summary: string;
  iconName: 'cpu' | 'eye' | 'circuit' | 'mic';
}

export interface AiPracticePillar {
  id: string;
  label: string;
  summary: string;
}

export interface ProjectItem {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: 'Local Systems' | 'Computer Vision' | 'IoT & Mobile' | 'Spatial Web';
  year: string;
  highlightMetric: string;
  summary: string;
  architectureNotes: string[];
  githubUrl?: string;
  liveUrl?: string;
  accent: 'amber' | 'cyan' | 'silver';
}

export interface CredentialItem {
  id: string;
  category: 'Certifications' | 'MUN & Debate' | 'Hackathons & Leadership';
  title: string;
  issuer: string;
  year: string;
  badge: string;
  summary: string;
  details: string[];
  signatories?: string;
}

export interface BeyondPillar {
  id: string;
  title: string;
  metric: string;
  description: string;
}

export interface SocialProfile {
  label: string;
  handle: string;
  href: string;
  kind: 'github' | 'linkedin' | 'instagram' | 'tiktok' | 'dev' | 'globe' | 'mail';
}

export const PROFILE = {
  fullName: 'Aayush Bhatta',
  handle: '@aayushifty',
  instagramHandle: '@aayushshshhshifty',
  location: 'Kathmandu, Nepal',
  academic: 'Grade 12 Science · Trinity International College',
  academicTrack: 'Physics, Mathematics, Chemistry & Computer Science',
  headline: 'Architecting autonomous software, local intelligence, and interactive systems',
  email: 'aayushbhatta230@gmail.com',
  avatarUrl: '/meta/avatar-square.png',
  portfolio3dUrl: 'https://aayushifty.is-a.dev/',
  leadBio:
    'I build autonomous agent systems, local-first software, and real-time vision instruments out of Kathmandu — balanced by national parliamentary debate, 13 MUN conferences, competitive basketball, and guitar.',
  facts: [
    { label: 'Role', value: 'AI Developer (@aayushifty)' },
    { label: 'Focus', value: 'Autonomous Agents · Multimodal · Vision' },
    { label: 'Location', value: 'Kathmandu, Nepal' },
    { label: 'Education', value: 'Grade 12 Science · Trinity Int’l' },
  ],
} as const;

export const CINEMA_CLIPS: CinemaClipConfig[] = [
  {
    id: 'studio',
    clipIndex: 0,
    actRoman: 'ACT I',
    label: 'The Studio Turntable',
    sceneTitle: 'Identity & Craft',
    subtitle: 'Autonomous software, multimodal perception & applied intelligence.',
    frameDir: '/frames/clip1',
    frameCount: 240,
    accentHex: '#e2e8f0',
    accentSoft: 'rgba(226, 232, 240, 0.22)',
  },
  {
    id: 'penthouse',
    clipIndex: 1,
    actRoman: 'ACT II',
    label: 'The Glass Office',
    sceneTitle: 'Selected Systems',
    subtitle: 'Autonomous companions, multi-agent swarms, computer vision & offline software.',
    frameDir: '/frames/clip2',
    frameCount: 240,
    accentHex: '#f59e0b',
    accentSoft: 'rgba(245, 158, 11, 0.25)',
  },
  {
    id: 'lab',
    clipIndex: 2,
    actRoman: 'ACT III',
    label: 'Credentials & Horizon',
    sceneTitle: 'Credentials & Horizon',
    subtitle: 'Certifications, diplomacy, leadership, athletics & direct transmission.',
    frameDir: '/frames/clip3',
    frameCount: 240,
    accentHex: '#2dd4bf',
    accentSoft: 'rgba(45, 212, 191, 0.25)',
  },
];

export const AI_PRACTICE_PILLARS: AiPracticePillar[] = [
  {
    id: 'agents',
    label: 'Autonomous Agents',
    summary:
      'Self-directed plan → act → verify reasoning loops, tool-calling companions, and long-horizon semantic memory running locally.',
  },
  {
    id: 'multimodal',
    label: 'Multimodal & Vision',
    summary:
      'Voice-first interaction, 21-point hand and gesture recognition, and live visual scene intelligence responding in real time.',
  },
  {
    id: 'swarms',
    label: 'Multi-Agent Swarms',
    summary:
      'Coordinated specialist personas, adversarial critic agents, and automated verification gates that validate every build.',
  },
];

export const DISCIPLINES: Discipline[] = [
  {
    id: 'local-ai',
    index: '01',
    title: 'Autonomous & Agentic Systems',
    tagline: 'Intelligence that plans, verifies, and acts on your machine.',
    summary:
      'Architecting privacy-first assistants, multi-agent workflows, and self-evaluating reasoning engines that handle complex tasks without relying on external cloud servers.',
    iconName: 'cpu',
  },
  {
    id: 'vision-spatial',
    index: '02',
    title: 'Computer Vision & Perception',
    tagline: 'Real-time visual perception fused with interactive worlds.',
    summary:
      'Transforming camera feeds and hand landmarks into touchless musical instruments, live video-call visual effects, and responsive 3D interactive spaces.',
    iconName: 'eye',
  },
  {
    id: 'embedded-iot',
    index: '03',
    title: 'Offline-First Applied Systems',
    tagline: 'Resilient software and hardware built for real-world constraints.',
    summary:
      'Engineering zero-connectivity cryptographic wallets, offline classroom ecosystems, and intelligent hardware prototypes that keep working when networks fail.',
    iconName: 'circuit',
  },
  {
    id: 'expression-leadership',
    index: '04',
    title: 'Diplomacy, Athletics & Music',
    tagline: 'Precision under pressure beyond the code.',
    summary:
      'Representing nations in UN simulations, competing in national parliamentary debate, leading as two-term School Captain, training high-altitude trails, and performing guitar.',
    iconName: 'mic',
  },
];

export const PROJECTS: ProjectItem[] = [
  {
    id: 'jarvis',
    slug: 'jarvis-v4',
    title: 'JARVIS v4',
    subtitle: 'Autonomous Local Desktop & Voice Companion',
    category: 'Local Systems',
    year: '2026',
    highlightMetric: '88 Capabilities · Semantic Memory Engine',
    summary:
      'A privacy-first desktop companion engineered around a holographic interface, voice-first perception, and an autonomous plan → act → verify reasoning loop that executes real desktop workflows locally.',
    architectureNotes: [
      '88 integrated execution capabilities spanning desktop automation, media orchestration, research synthesis, scheduling, and workspace code intelligence.',
      'Semantic long-term vector memory paired with a continuous self-evaluation reflection loop that scores and improves reasoning quality.',
      'Encrypted remote mobile-to-desktop voice relay for commanding the local desktop companion from anywhere.',
    ],
    githubUrl: 'https://github.com/aayushbhatta230-ux/jarvis-ai-agent',
    accent: 'amber',
  },
  {
    id: 'forge-city',
    slug: 'forge-city-ai',
    title: 'FORGE AI · City AI Metropolis',
    subtitle: 'Autonomous 3D Multi-Agent Software Factory',
    category: 'Local Systems',
    year: '2026',
    highlightMetric: '10 Collaborating Personas · Verified Output Gate',
    summary:
      'An explorable 3D metropolis inhabited by 10 specialized agent citizens that collaborate across structured workflows to architect, implement, audit, and verify complete software builds.',
    architectureNotes: [
      'Smart local model residency scheduling to keep multi-agent inference responsive on consumer desktop GPUs.',
      'Autonomous engineering workforce covering Architecture, Implementation, Security Auditing, Test Engineering, SRE, and Product Vision.',
      'Isolated workspace execution, emergency override controls, and strict verification gates before task completion.',
    ],
    githubUrl: 'https://github.com/aayushbhatta230-ux/city-ai-aayushifty',
    accent: 'amber',
  },
  {
    id: 'offlinepay',
    slug: 'offlinepay-sdk',
    title: 'OfflinePay SDK',
    subtitle: 'Zero-Connectivity Cryptographic Digital Wallet',
    category: 'IoT & Mobile',
    year: '2026',
    highlightMetric: 'Offline QR Signing · Cross-Device Peer Settlement',
    summary:
      'An offline digital payment protocol empowering everyday wallets to settle peer-to-peer transactions via cryptographically signed QR proofs during mountain transit or complete blackouts.',
    architectureNotes: [
      'Pre-provisioned asymmetric signing keys and offline vault certificates enable instant mutual transaction verification without cellular signal.',
      'Cross-device mobile web and Android compatibility letting peers exchange value seamlessly between any handheld devices.',
      'Deferred settlement sync with automatic duplicate-spend conflict resolution once connectivity returns.',
    ],
    githubUrl: 'https://github.com/aayushifty/offlinepay',
    liveUrl: 'https://aayushifty.github.io/offlinepay/',
    accent: 'amber',
  },
  {
    id: 'handchord',
    slug: 'handchord-cv',
    title: 'HandChord',
    subtitle: 'Contactless Vision Acoustic Instrument',
    category: 'Computer Vision',
    year: '2025',
    highlightMetric: '<30ms Response · 21-Point Landmark Tracking',
    summary:
      'Turns any standard webcam into an expressive polyphonic guitar & chord instrument in the browser — tracking 21 distinct hand landmarks in real time with zero external hardware.',
    architectureNotes: [
      'Real-time computer vision hand-tracking pipeline tuned for sub-30ms gesture-to-audio synthesis.',
      'Dynamic harmonic synthesis translating finger elevation, fret shapes, and strumming velocity into live chords and arpeggios.',
      'Instant browser deployment requiring zero software installation or wearable sensors.',
    ],
    githubUrl: 'https://github.com/aayushbhatta230-ux/handchord',
    liveUrl: 'https://handchord.vercel.app/',
    accent: 'cyan',
  },
  {
    id: 'trinity-teaching',
    slug: 'trinity-teaching',
    title: 'Trinity Teaching Suite',
    subtitle: 'Offline-First Classroom & Smartboard Ecosystem',
    category: 'IoT & Mobile',
    year: '2026',
    highlightMetric: 'Desktop + Mobile Delivery · Instant Offline Cache',
    summary:
      'Cross-platform lecture delivery and interactive classroom smartboard platform built for Trinity International College, engineered for 100% offline reliability during instruction.',
    architectureNotes: [
      'Standalone desktop and mobile packages preserving educator slide state seamlessly across background updates.',
      'High-contrast smartboard touch gestures, rapid lesson search, and locally cached lecture decks.',
    ],
    githubUrl: 'https://github.com/aayushbhatta230-ux/trinity-teaching',
    accent: 'silver',
  },
  {
    id: 'ar-linkedin-suite',
    slug: 'henshin-thanos-linkedin',
    title: 'Henshin · Thanos Snap · LinkedIn Agent',
    subtitle: 'Vision Call AR & Autonomous Local Publisher',
    category: 'Computer Vision',
    year: '2026',
    highlightMetric: 'Live Call Vision FX + Multimodal Content Engine',
    summary:
      'Combines real-time video-call computer vision effects (hand-snap particle disintegration & instant AR transformations) with an autonomous multimodal publishing desk that analyzes repositories and drafts posts locally.',
    architectureNotes: [
      'Vision FX hooks directly into live browser video calls using hand gesture detection and real-time background segmentation.',
      'Autonomous publisher inspects codebases, visual diagrams, and live demos locally to synthesize grounded technical posts with encrypted credential storage.',
    ],
    githubUrl: 'https://github.com/aayushifty/camera-window',
    accent: 'cyan',
  },
  {
    id: 'ullens-room',
    slug: 'ullens-and-3d-room',
    title: 'Ullens Idea Lab',
    subtitle: 'Adversarial Multi-Agent Research Swarm',
    category: 'Spatial Web',
    year: '2026',
    highlightMetric: 'Multi-Agent Strategy Debate · Adversarial Review',
    summary:
      'An adversarial multi-agent research swarm built for financial inclusion strategy and live hackathon simulation.',
    architectureNotes: [
      'Pairs specialist domain agents against an automated Devil’s Advocate critic streaming structured analysis in real time.',
      'Synthesizes cited briefs, risk trade-offs, and actionable policy recommendations through iterative structured rounds.',
    ],
    liveUrl: 'https://aayushifty.is-a.dev/',
    accent: 'silver',
  },
];

export const CREDENTIALS: CredentialItem[] = [
  {
    id: 'nimhans-cbt',
    category: 'Certifications',
    title: 'Skills & Application of Cognitive Behavioral Therapy (CBT)',
    issuer: 'NIMHANS Digital Academy',
    year: '2026',
    badge: 'Certified · 2026',
    summary:
      'Formal certification in evidence-based Cognitive Behavioral Therapy principles, cognitive reframing, structured behavioral analysis, and psychological resilience.',
    details: [
      'Completed curriculum through NIMHANS Digital Academy (National Institute of Mental Health and Neurosciences).',
      'Applies structured cognitive modeling and calm decision regulation to human-AI interaction design, competitive debate, and leadership.',
    ],
  },
  {
    id: 'nyc-mun-2023',
    category: 'MUN & Debate',
    title: 'Delegate of Switzerland — UNEP (NYC MUN 2023)',
    issuer: 'United Nations Nepal & National Youth Council Nepal',
    year: '2023',
    badge: 'UN Nepal Endorsed',
    summary:
      'Represented the Swiss Confederation in the United Nations Environment Programme (UNEP) at the National Youth Council Model United Nations 2023.',
    details: [
      'Drafted and defended climate policy, transboundary environmental frameworks, and multilateral resolution clauses.',
      'Awarded official UN Nepal & NYC credential.',
    ],
    signatories: 'Co-signed by Hon. Narayan Kaji Shrestha (Deputy Prime Minister) & Hanaa Singer-Hamdy (UN Resident Coordinator)',
  },
  {
    id: 'mahakumbha-2022',
    category: 'MUN & Debate',
    title: '9th MahaKumbha 2022 (Pre-Worlds National Championship)',
    issuer: 'Debate Network Nepal (DNN) & Brihaspati Vidhyasadan',
    year: '2022',
    badge: 'National Debater',
    summary:
      'Selected national competitor at Nepal’s flagship Pre-Worlds Parliamentary Schools Debating Championship.',
    details: [
      'Competed in rigorous World Schools and British Parliamentary motions covering geopolitics, economics, AI ethics, and constitutional law.',
      'Inspired the adversarial Devil’s Advocate critique architecture used in my multi-agent research swarms.',
    ],
  },
  {
    id: 'mun-13-record',
    category: 'MUN & Debate',
    title: '13 Model United Nations Conferences · 6× Best Delegate',
    issuer: 'National & Inter-School Assemblies (UNEP · DISEC · UNHRC)',
    year: '2022–2025',
    badge: '6× Best · 3× Outstanding',
    summary:
      'Consistent top diplomatic distinction across 13 Model United Nations assemblies, earning 6 Best Delegate gavels and 3 Outstanding Delegate honors.',
    details: [
      'Committees represented include UNEP, DISEC (Disarmament & International Security), and UNHRC.',
      'Honored for coalition building, procedural mastery, and incisive rebuttal delivery.',
    ],
  },
  {
    id: 'national-hackathons',
    category: 'Hackathons & Leadership',
    title: 'National Hackathon Finalist & Prototype Builder',
    issuer: 'BNKS · Build Nepal (ICES) · MBMC IdeaX · Ullens Idea Lab',
    year: '2024–2026',
    badge: '4 Major Hackathons',
    summary:
      'Rapid-prototyped autonomous agents and real-world software builds across Nepal’s premier student & engineering hackathons.',
    details: [
      'Ullens Idea Lab — Engineered a multi-agent financial inclusion swarm with automated adversarial review.',
      'MBMC IdeaX Challenge — Prototyped real-time sensor telemetry and geospatial analytics software.',
      'Budhanilkantha School (BNKS) National Hackathon & Build Nepal Hackathon (ICES).',
    ],
  },
  {
    id: 'school-captain',
    category: 'Hackathons & Leadership',
    title: 'Two-Term School Captain & Head Prefect',
    issuer: 'Baba School, Kathmandu',
    year: '2 Consecutive Terms',
    badge: 'Student Leadership',
    summary:
      'Elected and re-elected for two consecutive terms as School Captain, directing student council governance, inter-school athletics, and campus academic events.',
    details: [
      'Coordinated house captains, disciplinary councils, and cross-school competitions.',
      'Built strong operational leadership alongside mentoring younger builders in intelligent software.',
    ],
  },
  {
    id: 'trinity-science',
    category: 'Certifications',
    title: 'Grade 12 Science Honours Curriculum',
    issuer: 'Trinity International College, Kathmandu',
    year: '2025–2026',
    badge: 'PMCC Track',
    summary:
      'Senior academic specialization in Physics, Mathematics, Chemistry, and Computer Science while shipping intelligent software and offline classroom systems for the college.',
    details: [
      'Engineered Trinity Teaching Suite directly for classroom smartboards and educator touchscreens.',
      'Bridging foundational mathematical and scientific rigor with applied artificial intelligence.',
    ],
  },
];

export const BEYOND_PILLARS: BeyondPillar[] = [
  {
    id: 'athletics',
    title: 'Basketball & Mountain Trail Conditioning',
    metric: 'High-Altitude Stamina',
    description:
      'Competitive basketball player with daily court drills and steep trail endurance conditioning across the Kathmandu Valley hills. Physical discipline translates directly into sustained focus during deep engineering sprints.',
  },
  {
    id: 'music',
    title: 'Acoustic, Electric Guitar & Vocals',
    metric: 'Live & Studio Sessions',
    description:
      'Vocalist, acoustic and electric guitarist, and performer. Musical phrasing and harmonic structure actively inspire interactive vision works like HandChord.',
  },
  {
    id: 'creator',
    title: 'Open-Source Outreach & Live Demos',
    metric: '@aayushifty · @aayushshshhshifty',
    description:
      'Sharing live agent demos, vision experiments, technical articles on DEV.to, and guitar & builder reels across TikTok and Instagram.',
  },
];

export const SOCIAL_PROFILES: SocialProfile[] = [
  {
    label: 'GitHub',
    handle: '@aayushbhatta230-ux',
    href: 'https://github.com/aayushbhatta230-ux',
    kind: 'github',
  },
  {
    label: 'LinkedIn',
    handle: '/in/aayushifty',
    href: 'https://www.linkedin.com/in/aayushifty',
    kind: 'linkedin',
  },
  {
    label: 'Instagram',
    handle: '@aayushshshhshifty',
    href: 'https://www.instagram.com/aayushshshhshifty/',
    kind: 'instagram',
  },
  {
    label: 'TikTok',
    handle: '@aayushifty',
    href: 'https://www.tiktok.com/@aayushifty',
    kind: 'tiktok',
  },
  {
    label: 'DEV.to',
    handle: '@aayushifty',
    href: 'https://dev.to/aayushifty',
    kind: 'dev',
  },
  {
    label: 'Portfolio Site',
    handle: 'aayushifty.is-a.dev',
    href: 'https://aayushifty.is-a.dev/',
    kind: 'globe',
  },
];
