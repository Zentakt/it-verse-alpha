
import React, { useState, useEffect, useRef } from 'react';
import Hero from './components/Hero';
import Loader from './components/Loader';
import PortalTransition from './components/PortalTransition';
import TeamLore from './components/TeamLore';
import DashboardLayout from './components/DashboardLayout';
import GamesGrid from './components/GamesGrid';
import Scoreboard from './components/Scoreboard';
import QRScanner from './components/QRScanner';
import TournamentsView from './components/TournamentsView';
import EventModal from './components/EventModal';
import AdminPanel from './components/AdminPanel';
import CyberBackground from './components/CyberBackground';
import Footer from './components/Footer';
import LoginView from './components/LoginView'; 
import { AppState, GameEvent, Match, Team, UserProfile, Challenge } from './types';
import { INITIAL_EVENTS, TEAMS as INITIAL_TEAMS, INITIAL_PROFILE } from './constants';
import confetti from 'canvas-confetti';

type IntroStage = 'loader' | 'portal' | 'content';

const App: React.FC = () => {
  const [introStage, setIntroStage] = useState<IntroStage>('loader');
  const [showPortal, setShowPortal] = useState(false);
  const teamSectionRef = useRef<HTMLDivElement>(null);
  
  // App State
  const [appState, setAppState] = useState<AppState>({
    countdownEnd: new Date(Date.now() + 1000 * 15).toISOString(),
    isTorchLit: false,
    selectedTeamId: null,
    currentView: 'games'
  });

  // Dynamic Data State
  const [teams, setTeams] = useState<Record<string, Team>>(INITIAL_TEAMS);
  const [events, setEvents] = useState<GameEvent[]>(INITIAL_EVENTS);
  const [selectedEvent, setSelectedEvent] = useState<GameEvent | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_PROFILE);
  
  // Challenge State (Updated with Quiz and Valid Types)
  const [challenges, setChallenges] = useState<Challenge[]>([
      { id: 'c1', title: 'Neural Sync', description: 'Establish neural handshake protocol.', question: 'Follow the pattern.', answer: 'ignore', points: 150, gameType: 'sequence' },
      { id: 'c2', title: 'Memory Fragment', description: 'Reconstruct corrupted data blocks.', question: 'Match the pairs.', answer: 'ignore', points: 200, gameType: 'memory' },
      { id: 'c3', title: 'Firewall Breach', description: 'Decrypt the security key.', question: 'ENTER PASSKEY: 42', answer: '42', points: 100, gameType: 'cipher' },
      { 
          id: 'c4', 
          title: 'System Aptitude', 
          description: 'Prove your knowledge of the core systems.', 
          question: 'Answer 5 Questions correctly.', 
          answer: 'ignore', 
          points: 300, 
          gameType: 'quiz',
          gameConfig: {
              questions: [
                  { q: "What is the primary function of a React Key?", options: ["Identify DOM elements", "Enhance Security", "Sort Arrays", "Manage State", "Debug Code"], correct: 0 },
                  { q: "Which hook is used for side effects?", options: ["useState", "useContext", "useEffect", "useReducer", "useCallback"], correct: 2 },
                  { q: "What does CSS 'z-index' control?", options: ["Opacity", "Zoom Level", "Stacking Order", "Animation Speed", "Grid Layout"], correct: 2 },
                  { q: "Which status code indicates 'Not Found'?", options: ["200", "500", "301", "403", "404"], correct: 4 },
                  { q: "In binary, what is 101?", options: ["3", "5", "7", "2", "6"], correct: 1 }
              ]
          }
      }
  ]);

  const handleCountdownUpdate = (date: string) => {
    setAppState(prev => ({ ...prev, countdownEnd: date, isTorchLit: false }));
  };

  const handleTorchLight = () => {
    setAppState(prev => ({ ...prev, isTorchLit: true }));
  };

  useEffect(() => {
    if (appState.isTorchLit && !appState.selectedTeamId) {
      const timer = setTimeout(() => {
        teamSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 4500); 
      return () => clearTimeout(timer);
    }
  }, [appState.isTorchLit, appState.selectedTeamId]);

  const handleLoaderComplete = () => {
    setIntroStage('portal');
    setShowPortal(true);
  };

  const handlePortalComplete = () => {
    setIntroStage('content');
    setTimeout(() => {
        setShowPortal(false);
    }, 2000);
  };

  const handleTeamSelect = (teamId: string) => {
    // Force reset to 'games' view and instant scroll to top
    setAppState(prev => ({ ...prev, selectedTeamId: teamId, currentView: 'games' }));
    
    const teamColor = teams[teamId].color;
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors: [teamColor, '#ffffff'],
      zIndex: 1000,
    });
    
    // Ensure we start at the Hero Section immediately
    window.scrollTo(0, 0);
  };

  const handleNavigate = (view: AppState['currentView']) => {
    setAppState(prev => ({ ...prev, currentView: view }));
    // Optional: Scroll to top on nav change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogin = (username: string) => {
      setUserProfile(prev => ({ ...prev, username: username, badges: [...prev.badges, 'Verified Agent'] }));
      setAppState(prev => ({ ...prev, currentView: 'games' }));
      triggerConfetti();
  };

  // ADMIN ACTIONS
  const updateMatchStatus = (eventId: string, matchId: string, status: Match['status']) => {
    setEvents(prevEvents => prevEvents.map(evt => {
      if (evt.id !== eventId) return evt;
      return {
        ...evt,
        matches: evt.matches.map(m => m.id === matchId ? { ...m, status } : m)
      };
    }));
  };

  const updateMatchStream = (eventId: string, matchId: string, streamUrl: string) => {
    setEvents(prevEvents => prevEvents.map(evt => {
        if (evt.id !== eventId) return evt;
        return {
            ...evt,
            matches: evt.matches.map(m => m.id === matchId ? { ...m, streamUrl } : m)
        }
    }));
  };

  const updateEvent = (eventId: string, updates: Partial<GameEvent> | any) => {
      setEvents(prevEvents => prevEvents.map(evt => {
          if (evt.id !== eventId) return evt;
          // Handle deep merge for details
          let newDetails = evt.details;
          if(updates.details) {
              newDetails = { ...evt.details, ...updates.details };
          }
          return { ...evt, ...updates, details: newDetails };
      }));
  };

  const updateTeam = (teamId: string, updates: Partial<Team>) => {
      setTeams(prev => ({
          ...prev,
          [teamId]: { ...prev[teamId], ...updates }
      }));
  };

  const updateTeamPoints = (teamId: string, points: number, source: string) => {
      setTeams(prev => {
          const team = prev[teamId];
          if (!team) return prev;
          return {
              ...prev,
              [teamId]: {
                  ...team,
                  breakdown: [...team.breakdown, { source, points }]
              }
          };
      });
  };

  // Updated to support specific event bracket
  const updateBracketMatch = (eventId: string, matchId: string, p1Score: number | null, p2Score: number | null, status: any) => {
      setEvents(prevEvents => prevEvents.map(evt => {
          if (evt.id !== eventId) return evt;
          return {
              ...evt,
              bracket: evt.bracket.map(m => {
                  if (m.id !== matchId) return m;
                  const p1Winner = (p1Score !== null && p2Score !== null) ? p1Score > p2Score : false;
                  const p2Winner = (p1Score !== null && p2Score !== null) ? p2Score > p1Score : false;
                  return {
                      ...m,
                      status,
                      p1: { ...m.p1, score: p1Score, isWinner: p1Winner },
                      p2: { ...m.p2, score: p2Score, isWinner: p2Winner }
                  };
              })
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

  let bgMode: 'static' | 'cruise' | 'warp' = 'static';
  let bgColor = '#7c3aed';

  if (introStage === 'portal') {
    bgMode = 'warp';
    bgColor = '#00ffff';
  } else if (introStage === 'content') {
    if (!appState.selectedTeamId) {
       bgMode = 'static';
    } else {
       bgMode = 'cruise';
       bgColor = teams[appState.selectedTeamId].color;
    }
  }

  return (
    <>
      <CyberBackground mode={bgMode} colorTheme={bgColor} />

      {introStage === 'loader' && (
        <Loader onComplete={handleLoaderComplete} />
      )}

      {showPortal && (
        <div className={`fixed inset-0 z-[50] transition-opacity duration-1000 ease-out ${introStage === 'content' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
             <PortalTransition onComplete={handlePortalComplete} />
        </div>
      )}

      {introStage === 'content' && (
        <>
            {!appState.selectedTeamId ? (
                <div className="relative min-h-screen text-white overflow-x-hidden animate-in fade-in duration-1000">
                    <Hero appState={appState} onTorchLight={handleTorchLight} />
                    {appState.isTorchLit && (
                    <div ref={teamSectionRef} className="animate-in fade-in duration-1000">
                        <TeamLore onSelect={handleTeamSelect} teams={teams} />
                        <Footer />
                    </div>
                    )}
                    <AdminPanel 
                        appState={appState} 
                        events={events} 
                        teams={teams}
                        bracketData={[]} // No global bracket anymore
                        challenges={challenges}
                        updateChallenges={setChallenges}
                        updateCountdown={handleCountdownUpdate} 
                        updateMatchStatus={updateMatchStatus} 
                        updateMatchStream={updateMatchStream}
                        updateEvent={updateEvent}
                        updateTeam={updateTeam}
                        updateTeamPoints={updateTeamPoints}
                        updateBracketMatch={(mId, s1, s2, st) => console.log('Use event specific')}
                        updateEventBracketMatch={updateBracketMatch}
                        toggleConfetti={triggerConfetti}
                    />
                </div>
            ) : (
                <DashboardLayout 
                    currentTeam={teams[appState.selectedTeamId]} 
                    userProfile={userProfile}
                    currentView={appState.currentView}
                    onNavigate={handleNavigate}
                >
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-screen">
                        {appState.currentView === 'games' && (
                            <GamesGrid events={events} teams={teams} onSelectEvent={setSelectedEvent} />
                        )}
                        {appState.currentView === 'leaderboard' && (
                            <Scoreboard teams={teams} />
                        )}
                        {appState.currentView === 'scanner' && (
                            <QRScanner currentTeam={teams[appState.selectedTeamId]} challenges={challenges} />
                        )}
                        {appState.currentView === 'tournaments' && (
                            <TournamentsView 
                                onNavigate={handleNavigate} 
                                currentTeam={teams[appState.selectedTeamId]}
                                events={events}
                            />
                        )}
                        {appState.currentView === 'login' && (
                            <LoginView 
                                currentTeam={teams[appState.selectedTeamId]}
                                onLogin={handleLogin}
                            />
                        )}
                    </div>

                    <EventModal 
                        event={selectedEvent} 
                        onClose={() => setSelectedEvent(null)} 
                        teams={teams}
                    />
                    
                    <AdminPanel 
                        appState={appState} 
                        events={events} 
                        teams={teams}
                        bracketData={[]}
                        challenges={challenges}
                        updateChallenges={setChallenges}
                        updateCountdown={handleCountdownUpdate} 
                        updateMatchStatus={updateMatchStatus} 
                        updateMatchStream={updateMatchStream}
                        updateEvent={updateEvent}
                        updateTeam={updateTeam}
                        updateTeamPoints={updateTeamPoints}
                        updateBracketMatch={(mId, s1, s2, st) => console.log('Use event specific')}
                        updateEventBracketMatch={updateBracketMatch}
                        toggleConfetti={triggerConfetti}
                    />
                </DashboardLayout>
            )}
        </>
      )}
    </>
  );
};

export default App;
