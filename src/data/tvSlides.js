// Slides shown on the living-room TV. `from`/`to` are scroll-timeline progress (0–1);
// the camera sits on the TV from ~0.24 to ~0.53. The screen is black until ~0.345
// ("movie" phase), then shows the sky / airplane background from ~0.37 ("game" phase).
export const tvSlides = [
  {
    from: 0.245,
    to: 0.278,
    phase: 'movie',
    channel: 'CH 01',
    kicker: 'Now playing',
    title: 'Aayush Bhatta',
    body: 'AI Developer · Robotics Enthusiast',
    meta: 'Kathmandu, Nepal'
  },
  {
    from: 0.278,
    to: 0.311,
    phase: 'movie',
    channel: 'CH 02',
    kicker: 'Currently building',
    icon: 'cpu',
    title: 'Local AI & Robotics',
    body: 'Running LLMs on my own machine and wiring them into things that move.'
  },
  {
    from: 0.311,
    to: 0.345,
    phase: 'movie',
    channel: 'CH 03',
    kicker: 'Off the clock',
    icon: 'music',
    title: 'Music & Acoustic Guitar',
    body: 'My creative outlet when I step away from the terminal.'
  },
  {
    from: 0.372,
    to: 0.42,
    phase: 'game',
    kicker: 'Achievement unlocked',
    icon: 'trophy',
    title: 'National Debater'
  },
  {
    from: 0.42,
    to: 0.468,
    phase: 'game',
    kicker: 'Achievement unlocked',
    icon: 'globe',
    title: 'NYC MUN Delegate',
    meta: '13 conferences'
  },
  {
    from: 0.468,
    to: 0.525,
    phase: 'game',
    kicker: 'Level complete',
    icon: 'gamepad',
    title: 'Keep scrolling',
    meta: 'Projects up next'
  }
];
