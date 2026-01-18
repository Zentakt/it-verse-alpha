
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { Team, UserProfile, AppState } from '../types';
import { Menu, X, Gamepad2, Trophy, Scan, LogOut, ChevronRight, Hexagon, Activity, Power, User, LogIn } from 'lucide-react';
import Footer from './Footer';

interface DashboardLayoutProps {
  currentTeam: Team;
  userProfile: UserProfile;
  currentView: AppState['currentView'];
  onNavigate: (view: AppState['currentView']) => void;
  onLogoClick?: () => void;
  children: React.ReactNode;
}

// --- 3D HEADER EMBLEM: PLANET UNIVERSE GLITCH ---

const PLANET_VERTEX = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  
  uniform float uTime;
  uniform float uGlitch;
  
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    
    vec3 pos = position;
    
    // GLITCH DISPLACEMENT: Slices the planet horizontally
    // High frequency noise for the 'digital tear' look
    float slice = sin(pos.y * 10.0 + uTime * 20.0);
    float jitter = step(0.9, sin(uTime * 30.0 + pos.y * 5.0)); // Random flickering slices
    
    // Apply displacement only when glitch is active or randomly
    float activeGlitch = uGlitch + (step(0.99, fract(uTime * 0.4)) * 0.3); 
    
    // Shift vertices on X/Z axis based on Y position (scanline shift)
    pos.x += jitter * activeGlitch * 0.2;
    pos.z += jitter * activeGlitch * 0.1;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const PLANET_FRAGMENT = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  
  uniform vec3 uColor;
  uniform float uTime;
  
  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    
    // 1. FRESNEL GLOW (Atmosphere / Shield)
    // Stronger at edges
    float fresnel = pow(1.0 - abs(dot(normal, viewDir)), 2.5);
    
    // 2. HOLOGRAPHIC GRID
    // Moving lines to simulate data flow
    float grid = step(0.92, fract(vUv.y * 30.0 - uTime * 0.5)) + step(0.95, fract(vUv.x * 30.0));
    
    // 3. COLOR COMPOSITION
    vec3 baseColor = uColor * 0.3; // Darker core
    vec3 glowColor = mix(uColor, vec3(1.0), 0.6); // White-hot glow
    
    vec3 finalColor = baseColor;
    finalColor += glowColor * fresnel * 2.5; // Rim light intensity
    finalColor += glowColor * grid * 0.3;    // Grid lines overlay
    
    // Glitchy White Flashes (Strobe effect)
    float flash = step(0.98, sin(uTime * 60.0));
    finalColor += vec3(1.0) * flash * 0.3;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

