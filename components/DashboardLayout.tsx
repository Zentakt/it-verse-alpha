
import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { Team, UserProfile, AppState } from '../types';
import { Menu, X, Gamepad2, Trophy, Scan, LogOut, ChevronRight, Hexagon } from 'lucide-react';
import Footer from './Footer';

interface DashboardLayoutProps {
  currentTeam: Team;
  userProfile: UserProfile;
  currentView: AppState['currentView'];
  onNavigate: (view: AppState['currentView']) => void;
  children: React.ReactNode;
}

// --- 3D HEADER EMBLEM (Miniature Team Logo) ---
const HeaderEmblem: React.FC<{ team: Team }> = ({ team }) => {
    const mountRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mountRef.current) return;
        const w = 48; // Fixed size
        const h = 48;
        
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(50, w/h, 0.1, 100);
        camera.position.z = 3;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        mountRef.current.appendChild(renderer.domElement);

        // Create Logo Mesh
        const geometry = new THREE.IcosahedronGeometry(1, 0);
        const material = new THREE.MeshStandardMaterial({
            color: team.color,
            emissive: team.color,
            emissiveIntensity: 0.5,
            wireframe: true,
            roughness: 0.2,
            metalness: 0.8
        });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        
        // Inner Core
        const coreGeo = new THREE.IcosahedronGeometry(0.5, 1);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const core = new THREE.Mesh(coreGeo, coreMat);
        scene.add(core);

        // Lights
        const light = new THREE.DirectionalLight(0xffffff, 2);
        light.position.set(2, 2, 5);
        scene.add(light);
        
        // Animation
        let frameId = 0;
        const animate = () => {
            frameId = requestAnimationFrame(animate);
            mesh.rotation.y += 0.02;
            mesh.rotation.x += 0.01;
            
            // Pulse
            const t = Date.now() * 0.005;
            const s = 1 + Math.sin(t) * 0.1;
            mesh.scale.setScalar(s);
            core.scale.setScalar(s * 0.6);
            
            renderer.render(scene, camera);
        };
        animate();

        return () => {
            cancelAnimationFrame(frameId);
            renderer.dispose();
            if(mountRef.current) mountRef.current.innerHTML = '';
        };
    }, [team]);

    return <div ref={mountRef} className="w-12 h-12 relative z-10 pointer-events-none" />;
};

