
import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { 
    ChevronLeft, Facebook, Twitter, Youtube, Dribbble, Trophy, 
    Gamepad2, Download, MoreHorizontal, Target, Swords, Crosshair, Users,
    Calendar, Clock, Shield, MapPin, User, ChevronRight, Crown, Brain, Monitor, Timer, Mail
} from 'lucide-react';
import { Team, GameEvent } from '../types';
import gsap from 'gsap';
import * as THREE from 'three';
import BracketOverlay from './BracketOverlay';

interface TournamentsViewProps {
    onNavigate: (view: 'games' | 'leaderboard' | 'scanner' | 'tournaments') => void;
    currentTeam: Team;
    events: GameEvent[];
}

// Helper to normalize image URLs
const normalizeImageUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (url.startsWith('/')) {
    return url;
  }
  return `/uploads/${url}`;
};

// Shader Code (Preserved)
const GLITCH_VERTEX = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const GLITCH_FRAGMENT = `
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uColor;
  varying vec2 vUv;

  float rand(vec2 co){
      return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
  }

  void main() {
      vec2 uv = vUv;
      float stripId = floor(uv.y * 30.0 + uTime * 50.0);
      float shift = step(0.5, rand(vec2(stripId, 1.0))) * 0.2 * uIntensity * sin(uTime * 100.0);
      vec2 blockId = floor(uv * vec2(15.0, 30.0) + vec2(uTime * 20.0, 0.0));
      float blockNoise = rand(blockId);
      float activeBlock = step(1.0 - (uIntensity * 0.8), blockNoise); 
      float scan = sin(uv.y * 300.0 - uTime * 20.0) * 0.2 * uIntensity;
      vec3 col = uColor;
      if (rand(blockId + 1.0) > 0.7) col = vec3(1.0) - col;
      if (uIntensity > 0.8 && rand(vec2(uTime, 0.0)) > 0.5) col = vec3(1.0);
      float alpha = activeBlock + abs(shift) * 5.0 + scan;
      float vignette = smoothstep(0.0, 0.2, uv.y) * smoothstep(1.0, 0.8, uv.y);
      gl_FragColor = vec4(col, clamp(alpha * uIntensity * vignette, 0.0, 1.0));
  }
`;

const GlitchOverlay: React.FC<{ color: string, intensity: number }> = ({ color, intensity }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const materialRef = useRef<THREE.ShaderMaterial | null>(null);

    useEffect(() => {
        if (!mountRef.current) return;
        const w = mountRef.current.clientWidth;
        const h = mountRef.current.clientHeight;
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        mountRef.current.appendChild(renderer.domElement);
        const geo = new THREE.PlaneGeometry(2, 2);
        const mat = new THREE.ShaderMaterial({
            vertexShader: GLITCH_VERTEX,
            fragmentShader: GLITCH_FRAGMENT,
            uniforms: { uTime: { value: 0 }, uIntensity: { value: 0 }, uColor: { value: new THREE.Color(color) } },
            transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
        });
        materialRef.current = mat;
        const mesh = new THREE.Mesh(geo, mat);
        scene.add(mesh);
        const clock = new THREE.Clock();
        let fid = 0;
        const animate = () => {
            fid = requestAnimationFrame(animate);
            if (materialRef.current) materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
            renderer.render(scene, camera);
        };
        animate();
        const handleResize = () => {
            if (mountRef.current) renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(fid);
            renderer.dispose();
            if (mountRef.current) mountRef.current.innerHTML = '';
        };
    }, []);
    useEffect(() => {
        if (materialRef.current) {
            materialRef.current.uniforms.uIntensity.value = intensity;
            materialRef.current.uniforms.uColor.value.set(color);
        }
    }, [intensity, color]);
    return <div ref={mountRef} className="absolute inset-0 z-50 pointer-events-none mix-blend-screen" />;
};

