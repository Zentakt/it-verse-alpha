
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { Lock, Fingerprint, ShieldAlert, ChevronRight, Activity, Zap, Disc, Cpu, Orbit } from 'lucide-react';

interface PortalProps {
  onComplete: () => void;
}

// --- SHADER LIBRARY ---

// 1. LEGENDARY BLACK HOLE (Event Horizon)
const DISK_VERTEX = `
  varying vec2 vUv;
  varying vec3 vPos;
  void main() {
    vUv = uv;
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const DISK_FRAGMENT = `
  uniform float uTime;
  uniform float uProgress; 
  uniform float uOpen;
  uniform vec3 uColorCore;
  uniform vec3 uColorEdge;
  
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }

  void main() {
    vec2 uv = vUv - 0.5;
    float dist = length(uv) * 2.0; 
    float angle = atan(uv.y, uv.x);
    
    // Suction distortion
    float warp = 1.0 - pow(dist, 0.5 + uProgress);
    float swirlAngle = angle + warp * (10.0 + uProgress * 20.0) + uTime * (1.0 + uProgress * 5.0);
    
    // Accretion Disk Texture
    float n = noise(vec2(dist * 8.0 - uTime * 4.0, swirlAngle * 2.0));
    n += noise(vec2(dist * 16.0 + uTime * 2.0, swirlAngle * 4.0)) * 0.5;
    
    // Singularity Hole
    float hole = smoothstep(0.1 + uOpen * 1.5, 0.25 + uOpen * 1.5, dist);
    
    // Color Grading
    vec3 col = mix(uColorCore, uColorEdge, dist);
    col += vec3(1.0, 0.8, 0.5) * pow(n, 3.0) * (0.5 + uProgress); // Hot spots
    
    // Shockwave Ring
    float shock = smoothstep(0.0, 0.1, abs(dist - (0.4 + uOpen)));
    col += vec3(1.0) * (1.0 - shock) * uOpen * 2.0;

    float alpha = smoothstep(1.0, 0.2, dist) * hole;
    gl_FragColor = vec4(col, alpha);
  }
`;

// 2. WORMHOLE TUNNEL (Appears on unlock)
const TUNNEL_FRAGMENT = `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uSpeed;
  uniform vec3 uColor;

  void main() {
    vec2 uv = vUv;
    
    // Tunnel movement
    float fog = smoothstep(0.0, 0.3, uv.y) * smoothstep(1.0, 0.7, uv.y);
    
    // Electric strands
    float noise = sin(uv.x * 20.0 + sin(uv.y * 10.0 + uTime * 5.0));
    float strand = step(0.95, noise);
    
    vec3 col = uColor * strand * 2.0;
    col += uColor * 0.1; // Ambient

    gl_FragColor = vec4(col, fog * min(1.0, uSpeed));
  }
