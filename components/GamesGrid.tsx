
import React, { useState, useEffect, useRef, useMemo, useLayoutEffect } from 'react';
import { GameEvent, Team } from '../types';
import { Play, X, Activity, Radio, Users, Zap, Trophy, Minimize2, Maximize2, ArrowLeft } from 'lucide-react';
import * as THREE from 'three';
import gsap from 'gsap';

// --- TWITCH PLAYER COMPONENT (JS SDK) ---
const TwitchPlayer: React.FC<{ channel: string }> = ({ channel }) => {
    const embedId = "twitch-embed";

    useEffect(() => {
        // Clear any existing player
        const container = document.getElementById(embedId);
        if (container) container.innerHTML = '';

        const initPlayer = () => {
            // @ts-ignore
            if (window.Twitch && window.Twitch.Player) {
                // @ts-ignore
                new window.Twitch.Player(embedId, {
                    channel: channel,
                    width: "100%",
                    height: "100%",
                    // Parent is required for Twitch embeds to work in most environments
                    parent: [window.location.hostname, 'localhost', '127.0.0.1']
                });
            }
        };

        // Check if script exists
        if (!document.getElementById('twitch-js-sdk')) {
            const script = document.createElement('script');
            script.id = 'twitch-js-sdk';
            script.src = "https://player.twitch.tv/js/embed/v1.js";
            script.async = true;
            script.onload = initPlayer;
            document.body.appendChild(script);
        } else {
            // If script is already loaded, wait a tick to ensure window.Twitch is ready or just init
            setTimeout(initPlayer, 500);
        }

        return () => {
            const c = document.getElementById(embedId);
            if (c) c.innerHTML = '';
        };
    }, [channel]);

    return <div id={embedId} className="w-full h-full bg-black" />;
};