const HeaderEmblem: React.FC<{ team: Team }> = ({ team }) => {
    const mountRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mountRef.current) return;
        
        // Render size: Larger than container to allow glow/particles to spill over without clipping
        const size = 100; 
        
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
        camera.position.z = 6.0; // Optimized distance for perfect centering

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
        renderer.setSize(size, size);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        mountRef.current.appendChild(renderer.domElement);

        // --- 1. THE GLITCH PLANET ---
        const geometry = new THREE.IcosahedronGeometry(1, 4); // High detail for smooth fresnel
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(team.color) },
                uGlitch: { value: 0 }
            },
            vertexShader: PLANET_VERTEX,
            fragmentShader: PLANET_FRAGMENT,
            transparent: true,
        });
        const planet = new THREE.Mesh(geometry, material);
        scene.add(planet);

        // --- 2. ORBITAL RINGS (Reality Anchors) ---
        // Using Torus for a solid sci-fi ring look
        const ringGeo = new THREE.TorusGeometry(1.5, 0.015, 16, 64);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
        
        const ring1 = new THREE.Mesh(ringGeo, ringMat);
        ring1.rotation.x = Math.PI / 2; // Flat
        ring1.rotation.y = -0.2; // Tilt
        scene.add(ring1);

        // Second smaller offset ring
        const ring2 = new THREE.Mesh(ringGeo, ringMat);
        ring2.rotation.x = Math.PI / 2;
        ring2.rotation.y = 0.2;
        ring2.scale.setScalar(0.9);
        scene.add(ring2);

        // --- 3. FLOATING DATA BITS (Instanced Mesh) ---
        // "Universe" debris orbiting the planet
        const pCount = 24;
        const pGeo = new THREE.BoxGeometry(0.06, 0.06, 0.06);
        const pMat = new THREE.MeshBasicMaterial({ color: team.color });
        const particles = new THREE.InstancedMesh(pGeo, pMat, pCount);
        
        const dummy = new THREE.Object3D();
        const pData: { r: number, speed: number, y: number, offset: number }[] = [];
        
        for(let i=0; i<pCount; i++) {
            pData.push({ 
                r: 1.7 + Math.random() * 0.6, // Orbit radius
                speed: (Math.random() - 0.5) * 1.5, // Orbital speed
                y: (Math.random() - 0.5) * 1.2, // Vertical spread
                offset: Math.random() * Math.PI * 2
            });
        }
        scene.add(particles);

        // --- ANIMATION LOOP ---
        const clock = new THREE.Clock();
        
        // GSAP Glitch Trigger Logic
        const glitchObj = { intensity: 0 };
        const triggerGlitch = () => {
            // Trigger a random intense glitch event
            const duration = 0.1 + Math.random() * 0.2;
            gsap.to(glitchObj, {
                intensity: 1,
                duration: 0.05,
                yoyo: true,
                repeat: Math.floor(Math.random() * 4) + 1, // Random stutter count
                ease: "steps(1)", // Digital snap feel
                onComplete: () => {
                    glitchObj.intensity = 0;
                    // Schedule next glitch randomly between 2s and 6s
                    gsap.delayedCall(2 + Math.random() * 4, triggerGlitch);
                }
            });
        };
        triggerGlitch();

        let frameId = 0;
        const animate = () => {
            frameId = requestAnimationFrame(animate);
            const t = clock.getElapsedTime();
            
            // Planet Rotation (Slow & Majestic)
            planet.rotation.y = t * 0.2;
            planet.rotation.z = Math.sin(t * 0.3) * 0.1;
            
            // Update Shader Uniforms
            material.uniforms.uTime.value = t;
            material.uniforms.uGlitch.value = glitchObj.intensity;
            
            // Rings Wobble (Gyroscopic motion)
            ring1.rotation.x = (Math.PI / 2) + Math.sin(t * 0.5) * 0.1;
            ring1.rotation.y = t * 0.1;
            
            ring2.rotation.x = (Math.PI / 2) + Math.cos(t * 0.4) * 0.1;
            ring2.rotation.y = -t * 0.15;

            // Particles Orbit
            for(let i=0; i<pCount; i++) {
                const d = pData[i];
                const angle = t * d.speed + d.offset;
                
                // Add glitch distortion to particles too (they scatter slightly)
                const glitchOffset = glitchObj.intensity > 0.5 ? (Math.random()-0.5)*0.3 : 0;
                
                dummy.position.set(
                    Math.cos(angle) * (d.r + glitchOffset),
                    d.y + Math.sin(t * 1.5 + i) * 0.1,
                    Math.sin(angle) * (d.r + glitchOffset)
                );
                
                // Particles tumble
                dummy.rotation.set(t + i, t * 2, t);
                
                // Scale pulse
                const s = 1.0 + Math.sin(t * 5 + i) * 0.3;
                dummy.scale.setScalar(s);
                
                dummy.updateMatrix();
                particles.setMatrixAt(i, dummy.matrix);
            }
            particles.instanceMatrix.needsUpdate = true;

            renderer.render(scene, camera);
        };
        animate();

        return () => {
            cancelAnimationFrame(frameId);
            renderer.dispose();
            geometry.dispose();
            material.dispose();
            if(mountRef.current) mountRef.current.innerHTML = '';
            gsap.killTweensOf(glitchObj);
        };
    }, [team]);

    // Removed negative margin to ensure perfect centering
    return <div ref={mountRef} className="w-[60px] h-[60px] flex items-center justify-center pointer-events-none" />;
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

