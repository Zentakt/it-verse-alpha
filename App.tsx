
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
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
import SecurityCheck from './components/SecurityCheck'; // New Import

const API_URL = '/api';

type IntroStage = 'loader' | 'portal' | 'content';

// Helper to normalize image URLs (handle base64, relative paths, and absolute URLs)
const normalizeImageUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  // If it's base64 or already absolute, return as-is
  if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // If it's a relative path, return as-is (nginx will handle proxy)
  if (url.startsWith('/')) {
    return url;
  }
  // Otherwise, assume it's a filename and prepend /uploads/
  return `/uploads/${url}`;
};

// Helper functions for localStorage
const loadAppState = (): AppState => {
  try {
    const saved = localStorage.getItem('iteverse_appstate');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        countdownEnd: parsed.countdownEnd || new Date(Date.now() + 1000 * 15).toISOString(),
        isTorchLit: parsed.isTorchLit || false,
        isTorchAutoLit: parsed.isTorchAutoLit || false,
        selectedTeamId: parsed.selectedTeamId || null,
        currentView: parsed.currentView || 'games'
      };
    }
  } catch (e) {
    console.error('Failed to load app state from localStorage', e);
  }

  return {
    countdownEnd: new Date(Date.now() + 1000 * 15).toISOString(),
    isTorchLit: false,
    isTorchAutoLit: false,
    selectedTeamId: null,
    currentView: 'games'
  };
};

