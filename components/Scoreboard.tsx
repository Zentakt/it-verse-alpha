
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { Team } from '../types';
import { ChevronDown, Crown, Flame, Target, Zap, Activity, Trophy, Hash, ScanLine } from 'lucide-react';

interface ScoreboardProps {
  teams: Record<string, Team>;
}

// --- LEGENDARY SHADER: VORTEX SINGULARITY ---
// A swirling portal effect for Rank 1
const VORTEX_VERTEX = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const VORTEX_FRAGMENT = `
  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uColor;
  
  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec2 uv = vUv - 0.5;
    float dist = length(uv);
    float angle = atan(uv.y, uv.x);
    
    // Spiral swirl
    float swirl = angle + dist * 10.0 - uTime * 2.0;
    
    // Radial beams
    float beams = sin(swirl * 10.0) * 0.5 + 0.5;
    
    // Core glow
    float core = 0.2 / (dist + 0.1);
    
    // Sparkles
    float sparkle = step(0.98, noise(uv * 10.0 + uTime));
    
    // Color composition
    vec3 col = uColor * (beams * 0.5 + core);
    col += vec3(1.0) * sparkle;
    
    // Vignette fade
    float alpha = smoothstep(0.5, 0.2, dist);

    gl_FragColor = vec4(col, alpha);
  }
`;

// --- NUMBER SCRAMBLER ---
const ScrambleNumber: React.FC<{ value: number, className?: string }> = ({ value, className }) => {
    const [display, setDisplay] = useState(0);
    
    useEffect(() => {
        const obj = { val: 0 };
        gsap.to(obj, {
            val: value,
            duration: 2.5,
            ease: "power3.out",
            onUpdate: () => setDisplay(Math.floor(obj.val))
        });
    }, [value]);

    return <span className={className}>{display.toLocaleString()}</span>;
};

