
import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { 
    ChevronLeft, Facebook, Twitter, Youtube, Dribbble, Trophy, 
    Gamepad2, Download, MoreHorizontal, Target, Swords, Crosshair, Users,
    Calendar, Clock, Shield, MapPin, User, ChevronRight, Crown, Brain, Monitor
} from 'lucide-react';
import { Team } from '../types';
import gsap from 'gsap';
import * as THREE from 'three';
import BracketOverlay from './BracketOverlay';

interface TournamentsViewProps {
    onNavigate: (view: 'games' | 'leaderboard' | 'scanner' | 'tournaments') => void;
    currentTeam: Team;
}

// --- GAME DATA ---
const GAMES = [
    { 
        id: 'mlbb', 
        name: 'Mobile Legends: Bang Bang', 
        short: 'MLBB', 
        icon: Swords,
        logoScale: 1.2,
        bg: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&q=80',
        stats: { prize: '₳ 1,250,000', players: '5v5', entry: '500 PTS' }
    },
    { 
        id: 'val', 
        name: 'Valorant', 
        short: 'VALORANT', 
        icon: Crosshair, 
        logoScale: 1.0,
        bg: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=1600&q=80',
        stats: { prize: '₳ 2,000,000', players: '5v5', entry: '800 PTS' }
    },
    { 
        id: 'tekken', 
        name: 'Tekken 8', 
        short: 'TEKKEN 8', 
        icon: Gamepad2, 
        logoScale: 1.1,
        bg: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=1600&q=80',
        stats: { prize: '₳ 500,000', players: '1v1', entry: '200 PTS' }
    },
    { 
        id: 'chess', 
        name: 'Chess', 
        short: 'CHESS', 
        icon: Brain, 
        logoScale: 1.0,
        bg: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=1600&q=80',
        stats: { prize: '₳ 100,000', players: '1v1', entry: 'FREE' }
    }
];

// --- THREE.JS GLITCH SHADER ---
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
      
      // 1. Horizontal Tearing
      float stripId = floor(uv.y * 30.0 + uTime * 50.0);
      float shift = step(0.5, rand(vec2(stripId, 1.0))) * 0.2 * uIntensity * sin(uTime * 100.0);
      
      // 2. Block Noise
      vec2 blockId = floor(uv * vec2(15.0, 30.0) + vec2(uTime * 20.0, 0.0));
      float blockNoise = rand(blockId);
      float activeBlock = step(1.0 - (uIntensity * 0.8), blockNoise); 
      
      // 3. Scanline Interference
      float scan = sin(uv.y * 300.0 - uTime * 20.0) * 0.2 * uIntensity;
      
      // 4. Color Composition
      vec3 col = uColor;
      
      if (rand(blockId + 1.0) > 0.7) col = vec3(1.0) - col;
      if (uIntensity > 0.8 && rand(vec2(uTime, 0.0)) > 0.5) col = vec3(1.0);

      float alpha = 0.0;
      alpha += activeBlock;
      alpha += abs(shift) * 5.0; 
      alpha += scan;
      
      float vignette = smoothstep(0.0, 0.2, uv.y) * smoothstep(1.0, 0.8, uv.y);
      gl_FragColor = vec4(col, clamp(alpha * uIntensity * vignette, 0.0, 1.0));
  }
