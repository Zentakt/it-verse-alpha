
import React, { useState, useEffect, useCallback, useRef } from 'react';
import VoxelTorch from './VoxelTorch';
import { AppState } from '../types';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import * as THREE from 'three';
import { X, Lock, Zap, AlertTriangle } from 'lucide-react';

interface HeroProps {
  appState: AppState;
  onTorchLight: () => void;
}

// --- LEGENDARY TITLE SHADER SYSTEM V3 ---

const TITLE_VERTEX = `
  varying vec2 vUv;
  uniform vec2 uMouse;
  uniform float uHover;
  
  void main() {
    vUv = uv;
    vec3 pos = position;
    
    // Subtle parallax tilt
    float tiltX = -uMouse.y * 0.1 * uHover;
    float tiltY = uMouse.x * 0.1 * uHover;
    
    // Rotation Matrix approximation
    float cz = cos(tiltX); float sz = sin(tiltX);
    pos.yz = pos.yz * mat2(cz, -sz, sz, cz);
    
    float cx = cos(tiltY); float sx = sin(tiltY);
    pos.xz = pos.xz * mat2(cx, -sx, sx, cx);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const TITLE_FRAGMENT = `
  varying vec2 vUv;
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uGlitch;      // 0 = stable, 1 = chaos
  uniform float uDissolve;    // 0 = solid, 1 = dissolved
  uniform float uRGBShift;    // Chromatic aberration intensity
  
  float rand(vec2 n) { 
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
  }
  
  float noise(vec2 p){
    vec2 ip = floor(p);
    vec2 u = fract(p);
    u = u*u*(3.0-2.0*u);
    float res = mix(
        mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
        mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
    return res;
  }

  void main() {
    vec2 uv = vUv;
    
    float n = noise(uv * 20.0 + uTime); 
    if (n < uDissolve) discard;

    vec2 block = floor(uv * vec2(20.0, 40.0) + uTime * 5.0);
    float blockNoise = rand(block);
    float displace = 0.0;
    
    float sporadic = step(0.99, rand(vec2(uTime * 2.0, 0.0))) * 0.1;
    float intensity = uGlitch + sporadic;
    
    if (blockNoise < intensity * 0.4) {
        displace = (rand(vec2(uTime)) - 0.5) * 0.1 * intensity;
    }
    vec2 distUv = uv + vec2(displace, 0.0);

    float shift = uRGBShift + (intensity * 0.02);
    
    vec4 cr = texture2D(uTexture, distUv + vec2(shift, 0.0));
    vec4 cg = texture2D(uTexture, distUv);
    vec4 cb = texture2D(uTexture, distUv - vec2(shift, 0.0));
    
    float scan = sin(uv.y * 800.0) * 0.04;
    float sheen = smoothstep(0.0, 0.15, 0.1 - abs(uv.x + uv.y * 0.2 - (sin(uTime * 0.5) * 2.0 + 0.5)));
    
    vec3 color = vec3(cr.r, cg.g, cb.b);
    
    color += vec3(1.0) * sheen * 0.5; 
    color -= scan; 
    
    if (n < uDissolve + 0.05 && uDissolve > 0.0) {
        color = vec3(0.2, 1.0, 1.0);
        color *= 2.0; 
    }

    float alpha = cg.a;
    if (alpha < 0.01 && n >= uDissolve + 0.05) discard;

    gl_FragColor = vec4(color, alpha);
  }
`;

const LegendaryTitle = () => {
    const mountRef = useRef<HTMLDivElement>(null);
    const mouseRef = useRef(new THREE.Vector2(0,0));
    const hoverRef = useRef(0);
    const sceneRef = useRef<{ plane: THREE.Mesh, material: THREE.ShaderMaterial } | null>(null);

    useEffect(() => {
        if (!mountRef.current) return;
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        const isMobile = window.innerWidth < 768;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        camera.position.z = 10; 

        // PERFORMANCE: Disable antialias on mobile, lower pixel ratio
        const renderer = new THREE.WebGLRenderer({ 
            alpha: true, 
            antialias: !isMobile, 
            powerPreference: 'high-performance' 
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.0 : 1.5));
        mountRef.current.appendChild(renderer.domElement);

        const createTitleTexture = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 2048;
            canvas.height = 1024;
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;

            ctx.clearRect(0,0, 2048, 1024);
            const cx = 1024;
            const cy = 512;

            const g1 = ctx.createLinearGradient(0, 200, 0, 800);
            g1.addColorStop(0, '#ffffff');
            g1.addColorStop(0.4, '#a5b4fc');
            g1.addColorStop(0.5, '#4f46e5');
            g1.addColorStop(1, '#ffffff');
            
            ctx.fillStyle = g1;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = '900 600px "Jersey 10"'; 
            
            ctx.shadowColor = 'rgba(124, 58, 237, 0.6)'; 
            ctx.shadowBlur = 40;
            ctx.fillText("IT-VERSE", cx, cy - 80);
            
            ctx.shadowBlur = 0;
            ctx.lineWidth = 4;
            ctx.strokeStyle = 'white';
            ctx.strokeText("IT-VERSE", cx, cy - 80);

            const g2 = ctx.createLinearGradient(0, 800, 2048, 800);
            g2.addColorStop(0.4, '#c084fc'); 
            g2.addColorStop(0.6, '#f472b6'); 
            
            ctx.fillStyle = g2;
            ctx.font = '900 240px "Jersey 10"'; 
            ctx.shadowColor = 'rgba(236, 72, 153, 0.8)';
            ctx.shadowBlur = 30;
            
            ctx.fillText("2025", cx, cy + 280); 

            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            for(let i=0; i<1024; i+=8) {
                ctx.fillRect(0, i, 2048, 3);
            }

            const tex = new THREE.CanvasTexture(canvas);
            tex.needsUpdate = true;
            return tex;
        };

        const texture = createTitleTexture();

        const geometry = new THREE.PlaneGeometry(16, 8);
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uTexture: { value: texture },
                uMouse: { value: new THREE.Vector2(0,0) },
                uHover: { value: 0 },
                uGlitch: { value: 1.0 },   
                uDissolve: { value: 1.0 }, 
                uRGBShift: { value: 0.02 } 
            },
            vertexShader: TITLE_VERTEX,
            fragmentShader: TITLE_FRAGMENT,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const plane = new THREE.Mesh(geometry, material);
        scene.add(plane);
        sceneRef.current = { plane, material };

        const startIntro = () => {
            const tl = gsap.timeline({ delay: 0.5 });
            tl.to(material.uniforms.uDissolve, { value: 0.0, duration: 1.5, ease: "power2.inOut" });
            tl.to(material.uniforms.uRGBShift, { value: 0.002, duration: 1.0, ease: "expo.out" }, "-=0.5");
            tl.to(material.uniforms.uGlitch, { value: 0.0, duration: 0.8, ease: "elastic.out(1, 0.5)" }, "-=0.8");
        };

        const handleResize = () => {
            if (!mountRef.current) return;
            const w = mountRef.current.clientWidth;
            const h = mountRef.current.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
            const visibleHeight = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
            const visibleWidth = visibleHeight * camera.aspect;
            const targetPercentage = w < 768 ? 0.95 : 0.80;
            let scale = (visibleWidth * targetPercentage) / 16;
            scale = Math.min(scale, 1.2); 
            plane.scale.setScalar(scale);
        };
        handleResize();

        const onMouseMove = (e: MouseEvent) => {
            mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
            gsap.to(hoverRef, { current: 1, duration: 0.5 });
            if (Math.abs(e.movementX) > 20 || Math.abs(e.movementY) > 20) {
                 gsap.to(material.uniforms.uGlitch, { value: 0.2, duration: 0.1, yoyo: true, repeat: 1 });
            }
        };
        
        const onTouchMove = (e: TouchEvent) => {
            const t = e.touches[0];
            mouseRef.current.x = (t.clientX / window.innerWidth) * 2 - 1;
            mouseRef.current.y = -(t.clientY / window.innerHeight) * 2 + 1;
            gsap.to(hoverRef, { current: 1, duration: 0.5 });
        }
        
        const onTouchEnd = () => {
             gsap.to(hoverRef, { current: 0, duration: 1.0 });
        }

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('touchmove', onTouchMove);
        window.addEventListener('touchend', onTouchEnd);

        const clock = new THREE.Clock();
        let frameId = 0;

        const animate = () => {
            const t = clock.getElapsedTime();
            material.uniforms.uTime.value = t;
            material.uniforms.uMouse.value.lerp(mouseRef.current, 0.05);
            material.uniforms.uHover.value = THREE.MathUtils.lerp(material.uniforms.uHover.value, hoverRef.current, 0.05);
            plane.position.y = Math.sin(t * 0.5) * 0.15;
            renderer.render(scene, camera);
            frameId = requestAnimationFrame(animate);
            hoverRef.current *= 0.96;
        };

        document.fonts.ready.then(() => {
             const newTex = createTitleTexture();
             if(newTex) material.uniforms.uTexture.value = newTex;
             animate();
             startIntro();
        });

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onTouchEnd);
            cancelAnimationFrame(frameId);
            renderer.dispose();
            mountRef.current?.removeChild(renderer.domElement);
            texture?.dispose();
        };

    }, []);

    return <div ref={mountRef} className="w-full h-full" />;
};

const Hero: React.FC<HeroProps> = ({ appState, onTorchLight }) => {
  const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number, s: number } | null>(null);
  const [showLockScreen, setShowLockScreen] = useState(false); 
  const [isDesktop, setIsDesktop] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  
  // Cinematic State
  const [isIgniting, setIsIgniting] = useState(false);
  const [cinematicText, setCinematicText] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const shockwaveRef = useRef<HTMLDivElement>(null);
  const countdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkLayout = () => {
        setIsDesktop(window.innerWidth >= 1024);
    };
    checkLayout();
    window.addEventListener('resize', checkLayout);
    return () => window.removeEventListener('resize', checkLayout);
  }, []);

  const calculateTimeLeft = useCallback(() => {
    // If torch is lit (including auto-lit from countdown), stop showing the timer
    if (appState.isTorchLit || isIgniting) {
        return null;
    }
    const now = new Date().getTime();
    const end = new Date(appState.countdownEnd).getTime();
    const difference = end - now;

    if (difference > 0) {
      return {
        d: Math.floor(difference / (1000 * 60 * 60 * 24)),
        h: Math.floor((difference / (1000 * 60 * 60)) % 24),
        m: Math.floor((difference / 1000 / 60) % 60),
        s: Math.floor((difference / 1000) % 60),
      };
    }
    return null;
  }, [appState.countdownEnd, appState.isTorchLit, isIgniting]);


  // --- CINEMATIC IGNITION SEQUENCE ---
  const playIgnitionSequence = useCallback(() => {
    if (isIgniting || appState.isTorchLit) return;
    setIsIgniting(true);
    setShowLockScreen(false);

    const tl = gsap.timeline({
        onComplete: () => {
            // Sequence Finished
            setIsIgniting(false);
        }
    });

    if (!shockwaveRef.current) return;

    // 1. THE BUILDUP (0.0s - 2.0s)
    // Shake countdown
    if (countdownRef.current) {
        tl.to(countdownRef.current, {
            scale: 1.1,
            rotation: () => (Math.random() - 0.5) * 5,
            opacity: 0.5,
            duration: 0.5,
            repeat: 3,
            yoyo: true,
            ease: "rough({ strength: 2, points: 20, template: none, taper: none, randomize: true, clamp: false })"
        });
        
        // Implode Countdown
        tl.to(countdownRef.current, {
            scale: 0.1,
            opacity: 0,
            duration: 0.4,
            ease: "back.in(2)"
        }, ">");
    }

    // 2. DARK CHARGE (Simultaneous with implode)
    tl.add(() => setCinematicText("ENERGY SPIKE DETECTED"), "<");
    tl.to(shockwaveRef.current, {
        opacity: 1,
        backgroundColor: 'rgba(0,0,0,0.9)', // Dim the world
        // PERFORMANCE: Removed backdropFilter
        scale: 1.0,
        duration: 2.0,
        ease: "power2.inOut"
    }, 0);

    // Cinematic Text Flicker
    tl.to(".cinematic-text", {
        opacity: 1,
        duration: 0.1,
        repeat: 5,
        yoyo: true
    }, "<0.5");

    // 3. THE SINGULARITY (Hold breath)
    tl.add(() => setCinematicText("IGNITION IMMINENT"), ">-0.5");
    tl.to(shockwaveRef.current, {
        backgroundColor: '#000000',
        duration: 0.5,
        ease: "expo.in"
    }, ">");

    // 4. THE WHITEOUT FLASH (The trigger)
    tl.to(shockwaveRef.current, {
        backgroundColor: '#ffffff',
        // PERFORMANCE: Removed backdropFilter
        duration: 0.1,
        ease: "power4.in",
        onComplete: () => {
            // !!! THIS IS THE MOMENT THE TORCH LIGHTS !!!
            onTorchLight();
            
            // Fire Confetti at the peak of the flash
            confetti({
                particleCount: 150, // Reduced from 200
                spread: 100, // Reduced from 120
                origin: { y: 0.5 },
                colors: ['#ffffff', '#ff00de', '#00ffff'],
                zIndex: 200
            });
        }
    });

    // 5. REVEAL (Fade out flash to show lit torch)
    tl.to(shockwaveRef.current, {
        opacity: 0,
        duration: 2.0,
        ease: "power2.out",
        delay: 0.1
    });

  }, [appState.isTorchLit, isIgniting, onTorchLight]);


  // Timer Logic
  useEffect(() => {
    // Initial entrance
    if (containerRef.current && !appState.isTorchLit && !isIgniting) {
        const titleParts = containerRef.current.querySelectorAll('.anim-entry');
        gsap.fromTo(titleParts, 
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: "power3.out", delay: 1.5 }
        );
    }
    
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const tl = calculateTimeLeft();
      setTimeLeft(tl);
      
      // Check if time is up and we haven't started ignition yet
      if (!appState.isTorchLit && !isIgniting) {
         const now = new Date().getTime();
         const end = new Date(appState.countdownEnd).getTime();
         // Only trigger ignition if countdown has reached zero
         if (now >= end && tl === null) {
             playIgnitionSequence();
         }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [appState.countdownEnd, appState.isTorchLit, calculateTimeLeft, playIgnitionSequence, isIgniting]);


  // Legendary Countdown Component
  const renderLegendaryCountdown = () => {
    // Hide countdown if torch is lit OR if we are in the cinematic ignition phase
    if (!appState.isTorchLit && timeLeft && !isIgniting) {
        return (
            <div ref={countdownRef} className="relative z-50 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-700">
                {/* Header Badge */}
                <div className="mb-4 md:mb-6 flex items-center gap-3 bg-black/80 backdrop-blur-md border border-red-500/50 px-5 py-2 rounded-full shadow-[0_0_30px_rgba(239,68,68,0.4)] transform hover:scale-105 transition-transform">
                     <Lock size={12} className="text-red-500 animate-pulse" />
                     <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-[ping_1s_infinite]" />
                     <span className="text-red-400 font-mono text-[10px] md:text-xs tracking-[0.3em] font-bold uppercase whitespace-nowrap">Ignition Sequence</span>
                </div>

                {/* The Legendary Timer Grid */}
                <div className="grid grid-cols-7 items-center gap-1 md:gap-4 p-4 md:p-8 bg-[#0a0a12]/95 backdrop-blur-xl border border-purple-500/40 rounded-xl md:rounded-2xl shadow-[0_0_60px_rgba(124,58,237,0.25)] relative overflow-hidden group mx-4">
                    {/* Corner Accents */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cyan-400 rounded-tl-lg shadow-[0_0_10px_#00ffff]"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyan-400 rounded-tr-lg shadow-[0_0_10px_#00ffff]"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-pink-500 rounded-bl-lg shadow-[0_0_10px_#ff00de]"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-pink-500 rounded-br-lg shadow-[0_0_10px_#ff00de]"></div>
                    
                    {/* Scanline overlay */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.4)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none opacity-40 z-0"></div>

                    <CounterItem value={timeLeft.d} label="DAYS" />
                    <Separator />
                    <CounterItem value={timeLeft.h} label="HRS" />
                    <Separator />
                    <CounterItem value={timeLeft.m} label="MIN" />
                    <Separator />
                    <CounterItem value={timeLeft.s} label="SEC" isLast={true} />
                </div>
            </div>
        );
    }
    return null;
  };

  const CounterItem = ({ value, label, isLast = false }: { value: number, label: string, isLast?: boolean }) => (
    <div className="flex flex-col items-center relative z-10 w-12 md:w-20">
        <div className="relative group/digit">
            <span className={`text-3xl md:text-6xl lg:text-7xl font-pixel font-bold tracking-tighter transition-all duration-300 ${isLast ? 'text-transparent bg-clip-text bg-gradient-to-b from-white to-pink-500 drop-shadow-[0_0_15px_rgba(255,0,222,0.6)]' : 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]'}`}>
                {String(value).padStart(2, '0')}
            </span>
            <span className="absolute top-0 left-0 text-3xl md:text-6xl lg:text-7xl font-pixel font-bold tracking-tighter text-cyan-500 opacity-0 group-hover/digit:opacity-30 translate-x-[2px] transition-opacity">
                 {String(value).padStart(2, '0')}
            </span>
        </div>
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent my-1 md:my-2"></div>
        <span className={`text-[8px] md:text-[10px] font-mono tracking-[0.2em] font-bold uppercase ${isLast ? 'text-pink-400' : 'text-gray-500'}`}>{label}</span>
    </div>
  );

  const Separator = () => (
    <div className="text-xl md:text-4xl text-gray-700 font-pixel pb-4 md:pb-6 animate-pulse select-none z-10">:</div>
  );

  return (
    <div className="relative w-full min-h-screen bg-[#05050a] overflow-x-hidden flex flex-col justify-center items-center">
      
      {/* SHOCKWAVE / CINEMATIC OVERLAY */}
      {/* This layer handles the dark buildup and the bright whiteout */}
      <div 
        ref={shockwaveRef} 
        className="fixed inset-0 z-[100] pointer-events-none opacity-0 flex items-center justify-center"
      >
            {/* Removed isIgniting conditional check to ensure GSAP can find the target element at all times */}
            <div className="cinematic-text text-white font-black font-cyber text-4xl md:text-7xl tracking-tighter text-center px-4 animate-pulse opacity-0 drop-shadow-[0_0_20px_rgba(255,0,0,0.8)]">
                <AlertTriangle size={48} className="mx-auto mb-4 text-red-500" />
                {cinematicText}
            </div>
      </div>

      {/* --- CONTENT SECTION --- */}
      <div ref={containerRef} className="relative z-20 w-full flex flex-col items-center justify-center px-6 md:px-12 py-12 lg:py-8 bg-[#05050a]">
        
        <div className="flex flex-col items-center relative z-10 w-full max-w-5xl">
            
            {/* Status */}
            <div className="flex items-center gap-3 mb-2 anim-entry relative z-30">
               <span className={`font-mono text-[10px] md:text-xs tracking-[0.2em] uppercase px-3 py-1 rounded border shadow-[0_0_10px_rgba(124,58,237,0.1)] transition-colors duration-500 ${isIgniting ? 'text-red-500 border-red-500/50 bg-red-900/10' : 'text-neon-cyan border-purple-500/20 bg-purple-900/10'}`}>
                   System Status: {isIgniting ? "CRITICAL OVERLOAD" : (appState.isTorchLit ? "ONLINE" : "INITIALIZING...")}
               </span>
            </div>

            {/* --- REPLACED HTML TITLE WITH LEGENDARY 3D TITLE --- */}
            <div className="relative w-full h-[250px] md:h-[450px] lg:h-[550px] flex items-center justify-center z-30 -mt-8 md:-mt-12 pointer-events-auto">
                 <LegendaryTitle />
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[50%] bg-purple-500/30 blur-[100px] -z-10 rounded-full animate-pulse"></div>
            </div>

            {/* --- TORCH & LEGENDARY COUNTDOWN AREA --- */}
            <div className="w-full flex justify-center items-center relative h-[450px] md:h-[650px] -mt-20 md:-mt-32 mb-8 anim-entry">
                
                {/* Torch Left (Heads Top-Left \) */}
                <div className="absolute w-[350px] h-[600px] md:w-[600px] md:h-[850px] left-1/2 -translate-x-[60%] md:-translate-x-[55%] -top-24 md:-top-32 z-0 pointer-events-auto transition-opacity duration-1000">
                    <VoxelTorch isLit={appState.isTorchLit} isMobile={!isDesktop} tilt={0.75} />
                </div>
                {/* Torch Right (Heads Top-Right /) */}
                <div className="absolute w-[350px] h-[600px] md:w-[600px] md:h-[850px] left-1/2 -translate-x-[40%] md:-translate-x-[45%] -top-24 md:-top-32 z-0 pointer-events-auto transition-opacity duration-1000">
                    <VoxelTorch isLit={appState.isTorchLit} isMobile={!isDesktop} tilt={-0.75} />
                </div>
                
                {/* LEGENDARY COUNTDOWN OVERLAY (Centered) */}
                {/* Only show if not lit and NOT igniting (ignition handles its own UI) */}
                {!appState.isTorchLit && !isIgniting && (
                    <div className="absolute inset-0 flex items-center justify-center z-40 mt-16 md:mt-24 pointer-events-none">
                        {renderLegendaryCountdown()}
                    </div>
                )}
            </div>

            {/* Description */}
            <div className="anim-entry mb-12 text-center relative z-20">
                <p className="text-gray-400 font-ui text-xs md:text-sm leading-relaxed tracking-widest uppercase max-w-md mx-auto">
                    The ultimate convergence of code,
                    creativity, and competition. The arena
                    awaits your command.
                </p>
            </div>

        </div>
      </div>

      {/* --- LOCK SCREEN OVERLAY (Backdrop only) --- */}
      {!appState.isTorchLit && showLockScreen && !isIgniting && (
         <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex items-center justify-center">
             <button onClick={() => setShowLockScreen(false)} className="absolute top-8 right-8 text-white"><X /></button>
             {renderLegendaryCountdown()}
         </div>
      )}

    </div>
  );
};

export default Hero;