// --- TEAM ATMOSPHERE BACKGROUND (Personalized Effects) ---
const TeamAtmosphere: React.FC<{ team: Team }> = ({ team }) => {
    const mountRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mountRef.current) return;
        const w = window.innerWidth;
        const h = window.innerHeight;
        const isMobile = w < 768;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, w/h, 0.1, 100);
        camera.position.z = 10;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'high-performance' });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 1.5));
        mountRef.current.appendChild(renderer.domElement);

        // --- EFFECT LOGIC ---
        // We create a particle system that behaves differently based on team ID
        const pCount = isMobile ? 150 : 400;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(pCount * 3);
        const speeds = new Float32Array(pCount);
        const sizes = new Float32Array(pCount);

        for(let i=0; i<pCount; i++) {
            pos[i*3] = (Math.random() - 0.5) * 30; // X
            pos[i*3+1] = (Math.random() - 0.5) * 30; // Y
            pos[i*3+2] = (Math.random() - 0.5) * 10; // Z
            speeds[i] = 0.5 + Math.random();
            sizes[i] = Math.random();
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
        geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

        const mat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(team.color) },
                uMode: { value: 0 } // 0: Python, 1: Ajax, 2: Java, 3: Ruby
            },
            vertexShader: `
                uniform float uTime;
                uniform float uMode;
                attribute float aSpeed;
                attribute float aSize;
                varying float vAlpha;
                
                void main() {
                    vec3 p = position;
                    
                    if (uMode < 0.5) { // T1: PYTHON (Rising Code/Bubbles)
                        p.y += uTime * aSpeed;
                        p.y = mod(p.y + 15.0, 30.0) - 15.0;
                        p.x += sin(uTime + p.y) * 0.5;
                    } 
                    else if (uMode < 1.5) { // T2: AJAX (Horizontal Lightning/Data)
                        p.x += uTime * aSpeed * 5.0;
                        p.x = mod(p.x + 15.0, 30.0) - 15.0;
                        p.y += sin(p.x * 2.0 + uTime * 10.0) * 0.2; // Jitter
                    }
                    else if (uMode < 2.5) { // T3: JAVA (Floating Blocks)
                        p.y += sin(uTime + p.x) * 0.02;
                        p.x += cos(uTime + p.y) * 0.02;
                    }
                    else { // T4: RUBY (Explosive/Sparkle)
                        // Orbiting
                        float angle = uTime * aSpeed * 0.5;
                        float x = p.x; float y = p.y;
                        p.x = x * cos(angle) - y * sin(angle);
                        p.y = x * sin(angle) + y * cos(angle);
                    }

                    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                    
                    float sizeBase = (uMode > 2.5) ? 10.0 : 4.0;
                    gl_PointSize = sizeBase * aSize * (20.0 / -mvPosition.z);
                    
                    vAlpha = 0.6 + 0.4 * sin(uTime * aSpeed * 3.0);
                }
            `,
            fragmentShader: `
                uniform vec3 uColor;
                varying float vAlpha;
                uniform float uMode;

                void main() {
                    vec2 uv = gl_PointCoord - 0.5;
                    float dist = length(uv);
                    
                    float shape = 0.0;
                    if (uMode < 0.5) { // Circle (Bubble)
                        shape = smoothstep(0.5, 0.4, dist);
                    } else if (uMode < 1.5) { // Line/Rect
                        shape = step(abs(uv.y), 0.2) * step(abs(uv.x), 0.5);
                    } else if (uMode < 2.5) { // Square
                        shape = step(max(abs(uv.x), abs(uv.y)), 0.4);
                    } else { // Diamond
                        shape = step(abs(uv.x) + abs(uv.y), 0.5);
                    }

                    if (shape < 0.01) discard;
                    
                    gl_FragColor = vec4(uColor, vAlpha * shape * 0.5);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        // Set Mode based on ID
        if (team.id === 't1') mat.uniforms.uMode.value = 0;
        else if (team.id === 't2') mat.uniforms.uMode.value = 1;
        else if (team.id === 't3') mat.uniforms.uMode.value = 2;
        else mat.uniforms.uMode.value = 3;

        const points = new THREE.Points(geo, mat);
        scene.add(points);

        const clock = new THREE.Clock();
        let frameId = 0;
        const animate = () => {
            frameId = requestAnimationFrame(animate);
            mat.uniforms.uTime.value = clock.getElapsedTime();
            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            if(!mountRef.current) return;
            const w = window.innerWidth;
            const h = window.innerHeight;
            camera.aspect = w/h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(frameId);
            renderer.dispose();
            if(mountRef.current) mountRef.current.innerHTML = '';
        };
    }, [team]);

    return <div ref={mountRef} className="fixed inset-0 pointer-events-none mix-blend-screen z-0 opacity-60" />;
};

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ currentTeam, userProfile, currentView, onNavigate, children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [headerText, setHeaderText] = useState("ITE VERSE");
  
  // Scramble effect on mount
  useEffect(() => {
      const target = "VERSE";
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let iter = 0;
      const interval = setInterval(() => {
          const scrambled = target.split("").map((c, i) => {
              if (i < iter) return c;
              return chars[Math.floor(Math.random() * chars.length)];
          }).join("");
          setHeaderText(`ITE ${scrambled}`);
          if (iter >= target.length) clearInterval(interval);
          iter += 1/3;
      }, 50);
      return () => clearInterval(interval);
  }, [currentTeam]);

  const navItems = [
    { id: 'games', label: 'WAR ROOM', icon: Gamepad2 },
    { id: 'leaderboard', label: 'FACTION RANK', icon: Trophy },
    { id: 'scanner', label: 'UPLINK SCAN', icon: Scan },
  ] as const;

  const handleNav = (view: AppState['currentView']) => {
    onNavigate(view);
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#05050a] text-white flex flex-col relative overflow-hidden font-sans">
      
      {/* 1. DYNAMIC BACKGROUND LAYER */}
      <TeamAtmosphere team={currentTeam} />

      {/* 2. LEGENDARY HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 h-20 bg-[#05050a]/80 backdrop-blur-xl border-b border-white/5 px-4 md:px-8 flex items-center justify-between shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        
        {/* LOGO AREA */}
        <div className="flex items-center gap-4 group cursor-pointer" onClick={() => onNavigate('games')}>
            <div className="w-12 h-12 relative flex items-center justify-center bg-white/5 rounded-lg border border-white/10 group-hover:border-[var(--color)] transition-colors duration-300" style={{ '--color': currentTeam.color } as React.CSSProperties}>
                 {/* 3D Emblem */}
                 <div className="absolute inset-0 scale-125">
                     <HeaderEmblem team={currentTeam} />
                 </div>
                 {/* Glow backing */}
                 <div className="absolute inset-0 bg-[var(--color)] opacity-20 blur-lg rounded-full" style={{ '--color': currentTeam.color } as React.CSSProperties}></div>
            </div>
            
            <div className="flex flex-col justify-center">
                <h1 className="text-2xl md:text-3xl font-black tracking-widest leading-none font-cyber text-white flex gap-4">
                    <span className="opacity-80">ITE</span> 
                    <span className="relative">
                        <span className="absolute inset-0 blur-sm opacity-50" style={{ color: currentTeam.color }}>VERSE</span>
                        <span className="relative z-10" style={{ color: currentTeam.color }}>{headerText.split(' ')[1]}</span>
                    </span>
                </h1>
            </div>
        </div>

        {/* DESKTOP NAV - PILL STYLE */}
        <div className="hidden md:flex items-center bg-[#0a0a0a] p-1.5 rounded-full border border-white/10 shadow-lg relative overflow-hidden">
            {/* Active Pill Indicator (Animated via Layout ideally, simplified here) */}
            {navItems.map(item => {
                const isActive = currentView === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => handleNav(item.id)}
                        className={`
                            relative px-6 py-2 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-2 z-10
                            ${isActive ? 'text-black' : 'text-gray-400 hover:text-white'}
                        `}
                    >
                        {isActive && (
                            <div className="absolute inset-0 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.4)] -z-10 animate-in zoom-in duration-200"></div>
                        )}
                        <item.icon size={14} className={isActive ? 'text-black' : ''} /> 
                        <span className="tracking-wider">{item.label}</span>
                    </button>
                );
            })}
        </div>

        {/* USER / MOBILE MENU */}
        <div className="flex items-center gap-4">
             {/* Desktop Profile */}
             <div className="hidden md:flex items-center gap-3 text-right pl-6 border-l border-white/10">
                <div className="flex flex-col items-end">
                    <div className="text-xs font-bold text-white tracking-wide">{userProfile.username}</div>
                    <div className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/5 text-[var(--color)] border border-[var(--color)]/30" style={{ '--color': currentTeam.color } as React.CSSProperties}>
                        {currentTeam.id.toUpperCase()} AGENT
                    </div>
                </div>
                <div className="relative w-9 h-9 p-[1px] rounded-lg bg-gradient-to-br from-white/20 to-transparent">
                    <div className="w-full h-full rounded-[7px] bg-black overflow-hidden relative">
                        <img src={userProfile.avatar} className="w-full h-full object-cover" alt="Avatar" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color)]/50 to-transparent opacity-50" style={{ '--color': currentTeam.color } as React.CSSProperties}></div>
                    </div>
                    {/* Online Dot */}
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-black rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full border border-black"></div>
                    </div>
                </div>
             </div>

             <button 
                onClick={() => setIsMenuOpen(true)}
                className="md:hidden w-10 h-10 flex items-center justify-center text-white bg-white/5 border border-white/10 rounded-lg active:scale-95 transition-all"
             >
                <Menu size={20} />
             </button>
        </div>
      </header>

      {/* 3. MOBILE MENU OVERLAY (Legendary Style) */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/10 bg-[#0a0a0a]">
                <div className="flex items-center gap-2">
                    <Hexagon size={18} className="text-gray-500" />
                    <span className="font-cyber text-lg tracking-widest text-white">SYSTEM MENU</span>
                </div>
                <button onClick={() => setIsMenuOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white hover:text-black transition-all">
                    <X size={20} />
                </button>
            </div>
            
            {/* Nav Links */}
            <nav className="flex-1 p-6 flex flex-col gap-3 overflow-y-auto">
                {navItems.map((item, idx) => (
                    <button
                        key={item.id}
                        onClick={() => handleNav(item.id)}
                        className="group relative flex items-center justify-between p-6 border border-white/5 bg-[#111] overflow-hidden transition-all active:scale-[0.98]"
                        style={{ animationDelay: `${idx * 50}ms` }}
                    >
                        {/* Hover Fill */}
                        <div className={`absolute inset-0 bg-gradient-to-r from-[var(--color)]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} style={{ '--color': currentTeam.color } as React.CSSProperties}></div>
                        
                        {/* Active Border */}
                        {currentView === item.id && (
                             <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color)]" style={{ '--color': currentTeam.color } as React.CSSProperties}></div>
                        )}

                        <div className="flex items-center gap-4 relative z-10">
                            <div className={`p-3 rounded-lg bg-black/50 ${currentView === item.id ? 'text-[var(--color)]' : 'text-gray-400 group-hover:text-white'}`} style={{ '--color': currentTeam.color } as React.CSSProperties}>
                                <item.icon size={24} />
                            </div>
                            <div className="flex flex-col items-start">
                                <span className={`text-xl font-black font-cyber tracking-wider ${currentView === item.id ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                                    {item.label}
                                </span>
                                <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Module 0{idx+1}</span>
                            </div>
                        </div>
                        
                        <ChevronRight className={`text-gray-600 group-hover:text-white transition-colors relative z-10 ${currentView === item.id ? 'text-[var(--color)]' : ''}`} style={{ '--color': currentTeam.color } as React.CSSProperties} />
                    </button>
                ))}
            </nav>

            {/* User Footer */}
            <div className="p-6 border-t border-white/10 bg-[#0a0a0a]">
                <div className="flex items-center justify-between p-4 bg-[#151515] rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-800 overflow-hidden relative">
                            <img src={userProfile.avatar} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 border border-white/10 rounded-lg"></div>
                        </div>
                        <div>
                            <div className="font-bold text-white text-sm">{userProfile.username}</div>
                            <div className="text-[10px] text-[var(--color)] font-mono uppercase" style={{ '--color': currentTeam.color } as React.CSSProperties}>{currentTeam.name}</div>
                        </div>
                    </div>
                    <button className="p-2 text-gray-500 hover:text-red-500 transition-colors">
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* 4. MAIN CONTENT AREA */}
      <main className="flex-1 pt-20 relative flex flex-col z-10">
        {/* Breadcrumb / Top Bar mobile */}
        <div className="md:hidden px-4 py-2 border-b border-white/5 flex justify-between items-center bg-black/20 backdrop-blur-sm">
             <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                SYS // {currentView.toUpperCase()}
             </div>
             <div className="flex gap-1">
                 <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                 <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                 <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
             </div>
        </div>

        {children}
        <Footer />
      </main>
    </div>
  );
};

export default DashboardLayout;
