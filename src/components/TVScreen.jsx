import React, { memo } from 'react';
import { tvSlides } from '../data/tvSlides';

// Inline SVG icons (emoji fonts are missing on some devices). 24x24, stroke-based.
const icons = {
  cpu: 'M9 3v2M15 3v2M9 19v2M15 19v2M3 9h2M3 15h2M19 9h2M19 15h2M7 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM10 10h4v4h-4z',
  music: 'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  trophy: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3',
  globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3z',
  gamepad: 'M6 12h4M8 10v4M15 11h.01M18 13h.01M7 6h10a5 5 0 0 1 4.9 6l-.8 4a3 3 0 0 1-5.3 1.3L14 15h-4l-1.8 2.3A3 3 0 0 1 2.9 16l-.8-4A5 5 0 0 1 7 6z'
};

function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={icons[name]} />
    </svg>
  );
}

// Static markup only: Scene.js moves #tvScreen into the CSS3D layer and toggles
// `is-on` / `is-active` / `--progress` from the scroll timeline each frame.
// The outer host stays in the React tree so sibling inserts (e.g. the modal) keep a valid anchor.
function TVScreen() {
  return (
    <div className="tv-screen-host">
      <div className="tv-screen" id="tvScreen" aria-hidden="true">
        {tvSlides.map((slide, i) => (
          <section
            key={i}
            className={`tv-slide tv-slide--${slide.phase}`}
            data-from={slide.from}
            data-to={slide.to}
          >
            {slide.phase === 'movie' ? (
              <>
                <header className="tv-slide__bar">
                  <span className="tv-slide__live">
                    <i /> {slide.kicker}
                  </span>
                  <span>{slide.channel}</span>
                </header>
                <div className="tv-slide__center">
                  {slide.icon && <div className="tv-slide__icon"><Icon name={slide.icon} /></div>}
                  <h2 className="tv-slide__title">{slide.title}</h2>
                  {slide.body && <p className="tv-slide__body">{slide.body}</p>}
                  {slide.meta && <p className="tv-slide__meta">{slide.meta}</p>}
                </div>
              </>
            ) : (
              <div className="tv-hud">
                <div className="tv-hud__icon"><Icon name={slide.icon} /></div>
                <div className="tv-hud__text">
                  <span className="tv-hud__kicker">{slide.kicker}</span>
                  <strong className="tv-hud__title">{slide.title}</strong>
                  {slide.meta && <span className="tv-hud__meta">{slide.meta}</span>}
                </div>
              </div>
            )}
            <div className="tv-slide__progress" />
          </section>
        ))}
      </div>
    </div>
  );
}

export default memo(TVScreen);