`;

// --- GLITCH OVERLAY COMPONENT ---
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
            uniforms: {
                uTime: { value: 0 },
                uIntensity: { value: 0 },
                uColor: { value: new THREE.Color(color) }
            },
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        materialRef.current = mat;
        
        const mesh = new THREE.Mesh(geo, mat);
        scene.add(mesh);

        const clock = new THREE.Clock();
        let fid = 0;
        const animate = () => {
            fid = requestAnimationFrame(animate);
            if (materialRef.current) {
                materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
            }
            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            if (mountRef.current) {
                const nw = mountRef.current.clientWidth;
                const nh = mountRef.current.clientHeight;
                renderer.setSize(nw, nh);
            }
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

    return (
        <div ref={mountRef} className="absolute inset-0 z-50 pointer-events-none mix-blend-screen" />
    );
};


const TournamentsView: React.FC<TournamentsViewProps> = ({ onNavigate, currentTeam }) => {
  const tc = currentTeam.color;
  const [selectedGameId, setSelectedGameId] = useState('mlbb');
  const [activeTab, setActiveTab] = useState<'info' | 'roster' | 'matches' | 'results'>('info');
  const [showBracket, setShowBracket] = useState(false);
  
  // Transition State
  const [glitchIntensity, setGlitchIntensity] = useState(0);
  const [isGlitching, setIsGlitching] = useState(false);
  const [clipPathStyle, setClipPathStyle] = useState<React.CSSProperties>({});
  
  const contentRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const gamesScrollRef = useRef<HTMLDivElement>(null);
  
  const currentGame = GAMES.find(g => g.id === selectedGameId) || GAMES[0];

  // Responsive Clip Path & Mobile Checks
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

  // LEGENDARY GLITCH TRANSITION
  const handleGameSelect = (gameId: string) => {
      if (gameId === selectedGameId || isGlitching) return;
      setIsGlitching(true);

      const tl = gsap.timeline({
          onComplete: () => {
              setIsGlitching(false);
              setGlitchIntensity(0);
          }
      });

      // 1. IGNITION
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

      // 2. THE SWAP
      tl.call(() => {
          setSelectedGameId(gameId);
      });

      // 3. WHITEOUT FLASH
      tl.to(mainContentRef.current, {
          opacity: 0,
          duration: 0.05,
          yoyo: true,
          repeat: 1, 
      }, ">-0.1");

      // 4. RECONSTRUCTION
      tl.to(glitchObj, {
          val: 0,
          duration: 0.4,
          ease: "power2.out",
          onUpdate: () => setGlitchIntensity(glitchObj.val)
      });

      tl.fromTo(mainContentRef.current, 
          { 
              scaleY: 0.1, 
              scaleX: 1.1,
              skewX: 10,
              filter: "hue-rotate(90deg) brightness(2)",
              opacity: 1
          },
          { 
              scaleY: 1,
              scaleX: 1,
              skewX: 0,
              filter: "none",
              duration: 0.4, 
              ease: "elastic.out(1, 0.75)",
              clearProps: "all"
          }, 
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

  // Stagger Transition on Tab Change
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
      switch (activeTab) {
          case 'info':
              return (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
                      {/* Left Column (2/3) */}
                      <div className="lg:col-span-2 space-y-8">
                          
                          {/* Process Steps - Responsive Layout */}
                          <div className="bg-[#13131c] border border-white/5 rounded-xl p-6 md:p-8 relative overflow-hidden">
                              
                              {/* DESKTOP LAYOUT (Horizontal) */}
                              <div className="hidden md:flex items-center justify-between">
                                  {/* Step 1 */}
                                  <div className="flex-1">
                                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-2">REGISTRATION</div>
                                      <div className="flex items-center gap-3">
                                          <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]"></div>
                                          <span className="text-lg font-bold text-yellow-500 tracking-wide">Open</span>
                                      </div>
                                  </div>
                                  <div className="px-4 text-gray-700/50"><ChevronRight size={40} strokeWidth={1} /></div>
                                  
                                  {/* Step 2 */}
                                  <div className="flex-1">
                                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-2">CONFIRMATION</div>
                                      <div className="flex items-center gap-3">
                                          <div className="w-2 h-2 rounded-full border-2 border-gray-600 bg-transparent"></div>
                                          <span className="text-lg font-bold text-white tracking-wide">Pending</span>
                                      </div>
                                  </div>
                                  <div className="px-4 text-gray-700/50"><ChevronRight size={40} strokeWidth={1} /></div>

                                  {/* Step 3 */}
                                  <div className="flex-1">
                                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-2">SEEDING</div>
                                      <div className="flex items-center gap-3">
                                          <div className="w-2 h-2 rounded-full border-2 border-gray-600 bg-transparent"></div>
                                          <span className="text-lg font-bold text-white tracking-wide">Pending</span>
                                      </div>
                                  </div>
                              </div>

                              {/* MOBILE LAYOUT (Refined Alignment) */}
                              <div className="md:hidden relative">
                                  {/* Continuous Line - Aligned through centers of dots (dots are in 24px container, center 12px) */}
                                  <div className="absolute left-[11px] top-6 bottom-4 w-[2px] bg-[#1f1f2e] z-0"></div>

                                  <div className="flex flex-col gap-6">
                                      {/* Item 1 */}
                                      <div>
                                          <div className="pl-9 text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-1">REGISTRATION</div>
                                          <div className="flex items-center gap-3">
                                              <div className="w-6 flex justify-center shrink-0 relative z-10">
                                                  <div className="w-4 h-4 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)] border-2 border-[#13131c]"></div>
                                              </div>
                                              <div className="text-lg font-bold text-yellow-500 leading-none">Open</div>
                                          </div>
                                      </div>

                                      {/* Item 2 */}
                                      <div>
                                          <div className="pl-9 text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-1">CONFIRMATION</div>
                                          <div className="flex items-center gap-3">
                                              <div className="w-6 flex justify-center shrink-0 relative z-10">
                                                  <div className="w-4 h-4 rounded-full bg-[#13131c] border-2 border-gray-600"></div>
                                              </div>
                                              <div className="text-lg font-bold text-gray-500 leading-none">Pending</div>
                                          </div>
                                      </div>

                                      {/* Item 3 */}
                                      <div>
                                          <div className="pl-9 text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-1">SEEDING</div>
                                          <div className="flex items-center gap-3">
                                              <div className="w-6 flex justify-center shrink-0 relative z-10">
                                                  <div className="w-4 h-4 rounded-full bg-[#13131c] border-2 border-gray-600"></div>
                                              </div>
                                              <div className="text-lg font-bold text-gray-500 leading-none">Pending</div>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </div>

                          {/* About Section */}
                          <div>
                              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Tournament Brief</h3>
                              <p className="text-gray-300 leading-relaxed text-sm md:text-base font-ui">
                                  The {currentTeam.name} Invitational for <strong>{currentGame.name}</strong> is the premier proving ground. 
                                  Operatives will compete in a {currentGame.stats.players} bracket for the championship title and a share of the {currentGame.stats.prize} prize pool.
                                  <br/><br/>
                                  Matches will be broadcast live on the secure IT-VERSE uplink. Standard competitive rules apply.
                              </p>
                          </div>

                          <div className="h-px bg-white/10 w-full"></div>

                          {/* Rules / Specs */}
                          <div>
                              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Game Rules</h3>
                              <ul className="space-y-3">
                                  {[
                                      `Mode of play: ${currentGame.stats.players} Standard Competitive.`,
                                      "All operatives must be logged in to the secure client.",
                                      "Teams have 10 minutes to join the pre-game lobby.",
                                      "Anti-cheat software must be active at all times."
                                  ].map((rule, i) => (
                                      <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                                          <div className="mt-1.5 w-1.5 h-1.5 rotate-45 shrink-0" style={{backgroundColor: tc}}></div>
                                          {rule}
                                      </li>
                                  ))}
                              </ul>
                          </div>
                      </div>

                      {/* Right Column (1/3) - Sidebar Info */}
                      <div className="space-y-6">
                          {/* Active Roster Preview */}
                          <div className="bg-[#13131c]/60 p-6 rounded-lg border border-white/5">
                              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Registered Players</h4>
                              <div className="flex -space-x-2 overflow-hidden mb-6 pl-1">
                                  {[1,2,3,4,5].map(i => (
                                      <img key={i} className="inline-block h-10 w-10 rounded-full ring-2 ring-[#13131c] object-cover" src={`https://picsum.photos/100/100?random=${i + (selectedGameId.length * 10)}`} alt=""/>
                                  ))}
                                  <div className="h-10 w-10 rounded-full bg-gray-800 ring-2 ring-[#13131c] flex items-center justify-center text-xs font-bold text-white">
                                      +{Math.floor(Math.random() * 20) + 5}
                                  </div>
                              </div>
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <Users size={14} /> Confirmed
                                    </div>
                                    <span className="text-base font-bold text-white">17 Players</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <Target size={14} /> Available
                                    </div>
                                    <span className="text-base font-bold text-white">3 Slots</span>
                                </div>
                              </div>
                          </div>
                      </div>
                  </div>
              );
          case 'roster':
              return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-10">
                      {Array.from({length: currentGame.id === 'chess' || currentGame.id === 'tekken' ? 4 : 8}).map((_, i) => (
                          <div key={i} className="bg-[#13131c]/60 border border-white/5 rounded-lg p-6 flex flex-col items-center hover:border-[var(--hl)] transition-all group hover:-translate-y-1" style={{'--hl': tc} as React.CSSProperties}>
                              <div className="w-24 h-24 rounded-full mb-4 p-0.5 bg-gradient-to-b from-[var(--hl)] to-transparent" style={{'--hl': tc} as React.CSSProperties}>
                                  <div className="w-full h-full rounded-full bg-black overflow-hidden relative">
                                      <img src={`https://picsum.photos/200?random=${i + selectedGameId.length + 50}`} className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-500" alt=""/>
                                  </div>
                              </div>
                              <div className="text-white font-bold mb-1 text-lg">Operative {i+1}</div>
                              <div className="text-xs text-gray-500 font-mono uppercase tracking-widest mb-3">{currentGame.id === 'chess' ? 'GRANDMASTER' : 'DUELIST'}</div>
                              <div className="flex gap-2 text-[10px] font-bold">
                                  <span className="bg-white/10 px-2 py-1 rounded text-gray-300">Win Rate {60 + i}%</span>
                              </div>
                          </div>
                      ))}
                  </div>
              );
          case 'matches':
              return (
                  <div className="space-y-4 pb-10">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-[#13131c] hover:bg-[#181824] rounded-xl p-5 flex flex-wrap md:flex-nowrap items-center justify-between transition-colors group border border-transparent hover:border-white/5 cursor-pointer">
                                <div className="flex items-center gap-5 w-full md:w-1/3 mb-4 md:mb-0">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 p-[2px]">
                                        <div className="w-full h-full bg-[#13131c] rounded-full flex items-center justify-center overflow-hidden opacity-80">
                                            <div className="w-full h-full bg-gray-800 opacity-50"></div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">OPPONENT</span>
                                        <span className="text-lg font-bold text-white group-hover:text-[var(--hl)] transition-colors" style={{'--hl': tc} as React.CSSProperties}>Team {String.fromCharCode(65+i)}</span>
                                    </div>
                                </div>
                                <div className="flex gap-16 w-full md:w-auto mb-4 md:mb-0 justify-center md:justify-start">
                                    <div className="flex flex-col items-center min-w-[80px]">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">SCORE</span>
                                        <span className="text-xl font-bold text-white font-mono">{i % 2 === 0 ? '13 - 5' : '2 - 1'}</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">MAP</span>
                                        <span className="text-lg font-bold text-white">Default</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end w-1/2 md:w-auto">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">RESULT</span>
                                    <span className={`text-lg font-bold ${i % 2 === 0 ? 'text-[#22c55e]' : 'text-red-500'}`}>{i % 2 === 0 ? 'Victory' : 'Defeat'}</span>
                                </div>
                            </div>
                        ))}
                  </div>
              );
          case 'results':
              return (
                  <div className="space-y-4 pb-10">
                      {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center gap-6 group cursor-pointer p-6 bg-[#13131c]/60 rounded-xl border border-white/5 hover:bg-[#13131c] transition-colors">
                              <div className="w-20 h-20 rounded-full bg-[#1a1a24] p-0.5 transition-colors shrink-0 group-hover:bg-white" style={{ borderColor: tc }}>
                                  <img src={`https://images.unsplash.com/photo-1511512578047-dfb367046420?w=100&q=80`} className="w-full h-full rounded-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="" />
                              </div>
                              <div className="flex-1">
                                  <div className="text-2xl font-bold text-white transition-colors mb-2 group-hover:text-[var(--hl)]" style={{ '--hl': tc } as React.CSSProperties}>{currentGame.short} Cup {2024-i}</div>
                                  <div className="flex items-center gap-3">
                                      <span className="text-xs font-bold bg-white/10 px-3 py-1 rounded text-gray-300 uppercase tracking-wide">CHAMPION</span>
                                      <span className="text-xs text-gray-500">Dec 202{4-i}</span>
                                  </div>
                              </div>
                              <div className="text-yellow-500 opacity-50 group-hover:opacity-100 transition-opacity">
                                  <Trophy size={32} />
                              </div>
                          </div>
                      ))}
                  </div>
              );
      }
  };

  return (
    <div className="min-h-screen bg-[#05050a] text-white p-2 md:p-8 flex justify-center pt-20 md:pt-24 pb-20 font-sans relative overflow-hidden">
      
      {/* BRACKET OVERLAY (Triggered by Button) */}
      <BracketOverlay 
          isOpen={showBracket} 
          onClose={() => setShowBracket(false)} 
          gameName={currentGame.name}
          currentTeam={currentTeam}
      />

      {/* Background Watermark Logo (Screen Level) */}
      <div 
        className="absolute top-20 right-[-10%] text-[40rem] opacity-[0.03] pointer-events-none select-none font-sans font-black fixed"
        style={{ color: tc }}
      >
        {currentTeam.logo}
      </div>

      {/* MAIN CARD CONTAINER */}
      <div className="w-full max-w-[1400px] min-h-[85vh] relative bg-[#0b0b14] z-10 shadow-2xl group/card flex flex-col">
        
        {/* --- DYNAMIC LORE BACKGROUND LAYER --- */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none rounded-lg">
            {/* 1. Character/Atmosphere Image */}
            <div 
                className="absolute inset-0 bg-cover bg-center opacity-10 mix-blend-luminosity grayscale transition-transform duration-[20s] ease-linear group-hover/card:scale-110"
                style={{ backgroundImage: `url(${currentGame.bg})` }}
            ></div>
            {/* 2. Team Color Gradient Map */}
            <div 
                className="absolute inset-0 opacity-40 mix-blend-overlay"
                style={{ background: `radial-gradient(circle at 80% 20%, ${tc}, transparent 70%), linear-gradient(to bottom, transparent, #0b0b14)` }}
            ></div>
            {/* 3. Tech Pattern Overlay */}
            <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: `linear-gradient(45deg, ${tc} 25%, transparent 25%, transparent 75%, ${tc} 75%, ${tc})`, backgroundSize: '20px 20px' }}></div>
            {/* 4. Vignette */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0b0b14] via-[#0b0b14]/90 to-transparent"></div>
        </div>

        {/* Clip Path Border */}
        <div className="absolute inset-0 border-[1px] border-white/10 pointer-events-none z-20" style={clipPathStyle}></div>
        
        {/* Content Wrapper */}
        <div className="w-full h-full grid grid-cols-1 lg:grid-cols-12 relative z-10" style={clipPathStyle}>
            
            {/* --- LEFT SIDEBAR (Desktop Only) --- */}
            <div className="hidden lg:flex lg:col-span-4 bg-[#0f0f1a]/80 backdrop-blur-sm p-5 md:p-12 border-r border-white/5 flex-col relative shrink-0">
                <div className="sticky top-24">
                    {/* Back Link */}
                    <button onClick={() => onNavigate('games')} className="flex items-center gap-3 text-sm font-bold text-gray-400 hover:text-white uppercase tracking-widest mb-6 md:mb-12 transition-colors group">
                        <div className="w-8 h-8 bg-[#1a1a24] rounded flex items-center justify-center transition-colors group-hover:text-white text-gray-500" style={{ backgroundColor: `${tc}10` }}>
                            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        </div>
                        Back to Arena
                    </button>

                    {/* Team Logo & Name */}
                    <div className="mb-6 md:mb-10 relative">
                        <div className="relative w-20 h-20 md:w-32 md:h-32 mb-4 md:mb-6 group">
                            <div className="absolute inset-0 rounded-full p-[2px] bg-gradient-to-b to-transparent" style={{ backgroundImage: `linear-gradient(to bottom, ${tc}, transparent)` }}>
                                <div className="w-full h-full rounded-full bg-[#0f0f1a] flex items-center justify-center relative overflow-hidden">
                                    <span className="text-4xl md:text-6xl select-none transform group-hover:scale-110 transition-transform duration-500">{currentTeam.logo}</span>
                                    <div className="absolute inset-0 opacity-20" style={{ backgroundColor: tc }}></div>
                                </div>
                            </div>
                            <div className="absolute bottom-2 right-1 w-3 h-3 md:w-5 md:h-5 bg-[#22c55e] rounded-full border-2 border-[#0f0f1a] shadow-[0_0_10px_#22c55e]"></div>
                        </div>
                        <h1 className="text-3xl sm:text-4xl md:text-6xl font-black font-cyber text-white mb-2 tracking-wide break-words leading-none">{currentTeam.name}</h1>
                        <div className="text-[10px] md:text-xs font-mono uppercase tracking-[0.2em] mb-4 text-gray-500 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tc }}></span>
                            OFFICIAL FACTION PROFILE
                        </div>
                    </div>

                    {/* Faction Rank Card */}
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

                    {/* Watch Live Button */}
                    <button 
                        onClick={() => onNavigate('games')}
                        className="w-full h-12 md:h-14 text-white font-bold text-xs md:text-sm uppercase tracking-widest rounded flex items-center justify-center gap-3 shadow-lg mb-4 md:mb-12 hover:brightness-125 transition-all overflow-hidden relative group"
                        style={{ backgroundImage: `linear-gradient(to right, ${tc}, ${tc}aa)`, boxShadow: `0 10px 30px -10px ${tc}66` }}
                    >
                        <span className="relative z-10 flex items-center gap-3">
                            Watch Live <span className="bg-black/30 px-2 py-1 rounded text-[10px] md:text-xs font-mono opacity-90 flex items-center gap-2 border border-white/10"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div> STREAM</span>
                        </span>
                    </button>
                </div>
            </div>

            {/* --- RIGHT CONTENT AREA --- */}
            <div className="lg:col-span-8 bg-[#0b0b14] relative z-10 flex flex-col h-full">
                
                {/* MOBILE HEADER (Visible on Mobile Only) */}
                <div className="lg:hidden p-4 border-b border-white/5 flex items-center justify-between bg-[#0f0f1a] shrink-0 sticky top-0 z-40">
                     <button onClick={() => onNavigate('games')} className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest active:text-white">
                        <ChevronLeft size={16} /> Back
                     </button>
                </div>

                {/* --- MOBILE-ONLY PROFILE CARD (Restored for Visibility) --- */}
                <div className="lg:hidden p-6 pb-2 relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--team-color)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" style={{ '--team-color': tc } as React.CSSProperties}></div>
                    
                    <div className="flex flex-col gap-6 mb-6">
                        <div className="w-20 h-20 relative">
                             <div className="absolute inset-0 rounded-full border-2 border-[var(--team-color)]/30 flex items-center justify-center bg-[#0a0a0a]" style={{ '--team-color': tc } as React.CSSProperties}>
                                 <span className="text-4xl">{currentTeam.logo}</span>
                             </div>
                             <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-[#0b0b14] rounded-full shadow-[0_0_10px_#22c55e]"></div>
                        </div>

                        <div>
                            <h1 className="text-4xl font-black font-cyber text-white leading-none tracking-wide mb-2 break-words">{currentTeam.name}</h1>
                            <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-[var(--team-color)] uppercase" style={{ '--team-color': tc } as React.CSSProperties}>
                                <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                                Official Faction Profile
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#13131c] rounded-lg border border-white/5 p-4 mb-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#1a1a24] flex items-center justify-center text-[var(--team-color)]" style={{ '--team-color': tc } as React.CSSProperties}>
                            <Trophy size={18} />
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Global Seed</div>
                            <div className="text-2xl font-black font-cyber text-white">#{currentTeam.seed}</div>
                        </div>
                    </div>

                    <button 
                        onClick={() => onNavigate('games')}
                        className="w-full py-3 bg-gradient-to-r from-[var(--team-color)] to-[var(--team-color)]/80 text-white font-bold text-xs uppercase tracking-widest rounded flex items-center justify-center gap-3 shadow-lg relative group overflow-hidden"
                        style={{ '--team-color': tc } as React.CSSProperties}
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            WATCH LIVE <span className="bg-black/20 px-1.5 py-0.5 rounded text-[9px] flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div> STREAM</span>
                        </span>
                    </button>
                </div>

                {/* 0. MY GAMES SELECTOR */}
                <div className="pt-4 md:pt-6 px-4 md:px-12 pb-4 border-b border-white/5 bg-[#0b0b14] z-30 shrink-0">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 md:mb-4">My Games</h3>
                    
                    <div className="relative group/carousel">
                        {/* Carousel Arrows (Absolute) */}
                        <button 
                            onClick={() => scrollGames('left')}
                            className="absolute left-0 top-0 bottom-0 w-8 md:w-12 z-20 flex items-center justify-center bg-gradient-to-r from-[#0b0b14] to-transparent text-white/70 hover:text-white transition-colors"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <button 
                            onClick={() => scrollGames('right')}
                            className="absolute right-0 top-0 bottom-0 w-8 md:w-12 z-20 flex items-center justify-center bg-gradient-to-l from-[#0b0b14] to-transparent text-white/70 hover:text-white transition-colors"
                        >
                            <ChevronRight size={24} />
                        </button>

                        {/* Carousel List */}
                        <div 
                            ref={gamesScrollRef}
                            className="flex gap-3 md:gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide px-8 md:px-12"
                        >
                            {GAMES.map((game, i) => {
                                const isSelected = selectedGameId === game.id;
                                const GameIcon = game.icon;
                                return (
                                    <button
                                        key={game.id}
                                        onClick={() => handleGameSelect(game.id)}
                                        className={`
                                            snap-start shrink-0 relative w-[90px] h-[120px] md:w-[120px] md:h-[160px] rounded-lg overflow-hidden transition-all duration-300 group
                                            ${isSelected ? 'shadow-[0_0_20px_var(--hl)] scale-105 z-10' : 'hover:scale-105 opacity-60 hover:opacity-100'}
                                        `}
                                        style={{ '--hl': tc } as React.CSSProperties}
                                    >
                                        {/* Bg */}
                                        <div className={`absolute inset-0 transition-colors duration-300 ${isSelected ? 'bg-[var(--hl)]' : 'bg-[#1a1a24]'}`}></div>
                                        
                                        {/* Content */}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                                            <div className={`
                                                w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center mb-2 md:mb-3 transition-colors duration-300
                                                ${isSelected ? 'bg-white text-[var(--hl)]' : 'bg-black/40 text-gray-400 group-hover:text-white'}
                                            `}>
                                                <GameIcon size={18} className="md:w-6 md:h-6" />
                                            </div>
                                            <div className={`text-[9px] md:text-xs font-bold uppercase tracking-wider text-center leading-tight ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                                                {game.short}
                                            </div>
                                            <div className={`text-[8px] md:text-[9px] font-mono mt-1 opacity-60 ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                                                #{230 + i * 40}
                                            </div>
                                        </div>
                                        
                                        {/* Active Indicator */}
                                        {isSelected && (
                                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full shadow-[0_0_5px_white]"></div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* MAIN CONTENT + GLITCH OVERLAY */}
                <div className="flex-1 flex flex-col min-h-0 relative bg-[#0b0b14]">
                    {/* The Legendary Glitch Overlay */}
                    <GlitchOverlay color={tc} intensity={glitchIntensity} />

                    <div ref={mainContentRef} className="flex-1 flex flex-col min-h-0 relative will-change-transform">
                        {/* 1. HEADER BANNER */}
                        <div className="relative h-56 md:h-80 w-full overflow-hidden shrink-0">
                            <img src={currentGame.bg} className="w-full h-full object-cover object-center opacity-60" alt="Banner" />
                            <div className="absolute inset-0 bg-gradient-to-r from-[#0b0b14] via-[var(--color)]/20 to-transparent mix-blend-multiply" style={{ '--color': tc } as React.CSSProperties}></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b14] to-transparent"></div>
                            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:4px_4px]"></div>

                            <div className="absolute bottom-0 left-0 w-full p-5 md:p-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                                <div className="max-w-2xl">
                                    <div className="text-[10px] md:text-xs font-bold font-mono tracking-[0.2em] text-[var(--color)] mb-2 uppercase flex items-center gap-2" style={{ '--color': tc } as React.CSSProperties}>
                                        <Trophy size={14} /> {currentGame.short} Championship Series
                                    </div>
                                    <h2 className="text-3xl sm:text-4xl md:text-6xl font-black font-cyber text-white leading-none tracking-tighter mb-4 drop-shadow-xl text-shadow-glow">
                                        {currentTeam.name.split(' ')[0].toUpperCase()} <br/> <span className="text-[var(--color)]" style={{ '--color': tc } as React.CSSProperties}>INVITATIONAL.</span>
                                    </h2>
                                    <div className="flex flex-wrap gap-2 md:gap-6 text-[10px] md:text-sm font-bold text-gray-300">
                                        <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded backdrop-blur-sm"><Calendar size={14} /> 24TH OCT</div>
                                        <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded backdrop-blur-sm"><Users size={14} /> {currentGame.stats.players} FORMAT</div>
                                        <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded backdrop-blur-sm"><Target size={14} /> ENTRY: {currentGame.stats.entry}</div>
                                    </div>
                                </div>

                                <div className="text-left md:text-right w-full md:w-auto flex flex-row md:flex-col justify-between items-center md:items-end gap-4 md:gap-0 hidden md:flex">
                                    <div>
                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Prize Pool</div>
                                        <div className="text-2xl md:text-4xl font-black font-mono text-white mb-0 md:mb-4">{currentGame.stats.prize}</div>
                                    </div>
                                    <div className="flex gap-2">
                                        {['12', '14', '03', '48'].map((num, i) => (
                                            <div key={i} className="flex flex-col items-center">
                                                <div className="bg-[#1a1a24] w-9 h-9 md:w-12 md:h-12 flex items-center justify-center rounded text-white font-bold font-mono text-base md:text-lg border border-white/10 shadow-lg">{num}</div>
                                                <span className="text-[8px] font-bold text-gray-500 mt-1 uppercase tracking-widest">{['DAY', 'HOUR', 'MIN', 'SEC'][i]}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. NAVIGATION TABS */}
                        <div className="px-4 md:px-12 border-b border-white/5 bg-[#0b0b14]/95 backdrop-blur z-20 sticky top-20 flex flex-wrap items-center justify-between gap-4 shrink-0">
                            <div className="flex gap-6 md:gap-8 overflow-x-auto no-scrollbar w-full md:w-auto">
                                {['info', 'roster', 'matches', 'results'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab as any)}
                                        className={`py-4 md:py-5 text-xs md:text-sm font-bold uppercase tracking-[0.15em] border-b-2 transition-all whitespace-nowrap ${activeTab === tab ? 'text-white border-[var(--color)]' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
                                        style={activeTab === tab ? { borderColor: tc } : {}}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                            <button 
                                onClick={() => setShowBracket(true)}
                                className="flex items-center gap-2 text-xs font-bold text-gray-400 border border-white/10 px-4 py-2 rounded hover:bg-white/5 transition-colors uppercase tracking-widest w-full md:w-auto justify-center md:justify-start mb-4 md:mb-0"
                            >
                                <Swords size={14} /> View Brackets
                            </button>
                        </div>

                        {/* 3. CONTENT AREA (Scrollable) */}
                        <div className="flex-1 p-4 md:p-12 relative">
                            <div ref={contentRef}>
                                {renderContent()}
                            </div>
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
