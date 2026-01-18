import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import * as THREE from 'three';
import { Terminal, Cpu, Wifi, Zap, ShieldCheck, Activity } from 'lucide-react';

interface LoaderProps {
  onComplete: () => void;
}

const BOOT_LOGS = [
  "INITIALIZING HYPER-CORE...",
  "BYPASSING FIREWALLS...",
  "ALLOCATING VIRTUAL MEMORY...",
  "COMPILING SHADERS [1024/2048]...",
  "ESTABLISHING NEURAL UPLINK...",
  "DECRYPTING MATCH DATA...",
  "SYSTEM OPTIMIZED.",
  "WELCOME, USER."
];

// Simple Vertex Shader for the Energy Core (Pulsing Displacement)
const CORE_VERTEX_SHADER = `
  varying vec2 vUv;
  varying vec3 vNormal;
  uniform float uTime;
  uniform float uIntensity;

  void main() {
    vUv = uv;
    vNormal = normal;
    
    vec3 pos = position;
    // Spiky displacement based on noise-like sin waves
    float noise = sin(pos.x * 5.0 + uTime * 5.0) * sin(pos.y * 5.0 + uTime * 3.0) * sin(pos.z * 5.0);
    pos += normal * (noise * 0.2 * uIntensity);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

// Fragment Shader for Plasma Glow
const CORE_FRAGMENT_SHADER = `
  varying vec2 vUv;
  varying vec3 vNormal;
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;

  void main() {
    // Fresnel glow
    vec3 viewDir = vec3(0.0, 0.0, 1.0); // Simplified view direction
    float fresnel = pow(1.0 - dot(vNormal, viewDir), 2.0);

    // Moving bands
    float bands = sin(vUv.y * 20.0 + uTime * 3.0);
    
    vec3 color = mix(uColorA, uColorB, bands * 0.5 + 0.5);
    color += uColorB * fresnel * 2.0;

    gl_FragColor = vec4(color, 0.8 * fresnel + 0.2);
  }
