
import React, { useEffect, useRef, useState, useMemo, useLayoutEffect } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { Team } from '../types';
import { Shield, Zap, Cpu, Code2, Terminal, Database, User, X, Sparkles } from 'lucide-react';
import FactionEntryTransition from './FactionEntryTransition';

// --- FLAVOR TEXT & PHYSICS DATA ---
const LORE_DATA: Record<string, { title: string; desc: string; stats: { label: string, val: number, icon: any }[]; params: any }> = {
  't1': {
    title: "THE SERPENTINE LOGIC",
    desc: "Emerging from the depths of legacy code, the Metamorphic Python faction specializes in adaptive algorithms. They don't just write code; they weave self-evolving scripts that constrict errors and swallow complexity whole.",
    stats: [
        { label: 'ADAPTABILITY', val: 95, icon: Zap },
        { label: 'CONSTRICTION', val: 70, icon: Shield },
        { label: 'VENOM_ potency', val: 90, icon: Cpu }
    ],
    params: { speed: 0.2, frequency: 0.8, amplitude: 1.2, glitch: 0.0, sharp: 0.0, crystal: 0.0, lightning: 0.0 } 
  },
  't2': {
    title: "LIGHTNING COURIERS",
    desc: "Exuberant Ajax operatives are the nervous system of the grid. Masters of asynchronous warfare, they strike before the server even registers the request. Responsiveness is their only law.",
    stats: [
        { label: 'SYNC_SPEED', val: 100, icon: Zap },
        { label: 'VOLTAGE', val: 60, icon: Cpu },
        { label: 'BANDWIDTH', val: 85, icon: Shield }
    ],
    params: { speed: 0.8, frequency: 2.2, amplitude: 0.8, glitch: 0.1, sharp: 0.0, crystal: 0.0, lightning: 1.0 } 
  },
  't3': {
    title: "THE BEDROCK TITANS",
    desc: "Java The Explorer represents the heavy infantry of the backend. They build the monoliths that hold the sky up. Unshakeable, typed, and compiled, their code is a fortress.",
    stats: [
        { label: 'STABILITY', val: 100, icon: Shield },
        { label: 'COMPILE_STR', val: 85, icon: Cpu },
        { label: 'MEMORY_MASS', val: 80, icon: Database }
    ],
    params: { speed: 0.1, frequency: 0.3, amplitude: 2.5, glitch: 0.1, sharp: 1.0, crystal: 0.0, lightning: 0.0 }
  },
  't4': {
    title: "GEMSTONE ARTISANS",
    desc: "Magnificent Ruby focuses on the elegance of the craft. To them, code is poetry. Do not mistake their art for weakness—their syntax is sharp enough to cut through the densest logic knots.",
    stats: [
        { label: 'BRILLIANCE', val: 95, icon: Zap },
        { label: 'REFRACTION', val: 75, icon: Shield },
        { label: 'SHARPNESS', val: 85, icon: Code2 }
    ],
    params: { speed: 0.1, frequency: 1.2, amplitude: 1.8, glitch: 0.0, sharp: 1.0, crystal: 1.0, lightning: 0.0 } 
  },
};

const DEFAULT_LORE = {
    title: "UNKNOWN FACTION",
    desc: "Analyzing signal...",
    stats: [{ label: 'UNKNOWN', val: 0, icon: Cpu }],
    params: { speed: 0.5 }
};

interface GlitchTextProps {
    text: string;
    teamId: string;
    as?: React.ElementType;
    className?: string;
    speed?: 'fast' | 'slow';
    delay?: number;
    mode?: 'char' | 'word';
}

