
import React, { useState, useEffect, useRef } from 'react';
import Hero from './components/Hero';
import Loader from './components/Loader';
import PortalTransition from './components/PortalTransition';
import TeamLore from './components/TeamLore';
import DashboardLayout from './components/DashboardLayout';
import GamesGrid from './components/GamesGrid';
import Scoreboard from './components/Scoreboard';
import QRScanner from './components/QRScanner';
import EventModal from './components/EventModal';
import AdminPanel from './components/AdminPanel';
import CyberBackground from './components/CyberBackground';
import Footer from './components/Footer';
import { AppState, GameEvent, Match } from './types';
import { INITIAL_EVENTS, TEAMS, INITIAL_PROFILE } from './constants';
import confetti from 'canvas-confetti';

// Define the stages of the app intro sequence
type IntroStage = 'loader' | 'portal' | 'content';

const App: React.FC = () => {
  const [introStage, setIntroStage] = useState<IntroStage>('loader');
  // New state to persist the portal during transition to content
  const [showPortal, setShowPortal] = useState(false);
  const teamSectionRef = useRef<HTMLDivElement>(null);
  
  // App State
  const [appState, setAppState] = useState<AppState>({
    // Set countdown to 15 seconds from now as requested
    countdownEnd: new Date(Date.now() + 1000 * 15).toISOString(),
    isTorchLit: false,
    selectedTeamId: null,
    currentView: 'games'
  });

  const [events, setEvents] = useState<GameEvent[]>(INITIAL_EVENTS);
  const [selectedEvent, setSelectedEvent] = useState<GameEvent | null>(null);

  const handleCountdownUpdate = (date: string) => {
    setAppState(prev => ({ ...prev, countdownEnd: date, isTorchLit: false }));
  };

  const handleTorchLight = () => {
    setAppState(prev => ({ ...prev, isTorchLit: true }));
  };

  // Auto-scroll to team selection when torch is lit
  useEffect(() => {
    if (appState.isTorchLit && !appState.selectedTeamId) {
      // Delay slightly to let the torch ignition animation start playing
      const timer = setTimeout(() => {
        teamSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [appState.isTorchLit, appState.selectedTeamId]);

  // Handle Loader -> Portal Transition
  const handleLoaderComplete = () => {
    setIntroStage('portal');
    setShowPortal(true);
  };

  // Handle Portal -> Content Transition (Seamless)
  const handlePortalComplete = () => {
    setIntroStage('content');
    // Keep Portal mounted for 2 seconds while it fades out via CSS opacity
    setTimeout(() => {
        setShowPortal(false);
    }, 2000);
  };

  const handleTeamSelect = (teamId: string) => {
    setAppState(prev => ({ ...prev, selectedTeamId: teamId }));
    // Trigger confetti for celebration
    const teamColor = TEAMS[teamId].color;
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors: [teamColor, '#ffffff'],
      zIndex: 1000,
    });
    // Scroll back to top for dashboard
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (view: AppState['currentView']) => {
    setAppState(prev => ({ ...prev, currentView: view }));
  };

  const updateMatchStatus = (eventId: string, matchId: string, status: Match['status']) => {
    setEvents(prevEvents => prevEvents.map(evt => {
      if (evt.id !== eventId) return evt;
      return {
        ...evt,
        matches: evt.matches.map(m => m.id === matchId ? { ...m, status } : m)
      };
    }));
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#8b5cf6', '#ff00de', '#00ffff'],
      zIndex: 1000,
    });
  };

  // Determine Background State
  let bgMode: 'static' | 'cruise' | 'warp' = 'static';
  let bgColor = '#7c3aed'; // Default Purple

  if (introStage === 'portal') {
    bgMode = 'warp';
    bgColor = '#00ffff';
  } else if (introStage === 'content') {
    if (!appState.selectedTeamId) {
       bgMode = 'static'; // Hero view
    } else {
       bgMode = 'cruise'; // Dashboard view
       bgColor = TEAMS[appState.selectedTeamId].color;
    }
  }

  // --- RENDER ---

  if (introStage === 'loader') {
    return <Loader onComplete={handleLoaderComplete} />;
  }

  return (
    <>
      <CyberBackground mode={bgMode} colorTheme={bgColor} />

      {/* PORTAL LAYER - Persists during transition to allow seamless overlay */}
      {showPortal && (
        <div className={`fixed inset-0 z-[50] transition-opacity duration-1000 ease-out ${introStage === 'content' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
             <PortalTransition onComplete={handlePortalComplete} />
        </div>
      )}

      {/* CONTENT LAYER - Renders underneath Portal initially */}
      {introStage === 'content' && (
        <>
            {/* 1. Initial State: Hero with Countdown -> Torch Interaction */}
            {!appState.selectedTeamId ? (
                <div className="relative min-h-screen text-white overflow-x-hidden animate-in fade-in duration-1000">
                    <Hero appState={appState} onTorchLight={handleTorchLight} />
                    
                    {/* Render Team Lore Below Hero when lit */}
                    {appState.isTorchLit && (
                    <div ref={teamSectionRef} className="animate-in fade-in duration-1000">
                        <TeamLore onSelect={handleTeamSelect} />
                        <Footer />
                    </div>
                    )}
                    
                    <AdminPanel 
                        appState={appState} 
                        events={events} 
                        updateCountdown={handleCountdownUpdate} 
                        updateMatchStatus={updateMatchStatus} 
                        toggleConfetti={triggerConfetti}
                    />
                </div>
            ) : (
                /* 2. Main Dashboard State (After Team Selection) */
                <DashboardLayout 
                    currentTeam={TEAMS[appState.selectedTeamId]} 
                    userProfile={INITIAL_PROFILE}
                    currentView={appState.currentView}
                    onNavigate={handleNavigate}
                >
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-screen">
                        {appState.currentView === 'games' && (
                            <GamesGrid events={events} teams={TEAMS} onSelectEvent={setSelectedEvent} />
                        )}
                        
                        {appState.currentView === 'leaderboard' && (
                            <Scoreboard teams={TEAMS} />
                        )}
                        
                        {appState.currentView === 'scanner' && (
                            <QRScanner currentTeam={TEAMS[appState.selectedTeamId]} />
                        )}
                    </div>

                    <EventModal 
                        event={selectedEvent} 
                        onClose={() => setSelectedEvent(null)} 
                        teams={TEAMS}
                    />
                </DashboardLayout>
            )}
        </>
      )}
    </>
  );
};

export default App;