const saveAppState = (state: AppState) => {
  try {
    localStorage.setItem('iteverse_appstate', JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save app state to localStorage', e);
  }
};

// Helper to load teams from localStorage (includes logo persistence)
const loadTeamsFromLocalStorage = (): Record<string, Team> => {
  try {
    const saved = localStorage.getItem('iteverse_teams');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to load teams from localStorage', e);
  }
  return {};
};

// Helper to save teams to localStorage
const saveTeamsToLocalStorage = (teams: Record<string, Team>) => {
  try {
    localStorage.setItem('iteverse_teams', JSON.stringify(teams));
  } catch (e) {
    console.warn('Failed to save teams to localStorage', e);
  }
};

const App: React.FC = () => {
  const [isVerified, setIsVerified] = useState(false); // New Security State
  const [introStage, setIntroStage] = useState<IntroStage>('loader');
  const [showPortal, setShowPortal] = useState(false);
  const teamSectionRef = useRef<HTMLDivElement>(null);

  // Check if accessing /admin route
  const isAdminRoute = typeof window !== 'undefined' && window.location.pathname === '/admin';

  // App State - Load from localStorage
  const [appState, setAppState] = useState<AppState>(loadAppState);

  // Dynamic Data State
  const [teams, setTeams] = useState<Record<string, Team>>({});
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<GameEvent | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [isLoading, setIsLoading] = useState(true);

  // Real-time sync interval ref and WebSocket ref
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const SYNC_INTERVAL = 3000; // 3 seconds for real-time feel
  const WS_URL = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/api/ws`; // WebSocket endpoint for true real-time (WSS for HTTPS, WS for HTTP)

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
    },
    {
      id: 'c6',
      title: 'Synapse Link',
      description: 'Find the common link.',
      question: '4 Images, 1 Word.',
      answer: 'NETWORK',
      points: 250,
      gameType: '4pics',
      gameConfig: {
        images: [
          'https://images.unsplash.com/photo-1544197150-b99a580bb7f8?w=400',
          'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400',
          'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400',
          'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400'
        ]
      }
    },
    {
      id: 'c7',
      title: 'Lexicon Branch',
      description: 'Guess the system password.',
      question: 'Determine the 5-letter key.',
      answer: 'CYBER',
      points: 300,
      gameType: 'wordle'
    },
    {
      id: 'c8',
      title: 'Cognitive Camouflage',
      description: 'Analyze visual data density.',
      question: 'Count the number of screens in the image.',
      answer: '3',
      points: 400,
      gameType: 'visual_count',
      gameConfig: {
        image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800'
      }
    }
  ]);

  // Map raw DB rows (snake_case) into the GameEvent shape for fallback fetches
  const mapDbEventRowToGameEvent = (e: any): GameEvent => {
    const rulesText = e.rules || '';
    const rulesArray = rulesText ? rulesText.split(/\r?\n|,/).map((r: string) => r.trim()).filter(Boolean) : [];
    const entryFeeNumber = e.entry_fee !== null && e.entry_fee !== undefined ? Number(e.entry_fee) : null;
    return {
      id: e.id,
      title: e.title,
      game: e.game,
      shortName: e.short_name,
      image: e.image,
      description: e.description || '',
      bracketType: e.bracket_type || 'single',
      status: e.status,
      matches: [],
      bracket: [],
      gameLogo: e.game_logo,
      banner: e.banner,
      startDate: e.start_date,
      format: e.format,
      entryFee: entryFeeNumber,
      countdownEnd: e.countdown_end,
      globalSeed: e.global_seed,
      modeWins: e.mode_wins,
      modeLosses: e.mode_losses,
      matchHistorySynced: e.match_history_synced,
      statusRegistration: e.status_registration,
      statusConfirmation: e.status_confirmation,
      statusSeeding: e.status_seeding,
      rulesText,
      availableSlots: e.available_slots,
      confirmedSlots: e.confirmed_slots,
      details: {
        status: e.status_registration || 'Open',
        prizePool: '? 100,000',
        entryFee: entryFeeNumber !== null ? `${entryFeeNumber}` : 'FREE',
        format: e.format || '5v5',
        brief: e.description || '',
        rules: rulesArray,
        schedule: { day: '00', hour: '00', min: '00', sec: '00' }
      },
      teamRecord: { wins: e.mode_wins || 0, losses: e.mode_losses || 0 }
    } as GameEvent;
  };

  const handleCountdownUpdate = async (date: string) => {
    // Just update the countdown end time, don't change torch state
    // If torch is already lit, it stays lit
    setAppState(prev => ({
      ...prev,
      countdownEnd: date
    }));

    // Save to database
    try {
      await axios.post(`${API_URL}/countdown`, { countdown_end: date });
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'app_state_updated', data: { countdownEnd: date } }));
      }
    } catch (error) {
      console.error('Failed to update countdown:', error);
    }
  };

  const handleTorchLight = async () => {
    setAppState(prev => ({
      ...prev,
      isTorchLit: true,
      isTorchAutoLit: true // Mark that torch auto-lit from countdown
    }));

    // Save to database
    try {
      await axios.post(`${API_URL}/torch/light`);
    } catch (error) {
      console.error('Failed to update torch:', error);
    }
  };

  // Fetch initial data from backend and set up real-time sync with WebSocket
  useEffect(() => {
    // Load username from localStorage on initial load (client-based)
    const savedUsername = localStorage.getItem('iteverse_username');
    if (savedUsername) {
      setUserProfile(prev => ({ ...prev, username: savedUsername }));
      console.log('✅ Loaded username from localStorage:', savedUsername);
    }

    // Initialize WebSocket for true real-time updates
    const initializeWebSocket = () => {
      try {
        wsRef.current = new WebSocket(WS_URL);

        wsRef.current.onopen = () => {
          console.log('✅ WebSocket connected - real-time sync active');
        };

        wsRef.current.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);

            // Handle team updates (including logo uploads)
            if (message.type === 'team_updated') {
              setTeams(prev => ({
                ...prev,
                [message.data.id]: {
                  ...prev[message.data.id],
                  ...message.data
                }
              }));
              console.log('✅ Team logo updated for all users via WebSocket:', message.data.id);
            }

            // Handle event updates
            if (message.type === 'event_updated') {
              setEvents(prev => prev.map(evt =>
                evt.id === message.data.id ? { ...evt, ...message.data } : evt
              ));
              console.log('✅ Event updated via WebSocket:', message.data.id);
            }

            // Handle app state updates
            if (message.type === 'app_state_updated') {
              setAppState(prev => ({ ...prev, ...message.data }));
              console.log('✅ App state updated via WebSocket');
            }

            // Handle viewer username updates (real-time sync across devices)
            if (message.type === 'viewer_username_updated') {
              // Only update if we don't have a local username set
              const localUsername = localStorage.getItem('iteverse_username');
              if (!localUsername && message.data.viewer_username) {
                setUserProfile(prev => ({ ...prev, username: message.data.viewer_username }));
                console.log('✅ Viewer username synced via WebSocket:', message.data.viewer_username);
              }
            }
          } catch (err) {
            console.error('Error processing WebSocket message:', err);
          }
        };

        wsRef.current.onerror = (error) => {
          console.warn('WebSocket error:', error);
        };

        wsRef.current.onclose = () => {
          console.warn('WebSocket disconnected - falling back to polling');
          // Attempt to reconnect every 5 seconds
          setTimeout(initializeWebSocket, 5000);
        };
      } catch (err) {
        console.warn('Failed to initialize WebSocket:', err);
      }
    };

    // Initialize WebSocket for real-time updates
    initializeWebSocket();

    const fetchData = async (isInitial = false) => {
      try {
        console.log('Syncing data from API...');

        // Try new sync endpoint first (returns all data in one call)
        try {
          const syncRes = await axios.get(`${API_URL}/sync`);
          const syncData = syncRes.data;

          // Transform teams array to object keyed by id
          const teamsObj: Record<string, Team> = {};
          for (const team of syncData.teams) {
            teamsObj[team.id] = {
              id: team.id,
              name: team.name,
              logo: team.logo || '🎮',
              seed: team.seed || 1,
              description: team.description || '',
              color: team.color || '#7c3aed',
              breakdown: (team.breakdown || []).map((b: any) => ({
                source: b.source,
                points: b.points,
                comment: b.comment,
                updatedBy: b.updated_by || b.updatedBy,
                createdAt: b.created_at || b.createdAt
              }))
            };
          }

          setTeams(teamsObj);
          saveTeamsToLocalStorage(teamsObj); // Persist to localStorage
          setEvents(syncData.events);

          // Update challenges from sync
          if (syncData.challenges && syncData.challenges.length > 0) {
            setChallenges(syncData.challenges);
          }

          // Update app state from DB
          if (syncData.appState) {
            setAppState(prev => ({
              ...prev,
              countdownEnd: syncData.appState.countdown_end || prev.countdownEnd,
              isTorchLit: syncData.appState.is_torch_lit || prev.isTorchLit
            }));

            // Sync viewer_username from database if no local username exists
            const localUsername = localStorage.getItem('iteverse_username');
            if (syncData.appState.viewer_username && !localUsername) {
              setUserProfile(prev => ({ ...prev, username: syncData.appState.viewer_username }));
              console.log('✅ Synced viewer username from DB:', syncData.appState.viewer_username);
            }
          }

          if (isInitial) {
            setIsLoading(false);
          }

          console.log('Data synced successfully:', {
            teams: Object.keys(teamsObj).length,
            events: syncData.events.length,
            timestamp: syncData.timestamp
          });
          return;
        } catch (syncErr) {
          console.log('Sync endpoint not available, falling back to individual endpoints');
        }

        // Fallback to individual endpoints
        const [teamsRes, eventsRes, appStateRes, challengesRes] = await Promise.all([
          axios.get(`${API_URL}/teams`),
          axios.get(`${API_URL}/events`),
          axios.get(`${API_URL}/app-state`),
          axios.get(`${API_URL}/challenges`).catch(() => ({ data: [] }))
        ]);

        // Transform teams array to object keyed by id and fetch breakdowns
        const teamsObj: Record<string, Team> = {};
        for (const team of teamsRes.data) {
          try {
            const breakdownRes = await axios.get(`${API_URL}/teams/${team.id}/breakdown`);
            teamsObj[team.id] = {
              ...team,
              breakdown: breakdownRes.data.map((b: any) => ({
                source: b.source,
                points: b.points,
                comment: b.comment,
                updatedBy: b.updated_by || b.updatedBy,
                createdAt: b.created_at || b.createdAt
              }))
            };
          } catch {
            teamsObj[team.id] = { ...team, breakdown: team.breakdown || [] };
          }
        }

        setTeams(teamsObj);
        saveTeamsToLocalStorage(teamsObj); // Persist to localStorage
        setEvents((eventsRes.data || []).map(mapDbEventRowToGameEvent));

        // Load challenges from database if available
        if (challengesRes.data && challengesRes.data.length > 0) {
          const dbChallenges = challengesRes.data.map((c: any) => ({
            id: c.id,
            title: c.title,
            description: c.description,
            question: c.question,
            answer: c.answer,
            points: c.points,
            gameType: c.game_type,
            gameConfig: c.game_config
          }));
          setChallenges(dbChallenges);
        }

        // Update app state from DB if torch is lit or countdown is different
        if (appStateRes.data) {
          setAppState(prev => ({
            ...prev,
            countdownEnd: appStateRes.data.countdown_end,
            isTorchLit: appStateRes.data.is_torch_lit || prev.isTorchLit
          }));
        }

        if (isInitial) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        // Do not fallback to mock data; show empty state instead
        if (isInitial) {
          setTeams({});
          setEvents([]);
          setIsLoading(false);
        }
      }
    };

    // Initial fetch
    fetchData(true);

    // Set up real-time sync interval (fallback if WebSocket fails)
    syncIntervalRef.current = setInterval(() => fetchData(false), SYNC_INTERVAL);

    // Cleanup on unmount
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Save appState to localStorage whenever it changes
  useEffect(() => {
    saveAppState(appState);
  }, [appState]);

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

  const handleTeamSelect = async (teamId: string, username: string) => {
    // Update username in profile
    setUserProfile(prev => ({ ...prev, username }));
    // Store in localStorage for persistence (client-based)
    localStorage.setItem('iteverse_username', username);

    // Sync username to database for real-time display
    try {
      await axios.post(`${API_URL}/app-state`, {
        selected_team_id: teamId,
        viewer_username: username
      });
      console.log('✅ Username synced to database:', username);
    } catch (err) {
      console.warn('Failed to sync username to database:', err);
    }

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

  // Return to team selection (TeamLore)
  const handleReturnToTeamSelect = () => {
    setAppState(prev => ({ ...prev, selectedTeamId: null }));
    window.scrollTo(0, 0);
  };

  const handleLogin = (username: string, isAdmin: boolean) => {
    setUserProfile(prev => ({
      ...prev,
      username: username,
      badges: [...prev.badges, 'Verified Agent', ...(isAdmin ? ['Admin'] : [])],
      isAdmin: isAdmin
    }));
    setAppState(prev => ({ ...prev, currentView: 'games' }));
    triggerConfetti();
  };

  // ADMIN ACTIONS
  const updateMatchStatus = async (eventId: string, matchId: string, status: Match['status']) => {
    // Update local state immediately
    setEvents(prevEvents => prevEvents.map(evt => {
      if (evt.id !== eventId) return evt;
      return {
        ...evt,
        matches: evt.matches.map(m => m.id === matchId ? { ...m, status } : m)
      };
    }));

    // Persist to database
    try {
      await axios.put(`${API_URL}/events/${eventId}/matches/${matchId}`, { status });
      console.log(`Match ${matchId} status updated to ${status}`);
    } catch (error) {
      console.error('Failed to persist match status:', error);
    }
  };

  const updateMatchStream = async (eventId: string, matchId: string, streamUrl: string) => {
    // Update local state immediately
    setEvents(prevEvents => prevEvents.map(evt => {
      if (evt.id !== eventId) return evt;
      return {
        ...evt,
        matches: evt.matches.map(m => m.id === matchId ? { ...m, streamUrl } : m)
      }
    }));

    // Persist to database
    try {
      await axios.put(`${API_URL}/events/${eventId}/matches/${matchId}`, { stream_url: streamUrl });
      console.log(`Match ${matchId} stream URL updated`);
    } catch (error) {
      console.error('Failed to persist stream URL:', error);
    }
  };

  const updateMatchResult = async (
    eventId: string,
    matchId: string,
    data: Partial<{ status: Match['status']; scoreA: number | null; scoreB: number | null; winnerId?: string | null; teamALogo?: string; teamBLogo?: string }>
  ) => {
    setEvents(prevEvents => prevEvents.map(evt => {
      if (evt.id !== eventId) return evt;
      return {
        ...evt,
        matches: evt.matches.map(m => m.id === matchId ? {
          ...m,
          status: data.status ?? m.status,
          scoreA: data.scoreA ?? m.scoreA,
          scoreB: data.scoreB ?? m.scoreB,
          winnerId: data.winnerId ?? m.winnerId,
          teamALogo: data.teamALogo ?? m.teamALogo,
          teamBLogo: data.teamBLogo ?? m.teamBLogo,
        } : m)
      };
    }));

    const payload: any = {};
    if (data.status !== undefined) payload.status = data.status;
    if (data.scoreA !== undefined) payload.score_a = data.scoreA;
    if (data.scoreB !== undefined) payload.score_b = data.scoreB;
    if (data.winnerId !== undefined) payload.winner_id = data.winnerId;
    if (data.teamALogo !== undefined) payload.team_a_logo = data.teamALogo;
    if (data.teamBLogo !== undefined) payload.team_b_logo = data.teamBLogo;

    try {
      await axios.put(`${API_URL}/events/${eventId}/matches/${matchId}`, payload);
      console.log(`Match ${matchId} updated`, payload);
    } catch (error) {
      console.error('Failed to persist match result:', error);
    }
  };

  const updateEvent = async (eventId: string, updates: Partial<GameEvent> | any) => {
    // Update local state immediately
    setEvents(prevEvents => prevEvents.map(evt => {
      if (evt.id !== eventId) return evt;
      // Handle deep merge for details
      let newDetails = evt.details;
      if (updates.details) {
        newDetails = { ...evt.details, ...updates.details };
      }
      return { ...evt, ...updates, details: newDetails };
    }));

    // Persist to database
    try {
      const payload: any = { ...updates };
      if (updates.gameLogo !== undefined) payload.game_logo = updates.gameLogo;
      if (updates.banner !== undefined) payload.banner = updates.banner;
      if (updates.startDate !== undefined) payload.start_date = updates.startDate;
      if (updates.format !== undefined) payload.format = updates.format;
      if (updates.entryFee !== undefined) payload.entry_fee = updates.entryFee;
      if (updates.countdownEnd !== undefined) payload.countdown_end = updates.countdownEnd;
      if (updates.globalSeed !== undefined) payload.global_seed = updates.globalSeed;
      if (updates.modeWins !== undefined) payload.mode_wins = updates.modeWins;
      if (updates.modeLosses !== undefined) payload.mode_losses = updates.modeLosses;
      if (updates.matchHistorySynced !== undefined) payload.match_history_synced = updates.matchHistorySynced;
      if (updates.statusRegistration !== undefined) payload.status_registration = updates.statusRegistration;
      if (updates.statusConfirmation !== undefined) payload.status_confirmation = updates.statusConfirmation;
      if (updates.statusSeeding !== undefined) payload.status_seeding = updates.statusSeeding;
      if (updates.rulesText !== undefined) payload.rules = updates.rulesText;
      if (updates.availableSlots !== undefined) payload.available_slots = updates.availableSlots;
      if (updates.confirmedSlots !== undefined) payload.confirmed_slots = updates.confirmedSlots;
      await axios.put(`${API_URL}/events/${eventId}`, payload);
      console.log(`✅ Event ${eventId} updated:`, updates);

      // Broadcast update to all connected users via WebSocket if available
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'event_updated',
          data: { id: eventId, ...updates }
        }));
        console.log('🔄 Broadcasted event update to all users via WebSocket');
      }
    } catch (error) {
      console.error('Failed to persist event update:', error);
    }
  };

  const updateTeam = async (teamId: string, updates: Partial<Team>) => {
    // Validate logo data if updating logo
    if (updates.logo && typeof updates.logo === 'string') {
      if (updates.logo.length > 100 && !updates.logo.startsWith('data:image/') && !updates.logo.startsWith('http')) {
        console.error('❌ Invalid logo data detected:', updates.logo.substring(0, 50) + '...');
        console.warn('⚠️ Logo appears corrupted. Make sure it starts with "data:image/" for base64 or "http" for URLs');
      }
    }

    // Update local state immediately
    setTeams(prev => ({
      ...prev,
      [teamId]: { ...prev[teamId], ...updates }
    }));

    // Persist to localStorage for client-side persistence
    setTeams(prev => {
      const updated = {
        ...prev,
        [teamId]: { ...prev[teamId], ...updates }
      };
      saveTeamsToLocalStorage(updated);
      return updated;
    });

    // Persist to database
    try {
      await axios.put(`${API_URL}/teams/${teamId}`, updates);
      console.log(`✅ Team ${teamId} updated:`, updates);

      // Broadcast update to all connected users via WebSocket if available
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'team_updated',
          data: { id: teamId, ...updates }
        }));
        console.log('🔄 Broadcasted team update to all users via WebSocket');
      }
    } catch (error) {
      console.error('Failed to persist team update:', error);
    }
  };

  const refreshTeamBreakdown = async (teamId: string) => {
    try {
      const res = await axios.get(`${API_URL}/teams/${teamId}/breakdown`);
      const items = (res.data || []).map((b: any) => ({
        source: b.source,
        points: b.points,
        comment: b.comment,
        updatedBy: b.updated_by || b.updatedBy,
        createdAt: b.created_at || b.createdAt
      }));
      setTeams(prev => ({
        ...prev,
        [teamId]: prev[teamId] ? { ...prev[teamId], breakdown: items } : prev[teamId]
      }));
    } catch (err) {
      console.error('Failed to refresh team breakdown:', err);
    }
  };

  const updateTeamPoints = async (teamId: string, points: number, source: string, comment?: string, updatedBy?: string) => {
    const actor = updatedBy || userProfile.username || 'admin';
    // Optimistic local state update
    setTeams(prev => {
      const team = prev[teamId];
      if (!team) return prev;
      return {
        ...prev,
        [teamId]: {
          ...team,
          breakdown: [...team.breakdown, { source, points, comment, updatedBy: actor }]
        }
      };
    });

    // Persist to database
    try {
      await axios.post(`${API_URL}/teams/${teamId}/add-points`, { points, source, comment, updated_by: actor });
      console.log(`Points added: ${points} to team ${teamId} for ${source}`);
      await refreshTeamBreakdown(teamId);
    } catch (error) {
      console.error('Failed to persist points to database:', error);
      // On failure, refetch to realign state
      refreshTeamBreakdown(teamId);
    }
  };

  // Create new team
  const createTeam = async (team: Team) => {
    try {
      await axios.post(`${API_URL}/teams`, {
        id: team.id,
        name: team.name,
        logo: team.logo,
        seed: team.seed,
        description: team.description,
        color: team.color
      });

      // Update local state
      setTeams(prev => {
        const updated = {
          ...prev,
          [team.id]: { ...team, breakdown: [] }
        };
        saveTeamsToLocalStorage(updated);
        return updated;
      });

      console.log(`Team ${team.name} created successfully`);
    } catch (error) {
      console.error('Failed to create team:', error);
      throw error;
    }
  };

  // Delete team
  const deleteTeam = async (teamId: string) => {
    try {
      await axios.delete(`${API_URL}/teams/${teamId}`);

      // Update local state
      setTeams(prev => {
        const newTeams = { ...prev };
        delete newTeams[teamId];
        saveTeamsToLocalStorage(newTeams);
        return newTeams;
      });

      console.log(`Team ${teamId} deleted successfully`);
    } catch (error) {
      console.error('Failed to delete team:', error);
      throw error;
    }
  };

  // Create new event
  const createEvent = async (event: Partial<GameEvent>) => {
    try {
      await axios.post(`${API_URL}/events`, {
        id: event.id,
        title: event.title,
        game: event.game,
        short_name: event.shortName,
        image: event.image,
        description: event.description,
        bracket_type: event.bracketType,
        status: 'pending'
      });

      // Update local state with full event structure
      const newEvent: GameEvent = {
        id: event.id!,
        title: event.title!,
        game: event.game || '',
        shortName: event.shortName || '',
        image: event.image || '',
        description: event.description || '',
        bracketType: event.bracketType || 'single',
        matches: [],
        bracket: [],
        details: {
          status: 'Pending',
          prizePool: '₱ 0',
          entryFee: 'FREE',
          format: '5v5',
          brief: event.description || '',
          rules: [],
          schedule: { day: '00', hour: '00', min: '00', sec: '00' }
        },
        teamRecord: { wins: 0, losses: 0 },
        organizer: { name: 'Admin', email: 'admin@iteverse.com' }
      };

      setEvents(prev => [...prev, newEvent]);
      console.log(`Event ${event.title} created successfully`);
    } catch (error) {
      console.error('Failed to create event:', error);
      throw error;
    }
  };

  // Delete event
  const deleteEvent = async (eventId: string) => {
    try {
      await axios.delete(`${API_URL}/events/${eventId}`);

      // Update local state
      setEvents(prev => prev.filter(e => e.id !== eventId));
      setSelectedEvent(prev => (prev?.id === eventId ? null : prev));

      console.log(`Event ${eventId} deleted successfully`);
    } catch (error) {
      console.error('Failed to delete event:', error);
      throw error;
    }
  };

  // Update bracket match (for generic bracket updates)
  const updateBracketMatch = async (matchId: string, p1Score: number | null, p2Score: number | null, status: string) => {
    // This is a generic handler - find the event containing this match
    setEvents(prevEvents => prevEvents.map(evt => ({
      ...evt,
      bracket: evt.bracket.map(m => {
        if (m.id !== matchId) return m;
        const p1Winner = (p1Score !== null && p2Score !== null) ? p1Score > p2Score : false;
        const p2Winner = (p1Score !== null && p2Score !== null) ? p2Score > p1Score : false;
        return {
          ...m,
          status: status as any,
          p1: { ...m.p1, score: p1Score, isWinner: p1Winner },
          p2: { ...m.p2, score: p2Score, isWinner: p2Winner }
        };
      })
    })));
  };

  // Updated to support specific event bracket
  const updateEventBracketMatch = async (eventId: string, matchId: string, p1Score: number | null, p2Score: number | null, status: string) => {
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
            status: status as any,
            p1: { ...m.p1, score: p1Score, isWinner: p1Winner },
            p2: { ...m.p2, score: p2Score, isWinner: p2Winner }
          };
        })
      };
    }));

    // Persist to database
    try {
      await axios.put(`${API_URL}/events/${eventId}/bracket/${matchId}`, {
        p1_score: p1Score,
        p2_score: p2Score,
        p1_is_winner: p1Score !== null && p2Score !== null ? p1Score > p2Score : false,
        p2_is_winner: p1Score !== null && p2Score !== null ? p2Score > p1Score : false,
        status
      });
      console.log(`Bracket match ${matchId} updated`);
    } catch (error) {
      console.error('Failed to persist bracket match:', error);
    }
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
    } else if (teams[appState.selectedTeamId]) {
      bgMode = 'cruise';
      bgColor = teams[appState.selectedTeamId].color;
    }
  }

  // Security Check Logic
  if (!isVerified) {
    return (
      <SecurityCheck onVerified={() => setIsVerified(true)} />
    );
  }

  // Show loading until data is ready
  if (isLoading) {
    return (
      <>
        <CyberBackground mode="static" colorTheme="#7c3aed" />
        <Loader onComplete={handleLoaderComplete} />
      </>
    );
  }

  // Admin Route - Direct access to admin panel
  if (isAdminRoute) {
    if (!userProfile.isAdmin) {
      return (
        <>
          <CyberBackground mode="static" colorTheme="#7c3aed" />
          <LoginView
            currentTeam={teams['t1'] || INITIAL_TEAMS['t1']}
            onLogin={handleLogin}
          />
        </>
      );
    }

    // Admin is logged in, show admin panel directly with a minimal team
    return (
      <>
        <CyberBackground mode="static" colorTheme="#7c3aed" />
        <div className="min-h-screen bg-[#05050a] text-white">
          {teams['t1'] && (
            <AdminPanel
              appState={appState}
              events={events}
              teams={teams}
              bracketData={[]}
              challenges={challenges}
              updateChallenges={async (newChallenges) => {
                setChallenges(newChallenges);
                // Persist challenges to database
                try {
                  await axios.put(`${API_URL}/challenges`, { challenges: newChallenges });
                  console.log('Challenges updated in database');
                } catch (error) {
                  console.error('Failed to persist challenges:', error);
                }
              }}
              updateCountdown={handleCountdownUpdate}
              updateMatchStatus={updateMatchStatus}
              updateMatchStream={updateMatchStream}
              updateMatchResult={updateMatchResult}
              updateEvent={updateEvent}
              updateTeam={updateTeam}
              updateTeamPoints={updateTeamPoints}
              refreshTeamBreakdown={refreshTeamBreakdown}
              createTeam={createTeam}
              deleteTeam={deleteTeam}
              createEvent={createEvent}
              deleteEvent={deleteEvent}
              updateBracketMatch={updateBracketMatch}
              updateEventBracketMatch={updateEventBracketMatch}
              toggleConfetti={triggerConfetti}
              onClose={() => {
                setUserProfile({ ...userProfile, isAdmin: false });
                window.location.href = '/';
              }}
            />
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <CyberBackground mode={bgMode} colorTheme={bgColor} />

      {introStage === 'loader' && (
        <Loader onComplete={handleLoaderComplete} />
      )}

      {showPortal && (
        <div className={`fixed inset-0 z-[50] transition-opacity duration-1000 ease-out ${introStage === 'content' ? 'opacity-0 pointer-events-none hidden' : 'opacity-100'}`}>
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
                </div>
              )}
            </div>
          ) : (
            <DashboardLayout
              currentTeam={teams[appState.selectedTeamId]}
              userProfile={userProfile}
              currentView={appState.currentView}
              onNavigate={handleNavigate}
              onLogoClick={handleReturnToTeamSelect}
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
              </div>

              <EventModal
                event={selectedEvent}
                onClose={() => setSelectedEvent(null)}
                teams={teams}
              />
            </DashboardLayout>
          )}
        </>
      )}
      {/* Always show footer at the bottom of the app */}
      <Footer />
    </>
  );
};

export default App;