// --- LEGENDARY MOBILE MENU ---
interface MobileMenuProps {
    onClose: () => void;
    navItems: readonly { id: AppState['currentView']; label: string; icon: any }[];
    currentView: AppState['currentView'];
    onNavigate: (view: AppState['currentView']) => void;
    userProfile: UserProfile;
    currentTeam: Team;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ onClose, navItems, currentView, onNavigate, userProfile, currentTeam }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const itemsRef = useRef<(HTMLButtonElement | null)[]>([]);

    // Entry / Exit Animation Logic
    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            // 1. Initial State - Pre-glitch setup
            gsap.set(containerRef.current, { opacity: 0 });
            gsap.set(contentRef.current, { clipPath: "circle(0% at 100% 0%)" });
            
            // Set items "off-screen" with a warp effect
            gsap.set(".menu-item", { 
                x: 100,         // Push to right
                opacity: 0, 
                skewX: -20,     // Heavy digital skew
                scale: 0.9 
            });
            gsap.set(".menu-text-label", { y: 20, opacity: 0 }); // Separate text stagger
            gsap.set(".menu-icon-box", { scale: 0, rotation: -90 }); // Icon spin in
            gsap.set(".menu-border", { scaleX: 0 });
            gsap.set(".menu-scanline", { top: '-10%' });

            // 2. Entrance Timeline (Buttery Smooth + Quicker)
            const tl = gsap.timeline();

            // Background Wipe (Faster)
            tl.to(containerRef.current, { opacity: 1, duration: 0.1 });
            tl.to(contentRef.current, { 
                clipPath: "circle(150% at 100% 0%)", 
                duration: 0.5, 
                ease: "expo.inOut" 
            });

            // Compound Stagger: Elements arrive in a wave (Faster)
            // Container Arrival
            tl.to(".menu-item", { 
                x: 0, 
                opacity: 1, 
                skewX: 0,       // Straighten out (The "Reality Snap")
                scale: 1,
                duration: 0.4, 
                stagger: {
                    amount: 0.2, 
                    from: "start"
                }, 
                ease: "elastic.out(1, 0.75)" 
            }, "-=0.3"); 

            // Inner Content Stagger (Text & Icon lag slightly behind container)
            tl.to(".menu-text-label", {
                y: 0,
                opacity: 1,
                duration: 0.3,
                stagger: 0.05,
                ease: "back.out(2)"
            }, "<0.1");

            tl.to(".menu-icon-box", {
                scale: 1,
                rotation: 0,
                duration: 0.4,
                stagger: 0.05,
                ease: "back.out(1.5)"
            }, "<");

            // Borders Draw (Tech feel)
            tl.to(".menu-border", { 
                scaleX: 1, 
                duration: 0.4, 
                ease: "power2.out",
                stagger: 0.05
            }, "-=0.4");

            // Scanline Wipe Loop
            tl.to(".menu-scanline", { 
                top: '120%', 
                duration: 1.5,
                ease: "linear", 
                repeat: -1, 
                repeatDelay: 1 
            }, "-=0.8");
        });

        return () => ctx.revert();
    }, []);

    const handleClose = () => {
        // Exit Sequence (Collapse Reality - FASTER)
        const tl = gsap.timeline({ onComplete: onClose });
        
        // Stagger out quickly
        tl.to(".menu-item", { 
            x: 50, 
            opacity: 0, 
            skewX: 20, // Skew opposite direction on exit
            duration: 0.2, 
            stagger: 0.03, 
            ease: "power2.in" 
        });
        
        tl.to(contentRef.current, { 
            clipPath: "circle(0% at 100% 0%)", 
            duration: 0.3, 
            ease: "expo.in" 
        }, "-=0.1");
        
        tl.to(containerRef.current, { opacity: 0, duration: 0.15 });
    };

    const handleItemClick = (index: number, view: AppState['currentView']) => {
        // Flash Effect on Click
        const tl = gsap.timeline({ onComplete: () => {
            onNavigate(view);
            handleClose();
        }});
        
        // Specific Icon Burst Animation
        const item = itemsRef.current[index];
        const icon = item?.querySelector('.menu-icon-box');
        
        if (icon) {
            tl.to(icon, { 
                rotation: 360, 
                scale: 1.5, 
                color: '#fff', 
                backgroundColor: currentTeam.color,
                duration: 0.3, 
                ease: "back.in(2)" 
            });
        }
        
        // Stagger others out
        tl.to(".menu-item", { 
            opacity: 0, 
            x: 50, 
            duration: 0.2, 
            stagger: 0.05 
        }, "<0.1");
    };

    return (
        <div ref={containerRef} className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex justify-end">
            
            {/* Main Menu Panel */}
            <div 
                ref={contentRef}
                className="w-full md:w-[450px] h-full bg-[#05050a] border-l border-white/10 relative overflow-hidden flex flex-col shadow-2xl"
                style={{ clipPath: "circle(0% at 100% 0%)" }}
            >
                {/* Background Grid & Noise */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                     <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:30px_30px] animate-[pan_20s_linear_infinite]"></div>
                     <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--team-color)]/5 to-transparent" style={{ '--team-color': currentTeam.color } as React.CSSProperties}></div>
                </div>

                {/* Scanning Line Effect */}
                <div className="menu-scanline absolute left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_20px_white] z-20 pointer-events-none opacity-50"></div>

                {/* Header */}
                <div className="relative z-30 flex justify-between items-center p-6 md:p-8 border-b border-white/10 bg-black/40 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded bg-[var(--team-color)] flex items-center justify-center text-black shadow-[0_0_15px_var(--team-color)]" style={{ '--team-color': currentTeam.color } as React.CSSProperties}>
                            <Hexagon size={22} className="animate-spin-slow" />
                         </div>
                         <div className="flex flex-col">
                             <span className="text-[10px] text-gray-400 tracking-[0.2em] font-mono">SYSTEM ACCESS</span>
                             <span className="text-xl font-bold font-cyber text-white leading-none tracking-wide">MENU // OVERRIDE</span>
                         </div>
                    </div>
                    <button 
                        onClick={handleClose}
                        className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-colors active:scale-95 group bg-black/50"
                    >
                        <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </div>

                {/* Nav Items */}
                <div className="flex-1 flex flex-col justify-center gap-6 p-6 md:p-8 relative z-30">
                    {navItems.map((item, idx) => {
                        const isActive = currentView === item.id;
                        return (
                            <button
                                key={item.id}
                                ref={el => { itemsRef.current[idx] = el; }}
                                onClick={() => handleItemClick(idx, item.id)}
                                className={`
                                    menu-item group relative w-full text-left p-6 overflow-hidden rounded-md transition-all duration-300
                                    ${isActive ? 'bg-[var(--team-color)]/10' : 'hover:bg-white/5'}
                                `}
                                style={{ '--team-color': currentTeam.color } as React.CSSProperties}
                            >
                                {/* Active Indicator Glow */}
                                {isActive && (
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--team-color),transparent_70%)] opacity-20 blur-xl"></div>
                                )}
                                {isActive && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[var(--team-color)] shadow-[0_0_20px_var(--team-color)]"></div>}
                                
                                {/* Animated Bottom Border */}
                                <div className="menu-border absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent w-full origin-center"></div>

                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-5">
                                        <div className={`
                                            menu-icon-box p-3 rounded-lg transition-colors duration-300 transform
                                            ${isActive ? 'bg-[var(--team-color)] text-black shadow-[0_0_15px_var(--team-color)]' : 'bg-white/5 text-gray-400 group-hover:text-white group-hover:bg-white/10'}
                                        `}>
                                            <item.icon size={28} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`
                                                menu-text-label text-3xl font-black font-cyber tracking-wider leading-none transition-all duration-300
                                                ${isActive ? 'text-white translate-x-2' : 'text-gray-500 group-hover:text-white group-hover:translate-x-2'}
                                            `}>
                                                {item.label}
                                            </span>
                                            <span className="menu-text-label text-[10px] font-mono text-gray-600 tracking-[0.3em] group-hover:text-[var(--team-color)] transition-colors mt-1">
                                                MODULE_0{idx+1}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <ChevronRight 
                                        className={`
                                            transition-all duration-500 opacity-0 -translate-x-8
                                            ${isActive ? 'opacity-100 translate-x-0 text-[var(--team-color)]' : 'group-hover:opacity-100 group-hover:translate-x-0 text-white'}
                                        `} 
                                        size={28}
                                    />
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Footer User Info */}
                <div className="relative z-30 p-6 md:p-8 border-t border-white/10 bg-black/60 backdrop-blur-xl">
                    <div className="menu-item flex items-center justify-between bg-[#111] p-4 rounded-xl border border-white/5 group hover:border-[var(--team-color)] transition-colors" style={{ '--team-color': currentTeam.color } as React.CSSProperties}>
                        <div className="flex items-center gap-4">
                             <div className="relative w-12 h-12">
                                 <img src={userProfile.avatar} className="w-full h-full object-cover rounded-lg grayscale group-hover:grayscale-0 transition-all" />
                                 <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-black rounded-full flex items-center justify-center">
                                     <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></div>
                                 </div>
                             </div>
                             <div>
                                 <div className="text-base font-bold text-white group-hover:text-[var(--team-color)] transition-colors tracking-wide">
                                     {userProfile.username}
                                 </div>
                                 <div className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">
                                     {currentTeam.id} OPERATIVE // ONLINE
                                 </div>
                             </div>
                        </div>
                        <button className="text-gray-500 hover:text-red-500 transition-colors p-2 hover:bg-red-500/10 rounded-lg">
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ currentTeam, userProfile, currentView, onNavigate, onLogoClick, children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [headerText, setHeaderText] = useState("IT VERSE");
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  
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
          setHeaderText(`IT ${scrambled}`);
          if (iter >= target.length) clearInterval(interval);
          iter += 1/3;
      }, 50);
      return () => clearInterval(interval);
  }, [currentTeam]);

  const navItems = [
    { id: 'games', label: 'LIVE ARENA', icon: Gamepad2 },
    { id: 'leaderboard', label: 'FACTION RANK', icon: Trophy },
    { id: 'scanner', label: 'UPLINK SCAN', icon: Scan },
    { id: 'tournaments', label: 'TOURNAMENTS', icon: User },
  ] as const;

  const handleNav = (view: AppState['currentView']) => {
    onNavigate(view);
    setIsMenuOpen(false);
  };

  const handleMenuOpen = () => {
      if(!menuBtnRef.current) {
          setIsMenuOpen(true);
          return;
      }
      
      // Animated Hamburger Trigger
      gsap.to(menuBtnRef.current, {
          rotate: 90,
          scale: 0.8,
          duration: 0.2,
          ease: "back.in(2)",
          onComplete: () => {
              setIsMenuOpen(true);
              // Reset state invisibly for when it closes
              gsap.set(menuBtnRef.current, { rotate: 0, scale: 1 });
          }
      });
  };

  return (
    <div className="min-h-screen bg-[#05050a] text-white flex flex-col relative overflow-hidden font-sans">
      
      {/* 1. DYNAMIC BACKGROUND LAYER */}
      <TeamAtmosphere team={currentTeam} />

      {/* 2. LEGENDARY HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 h-20 bg-[#05050a]/80 backdrop-blur-xl border-b border-white/5 px-4 md:px-8 flex items-center justify-between shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        
        {/* LOGO AREA - Click to return to team selection */}
        <div className="flex items-center gap-4 group cursor-pointer" onClick={() => onLogoClick?.()}>
            <div className="w-12 h-12 relative flex items-center justify-center bg-white/5 rounded-lg border border-white/10 group-hover:border-[var(--color)] transition-colors duration-300" style={{ '--color': currentTeam.color } as React.CSSProperties}>
                 {/* 3D Emblem Container - Perfectly Centered */}
                 <div className="absolute inset-0 flex items-center justify-center">
                     <HeaderEmblem team={currentTeam} />
                 </div>
                 {/* Glow backing */}
                 <div className="absolute inset-0 bg-[var(--color)] opacity-20 blur-lg rounded-full" style={{ '--color': currentTeam.color } as React.CSSProperties}></div>
            </div>
            
            <div className="flex flex-col justify-center">
                <h1 className="text-2xl md:text-3xl font-black tracking-widest leading-none font-cyber text-white flex gap-3 items-center">
                    <span className="opacity-80">IT</span> 
                    <span className="relative">
                        {/* Glitch Shadow Effect for text */}
                        <span className="absolute top-0 left-0 -ml-[2px] opacity-70 blur-[1px]" style={{ color: currentTeam.color, mixBlendMode: 'screen' }}>VERSE</span>
                        <span className="absolute top-0 left-0 ml-[2px] opacity-70 blur-[1px] text-white" style={{ mixBlendMode: 'overlay' }}>VERSE</span>
                        <span className="relative z-10 text-white">{headerText.split(' ')[1]}</span>
                    </span>
                </h1>
            </div>
        </div>

        {/* DESKTOP NAV - PILL STYLE */}
        <div className="hidden lg:flex items-center bg-[#0a0a0a] p-1.5 rounded-full border border-white/10 shadow-lg relative overflow-hidden">
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
             <div className="hidden lg:flex items-center gap-3 text-right pl-6 border-l border-white/10">
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
                ref={menuBtnRef}
                onClick={handleMenuOpen}
                className="lg:hidden w-10 h-10 flex items-center justify-center text-white bg-white/5 border border-white/10 rounded-lg active:scale-95 transition-all"
             >
                <Menu size={20} />
             </button>
        </div>
      </header>

      {/* 3. NEW MOBILE MENU OVERLAY (GSAP Enhanced) */}
      {isMenuOpen && (
        <MobileMenu 
            onClose={() => setIsMenuOpen(false)}
            navItems={navItems}
            currentView={currentView}
            onNavigate={onNavigate}
            userProfile={userProfile}
            currentTeam={currentTeam}
        />
      )}

      {/* 4. MAIN CONTENT AREA */}
      <main className="flex-1 pt-20 relative flex flex-col z-10">
        {/* Breadcrumb / Top Bar mobile */}
        <div className="lg:hidden px-4 py-2 border-b border-white/5 flex justify-between items-center bg-black/20 backdrop-blur-sm">
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
      </main>
    </div>
  );
};

export default DashboardLayout;