const GlitchText: React.FC<GlitchTextProps> = ({ text, teamId, as: Component = 'div', className = '', speed = 'fast', delay = 0, mode }) => {
    const el = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);
    
    const splitMode = mode ? mode : (text.length > 30 ? 'word' : 'char');
    const words = useMemo(() => text.split(' '), [text]);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setIsVisible(true);
                observer.disconnect();
            }
        }, { threshold: 0.1 }); 
        
        if (el.current) observer.observe(el.current);
        return () => observer.disconnect();
    }, []);

    useLayoutEffect(() => {
        if (!isVisible || !el.current) return;
        
        const ctx = gsap.context(() => {
            const selector = splitMode === 'char' ? '.glitch-char' : '.glitch-word';
            const targets = el.current?.querySelectorAll(selector);
            
            if(!targets || targets.length === 0) return;

            const duration = speed === 'fast' ? 0.5 : 1.0;
            const staggerAmount = speed === 'fast' ? 0.3 : 0.8;

            if (teamId === 't1') {
                if (splitMode === 'char') {
                    const chars = "01_!@#%&";
                    gsap.fromTo(targets, 
                        { opacity: 0 },
                        { 
                            opacity: 1, 
                            duration: duration, 
                            stagger: { amount: staggerAmount }, 
                            delay: delay,
                            onStart: () => {
                                targets.forEach((element) => {
                                    const span = element as HTMLElement;
                                    const original = span.getAttribute('data-char') || span.textContent || '';
                                    const obj = { val: 0 };
                                    gsap.to(obj, {
                                        val: 1,
                                        duration: 0.8,
                                        delay: delay + Math.random() * 0.3,
                                        onUpdate: () => {
                                            if (obj.val < 1) {
                                                span.textContent = chars[Math.floor(Math.random() * chars.length)];
                                                span.style.color = Math.random() > 0.5 ? '#4ade80' : '#ffffff'; 
                                            } else {
                                                span.textContent = original;
                                                span.style.color = 'inherit';
                                            }
                                        }
                                    });
                                });
                            }
                        }
                    );
                } else {
                    gsap.fromTo(targets, { opacity: 0, color: '#4ade80' }, { opacity: 1, color: 'inherit', duration: 0.5, stagger: 0.05, delay: delay });
                }
            } else if (teamId === 't2') {
                const tl = gsap.timeline({ delay: delay });
                tl.fromTo(targets, { y: -30, opacity: 0, scaleY: 3.5, color: '#ffffff', skewX: -20 }, { y: 0, opacity: 1, scaleY: 1, skewX: 0, duration: 0.25, stagger: { amount: splitMode === 'char' ? 0.3 : 0.5, from: "random" }, ease: "power4.out" });
                tl.to(targets, { color: 'inherit', duration: 0.3, ease: "power2.in", clearProps: "scaleY,skewX" }, "-=0.1");
                if (splitMode === 'char') {
                    tl.to(targets, { x: () => gsap.utils.random(-2, 2), duration: 0.05, repeat: 2, yoyo: true, ease: "steps(1)", stagger: { amount: 0.1, from: "random", grid: "auto" } }, "-=0.2");
                }
                tl.add(() => { gsap.set(targets, { clearProps: "all" }); gsap.set(targets, { opacity: 1, x: 0, y: 0, scale: 1, filter: 'none', color: 'inherit' }); });
            } else if (teamId === 't3') {
                gsap.set(targets, { transformOrigin: 'bottom center' });
                gsap.fromTo(targets, { y: 30, opacity: 0, scaleY: 0 }, { y: 0, opacity: 1, scaleY: 1, duration: 0.4, stagger: splitMode === 'char' ? 0.05 : 0.02, ease: "steps(4)", delay: delay });
            } else if (teamId === 't4') {
                gsap.fromTo(targets, { opacity: 0, filter: 'blur(12px)', scale: 1.5, color: '#ff0055' }, { opacity: 1, filter: 'blur(0px)', scale: 1, color: 'inherit', duration: 0.8, stagger: { amount: staggerAmount }, ease: "expo.out", delay: delay, clearProps: "scale,filter" });
            }
        }, el);
        return () => ctx.revert();
    }, [isVisible, teamId, splitMode, speed, delay]);

    return (
        <Component ref={el} className={className} aria-label={text}>
            {words.map((word, i) => {
                const hasSpace = i < words.length - 1;
                if (splitMode === 'char') {
                    return (
                        <React.Fragment key={i}>
                            <span className="inline-block whitespace-nowrap">
                                {word.split('').map((char, j) => (<span key={j} className="glitch-char inline-block" data-char={char}>{char}</span>))}
                            </span>
                            {hasSpace && ' '}
                        </React.Fragment>
                    );
                } else {
                    return (<React.Fragment key={i}><span className="glitch-word inline-block will-change-transform">{word}</span>{hasSpace && ' '}</React.Fragment>);
                }
            })}
        </Component>
    );
};

