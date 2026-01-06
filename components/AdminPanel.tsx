import React, { useState, useEffect, useRef } from 'react';
import { AppState, GameEvent, Match, Team, BracketMatch, Challenge } from '../types';
import { Settings, PlayCircle, Clock, Save, X, Activity, Trophy, Swords, Tv, Plus, Minus, Edit3, Users, Crown, ChevronRight, LayoutTemplate, Database, Image as ImageIcon, Upload, Link as LinkIcon, Monitor, Youtube, Twitch, Facebook, FileText, Calendar, QrCode, Printer, CheckSquare, Brain, Zap, ScanLine, FileDown, Sparkles, Rocket, Terminal } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { gsap } from 'gsap';
import * as THREE from 'three';

// Normalize image paths so relative uploads work in production
const normalizeImageUrl = (url: string | null | undefined): string => {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/')) return url;
    return `/uploads/${url}`;
};

interface AdminPanelProps {
  appState: AppState;
  events: GameEvent[];
  teams: Record<string, Team>;
  bracketData: any[]; 
  challenges: Challenge[]; 
  updateChallenges: (challenges: Challenge[]) => void; 
  updateCountdown: (date: string) => void;
  updateMatchStatus: (eventId: string, matchId: string, status: Match['status']) => void;
    updateMatchStream: (eventId: string, matchId: string, streamUrl: string) => void;
        updateMatchResult: (eventId: string, matchId: string, data: Partial<{ status: Match['status']; scoreA: number | null; scoreB: number | null; winnerId?: string | null; teamALogo?: string; teamBLogo?: string }>) => void;
    updateTeamPoints: (teamId: string, points: number, source: string, comment?: string, updatedBy?: string) => void;
    refreshTeamBreakdown?: (teamId: string) => Promise<void>;
  updateBracketMatch: (matchId: string, p1Score: number | null, p2Score: number | null, status: string) => void;
  updateEventBracketMatch: (eventId: string, matchId: string, p1Score: number | null, p2Score: number | null, status: string) => void;
  updateEvent?: (eventId: string, updates: Partial<GameEvent>) => void; 
  updateTeam?: (teamId: string, updates: Partial<Team>) => void;
  createTeam?: (team: Team) => Promise<void>;
  deleteTeam?: (teamId: string) => Promise<void>;
  createEvent?: (event: Partial<GameEvent>) => Promise<void>;
  deleteEvent?: (eventId: string) => Promise<void>;
  toggleConfetti: () => void;
  onClose?: () => void;
}