`;

const Loader: React.FC<LoaderProps> = ({ onComplete }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [logIndex, setLogIndex] = useState(0);
  const [glitchText, setGlitchText] = useState("INITIALIZING");
  const progressRef = useRef(0);

  // --- GLITCH TEXT EFFECT ---
  useEffect(() => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#@%&*";
      let interval: any;
      
      const scramble = () => {
          let iter = 0;
          clearInterval(interval);
          interval = setInterval(() => {
              setGlitchText(prev => prev.split("").map((_, i) => {
                  if (i < iter) return BOOT_LOGS[logIndex][i] || "";
                  return chars[Math.floor(Math.random() * chars.length)];
              }).join(""));
              
              if (iter >= BOOT_LOGS[logIndex].length) clearInterval(interval);
              iter += 1/2; // Speed
          }, 30);
      };
      
      scramble();
      return () => clearInterval(interval);
  }, [logIndex]);

  useEffect(() => {
    if (!mountRef.current) return;

    // --- THREE.JS SETUP ---
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.02);
    
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 12);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // --- OBJECTS ---
    const group = new THREE.Group();
    scene.add(group);

    // CUBES GROUP (for orbiting cubes)
    const cubesGroup = new THREE.Group();
    scene.add(cubesGroup);

    // 1. PLASMA CORE (Shader Material)
    const coreGeo = new THREE.IcosahedronGeometry(2, 6); // High detail
    const coreMat = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uIntensity: { value: 0.5 },
            uColorA: { value: new THREE.Color(0x4c1d95) }, // Dark Purple
            uColorB: { value: new THREE.Color(0x00ffff) }  // Cyan
        },
        vertexShader: CORE_VERTEX_SHADER,
        fragmentShader: CORE_FRAGMENT_SHADER,
    });

    // CORE MESH (Plasma Core)
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

        // RINGS (Orbiting Torus)
        const rings = [];
        for (let i = 0; i < 3; i++) {
            const ringGeo = new THREE.TorusGeometry(3 + i, 0.15, 16, 100);
            const ringMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, metalness: 0.7, roughness: 0.2 });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 2;
            group.add(ring);
            rings.push(ring);
        }

        // TUNNEL (Starfield Effect)
        const starCount = 300;
        const starGeo = new THREE.BufferGeometry();
        const starPositions = new Float32Array(starCount * 3);
        const starSpeeds = [];
        for (let i = 0; i < starCount; i++) {
            starPositions[i * 3] = (Math.random() - 0.5) * 40;
            starPositions[i * 3 + 1] = (Math.random() - 0.5) * 40;
            starPositions[i * 3 + 2] = Math.random() * -80;
            starSpeeds[i] = 0.1 + Math.random() * 0.2;
        }
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.15 });
        const tunnel = new THREE.Points(starGeo, starMat);
        scene.add(tunnel);

    // 2. CUBES (Orbiting)
    const cubeGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    for(let i=0; i<20; i++) {
        const cube = new THREE.Mesh(cubeGeo, coreMat);
        // Random orbit position
        const angle = Math.random() * Math.PI * 2;
        const radius = 3 + Math.random() * 2;
        cube.position.set(Math.cos(angle)*radius, Math.sin(angle)*radius, (Math.random()-0.5)*2);
        cubesGroup.add(cube);
    }

    // LIGHTS
    const ambient = new THREE.AmbientLight(0x000000);
    scene.add(ambient); // Shaders handle light, but good for safety

    // --- ANIMATION LOOP ---
    const clock = new THREE.Clock();
    let frameId: number = 0;
    const wrappedAnimate = () => {
        const time = clock.getElapsedTime();
        const p = progressRef.current / 100;
        // 1. Animate Core Shader
        coreMat.uniforms.uTime.value = time;
        coreMat.uniforms.uIntensity.value = 0.5 + (p * 2.0); // Gets spikier
        // 2. Rotate Core
        core.rotation.y = time * 0.5;
        core.rotation.z = time * 0.2;
        // 3. Rotate Rings (Accelerate)
        rings.forEach((ring, i) => {
            ring.rotation.x += 0.01 * (i+1) * (1 + p*3);
            ring.rotation.y += 0.01 * (i+1) * (1 + p*3);
            // Pulse radius
            const scale = 1 + Math.sin(time * 2 + i) * 0.05;
            ring.scale.setScalar(scale);
        });
        // 4. Animate Tunnel (Warp Effect)
        const positions = tunnel.geometry.attributes.position.array as Float32Array;
        for(let i=0; i<starCount; i++) {
            // Move Z towards camera
            positions[i*3+2] += starSpeeds[i] * (1 + p * 20); // Massive speed up
            // Reset if behind camera
            if(positions[i*3+2] > 20) {
                positions[i*3+2] = -80;
                // Reshuffle X/Y for variety
                positions[i*3] = (Math.random() - 0.5) * 40;
                positions[i*3+1] = (Math.random() - 0.5) * 40;
            }
        }
        tunnel.geometry.attributes.position.needsUpdate = true;
        // 5. Cubes Orbit
        cubesGroup.rotation.z -= 0.005 * (1 + p * 5);
        cubesGroup.children.forEach((c, i) => {
             c.rotation.x += 0.02;
             c.rotation.y += 0.02;
             // Converge to center near end
             if (p > 0.9) {
                 c.position.lerp(new THREE.Vector3(0,0,0), 0.05);
             }
        });
        // 6. Camera Float
        camera.position.x = Math.sin(time * 0.3) * 1.5;
        camera.position.y = Math.cos(time * 0.4) * 1.5;
        camera.lookAt(0,0,0);
        // Shake
        if (p > 0.8) {
            camera.position.x += (Math.random() - 0.5) * 0.3;
            camera.position.y += (Math.random() - 0.5) * 0.3;
        }
        renderer.render(scene, camera);
        frameId = requestAnimationFrame(wrappedAnimate);
    };
    frameId = requestAnimationFrame(wrappedAnimate);
        const time = clock.getElapsedTime();
        const p = progressRef.current / 100;
        
        // 1. Animate Core Shader
        coreMat.uniforms.uTime.value = time;
        coreMat.uniforms.uIntensity.value = 0.5 + (p * 2.0); // Gets spikier
        
        // 2. Rotate Core
        core.rotation.y = time * 0.5;
        core.rotation.z = time * 0.2;

        // 3. Rotate Rings (Accelerate)
        rings.forEach((ring, i) => {
            ring.rotation.x += 0.01 * (i+1) * (1 + p*3);
            ring.rotation.y += 0.01 * (i+1) * (1 + p*3);
            
            // Pulse radius
            const scale = 1 + Math.sin(time * 2 + i) * 0.05;
            ring.scale.setScalar(scale);
        });

        // 4. Animate Tunnel (Warp Effect)
        const positions = tunnel.geometry.attributes.position.array as Float32Array;
        for(let i=0; i<starCount; i++) {
            // Move Z towards camera
            positions[i*3+2] += starSpeeds[i] * (1 + p * 20); // Massive speed up
            
            // Reset if behind camera
            if(positions[i*3+2] > 20) {
                positions[i*3+2] = -80;
                // Reshuffle X/Y for variety
                positions[i*3] = (Math.random() - 0.5) * 40;
                positions[i*3+1] = (Math.random() - 0.5) * 40;
            }
        }
        tunnel.geometry.attributes.position.needsUpdate = true;

        // 5. Cubes Orbit
        cubesGroup.rotation.z -= 0.005 * (1 + p * 5);
        cubesGroup.children.forEach((c, i) => {
             c.rotation.x += 0.02;
             c.rotation.y += 0.02;
             // Converge to center near end
             if (p > 0.9) {
                 c.position.lerp(new THREE.Vector3(0,0,0), 0.05);
             }
        });

        // 6. Camera Float
        camera.position.x = Math.sin(time * 0.3) * 1.5;
        camera.position.y = Math.cos(time * 0.4) * 1.5;
        camera.lookAt(0,0,0);
        // Shake
        if (p > 0.8) {
            camera.position.x += (Math.random() - 0.5) * 0.3;
            camera.position.y += (Math.random() - 0.5) * 0.3;
        }

        renderer.render(scene, camera);
    // (removed animate function and invocation, only wrappedAnimate is used)

    // --- GSAP TIMELINE ---
    const tl = gsap.timeline({
        onComplete: () => {
            // IMPLOSION SEQUENCE
            const endTl = gsap.timeline({
                 onComplete: onComplete
            });
            
            // 1. Collapse everything to center
            endTl.to(group.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 0.4, ease: "back.in(2)" });
            
            // 2. Whiteout Flash
            if (mountRef.current) {
              endTl.to(mountRef.current, { backgroundColor: '#ffffff', duration: 0.1 }, "-=0.1");
            }
            
            // 3. Fade out
            if (mountRef.current) {
              endTl.to(mountRef.current, { opacity: 0, duration: 0.5 });
            }
        }
    });

    try {
      tl.to(progressRef, {
        current: 100,
        duration: 5.5,
        ease: "power3.inOut",
        onUpdate: () => {
            const val = Math.round(progressRef.current);
            setProgress(val);
            const idx = Math.floor((val / 100) * (BOOT_LOGS.length - 1));
            if (idx !== logIndex) setLogIndex(idx);
        }
      });
    } catch (err) {
      console.error('GSAP timeline error:', err);
      // Fallback: auto-complete after 6 seconds
      setTimeout(() => {
        setProgress(100);
        setTimeout(onComplete, 1000);
      }, 6000);
    }

    // Fallback: Force completion after 7 seconds if GSAP fails
    const fallbackTimer = setTimeout(() => {
      if (progressRef.current < 100) {
        console.warn('Loader timeout - forcing completion');
        onComplete();
      }
    }, 7000);

    // Resize Handler
    const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
        clearTimeout(fallbackTimer);
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(frameId);
        if (mountRef.current && renderer.domElement) {
            mountRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
    };
  }, [onComplete]);

  return (
    <div 
        ref={mountRef}
        className="fixed inset-0 z-[100] bg-black text-white overflow-hidden cursor-none"
    >
        {/* HUD UI LAYER */}
        
        {/* Top Left Status */}
        <div className="absolute top-10 left-10 flex flex-col gap-2 pointer-events-none mix-blend-difference">
             <div className="flex items-center gap-2 text-neon-cyan">
                 <Activity size={18} className="animate-pulse" />
                 <span className="font-mono text-xs tracking-[0.3em] font-bold">SYSTEM_ACTUAL</span>
             </div>
             <div className="h-0.5 w-32 bg-purple-600"></div>
             <div className="font-cyber text-[10px] text-gray-400">MEM_ALLOC: {Math.floor(progress * 48.2)}MB</div>
        </div>

        {/* Top Right Time */}
        <div className="absolute top-10 right-10 text-right pointer-events-none mix-blend-difference">
             <div className="font-mono text-xs tracking-[0.2em] text-neon-pink">SECURE_BOOT_V.9.2</div>
             <div className="text-[10px] text-gray-500 mt-1">{new Date().toLocaleTimeString()}</div>
        </div>

        {/* Bottom Left Log */}
        <div className="absolute bottom-10 left-10 pointer-events-none max-w-md">
             <div className="flex items-center gap-2 mb-2 text-purple-400">
                 <Terminal size={14} />
                 <span className="font-mono text-[10px] tracking-widest">KERNEL_LOG</span>
             </div>
             <div className="bg-black/50 backdrop-blur-sm border-l-2 border-purple-500 p-4">
                 <p className="font-mono text-sm text-neon-cyan drop-shadow-[0_0_5px_rgba(0,255,255,0.8)]">
                     {">"} {glitchText}
                     <span className="animate-blink inline-block w-2 h-4 bg-white ml-1 align-middle"></span>
                 </p>
                 <div className="flex gap-1 mt-3">
                     {[...Array(8)].map((_, i) => (
                         <div 
                            key={i} 
                            className={`h-1 w-6 rounded-sm transition-colors duration-300 ${i < (progress / 12.5) ? 'bg-neon-pink shadow-[0_0_8px_#ff00de]' : 'bg-gray-800'}`}
                         ></div>
                     ))}
                 </div>
             </div>
        </div>

        {/* Bottom Right Stats */}
        <div className="absolute bottom-10 right-10 flex gap-6 text-[10px] font-mono tracking-widest text-gray-500 pointer-events-none">
             <div className="flex flex-col items-center">
                 <Cpu className={`mb-2 ${progress > 50 ? 'text-white animate-spin-slow' : 'text-gray-600'}`} size={20} />
                 <span>CPU</span>
             </div>
             <div className="flex flex-col items-center">
                 <Zap className={`mb-2 ${progress > 20 ? 'text-yellow-400' : 'text-gray-600'}`} size={20} />
                 <span>PWR</span>
             </div>
             <div className="flex flex-col items-center">
                 <ShieldCheck className="mb-2 text-green-500" size={20} />
                 <span>SEC</span>
             </div>
        </div>

        {/* Center Progress Large */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none mix-blend-overlay">
             <h1 className="text-[120px] md:text-[200px] font-black font-cyber text-white/10 tracking-tighter leading-none select-none">
                 {progress}
             </h1>
        </div>
        
        {/* Scanlines & Grain */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none z-50"></div>
        <div className="absolute inset-0 bg-black/20 pointer-events-none z-40 radial-vignette"></div>
    </div>
  );
};

export default Loader;