const TERRAIN_VERTEX = `
  varying vec2 vUv;
  varying float vElevation;
  uniform float uTime;
  uniform float uSpeed;
  uniform float uFrequency;
  uniform float uAmplitude;
  uniform float uScrollWarp;
  uniform vec2 uMouse;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  float noise(vec2 p) { vec2 i = floor(p); vec2 f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), f.x), mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), f.x), f.y); }
  void main() {
    vUv = uv;
    vec3 pos = position;
    float n = noise(pos.xy * uFrequency + uTime * uSpeed);
    float dist = distance(uv, uMouse);
    float mouseWave = smoothstep(0.4, 0.0, dist) * sin(dist * 20.0 - uTime * 5.0) * 0.5;
    float elevation = n * uAmplitude + mouseWave;
    elevation -= uScrollWarp * (pos.x*pos.x + pos.y*pos.y) * 0.02;
    pos.z += elevation;
    vElevation = elevation;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const TERRAIN_FRAGMENT = `
  varying vec2 vUv;
  varying float vElevation;
  uniform vec3 uColor;
  uniform float uTime;
  void main() {
    vec3 col = uColor * (0.1 + smoothstep(-1.0, 2.0, vElevation) * 0.6);
    float grid = step(0.95, fract(vUv.x * 30.0)) + step(0.95, fract(vUv.y * 30.0));
    col += uColor * grid * 0.3;
    float mask = 1.0 - smoothstep(0.3, 0.8, distance(vUv, vec2(0.5)));
    gl_FragColor = vec4(col, mask * 0.8);
  }
`;

const STATS_VERTEX = `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const PYTHON_BAR_FRAG = `varying vec2 vUv; uniform float uProgress; uniform float uTime; uniform vec3 uColor; float noise(vec2 p) { return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); } void main() { vec2 uv = vUv; float wave = sin(uv.y * 10.0 + uTime * 5.0) * 0.02; float edge = uProgress + wave; float fill = smoothstep(edge + 0.01, edge, uv.x); float bubbles = smoothstep(0.8, 0.9, noise(uv * 20.0 + uTime)); vec3 track = uColor * 0.1; vec3 bar = uColor * (0.8 + bubbles * 0.4); bar += vec3(0.5, 1.0, 0.5) * bubbles * 0.5; float glow = (1.0 - smoothstep(0.0, 0.05, abs(uv.x - edge))) * fill * 2.0; vec3 final = mix(track, bar, fill) + glow; gl_FragColor = vec4(final, 0.9); }`;
const AJAX_BAR_FRAG = `varying vec2 vUv; uniform float uProgress; uniform float uTime; uniform vec3 uColor; float rand(vec2 n) { return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453); } void main() { vec2 uv = vUv; float jitter = rand(vec2(uTime * 20.0, uv.y)) * 0.05; float edge = uProgress + jitter; float fill = step(uv.x, edge); float beam = smoothstep(0.4, 0.5, uv.y) * smoothstep(0.6, 0.5, uv.y); float arcs = step(0.92, fract(uv.x * 15.0 - uTime * 8.0 + sin(uv.y * 30.0))); vec3 track = uColor * 0.1 * (0.5 + 0.5 * step(0.9, fract(uv.x * 20.0))); vec3 bar = uColor * 0.8; bar += vec3(1.0) * beam * 0.8; bar += vec3(0.8, 1.0, 1.0) * arcs; float flash = smoothstep(0.0, 0.05, 0.05 - abs(uv.x - edge)); bar += vec3(1.0) * flash * 2.0; vec3 final = mix(track, bar, fill); gl_FragColor = vec4(final, 1.0); }`;
const JAVA_BAR_FRAG = `varying vec2 vUv; uniform float uProgress; uniform float uTime; uniform vec3 uColor; void main() { vec2 uv = vUv; float blocks = 15.0; float bx = floor(uv.x * blocks) / blocks; float fill = step(bx, uProgress - (1.0/blocks)); vec2 gv = fract(uv * vec2(blocks, 1.0)); float border = step(0.1, gv.x) * step(0.1, gv.y) * step(gv.x, 0.9) * step(gv.y, 0.9); vec3 track = uColor * 0.1 * border; vec3 bar = uColor * border; float pulse = sin(uTime * 3.0) * 0.2 + 0.8; bar *= pulse; vec3 final = mix(track, bar, fill); gl_FragColor = vec4(final, 1.0); }`;
const RUBY_BAR_FRAG = `varying vec2 vUv; uniform float uProgress; uniform float uTime; uniform vec3 uColor; void main() { vec2 uv = vUv; vec2 p = uv * vec2(15.0, 3.0); float diag1 = sin(p.x + p.y + uTime * 0.2); float diag2 = sin(p.x - p.y - uTime * 0.1); float facets = smoothstep(0.2, 0.9, abs(diag1 * diag2)); float aberration = 0.015; float jagged = sin(uv.y * 20.0) * 0.02; float edgeR = uProgress + jagged + aberration; float edgeG = uProgress + jagged; float edgeB = uProgress + jagged - aberration; float maskR = step(uv.x, edgeR); float maskG = step(uv.x, edgeG); float maskB = step(uv.x, edgeB); float sheen = pow(max(0.0, sin(uv.x * 8.0 - uTime * 2.0 + uv.y * 5.0)), 6.0); float sparkle = pow(max(0.0, sin(uv.x * 30.0 + uTime * 4.0)), 30.0) * facets; vec3 base = uColor; vec3 col; col.r = base.r * (0.4 + 0.6 * facets + 0.5 * sheen) * maskR; col.g = base.g * (0.4 + 0.6 * facets + 0.5 * sheen) * maskG; col.b = base.b * (0.4 + 0.6 * facets + 0.5 * sheen) * maskB; col += vec3(1.0) * sparkle * maskB; float edgeBurn = smoothstep(0.0, 0.03, 0.03 - abs(uv.x - uProgress)); col += vec3(1.0, 0.8, 0.8) * edgeBurn * 2.0 * maskR; vec3 track = base * 0.05 + vec3(0.1) * facets * 0.05; vec3 final = mix(track, col, maskR); gl_FragColor = vec4(final, 0.95); }`;