const StreamEditor = ({ match, eventId, onSave }: { match: Match, eventId: string, onSave: (eId: string, mId: string, url: string) => void }) => {
    const [type, setType] = useState<'twitch'|'youtube'|'facebook'|'custom'>('twitch');
    const [val, setVal] = useState('');

    useEffect(() => {
        if (!match.streamUrl) { setVal(''); return; }
        if (match.streamUrl.includes('twitch.tv')) { setType('twitch'); try { const url = new URL(match.streamUrl); const channel = url.searchParams.get('channel'); if (channel) setVal(channel); } catch (e) { setVal(match.streamUrl); } } 
        else if (match.streamUrl.includes('youtube.com') || match.streamUrl.includes('youtu.be')) { setType('youtube'); setVal(match.streamUrl); } 
        else if (match.streamUrl.includes('facebook.com')) { setType('facebook'); try { const url = new URL(match.streamUrl); const href = url.searchParams.get('href'); if (href) setVal(decodeURIComponent(href)); } catch (e) { setVal(match.streamUrl); } } 
        else { setType('custom'); setVal(match.streamUrl); }
    }, [match.streamUrl]);

    const handleSave = () => {
        let finalUrl = val;
        if (!val) { onSave(eventId, match.id, ''); return; }
        if (type === 'twitch') { let channel = val; if(val.includes('twitch.tv/')) channel = val.split('twitch.tv/')[1]?.split('/')[0] || val; finalUrl = `https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}&muted=false`; } 
        else if (type === 'youtube') { let vId = val; if (val.includes('v=')) vId = val.split('v=')[1]?.split('&')[0] || vId; else if (val.includes('youtu.be/')) vId = val.split('youtu.be/')[1]?.split('?')[0] || vId; finalUrl = `https://www.youtube.com/embed/${vId}?autoplay=1`; } 
        else if (type === 'facebook') { finalUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(val)}&show_text=false&t=0`; }
        onSave(eventId, match.id, finalUrl);
    };

    return (
        <div className="bg-black/30 p-5 rounded-lg border border-white/5 space-y-4">
            <div className="flex items-center justify-between"><div className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><Monitor size={14}/> Stream Configuration</div>{match.streamUrl && <span className="text-xs text-green-500 font-bold uppercase tracking-wider">Active</span>}</div>
            <div className="grid grid-cols-4 gap-3">
                <button onClick={() => setType('twitch')} className={`flex flex-col items-center justify-center gap-2 py-3 rounded border transition-all ${type === 'twitch' ? 'bg-[#6441a5]/20 border-[#6441a5] text-[#a970ff]' : 'bg-white/5 border-transparent text-gray-500 hover:text-white'}`}><Twitch size={20} /><span className="text-[10px] font-bold uppercase">Twitch</span></button>
                <button onClick={() => setType('youtube')} className={`flex flex-col items-center justify-center gap-2 py-3 rounded border transition-all ${type === 'youtube' ? 'bg-[#FF0000]/20 border-[#FF0000] text-red-500' : 'bg-white/5 border-transparent text-gray-500 hover:text-white'}`}><Youtube size={20} /><span className="text-[10px] font-bold uppercase">YouTube</span></button>
                <button onClick={() => setType('facebook')} className={`flex flex-col items-center justify-center gap-2 py-3 rounded border transition-all ${type === 'facebook' ? 'bg-[#1877F2]/20 border-[#1877F2] text-[#1877F2]' : 'bg-white/5 border-transparent text-gray-500 hover:text-white'}`}><Facebook size={20} /><span className="text-[10px] font-bold uppercase">Facebook</span></button>
                <button onClick={() => setType('custom')} className={`flex flex-col items-center justify-center gap-2 py-3 rounded border transition-all ${type === 'custom' ? 'bg-white/10 border-white text-white' : 'bg-white/5 border-transparent text-gray-500 hover:text-white'}`}><LinkIcon size={20} /><span className="text-[10px] font-bold uppercase">Embed</span></button>
            </div>
            <div className="flex gap-3">
                <div className="flex-1 relative">
                    <input type="text" value={val} onChange={(e) => setVal(e.target.value)} placeholder="Enter Stream URL/ID" className="w-full bg-black border border-white/10 text-sm text-white py-3 pl-4 pr-10 rounded font-mono focus:border-purple-500 outline-none transition-colors" />
                    {val && <button onClick={() => setVal('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"><X size={14}/></button>}
                </div>
                <button onClick={handleSave} className="bg-green-600 hover:bg-green-500 text-white px-6 rounded text-sm font-bold tracking-wide transition-colors flex items-center gap-2"><Save size={16} /> SAVE</button>
            </div>
        </div>
    );
};

const AdminPanel: React.FC<AdminPanelProps> = ({
    appState, events, teams, bracketData, challenges, updateChallenges,
    updateCountdown, updateMatchStatus, updateMatchStream, updateMatchResult, updateTeamPoints, refreshTeamBreakdown, updateBracketMatch, updateEventBracketMatch, updateEvent, updateTeam, createTeam, deleteTeam, createEvent, deleteEvent, toggleConfetti, onClose
}) => {
  // Start open when onClose is provided (means we're on /admin route)
  const [isOpen, setIsOpen] = useState(!!onClose);
  const [activeTab, setActiveTab] = useState<'general' | 'tournaments' | 'database' | 'challenges' | 'live-arena'>('general');
  const [printMode, setPrintMode] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [lastSync, setLastSync] = useState<Date | null>(null);
    const [showCreateEvent, setShowCreateEvent] = useState(false);
    const [eventDraft, setEventDraft] = useState<{ title: string; game: string; shortName: string; image: string; description: string; bracketType: 'single' | 'double' }>(
        { title: '', game: '', shortName: '', image: '', description: '', bracketType: 'single' }
    );
    const [teamDraft, setTeamDraft] = useState<{ id: string; name: string; color: string; logo: string; seed: number; description: string }>(
        { id: '', name: '', color: '#7c3aed', logo: '', seed: 1, description: '' }
    );
    const [isUploadingGameLogo, setIsUploadingGameLogo] = useState(false);
    const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  
  // Existing States
  const [selectedEventId, setSelectedEventId] = useState<string | null>(events[0]?.id || null);
  const [tournamentSubTab, setTournamentSubTab] = useState<'config' | 'info' | 'bracket' | 'matches'>('config');
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [dateInput, setDateInput] = useState(appState.countdownEnd.slice(0, 16));
  const [pointsInput, setPointsInput] = useState(100);
    const [reasonInput, setReasonInput] = useState('Admin Bonus');
    const [commentInput, setCommentInput] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('t1');

  // Challenge States
  const [editingChallengeId, setEditingChallengeId] = useState<string>('c1');
    const [activeTeamId, setActiveTeamId] = useState<string | null>(null);

  // Live Arena States
  const [liveStreams, setLiveStreams] = useState<any[]>([]);
  const [editingStreamId, setEditingStreamId] = useState<string | null>(null);
  const [streamDraft, setStreamDraft] = useState<any>({
    title: '',
    embed_url: '',
    thumbnail_url: '',
    thumbnail_mode: 'embed',
    game_category: '',
    tournament_id: '',
    status: 'scheduled',
    placement: 'recommended', team1_name: '', team1_logo: '', team1_score: 0, team2_name: '', team2_logo: '', team2_score: 0
  });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isLoadingStreams, setIsLoadingStreams] = useState(false);

    const activeEvent = events.find(e => e.id === selectedEventId);
    const activeChallenge = challenges.find(c => c.id === editingChallengeId);
    const activeTeam = activeTeamId ? teams[activeTeamId] : undefined;

  // Three.js and animation refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const tabContentRef = useRef<HTMLDivElement>(null);

  // Initialize Three.js background
  useEffect(() => {
    if (!canvasRef.current || !isOpen) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current, 
      alpha: true,
      antialias: true 
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    camera.position.z = 5;

    sceneRef.current = scene;

    // Create animated particle field
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 2000;
    const posArray = new Float32Array(particlesCount * 3);
    const colorsArray = new Float32Array(particlesCount * 3);
    
    const colors = [
      new THREE.Color(0x7c3aed), // Purple
      new THREE.Color(0xa855f7), // Light purple
      new THREE.Color(0xec4899), // Pink
      new THREE.Color(0x06b6d4), // Cyan
    ];

    for (let i = 0; i < particlesCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 20;
      posArray[i + 1] = (Math.random() - 0.5) * 20;
      posArray[i + 2] = (Math.random() - 0.5) * 20;
      
      const color = colors[Math.floor(Math.random() * colors.length)];
      colorsArray[i] = color.r;
      colorsArray[i + 1] = color.g;
      colorsArray[i + 2] = color.b;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Create glowing grid
    const gridHelper = new THREE.GridHelper(20, 20, 0x7c3aed, 0x2e1065);
    gridHelper.position.y = -2;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.3;
    scene.add(gridHelper);

    // Create floating holographic panels
    const panelGeometry = new THREE.PlaneGeometry(1, 1);
    const panelMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x7c3aed,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });

    const panels: THREE.Mesh[] = [];
    for (let i = 0; i < 5; i++) {
      const panel = new THREE.Mesh(panelGeometry, panelMaterial.clone());
      panel.position.set(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 5
      );
      panel.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      panels.push(panel);
      scene.add(panel);
    }

        // Track cursor for parallax
        const mouse = { x: 0.5, y: 0.5 };
        const handleMouse = (e: MouseEvent) => {
            mouse.x = e.clientX / window.innerWidth;
            mouse.y = e.clientY / window.innerHeight;
        };
        window.addEventListener('mousemove', handleMouse);

        // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      particlesMesh.rotation.y += 0.0005;
      particlesMesh.rotation.x += 0.0002;

            // Subtle parallax driven by cursor
            const parallaxX = (mouse.x - 0.5) * 0.12;
            const parallaxY = (mouse.y - 0.5) * 0.12;
            camera.position.x += (parallaxX - camera.position.x) * 0.02;
            camera.position.y += (-parallaxY - camera.position.y) * 0.02;
            camera.lookAt(scene.position);

      panels.forEach((panel, i) => {
        panel.rotation.x += 0.001 * (i + 1);
        panel.rotation.y += 0.001 * (i + 1);
        panel.position.y += Math.sin(Date.now() * 0.001 + i) * 0.001;
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouse);
      renderer.dispose();
      particlesGeometry.dispose();
      particlesMaterial.dispose();
      panelGeometry.dispose();
      panels.forEach(panel => panel.geometry.dispose());
    };
  }, [isOpen]);

  // GSAP entrance animation
  useEffect(() => {
    if (isOpen && panelRef.current) {
      gsap.from(panelRef.current, {
        scale: 0.8,
        opacity: 0,
        duration: 0.6,
        ease: 'elastic.out(1, 0.75)',
      });
    }
  }, [isOpen]);

    // Default select a team when data arrives
    useEffect(() => {
        if (!activeTeamId && Object.values(teams)[0]) {
            const firstTeam = Object.values(teams)[0] as Team;
            setActiveTeamId(firstTeam.id);
            setEditingTeamId(firstTeam.id);
        }
    }, [teams, activeTeamId]);

    // Live sync indicator bumps when data changes
    useEffect(() => {
        if (events || teams || challenges || appState) {
            setLastSync(new Date());
            if (panelRef.current) {
                gsap.fromTo(
                    panelRef.current,
                    { boxShadow: '0 0 0 rgba(124,58,237,0)' },
                    { boxShadow: '0 0 40px rgba(124,58,237,0.35)', duration: 0.4, ease: 'power2.out' }
                );
            }
        }
    }, [events, teams, challenges, appState]);

  // GSAP tab transition animation
  useEffect(() => {
    if (tabContentRef.current) {
      gsap.from(tabContentRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.4,
        ease: 'power2.out',
      });
    }
  }, [activeTab]);

  // Fetch live streams when tab opens
  useEffect(() => {
    if (activeTab === 'live-arena') {
      fetchLiveStreams();
      
            // Set up WebSocket listener for real-time updates (respect HTTPS)
            try {
                const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
                const ws = new WebSocket(`${wsProtocol}://${window.location.host}/api/ws`);
        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            if (message.type?.includes('live_stream')) {
              console.log('🔄 Live stream updated via WebSocket, refreshing...');
              fetchLiveStreams();
            }
          } catch (err) {
            console.error('WebSocket message error:', err);
          }
        };
        return () => ws.close();
      } catch (err) {
        console.warn('WebSocket failed for admin panel');
      }
    }
  }, [activeTab]);

  // Fetch live streams from API
  const fetchLiveStreams = async () => {
    setIsLoadingStreams(true);
    try {
      const response = await fetch('/api/live-streams');
      if (response.ok) {
        const data = await response.json();
        setLiveStreams(data);
        console.log('✅ Fetched live streams:', data.length);
      } else {
        console.error('Failed to fetch live streams');
      }
    } catch (error) {
      console.error('Error fetching live streams:', error);
    } finally {
      setIsLoadingStreams(false);
    }
  };

  // Floating button animation
  useEffect(() => {
    const button = document.querySelector('.admin-floating-button');
    if (button && !isOpen) {
      gsap.to(button, {
        y: -10,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
      });
    }
  }, [isOpen]);

  // Card hover animation helper
  const handleCardHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    gsap.to(card, {
      scale: 1.02,
      y: -5,
      boxShadow: '0 20px 60px rgba(124, 58, 237, 0.4)',
      duration: 0.3,
      ease: 'power2.out',
    });
  };

  const handleCardLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    gsap.to(card, {
      scale: 1,
      y: 0,
      boxShadow: '0 0 0 rgba(124, 58, 237, 0)',
      duration: 0.3,
      ease: 'power2.out',
    });
  };

    const formatTimeAgo = (date?: Date | null) => {
        if (!date) return 'waiting';
        const diff = Math.floor((Date.now() - date.getTime()) / 1000);
        if (diff < 5) return 'just now';
        if (diff < 60) return `${diff}s ago`;
        const m = Math.floor(diff / 60);
        if (m < 60) return `${m}m ago`;
        const h = Math.floor(m / 60);
        return `${h}h ago`;
    };

  // Helper for Tournament Detail Update
  const updateEventDetail = (key: string, value: any) => {
      if (!activeEvent || !updateEvent) return;
      updateEvent(activeEvent.id, {
          details: {
              ...activeEvent.details,
              [key]: value
          }
      });
  };

  const handleChallengeUpdate = (key: keyof Challenge, value: string | number) => {
      updateChallenges(challenges.map(c => c.id === editingChallengeId ? { ...c, [key]: value } : c));
  };

  const createChallenge = () => {
      const newId = `c${challenges.length + 1}`;
      updateChallenges([...challenges, { id: newId, title: 'New Challenge', description: '', question: '', answer: '', points: 100 }]);
      setEditingChallengeId(newId);
  };

  // Live Stream Functions
  const saveStream = async () => {
    if (!streamDraft.title.trim() || !streamDraft.embed_url.trim()) {
      alert('Title and embed URL are required');
      return;
    }

    try {
      const payload = {
        ...streamDraft,
        thumbnail_url: thumbnailFile ? await fileToBase64(thumbnailFile) : streamDraft.thumbnail_url
      };

      if (editingStreamId && editingStreamId !== 'new') {
        // Update existing stream
        const response = await fetch(`/api/live-streams/${editingStreamId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (response.ok) {
          await fetchLiveStreams(); // Refresh list
          alert('Stream updated successfully!');
          console.log('✅ Stream updated and synced');
        } else {
          const error = await response.text();
          console.error('Failed to update stream:', error);
          alert('Failed to update stream: ' + error);
        }
      } else {
        // Create new stream
        const response = await fetch('/api/live-streams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (response.ok) {
          await fetchLiveStreams(); // Refresh list
          alert('Stream created successfully!');
          console.log('✅ Stream created and synced');
          // Reset form
          setEditingStreamId(null);
          setStreamDraft({
            title: '',
            embed_url: '',
            thumbnail_url: '',
            thumbnail_mode: 'embed',
            game_category: '',
            tournament_id: '',
            status: 'scheduled',
            placement: ['recommended'], team1_name: '', team1_logo: '', team1_score: 0, team2_name: '', team2_logo: '', team2_score: 0,
            description: ''
          });
          setThumbnailFile(null);
        } else {
          const error = await response.text();
          console.error('Failed to create stream:', error);
          alert('Failed to create stream: ' + error);
        }
      }
    } catch (error) {
      console.error('Error saving stream:', error);
      alert('Failed to save stream: ' + (error as Error).message);
    }
  };

  const deleteStream = async () => {
    if (!editingStreamId || !window.confirm('Are you sure you want to delete this stream?')) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/live-streams/${editingStreamId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await fetchLiveStreams(); // Refresh list
        setEditingStreamId(null);
        alert('Stream deleted successfully!');
        console.log('✅ Stream deleted and synced');
      } else {
        const error = await response.text();
        console.error('Failed to delete stream:', error);
        alert('Failed to delete stream: ' + error);
      }
    } catch (error) {
      console.error('Error deleting stream:', error);
      alert('Failed to delete stream: ' + (error as Error).message);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };
  const handleCreateEvent = async () => {
      if (!createEvent) return;
      const newId = eventDraft.shortName || eventDraft.title.replace(/\s+/g, '-').toLowerCase() || `evt-${Date.now()}`;
      if (!eventDraft.title || !eventDraft.game) {
          alert('Title and game are required');
          return;
      }
      await createEvent({
          id: newId,
          title: eventDraft.title,
          game: eventDraft.game,
          shortName: eventDraft.shortName || newId,
          image: eventDraft.image,
          description: eventDraft.description,
          bracketType: eventDraft.bracketType,
      });
      setSelectedEventId(newId);
      setShowCreateEvent(false);
      setEventDraft({ title: '', game: '', shortName: '', image: '', description: '', bracketType: 'single' });
    };

    const handleDeleteEvent = async () => {
            if (!deleteEvent || !activeEvent) return;
            const confirmation = window.confirm(`Delete event "${activeEvent.title}"? This will remove its matches and bracket data.`);
            if (!confirmation) return;
            const nextEventId = events.find(e => e.id !== activeEvent.id)?.id || null;
            await deleteEvent(activeEvent.id);
            setSelectedEventId(nextEventId);
            setTournamentSubTab('config');
    };

  const handleCreateTeam = async () => {
      if (!createTeam) return;
      const newId = teamDraft.id || `t${Object.keys(teams).length + 1}`;
      if (!teamDraft.name.trim()) {
          alert('Team name is required');
          return;
      }
      await createTeam({
          id: newId,
          name: teamDraft.name,
          logo: teamDraft.logo || '🎮',
          seed: Number(teamDraft.seed) || 1,
          description: teamDraft.description,
          color: teamDraft.color,
          breakdown: [],
      } as Team);
      setActiveTeamId(newId);
      setTeamDraft({ id: '', name: '', color: '#7c3aed', logo: '', seed: 1, description: '' });
    };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && updateTeam && activeTeamId) {
        try {
            // Validate file size (max 2MB for image)
            const MAX_SIZE = 2 * 1024 * 1024; // 2MB
            if (file.size > MAX_SIZE) {
                alert('Image too large! Max 2MB. Please compress and try again.');
                return;
            }

            // Validate file type
            const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                alert('Invalid image format. Please use JPG, PNG, GIF, or WebP.');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = reader.result as string;
                
                // Check if base64 string is complete (should start with "data:image/")
                if (!base64.startsWith('data:image/')) {
                    throw new Error('Invalid image data format');
                }

                // Warn if image is very large
                if (base64.length > 1000000) {
                    console.warn('⚠️ Large image detected. Consider compressing for better performance.');
                }

                console.log('📸 Logo uploaded successfully');
                console.log(`📊 Image size: ${(base64.length / 1024).toFixed(2)} KB`);

                // Save to database immediately - this will trigger real-time sync
                await updateTeam(activeTeamId, { logo: base64 });
                
                // ALSO save to localStorage for persistence on refresh
                try {
                    const savedTeams = JSON.parse(localStorage.getItem('iteverse_teams') || '{}');
                    if (savedTeams[activeTeamId]) {
                        savedTeams[activeTeamId].logo = base64;
                        localStorage.setItem('iteverse_teams', JSON.stringify(savedTeams));
                        console.log('💾 Logo saved to localStorage - will persist on refresh');
                    }
                } catch (err) {
                    console.warn('⚠️ Could not save logo to localStorage:', err);
                }

                console.log('🔄 Broadcasting to all connected users via WebSocket...');
            };
            
            reader.onerror = () => {
                throw new Error('Failed to read file');
            };
            
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Failed to upload logo:', error);
            alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
  };

    const handleGameLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeEvent || !updateEvent) return;

        const allowedTypes = [
            'image/png',
            'image/jpeg',
            'image/webp',
            'image/svg+xml',
            'image/x-icon',
            'image/vnd.microsoft.icon'
        ];

        if (!allowedTypes.includes(file.type)) {
            alert('Please upload SVG, ICO, PNG, JPG, or WEBP files for the game logo.');
            e.target.value = '';
            return;
        }

        const MAX_SIZE = 5 * 1024 * 1024; // 5MB ceiling for logos
        if (file.size > MAX_SIZE) {
            alert('Logo too large. Max 5MB.');
            e.target.value = '';
            return;
        }

        setIsUploadingGameLogo(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Upload failed');
            }
            const data = await res.json();
            if (data.url) {
                await updateEvent(activeEvent.id, { gameLogo: data.url });
            }
        } catch (err) {
            console.error('Failed to upload game logo:', err);
            alert(`Game logo upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setIsUploadingGameLogo(false);
            e.target.value = '';
        }
    };

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeEvent || !updateEvent) return;

        const allowedTypes = [
            'image/png',
            'image/jpeg',
            'image/webp',
            'image/jpg',
            'image/svg+xml',
            'image/x-icon',
            'image/vnd.microsoft.icon'
        ];

        if (!allowedTypes.includes(file.type)) {
            alert('Please upload PNG, JPG, WEBP, SVG, or ICO files for the banner.');
            e.target.value = '';
            return;
        }

        const MAX_SIZE = 10 * 1024 * 1024; // 10MB for banners
        if (file.size > MAX_SIZE) {
            alert('Banner too large. Max 10MB.');
            e.target.value = '';
            return;
        }

        setIsUploadingBanner(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Upload failed');
            }
            const data = await res.json();
            if (data.url) {
                await updateEvent(activeEvent.id, { image: data.url });
                console.log('✅ Banner uploaded successfully:', data.url);
            }
        } catch (err) {
            console.error('Failed to upload banner:', err);
            alert(`Banner upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setIsUploadingBanner(false);
            e.target.value = '';
        }
    };

  // OPEN PRINT STUDIO (Persistent)
  const openPrintStudio = () => {
      setPrintMode(true);
  };

  // EXECUTE PDF DOWNLOAD
  const executePrint = async () => {
      if (isGeneratingPdf) return;
      setIsGeneratingPdf(true);

      const cardElement = document.getElementById('printable-card');
      if (cardElement) {
          try {
              // Increase scale for better resolution
              const canvas = await html2canvas(cardElement, {
                  scale: 4, // High Res
                  backgroundColor: '#000000',
                  useCORS: true,
                  logging: false
              });

              const imgData = canvas.toDataURL('image/png');
              
              // A6 dimensions in mm: 105 x 148
              const pdf = new jsPDF({
                  orientation: 'portrait',
                  unit: 'mm',
                  format: 'a6'
              });

              pdf.addImage(imgData, 'PNG', 0, 0, 105, 148);
              pdf.save(`ITVERSE_MISSION_${activeChallenge?.id.toUpperCase()}.pdf`);
          } catch (error) {
              console.error("PDF Generation Failed:", error);
              alert("Failed to generate PDF. Please try again.");
          }
      }
      setIsGeneratingPdf(false);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-[999] bg-black/80 backdrop-blur-md border border-purple-500 text-purple-400 p-4 rounded-full hover:bg-purple-900/50 hover:text-white transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] group"
      >
        <Settings size={28} className="group-hover:rotate-90 transition-transform duration-500" />
      </button>
    );
  }

  return (
    <>
      {/* Three.js Canvas Background */}
      {isOpen && (
        <canvas
          ref={canvasRef}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 999,
            pointerEvents: 'none',
          }}
        />
      )}

    {/* PERSISTENT PRINT STUDIO OVERLAY */}
    {printMode && activeChallenge && (
        <div className="print-overlay fixed inset-0 z-[1000] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center font-sans overflow-hidden">
            
            {/* --- CONTROLS BAR (Hidden on Print) --- */}
            <div className="print-controls fixed top-0 w-full p-6 flex justify-between items-center z-[1001] bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-4">
                    <div className="text-white font-cyber font-black text-2xl tracking-widest animate-pulse">PRINT STUDIO</div>
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest border border-white/10 px-2 py-1 rounded">A6 FORMAT // 300DPI</span>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={executePrint} 
                        disabled={isGeneratingPdf}
                        className="bg-white hover:bg-gray-200 text-black font-bold px-8 py-3 rounded-full flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGeneratingPdf ? (
                            <><Activity className="animate-spin" size={20} /> GENERATING PDF...</>
                        ) : (
                            <><FileDown size={20} /> DOWNLOAD CARD (PDF)</>
                        )}
                    </button>
                    <button onClick={() => setPrintMode(false)} className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all">
                        <X size={24} />
                    </button>
                </div>
            </div>

            {/* --- THE LEGENDARY CARD (Vertical) --- */}
            <div className="relative transform-gpu transition-all duration-500 scale-[0.8] md:scale-100 hover:scale-[1.02] shadow-[0_0_100px_rgba(124,58,237,0.3)]">
                
                {/* CARD CONTAINER: 105mm x 148mm (A6) */}
                <div 
                    id="printable-card"
                    className="relative w-[105mm] h-[148mm] bg-[#05050a] overflow-hidden flex flex-col justify-between box-border border-[8px] border-[#7c3aed] relative"
                >
                    
                    {/* Background Glitch Noise - Multi-Team Colored Static */}
                    <div className="absolute inset-0 bg-[#0f0518] z-0"></div>
                    <div 
                        className="absolute inset-0 z-0 opacity-20"
                        style={{
                            backgroundImage: `repeating-linear-gradient(
                                45deg,
                                #2e1065 0px,
                                #2e1065 10px,
                                #eab308 10px, /* Yellow T1 */
                                #eab308 12px,
                                #2e1065 12px,
                                #2e1065 22px,
                                #06b6d4 22px, /* Cyan T2 */
                                #06b6d4 24px,
                                #2e1065 24px,
                                #2e1065 34px,
                                #ef4444 34px, /* Red T4 */
                                #ef4444 36px,
                                #2e1065 36px,
                                #2e1065 46px,
                                #00f0b5 46px, /* Green T3 */
                                #00f0b5 48px
                            )`
                        }}
                    ></div>
                    {/* Vertical Scanlines for interference */}
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,#000_2px,#000_4px)] opacity-40 z-0"></div>
                    
                    {/* Glow Blobs */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/40 blur-[80px] rounded-full z-0"></div>
                    <div className="absolute bottom-20 left-0 w-48 h-48 bg-cyan-600/40 blur-[80px] rounded-full z-0"></div>

                    {/* --- HEADER: IT-VERSE --- */}
                    <div className="h-[40mm] w-full flex flex-col justify-center items-center relative z-10 pt-4">
                        <div className="relative inline-block whitespace-nowrap">
                            {/* Static Chromatic Aberration - Layer 1 (Red) */}
                            <span className="absolute top-0 left-[-3px] font-cyber font-black text-6xl tracking-widest text-[#ff003c] opacity-70 mix-blend-screen select-none w-full text-center">IT-VERSE</span>
                            {/* Static Chromatic Aberration - Layer 2 (Cyan) */}
                            <span className="absolute top-0 left-[3px] font-cyber font-black text-6xl tracking-widest text-[#00f0ff] opacity-70 mix-blend-screen select-none w-full text-center">IT-VERSE</span>
                            {/* Main Text (White) */}
                            <span className="relative font-cyber font-black text-6xl tracking-widest text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.9)]">IT-VERSE</span>
                        </div>
                    </div>

                    {/* --- CENTER: QR CODE --- */}
                    <div className="flex-1 w-full flex items-center justify-center relative z-10 p-2">
                        {/* Reality Breach Frame */}
                        <div className="relative p-3 bg-white shadow-[0_0_60px_rgba(124,58,237,0.5)] border-4 border-purple-500">
                            {/* Distortion Bars */}
                            <div className="absolute -left-6 top-8 w-12 h-2 bg-purple-600 skew-x-[-20deg]"></div>
                            <div className="absolute -right-6 bottom-8 w-12 h-2 bg-cyan-500 skew-x-[-20deg]"></div>
                            <div className="absolute left-8 -top-3 w-2 h-8 bg-yellow-500 skew-y-[-20deg]"></div>
                            <div className="absolute right-8 -bottom-3 w-2 h-8 bg-red-500 skew-y-[-20deg]"></div>

                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=CHALLENGE:${activeChallenge.id}&color=000000&bgcolor=ffffff&margin=0`} 
                                className="w-44 h-44 rendering-pixelated mix-blend-normal block" 
                                style={{ imageRendering: 'pixelated' }}
                                alt="QR" 
                            />
                        </div>
                    </div>

                    {/* --- FOOTER: PROBLEM NAME --- */}
                    <div className="h-[40mm] w-full flex flex-col justify-center items-center px-4 relative z-10 text-center bg-white border-t-[6px] border-purple-600">
                        <div className="w-full py-4">
                            <div className="text-[10px] font-mono font-bold text-purple-900 uppercase tracking-[0.5em] mb-2 block">MISSION_OBJECTIVE</div>
                            {/* Problem Name - Bold and Glitchy */}
                            <div className="relative w-full">
                                <div className="font-cyber font-black text-4xl text-black uppercase tracking-wider leading-none break-words w-full px-2">
                                    {activeChallenge.title}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Decorative "Cuts" */}
                    <div className="absolute top-[28%] left-0 w-6 h-1.5 bg-cyan-400 z-20 shadow-[0_0_10px_cyan]"></div>
                    <div className="absolute top-[30%] left-0 w-3 h-1.5 bg-yellow-400 z-20"></div>
                    <div className="absolute bottom-[28%] right-0 w-6 h-1.5 bg-red-500 z-20 shadow-[0_0_10px_red]"></div>
                    <div className="absolute bottom-[30%] right-0 w-3 h-1.5 bg-purple-500 z-20"></div>

                </div>
            </div>
        </div>
    )}

    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 backdrop-blur-lg p-4 animate-in fade-in zoom-in duration-300 font-sans admin-container">
      <div 
        ref={panelRef}
        className="w-full max-w-[95vw] h-[95vh] bg-[#05050a] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden relative"
      >
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:40px_40px] pointer-events-none"></div>

        <div className="bg-[#0a0a0f] p-6 flex justify-between items-center border-b border-white/10 shrink-0 relative z-10">
            <div className="flex items-center gap-6 min-w-0">
                <div className="p-3 bg-purple-500/20 rounded-lg border border-purple-500/50 shrink-0"><Settings className="text-purple-400 animate-spin-slow" size={28} /></div>
                <div className="min-w-0"><h2 className="text-3xl font-bold text-white font-cyber tracking-widest truncate">SYSTEM ADMIN</h2><div className="text-xs text-gray-500 font-mono flex items-center gap-2 mt-1"><span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span> ONLINE // V2.0.4</div></div>
            </div>
            <div className="flex items-center gap-3">
                <div className="px-3 py-2 rounded-full bg-green-900/20 border border-green-500/30 text-green-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2"><Activity size={14}/> Live Sync</div>
                <div className="text-[11px] text-gray-500 font-mono">Updated {formatTimeAgo(lastSync)}</div>
                <button
                    onClick={() => { setIsOpen(false); if (onClose) onClose(); }}
                    className="w-14 h-14 flex items-center justify-center rounded-full bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-500 border border-white/5 transition-colors shrink-0 ml-4"
                    aria-label="Close Admin Panel"
                >
                    <X size={32} />
                </button>
            </div>
        </div>

        <div className="flex border-b border-white/10 shrink-0 bg-[#0a0a0f] relative z-10 overflow-x-auto">
            {[
                { id: 'general', label: 'Dashboard', icon: Activity }, 
                { id: 'tournaments', label: 'Tournament Manager', icon: Trophy }, 
                { id: 'database', label: 'Faction Database', icon: Database },
                { id: 'live-arena', label: 'Live Arena', icon: Tv },
                { id: 'challenges', label: 'Challenge Architect', icon: QrCode }
            ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-10 py-6 flex items-center gap-3 text-base font-bold uppercase tracking-widest transition-all relative whitespace-nowrap ${activeTab === tab.id ? 'text-white bg-white/5' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}><tab.icon size={18} />{tab.label}{activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500 shadow-[0_0_10px_#a855f7]"></div>}</button>
            ))}
        </div>

        <div ref={tabContentRef} className="flex-1 overflow-hidden relative z-10">
            {/* ... (Previous tabs omitted for brevity, logic remains same) ... */}
            {activeTab === 'general' && (
                <div className="p-10 h-full overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div 
                      className="bg-[#111] border border-white/10 rounded-xl p-8 relative overflow-hidden group cursor-pointer"
                      onMouseEnter={handleCardHover}
                      onMouseLeave={handleCardLeave}
                    >
                      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity"><Clock size={120} /></div><h3 className="text-purple-400 font-bold font-cyber text-2xl mb-8 flex items-center gap-3">GLOBAL_TIMER</h3><div className="space-y-6"><label className="text-sm text-gray-500 font-bold uppercase tracking-widest">Target Date & Time</label><input type="datetime-local" value={dateInput} onChange={(e) => setDateInput(e.target.value)} className="w-full bg-black border border-white/20 text-white p-5 rounded-lg font-mono text-lg focus:border-purple-500 focus:outline-none transition-colors" /><button onClick={() => updateCountdown(new Date(dateInput).toISOString())} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-5 rounded-lg transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)] uppercase tracking-widest text-base">Sync Chronometer</button></div>
                    </div>
                    <div 
                      className="bg-[#111] border border-white/10 rounded-xl p-8 relative overflow-hidden group cursor-pointer"
                      onMouseEnter={handleCardHover}
                      onMouseLeave={handleCardLeave}
                    >
                      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity"><Plus size={120} /></div><h3 className="text-yellow-400 font-bold font-cyber text-2xl mb-8 flex items-center gap-3">QUICK_POINTS</h3><div className="space-y-6"><div className="grid grid-cols-2 gap-6"><div><label className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2 block">Faction</label><select value={selectedTeamId} onChange={(e) => setSelectedTeamId(e.target.value)} className="w-full bg-black border border-white/20 text-white p-4 rounded-lg font-mono text-base focus:border-yellow-500 outline-none">{(Object.values(teams) as Team[]).map((t: Team) => (<option key={t.id} value={t.id}>{t.name}</option>))}</select></div><div><label className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2 block">Amount</label><input type="number" value={pointsInput} onChange={(e) => setPointsInput(parseInt(e.target.value))} className="w-full bg-black border border-white/20 text-white p-4 rounded-lg font-mono text-base focus:border-yellow-500 outline-none" /></div></div><div><label className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2 block">Reference</label><input type="text" value={reasonInput} onChange={(e) => setReasonInput(e.target.value)} className="w-full bg-black border border-white/20 text-white p-4 rounded-lg font-mono text-base focus:border-yellow-500 outline-none" placeholder="e.g. Scavenger Hunt" /></div><div><label className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2 block">Comment (optional)</label><input type="text" value={commentInput} onChange={(e) => setCommentInput(e.target.value)} className="w-full bg-black border border-white/20 text-white p-4 rounded-lg font-mono text-base focus:border-yellow-500 outline-none" placeholder="Internal note" /></div><button onClick={() => updateTeamPoints(selectedTeamId, pointsInput, reasonInput, commentInput || undefined)} className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-4 rounded-lg transition-all shadow-[0_0_20px_rgba(234,179,8,0.3)] uppercase tracking-widest text-base flex items-center justify-center gap-2"><Save size={18} /> Transaction Commit</button></div>
                    </div>
                    <div 
                      className="md:col-span-2 bg-[#111] border border-white/10 rounded-xl p-8 flex items-center justify-between cursor-pointer"
                      onMouseEnter={handleCardHover}
                      onMouseLeave={handleCardLeave}
                    >
                      <div><h3 className="text-pink-400 font-bold font-cyber text-2xl mb-2">LIVE FX CONTROL</h3><p className="text-gray-500 text-sm font-mono">Trigger global particle systems and celebration effects.</p></div><button onClick={toggleConfetti} className="bg-pink-900/20 border border-pink-500/50 text-pink-400 hover:bg-pink-500 hover:text-white px-10 py-4 rounded-lg font-bold text-base transition-all uppercase tracking-widest flex items-center gap-3"><PlayCircle size={22} /> Deploy Confetti</button>
                    </div>
                </div>
            )}

            {/* --- DATABASE TAB --- */}
            {activeTab === 'database' && (
                <div className="flex h-full">
                    <div className="w-80 bg-[#0c0c12] border-r border-white/10 flex flex-col shrink-0">
                        <div className="p-6 border-b border-white/10 bg-[#111] flex items-center justify-between">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Factions</h3>
                            <button onClick={() => {
                                const firstTeam = Object.values(teams)[0] as Team | undefined;
                                setActiveTeamId(firstTeam?.id || null);
                            }} className="text-xs text-purple-400 hover:text-white">Refresh</button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {(Object.values(teams) as Team[]).map((team: Team) => (
                                <button key={team.id} onClick={() => { setActiveTeamId(team.id); setEditingTeamId(team.id); }} className={`w-full text-left p-5 border-b border-white/5 hover:bg-white/5 transition-all group ${activeTeamId === team.id ? 'bg-purple-900/20 border-l-4 border-l-purple-500 pl-4' : 'border-l-4 border-l-transparent'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg overflow-hidden flex-shrink-0" style={{ backgroundColor: `${team.color}22` }}>
                                            {team.logo && team.logo.startsWith('data:image/') ? (
                                                <img src={team.logo} alt={team.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span>{team.logo || '🎮'}</span>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-bold text-white text-base truncate group-hover:text-purple-300 transition-colors">{team.name}</div>
                                            <div className="text-[11px] text-gray-500 font-mono">Seed #{team.seed}</div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <div className="p-6 border-t border-white/10 bg-[#0f0f16] space-y-3">
                            <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">Create Team</div>
                            <input value={teamDraft.name} onChange={(e) => setTeamDraft({ ...teamDraft, name: e.target.value })} placeholder="Name" className="w-full bg-black border border-white/10 text-white p-3 rounded text-sm focus:border-purple-500 outline-none" />
                            <input value={teamDraft.id} onChange={(e) => setTeamDraft({ ...teamDraft, id: e.target.value })} placeholder="ID (optional)" className="w-full bg-black border border-white/10 text-white p-3 rounded text-sm focus:border-purple-500 outline-none" />
                            <input value={teamDraft.color} onChange={(e) => setTeamDraft({ ...teamDraft, color: e.target.value })} type="color" className="w-full bg-black border border-white/10 text-white p-3 rounded text-sm focus:border-purple-500 outline-none h-11" />
                            <input value={teamDraft.seed} onChange={(e) => setTeamDraft({ ...teamDraft, seed: parseInt(e.target.value) || 1 })} type="number" min={1} className="w-full bg-black border border-white/10 text-white p-3 rounded text-sm focus:border-purple-500 outline-none" />
                            <textarea value={teamDraft.description} onChange={(e) => setTeamDraft({ ...teamDraft, description: e.target.value })} placeholder="Description" className="w-full bg-black border border-white/10 text-white p-3 rounded text-sm focus:border-purple-500 outline-none resize-none" />
                            <button onClick={handleCreateTeam} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded uppercase tracking-widest text-sm flex items-center justify-center gap-2"><Plus size={16}/> Save Team</button>
                        </div>
                    </div>

                    <div className="flex-1 bg-[#05050a] p-10 overflow-y-auto">
                        {activeTeam ? (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-8">
                                    <div className="bg-[#111] p-8 rounded-xl border border-white/10 space-y-6" onMouseEnter={handleCardHover} onMouseLeave={handleCardLeave}>
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-purple-400 font-bold font-cyber text-2xl flex items-center gap-3"><Users size={22}/> Team Profile</h3>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">Live • {formatTimeAgo(lastSync)}</div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2 block">Name</label>
                                                <input value={activeTeam.name} onChange={(e) => updateTeam && updateTeam(activeTeam.id, { name: e.target.value })} className="w-full bg-black border border-white/20 text-white p-4 rounded-lg font-bold text-base focus:border-purple-500 outline-none" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2 block">Seed</label>
                                                <input type="number" value={activeTeam.seed} onChange={(e) => updateTeam && updateTeam(activeTeam.id, { seed: parseInt(e.target.value) || 1 })} className="w-full bg-black border border-white/20 text-white p-4 rounded-lg font-mono text-base focus:border-purple-500 outline-none" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2 block">Color</label>
                                                <input type="color" value={activeTeam.color} onChange={(e) => updateTeam && updateTeam(activeTeam.id, { color: e.target.value })} className="w-full bg-black border border-white/20 text-white p-3 rounded-lg h-14 focus:border-purple-500 outline-none" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2 block">Logo (Emoji or Image URL)</label>
                                                <div className="space-y-3">
                                                    <div className="flex gap-2">
                                                        <input 
                                                            value={
                                                                activeTeam.logo && activeTeam.logo.startsWith('data:') 
                                                                    ? '✓ Image Uploaded' 
                                                                    : (activeTeam.logo || '')
                                                            }
                                                            onChange={(e) => {
                                                                const val = e.target.value.trim();
                                                                // Only update if not showing the "Image Uploaded" state
                                                                if (!val.includes('✓')) {
                                                                    updateTeam && updateTeam(activeTeam.id, { logo: val || activeTeam.logo });
                                                                }
                                                            }}
                                                            placeholder="🎮 Emoji or https://example.com/logo.png"
                                                            className="flex-1 bg-black border border-white/20 text-white p-4 rounded-lg text-sm focus:border-purple-500 outline-none" 
                                                        />
                                                        <label className="bg-purple-600 hover:bg-purple-500 border border-purple-500 px-4 py-3 rounded-lg text-white text-xs font-bold cursor-pointer transition-colors whitespace-nowrap">
                                                            📤 Upload
                                                            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                                                        </label>
                                                    </div>
                                                    {activeTeam.logo && (
                                                        <div className="w-full h-32 bg-gradient-to-br from-purple-900/20 to-black/80 border border-purple-500/50 rounded-lg flex items-center justify-center overflow-hidden">
                                                            {activeTeam.logo.startsWith('data:image/') ? (
                                                                <img 
                                                                    src={activeTeam.logo} 
                                                                    alt="Team Logo" 
                                                                    className="w-full h-full object-contain p-2" 
                                                                    onError={(e) => {
                                                                        console.error('Image failed to load:', e);
                                                                        e.currentTarget.style.display = 'none';
                                                                        e.currentTarget.parentElement?.appendChild(
                                                                            Object.assign(document.createElement('div'), {
                                                                                textContent: '⚠️ Image corrupted',
                                                                                className: 'text-xs text-red-500 text-center'
                                                                            })
                                                                        );
                                                                    }}
                                                                />
                                                            ) : activeTeam.logo.startsWith('http') ? (
                                                                <img 
                                                                    src={activeTeam.logo} 
                                                                    alt="Team Logo" 
                                                                    className="w-full h-full object-contain p-2"
                                                                    onError={(e) => {
                                                                        e.currentTarget.style.display = 'none';
                                                                    }}
                                                                />
                                                            ) : (
                                                                <div className="flex flex-col items-center justify-center gap-2">
                                                                    <div className="text-4xl">{activeTeam.logo}</div>
                                                                    {activeTeam.logo.length > 30 && (
                                                                        <div className="text-[10px] text-red-500 font-mono max-w-28 text-center break-all">
                                                                            ⚠️ Invalid: {activeTeam.logo.substring(0, 20)}...
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    <div className="text-[10px] text-green-600 font-mono">✓ Auto-saves to database</div>
                                                </div>
                                            </div>
                                            <div className="col-span-2">
                                                <label className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2 block">Description</label>
                                                <textarea value={activeTeam.description} onChange={(e) => updateTeam && updateTeam(activeTeam.id, { description: e.target.value })} className="w-full h-28 bg-black border border-white/20 text-white p-4 rounded-lg text-sm focus:border-purple-500 outline-none resize-none" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-[#111] p-8 rounded-xl border border-white/10" onMouseEnter={handleCardHover} onMouseLeave={handleCardLeave}>
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-yellow-400 font-bold font-cyber text-2xl flex items-center gap-3"><Crown size={22}/> Points & Breakdown</h3>
                                            {(() => {
                                                const total = activeTeam.breakdown?.reduce((s, b) => s + b.points, 0) ?? 0;
                                                return (
                                                    <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                                                        <span>Total: {total} pts</span>
                                                        <button onClick={() => total !== 0 && updateTeamPoints(activeTeam.id, -total, 'reset to zero', 'reset to zero')} className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10">Reset</button>
                                                        {refreshTeamBreakdown && (
                                                            <button onClick={() => refreshTeamBreakdown(activeTeam.id)} className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10">Refresh Logs</button>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="text-[11px] uppercase text-gray-600 font-bold block mb-2">Amount</label>
                                                <input type="number" value={pointsInput} onChange={(e) => setPointsInput(parseInt(e.target.value))} className="w-full bg-black border border-white/20 text-white p-3 rounded font-mono text-sm focus:border-purple-500 outline-none" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="text-[11px] uppercase text-gray-600 font-bold block mb-2">Reason</label>
                                                <input value={reasonInput} onChange={(e) => setReasonInput(e.target.value)} className="w-full bg-black border border-white/20 text-white p-3 rounded font-mono text-sm focus:border-purple-500 outline-none" />
                                            </div>
                                            <div className="md:col-span-3">
                                                <label className="text-[11px] uppercase text-gray-600 font-bold block mb-2">Comment (optional)</label>
                                                <input value={commentInput} onChange={(e) => setCommentInput(e.target.value)} className="w-full bg-black border border-white/20 text-white p-3 rounded font-mono text-sm focus:border-purple-500 outline-none" />
                                            </div>
                                        </div>
                                        <button onClick={() => updateTeamPoints(activeTeam.id, pointsInput, reasonInput, commentInput || undefined)} className="mt-4 w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-lg uppercase tracking-widest text-sm flex items-center justify-center gap-2"><Zap size={16}/> Apply Points</button>
                                        <div className="mt-6 space-y-2 max-h-48 overflow-y-auto">
                                            {(activeTeam.breakdown || []).slice().reverse().map((b, idx) => (
                                                <div key={idx} className="flex flex-col gap-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-gray-300">
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-mono text-xs text-gray-500">{b.source}</span>
                                                        <span className="font-bold text-white">{b.points >= 0 ? '+' : ''}{b.points}</span>
                                                    </div>
                                                    {(b.comment || b.updatedBy || b.createdAt) && (
                                                        <div className="text-[10px] text-gray-500 font-mono flex justify-between gap-2">
                                                            <span className="truncate">{b.comment || ''}</span>
                                                            <span className="text-gray-600">{b.updatedBy || ''}</span>
                                                            <span className="text-gray-600">{b.createdAt ? new Date(b.createdAt).toLocaleString() : ''}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {(!activeTeam.breakdown || activeTeam.breakdown.length === 0) && <div className="text-gray-600 text-sm">No breakdown yet.</div>}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-[#111] p-8 rounded-xl border border-white/10" onMouseEnter={handleCardHover} onMouseLeave={handleCardLeave}>
                                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Sparkles size={16}/> Live Identity</h4>
                                        <div className="aspect-square rounded-xl border border-white/10 flex items-center justify-center overflow-hidden" style={{ background: `radial-gradient(circle at 30% 20%, ${activeTeam.color}55, transparent 60%), #0c0c12` }}>
                                            {activeTeam.logo && activeTeam.logo.startsWith('data:image/') ? (
                                                <img 
                                                    src={activeTeam.logo} 
                                                    alt="Team Logo" 
                                                    className="w-full h-full object-contain p-2"
                                                    onError={(e) => {
                                                        console.error('Logo image failed to load');
                                                        e.currentTarget.style.display = 'none';
                                                    }}
                                                />
                                            ) : activeTeam.logo && activeTeam.logo.startsWith('http') ? (
                                                <img 
                                                    src={activeTeam.logo} 
                                                    alt="Team Logo" 
                                                    className="w-full h-full object-contain p-2"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                    }}
                                                />
                                            ) : (
                                                <div className="text-6xl">{activeTeam.logo || '🎮'}</div>
                                            )}
                                        </div>
                                        <div className="mt-4 text-center text-gray-400 font-mono text-xs">Tap logo above to update via URL or upload.</div>
                                    </div>

                                    <div className="bg-[#111] p-8 rounded-xl border border-white/10 space-y-4" onMouseEnter={handleCardHover} onMouseLeave={handleCardLeave}>
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><Terminal size={16}/> Danger Zone</h4>
                                        </div>
                                        <button onClick={async () => { if (deleteTeam && window.confirm('Delete this team?')) { await deleteTeam(activeTeam.id); setActiveTeamId(null); setEditingTeamId(null); } }} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg uppercase tracking-widest text-sm">Delete Team</button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-600 font-mono">Select or create a team to manage.</div>
                        )}
                    </div>
                </div>
            )}

            {/* --- CHALLENGES TAB --- */}
            {activeTab === 'challenges' && (
                <div className="flex h-full">
                    {/* List Sidebar */}
                    <div className="w-80 bg-[#0c0c12] border-r border-white/10 flex flex-col shrink-0">
                        <div className="p-6 border-b border-white/10 bg-[#111] flex justify-between items-center">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Mission List</h3>
                            <button onClick={createChallenge} className="text-green-500 hover:text-white"><Plus size={20}/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {challenges.map(c => (
                                <button key={c.id} onClick={() => setEditingChallengeId(c.id)} className={`w-full text-left p-5 border-b border-white/5 hover:bg-white/5 transition-all group ${editingChallengeId === c.id ? 'bg-purple-900/20 border-l-4 border-l-purple-500 pl-4' : 'border-l-4 border-l-transparent'}`}>
                                    <div className="font-bold text-white text-base group-hover:text-purple-300 transition-colors truncate">{c.title}</div>
                                    <div className="text-xs text-gray-500 font-mono mt-1.5 flex justify-between">
                                        <span>{c.id.toUpperCase()}</span>
                                        <span className="text-yellow-500">+{c.points} PTS</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Editor Area */}
                    <div className="flex-1 bg-[#05050a] p-10 overflow-y-auto flex gap-10">
                        {activeChallenge ? (
                            <>
                                {/* Form */}
                                <div className="flex-1 space-y-8 max-w-xl">
                                    <div className="bg-[#111] p-8 rounded-xl border border-white/10 space-y-6">
                                        <h3 className="text-purple-400 font-bold font-cyber text-2xl flex items-center gap-3"><Brain size={24}/> MISSION CONFIG</h3>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Mission Title</label>
                                            <input type="text" value={activeChallenge.title} onChange={(e) => handleChallengeUpdate('title', e.target.value)} className="w-full bg-black border border-white/20 text-white p-4 rounded-lg font-bold text-lg focus:border-purple-500 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Description / Flavor Text (Not Printed)</label>
                                            <textarea value={activeChallenge.description} onChange={(e) => handleChallengeUpdate('description', e.target.value)} className="w-full h-24 bg-black border border-white/20 text-white p-4 rounded-lg text-sm focus:border-purple-500 outline-none resize-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Problem / Riddle (Hidden until scanned)</label>
                                            <input type="text" value={activeChallenge.question} onChange={(e) => handleChallengeUpdate('question', e.target.value)} className="w-full bg-black border border-white/20 text-white p-4 rounded-lg font-mono text-sm focus:border-purple-500 outline-none" placeholder="e.g. Decode this binary..." />
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Correct Answer</label>
                                                <div className="flex items-center gap-2 bg-black border border-white/20 rounded-lg p-1 pr-3">
                                                    <div className="p-3 bg-green-900/30 rounded"><CheckSquare size={16} className="text-green-500"/></div>
                                                    <input type="text" value={activeChallenge.answer} onChange={(e) => handleChallengeUpdate('answer', e.target.value)} className="w-full bg-transparent text-white font-mono text-sm focus:outline-none" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Reward Points</label>
                                                <input type="number" value={activeChallenge.points} onChange={(e) => handleChallengeUpdate('points', parseInt(e.target.value))} className="w-full bg-black border border-white/20 text-white p-4 rounded-lg font-mono text-sm focus:border-purple-500 outline-none" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Preview Card */}
                                <div className="w-[350px] shrink-0">
                                    <div className="sticky top-10">
                                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Printer size={16}/> Print Preview</h4>
                                        
                                        {/* CSS Scaled Preview of the Glitch Card */}
                                        <div className="bg-[#05050a] border-4 border-[#7c3aed] shadow-2xl relative overflow-hidden flex flex-col justify-between box-border" style={{ aspectRatio: '105/148' }}>
                                            
                                            {/* Background Glitch Noise Preview */}
                                            <div className="absolute inset-0 bg-[#0f0518] z-0"></div>
                                            <div 
                                                className="absolute inset-0 z-0 opacity-20"
                                                style={{
                                                    backgroundImage: `repeating-linear-gradient(45deg, #2e1065 0px, #2e1065 2px, #eab308 2px, #eab308 3px, #2e1065 3px, #2e1065 5px, #06b6d4 5px, #06b6d4 6px, #2e1065 6px, #2e1065 8px, #ef4444 8px, #ef4444 9px, #2e1065 9px, #2e1065 11px, #00f0b5 11px, #00f0b5 12px)`
                                                }}
                                            ></div>

                                            {/* Header */}
                                            <div className="h-16 w-full flex flex-col justify-center items-center relative z-10 pt-4">
                                                <div className="relative inline-block whitespace-nowrap">
                                                    <span className="absolute top-0 left-[-1px] font-cyber font-black text-2xl tracking-[0.2em] text-[#ff003c] opacity-80 mix-blend-screen">IT-VERSE</span>
                                                    <span className="absolute top-0 left-[1px] font-cyber font-black text-2xl tracking-[0.2em] text-[#00f0ff] opacity-80 mix-blend-screen">IT-VERSE</span>
                                                    <span className="relative font-cyber font-black text-2xl tracking-[0.2em] text-white">IT-VERSE</span>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 w-full flex items-center justify-center relative z-10 px-4">
                                                <div className="relative p-2 bg-white border border-purple-500">
                                                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=CHALLENGE:${activeChallenge.id}&color=000000&bgcolor=ffffff&margin=0`} className="w-24 h-24 rendering-pixelated" alt="QR" />
                                                </div>
                                            </div>

                                            {/* Footer: Problem Name */}
                                            <div className="h-20 w-full flex flex-col justify-center items-center px-3 relative z-10 text-center bg-white border-t-2 border-purple-600">
                                                <div className="w-full py-2">
                                                    <div className="text-[6px] font-mono font-bold text-purple-900 uppercase tracking-[0.5em] mb-1">MISSION_OBJECTIVE</div>
                                                    <div className="font-cyber font-black text-lg text-black uppercase tracking-wider leading-none truncate">{activeChallenge.title}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <button 
                                            onClick={openPrintStudio}
                                            className="w-full mt-6 bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-lg uppercase tracking-widest flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-all hover:scale-[1.02]"
                                        >
                                            <Printer size={20} /> OPEN PRINT STUDIO
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-600 font-mono">Select a Mission to Configure</div>
                        )}
                    </div>
                </div>
            )}

            {/* --- LIVE ARENA TAB --- */}
            {activeTab === 'live-arena' && (
                <div className="flex h-full">
                    {/* List Sidebar */}
                    <div className="w-80 bg-[#0c0c12] border-r border-white/10 flex flex-col shrink-0">
                        <div className="p-6 border-b border-white/10 bg-[#111] flex justify-between items-center">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Live Streams</h3>
                            <button onClick={() => { setEditingStreamId('new'); setStreamDraft({ title: '', embed_url: '', thumbnail_url: '', thumbnail_mode: 'embed', game_category: '', tournament_id: '', status: 'scheduled', placement: ['recommended'], team1_name: '', team1_logo: '', team1_score: 0, team2_name: '', team2_logo: '', team2_score: 0, description: '' }); setThumbnailFile(null); }} className="text-green-500 hover:text-white transition-colors" title="Create new stream"><Plus size={20}/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {isLoadingStreams ? (
                                <div className="p-6 text-gray-500 text-sm text-center">Loading streams...</div>
                            ) : liveStreams.length === 0 ? (
                                <div className="p-6 text-gray-600 text-sm text-center">No streams yet</div>
                            ) : (
                                liveStreams.map(s => (
                                    <button key={s.id} onClick={() => { setEditingStreamId(s.id); setStreamDraft(s); setThumbnailFile(null); }} className={`w-full text-left p-5 border-b border-white/5 hover:bg-white/5 transition-all group ${editingStreamId === s.id ? 'bg-purple-900/20 border-l-4 border-l-purple-500 pl-4' : 'border-l-4 border-l-transparent'}`}>
                                        <div className="font-bold text-white text-base group-hover:text-purple-300 transition-colors truncate">{s.title}</div>
                                        <div className="text-xs text-gray-500 font-mono mt-1.5 flex justify-between items-center">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.status === 'live' ? 'bg-red-900/50 text-red-300' : s.status === 'scheduled' ? 'bg-yellow-900/50 text-yellow-300' : 'bg-gray-900/50 text-gray-300'}`}>{s.status.toUpperCase()}</span>
                                            <span className="text-purple-400">{Array.isArray(s.placement) ? s.placement.join(', ').toUpperCase() : s.placement?.toUpperCase()}</span>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Editor Area */}
                    <div className="flex-1 bg-[#05050a] p-10 overflow-y-auto">
                        {editingStreamId !== null && editingStreamId !== undefined ? (
                            <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                <div className="bg-[#111] p-8 rounded-xl border border-white/10 space-y-6">
                                    <div className="flex items-center justify-between gap-4">
                                        <h3 className="text-purple-400 font-bold font-cyber text-2xl flex items-center gap-3"><Tv size={24}/> {editingStreamId === 'new' ? 'NEW STREAM' : 'STREAM CONFIG'}</h3>
                                        {editingStreamId !== 'new' && <button onClick={() => setEditingStreamId(null)} className="p-2 hover:bg-white/5 rounded transition-colors text-gray-400 hover:text-white"><X size={20}/></button>}
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Stream Title</label>
                                        <input type="text" value={streamDraft.title} onChange={(e) => setStreamDraft({...streamDraft, title: e.target.value})} className="w-full bg-black border border-white/20 text-white p-4 rounded-lg font-bold text-lg focus:border-purple-500 outline-none" placeholder="e.g. Finals Championship"/>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Embed URL</label>
                                        <input type="text" value={streamDraft.embed_url} onChange={(e) => {
                                          let val = e.target.value.trim();
                                          // Auto-extract URL from iframe tag if pasted
                                          if (val.includes('<iframe') && val.includes('src=')) {
                                            const srcMatch = val.match(/src=["']([^"']+)["']/);
                                            if (srcMatch && srcMatch[1]) {
                                              val = srcMatch[1];
                                              console.log('✅ Extracted embed URL from iframe');
                                            }
                                          }
                                          setStreamDraft({...streamDraft, embed_url: val});
                                        }} className="w-full bg-black border border-white/20 text-white p-4 rounded-lg font-mono text-sm focus:border-purple-500 outline-none" placeholder="Paste YouTube/Twitch embed URL or full iframe code"/>\n                                        <p className="text-[10px] text-gray-500 mt-2">💡 Tip: Paste the embed URL or paste the full iframe code - we'll extract it automatically</p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Description (Optional)</label>
                                        <textarea value={streamDraft.description || ''} onChange={(e) => setStreamDraft({...streamDraft, description: e.target.value})} className="w-full h-20 bg-black border border-white/20 text-white p-4 rounded-lg text-sm focus:border-purple-500 outline-none resize-none" placeholder="Stream description..."/>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Game Category (Optional)</label>
                                            <input type="text" value={streamDraft.game_category || ''} onChange={(e) => setStreamDraft({...streamDraft, game_category: e.target.value})} className="w-full bg-black border border-white/20 text-white p-4 rounded-lg text-sm focus:border-purple-500 outline-none" placeholder="e.g. Valorant"/>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Tournament</label>
                                            <select value={streamDraft.tournament_id || ''} onChange={(e) => setStreamDraft({...streamDraft, tournament_id: e.target.value})} className="w-full bg-black border border-white/20 text-white p-4 rounded-lg text-sm focus:border-purple-500 outline-none">
                                                <option value="">None</option>
                                                {events.map(evt => <option key={evt.id} value={evt.id}>{evt.title}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Status</label>
                                            <select value={streamDraft.status} onChange={(e) => setStreamDraft({...streamDraft, status: e.target.value})} className="w-full bg-black border border-white/20 text-white p-4 rounded-lg text-sm focus:border-purple-500 outline-none">
                                                <option value="scheduled">Scheduled</option>
                                                <option value="live">Live</option>
                                                <option value="ended">Ended</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Placement Sections (Multi-Select)</label>
                                            <div className="space-y-3 bg-black/50 border border-white/20 p-4 rounded-lg">
                                                {[
                                                    { value: 'hero', label: '🎬 Hero Section', desc: 'Large featured carousel at top' },
                                                    { value: 'recommended', label: '⭐ Recommended', desc: 'Suggested streams section' },
                                                    { value: 'previous', label: '📼 Previous Lives', desc: 'Archived/ended streams' }
                                                ].map(option => (
                                                    <label key={option.value} className="flex items-start gap-3 cursor-pointer group hover:bg-white/5 p-3 rounded-lg transition-all">
                                                        <input
                                                            type="checkbox"
                                                            checked={Array.isArray(streamDraft.placement) ? streamDraft.placement.includes(option.value) : false}
                                                            onChange={(e) => {
                                                                const currentPlacements = Array.isArray(streamDraft.placement) ? streamDraft.placement : [];
                                                                const newPlacements = e.target.checked
                                                                    ? [...currentPlacements, option.value]
                                                                    : currentPlacements.filter(p => p !== option.value);
                                                                setStreamDraft({...streamDraft, placement: newPlacements});
                                                            }}
                                                            className="w-5 h-5 rounded bg-black border-2 border-purple-500/50 checked:bg-purple-600 checked:border-purple-500 cursor-pointer transition-all focus:ring-2 focus:ring-purple-500/30 mt-0.5"
                                                        />
                                                        <div className="flex-1">
                                                            <div className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">{option.label}</div>
                                                            <div className="text-xs text-gray-500 mt-0.5">{option.desc}</div>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                                                Stream can appear in multiple sections • Changes sync instantly
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Thumbnail</label>
                                        <div className="flex gap-3 mb-3">
                                            <button type="button" onClick={() => setStreamDraft({...streamDraft, thumbnail_mode: 'embed'})} className={`flex-1 py-2 rounded font-bold uppercase tracking-wide text-sm transition-all ${streamDraft.thumbnail_mode === 'embed' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400'}`}>Use Embed</button>
                                            <button type="button" onClick={() => setStreamDraft({...streamDraft, thumbnail_mode: 'upload'})} className={`flex-1 py-2 rounded font-bold uppercase tracking-wide text-sm transition-all ${streamDraft.thumbnail_mode === 'upload' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400'}`}>Upload</button>
                                        </div>
                                        {streamDraft.thumbnail_mode === 'embed' ? (
                                            <div className="text-xs text-gray-500 p-3 bg-black/50 rounded border border-white/5">✓ Thumbnail will auto-sync from embed provider</div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <input type="file" accept="image/*" onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)} className="flex-1 text-xs text-gray-500 file:bg-purple-600 file:text-white file:border-0 file:rounded file:px-3 file:py-2 file:font-bold file:cursor-pointer file:uppercase file:tracking-wide" />
                                                {streamDraft.thumbnail_url && <img src={streamDraft.thumbnail_url} alt="preview" className="w-16 h-16 rounded object-cover" />}
                                            </div>
                                        )}
                                    </div>

                                    {/* Score Editor for Live Matches */}
                                    {editingStreamId && editingStreamId !== 'new' && (
                                        <div className="bg-black/30 p-6 rounded-lg border border-white/10 space-y-4">
                                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">⚡ Live Score Control</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{streamDraft.team1_name || 'Team 1'} Score</label>
                                                    <input 
                                                        type="number" 
                                                        value={streamDraft.team1_score ?? 0} 
                                                        onChange={(e) => setStreamDraft({...streamDraft, team1_score: parseInt(e.target.value) || 0})} 
                                                        className="w-full bg-black border-2 border-purple-500/50 text-white p-3 rounded-lg text-2xl font-bold text-center focus:border-purple-500 outline-none transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{streamDraft.team2_name || 'Team 2'} Score</label>
                                                    <input 
                                                        type="number" 
                                                        value={streamDraft.team2_score ?? 0} 
                                                        onChange={(e) => setStreamDraft({...streamDraft, team2_score: parseInt(e.target.value) || 0})} 
                                                        className="w-full bg-black border-2 border-cyan-500/50 text-white p-3 rounded-lg text-2xl font-bold text-center focus:border-cyan-500 outline-none transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-3 pt-6 border-t border-white/5">
                                        <button onClick={saveStream} className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg uppercase tracking-widest text-sm flex items-center justify-center gap-2"><Save size={16}/> {editingStreamId === 'new' ? 'Create Stream' : 'Save Scores & Stream'}</button>
                                        {editingStreamId && editingStreamId !== 'new' && <button onClick={deleteStream} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg uppercase tracking-widest text-sm">Delete</button>}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-gray-600 font-mono h-full">
                                <Tv size={48} className="mb-4 opacity-50"/>
                                <p>Select or create a stream to customize</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ... Other Tabs ... */}
            {activeTab === 'tournaments' && (
                <div className="flex h-full">
                    {/* ... (Existing Tournament logic) ... */}
                    <div className="w-80 bg-[#0c0c12] border-r border-white/10 flex flex-col shrink-0">
                        <div className="p-6 border-b border-white/10 bg-[#111]"><h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Active Events</h3></div>
                        <div className="flex-1 overflow-y-auto">{events.map(evt => (<button key={evt.id} onClick={() => setSelectedEventId(evt.id)} className={`w-full text-left p-5 border-b border-white/5 hover:bg-white/5 transition-all group ${selectedEventId === evt.id ? 'bg-purple-900/20 border-l-4 border-l-purple-500 pl-4' : 'border-l-4 border-l-transparent'}`}><div className="font-bold text-white text-base group-hover:text-purple-300 transition-colors truncate">{evt.title}</div><div className="text-xs text-gray-500 font-mono mt-1.5">{evt.game}</div></button>))}</div>
                        <button onClick={() => setShowCreateEvent(true)} className="p-6 border-t border-white/10 text-center text-sm font-bold text-purple-400 hover:text-white uppercase tracking-widest hover:bg-white/5 transition-colors flex items-center justify-center gap-2"><Plus size={16}/> Create Event</button>
                    </div>

                    <div className="flex-1 flex flex-col h-full bg-[#05050a] relative">
                        {activeEvent ? (
                            <>
                                <div className="h-24 border-b border-white/10 flex items-center px-8 gap-8 bg-[#0a0a0f] shrink-0">
                                    <h2 className="font-cyber text-3xl font-bold text-white truncate max-w-lg">{activeEvent.title}</h2>
                                    <div className="h-8 w-px bg-white/10"></div>
                                    <div className="flex gap-3">
                                        {[ { id: 'config', label: 'Setup', icon: Settings }, { id: 'info', label: 'Info', icon: FileText }, { id: 'matches', label: 'Matches', icon: Tv }, { id: 'bracket', label: 'Visual Bracket', icon: LayoutTemplate } ].map(sub => (<button key={sub.id} onClick={() => setTournamentSubTab(sub.id as any)} className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold uppercase tracking-wide transition-all ${tournamentSubTab === sub.id ? 'bg-white text-black' : 'bg-white/5 text-gray-400 hover:text-white'}`}><sub.icon size={14} /> {sub.label}</button>))}
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-10">
                                    {tournamentSubTab === 'config' && (
                                        <div className="max-w-5xl space-y-10 animate-in fade-in slide-in-from-bottom-2">
                                            <div className="bg-[#111] p-8 rounded-xl border border-white/10">
                                                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2"><ImageIcon size={16}/> Event Visuals</h4>
                                                <div className="flex flex-col md:flex-row gap-8 items-start">
                                                    <div className="w-full md:w-80 aspect-video bg-black rounded-lg border border-white/10 overflow-hidden relative group">
                                                        <img
                                                            src={normalizeImageUrl(activeEvent.image || activeEvent.banner)}
                                                            alt="Preview"
                                                            className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                        />
                                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50"><span className="text-xs font-mono text-white tracking-widest border border-white px-3 py-1.5 rounded">PREVIEW</span></div>
                                                    </div>
                                                    <div className="flex-1 w-full space-y-6">
                                                        <div>
                                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Banner Image URL</label>
                                                            <div className="flex gap-3">
                                                                <input
                                                                    type="text"
                                                                    value={activeEvent.image || ''}
                                                                    onChange={(e) => updateEvent && updateEvent(activeEvent.id, { image: e.target.value })}
                                                                    className="flex-1 bg-black border border-white/20 text-white p-4 rounded-lg font-mono text-sm focus:border-purple-500 outline-none"
                                                                    placeholder="https://... or upload below"
                                                                />
                                                                <label className={`bg-purple-600 hover:bg-purple-500 border border-purple-500 px-4 py-3 rounded-lg text-white text-xs font-bold cursor-pointer transition-colors whitespace-nowrap flex items-center gap-2 ${isUploadingBanner ? 'opacity-70 cursor-not-allowed' : ''}`}>
                                                                    <Upload size={18} />
                                                                    {isUploadingBanner ? 'Uploading...' : 'Upload'}
                                                                    <input
                                                                        type="file"
                                                                        accept=".svg,.ico,image/svg+xml,image/x-icon,image/vnd.microsoft.icon,image/png,image/jpeg,image/jpg,image/webp"
                                                                        className="hidden"
                                                                        onChange={handleBannerUpload}
                                                                        disabled={isUploadingBanner}
                                                                    />
                                                                </label>
                                                            </div>
                                                            <p className="text-xs text-gray-600 mt-2">Recommended size: 1920x1080. Supports JPG, PNG, WEBP, SVG, ICO.</p>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Game Logo (SVG / ICO / PNG / JPG)</label>
                                                                <div className="flex gap-3">
                                                                    <input
                                                                        type="text"
                                                                        value={activeEvent.gameLogo || ''}
                                                                        onChange={(e) => updateEvent && updateEvent(activeEvent.id, { gameLogo: e.target.value })}
                                                                        className="flex-1 bg-black border border-white/20 text-white p-3 rounded-lg font-mono text-sm focus:border-purple-500 outline-none"
                                                                        placeholder="https://... or upload below"
                                                                    />
                                                                    <label className={`bg-purple-600 hover:bg-purple-500 border border-purple-500 px-4 py-3 rounded-lg text-white text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${isUploadingGameLogo ? 'opacity-70 cursor-not-allowed' : ''}`}>
                                                                        {isUploadingGameLogo ? 'Uploading...' : 'Upload Logo'}
                                                                        <input
                                                                            type="file"
                                                                            accept=".svg,.ico,image/svg+xml,image/x-icon,image/vnd.microsoft.icon,image/png,image/jpeg,image/webp"
                                                                            className="hidden"
                                                                            onChange={handleGameLogoUpload}
                                                                            disabled={isUploadingGameLogo}
                                                                        />
                                                                    </label>
                                                                </div>
                                                                <p className="text-[11px] text-gray-500 mt-2">Supports SVG or ICO for crisp small icons; PNG/JPG/WEBP also accepted.</p>
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Secondary Banner URL</label>
                                                                <input type="text" value={activeEvent.banner || ''} onChange={(e) => updateEvent && updateEvent(activeEvent.id, { banner: e.target.value })} className="w-full bg-black border border-white/20 text-white p-3 rounded-lg font-mono text-sm focus:border-purple-500 outline-none" placeholder="https://..." />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-[#111] p-8 rounded-xl border border-white/10 grid grid-cols-2 gap-8"><div className="col-span-2 md:col-span-1"><label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Tournament Title</label><input type="text" value={activeEvent.title} onChange={(e) => updateEvent && updateEvent(activeEvent.id, { title: e.target.value })} className="w-full bg-black border border-white/20 text-white p-4 rounded-lg font-bold text-lg focus:border-purple-500 outline-none" /></div><div className="col-span-2 md:col-span-1"><label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Game Title</label><input type="text" value={activeEvent.game} onChange={(e) => updateEvent && updateEvent(activeEvent.id, { game: e.target.value })} className="w-full bg-black border border-white/20 text-white p-4 rounded-lg font-bold text-lg focus:border-purple-500 outline-none" /></div></div>

                                            <div className="bg-[#111] p-8 rounded-xl border border-white/10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Start Date & Time</label>
                                                    <input type="datetime-local" value={activeEvent.startDate ? activeEvent.startDate.slice(0,16) : ''} onChange={(e) => updateEvent && updateEvent(activeEvent.id, { startDate: e.target.value ? new Date(e.target.value).toISOString() : null })} className="w-full bg-black border border-white/20 text-white p-3 rounded-lg text-sm focus:border-purple-500 outline-none" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Format</label>
                                                    <input type="text" value={activeEvent.format || activeEvent.details.format} onChange={(e) => updateEvent && updateEvent(activeEvent.id, { format: e.target.value, details: { ...activeEvent.details, format: e.target.value } })} className="w-full bg-black border border-white/20 text-white p-3 rounded-lg text-sm focus:border-purple-500 outline-none" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Entry Fee</label>
                                                    <input type="number" step="0.01" value={activeEvent.entryFee ?? ''} onChange={(e) => updateEvent && updateEvent(activeEvent.id, { entryFee: e.target.value === '' ? null : parseFloat(e.target.value) })} className="w-full bg-black border border-white/20 text-white p-3 rounded-lg text-sm focus:border-purple-500 outline-none" />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-bold text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                        <Clock size={16} className="animate-pulse" />
                                                        Tournament Countdown Timer
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type="datetime-local"
                                                            value={(() => {
                                                                if (!activeEvent.countdownEnd) return '';
                                                                // Convert ISO string to local datetime-local format (YYYY-MM-DDTHH:mm)
                                                                const date = new Date(activeEvent.countdownEnd);
                                                                const year = date.getFullYear();
                                                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                                                const day = String(date.getDate()).padStart(2, '0');
                                                                const hours = String(date.getHours()).padStart(2, '0');
                                                                const minutes = String(date.getMinutes()).padStart(2, '0');
                                                                return `${year}-${month}-${day}T${hours}:${minutes}`;
                                                            })()}
                                                            onChange={(e) => {
                                                                if (updateEvent && e.target.value) {
                                                                    // Convert local datetime-local value to ISO string preserving local time
                                                                    const localDateTime = e.target.value; // Format: "2026-01-06T08:00"
                                                                    const date = new Date(localDateTime);
                                                                    const isoString = date.toISOString();
                                                                    updateEvent(activeEvent.id, { countdownEnd: isoString });
                                                                    console.log('🔔 Countdown updated:', {
                                                                        local: localDateTime,
                                                                        iso: isoString,
                                                                        display: date.toLocaleString()
                                                                    });
                                                                } else if (updateEvent && !e.target.value) {
                                                                    updateEvent(activeEvent.id, { countdownEnd: null });
                                                                }
                                                            }}
                                                            className="w-full bg-gradient-to-r from-purple-900/20 to-black border-2 border-purple-500/50 hover:border-purple-400 text-white p-5 rounded-xl text-lg font-bold cursor-pointer focus:border-purple-400 focus:ring-4 focus:ring-purple-500/30 outline-none transition-all shadow-lg hover:shadow-purple-500/20"
                                                            style={{ colorScheme: 'dark' }}
                                                        />
                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                            <Calendar size={24} className="text-purple-400" />
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                                                        <p className="text-xs text-purple-300 font-medium flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
                                                            Click the input above to open the calendar and time picker
                                                        </p>
                                                        <p className="text-xs text-gray-400 mt-1 ml-4">
                                                            Changes sync instantly across all devices • Updates live countdown on tournament page
                                                        </p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Global Seed</label>
                                                    <input type="number" value={activeEvent.globalSeed ?? ''} onChange={(e) => updateEvent && updateEvent(activeEvent.id, { globalSeed: e.target.value === '' ? null : parseInt(e.target.value) })} className="w-full bg-black border border-white/20 text-white p-3 rounded-lg text-sm focus:border-purple-500 outline-none" />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Mode Wins</label>
                                                        <input type="number" value={activeEvent.modeWins ?? 0} onChange={(e) => updateEvent && updateEvent(activeEvent.id, { modeWins: parseInt(e.target.value) || 0 })} className="w-full bg-black border border-white/20 text-white p-3 rounded-lg text-sm focus:border-purple-500 outline-none" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Mode Losses</label>
                                                        <input type="number" value={activeEvent.modeLosses ?? 0} onChange={(e) => updateEvent && updateEvent(activeEvent.id, { modeLosses: parseInt(e.target.value) || 0 })} className="w-full bg-black border border-white/20 text-white p-3 rounded-lg text-sm focus:border-purple-500 outline-none" />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Available Slots</label>
                                                        <input type="number" value={activeEvent.availableSlots ?? ''} onChange={(e) => updateEvent && updateEvent(activeEvent.id, { availableSlots: e.target.value === '' ? null : parseInt(e.target.value) })} className="w-full bg-black border border-white/20 text-white p-3 rounded-lg text-sm focus:border-purple-500 outline-none" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Confirmed Slots</label>
                                                        <input type="number" value={activeEvent.confirmedSlots ?? ''} onChange={(e) => updateEvent && updateEvent(activeEvent.id, { confirmedSlots: e.target.value === '' ? null : parseInt(e.target.value) })} className="w-full bg-black border border-white/20 text-white p-3 rounded-lg text-sm focus:border-purple-500 outline-none" />
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 col-span-1 md:col-span-2 lg:col-span-3">
                                                    <input id="match-history" type="checkbox" checked={!!activeEvent.matchHistorySynced} onChange={(e) => updateEvent && updateEvent(activeEvent.id, { matchHistorySynced: e.target.checked })} className="w-4 h-4" />
                                                    <label htmlFor="match-history" className="text-xs font-bold text-gray-400 uppercase tracking-widest">Match history synced</label>
                                                </div>
                                            </div>

                                            <div className="bg-[#1a0c0c] p-8 rounded-xl border border-red-500/40">
                                                <h4 className="text-sm font-bold text-red-400 uppercase tracking-widest mb-3 flex items-center gap-2"><X size={16}/> Danger Zone</h4>
                                                <p className="text-xs text-gray-500 mb-4">Deleting this event removes its matches and bracket data. This action cannot be undone.</p>
                                                <button
                                                    onClick={handleDeleteEvent}
                                                    className="bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-3 rounded-lg uppercase tracking-widest text-sm"
                                                >
                                                    Delete Event
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* INFO TAB (For Brief, Rules, Prize) */}
                                    {tournamentSubTab === 'info' && (
                                        <div className="max-w-5xl space-y-10 animate-in fade-in slide-in-from-bottom-2">
                                            <div className="bg-[#111] p-8 rounded-xl border border-white/10">
                                                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">Registration Status</h4>
                                                <div className="flex gap-6">
                                                    {['Open', 'Pending', 'Closed'].map((s) => (
                                                        <button key={s} onClick={() => updateEvent && updateEvent(activeEvent.id, { statusRegistration: s, details: { ...activeEvent.details, status: s } })} className={`px-8 py-4 rounded border text-sm font-bold uppercase tracking-wider transition-all ${(activeEvent.statusRegistration || activeEvent.details.status) === s ? (s==='Open'?'bg-yellow-900/20 border-yellow-500 text-yellow-500': (s==='Pending' ? 'bg-orange-900/20 border-orange-500 text-orange-500' : 'bg-red-900/20 border-red-500 text-red-500')) : 'bg-black border-white/10 text-gray-500'}`}>
                                                            {s}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Confirmation Status</label>
                                                        <select value={activeEvent.statusConfirmation || ''} onChange={(e) => updateEvent && updateEvent(activeEvent.id, { statusConfirmation: e.target.value })} className="w-full bg-black border border-white/20 text-white p-3 rounded text-sm focus:border-purple-500 outline-none">
                                                            <option value="">Unset</option>
                                                            <option value="pending">Pending</option>
                                                            <option value="in-review">In Review</option>
                                                            <option value="confirmed">Confirmed</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Seeding Status</label>
                                                        <select value={activeEvent.statusSeeding || ''} onChange={(e) => updateEvent && updateEvent(activeEvent.id, { statusSeeding: e.target.value })} className="w-full bg-black border border-white/20 text-white p-3 rounded text-sm focus:border-purple-500 outline-none">
                                                            <option value="">Unset</option>
                                                            <option value="pending">Pending</option>
                                                            <option value="processing">Processing</option>
                                                            <option value="locked">Locked</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-8 bg-[#111] p-8 rounded-xl border border-white/10">
                                                <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Prize Pool</label><input type="text" value={activeEvent.details.prizePool} onChange={(e) => updateEventDetail('prizePool', e.target.value)} className="w-full bg-black border border-white/20 text-white p-4 rounded-lg font-bold text-lg focus:border-purple-500 outline-none" /></div>
                                                <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Entry Fee</label><input type="text" value={activeEvent.details.entryFee} onChange={(e) => updateEventDetail('entryFee', e.target.value)} className="w-full bg-black border border-white/20 text-white p-4 rounded-lg font-bold text-lg focus:border-purple-500 outline-none" /></div>
                                                <div className="col-span-2"><label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Brief / Description</label><textarea value={activeEvent.details.brief} onChange={(e) => updateEventDetail('brief', e.target.value)} className="w-full h-32 bg-black border border-white/20 text-white p-4 rounded-lg text-base focus:border-purple-500 outline-none resize-none" /></div>
                                                <div className="col-span-2"><label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Rules (Text)</label><textarea value={activeEvent.rulesText || activeEvent.details.rules.join(', ')} onChange={(e) => updateEvent && updateEvent(activeEvent.id, { rulesText: e.target.value, details: { ...activeEvent.details, rules: e.target.value.split(/\r?\n|,/).map((s: string) => s.trim()).filter(Boolean) } })} className="w-full bg-black border border-white/20 text-white p-4 rounded-lg text-base focus:border-purple-500 outline-none h-28 resize-none" placeholder="Add rules separated by new lines or commas" /></div>
                                                <div className="col-span-2 pt-6 border-t border-white/5">
                                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Calendar size={14}/> Event Schedule (Countdown Target)</label>
                                                    <div className="grid grid-cols-4 gap-6">
                                                        {['day', 'hour', 'min', 'sec'].map((k) => (
                                                            <div key={k}>
                                                                <span className="text-[10px] uppercase text-gray-600 font-bold block mb-2">{k}</span>
                                                                <input type="text" value={activeEvent.details.schedule[k as keyof typeof activeEvent.details.schedule]} onChange={(e) => updateEventDetail('schedule', { ...activeEvent.details.schedule, [k]: e.target.value })} className="w-full bg-black border border-white/20 text-white p-3 rounded font-mono text-center text-lg focus:border-purple-500 outline-none" maxLength={2} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* BRACKET TAB (Per Event) */}
                                    {tournamentSubTab === 'bracket' && (
                                        <div className="animate-in fade-in slide-in-from-bottom-2">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                                {activeEvent.bracket.map((match) => (
                                                    <div key={match.id} className="bg-[#111] p-6 rounded-xl border border-white/10 hover:border-purple-500/50 transition-colors group relative overflow-hidden">
                                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-purple-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                        <div className="flex justify-between items-center mb-6">
                                                            <span className="text-xs font-mono text-gray-500 uppercase bg-black/50 px-3 py-1.5 rounded">ID: {match.id}</span>
                                                            <select value={match.status} onChange={(e) => updateEventBracketMatch(activeEvent.id, match.id, match.p1.score, match.p2.score, e.target.value)} className="bg-black text-xs text-white font-bold border border-white/20 rounded px-3 py-1.5 outline-none uppercase tracking-wider focus:border-purple-500">
                                                                <option value="scheduled">Scheduled</option><option value="live">Live</option><option value="finished">Finished</option>
                                                            </select>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <div className={`flex items-center justify-between p-3 rounded ${match.p1.isWinner ? 'bg-green-900/10 border border-green-500/30' : 'bg-white/5 border border-transparent'}`}>
                                                                <span className={`text-base font-bold ${match.p1.isWinner ? 'text-green-400' : 'text-gray-300'}`}>{teams[match.p1.id]?.name || match.p1.id}</span>
                                                                <input type="number" value={match.p1.score ?? ''} placeholder="-" onChange={(e) => updateEventBracketMatch(activeEvent.id, match.id, parseInt(e.target.value) || 0, match.p2.score, match.status)} className="w-16 bg-black border border-white/20 text-center text-white rounded p-2 text-sm font-mono focus:border-purple-500 outline-none" />
                                                            </div>
                                                            <div className={`flex items-center justify-between p-3 rounded ${match.p2.isWinner ? 'bg-green-900/10 border border-green-500/30' : 'bg-white/5 border border-transparent'}`}>
                                                                <span className={`text-base font-bold ${match.p2.isWinner ? 'text-green-400' : 'text-gray-300'}`}>{teams[match.p2.id]?.name || match.p2.id}</span>
                                                                <input type="number" value={match.p2.score ?? ''} placeholder="-" onChange={(e) => updateEventBracketMatch(activeEvent.id, match.id, match.p1.score, parseInt(e.target.value) || 0, match.status)} className="w-16 bg-black border border-white/20 text-center text-white rounded p-2 text-sm font-mono focus:border-purple-500 outline-none" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {activeEvent.bracket.length === 0 && <div className="text-gray-500 text-base p-6">No bracket data initialized for this event.</div>}
                                            </div>
                                        </div>
                                    )}

                                    {/* MATCHES TAB */}
                                    {tournamentSubTab === 'matches' && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                                            {activeEvent.matches.map(m => (
                                                <div key={m.id} className="bg-[#111] p-6 rounded-xl border border-white/10 flex flex-col gap-6 group hover:border-white/20 transition-colors">
                                                    <div className="flex justify-between items-center pb-4 border-b border-white/5">
                                                        <div className="flex items-center gap-4"><div className="bg-white/5 px-3 py-1.5 rounded text-xs font-mono font-bold text-gray-400">MATCH {m.id}</div><span className="text-sm text-gray-500 font-bold uppercase">Round {m.round}</span></div>
                                                        <div className="flex gap-3">{['scheduled', 'live', 'completed'].map(status => (<button key={status} onClick={() => updateMatchResult(activeEvent.id, m.id, { status: status as Match['status'] })} className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors border ${m.status === status ? (status === 'live' ? 'bg-red-900/30 border-red-500 text-red-400' : (status === 'completed' ? 'bg-green-900/30 border-green-500 text-green-400' : 'bg-gray-800 border-gray-600 text-white')) : 'bg-transparent border-transparent text-gray-600 hover:text-gray-400'}`}>{status}</button>))}</div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="bg-black/40 p-4 rounded-lg border border-white/5 space-y-3">
                                                            <div className="flex justify-between items-center">
                                                                <span className="font-bold text-white text-lg">{teams[m.teamA]?.name || m.teamA}</span>
                                                                <span className="text-xs text-gray-500 font-mono">TEAM A</span>
                                                            </div>
                                                            <input
                                                                type="number"
                                                                value={m.scoreA ?? ''}
                                                                placeholder="Score"
                                                                onChange={(e) => updateMatchResult(activeEvent.id, m.id, { scoreA: e.target.value === '' ? null : parseInt(e.target.value) })}
                                                                className="w-full bg-black border border-white/20 text-center text-white rounded p-3 text-sm font-mono focus:border-purple-500 outline-none"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={m.teamALogo || ''}
                                                                placeholder="Team A Logo URL"
                                                                onChange={(e) => updateMatchResult(activeEvent.id, m.id, { teamALogo: e.target.value })}
                                                                className="w-full bg-black border border-white/15 text-white p-3 rounded text-sm focus:border-purple-500 outline-none"
                                                            />
                                                        </div>

                                                        <div className="bg-black/40 p-4 rounded-lg border border-white/5 space-y-3">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-xs text-gray-500 font-mono">TEAM B</span>
                                                                <span className="font-bold text-white text-lg">{teams[m.teamB]?.name || m.teamB}</span>
                                                            </div>
                                                            <input
                                                                type="number"
                                                                value={m.scoreB ?? ''}
                                                                placeholder="Score"
                                                                onChange={(e) => updateMatchResult(activeEvent.id, m.id, { scoreB: e.target.value === '' ? null : parseInt(e.target.value) })}
                                                                className="w-full bg-black border border-white/20 text-center text-white rounded p-3 text-sm font-mono focus:border-cyan-500 outline-none"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={m.teamBLogo || ''}
                                                                placeholder="Team B Logo URL"
                                                                onChange={(e) => updateMatchResult(activeEvent.id, m.id, { teamBLogo: e.target.value })}
                                                                className="w-full bg-black border border-white/15 text-white p-3 rounded text-sm focus:border-cyan-500 outline-none"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div>
                                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Winner</label>
                                                            <select
                                                                value={m.winnerId || ''}
                                                                onChange={(e) => updateMatchResult(activeEvent.id, m.id, { winnerId: e.target.value || null })}
                                                                className="w-full bg-black border border-white/20 text-white p-3 rounded text-sm focus:border-purple-500 outline-none"
                                                            >
                                                                <option value="">None</option>
                                                                <option value={m.teamA}>{teams[m.teamA]?.name || m.teamA}</option>
                                                                <option value={m.teamB}>{teams[m.teamB]?.name || m.teamB}</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between gap-6">
                                                        <div className="flex-1 bg-black/40 p-4 rounded-lg border border-white/5 flex justify-between items-center">
                                                            <span className="font-bold text-white text-lg">{teams[m.teamA]?.name || m.teamA}</span>
                                                            <span className="text-sm font-mono text-gray-500">TEAM A</span>
                                                        </div>
                                                        <div className="text-gray-600 font-black font-cyber text-2xl">VS</div>
                                                        <div className="flex-1 bg-black/40 p-4 rounded-lg border border-white/5 flex justify-between items-center">
                                                            <span className="text-sm font-mono text-gray-500">TEAM B</span>
                                                            <span className="font-bold text-white text-lg">{teams[m.teamB]?.name || m.teamB}</span>
                                                        </div>
                                                    </div>

                                                    <StreamEditor match={m} eventId={activeEvent.id} onSave={updateMatchStream} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-600 font-mono text-sm uppercase tracking-widest">Select an Event to Configure</div>
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>

        {showCreateEvent && (
            <div className="fixed inset-0 z-[1100] bg-black/80 backdrop-blur-lg flex items-center justify-center p-4">
                <div className="w-full max-w-2xl bg-[#0b0b12] border border-white/10 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(124,58,237,0.12),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(6,182,212,0.12),transparent_35%)]"></div>
                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-cyber font-bold text-white">Create Event</h3>
                                <p className="text-sm text-gray-500">Wire directly into live data; saves immediately.</p>
                            </div>
                            <button onClick={() => setShowCreateEvent(false)} className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition-colors"><X size={22}/></button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2"><label className="text-xs uppercase text-gray-500 font-bold mb-2 block">Title</label><input value={eventDraft.title} onChange={(e) => setEventDraft({ ...eventDraft, title: e.target.value })} className="w-full bg-black border border-white/15 text-white p-4 rounded-lg focus:border-purple-500 outline-none" /></div>
                            <div><label className="text-xs uppercase text-gray-500 font-bold mb-2 block">Game</label><input value={eventDraft.game} onChange={(e) => setEventDraft({ ...eventDraft, game: e.target.value })} className="w-full bg-black border border-white/15 text-white p-4 rounded-lg focus:border-purple-500 outline-none" /></div>
                            <div><label className="text-xs uppercase text-gray-500 font-bold mb-2 block">Short Name / ID</label><input value={eventDraft.shortName} onChange={(e) => setEventDraft({ ...eventDraft, shortName: e.target.value })} className="w-full bg-black border border-white/15 text-white p-4 rounded-lg focus:border-purple-500 outline-none" /></div>
                            <div className="col-span-2"><label className="text-xs uppercase text-gray-500 font-bold mb-2 block">Banner Image</label><input value={eventDraft.image} onChange={(e) => setEventDraft({ ...eventDraft, image: e.target.value })} placeholder="https://..." className="w-full bg-black border border-white/15 text-white p-4 rounded-lg focus:border-purple-500 outline-none" /></div>
                            <div className="col-span-2"><label className="text-xs uppercase text-gray-500 font-bold mb-2 block">Description</label><textarea value={eventDraft.description} onChange={(e) => setEventDraft({ ...eventDraft, description: e.target.value })} className="w-full h-24 bg-black border border-white/15 text-white p-4 rounded-lg focus:border-purple-500 outline-none resize-none" /></div>
                            <div><label className="text-xs uppercase text-gray-500 font-bold mb-2 block">Bracket Type</label>
                                <select value={eventDraft.bracketType} onChange={(e) => setEventDraft({ ...eventDraft, bracketType: e.target.value as 'single' | 'double' })} className="w-full bg-black border border-white/15 text-white p-4 rounded-lg focus:border-purple-500 outline-none">
                                    <option value="single">Single Elimination</option>
                                    <option value="double">Double Elimination</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowCreateEvent(false)} className="px-5 py-3 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/20">Cancel</button>
                            <button onClick={handleCreateEvent} className="px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase tracking-widest">Save Event</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </>
  );
};

export default AdminPanel;