// --- OPTIMIZED TACTICAL BACKGROUND (Context Aware) ---
const TacticalMap: React.FC<{ color: string; intensity?: number }> = ({ color, intensity = 1 }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (!mountRef.current) return;
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        const isMobile = window.innerWidth < 768;
        // Optimization: Drastically reduce pixel ratio and object counts on mobile
        const pixelRatio = Math.min(window.devicePixelRatio, isMobile ? 1 : 1.5);

        const scene = new THREE.Scene();
        // Deep fog to hide edges
        scene.fog = new THREE.FogExp2(0x05050a, 0.04);

        const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 50);
        camera.position.set(0, -12, 8);
        camera.lookAt(0, 0, 0);
        
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'high-performance' });
        renderer.setSize(width, height);
        renderer.setPixelRatio(pixelRatio);
        mountRef.current.appendChild(renderer.domElement);
        
        // 1. Terrain Grid (Low poly on mobile)
        const segs = isMobile ? 16 : 40;
        const gridGeo = new THREE.PlaneGeometry(60, 60, segs, segs);
        const gridMat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(color) },
                uIntensity: { value: intensity }
            },
            vertexShader: `
                varying vec2 vUv;
                varying float vElev;
                uniform float uTime;
                void main() {
                    vUv = uv;
                    vec3 pos = position;
                    float dist = distance(uv, vec2(0.5));
                    float wave = sin(dist * 10.0 - uTime * 1.5) * exp(-dist * 3.5) * 2.0;
                    pos.z += wave;
                    vElev = wave;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                varying vec2 vUv;
                varying float vElev;
                uniform vec3 uColor;
                uniform float uIntensity;
                void main() {
                    // Create grid lines using step
                    float grid = step(0.96, fract(vUv.x * ${segs}.0)) + step(0.96, fract(vUv.y * ${segs}.0));
                    float alpha = (grid * 0.3 + vElev * 0.3) * (1.0 - distance(vUv, vec2(0.5)) * 1.5);
                    gl_FragColor = vec4(uColor, alpha * uIntensity);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        const terrain = new THREE.Mesh(gridGeo, gridMat);
        terrain.rotation.x = -0.3;
        scene.add(terrain);

        // 2. Particles (Minimal on mobile)
        const pCount = isMobile ? 20 : 80;
        const pGeo = new THREE.BufferGeometry();
        const pPos = new Float32Array(pCount * 3);
        for(let i=0; i<pCount; i++) {
            pPos[i*3] = (Math.random()-0.5) * 40;
            pPos[i*3+1] = (Math.random()-0.5) * 40;
            pPos[i*3+2] = Math.random() * 4;
        }
        pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
        const pMat = new THREE.PointsMaterial({ color: color, size: 0.15, transparent: true, opacity: 0.6 * intensity });
        const particles = new THREE.Points(pGeo, pMat);
        scene.add(particles);

        const clock = new THREE.Clock();
        let frameId = 0;

        const animate = () => {
            frameId = requestAnimationFrame(animate);
            const t = clock.getElapsedTime();
            gridMat.uniforms.uTime.value = t;
            
            // Subtle camera movement
            camera.position.x = Math.sin(t * 0.1) * 2;
            camera.lookAt(0,0,0);
            
            renderer.render(scene, camera);
        };
        animate();

        return () => {
            cancelAnimationFrame(frameId);
            if(mountRef.current && renderer.domElement) mountRef.current.removeChild(renderer.domElement);
            renderer.dispose();
            gridGeo.dispose();
            gridMat.dispose();
        };
    }, [color, intensity]);

    return <div ref={mountRef} className="absolute inset-0 pointer-events-none z-0" />;
};

// --- LIVE TELEMETRY (Exclusive Leaderboard) ---
interface LiveTelemetryProps {
    teamA?: Team;
    teamB?: Team;
    color: string;
    teams: Record<string, Team>;
}

const LiveTelemetry: React.FC<LiveTelemetryProps> = ({ teamA, teamB, color, teams }) => {
    // Sort teams for leaderboard based on points logic
    const sortedTeams = useMemo(() => {
        return (Object.values(teams) as Team[]).sort((a, b) => {
            const pointsA = 1000 - (a.seed * 50) + a.breakdown.reduce((acc, c) => acc + c.points, 0);
            const pointsB = 1000 - (b.seed * 50) + b.breakdown.reduce((acc, c) => acc + c.points, 0);
            return pointsB - pointsA;
        });
    }, [teams]);

    return (
        <div className="flex flex-col h-full text-xs font-ui bg-[#0a0a0e]/95 backdrop-blur">
            {/* Single Header - No Tabs */}
            <div className="flex border-b border-white/5 shrink-0 bg-[#08080c] py-4 px-4 items-center justify-between">
                <div className="flex items-center gap-2">
                    <Trophy size={14} className="text-yellow-500" />
                    <span className="text-xs font-bold tracking-widest text-white">LIVE RANKING</span>
                </div>
                <div className="text-[9px] text-gray-500 font-mono animate-pulse">
                    UPDATING...
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
                <div className="space-y-2 animate-in fade-in duration-300">
                    {sortedTeams.map((team, idx) => {
                        // Calculate simple points for display
                        const points = 1000 - (team.seed * 50) + team.breakdown.reduce((acc, c) => acc + c.points, 0);
                        const isParticipants = (team.id === teamA?.id || team.id === teamB?.id);
                        
                        return (
                            <div 
                                key={team.id}
                                className={`
                                    relative flex items-center gap-3 p-3 rounded border transition-all duration-300
                                    ${isParticipants 
                                    ? 'bg-gradient-to-r from-white/10 to-transparent border-white/20' 
                                    : 'bg-black/20 border-white/5 opacity-60 hover:opacity-100'}
                                `}
                            >
                                {/* Rank */}
                                <div className={`font-mono font-bold w-6 text-center text-lg ${idx < 3 ? 'text-yellow-400 drop-shadow-md' : 'text-gray-600'}`}>
                                    {idx + 1}
                                </div>

                                {/* Logo */}
                                <div className="text-xl filter drop-shadow-lg">{team.logo}</div>

                                {/* Info */}
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <div className={`truncate font-bold text-sm ${isParticipants ? 'text-white' : 'text-gray-300'}`}>
                                        {team.name}
                                    </div>
                                    {isParticipants && (
                                        <div className="flex items-center gap-1 text-[9px] font-bold text-[var(--color)] animate-pulse mt-0.5" style={{'--color': team.color} as React.CSSProperties}>
                                            <Radio size={10} /> MATCH IN PROGRESS
                                        </div>
                                    )}
                                </div>

                                {/* Points */}
                                <div className="font-mono text-cyan-400 font-bold text-sm bg-black/40 px-2 py-1 rounded border border-white/5 shadow-inner">
                                    {points}
                                </div>
                                
                                {/* Active Marker */}
                                {isParticipants && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color)] rounded-l" style={{'--color': team.color} as React.CSSProperties}></div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// --- GAME CARD (FLIP Source) ---
interface GameCardProps {
    evt: GameEvent;
    isLarge?: boolean;
    teams: Record<string, Team>;
    onClick: (e: React.MouseEvent, evt: GameEvent) => void;
}

const GameCard: React.FC<GameCardProps> = ({ evt, isLarge = false, teams, onClick }) => {
    const isLive = evt.matches.some(m => m.status === 'live');
    const match = evt.matches[0];
    const tA = teams[match?.teamA];
    const tB = teams[match?.teamB];

    return (
        <div 
        onClick={(e) => onClick(e, evt)}
        className={`
            relative group cursor-pointer overflow-hidden rounded-xl bg-[#0f0f1a] border border-white/5
            transition-all duration-300 hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(124,58,237,0.15)]
            active:scale-[0.98]
            ${isLarge ? 'min-w-[85vw] md:min-w-[360px] aspect-[16/10]' : 'min-w-[260px] aspect-video'}
        `}
        >
            {/* Image & Gradient */}
            <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
                <img src={evt.image} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500" alt={evt.title} loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#05050a] via-transparent to-transparent opacity-90"></div>
                {/* Holographic Scanline */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent -translate-y-full group-hover:translate-y-full transition-transform duration-1000 ease-in-out pointer-events-none"></div>
            </div>

            {/* Live Badge */}
            {isLive && (
                <div className="absolute top-3 left-3 bg-red-600/90 backdrop-blur text-white text-[9px] font-bold px-2 py-0.5 rounded-sm flex items-center gap-1 shadow-lg animate-pulse z-10">
                    <Radio size={8}/> LIVE
                </div>
            )}
            
            {/* Hover Play Action */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center border border-white/20 scale-75 group-hover:scale-100 transition-transform">
                    <Play size={16} fill="white" className="ml-0.5 text-white"/>
                </div>
            </div>

            {/* Footer Info */}
            <div className="absolute bottom-0 left-0 w-full p-3 md:p-4 z-10">
                <h3 className={`font-black font-cyber text-white leading-none mb-1.5 drop-shadow-md truncate ${isLarge ? 'text-lg md:text-xl' : 'text-sm'}`}>
                    {evt.title}
                </h3>
                {tA && tB ? (
                    <div className="flex items-center gap-2 text-[10px] text-gray-300 font-bold">
                        <div className="flex items-center gap-1 opacity-90 truncate max-w-[80px]"><span className="text-xs">{tA.logo}</span> {tA.name}</div>
                        <span className="text-purple-500 font-mono">VS</span>
                        <div className="flex items-center gap-1 opacity-90 truncate max-w-[80px]"><span className="text-xs">{tB.logo}</span> {tB.name}</div>
                    </div>
                ) : (
                    <div className="text-[10px] text-gray-500 font-mono">TBD VS TBD</div>
                )}
            </div>
        </div>
    );
};

// --- MAIN GRID ---
interface GamesGridProps {
  events: GameEvent[];
  teams: Record<string, Team>;
  onSelectEvent: (event: GameEvent) => void;
}

const GamesGrid: React.FC<GamesGridProps> = ({ events, teams }) => {
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isPlaying, setIsPlaying] = useState(false); // Video Playing State
  const [isTheater, setIsTheater] = useState(false); // Fullscreen Video Mode
  
  // Animation Refs
  const modalRef = useRef<HTMLDivElement>(null);
  const [originRect, setOriginRect] = useState<DOMRect | null>(null);

  // Derived Data
  const activeEvent = activeEventId ? events.find(e => e.id === activeEventId) : null;
  const activeMatch = activeEvent?.matches.find(m => m.status === 'live') || activeEvent?.matches[0];
  const activeTeamA = activeMatch ? teams[activeMatch.teamA] : null;
  const activeTeamB = activeMatch ? teams[activeMatch.teamB] : null;

  // Filter
  const filteredEvents = useMemo(() => {
      if (selectedCategory === 'ALL') return events;
      return events.filter(e => e.game.toUpperCase().includes(selectedCategory) || e.title.toUpperCase().includes(selectedCategory));
  }, [events, selectedCategory]);
  const liveEvents = filteredEvents.filter(e => e.matches.some(m => m.status === 'live'));
  const upcomingEvents = filteredEvents.filter(e => !e.matches.some(m => m.status === 'live'));

  // --- ACTIONS ---
  const handleCardClick = (e: React.MouseEvent, evt: GameEvent) => {
      // Capture start position for FLIP
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setOriginRect(rect);
      setActiveEventId(evt.id);
      setIsPlaying(false);
      setIsTheater(false);
      document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
      if (modalRef.current) {
          // Animate out
          gsap.to(modalRef.current, {
              opacity: 0,
              scale: 0.95,
              duration: 0.2,
              onComplete: () => {
                  setActiveEventId(null);
                  setOriginRect(null);
                  document.body.style.overflow = '';
              }
          });
      }
  };

  // Improved Video Helper
  const getStreamConfig = (url: string) => {
      if (!url) return { type: 'unknown', id: '' };

      // Twitch Channel
      if (url.includes('twitch.tv')) {
          const match = url.match(/(?:twitch\.tv\/)([^/?]+)/);
          const channel = match ? match[1] : '';
          // Handle 'player.twitch.tv' format if passed directly
          if (url.includes('player.twitch.tv')) {
              const chMatch = url.match(/channel=([^&]+)/);
              if (chMatch) return { type: 'twitch', id: chMatch[1] };
          }
          if (channel) return { type: 'twitch', id: channel };
      }

      // YouTube ID
      const ytRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const ytMatch = url.match(ytRegExp);
      if (ytMatch && ytMatch[2].length === 11) {
          return { type: 'youtube', id: ytMatch[2] };
      }

      // Fallback for direct YouTube embed URL
      if (url.includes('youtube.com/embed/')) {
           return { type: 'youtube', id: url }; // treat as generic URL if extraction fails
      }

      return { type: 'unknown', id: url };
  };

  const streamConfig = useMemo(() => {
      return getStreamConfig(activeMatch?.streamUrl || '');
  }, [activeMatch?.streamUrl]);

  // --- FLIP ANIMATION ---
  useLayoutEffect(() => {
      if (activeEvent && originRect && modalRef.current) {
          gsap.fromTo(modalRef.current, 
              {
                  // Start exactly where the card was
                  x: originRect.left + originRect.width/2 - window.innerWidth/2,
                  y: originRect.top + originRect.height/2 - window.innerHeight/2,
                  scaleX: originRect.width / window.innerWidth,
                  scaleY: originRect.height / window.innerHeight,
                  opacity: 0,
                  borderRadius: '12px',
              },
              {
                  x: 0,
                  y: 0,
                  scaleX: 1,
                  scaleY: 1,
                  opacity: 1,
                  borderRadius: '0px',
                  duration: 0.5,
                  ease: "expo.out",
                  clearProps: "all" // Important to remove transform after anim
              }
          );
      }
  }, [activeEvent, originRect]);

  // --- RENDER ---
  return (
    <div className="w-full max-w-[1800px] mx-auto pb-32 min-h-screen">
        
        {/* HEADER & FILTERS */}
        <div className="sticky top-20 z-20 bg-[#05050a]/90 backdrop-blur-md pt-4 pb-2 px-4 md:px-8 border-b border-white/5 transition-all">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black font-cyber text-white tracking-tighter">
                        OPS <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">CENTER</span>
                    </h1>
                    <div className="flex items-center gap-2 text-[9px] font-mono text-gray-500 uppercase tracking-widest mt-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                        Net_Status: Stable
                    </div>
                </div>
                
                {/* Horizontal Scroll Filter */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide mask-gradient-right">
                    {['ALL', 'FPS', 'MOBA', 'STRATEGY'].map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`
                                px-4 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap border transition-all
                                ${selectedCategory === cat 
                                    ? 'bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]' 
                                    : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/30 hover:text-white'}
                            `}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* --- GRID CONTENT --- */}
        <div className="space-y-8 mt-6">
            
            {/* LIVE RAIL */}
            {liveEvents.length > 0 && (
                <div className="pl-4 md:pl-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-1 h-4 bg-red-600 rounded-sm animate-pulse"></div>
                        <h2 className="text-xs font-bold font-ui text-white tracking-widest">LIVE FEED</h2>
                    </div>
                    {/* Snap Scrolling Rail */}
                    <div className="flex gap-4 overflow-x-auto pb-6 pr-4 scrollbar-hide snap-x snap-mandatory">
                        {liveEvents.map(evt => (
                            <div key={evt.id} className="snap-center shrink-0">
                                <GameCard evt={evt} isLarge={true} teams={teams} onClick={handleCardClick} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* UPCOMING GRID */}
            <div className="px-4 md:px-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-4 bg-gray-600 rounded-sm"></div>
                    <h2 className="text-xs font-bold font-ui text-gray-300 tracking-widest">SCHEDULE</h2>
                </div>
                {upcomingEvents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {upcomingEvents.map(evt => (
                            <GameCard key={evt.id} evt={evt} teams={teams} onClick={handleCardClick} />
                        ))}
                    </div>
                ) : (
                    <div className="w-full h-32 border border-dashed border-gray-800 rounded-lg flex items-center justify-center text-gray-600 font-mono text-[10px]">
                        NO OPS FOUND
                    </div>
                )}
            </div>
        </div>

        {/* --- FULLSCREEN MODAL (THEATER) --- */}
        {activeEvent && (
            <div 
                ref={modalRef}
                className="fixed inset-0 z-[100] bg-black flex flex-col overflow-hidden will-change-transform"
            >
                {/* 3D BG (Hidden in theater mode for performance) */}
                {!isTheater && (
                    <div className="absolute inset-0 z-0 opacity-40 transition-opacity duration-1000 pointer-events-none">
                        <TacticalMap color={activeMatch?.status === 'live' ? '#ef4444' : '#8b5cf6'} intensity={0.5} />
                    </div>
                )}

                {/* NAV BAR (Slides up in Theater Mode) */}
                <div className={`relative z-50 flex items-center justify-between px-4 h-14 bg-black/80 backdrop-blur-md border-b border-white/10 shrink-0 transition-transform duration-300 ${isTheater ? '-translate-y-full' : 'translate-y-0'}`}>
                    <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-full text-gray-300 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                    
                    <div className="flex flex-col items-center">
                         <span className="text-xs font-bold font-cyber text-white tracking-widest truncate max-w-[150px] md:max-w-xs">{activeEvent.title}</span>
                         {activeMatch?.status === 'live' && <span className="text-[9px] text-red-500 font-bold animate-pulse">LIVE TRANSMISSION</span>}
                    </div>
                    
                    {/* Toggle Theater Mode */}
                    <button 
                        onClick={() => setIsTheater(!isTheater)}
                        className="text-gray-400 hover:text-white p-2"
                    >
                        {isTheater ? <Minimize2 size={18}/> : <Maximize2 size={18}/>}
                    </button>
                </div>

                {/* MAIN CONTENT SPLIT */}
                <div className="relative z-40 flex-1 flex flex-col lg:flex-row overflow-hidden">
                    
                    {/* VIDEO PLAYER AREA */}
                    <div className={`
                        relative bg-black flex items-center justify-center shrink-0
                        ${isTheater ? 'w-full h-full' : 'w-full lg:flex-1 lg:h-full lg:w-auto'}
                    `}>
                        {/* INNER WRAPPER: Ensures strict 16:9 ratio */}
                        <div className={`
                            relative w-full aspect-video
                            ${isTheater || window.innerWidth >= 1024 ? 'max-h-full max-w-full' : ''}
                        `}>
                            {/* STREAM RENDERER */}
                            {isPlaying && activeMatch?.streamUrl ? (
                                <div className="absolute inset-0 w-full h-full animate-in fade-in duration-500 bg-black group/video">
                                    
                                    {/* Twitch JS SDK Player */}
                                    {streamConfig.type === 'twitch' && (
                                        <TwitchPlayer channel={streamConfig.id} />
                                    )}

                                    {/* YouTube Iframe */}
                                    {streamConfig.type === 'youtube' && (
                                        <iframe 
                                            src={`https://www.youtube.com/embed/${streamConfig.id.includes('http') ? streamConfig.id.split('/').pop() : streamConfig.id}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
                                            className="w-full h-full border-0"
                                            title={activeEvent.title}
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                            referrerPolicy="strict-origin-when-cross-origin"
                                            allowFullScreen
                                        />
                                    )}

                                    {/* Unknown Source Fallback */}
                                    {streamConfig.type === 'unknown' && (
                                         <iframe 
                                            src={activeMatch.streamUrl}
                                            className="w-full h-full border-0"
                                            title="Stream"
                                            allowFullScreen
                                         />
                                    )}
                                    
                                    {/* THEATER CONTROLS OVERLAY (Mobile Friendly) */}
                                    {isTheater && (
                                        <div className="absolute inset-0 pointer-events-none z-[60] flex flex-col justify-between p-4 mobile-controls-always-visible">
                                            {/* Top Bar: Back Button */}
                                            <div className="flex justify-between items-start">
                                                <button 
                                                    onClick={() => setIsTheater(false)}
                                                    className="pointer-events-auto text-white p-3 rounded-full bg-black/60 backdrop-blur-md hover:bg-white/20 border border-white/10 transition-all shadow-lg active:scale-95"
                                                    aria-label="Exit Fullscreen"
                                                >
                                                    <ArrowLeft size={28} />
                                                </button>

                                                {/* Live Indicator Top Right */}
                                                <div className="px-3 py-1 bg-black/60 backdrop-blur rounded border border-red-900/50 text-[10px] font-bold text-red-500 animate-pulse shadow-lg">
                                                    LIVE
                                                </div>
                                            </div>
                                            
                                            {/* Bottom Bar: Minimize */}
                                            <div className="flex justify-end items-end">
                                                <button 
                                                    onClick={() => setIsTheater(false)}
                                                    className="pointer-events-auto text-white p-3 rounded-full bg-black/60 backdrop-blur-md hover:bg-white/20 border border-white/10 transition-all shadow-lg active:scale-95"
                                                    aria-label="Minimize"
                                                >
                                                    <Minimize2 size={24} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* Placeholder Image & Play Trigger */
                                <>
                                    <img src={activeEvent.image} className="absolute inset-0 w-full h-full object-cover opacity-60 blur-sm scale-110" alt="Background" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30"></div>
                                    
                                    <div className="relative z-10 w-full h-full flex flex-col items-center justify-center gap-4 p-6 text-center">
                                         {activeMatch?.streamUrl ? (
                                            <>
                                                <button 
                                                    onClick={() => setIsPlaying(true)}
                                                    className="group/play w-16 h-16 md:w-20 md:h-20 bg-red-600/90 hover:bg-red-600 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(220,38,38,0.5)] transition-transform hover:scale-110"
                                                >
                                                    <Play fill="white" className="ml-1 text-white group-hover/play:scale-110 transition-transform" size={32} />
                                                </button>
                                                <div className="bg-black/60 backdrop-blur px-3 py-1 rounded text-[10px] font-bold text-red-400 animate-pulse border border-red-500/30">
                                                    CLICK TO INITIALIZE FEED
                                                </div>
                                            </>
                                         ) : (
                                            <div className="px-6 py-3 bg-black/60 backdrop-blur border border-white/10 rounded-lg text-gray-400 font-mono text-xs tracking-widest flex flex-col items-center gap-2">
                                                <Radio size={16} className="text-gray-600"/>
                                                SIGNAL OFFLINE
                                            </div>
                                         )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* TELEMETRY DRAWER */}
                    <div className={`
                        bg-[#0a0a0a] border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col relative z-50 shadow-2xl transition-all duration-500
                        ${isTheater ? 'w-0 lg:w-0 opacity-0 overflow-hidden hidden' : 'flex-1 lg:flex-none lg:w-[340px] opacity-100'}
                    `}>
                        {/* Match Score Compact Header */}
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#0e0e12] shrink-0">
                            {activeMatch && activeTeamA && activeTeamB ? (
                                <>
                                    <div className="flex flex-col items-center w-16">
                                        <span className="text-2xl mb-1">{activeTeamA.logo}</span>
                                        <span className="text-[10px] font-bold text-gray-400 tracking-widest">{activeTeamA.id.toUpperCase()}</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <div className="text-xl font-black font-mono text-white tracking-widest bg-white/5 px-4 py-1 rounded border border-white/10">
                                            {activeMatch.scoreA} : {activeMatch.scoreB}
                                        </div>
                                        <span className={`text-[8px] font-bold mt-1 animate-pulse ${activeMatch.status === 'live' ? 'text-red-500' : 'text-gray-500'}`}>
                                            {activeMatch.status === 'live' ? 'LIVE' : activeMatch.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-center w-16">
                                        <span className="text-2xl mb-1">{activeTeamB.logo}</span>
                                        <span className="text-[10px] font-bold text-gray-400 tracking-widest">{activeTeamB.id.toUpperCase()}</span>
                                    </div>
                                </>
                            ) : (
                                <div className="w-full text-center text-xs text-gray-500 font-mono py-2">NO ACTIVE MATCH DATA</div>
                            )}
                        </div>

                        {/* Telemetry Module (Scrollable) */}
                        <div className="flex-1 overflow-y-auto relative scrollbar-hide">
                             <LiveTelemetry 
                                teamA={activeTeamA} 
                                teamB={activeTeamB} 
                                color={activeMatch?.status === 'live' ? '#ef4444' : '#8b5cf6'} 
                                teams={teams}
                             />
                        </div>
                    </div>

                </div>
            </div>
        )}
        
        {/* Mobile Style Override to ensure controls are visible on touch devices */}
        <style dangerouslySetInnerHTML={{__html: `
            @media (hover: none) {
                .mobile-controls-always-visible {
                    opacity: 1 !important;
                    background: linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.6) 100%);
                }
            }
        `}} />
    </div>
  );
};

export default GamesGrid;
