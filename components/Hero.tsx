
import React, { useState, useEffect, useCallback, useRef } from 'react';
import VoxelTorch from './VoxelTorch';
import { AppState } from '../types';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import * as THREE from 'three';
import { X, Lock } from 'lucide-react';

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
    // Multiplied by uHover so it's static when not interacted with (saves battery visually)
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
  
  // Fast pseudo-random
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
    
    // 1. MATERIALIZATION (Dissolve)
    // Noise pattern for organic burn-in reveal
    float n = noise(uv * 20.0 + uTime); 
    if (n < uDissolve) discard;

    // 2. GLITCH DISPLACEMENT
    // Blocks of pixels shifting horizontally
    vec2 block = floor(uv * vec2(20.0, 40.0) + uTime * 5.0);
    float blockNoise = rand(block);
    float displace = 0.0;
    
    // Only glitch if uGlitch > 0 or random sporadic glitch
    float sporadic = step(0.99, rand(vec2(uTime * 2.0, 0.0))) * 0.1;
    float intensity = uGlitch + sporadic;
    
    if (blockNoise < intensity * 0.4) {
        displace = (rand(vec2(uTime)) - 0.5) * 0.1 * intensity;
    }
    vec2 distUv = uv + vec2(displace, 0.0);

    // 3. CHROMATIC ABERRATION (RGB Split)
    // Separation increases with glitch intensity
    float shift = uRGBShift + (intensity * 0.02);
    
    vec4 cr = texture2D(uTexture, distUv + vec2(shift, 0.0));
    vec4 cg = texture2D(uTexture, distUv);
    vec4 cb = texture2D(uTexture, distUv - vec2(shift, 0.0));
    
    // 4. HOLO-INTERFERENCE
    // Scanlines
    float scan = sin(uv.y * 800.0) * 0.04;
    // Moving light band (Sheen)
    float sheen = smoothstep(0.0, 0.15, 0.1 - abs(uv.x + uv.y * 0.2 - (sin(uTime * 0.5) * 2.0 + 0.5)));
    
    // Combine channels
    vec3 color = vec3(cr.r, cg.g, cb.b);
    
    // Apply Effects
    color += vec3(1.0) * sheen * 0.5; // Add shine
    color -= scan; // Subtract scanlines
    
    // 5. BURN EDGE (During Dissolve)
    // Bright cyan edge where the noise meets the dissolve threshold
    if (n < uDissolve + 0.05 && uDissolve > 0.0) {
        color = vec3(0.2, 1.0, 1.0);
        color *= 2.0; // HDR bloom effect
    }

    // Alpha mask from texture green channel (assuming white text)
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

        // 1. Scene & Camera
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        // Fixed Z position, we will scale the plane to fit
        camera.position.z = 10; 

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
        renderer.setSize(width, height);
        // Optimize for mobile (1.5x is a good balance of sharp vs perf)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
        mountRef.current.appendChild(renderer.domElement);

        // 2. High-Res Texture Generation
        const createTitleTexture = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 2048;
            canvas.height = 1024;
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;

            ctx.clearRect(0,0, 2048, 1024);
            const cx = 1024;
            const cy = 512;

            // --- IT-VERSE ---
            // Gradient: Metallic/Holographic
            const g1 = ctx.createLinearGradient(0, 200, 0, 800);
            g1.addColorStop(0, '#ffffff');
            g1.addColorStop(0.4, '#a5b4fc');
            g1.addColorStop(0.5, '#4f46e5');
            g1.addColorStop(1, '#ffffff');
            
            ctx.fillStyle = g1;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = '900 600px "Jersey 10"'; 
            
            // Text Shadow (Glow)
            ctx.shadowColor = 'rgba(124, 58, 237, 0.6)'; 
            ctx.shadowBlur = 40;
            ctx.fillText("IT-VERSE", cx, cy - 80);
            
            // Stroke for crispness
            ctx.shadowBlur = 0;
            ctx.lineWidth = 4;
            ctx.strokeStyle = 'white';
            ctx.strokeText("IT-VERSE", cx, cy - 80);

            // --- 2025 ---
            // TIGHT LOCKUP: Placed immediately below
            const g2 = ctx.createLinearGradient(0, 800, 2048, 800);
            g2.addColorStop(0.4, '#c084fc'); 
            g2.addColorStop(0.6, '#f472b6'); 
            
            ctx.fillStyle = g2;
            ctx.font = '900 240px "Jersey 10"'; 
            ctx.shadowColor = 'rgba(236, 72, 153, 0.8)';
            ctx.shadowBlur = 30;
            
            // Approx spacing logic:
            // IT-VERSE center y = 432. Font 600. Bottom ~ 732.
            // 2025 Top should be around 750.
            ctx.fillText("2025", cx, cy + 280); 

            // CRT Scanlines baked into texture
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            for(let i=0; i<1024; i+=8) {
                ctx.fillRect(0, i, 2048, 3);
            }

            const tex = new THREE.CanvasTexture(canvas);
            tex.needsUpdate = true;
            return tex;
        };

        const texture = createTitleTexture();

        // 3. Geometry & Shader
        // Aspect ratio of the visible text on texture (approx 2048 / 900)
        // We use a 16:8 plane to contain it comfortably
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

        // 4. ANIMATION SEQUENCE ("Glitch into Reality")
        const startIntro = () => {
            const tl = gsap.timeline({ delay: 0.5 });
            
            // Step 1: Materialize (Dissolve 1 -> 0)
            tl.to(material.uniforms.uDissolve, {
                value: 0.0,
                duration: 1.5,
                ease: "power2.inOut"
            });

            // Step 2: Snap Color (RGB Shift reduces)
            tl.to(material.uniforms.uRGBShift, {
                value: 0.002, // Tiny residual shift for style
                duration: 1.0,
                ease: "expo.out"
            }, "-=0.5");

            // Step 3: Stabilize Geometry (Glitch 1 -> 0)
            tl.to(material.uniforms.uGlitch, {
                value: 0.0,
                duration: 0.8,
                ease: "elastic.out(1, 0.5)"
            }, "-=0.8");
        };

        // 5. RESPONSIVE LOGIC
        const handleResize = () => {
            if (!mountRef.current) return;
            const w = mountRef.current.clientWidth;
            const h = mountRef.current.clientHeight;
            
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);

            // Responsive Scaling Math:
            // We want the plane (width 16 units) to fit within the camera frustum width
            // with some margin.
            // Frustum Width at Z=0 (given Cam Z=10, FOV=45)
            // Height = 2 * tan(45/2) * 10 = 2 * 0.4142 * 10 = 8.28
            // Width = Height * aspect
            const visibleHeight = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
            const visibleWidth = visibleHeight * camera.aspect;

            // Target width coverage:
            // Mobile: 95% of screen width (Maximize size)
            // Desktop: 80% of screen width (Cleaner look)
            const targetPercentage = w < 768 ? 0.95 : 0.80;
            
            // Calculate scale factor
            // Plane width is 16. We want 16 * scale = visibleWidth * targetPercentage
            let scale = (visibleWidth * targetPercentage) / 16;
            
            // Clamp max scale to avoid it looking comically large on ultra-wide
            scale = Math.min(scale, 1.2); 
            
            plane.scale.setScalar(scale);
        };
        
        // Initial resize
        handleResize();

        // 6. Interaction
        const onMouseMove = (e: MouseEvent) => {
            mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
            gsap.to(hoverRef, { current: 1, duration: 0.5 });
            
            // Poke effect: Rapid mouse movement triggers slight glitch
            if (Math.abs(e.movementX) > 20 || Math.abs(e.movementY) > 20) {
                 gsap.to(material.uniforms.uGlitch, { value: 0.2, duration: 0.1, yoyo: true, repeat: 1 });
            }
        };
        
        const onTouchMove = (e: TouchEvent) => {
            const t = e.touches[0];
            mouseRef.current.x = (t.clientX / window.innerWidth) * 2 - 1;
            mouseRef.current.y = -(t.clientY / window.innerHeight) * 2 + 1;
            // Touch always counts as hover
            gsap.to(hoverRef, { current: 1, duration: 0.5 });
        }
        
        const onTouchEnd = () => {
             gsap.to(hoverRef, { current: 0, duration: 1.0 });
        }

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('touchmove', onTouchMove);
        window.addEventListener('touchend', onTouchEnd);

        // 7. Render Loop
        const clock = new THREE.Clock();
        let frameId = 0;

        const animate = () => {
            const t = clock.getElapsedTime();
            
            material.uniforms.uTime.value = t;
            
            // Smoothly interpolate mouse/hover interaction
            material.uniforms.uMouse.value.lerp(mouseRef.current, 0.05);
            material.uniforms.uHover.value = THREE.MathUtils.lerp(material.uniforms.uHover.value, hoverRef.current, 0.05);

            // Float Animation (Subtle breathing)
            plane.position.y = Math.sin(t * 0.5) * 0.15;

            renderer.render(scene, camera);
            frameId = requestAnimationFrame(animate);
            
            // Decay hover if no input
            hoverRef.current *= 0.96;
        };

        // Wait for font before starting
        document.fonts.ready.then(() => {
            // Re-render texture to ensure font is loaded
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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkLayout = () => {
        setIsDesktop(window.innerWidth >= 1024);
    };
    checkLayout();
    window.addEventListener('resize', checkLayout);
    return () => window.removeEventListener('resize', checkLayout);
  }, []);

  const calculateTimeLeft = useCallback(() => {
    if (appState.isTorchLit) {
        setShowLockScreen(false);
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
    setShowLockScreen(false);
    return null;
  }, [appState.countdownEnd, appState.isTorchLit]);

  useEffect(() => {
    // Entrance Animation for non-3D parts
    if (containerRef.current) {
        const titleParts = containerRef.current.querySelectorAll('.anim-entry');
        gsap.fromTo(titleParts, 
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: "power3.out", delay: 1.5 } // Delayed to sync with 3D title intro
        );
    }
    
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const tl = calculateTimeLeft();
      setTimeLeft(tl);
      
      if (!tl && !appState.isTorchLit) {
        const diff = new Date(appState.countdownEnd).getTime() - new Date().getTime();
        if (diff <= 0) {
            onTorchLight();
            confetti({
              particleCount: 150,
              spread: 80,
              origin: { y: 0.6 },
              colors: ['#7c3aed', '#ff00de', '#00ffff']
            });
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [appState.countdownEnd, appState.isTorchLit, calculateTimeLeft, onTorchLight]);

  // Legendary Countdown Component
  const renderLegendaryCountdown = () => {
    if (!appState.isTorchLit && timeLeft) {
        return (
            <div className="relative z-50 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-700">
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
      
      {/* --- CONTENT SECTION --- */}
      <div ref={containerRef} className="relative z-20 w-full flex flex-col items-center justify-center px-6 md:px-12 py-12 lg:py-8 bg-[#05050a]">
        
        <div className="flex flex-col items-center relative z-10 w-full max-w-5xl">
            
            {/* Status */}
            <div className="flex items-center gap-3 mb-2 anim-entry relative z-30">
               <span className="font-mono text-[10px] md:text-xs text-neon-cyan tracking-[0.2em] uppercase bg-purple-900/10 px-3 py-1 rounded border border-purple-500/20 shadow-[0_0_10px_rgba(124,58,237,0.1)]">
                   System Status: {appState.isTorchLit ? "ONLINE" : "INITIALIZING..."}
               </span>
            </div>

            {/* --- REPLACED HTML TITLE WITH LEGENDARY 3D TITLE --- */}
            {/* Increased container height to fit massive text comfortably on all screens */}
            <div className="relative w-full h-[250px] md:h-[450px] lg:h-[550px] flex items-center justify-center z-30 -mt-8 md:-mt-12 pointer-events-auto">
                 {/* This component renders the 3D Text Plane */}
                 <LegendaryTitle />
                 
                 {/* Optional: Glow behind title */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[50%] bg-purple-900/30 blur-[100px] -z-10 rounded-full animate-pulse"></div>
            </div>

            {/* --- TORCH & LEGENDARY COUNTDOWN AREA --- */}
            
            <div className="w-full flex justify-center items-center relative h-[450px] md:h-[650px] -mt-20 md:-mt-32 mb-8 anim-entry">
                
                {/* Torch Left (Heads Top-Left \) */}
                <div className="absolute w-[350px] h-[600px] md:w-[600px] md:h-[850px] left-1/2 -translate-x-[60%] md:-translate-x-[55%] -top-10 md:-top-20 z-0 pointer-events-auto transition-opacity duration-1000" style={{ opacity: appState.isTorchLit ? 1 : 0.4 }}>
                    <VoxelTorch isLit={appState.isTorchLit} isMobile={!isDesktop} tilt={0.75} />
                </div>
                {/* Torch Right (Heads Top-Right /) */}
                <div className="absolute w-[350px] h-[600px] md:w-[600px] md:h-[850px] left-1/2 -translate-x-[40%] md:-translate-x-[45%] -top-10 md:-top-20 z-0 pointer-events-auto transition-opacity duration-1000" style={{ opacity: appState.isTorchLit ? 1 : 0.4 }}>
                    <VoxelTorch isLit={appState.isTorchLit} isMobile={!isDesktop} tilt={-0.75} />
                </div>
                
                {/* LEGENDARY COUNTDOWN OVERLAY (Centered) */}
                {!appState.isTorchLit && (
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
      {!appState.isTorchLit && showLockScreen && (
         <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex items-center justify-center">
             <button onClick={() => setShowLockScreen(false)} className="absolute top-8 right-8 text-white"><X /></button>
             {renderLegendaryCountdown()}
         </div>
      )}

    </div>
  );
};

export default Hero;