`;

const PortalTransition: React.FC<PortalProps> = ({ onComplete }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  
  // UI State
  const [uiState, setUiState] = useState<'locked' | 'scanning' | 'denied' | 'unlocking'>('locked');
  const [scanPercent, setScanPercent] = useState(0); 
  const [flash, setFlash] = useState(false);

  // Logic Refs
  const progressRef = useRef(0);
  const isHoldingRef = useRef(false);
  const lockRotationRef = useRef(0);
  
  // Three.js Refs
  const sceneRefs = useRef<any>(null);
  const frameIdRef = useRef<number>(0);

  // --- INTERACTION ---

  const startScan = useCallback(() => {
    if (uiState === 'locked') {
        setUiState('scanning');
        isHoldingRef.current = true;
    }
  }, [uiState]);

  const stopScan = useCallback(() => {
    if (uiState === 'scanning') {
        isHoldingRef.current = false;
        if (progressRef.current < 0.99) {
            setUiState('denied');
            if(sceneRefs.current?.camera) {
                // Denied Shake
                gsap.to(sceneRefs.current.camera.position, { 
                    x: 0.5, duration: 0.05, yoyo: true, repeat: 5, 
                    onComplete: () => gsap.to(sceneRefs.current.camera.position, { x: 0, duration: 0.2 })
                });
            }
            setTimeout(() => setUiState('locked'), 800);
        }
    }
  }, [uiState]);

  const unlock = useCallback(() => {
    setUiState('unlocking');
    isHoldingRef.current = false;
    
    const { camera, uniforms, stars, tunnelMat } = sceneRefs.current;

    // --- LEGENDARY UNLOCK SEQUENCE ---
    const tl = gsap.timeline({
        onComplete: onComplete
    });

    // 1. ANITICPATION (Suck in)
    tl.to(uniforms.uOpen, { value: -0.1, duration: 0.3, ease: "power2.out" }); // Close slightly
    tl.to(camera, { fov: 50, duration: 0.3, ease: "power2.out" }, "<"); // Zoom in
    
    // 2. THE BIG BANG
    tl.to(uniforms.uOpen, { value: 2.0, duration: 1.5, ease: "expo.in" });
    tl.to(camera, { fov: 120, duration: 1.5, ease: "expo.in" }, "<"); // HYPERSPACE FOV
    
    // 3. WARP SPEED STARS
    // We animate a custom property that the render loop uses to stretch stars
    tl.to(stars.userData, { warpFactor: 20, duration: 1.0, ease: "expo.in" }, "<");
    
    // 4. TUNNEL APPEARS
    tl.to(tunnelMat.uniforms.uSpeed, { value: 5.0, duration: 1.0, ease: "expo.in" }, "<");
    
    // 5. CAMERA FLYTHROUGH
    tl.to(camera.position, { z: -50, duration: 1.0, ease: "expo.in" }, "<0.2");

    // 6. FLASH (Whiteout)
    tl.call(() => setFlash(true), [], "-=0.5");
    
    // Note: Removed internal fade out (opacity -> 0) to allow parent component to handle smooth handoff

  }, [onComplete]);

  // Keyboard
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
        if ((e.code === 'Space' || e.code === 'Enter') && !e.repeat) startScan();
    };
    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.code === 'Space' || e.code === 'Enter') stopScan();
    };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKey);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, [startScan, stopScan]);

  // --- 3D SCENE SETUP ---
  useEffect(() => {
    if (!mountRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobile = width < 768;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.02);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ 
        antialias: false, 
        alpha: true, 
        powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // --- ASSETS ---
    const lockGroup = new THREE.Group();
    scene.add(lockGroup);

    const uniforms = {
        uTime: { value: 0 },
        uProgress: { value: 0 },
        uOpen: { value: 0 },
        uColorCore: { value: new THREE.Color(0x00ffff) },
        uColorEdge: { value: new THREE.Color(0x7c3aed) }
    };

    // 1. BLACK HOLE CORE
    const diskGeo = new THREE.PlaneGeometry(12, 12);
    const diskMat = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: DISK_VERTEX,
        fragmentShader: DISK_FRAGMENT,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const core = new THREE.Mesh(diskGeo, diskMat);
    lockGroup.add(core);

    // 2. MECHANICAL IRIS (Instanced)
    const irisGroup = new THREE.Group();
    lockGroup.add(irisGroup);
    
    const bladeCount = 12;
    const bladeGeo = new THREE.BoxGeometry(1.2, 5, 0.2);
    bladeGeo.translate(0, 3, 0); // Pivot offset
    const bladeMat = new THREE.MeshStandardMaterial({
        color: 0x111111, roughness: 0.2, metalness: 0.9,
        emissive: 0x00ffff, emissiveIntensity: 0
    });
    const blades = new THREE.InstancedMesh(bladeGeo, bladeMat, bladeCount);
    
    // Init Blades
    const dummy = new THREE.Object3D();
    for(let i=0; i<bladeCount; i++) {
        const a = (i/bladeCount) * Math.PI * 2;
        dummy.rotation.z = a;
        dummy.updateMatrix();
        blades.setMatrixAt(i, dummy.matrix);
    }
    irisGroup.add(blades);

    // 3. SUCTION STARFIELD (Instanced for Streaks)
    // We use long boxes instead of points so we can scale them into warp streaks
    const sCount = isMobile ? 800 : 2000;
    const starGeo = new THREE.BoxGeometry(0.05, 0.05, 1.0); // Z-length 1.0 base
    const starMat = new THREE.MeshBasicMaterial({ color: 0x88ffff, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending });
    const stars = new THREE.InstancedMesh(starGeo, starMat, sCount);
    stars.userData = { warpFactor: 0 }; // Custom prop for GSAP
    
    const starData: {x:number, y:number, z:number, speed:number}[] = [];
    for(let i=0; i<sCount; i++) {
        // Spiral distribution
        const r = 4 + Math.random() * 20;
        const theta = Math.random() * Math.PI * 2;
        const z = (Math.random() - 0.5) * 40;
        starData.push({ 
            x: Math.cos(theta)*r, 
            y: Math.sin(theta)*r, 
            z, 
            speed: 0.5 + Math.random() 
        });
        dummy.position.set(starData[i].x, starData[i].y, starData[i].z);
        dummy.lookAt(0,0,0); // Point inward initially
        dummy.updateMatrix();
        stars.setMatrixAt(i, dummy.matrix);
    }
    scene.add(stars);

    // 4. WORMHOLE TUNNEL (Hidden initially)
    const tunnelGeo = new THREE.CylinderGeometry(8, 2, 80, 32, 1, true);
    tunnelGeo.rotateX(-Math.PI/2);
    const tunnelMat = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uSpeed: { value: 0 },
            uColor: { value: new THREE.Color(0x00ffff) }
        },
        vertexShader: `varying vec2 vUv; void main() { vUv=uv; gl_Position=projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: TUNNEL_FRAGMENT,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false
    });
    const tunnel = new THREE.Mesh(tunnelGeo, tunnelMat);
    tunnel.position.z = -30;
    scene.add(tunnel);

    // Lights
    const pLight = new THREE.PointLight(0x00ffff, 0, 20);
    scene.add(pLight);

    // Refs
    sceneRefs.current = { camera, uniforms, irisGroup, blades, stars, tunnelMat, pLight, bladeMat };

    // --- ANIMATION LOOP ---
    const clock = new THREE.Clock();

    const animate = () => {
        frameIdRef.current = requestAnimationFrame(animate);
        const time = clock.getElapsedTime();
        const delta = 0.016;

        // Sync Uniforms
        uniforms.uTime.value = time;
        uniforms.uProgress.value = progressRef.current;
        tunnelMat.uniforms.uTime.value = time;

        // --- STATE LOGIC ---
        if (uiState === 'scanning') {
            // RAMP UP
            progressRef.current = Math.min(1, progressRef.current + delta * 0.4);
            lockRotationRef.current -= delta * (2.0 + progressRef.current * 10.0);
            
            // Camera Shake increases
            const shake = progressRef.current * 0.15;
            camera.position.x = (Math.random() - 0.5) * shake;
            camera.position.y = (Math.random() - 0.5) * shake;

            if (progressRef.current >= 1 && uiState !== 'unlocking') unlock();
        } else if (uiState === 'locked') {
            // DECAY
            progressRef.current = Math.max(0, progressRef.current - delta * 2.0);
            lockRotationRef.current -= delta * 0.5;
            // Reset Camera
            camera.position.lerp(new THREE.Vector3(0,0,8), 0.1);
        } else if (uiState === 'unlocking') {
            // --- CRITICAL FIX: Keep spinning fast during unlock ---
            lockRotationRef.current -= delta * 30.0;
        }

        setScanPercent(Math.floor(progressRef.current * 100));

        // --- VISUAL UPDATES ---

        // 1. Iris
        const radius = 2.5 + progressRef.current;
        for(let i=0; i<bladeCount; i++) {
             const angle = (i/bladeCount)*Math.PI*2 + lockRotationRef.current;
             dummy.rotation.set(0,0,angle);
             dummy.position.set(Math.cos(angle)*radius, Math.sin(angle)*radius, 0);
             dummy.updateMatrix();
             blades.setMatrixAt(i, dummy.matrix);
        }
        blades.instanceMatrix.needsUpdate = true;
        bladeMat.emissiveIntensity = progressRef.current * 4.0;
        pLight.intensity = progressRef.current * 8.0;

        // 2. UNIVERSE SUCTION PHYSICS
        const warpFactor = stars.userData.warpFactor; // 0 normal, >1 warp
        const isWarping = warpFactor > 1;

        for(let i=0; i<sCount; i++) {
            const d = starData[i];
            
            if (!isWarping) {
                // SUCTION MODE
                // If holding, suck in. If not, drift slow.
                const suction = uiState === 'scanning' ? 0.1 + progressRef.current * 0.2 : 0.0;
                
                // Spiral Physics
                if (suction > 0) {
                    d.x = THREE.MathUtils.lerp(d.x, 0, suction * d.speed * 0.1);
                    d.y = THREE.MathUtils.lerp(d.y, 0, suction * d.speed * 0.1);
                    d.z = THREE.MathUtils.lerp(d.z, 0, suction * 0.1); // Pull to center plane
                    
                    // Respawn if swallowed
                    if (Math.abs(d.x) < 0.5 && Math.abs(d.y) < 0.5) {
                        const theta = Math.random() * Math.PI * 2;
                        const r = 15;
                        d.x = Math.cos(theta) * r;
                        d.y = Math.sin(theta) * r;
                        d.z = (Math.random()-0.5) * 20;
                    }
                }
                
                // Rotate whole field
                const rotS = 0.005 + progressRef.current * 0.05;
                const cos = Math.cos(rotS); const sin = Math.sin(rotS);
                const nx = d.x * cos - d.y * sin;
                const ny = d.x * sin + d.y * cos;
                d.x = nx; d.y = ny;

                dummy.position.set(d.x, d.y, d.z);
                dummy.lookAt(0,0,0); // Point at black hole
                dummy.scale.set(1, 1, 1 + progressRef.current * 2); // Stretch slightly towards center
            } else {
                // WARP MODE (Explosion outward)
                
                // --- CRITICAL FIX: Keep rotation alive in warp mode ---
                const rotS = 0.05; // Fast spin
                const cos = Math.cos(rotS); const sin = Math.sin(rotS);
                const nx = d.x * cos - d.y * sin;
                const ny = d.x * sin + d.y * cos;
                d.x = nx; d.y = ny;

                // Stars fly past camera (positive Z)
                d.z += warpFactor * 2.0 * d.speed; 
                if (d.z > 20) d.z = -100; // Loop

                dummy.position.set(d.x, d.y, d.z);
                dummy.rotation.set(0,0,0); // Reset rot
                dummy.scale.set(0.5, 0.5, warpFactor * 2.0); // STRETCH INTO LINES
            }
            
            dummy.updateMatrix();
            stars.setMatrixAt(i, dummy.matrix);
        }
        stars.instanceMatrix.needsUpdate = true;

        // 3. FOV WARP
        if (uiState === 'unlocking') {
            camera.updateProjectionMatrix();
        }

        renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        camera.aspect = w/h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(frameIdRef.current);
        renderer.dispose();
        mountRef.current?.removeChild(renderer.domElement);
    };
  }, [unlock, uiState]);

  return (
    <div className="fixed inset-0 z-[100] bg-[#05050a] select-none overflow-hidden touch-none flex items-center justify-center">
        
        {/* FLASH & FADE OVERLAY */}
        <div className={`absolute inset-0 z-[120] bg-white pointer-events-none transition-opacity duration-[2s] ease-out ${flash ? 'opacity-100' : 'opacity-0'}`}></div>

        {/* 3D CANVAS */}
        <div ref={mountRef} className="absolute inset-0 z-0" />

        {/* HUD INTERFACE */}
        <div 
            className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-auto cursor-pointer"
            onPointerDown={startScan}
            onPointerUp={stopScan}
            onPointerLeave={stopScan}
            onContextMenu={(e) => e.preventDefault()}
        >
            {/* TOP HEADER */}
            <div className={`absolute top-[15%] w-full flex flex-col items-center transition-all duration-300 ${uiState === 'unlocking' ? 'opacity-0 scale-150 blur-xl' : 'opacity-100'}`}>
                <div className="flex items-center gap-3 px-4 py-1.5 bg-black/40 backdrop-blur border border-cyan-500/30 rounded-full mb-6 shadow-[0_0_20px_rgba(0,255,255,0.15)]">
                    <Orbit size={14} className="text-cyan-400 animate-[spin_4s_linear_infinite]" />
                    <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-cyan-200">EVENT_HORIZON // SECURE</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-black font-cyber text-center leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-900 drop-shadow-[0_0_30px_rgba(0,255,255,0.3)]">
                    QUANTUM<br/>LOCK
                </h1>
            </div>

            {/* INTERACTIVE CENTER */}
            <div className={`relative w-72 h-72 md:w-96 md:h-96 flex items-center justify-center transition-all duration-500 ease-out ${uiState === 'scanning' ? 'scale-110' : 'scale-100'} ${uiState === 'unlocking' ? 'scale-[5] opacity-0 rotate-180' : ''}`}>
                 
                 {/* Decorative Rings */}
                 <div className="absolute inset-0 pointer-events-none animate-[spin_30s_linear_infinite]">
                     <svg className="w-full h-full opacity-40" viewBox="0 0 100 100">
                         <circle cx="50" cy="50" r="48" fill="none" stroke="#00ffff" strokeWidth="0.2" strokeDasharray="1 3" />
                         <circle cx="50" cy="50" r="30" fill="none" stroke="#00ffff" strokeWidth="0.5" strokeOpacity="0.5" />
                     </svg>
                 </div>

                 {/* Progress Arc */}
                 <div className="absolute inset-0 pointer-events-none -rotate-90">
                     <svg className="w-full h-full filter drop-shadow-[0_0_10px_#00ffff]">
                         <circle 
                            cx="50%" cy="50%" r="44%" 
                            fill="none" 
                            stroke={uiState === 'denied' ? '#ef4444' : '#00ffff'} 
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeDasharray="276" 
                            strokeDashoffset={276 - (scanPercent * 2.76)}
                            className="transition-all duration-75 ease-linear"
                        />
                     </svg>
                 </div>

                 {/* Center Icon */}
                 <div className={`
                    w-32 h-32 rounded-full flex items-center justify-center 
                    bg-black/30 backdrop-blur-md border border-cyan-500/30
                    transition-all duration-300 group relative z-20
                    ${uiState === 'scanning' ? 'border-cyan-400 bg-cyan-500/10 shadow-[0_0_80px_rgba(0,255,255,0.6)]' : ''}
                    ${uiState === 'denied' ? 'border-red-500 shadow-[0_0_60px_rgba(239,68,68,0.5)]' : ''}
                 `}>
                     {uiState === 'scanning' ? (
                         <Fingerprint size={64} className="text-cyan-400 animate-pulse relative z-10" />
                     ) : (
                        <Lock size={48} className={`relative z-10 transition-colors duration-300 ${uiState === 'denied' ? 'text-red-500' : 'text-gray-400 group-hover:text-white'}`} />
                     )}
                 </div>
            </div>

            {/* BOTTOM HUD */}
            <div className={`absolute bottom-[10%] w-full flex flex-col items-center justify-center transition-all duration-500 ${uiState === 'unlocking' ? 'opacity-0 translate-y-20' : 'opacity-100'}`}>
                 
                 {uiState === 'scanning' ? (
                    <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center gap-3 text-cyan-400 font-mono text-xs font-bold tracking-[0.2em]">
                            <Activity size={14} className="animate-bounce" /> 
                            <span>SYNCHRONIZING GRAVITY... {scanPercent}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                             <Cpu size={14} className="text-cyan-600" />
                             {/* Segmented Bar */}
                             <div className="flex gap-1.5">
                                {[...Array(12)].map((_, i) => (
                                    <div 
                                        key={i} 
                                        className={`w-2 h-4 skew-x-[-20deg] transition-all duration-150 ${i < scanPercent/8.3 ? 'bg-cyan-400 shadow-[0_0_10px_#00ffff] scale-y-125' : 'bg-gray-800'}`}
                                    ></div>
                                ))}
                             </div>
                             <Disc size={14} className={`text-cyan-600 ${scanPercent > 80 ? 'animate-spin' : ''}`} />
                        </div>
                    </div>
                ) : uiState === 'denied' ? (
                    <div className="text-red-500 font-mono text-sm font-bold tracking-[0.2em] animate-pulse flex flex-col items-center gap-2">
                        <ShieldAlert size={28} />
                        ACCESS DENIED
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3 text-gray-500 animate-bounce cursor-pointer group">
                        <ChevronRight className="-rotate-90 text-cyan-500/50 group-hover:text-cyan-400 transition-colors" size={24} />
                        <div className="font-mono text-[10px] tracking-[0.3em] uppercase bg-black/40 px-6 py-2 rounded border border-white/5 group-hover:border-cyan-500/50 transition-colors shadow-lg">
                            Hold to Initialize
                        </div>
                    </div>
                )}
            </div>

            {/* HUD CORNERS */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none p-8">
                 <div className="w-full h-full border border-white/5 rounded-3xl relative">
                     <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-500/30 rounded-tl-xl"></div>
                     <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-500/30 rounded-tr-xl"></div>
                     <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-500/30 rounded-bl-xl"></div>
                     <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500/30 rounded-br-xl"></div>
                 </div>
            </div>
        </div>
    </div>
  );
};

export default PortalTransition;