const TournamentsView: React.FC<TournamentsViewProps> = ({ onNavigate, currentTeam, events }) => {
  // CRITICAL SAFETY CHECK: Ensure team and events exist before rendering to prevent black screen
  if (!currentTeam || !events || events.length === 0) {
      return (
          <div className="min-h-screen bg-[#05050a] flex items-center justify-center text-white font-mono animate-pulse">
              INITIALIZING TOURNAMENT DATA...
          </div>
      );
  }

  const tc = currentTeam.color;
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'info' | 'roster' | 'matches' | 'results'>('info');
  const [showBracket, setShowBracket] = useState(false);
  
  // Transition State
  const [glitchIntensity, setGlitchIntensity] = useState(0);
  const [isGlitching, setIsGlitching] = useState(false);
  const [clipPathStyle, setClipPathStyle] = useState<React.CSSProperties>({});
  
  const contentRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const gamesScrollRef = useRef<HTMLDivElement>(null);
  
  const currentEvent = events.find(e => e.id === selectedEventId) || events[0];
    const record = currentEvent?.teamRecord || { wins: 0, losses: 0, draws: 0, note: 'Awaiting battles' };
    const recordTotal = Math.max(1, (record.wins || 0) + (record.losses || 0) + (record.draws || 0));

  const formatStartTag = (iso?: string) => {
      if (!iso) return 'TBD';
      const d = new Date(iso);
      if (isNaN(d.getTime())) return 'TBD';
      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }).toUpperCase();
  };

  const formatEntryTag = (fee?: number | string | null) => {
      if (fee === null || fee === undefined) return 'FREE';
      if (typeof fee === 'number') return fee === 0 ? 'FREE' : `₱ ${fee}`;
      const trimmed = `${fee}`.trim();
      return trimmed.length === 0 ? 'FREE' : trimmed;
  };

  const [liveCountdown, setLiveCountdown] = useState({ day: '00', hour: '00', min: '00', sec: '00' });

  useEffect(() => {
      const targetIso = currentEvent.countdownEnd || currentEvent.startDate;
      if (!targetIso) return;

      const updateCountdown = () => {
          const target = new Date(targetIso).getTime();
          const now = Date.now();
          const diff = Math.max(0, target - now);
          const day = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hour = Math.floor((diff / (1000 * 60 * 60)) % 24);
          const min = Math.floor((diff / (1000 * 60)) % 60);
          const sec = Math.floor((diff / 1000) % 60);
          setLiveCountdown({
              day: String(day).padStart(2, '0'),
              hour: String(hour).padStart(2, '0'),
              min: String(min).padStart(2, '0'),
              sec: String(sec).padStart(2, '0')
          });
      };

      updateCountdown();
      const id = setInterval(updateCountdown, 1000);
      return () => clearInterval(id);
  }, [currentEvent.countdownEnd, currentEvent.startDate]);

  // Helper to get icon based on game type
  const getGameIcon = (game: string) => {
      if(game.includes('Mobile')) return Swords;
      if(game.includes('Valorant')) return Crosshair;
      if(game.includes('Tekken')) return Gamepad2;
      if(game.includes('Chess')) return Brain;
      return Trophy;
  };

  useLayoutEffect(() => {
      const updateSize = () => {
          const isMobile = window.innerWidth < 768;
          const size = isMobile ? '20px' : '40px';
          setClipPathStyle({
              clipPath: `polygon(${size} 0, 100% 0, 100% calc(100% - ${size}), calc(100% - ${size}) 100%, 0 100%, 0 ${size})`
          });
      };
      updateSize();
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleGameSelect = (eventId: string) => {
      if (eventId === selectedEventId || isGlitching) return;
      setIsGlitching(true);

      const tl = gsap.timeline({
          onComplete: () => {
              setIsGlitching(false);
              setGlitchIntensity(0);
          }
      });

      tl.to(mainContentRef.current, {
          skewX: -10,
          scale: 1.02,
          filter: "grayscale(100%) contrast(200%) brightness(1.5)",
          duration: 0.1,
          ease: "steps(1)"
      });

      const glitchObj = { val: 0 };
      tl.to(glitchObj, {
          val: 1, 
          duration: 0.25,
          ease: "expo.in",
          onUpdate: () => setGlitchIntensity(glitchObj.val)
      }, "<");

      tl.call(() => {
          setSelectedEventId(eventId);
      });

      tl.to(mainContentRef.current, {
          opacity: 0,
          duration: 0.05,
          yoyo: true,
          repeat: 1, 
      }, ">-0.1");

      tl.to(glitchObj, {
          val: 0,
          duration: 0.4,
          ease: "power2.out",
          onUpdate: () => setGlitchIntensity(glitchObj.val)
      });

      tl.fromTo(mainContentRef.current, 
          { scaleY: 0.1, scaleX: 1.1, skewX: 10, filter: "hue-rotate(90deg) brightness(2)", opacity: 1 },
          { scaleY: 1, scaleX: 1, skewX: 0, filter: "none", duration: 0.4, ease: "elastic.out(1, 0.75)", clearProps: "all" }, 
          "<"
      );
  };

  const scrollGames = (direction: 'left' | 'right') => {
      if (gamesScrollRef.current) {
          const current = gamesScrollRef.current;
          const scrollAmount = direction === 'left' ? -150 : 150;
          current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
  };

  useLayoutEffect(() => {
      if (contentRef.current) {
          const elements = contentRef.current.children;
          gsap.fromTo(elements, 
              { y: 15, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: "power2.out" }
          );
      }
  }, [activeTab]);

  const renderContent = () => {
      // Safety check for details object
      const details = currentEvent.details || { status: 'Pending', rules: [], brief: 'Loading...' };
      const isTeamBased = (() => {
          const g = (currentEvent.game || '').toLowerCase();
          const f = (details.format || '').toLowerCase();
          return f.includes('5v5') || g.includes('valorant') || g.includes('mobile legends');
      })();
      const registeredEntriesCount = (() => {
          const set = new Set<string>();
          currentEvent.matches?.forEach(m => { if (m.teamA) set.add(m.teamA); if (m.teamB) set.add(m.teamB); });
          currentEvent.bracket?.forEach(b => {
              if (b.p1?.id && b.p1.id !== 'tbd') set.add(b.p1.id);
              if (b.p2?.id && b.p2.id !== 'tbd') set.add(b.p2.id);
          });
          return set.size;
      })();

      switch (activeTab) {
          case 'info':
              return (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
                      <div className="lg:col-span-2 space-y-8">
                          
                          {/* Process Steps */}
                          <div className="bg-[#13131c] border border-white/5 rounded-xl p-6 md:p-8 relative overflow-hidden">
                              <div className="hidden md:flex items-center justify-between">
                                  <div className="flex-1">
                                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-2">REGISTRATION</div>
                                      <div className="flex items-center gap-3">
                                          <div className={`w-2 h-2 rounded-full ${details.status === 'Open' ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]' : 'border-2 border-gray-600'}`}></div>
                                          <span className={`text-lg font-bold tracking-wide ${details.status === 'Open' ? 'text-yellow-500' : 'text-gray-500'}`}>{details.status || 'Unknown'}</span>
                                      </div>
                                  </div>
                                  <div className="px-4 text-gray-700/50"><ChevronRight size={40} strokeWidth={1} /></div>
                                  <div className="flex-1">
                                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-2">CONFIRMATION</div>
                                      <div className="flex items-center gap-3">
                                          <div className={`w-2 h-2 rounded-full ${details.status === 'Pending' ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]' : 'border-2 border-gray-600'}`}></div>
                                          <span className={`text-lg font-bold tracking-wide ${details.status === 'Pending' ? 'text-yellow-500' : 'text-gray-500'}`}>Pending</span>
                                      </div>
                                  </div>
                                  <div className="px-4 text-gray-700/50"><ChevronRight size={40} strokeWidth={1} /></div>
                                  <div className="flex-1">
                                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-2">SEEDING</div>
                                      <div className="flex items-center gap-3">
                                          <div className="w-2 h-2 rounded-full border-2 border-gray-600 bg-transparent"></div>
                                          <span className="text-lg font-bold text-gray-500 tracking-wide">Pending</span>
                                      </div>
                                  </div>
                              </div>
                              {/* Mobile Status Steps (Simplified) */}
                              <div className="md:hidden flex flex-col gap-4">
                                  <div className="flex items-center gap-3">
                                      <div className={`w-3 h-3 rounded-full ${details.status === 'Open' ? 'bg-yellow-500' : 'bg-gray-700'}`}></div>
                                      <span className="text-sm font-bold text-white">Status: {details.status}</span>
                                  </div>
                              </div>
                          </div>

                          <div>
                              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Tournament Brief</h3>
                              <p className="text-gray-300 leading-relaxed text-sm md:text-base font-ui whitespace-pre-wrap">
                                  {details.brief}
                              </p>
                          </div>
                          <div className="h-px bg-white/10 w-full"></div>
                          <div>
                              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Game Rules</h3>
                              <ul className="space-y-3">
                                  {details.rules && details.rules.map((rule: string, i: number) => (
                                      <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                                          <div className="mt-1.5 w-1.5 h-1.5 rotate-45 shrink-0" style={{backgroundColor: tc}}></div>
                                          {rule}
                                      </li>
                                  ))}
                              </ul>
                          </div>
                      </div>
                      <div className="space-y-6">
                          <div className="bg-[#13131c]/60 p-6 rounded-lg border border-white/5">
                              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Registered</h4>
                              <div className="flex -space-x-2 overflow-hidden mb-6 pl-1">
                                  {[1,2,3,4,5].map(i => (
                                      <img key={i} className="inline-block h-10 w-10 rounded-full ring-2 ring-[#13131c] object-cover" src={`https://picsum.photos/100/100?random=${i + (selectedEventId.length * 10)}`} alt=""/>
                                  ))}
                                  <div className="h-10 w-10 rounded-full bg-gray-800 ring-2 ring-[#13131c] flex items-center justify-center text-xs font-bold text-white">+{Math.floor(Math.random() * 20) + 5}</div>
                              </div>
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-sm text-gray-400"><Users size={14} /> Confirmed</div>
                                    <span className="text-base font-bold text-white">{registeredEntriesCount} {isTeamBased ? 'Teams' : 'Players'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-sm text-gray-400"><Target size={14} /> Available</div>
                                    <span className="text-base font-bold text-white">3 Slots</span>
                                </div>
                              </div>
                          </div>
                      </div>
                  </div>
              );
          default:
              return <div className="p-8 text-center text-gray-500 font-mono">DATA_MODULE_OFFLINE</div>;
      }
  };

  const details = currentEvent.details || { status: 'Pending', prizePool: 'TBD', schedule: {}, format: 'Standard', entryFee: 'Free' };

  return (
    <div className="min-h-screen bg-[#05050a] text-white p-2 md:p-8 flex justify-center pt-20 md:pt-24 pb-20 font-sans relative overflow-hidden">
      
      <BracketOverlay 
          isOpen={showBracket} 
          onClose={() => setShowBracket(false)} 
          gameName={currentEvent.game}
          currentTeam={currentTeam}
          bracketData={currentEvent.bracket} 
      />

      <div className="absolute top-20 right-[-10%] opacity-[0.03] pointer-events-none select-none fixed overflow-hidden w-[40rem] h-[40rem]" style={{ color: tc }}>
        {typeof currentTeam.logo === 'string' && (currentTeam.logo.startsWith('data:') || currentTeam.logo.startsWith('http') || currentTeam.logo.startsWith('/')) ? (
            <img src={normalizeImageUrl(currentTeam.logo)} alt={currentTeam.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        ) : (
            <div className="text-[40rem] font-black font-sans">{currentTeam.logo}</div>
        )}
      </div>

      <div className="w-full max-w-[1400px] min-h-[85vh] relative bg-[#0b0b14] z-10 shadow-2xl group/card flex flex-col">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none rounded-lg">
            {(currentEvent.banner || currentEvent.image) && (
                <div className="absolute inset-0 bg-cover bg-center opacity-10 mix-blend-luminosity grayscale transition-transform duration-[20s] ease-linear group-hover/card:scale-110" style={{ backgroundImage: `url(${normalizeImageUrl(currentEvent.banner || currentEvent.image)})` }}></div>
            )}
            <div className="absolute inset-0 opacity-40 mix-blend-overlay" style={{ background: `radial-gradient(circle at 80% 20%, ${tc}, transparent 70%), linear-gradient(to bottom, transparent, #0b0b14)` }}></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#0b0b14] via-[#0b0b14]/90 to-transparent"></div>
        </div>

        <div className="absolute inset-0 border-[1px] border-white/10 pointer-events-none z-20" style={clipPathStyle}></div>
        
        <div className="w-full h-full grid grid-cols-1 lg:grid-cols-12 relative z-10" style={clipPathStyle}>
            
            <div className="hidden lg:flex lg:col-span-4 bg-[#0f0f1a]/80 backdrop-blur-sm p-5 md:p-12 border-r border-white/5 flex-col relative shrink-0">
                <div className="sticky top-24">
                    <button onClick={() => onNavigate('games')} className="flex items-center gap-3 text-sm font-bold text-gray-400 hover:text-white uppercase tracking-widest mb-6 md:mb-12 transition-colors group">
                        <div className="w-8 h-8 bg-[#1a1a24] rounded flex items-center justify-center transition-colors group-hover:text-white text-gray-500" style={{ backgroundColor: `${tc}10` }}>
                            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        </div>
                        Back to Arena
                    </button>

                    <div className="mb-6 md:mb-10 relative">
                        <div className="relative w-20 h-20 md:w-32 md:h-32 mb-4 md:mb-6 group">
                            <div className="absolute inset-0 rounded-full p-[2px] bg-gradient-to-b to-transparent" style={{ backgroundImage: `linear-gradient(to bottom, ${tc}, transparent)` }}>
                                <div className="w-full h-full rounded-full bg-[#0f0f1a] flex items-center justify-center relative overflow-hidden">
                                    {typeof currentTeam.logo === 'string' && (currentTeam.logo.startsWith('data:') || currentTeam.logo.startsWith('http') || currentTeam.logo.startsWith('/')) ? (
                                        <img src={normalizeImageUrl(currentTeam.logo)} alt={currentTeam.name} className="w-full h-full object-cover rounded-full" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = `<span class="text-4xl md:text-6xl select-none">🏆</span>`; }} />
                                    ) : (
                                        <span className="text-4xl md:text-6xl select-none transform group-hover:scale-110 transition-transform duration-500">{currentTeam.logo}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <h1 className="text-3xl sm:text-4xl md:text-6xl font-black font-cyber text-white mb-2 tracking-wide break-words leading-none">{currentTeam.name}</h1>
                        <div className="text-[10px] md:text-xs font-mono uppercase tracking-[0.2em] mb-4 text-gray-500 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tc }}></span>
                            OFFICIAL FACTION PROFILE
                        </div>
                    </div>

                    <div className="bg-[#13131c]/50 rounded-xl p-4 md:p-6 border border-white/5 flex items-center justify-between mb-6 md:mb-10 relative overflow-hidden backdrop-blur-md" style={{ borderColor: `${tc}30` }}>
                        <div className="flex items-center gap-4 md:gap-5 relative z-10">
                            <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-[#1a1a24] flex items-center justify-center text-gray-400">
                                <Trophy size={20} className="md:w-6 md:h-6" style={{ color: tc }} />
                            </div>
                            <div>
                                <div className="text-[10px] md:text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Global Seed</div>
                                <div className="text-2xl md:text-5xl font-black font-cyber text-white tracking-widest">#{currentTeam.seed}</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-[#13131c]/80 via-[#13131c]/60 to-[#0f0f1a]/90 rounded-xl p-4 md:p-6 border border-white/5 mb-6 md:mb-10 relative overflow-hidden backdrop-blur-md" style={{ borderColor: `${tc}30` }}>
                        <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle at 20% 20%, ${tc}, transparent 45%)` }}></div>
                        <div className="flex items-center justify-between relative z-10">
                            <div>
                                <div className="text-[10px] md:text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Tournament Mode</div>
                                <div className="flex items-end gap-3">
                                    <span className="text-3xl md:text-4xl font-black font-cyber text-white leading-none">{record.wins}-{record.losses}{record.draws ? `-${record.draws}` : ''}</span>
                                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-gray-400">W-L{record.draws ? '-D' : ''}</span>
                                </div>
                                <div className="mt-2 text-xs text-gray-400 uppercase tracking-widest">{record.note || 'Match history synced'}</div>
                            </div>
                            <div className="flex gap-2 text-[10px] md:text-xs font-bold uppercase tracking-widest">
                                <span className="px-3 py-1 rounded-full bg-white/10 text-white border border-white/10">W {record.wins}</span>
                                <span className="px-3 py-1 rounded-full bg-white/5 text-gray-300 border border-white/10">L {record.losses}</span>
                                {record.draws ? <span className="px-3 py-1 rounded-full bg-white/5 text-gray-300 border border-white/10">D {record.draws}</span> : null}
                            </div>
                        </div>
                        <div className="mt-4 h-2 w-full bg-white/5 rounded-full overflow-hidden relative">
                            <div className="absolute inset-0 flex">
                                <div className="h-full" style={{ width: `${Math.min(100, (record.wins || 0) / recordTotal * 100)}%`, backgroundColor: tc }}></div>
                                <div className="h-full bg-white/10" style={{ width: `${Math.min(100, (record.losses || 0) / recordTotal * 100)}%` }}></div>
                                {record.draws ? <div className="h-full bg-white/5" style={{ width: `${Math.min(100, (record.draws || 0) / recordTotal * 100)}%` }}></div> : null}
                            </div>
                        </div>
                    </div>

                    <button className="w-full mt-6 md:mt-8 py-3 md:py-4 px-4 md:px-6 rounded-xl font-bold uppercase tracking-widest text-sm md:text-base transition-all duration-300 group flex items-center justify-center gap-3 relative overflow-hidden" style={{ color: tc, borderColor: `${tc}40`, backgroundColor: `${tc}08` }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${tc}15`; e.currentTarget.style.borderColor = `${tc}60`; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = `${tc}08`; e.currentTarget.style.borderColor = `${tc}40`; }} onClick={() => currentEvent.organizer && alert(`Contact ${currentEvent.organizer.name}\n📧 ${currentEvent.organizer.email}\n🎮 Discord: ${currentEvent.organizer.discord || 'N/A'}\n📱 Phone: ${currentEvent.organizer.phone || 'N/A'}`)}>
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity" style={{ background: `radial-gradient(circle at 50% 50%, ${tc}, transparent)` }}></div>
                        <Mail size={18} className="md:w-5 md:h-5 relative z-10" />
                        <span className="relative z-10">Contact</span>
                    </button>
                </div>
            </div>

            <div className="lg:col-span-8 bg-[#0b0b14] relative z-10 flex flex-col h-full">
                <div className="lg:hidden p-4 border-b border-white/5 flex items-center justify-between bg-[#0f0f1a] shrink-0 sticky top-0 z-40">
                     <button onClick={() => onNavigate('games')} className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest active:text-white">
                        <ChevronLeft size={16} /> Back
                     </button>
                </div>

                <div className="pt-4 md:pt-6 px-4 md:px-12 pb-4 border-b border-white/5 bg-[#0b0b14] z-30 shrink-0">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 md:mb-4">Select Tournament</h3>
                    <div className="relative group/carousel">
                        <button onClick={() => scrollGames('left')} className="absolute left-0 top-0 bottom-0 w-8 md:w-12 z-20 flex items-center justify-center bg-gradient-to-r from-[#0b0b14] to-transparent text-white/70 hover:text-white transition-colors"><ChevronLeft size={24} /></button>
                        <button onClick={() => scrollGames('right')} className="absolute right-0 top-0 bottom-0 w-8 md:w-12 z-20 flex items-center justify-center bg-gradient-to-l from-[#0b0b14] to-transparent text-white/70 hover:text-white transition-colors"><ChevronRight size={24} /></button>
                        <div ref={gamesScrollRef} className="flex gap-3 md:gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide px-8 md:px-12">
                            {events.map((evt, i) => {
                                const isSelected = selectedEventId === evt.id;
                                const GameIcon = getGameIcon(evt.game);
                                const hasGameLogo = evt.gameLogo && (evt.gameLogo.startsWith('data:') || evt.gameLogo.startsWith('http'));
                                return (
                                    <button key={evt.id} onClick={() => handleGameSelect(evt.id)} className={`snap-start shrink-0 relative w-[90px] h-[120px] md:w-[120px] md:h-[160px] rounded-lg overflow-hidden transition-all duration-300 group ${isSelected ? 'shadow-[0_0_20px_var(--hl)] scale-105 z-10' : 'hover:scale-105 opacity-60 hover:opacity-100'}`} style={{ '--hl': tc } as React.CSSProperties}>
                                        <div className={`absolute inset-0 transition-colors duration-300 ${isSelected ? 'bg-[var(--hl)]' : 'bg-[#1a1a24]'}`}></div>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                                            <div className={`w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center mb-2 md:mb-3 transition-colors duration-300 overflow-hidden ${isSelected ? 'bg-white text-[var(--hl)]' : 'bg-black/40 text-gray-400 group-hover:text-white'}`}>
                                                {hasGameLogo ? (
                                                    <img src={normalizeImageUrl(evt.gameLogo)} alt={evt.game} className="w-full h-full object-contain p-1" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                                ) : (
                                                    <GameIcon size={18} className="md:w-6 md:h-6" />
                                                )}
                                            </div>
                                            <div className={`text-[9px] md:text-xs font-bold uppercase tracking-wider text-center leading-tight ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>{evt.shortName}</div>
                                        </div>
                                        {isSelected && <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full shadow-[0_0_5px_white]"></div>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0 relative bg-[#0b0b14]">
                    <GlitchOverlay color={tc} intensity={glitchIntensity} />
                    <div ref={mainContentRef} className="flex-1 flex flex-col min-h-0 relative will-change-transform">
                        <div className="relative h-56 md:h-80 w-full overflow-hidden shrink-0">
                            {(currentEvent.banner || currentEvent.image) && (
                                <img src={normalizeImageUrl(currentEvent.banner || currentEvent.image)} className="w-full h-full object-cover object-center opacity-60" alt="Banner" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-r from-[#0b0b14] via-[var(--color)]/20 to-transparent mix-blend-multiply" style={{ '--color': tc } as React.CSSProperties}></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b14] to-transparent"></div>
                            
                            <div className="absolute bottom-0 left-0 w-full p-5 md:p-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                                <div className="max-w-2xl">
                                    <div className="text-[10px] md:text-xs font-bold font-mono tracking-[0.2em] text-[var(--color)] mb-2 uppercase flex items-center gap-2" style={{ '--color': tc } as React.CSSProperties}><Trophy size={14} /> {currentEvent.shortName} Championship Series</div>
                                    <h2 className="text-3xl sm:text-4xl md:text-6xl font-black font-cyber text-white leading-none tracking-tight mb-4 drop-shadow-xl text-shadow-glow">
                                        {currentEvent.title}
                                    </h2>
                                    <div className="flex flex-wrap gap-2 md:gap-6 text-[10px] md:text-sm font-bold text-gray-300">
                                        <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded backdrop-blur-sm"><Calendar size={14} /> {formatStartTag(currentEvent.startDate)}</div>
                                        <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded backdrop-blur-sm"><Users size={14} /> {(currentEvent.format || details.format || 'TBD').toUpperCase()} FORMAT</div>
                                        <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded backdrop-blur-sm"><Target size={14} /> ENTRY: {formatEntryTag(currentEvent.entryFee ?? details.entryFee)}</div>
                                    </div>
                                </div>
                                
                                {/* REPLACED PRIZE POOL WITH GIANT COUNTDOWN */}
                                <div className="text-left md:text-right w-full md:w-auto flex flex-row md:flex-col justify-between items-center md:items-end gap-4 md:gap-0 hidden md:flex">
                                    <div>
                                        <div className="text-xs font-bold text-red-500 uppercase tracking-[0.3em] mb-2 flex items-center justify-end gap-2"><Timer size={14} className="animate-pulse"/> LIVE IN</div>
                                        <div className="flex gap-2">
                                            {(['day','hour','min','sec'] as const).map((k, i) => (
                                                <div key={i} className="flex flex-col items-center">
                                                    <div className="bg-[#1a1a24] w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-lg text-white font-black font-mono text-2xl md:text-3xl border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                                                        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-50"></div>
                                                        {liveCountdown[k]}
                                                    </div>
                                                    <span className="text-[8px] md:text-[10px] font-bold text-gray-500 mt-2 uppercase tracking-widest">{k}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="px-4 md:px-12 border-b border-white/5 bg-[#0b0b14]/95 backdrop-blur z-20 sticky top-20 flex flex-wrap items-center justify-between gap-4 shrink-0">
                            <div className="flex gap-6 md:gap-8 overflow-x-auto no-scrollbar w-full md:w-auto">
                                {['info', 'roster', 'matches', 'results'].map((tab) => (
                                    <button key={tab} onClick={() => setActiveTab(tab as any)} className={`py-4 md:py-5 text-xs md:text-sm font-bold uppercase tracking-[0.15em] border-b-2 transition-all whitespace-nowrap ${activeTab === tab ? 'text-white border-[var(--color)]' : 'text-gray-500 border-transparent hover:text-gray-300'}`} style={activeTab === tab ? { borderColor: tc } : {}}>{tab}</button>
                                ))}
                            </div>
                            <button onClick={() => setShowBracket(true)} className="flex items-center gap-2 text-xs font-bold text-gray-400 border border-white/10 px-4 py-2 rounded hover:bg-white/5 transition-colors uppercase tracking-widest w-full md:w-auto justify-center md:justify-start mb-4 md:mb-0"><Swords size={14} /> View Brackets</button>
                        </div>
                        <div className="flex-1 p-4 md:p-12 relative">
                            <div ref={contentRef}>{renderContent()}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentsView;