const StatsVisualizer: React.FC<{ teamId: string, stats: any[], color: string }> = ({ teamId, stats, color }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const materialsRef = useRef<THREE.ShaderMaterial[]>([]);
    
    useEffect(() => {
        if (!mountRef.current) return;
        const w = mountRef.current.clientWidth;
        const h = mountRef.current.clientHeight;
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        mountRef.current.appendChild(renderer.domElement);
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
        camera.position.z = 1;
        const yPositions = [0.55, -0.15, -0.85];
        const planeGeo = new THREE.PlaneGeometry(1.8, 0.12);
        let fragShader = PYTHON_BAR_FRAG;
        if (teamId === 't2') fragShader = AJAX_BAR_FRAG;
        if (teamId === 't3') fragShader = JAVA_BAR_FRAG;
        if (teamId === 't4') fragShader = RUBY_BAR_FRAG;
        stats.forEach((_, i) => {
            const mat = new THREE.ShaderMaterial({
                uniforms: { uProgress: { value: 0 }, uTime: { value: 0 }, uColor: { value: new THREE.Color(color) } },
                vertexShader: STATS_VERTEX, fragmentShader: fragShader, transparent: true, blending: THREE.AdditiveBlending
            });
            materialsRef.current.push(mat);
            const mesh = new THREE.Mesh(planeGeo, mat);
            mesh.position.y = yPositions[i];
            scene.add(mesh);
        });
        const observer = new IntersectionObserver((entries) => {
             entries.forEach(entry => {
                 if (entry.isIntersecting) {
                     materialsRef.current.forEach((mat, i) => {
                        gsap.to(mat.uniforms.uProgress, { value: stats[i].val / 100, duration: 1.5, ease: "power2.out", delay: i * 0.2 });
                     });
                     observer.disconnect();
                 }
             });
        }, { threshold: 0.5 });
        observer.observe(mountRef.current);
        const clock = new THREE.Clock();
        let rId = 0;
        const animate = () => {
            rId = requestAnimationFrame(animate);
            const t = clock.getElapsedTime();
            materialsRef.current.forEach(mat => { mat.uniforms.uTime.value = t; });
            renderer.render(scene, camera);
        };
        animate();
        return () => {
            observer.disconnect();
            cancelAnimationFrame(rId);
            renderer.dispose();
            if(mountRef.current && renderer.domElement) mountRef.current.removeChild(renderer.domElement);
            materialsRef.current.forEach(m => m.dispose());
            planeGeo.dispose();
        };
    }, [teamId, color, stats]);

    return (
        <div className="relative w-full h-56 md:h-64 mt-4">
             <div ref={mountRef} className="absolute inset-0 z-0"></div>
             <div className="absolute inset-0 z-10 flex flex-col justify-between pointer-events-none">
                  {stats.map((stat, i) => (
                      <div key={i} className="relative h-1/3 w-full px-2 flex flex-col justify-start pt-3">
                           <div className="flex justify-between items-center mb-1">
                               <span className="flex items-center gap-2 text-sm md:text-base font-bold font-mono text-white tracking-widest drop-shadow-md">
                                   <stat.icon size={18} className="text-[var(--color)]" style={{'--color': color} as React.CSSProperties} />
                                   <GlitchText text={stat.label} teamId={teamId} speed="fast" />
                               </span>
                               <span className="font-mono text-sm md:text-base text-[var(--color)] font-bold" style={{'--color': color} as React.CSSProperties}>
                                   <GlitchText text={`${stat.val}%`} teamId={teamId} speed="fast" delay={0.5} />
                               </span>
                           </div>
                      </div>
                  ))}
             </div>
        </div>
    );
};