// --- RANK 1 HERO CARD ---
const HeroCard: React.FC<{ team: Team, points: number, onToggle: () => void, isExpanded: boolean }> = ({ team, points, onToggle, isExpanded }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLHeadingElement>(null);
    
    // 3D Parallax Tilt & Text Glitch
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current || window.innerWidth < 768) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        
        // Tilt Card
        gsap.to(containerRef.current, {
            rotationY: x * 8,
            rotationX: -y * 8,
            transformPerspective: 1000,
            duration: 0.5,
            ease: "power2.out"
        });

        // Glitch Text Offset
        if (textRef.current) {
            gsap.to(textRef.current, {
                x: x * 30,
                y: y * 30,
                textShadow: `${x * 15}px ${y * 15}px 0px ${team.color}, ${-x * 15}px ${-y * 15}px 0px cyan`,
                duration: 0.1
            });
        }
    };

    const handleMouseLeave = () => {
        gsap.to(containerRef.current, { rotationY: 0, rotationX: 0, duration: 0.8, ease: "elastic.out(1, 0.5)" });
        if (textRef.current) {
            gsap.to(textRef.current, { x: 0, y: 0, textShadow: `0 0 40px ${team.color}`, duration: 0.5 });
        }
    };

    // Three.js Shader BG
    useEffect(() => {
        if (!canvasRef.current) return;
        const w = canvasRef.current.clientWidth;
        const h = canvasRef.current.clientHeight;
        
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        canvasRef.current.appendChild(renderer.domElement);
        
        const mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 2),
            new THREE.ShaderMaterial({
                uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(team.color) } },
                vertexShader: VORTEX_VERTEX,
                fragmentShader: VORTEX_FRAGMENT,
                transparent: true
            })
        );
        scene.add(mesh);
        
        const clock = new THREE.Clock();
        let rId: number = 0;
        const wrappedAnimate = () => {
            mesh.material.uniforms.uTime.value = clock.getElapsedTime();
            renderer.render(scene, camera);
            rId = requestAnimationFrame(wrappedAnimate);
        };
        rId = requestAnimationFrame(wrappedAnimate);

        return () => {
            cancelAnimationFrame(rId);
            if (canvasRef.current && renderer.domElement) {
                canvasRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, [team.color]);

    return (
        <div 
            className="w-full relative z-20 mb-24 perspective-1000 pt-16" // Increased pt-16 for even more headroom
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <div 
                ref={containerRef}
                className="relative w-full bg-[#05050a] rounded-3xl border border-white/10 group shadow-[0_0_120px_-30px_var(--team-color)] transition-shadow duration-500 hover:shadow-[0_0_150px_-20px_var(--team-color)]"
                style={{ '--team-color': team.color } as React.CSSProperties}
            >
                {/* 1. CLIPPED BACKGROUND CONTAINER (Handles rounded corners for shaders) */}
                <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                    {/* Animated Background */}
                    <div ref={canvasRef} className="absolute inset-0 opacity-50 mix-blend-screen" />
                    
                    {/* Scanner Light Effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent h-[200%] w-full -translate-y-1/2 animate-[scan-vertical_4s_infinite_linear] z-0"></div>
                    
                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
                </div>

                {/* 2. VISIBLE CONTENT LAYER (No overflow hidden, allows Crown pop-out) */}
                <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center md:justify-between gap-8 md:gap-16">
                    
                    {/* Rank & Identity */}
                    <div className="flex flex-col md:flex-row items-center gap-10 flex-1 text-center md:text-left">
                        <div className="relative shrink-0">
                             {/* Pulsating Logo Container */}
                             <div className="w-32 h-32 md:w-44 md:h-44 rounded-full bg-black border-4 border-[var(--team-color)] flex items-center justify-center text-7xl md:text-8xl shadow-[0_0_50px_var(--team-color)] relative z-10 animate-[pulse-glow_3s_infinite] overflow-hidden" style={{ boxShadow: `0 0 30px ${team.color}, inset 0 0 20px ${team.color}` }}>
                                 {team.logo.startsWith('http') || team.logo.startsWith('data:') ? (
                                     <img src={team.logo} className="w-full h-full object-cover" alt={team.name} />
                                 ) : (
                                     team.logo
                                 )}
                             </div>
                             
                             {/* Floating Crown - SEPARATED POSITION AND ANIMATION */}
                             {/* The outer div handles positioning (centering). The inner div handles bouncing. */}
                             <div className="absolute -top-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                                 <div className="animate-[bounce_3s_infinite] relative">
                                     {/* Glow behind crown */}
                                     <div className="absolute inset-0 bg-yellow-500 blur-xl opacity-40"></div>
                                     <Crown size={90} className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)] relative z-10" fill="#facc15" strokeWidth={1.5} />
                                 </div>
                             </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                                <span className="px-4 py-1.5 rounded bg-yellow-500 text-black text-sm font-black font-pixel tracking-widest flex items-center gap-2 shadow-[0_0_15px_gold]">
                                    <Crown size={16} fill="black"/> RANK 01
                                </span>
                                <span className="px-3 py-1.5 rounded border border-white/20 text-xs text-gray-300 font-mono tracking-widest bg-black/50 backdrop-blur">
                                    ID: {team.id.toUpperCase()}
                                </span>
                            </div>
                            
                            {/* PIXELATED GODLY TEXT */}
                            <h2 
                                ref={textRef}
                                className="text-5xl md:text-8xl lg:text-9xl font-black font-pixel text-transparent uppercase tracking-wide leading-[0.8] break-words relative z-20 transition-all duration-75 drop-shadow-2xl"
                                style={{ 
                                    WebkitTextStroke: `2px ${team.color}`,
                                    textShadow: `0 0 40px ${team.color}`,
                                }}
                            >
                                {team.name}
                            </h2>
                            
                            <p className="text-white font-mono text-xs md:text-sm mt-6 tracking-[0.2em] uppercase opacity-90 leading-relaxed max-w-xl border-l-4 border-[var(--team-color)] pl-6 ml-4 md:ml-0 bg-gradient-to-r from-[var(--team-color)]/10 to-transparent py-2">
                                {team.description}
                            </p>
                        </div>
                    </div>

                    {/* Stats & Toggle */}
                    <div className="flex flex-col items-center md:items-end gap-6 shrink-0 w-full md:w-auto mt-4 md:mt-0">
                        <div className="text-center md:text-right w-full bg-black/60 p-6 rounded-xl border border-white/10 backdrop-blur-md relative overflow-hidden group/stats hover:border-[var(--team-color)] transition-colors">
                            <div className="absolute top-0 left-0 w-full h-1 bg-[var(--team-color)] shadow-[0_0_20px_var(--team-color)] animate-pulse"></div>
                            <ScrambleNumber value={points} className="block text-6xl md:text-8xl font-black font-pixel text-white tracking-widest leading-none drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
                            <span className="text-xs font-bold text-[var(--team-color)] tracking-[0.5em] uppercase block mt-2">Dominance Points</span>
                        </div>
                        
                        <button 
                            onClick={onToggle}
                            className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/20 text-white font-bold font-mono text-sm tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95 group/btn"
                        >
                            <span>{isExpanded ? 'COLLAPSE' : 'FULL BREAKDOWN'}</span>
                            <ChevronDown size={18} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* EXPANDED SECTION (Needs rounded corners at bottom) */}
                <div className={`relative z-10 border-t border-white/10 bg-black/90 backdrop-blur-xl transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] overflow-hidden rounded-b-3xl ${isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                         {team.breakdown.map((item, i) => (
                             <div key={i} className="flex justify-between items-center p-5 rounded bg-white/5 border-l-4 border-[var(--team-color)] hover:bg-white/10 transition-colors group/item">
                                 <span className="text-sm font-bold text-white font-mono flex items-center gap-3 uppercase tracking-wide group-hover/item:text-[var(--team-color)] transition-colors">
                                     <Target size={16} className="text-gray-500 group-hover/item:text-[var(--team-color)] transition-colors"/> 
                                     {item.source}
                                 </span>
                                 <span className="font-pixel text-2xl text-[var(--team-color)]">+{item.points}</span>
                             </div>
                         ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- STANDARD ROW ---
const LeaderboardRow: React.FC<{ team: Team, rank: number, points: number, isExpanded: boolean, onToggle: () => void, index: number }> = ({ team, rank, points, isExpanded, onToggle, index }) => {
    const rowRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        gsap.fromTo(rowRef.current,
            { y: 50, opacity: 0, scale: 0.95 },
            { y: 0, opacity: 1, scale: 1, duration: 0.6, delay: 0.5 + (index * 0.1), ease: "back.out(1.2)" }
        );
    }, [index]);

    return (
        <div ref={rowRef} className="w-full mb-3 group perspective-1000">
            <div 
                onClick={onToggle}
                className={`
                    relative w-full min-h-[5rem] bg-[#0a0a0d] hover:bg-[#111116] border-b border-white/5 hover:border-[var(--team-color)] cursor-pointer transition-all duration-300 overflow-hidden group-hover:shadow-[0_0_30px_-10px_var(--team-color)]
                    ${isExpanded ? 'bg-[#111116] border-[var(--team-color)]' : ''}
                `}
                style={{ '--team-color': team.color } as React.CSSProperties}
            >
                {/* Active Indicator Bar Left */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 bg-[var(--team-color)] transition-all duration-300 ${isExpanded ? 'opacity-100 shadow-[0_0_15px_var(--team-color)]' : 'opacity-0 group-hover:opacity-100'}`}></div>

                {/* MAIN GRID LAYOUT - Space Optimized */}
                <div className="grid grid-cols-[3rem_1fr_auto] md:grid-cols-[5rem_1fr_10rem] gap-4 items-center px-4 py-3 md:px-6 h-full relative z-10">
                    
                    {/* COL 1: RANK */}
                    <div className="flex justify-center shrink-0">
                        <span className="font-black font-pixel text-3xl md:text-5xl text-gray-700 group-hover:text-white transition-colors select-none">0{rank}</span>
                    </div>

                    {/* COL 2: IDENTITY (No Box Logo) */}
                    <div className="flex flex-col min-w-0 justify-center">
                        <h3 
                            className="font-pixel text-2xl md:text-4xl text-transparent uppercase tracking-wide leading-none break-words whitespace-normal transition-all duration-300"
                            style={{ 
                                WebkitTextStroke: `1px ${team.color}`,
                                filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.8))'
                            }}
                        >
                            {team.name}
                        </h3>
                        <span className="text-[9px] md:text-[10px] font-mono text-gray-500 tracking-[0.2em] uppercase mt-1 flex items-center gap-2">
                            {/* Tiny dot instead of icon */}
                            <span className="w-1 h-1 rounded-full bg-[var(--team-color)]"></span>
                            {team.description}
                        </span>
                    </div>

                    {/* COL 3: POINTS */}
                    <div className="flex items-center justify-end gap-4 shrink-0">
                        <div className="text-right relative z-20">
                            <div className="font-bold font-pixel text-2xl md:text-4xl text-white group-hover:text-[var(--team-color)] transition-colors tracking-widest shadow-black drop-shadow-md">
                                {points.toLocaleString()}
                            </div>
                            <div className="text-[8px] md:text-[9px] text-gray-600 uppercase tracking-[0.3em] font-bold">PTS</div>
                        </div>
                    </div>
                </div>
                
                {/* WATERMARK LOGO (Right Side Background) */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 text-[8rem] opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500 pointer-events-none grayscale group-hover:grayscale-0 overflow-hidden" style={{ color: team.color }}>
                    {team.logo.startsWith('http') || team.logo.startsWith('data:') ? (
                        <img src={team.logo} className="w-32 h-32 object-cover opacity-50" alt="" />
                    ) : (
                        team.logo
                    )}
                </div>
            </div>

            {/* EXPANDED CONTENT */}
            <div className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] bg-[#050508] border-x border-b border-white/10 mx-2 ${isExpanded ? 'max-h-[500px] opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
                <div className="p-4 grid gap-2">
                    {team.breakdown.length > 0 ? (
                        team.breakdown.map((item, i) => (
                            <div key={i} className="flex justify-between items-center p-3 rounded border border-white/5 bg-white/[0.02] hover:bg-white/[0.05]">
                                <span className="text-gray-400 font-mono text-xs uppercase tracking-widest flex items-center gap-2"><Hash size={12}/> {item.source}</span>
                                <span className="font-pixel text-lg text-white">+{item.points}</span>
                            </div>
                        ))
                    ) : (
                        <div className="text-gray-600 text-xs italic text-center p-4">AWAITING DATA...</div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- MAIN SCOREBOARD ---
const Scoreboard: React.FC<ScoreboardProps> = ({ teams }) => {
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  const allowedIds = ['t1', 't2', 't3', 't4'];
    const sortedTeams = (Object.values(teams) as Team[])
        .filter(team => allowedIds.includes(team.id))
        .map(team => ({
            team,
            points: team.breakdown.reduce((acc, curr) => acc + curr.points, 0)
        }))
        .sort((a, b) => b.points - a.points);

    const topTeamEntry = sortedTeams[0];
    const otherTeamEntries = sortedTeams.slice(1);
    const topTeam = topTeamEntry?.team;
    const topPoints = topTeamEntry?.points ?? 0;

    if (!topTeam) {
        return null;
    }

  const toggleExpand = (id: string) => {
    setExpandedTeam(expandedTeam === id ? null : id);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-16 pb-32 font-sans overflow-x-hidden">
      
      {/* HEADER VISUAL */}
      <div className="flex flex-col items-center mb-20 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[150px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none"></div>
          
          <div className="flex items-center gap-3 mb-6 animate-in fade-in slide-in-from-top-4 duration-1000">
              <ScanLine size={16} className="text-purple-400 animate-pulse" />
              <span className="text-xs font-mono text-purple-400 tracking-[0.4em] uppercase font-bold bg-purple-900/20 px-3 py-1 rounded border border-purple-500/20">
                  Global Rankings // Live Feed
              </span>
          </div>

          <h2 className="text-7xl md:text-9xl font-black font-cyber text-center leading-none tracking-tighter text-white drop-shadow-2xl relative z-10 glitch-effect" data-text="LEADERBOARD">
              LEADERBOARD
          </h2>
      </div>

      {/* --- RANK 1 HERO --- */}
            <HeroCard 
                team={topTeam} 
                points={topPoints} 
                isExpanded={expandedTeam === topTeam.id}
                onToggle={() => toggleExpand(topTeam.id)}
            />

      {/* --- THE REST --- */}
      <div className="flex flex-col relative z-10 mt-16">
        <div className="hidden md:grid grid-cols-[5rem_1fr_10rem] gap-4 px-6 pb-3 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] border-b border-white/10 mb-2">
            <span className="text-center">Rank</span>
            <span>Faction Identity</span>
            <span className="text-right">Score Data</span>
        </div>

                {otherTeamEntries.map(({ team, points }, idx) => (
                    <LeaderboardRow 
                        key={team.id}
                        team={team}
                        rank={idx + 2}
                        points={points}
                        isExpanded={expandedTeam === team.id}
                        onToggle={() => toggleExpand(team.id)}
                        index={idx}
                    />
                ))}
      </div>

      {/* --- FOOTER --- */}
      <div className="mt-32 flex flex-col items-center justify-center opacity-40 hover:opacity-60 transition-opacity">
          <Trophy size={32} className="text-gray-600 mb-3" />
          <span className="font-mono text-[10px] tracking-[0.5em] text-gray-500 uppercase">Updating Real-time</span>
      </div>
    </div>
  );
};

export default Scoreboard;
