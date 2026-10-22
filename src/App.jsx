import React, { useState, useEffect, useRef } from 'react';
import { createSceneController } from './components/Scene';
import LoadingScreen from './components/LoadingScreen';
import ProjectModal from './components/ProjectModal';
import ThemeSwitcher from './components/ThemeSwitcher';
import Instructions from './components/Instructions';
import SocialLinks from './components/SocialLinks';
import TVScreen from './components/TVScreen';

export default function App() {
  const [loadingPercent, setLoadingPercent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(0);
  const [timeMode, setTimeMode] = useState(() => {
    const hours = new Date().getHours();
    return hours >= 6 && hours < 18 ? 'day' : 'night';
  });

  const proxyRef = useRef();
  const testContainerRef = useRef();
  const canvasRef = useRef();
  const sceneControllerRef = useRef();

  useEffect(() => {
    // StrictMode runs effects twice in dev; the scene owns global DOM/WebGL state, so init once.
    if (sceneControllerRef.current) return;
    window.onbeforeunload = () => {
      window.scrollTo(0, 0);
    };

    const controller = createSceneController();
    sceneControllerRef.current = controller;

    controller.init({
      canvas: canvasRef.current,
      proxyContainer: proxyRef.current,
      testContainer: testContainerRef.current,
      onProgress: (p) => setLoadingPercent(p),
      onLoad: () => setIsLoading(false),
      onProjectClick: (id) => {
        setSelectedProjectId(id);
        setTimeout(() => setIsModalOpen(true), 300);
      },
      initialTimeMode: timeMode
    });
  }, []);

  const handleSwitchTime = () => {
    if (!sceneControllerRef.current) return;
    if (timeMode === 'night') {
      setTimeMode('day');
      sceneControllerRef.current.setDayMode();
    } else {
      setTimeMode('night');
      sceneControllerRef.current.setNightMode();
    }
  };

  return (
    <div className="App">
      <div id="proxy-container" ref={proxyRef} />
      <div className="test-container" ref={testContainerRef} />
      <canvas className="canvas" id="canvas" ref={canvasRef} />

      <ProjectModal
        id={selectedProjectId}
        showModal={isModalOpen}
        closeModal={() => setIsModalOpen(false)}
        currentTime={timeMode}
      />

      <TVScreen />

      <ThemeSwitcher switchTime={handleSwitchTime} time={timeMode} />

      <LoadingScreen percentage={loadingPercent} loading={isLoading} />

      <Instructions />

      <SocialLinks />
    </div>
  );
}
