import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { assetsPaths } from '../data/textures';

gsap.registerPlugin(ScrollTrigger);

export default function LoadingScreen({ percentage, loading }) {
  const progressBarRef = useRef();
  const loadingDivRef = useRef();
  const videoRef = useRef();
  const [hidden, setHidden] = useState(false);
  const [displayedPercent, setDisplayedPercent] = useState(percentage);

  useEffect(() => {
    if (progressBarRef.current) {
      progressBarRef.current.style.transform = `scaleX(${percentage / 100})`;
    }
    const obj = { p: displayedPercent };
    gsap.to(obj, {
      p: percentage,
      duration: 1,
      onUpdate: () => {
        setDisplayedPercent(Math.round(obj.p));
      }
    });

    if (!loading) {
      gsap.to('.content', {
        opacity: 0,
        filter: 'blur(10px)',
        duration: 0.5,
        onComplete: () => {
          gsap.to('.start-button', {
            opacity: 1,
            filter: 'blur(0px)',
            duration: 0.5,
            pointerEvents: 'all'
          });
        }
      });
    }
  }, [percentage, loading]);

  const handleEnter = () => {
    if (loadingDivRef.current) {
      // Immediately unlock body and html scrollbars so there is zero latency
      document.body.style.overflow = 'auto';
      document.body.style.overflowY = 'auto';
      document.body.style.overflowX = 'hidden';
      document.documentElement.style.overflow = 'auto';
      document.documentElement.style.overflowY = 'auto';
      document.documentElement.style.overflowX = 'hidden';

      const proxy = document.getElementById('proxy-container');
      if (proxy) {
        proxy.style.display = 'block';
        proxy.style.height = '1500vh';
      }

      gsap.to(loadingDivRef.current, {
        yPercent: 100,
        opacity: 0,
        duration: 1.2,
        ease: 'power2.out',
        onComplete: () => {
          if (loadingDivRef.current) loadingDivRef.current.style.display = 'none';
          setHidden(true);
          gsap.to('.instruction-root', { opacity: 1, duration: 2, ease: 'none' });
          ScrollTrigger.refresh();
          setTimeout(() => {
            ScrollTrigger.refresh();
          }, 150);
        }
      });

      const vrButton = document.getElementById('VRButton');
      if (vrButton && vrButton.innerHTML === 'ENTER VR') {
        vrButton.style.display = 'block';
        vrButton.style.opacity = '0';
        gsap.to('#VRButton', { opacity: 1, duration: 2, ease: 'none' });
      }

      const switcher = document.querySelector('.switcher-container');
      if (switcher) {
        switcher.style.display = 'block';
        gsap.to('.switcher-container', { opacity: 1, duration: 2, ease: 'none' });
      }
    }
  };

  // If loading is finished and user attempts to scroll or swipe, automatically enter
  useEffect(() => {
    if (!loading) {
      const handleUserAttemptScroll = () => {
        handleEnter();
      };
      window.addEventListener('wheel', handleUserAttemptScroll, { once: true, passive: true });
      window.addEventListener('touchmove', handleUserAttemptScroll, { once: true, passive: true });
      return () => {
        window.removeEventListener('wheel', handleUserAttemptScroll);
        window.removeEventListener('touchmove', handleUserAttemptScroll);
      };
    }
  }, [loading]);

  if (hidden) return null;

  return (
    <div
      className="loading"
      ref={loadingDivRef}
      onClick={() => {
        if (!loading) handleEnter();
      }}
      style={{ cursor: !loading ? 'pointer' : 'default' }}
    >
      <div className="content">
        <video
          width="500"
          ref={videoRef}
          height="100%"
          className="video"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src={assetsPaths.loadingVideo} type="video/webm" />
        </video>
        <div className="progress-bar" ref={progressBarRef}>
          <div className="progress-bar--progress" />
        </div>
        <span className="percentage">{displayedPercent}%</span>
      </div>
      <button
        className="start-button"
        onClick={(e) => {
          e.stopPropagation();
          handleEnter();
        }}
      >
        Enter
      </button>
    </div>
  );
}