interface TeamLoreProps {
  onSelect: (teamId: string, username: string) => void;
  teams: Record<string, Team>;
}

const TeamLore: React.FC<TeamLoreProps> = ({ onSelect, teams }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTeamId, setActiveTeamId] = useState<string>('t1');
  const [transitioningTeam, setTransitioningTeam] = useState<string | null>(null);
  const activeTeamRef = useRef<string>('t1');
  
  // Username modal state
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [pendingTeamId, setPendingTeamId] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const usernameInputRef = useRef<HTMLInputElement>(null);
  
  const scrollSpeedRef = useRef(0);
  const lastScrollPos = useRef(0);
  const mousePos = useRef(new THREE.Vector2(0.5, 0.5));
  const timeRef = useRef(0);

  // Check for existing username in localStorage
  useEffect(() => {
    const savedUsername = localStorage.getItem('iteverse_username');
    if (savedUsername) {
      setUsername(savedUsername);
    }
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (showUsernameModal && usernameInputRef.current) {
      setTimeout(() => usernameInputRef.current?.focus(), 100);
    }
  }, [showUsernameModal]);

  const handleInitialize = (teamId: string) => {
    // Check if username already exists in localStorage
    const savedUsername = localStorage.getItem('iteverse_username');
    if (savedUsername) {
      // Skip modal, use saved username
      setUsername(savedUsername);
      setTransitioningTeam(teamId);
    } else {
      // Show username modal first
      setPendingTeamId(teamId);
      setShowUsernameModal(true);
    }
  };

  const handleUsernameSubmit = () => {
    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 2) {
      setUsernameError('Username must be at least 2 characters');
      return;
    }
    if (trimmedUsername.length > 20) {
      setUsernameError('Username must be 20 characters or less');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      setUsernameError('Only letters, numbers, and underscores allowed');
      return;
    }
    
    // Save to localStorage (client-based)
    localStorage.setItem('iteverse_username', trimmedUsername);
    setUsernameError('');
    setShowUsernameModal(false);
    
    // Now trigger the team transition
    if (pendingTeamId) {
      setTransitioningTeam(pendingTeamId);
      setPendingTeamId(null);
    }
  };

  const handleTransitionComplete = () => {
      if (transitioningTeam) {
          const finalUsername = localStorage.getItem('iteverse_username') || username || 'Agent';
          onSelect(transitioningTeam, finalUsername);
      }
  };

  useEffect(() => {
    if (!mountRef.current) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobile = width < 768;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 100);
    if (isMobile) camera.position.set(0, -8, 8); 
    else camera.position.set(0, -6, 5);
    camera.lookAt(0, 0, 0);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);
    const initLore = LORE_DATA['t1'];
    const material = new THREE.ShaderMaterial({
        vertexShader: TERRAIN_VERTEX,
        fragmentShader: TERRAIN_FRAGMENT,
        uniforms: {
            uTime: { value: 0 },
            uSpeed: { value: initLore.params.speed },
            uFrequency: { value: initLore.params.frequency },
            uAmplitude: { value: initLore.params.amplitude },
            uScrollWarp: { value: 0 },
            uMouse: { value: new THREE.Vector2(0.5, 0.5) },
            uColor: { value: new THREE.Color(teams['t1'].color) }
        },
        transparent: true, side: THREE.DoubleSide
    });
    const geometry = new THREE.PlaneGeometry(32, 32, 128, 128); 
    const terrain = new THREE.Mesh(geometry, material);
    scene.add(terrain);
    const pGeo = new THREE.BufferGeometry();
    const pCount = isMobile ? 800 : 2000;
    const pPos = new Float32Array(pCount * 3);
    for(let i=0; i<pCount; i++) {
        pPos[i*3] = (Math.random()-0.5) * 40;
        pPos[i*3+1] = (Math.random()-0.5) * 40;
        pPos[i*3+2] = Math.random() * 8;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.15, transparent: true, opacity: 0.4 });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);
    const clock = new THREE.Clock();
    let frameId = 0;
    const animate = () => {
      const time = clock.getElapsedTime();
      timeRef.current = time;
      material.uniforms.uTime.value = time;
      const sections = document.querySelectorAll('.team-section');
      let closestId = activeTeamRef.current;
      let minDistance = Infinity;
      const centerScreen = window.innerHeight / 2;
      sections.forEach((sec) => {
        const rect = sec.getBoundingClientRect();
        const sectionCenter = rect.top + (rect.height / 2);
        const distance = Math.abs(sectionCenter - centerScreen);
        if (distance < minDistance) {
          minDistance = distance;
          const tid = sec.getAttribute('data-team-id');
          if (tid) closestId = tid;
        }
      });
      if (closestId !== activeTeamRef.current) {
        activeTeamRef.current = closestId;
        setActiveTeamId(closestId);
      }
      const currentLore = LORE_DATA[activeTeamRef.current] || LORE_DATA['t1'];
      const params = currentLore.params;
      const targetColor = new THREE.Color(teams[activeTeamRef.current]?.color || teams['t1'].color);
      const lerpSpeed = 0.06;
      material.uniforms.uColor.value.lerp(targetColor, lerpSpeed);
      pMat.color.lerp(targetColor, lerpSpeed);
      material.uniforms.uSpeed.value += (params.speed - material.uniforms.uSpeed.value) * lerpSpeed;
      material.uniforms.uFrequency.value += (params.frequency - material.uniforms.uFrequency.value) * lerpSpeed;
      material.uniforms.uAmplitude.value += (params.amplitude - material.uniforms.uAmplitude.value) * lerpSpeed;
      scrollSpeedRef.current *= 0.92;
      material.uniforms.uScrollWarp.value = scrollSpeedRef.current;
      material.uniforms.uMouse.value.lerp(mousePos.current, 0.1);
      camera.position.x = Math.sin(time * 0.1) * 0.5;
      camera.position.y = (isMobile ? -8 : -6);
      camera.position.z = (isMobile ? 8 : 5);
      particles.rotation.z = time * 0.05;
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    const handleResize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        if(w < 768) { camera.position.set(0, -8, 8); terrain.scale.setScalar(0.85); } else { camera.position.set(0, -6, 5); terrain.scale.setScalar(1); }
    };
    const handleMouseMove = (e: MouseEvent) => { const x = e.clientX / window.innerWidth; const y = 1.0 - (e.clientY / window.innerHeight); mousePos.current.set(x, y); };
    const handleScroll = () => { const y = window.scrollY; const delta = y - lastScrollPos.current; scrollSpeedRef.current = delta * 0.005; scrollSpeedRef.current = Math.max(-1, Math.min(1, scrollSpeedRef.current)); lastScrollPos.current = y; };
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    handleResize();
    return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('scroll', handleScroll);
        cancelAnimationFrame(frameId);
        if (mountRef.current && renderer.domElement) mountRef.current.removeChild(renderer.domElement);
        renderer.dispose();
    };
  }, [teams]); // Added dependency on teams to refresh colors if they change

  return (
    <div className="relative w-full bg-black min-h-screen">
        {transitioningTeam && (
            <FactionEntryTransition teamId={transitioningTeam} onComplete={handleTransitionComplete} />
        )}
        <div ref={mountRef} className="fixed top-0 left-0 w-full h-full z-0 opacity-60 pointer-events-none"></div>

        <div ref={containerRef} className="relative z-10">
            {Object.values(teams).slice(0, 4).map((team: Team, index) => {
                const lore = LORE_DATA[team.id] || DEFAULT_LORE;
                const isRight = index % 2 !== 0;

                return (
                    <section 
                        key={team.id} 
                        data-team-id={team.id}
                        className="team-section min-h-[80vh] md:min-h-screen flex items-center justify-center p-4 py-12 md:p-12 relative border-b border-gray-800/20"
                    >
                        {/* Shadow Gradient Behind Content */}
                        <div className="absolute inset-0 bg-black/40 pointer-events-none -z-10"></div>

                        <div className={`max-w-7xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-24 items-center ${isRight ? 'md:grid-flow-col-dense' : ''}`}>
                            
                            <div className={`space-y-6 md:space-y-8 order-2 md:order-none ${isRight ? 'md:col-start-2' : ''}`}>
                                
                                {/* 1. HEADER LOG */}
                                <div className="flex items-center gap-4">
                                    <div className="w-10 md:w-16 h-1 bg-[var(--team-color)]" style={{ '--team-color': team.color } as React.CSSProperties}></div>
                                    <span className="font-mono text-[10px] md:text-xs tracking-[0.2em] md:tracking-[0.3em] text-[var(--team-color)] uppercase drop-shadow-[0_0_8px_currentColor]" style={{ '--team-color': team.color } as React.CSSProperties}>
                                        <GlitchText text={`DATA_LOG // ${team.id.toUpperCase()}`} teamId={team.id} speed="fast" />
                                    </span>
                                </div>
                                
                                {/* 2. TITLE SECTION (Legendary Text Reveal) */}
                                <div>
                                    <GlitchText 
                                        as="h2" 
                                        text={team.name}
                                        teamId={team.id}
                                        speed="slow"
                                        mode="char"
                                        className="text-7xl sm:text-9xl md:text-[11rem] lg:text-[14rem] font-black font-cyber text-white leading-[0.8] mb-6 md:mb-8 tracking-normal md:tracking-wide break-words uppercase drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                                    />
                                    
                                    <h3 className="text-xl md:text-3xl font-bold text-white flex items-center gap-3">
                                        <Code2 className="text-[var(--team-color)] w-8 h-8 md:w-10 md:h-10" style={{ '--team-color': team.color } as React.CSSProperties} />
                                        <GlitchText text={lore.title} teamId={team.id} delay={0.5} />
                                    </h3>
                                </div>
                                
                                {/* 3. DESCRIPTION (Paragraph Glitch - Word Mode) */}
                                <div className="pl-4 md:pl-6 border-l-4 border-gray-800 max-w-2xl shadow-black drop-shadow-md">
                                    <GlitchText 
                                        as="p"
                                        text={lore.desc}
                                        teamId={team.id}
                                        speed="fast"
                                        delay={0.8}
                                        mode="word" 
                                        className="text-gray-300 font-ui text-lg md:text-xl leading-relaxed"
                                    />
                                </div>

                                {/* 4. STATS (3D) */}
                                <div className="w-full max-w-md">
                                     <StatsVisualizer teamId={team.id} stats={lore.stats} color={team.color} />
                                </div>

                                {/* 5. BUTTON */}
                                <button 
                                    onClick={() => handleInitialize(team.id)}
                                    className="mt-4 md:mt-6 flex items-center gap-2 text-xs font-bold font-mono text-[var(--team-color)] border border-[var(--team-color)] px-6 py-3 rounded hover:bg-[var(--team-color)] hover:text-black transition-all duration-300 w-full md:w-auto justify-center md:justify-start group"
                                    style={{ '--team-color': team.color } as React.CSSProperties}
                                >
                                    <Terminal size={14} /> 
                                    <span className="group-hover:tracking-widest transition-all duration-300">JOIN TEAM</span>
                                </button>
                            </div>

                            {/* LOGO CARD (Simple Reveal, kept separate) */}
                            <div className={`flex justify-center perspective-1000 order-1 md:order-none ${isRight ? 'md:col-start-1' : ''} mb-4 md:mb-0`}>
                                <div 
                                    className="relative w-56 h-72 sm:w-72 sm:h-96 md:w-96 md:h-[500px] cursor-pointer group"
                                    onClick={() => handleInitialize(team.id)}
                                >
                                    <div className="absolute inset-0 bg-[#0a0a0a]/80 backdrop-blur-md border border-gray-800 hover:border-[var(--team-color)] transition-all duration-500 rounded-2xl flex flex-col items-center justify-center overflow-hidden shadow-2xl group-hover:shadow-[0_0_50px_var(--glow-color)]"
                                         style={{ '--team-color': team.color, '--glow-color': `${team.color}40` } as React.CSSProperties}
                                    >
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 md:w-64 md:h-64 bg-[var(--team-color)] opacity-10 blur-[80px] rounded-full group-hover:opacity-30 transition-opacity duration-500" style={{ '--team-color': team.color } as React.CSSProperties}></div>

                                        <div className="relative z-10 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 filter drop-shadow-lg">
                                            {typeof team.logo === 'string' && team.logo.startsWith('data:') ? (
                                                <img src={team.logo} alt={team.name} className="w-40 h-40 md:w-56 md:h-56 object-cover rounded-lg" />
                                            ) : (
                                                <div className="text-7xl md:text-9xl">{team.logo}</div>
                                            )}
                                        </div>
                                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:32px_32px] pointer-events-none"></div>
                                        <div className="absolute bottom-6 md:bottom-8 px-4 py-1 rounded bg-black/50 border border-gray-700 text-[10px] font-mono text-gray-400 group-hover:text-white group-hover:border-white transition-all">
                                            STATUS: ONLINE
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                );
            })}
            
            <div className="h-48 flex flex-col items-center justify-center bg-gradient-to-t from-black to-transparent space-y-2 opacity-50">
                 <Database className="text-gray-600 animate-pulse" size={24}/>
                 <span className="font-mono text-[10px] tracking-widest text-gray-600">END OF RECORD</span>
            </div>
        </div>

        {/* USERNAME MODAL - Shows before team selection */}
        {showUsernameModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="relative w-full max-w-md mx-4 bg-gradient-to-br from-[#0a0a12] to-[#12121a] border border-white/10 rounded-2xl shadow-[0_0_100px_rgba(124,58,237,0.3)] overflow-hidden animate-in zoom-in-95 duration-300">
              {/* Glow effect */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-purple-500/20 blur-[80px] rounded-full"></div>
              
              {/* Close button */}
              <button 
                onClick={() => { setShowUsernameModal(false); setPendingTeamId(null); }}
                className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-all z-10"
              >
                <X size={20} />
              </button>

              <div className="relative p-8 space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-600/20 to-cyan-600/20 border border-purple-500/30 mb-4">
                    <User size={32} className="text-purple-400" />
                  </div>
                  <h2 className="text-2xl font-black font-cyber text-white tracking-wide">
                    AGENT IDENTIFICATION
                  </h2>
                  <p className="text-sm text-gray-400 font-mono">
                    Enter your callsign to join the faction
                  </p>
                </div>

                {/* Username Input */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
                    Username / Callsign
                  </label>
                  <div className="relative">
                    <input
                      ref={usernameInputRef}
                      type="text"
                      value={username}
                      onChange={(e) => { setUsername(e.target.value); setUsernameError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleUsernameSubmit()}
                      placeholder="Enter your username..."
                      maxLength={20}
                      className="w-full bg-black/50 border-2 border-purple-500/30 hover:border-purple-500/50 focus:border-purple-500 text-white text-lg font-bold p-4 pl-12 rounded-xl outline-none transition-all placeholder:text-gray-600"
                    />
                    <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-500/50" />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-mono">
                      {username.length}/20
                    </div>
                  </div>
                  {usernameError && (
                    <p className="text-xs text-red-400 font-mono animate-in slide-in-from-top-1 duration-200">
                      ⚠ {usernameError}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-600 font-mono">
                    Letters, numbers, and underscores only • 2-20 characters
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleUsernameSubmit}
                  disabled={username.trim().length < 2}
                  className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:from-gray-700 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl uppercase tracking-widest text-sm transition-all duration-300 shadow-lg hover:shadow-purple-500/30 group"
                >
                  <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
                  <span>Initialize Agent</span>
                </button>

                {/* Info text */}
                <p className="text-center text-[10px] text-gray-500 font-mono">
                  Your username will be displayed on the dashboard • Stored locally on this device
                </p>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default TeamLore;
