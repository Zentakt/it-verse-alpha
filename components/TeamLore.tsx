
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { TEAMS } from '../constants';
import { Shield, Zap, Cpu, Code2, Terminal, Database } from 'lucide-react';
import FactionEntryTransition from './FactionEntryTransition';

// --- FLAVOR TEXT & PHYSICS DATA ---
const LORE_DATA: Record<string, { title: string; desc: string; stats: any; params: any }> = {
  't1': {
    title: "THE SERPENTINE LOGIC",
    desc: "Emerging from the depths of legacy code, the Metamorphic Python faction specializes in adaptive algorithms. They don't just write code; they weave self-evolving scripts that constrict errors and swallow complexity whole.",
    stats: { agility: 95, strength: 70, intelligence: 90 },
    params: { speed: 0.2, frequency: 0.8, amplitude: 1.2, glitch: 0.0, sharp: 0.0, crystal: 0.0, lightning: 0.0 } 
  },
  't2': {
    title: "LIGHTNING COURIERS",
    desc: "Exuberant Ajax operatives are the nervous system of the grid. Masters of asynchronous warfare, they strike before the server even registers the request. Responsiveness is their only law.",
    stats: { agility: 100, strength: 60, intelligence: 85 },
    // TUNED: Stable but high energy. 
    params: { speed: 0.8, frequency: 3.0, amplitude: 0.8, glitch: 0.1, sharp: 0.0, crystal: 0.0, lightning: 1.0 } 
  },
  't3': {
    title: "THE BEDROCK TITANS",
    desc: "Java The Explorer represents the heavy infantry of the backend. They build the monoliths that hold the sky up. Unshakeable, typed, and compiled, their code is a fortress.",
    stats: { agility: 50, strength: 100, intelligence: 80 },
    params: { speed: 0.1, frequency: 0.3, amplitude: 2.5, glitch: 0.1, sharp: 1.0, crystal: 0.0, lightning: 0.0 }
  },
  't4': {
    title: "GEMSTONE ARTISANS",
    desc: "Magnificent Ruby focuses on the elegance of the craft. To them, code is poetry. Do not mistake their art for weakness—their syntax is sharp enough to cut through the densest logic knots.",
    stats: { agility: 80, strength: 65, intelligence: 95 },
    params: { speed: 0.1, frequency: 1.2, amplitude: 1.8, glitch: 0.0, sharp: 1.0, crystal: 1.0, lightning: 0.0 } 
  },
};

const DEFAULT_LORE = {
    title: "UNKNOWN FACTION",
    desc: "Analyzing signal...",
    stats: { agility: 50, strength: 50, intelligence: 50 },
    params: { speed: 0.5, frequency: 1.0, amplitude: 1.0, glitch: 0.0, sharp: 0.0, crystal: 0.0, lightning: 0.0 }
};

// --- SHADERS ---

const NOISE_FUNCTIONS = `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  vec2 voronoi(in vec2 x) {
    vec2 p = floor(x);
    vec2 f = fract(x);
    vec2 res = vec2(8.0);
    for(int j=-1; j<=1; j++) {
        for(int i=-1; i<=1; i++) {
            vec2 b = vec2(float(i), float(j));
            vec2 r = vec2(b) - f + fract(sin(vec2(dot(p+b,vec2(127.1,311.7)),dot(p+b,vec2(269.5,183.3))))*43758.5453);
            float d = dot(r,r);
            if(d < res.x) {
                res.y = res.x;
                res.x = d;
            } else if(d < res.y) {
                res.y = d;
            }
        }
    }
    return res;
  }
`;

const TERRAIN_VERTEX = `
  varying vec2 vUv;
  varying float vElevation;
  varying float vCrystalEdge; 
  varying float vSpike; 
  
  uniform float uTime;
  uniform float uSpeed;
  uniform float uFrequency;
  uniform float uAmplitude;
  uniform float uScrollWarp;
  uniform float uSharpness;
  uniform float uCrystal;   
  uniform float uLightning; 
  uniform vec2 uMouse;

  ${NOISE_FUNCTIONS}

  void main() {
    vUv = uv;
    vec3 pos = position;
    
    // Mouse Interaction
    float distToMouse = distance(uv, uMouse);
    float mouseWave = smoothstep(0.4, 0.0, distToMouse) * sin(distToMouse * 20.0 - uTime * 5.0) * 0.5;

    // --- MODE 1: ORGANIC / FLUID (Simplex) ---
    float organicNoise = snoise(pos.xy * uFrequency + uTime * uSpeed);
    float fluidWave = sin(pos.x * uFrequency + uTime * uSpeed) * 0.5 + sin(pos.y * uFrequency * 0.8 + uTime * uSpeed * 0.7) * 0.5;
    float baseElev = mix(fluidWave, organicNoise, uSharpness);

    if (uSharpness > 0.8 && uCrystal < 0.1 && uLightning < 0.1) {
       baseElev = floor(baseElev * 3.0) / 3.0; // Blocky (Java)
    }

    // --- MODE 2: CRYSTAL (Voronoi) ---
    vec2 v = voronoi(pos.xy * (uFrequency * 0.8) + uTime * (uSpeed * 0.2));
    float voronoiHeight = (1.0 - sqrt(v.x)); 
    vCrystalEdge = smoothstep(0.05, 0.0, v.y - v.x); 
    
    // --- MODE 3: AJAX (Hyper-Grid Storm) ---
    float lightningHeight = 0.0;
    vSpike = 0.0;
    
    if (uLightning > 0.0) {
        // Tech Pillars: Stepped noise
        float scale = 4.0;
        vec2 grid = floor(pos.xy * scale);
        float pillar = snoise(grid * 0.2 + uTime * 0.2); 
        
        // Quantize height for "digital" look
        pillar = floor(pillar * 4.0) / 4.0;
        
        // Mouse Ripple (Interactive)
        vec2 mousePosWorld = (uMouse - 0.5) * 32.0; // Approx world space
        float d = distance(pos.xy, mousePosWorld);
        float ripple = exp(-d * 0.5) * sin(d * 3.0 - uTime * 10.0) * 2.0;

        // Combine
        lightningHeight = pillar * 0.5 + ripple * uLightning;
        
        // Highlight edges
        vSpike = smoothstep(0.4, 0.45, abs(pillar)); 
    }

    // --- BLEND MODES ---
    float elevation = baseElev;
    
    elevation = mix(elevation, voronoiHeight * 1.5 - 0.5, uCrystal);
    elevation = mix(elevation, lightningHeight, uLightning);

    elevation *= uAmplitude;
    elevation += mouseWave * (1.0 - uLightning); // Disable default mouse wave for Ajax, use custom ripple
    
    // Scroll Warp
    elevation -= uScrollWarp * (pos.x * pos.x + pos.y * pos.y) * 0.02; 

    pos.z += elevation;
    vElevation = elevation;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const TERRAIN_FRAGMENT = `
  varying vec2 vUv;
  varying float vElevation;
  varying float vCrystalEdge;
  varying float vSpike;

  uniform vec3 uColor;
  uniform float uGlitch;
  uniform float uTime;
  uniform float uCrystal;
  uniform float uLightning;
  uniform vec2 uMouse;

  ${NOISE_FUNCTIONS}

  // Hexagon Grid Function
  float hexDist(vec2 p) {
      p = abs(p);
      float c = dot(p, normalize(vec2(1,1.73)));
      c = max(c, p.x);
      return c;
  }

  vec4 hexGrid(vec2 uv, float scale) {
      vec2 p = uv * scale;
      vec2 r = vec2(1.0, 1.73);
      vec2 h = r * 0.5;
      vec2 a = mod(p, r) - h;
      vec2 b = mod(p - h, r) - h;
      vec2 gv = dot(a, a) < dot(b, b) ? a : b;
      
      float d = length(gv);
      float hex = smoothstep(0.45, 0.5, 0.5 - max(abs(gv.x), dot(abs(gv), normalize(vec2(1.0, 1.73)))));
      
      // Center glow
      float center = 1.0 - smoothstep(0.0, 0.3, d);
      return vec4(hex, center, 0.0, 0.0);
  }

  void main() {
    vec3 finalColor = vec3(0.0);
    float alpha = 1.0;

    // --- BASE GRID CALCULATION ---
    float thickness = 0.02;
    float scale = 30.0;
    
    float gOff = step(0.9, sin(vUv.y * 100.0 + uTime * 20.0)) * uGlitch * 0.05;
    float gridX = step(1.0 - thickness, fract((vUv.x + gOff) * scale));
    float gridY = step(1.0 - thickness, fract(vUv.y * scale));
    float grid = max(gridX, gridY);

    float glow = smoothstep(-1.0, 2.5, vElevation);
    
    // Default mode color
    finalColor = uColor * (grid * 0.7 + 0.1); 
    finalColor += uColor * glow * 0.6; 

    // --- CRYSTAL EFFECT (Ruby) ---
    if (uCrystal > 0.01) {
        float edge = vCrystalEdge;
        finalColor += vec3(1.0) * edge * uCrystal * 0.8;
        finalColor += uColor * pow(vElevation + 0.5, 3.0) * uCrystal;
        float spec = step(0.95, fract(vElevation * 5.0 + uTime * 0.2));
        finalColor += vec3(1.0, 0.8, 0.8) * spec * uCrystal * 0.5;
    }

    // --- AWARD-WINNING AJAX LIGHTNING (Enhanced & Stable) ---
    if (uLightning > 0.01) {
        // 1. Hexagonal Data Grid
        vec4 hg = hexGrid(vUv, 20.0);
        float hexLine = hg.x;
        float hexCenter = hg.y;
        
        // Gentle pulse
        float pulse = sin(hexCenter * 5.0 - uTime * 2.0) * 0.5 + 0.5;
        
        // 2. High Voltage Arcs (Domain Warping)
        // Warp coordinates based on noise
        vec2 warp = vUv * 4.0;
        float n1 = snoise(warp - uTime * 0.5);
        vec2 warp2 = warp + vec2(n1);
        float n2 = snoise(warp2 * 2.0 + uTime);
        
        // Create sharp lines from noise zero-crossings
        float electricity = 1.0 / (abs(n2) * 5.0 + 0.05);
        electricity = pow(electricity, 4.0); // Sharpen significantly
        
        // Constrain electricity to "active" areas + Mouse interaction
        float distToMouse = distance(vUv, uMouse);
        float mouseAttraction = smoothstep(0.4, 0.0, distToMouse);
        
        // Random bursts
        float burst = smoothstep(0.6, 0.8, snoise(vUv * 2.0 + uTime));
        
        float boltMask = clamp(burst + mouseAttraction, 0.0, 1.0);
        electricity *= boltMask;
        
        // 3. Colors
        vec3 deepBlue = vec3(0.0, 0.1, 0.3);
        vec3 cyan = vec3(0.0, 0.8, 1.0);
        vec3 white = vec3(1.0);
        
        // Composite
        vec3 techBg = deepBlue;
        techBg += cyan * hexLine * 0.3 * pulse; // Grid lines
        techBg += cyan * vSpike * 0.5; // Pillar edges
        
        // Add Lightning
        vec3 boltColor = mix(cyan, white, electricity);
        techBg += boltColor * electricity * 3.0; // Glow intensity
        
        // Mouse Cursor Target
        float cursorRing = smoothstep(0.06, 0.05, abs(distToMouse - 0.05));
        techBg += white * cursorRing * 0.5;

        finalColor = mix(finalColor, techBg, uLightning);
    }

    // Standard Glitch Overlay
    float bars = step(0.98 - (uGlitch * 0.1), fract(vUv.y * 20.0 + vElevation * 5.0));
    finalColor += vec3(1.0) * bars * uGlitch;

    // Vignette mask
    float d = distance(vUv, vec2(0.5));
    float mask = 1.0 - smoothstep(0.3, 0.8, d);

    gl_FragColor = vec4(finalColor, mask * 0.9);
  }
`;

interface TeamLoreProps {
  onSelect: (teamId: string) => void;
}

const TeamLore: React.FC<TeamLoreProps> = ({ onSelect }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [activeTeamId, setActiveTeamId] = useState<string>('t1');
  const [transitioningTeam, setTransitioningTeam] = useState<string | null>(null);
  const activeTeamRef = useRef<string>('t1');
  
  // Animation loop refs
  const scrollSpeedRef = useRef(0);
  const lastScrollPos = useRef(0);
  const mousePos = useRef(new THREE.Vector2(0.5, 0.5));
  const timeRef = useRef(0);

  const handleInitialize = (teamId: string) => {
      setTransitioningTeam(teamId);
  };

  const handleTransitionComplete = () => {
      if (transitioningTeam) {
          onSelect(transitioningTeam);
          // Optional: clear transition state if we ever unmount
          // setTransitioningTeam(null);
      }
  };

  // --- 3D SCENE ---
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobile = width < 768;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 100);
    
    // Adjust initial camera
    if (isMobile) {
        camera.position.set(0, -8, 8); 
    } else {
        camera.position.set(0, -6, 5);
    }
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // Initial Params
    const initLore = LORE_DATA['t1'];
    
    // Material
    const material = new THREE.ShaderMaterial({
        vertexShader: TERRAIN_VERTEX,
        fragmentShader: TERRAIN_FRAGMENT,
        uniforms: {
            uTime: { value: 0 },
            uSpeed: { value: initLore.params.speed },
            uFrequency: { value: initLore.params.frequency },
            uAmplitude: { value: initLore.params.amplitude },
            uSharpness: { value: initLore.params.sharp },
            uGlitch: { value: initLore.params.glitch },
            uCrystal: { value: initLore.params.crystal },
            uLightning: { value: initLore.params.lightning },
            uScrollWarp: { value: 0 },
            uMouse: { value: new THREE.Vector2(0.5, 0.5) },
            uColor: { value: new THREE.Color(TEAMS['t1'].color) }
        },
        transparent: true,
        side: THREE.DoubleSide
    });

    const geometry = new THREE.PlaneGeometry(32, 32, 256, 256); 
    const terrain = new THREE.Mesh(geometry, material);
    scene.add(terrain);

    // Particles
    const pGeo = new THREE.BufferGeometry();
    const pCount = 3000; // Increased count
    const pPos = new Float32Array(pCount * 3);
    const pVel = new Float32Array(pCount); 
    const pScales = new Float32Array(pCount);
    
    for(let i=0; i<pCount; i++) {
        pPos[i*3] = (Math.random()-0.5) * 40;
        pPos[i*3+1] = (Math.random()-0.5) * 40;
        pPos[i*3+2] = Math.random() * 8;
        pVel[i] = 0.5 + Math.random();
        pScales[i] = Math.random();
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('velocity', new THREE.BufferAttribute(pVel, 1));
    pGeo.setAttribute('scale', new THREE.BufferAttribute(pScales, 1));
    
    // Custom Point Shader for Warp Streaks
    const pMat = new THREE.ShaderMaterial({
        uniforms: {
            uColor: { value: new THREE.Color(0xffffff) },
            uStretch: { value: 0.0 }, // 0 = dot, 1 = streak
            uOpacity: { value: 0.6 }
        },
        vertexShader: `
            attribute float scale;
            attribute float velocity;
            uniform float uStretch;
            varying float vAlpha;
            void main() {
                vec3 pos = position;
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                
                // Stable stretch calculation
                float stretchFactor = 1.0 + (uStretch * velocity * 2.0); 
                
                gl_PointSize = (4.0 * scale * stretchFactor) * (1.0 / -mvPosition.z);
                
                vAlpha = 1.0; 
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform vec3 uColor;
            uniform float uOpacity;
            varying float vAlpha;
            void main() {
                vec2 coord = gl_PointCoord - vec2(0.5);
                float dist = length(coord);
                if (dist > 0.5) discard;
                
                float glow = 1.0 - (dist * 2.0);
                glow = pow(glow, 2.0);
                
                gl_FragColor = vec4(uColor, uOpacity * glow);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    const clock = new THREE.Clock();

    // Loop
    const animate = () => {
        const time = clock.getElapsedTime();
        timeRef.current = time;
        material.uniforms.uTime.value = time;

        // --- ACTIVE SECTION DETECTION ---
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

        // Update State if changed
        if (closestId !== activeTeamRef.current) {
            activeTeamRef.current = closestId;
            setActiveTeamId(closestId);
            
            // Trigger Animation
            const el = document.querySelector(`.team-section[data-team-id="${closestId}"]`);
            if (el) {
                gsap.killTweensOf(el.querySelectorAll('.reveal-item'));
                gsap.fromTo(el.querySelectorAll('.reveal-item'), 
                    { y: 30, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: "power2.out" }
                );
            }
        }

        // --- LERP PARAMS ---
        const currentLore = LORE_DATA[activeTeamRef.current] || LORE_DATA['t1'];
        const params = currentLore.params;
        const targetColor = new THREE.Color(TEAMS[activeTeamRef.current]?.color || TEAMS['t1'].color);

        // Make transition snappier for Ajax to feel energetic
        const lerpSpeed = activeTeamRef.current === 't2' ? 0.1 : 0.06;
        
        material.uniforms.uColor.value.lerp(targetColor, lerpSpeed);
        pMat.uniforms.uColor.value.lerp(targetColor, lerpSpeed);

        material.uniforms.uSpeed.value += (params.speed - material.uniforms.uSpeed.value) * lerpSpeed;
        material.uniforms.uFrequency.value += (params.frequency - material.uniforms.uFrequency.value) * lerpSpeed;
        material.uniforms.uAmplitude.value += (params.amplitude - material.uniforms.uAmplitude.value) * lerpSpeed;
        material.uniforms.uGlitch.value += (params.glitch - material.uniforms.uGlitch.value) * lerpSpeed;
        material.uniforms.uSharpness.value += (params.sharp - material.uniforms.uSharpness.value) * lerpSpeed;
        material.uniforms.uCrystal.value += (params.crystal - material.uniforms.uCrystal.value) * lerpSpeed;
        material.uniforms.uLightning.value += (params.lightning - material.uniforms.uLightning.value) * lerpSpeed;
        
        // --- PARTICLE BEHAVIOR ---
        const pPositions = particles.geometry.attributes.position.array as Float32Array;
        const pVels = particles.geometry.attributes.velocity.array as Float32Array;
        const lightningMode = material.uniforms.uLightning.value > 0.5;
        const crystalMode = material.uniforms.uCrystal.value > 0.5;

        // Warp Streak Effect for Ajax
        const targetStretch = lightningMode ? 1.0 : 0.0;
        pMat.uniforms.uStretch.value = THREE.MathUtils.lerp(pMat.uniforms.uStretch.value, targetStretch, 0.1);

        for(let i=0; i<pCount; i++) {
            let zSpeed = 0.01 * pVels[i];
            
            if (lightningMode) {
                // WARP SPEED (Fast Z movement)
                zSpeed = 0.5 * pVels[i]; 
            } else if (crystalMode) {
                zSpeed = 0.001 * Math.sin(time + i);
            }

            pPositions[i*3+2] += zSpeed;

            // Reset loop
            if(pPositions[i*3+2] > 10) {
                pPositions[i*3+2] = -10; 
                pPositions[i*3] = (Math.random()-0.5) * 40;
                pPositions[i*3+1] = (Math.random()-0.5) * 40;
            }
        }
        particles.geometry.attributes.position.needsUpdate = true;

        // Scroll Warp Decay
        scrollSpeedRef.current *= 0.92;
        material.uniforms.uScrollWarp.value = scrollSpeedRef.current;
        material.uniforms.uMouse.value.lerp(mousePos.current, 0.1);

        // Update Camera Shake
        let shakeX = 0; 
        if (lightningMode) shakeX = (Math.random() - 0.5) * 0.02;

        camera.position.x = Math.sin(time * 0.1) * 0.5 + shakeX;
        camera.position.y = (isMobile ? -8 : -6);
        camera.position.z = (isMobile ? 8 : 5);

        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);

        if(w < 768) {
            camera.position.set(0, -8, 8); 
            terrain.scale.setScalar(0.85); 
        } else {
            camera.position.set(0, -6, 5);
            terrain.scale.setScalar(1);
        }
    };
    const handleMouseMove = (e: MouseEvent) => {
        const x = e.clientX / window.innerWidth;
        const y = 1.0 - (e.clientY / window.innerHeight);
        mousePos.current.set(x, y);
    };
    const handleScroll = () => {
        const y = window.scrollY;
        const delta = y - lastScrollPos.current;
        scrollSpeedRef.current = delta * 0.005; 
        scrollSpeedRef.current = Math.max(-1, Math.min(1, scrollSpeedRef.current));
        lastScrollPos.current = y;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    
    handleResize();

    return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('scroll', handleScroll);
        if (mountRef.current && renderer.domElement) mountRef.current.removeChild(renderer.domElement);
        renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full bg-black min-h-screen">
        {/* TRANSITION OVERLAY */}
        {transitioningTeam && (
            <FactionEntryTransition 
                teamId={transitioningTeam} 
                onComplete={handleTransitionComplete} 
            />
        )}

        {/* FIXED Background */}
        <div ref={mountRef} className="fixed top-0 left-0 w-full h-full z-0 opacity-60 pointer-events-none"></div>

        {/* Scrollable Content */}
        <div ref={containerRef} className="relative z-10">
            {Object.values(TEAMS).slice(0, 4).map((team, index) => {
                const lore = LORE_DATA[team.id] || DEFAULT_LORE;
                const isRight = index % 2 !== 0;

                return (
                    <section 
                        key={team.id} 
                        data-team-id={team.id}
                        className="team-section min-h-[80vh] md:min-h-screen flex items-center justify-center p-4 py-12 md:p-12 relative border-b border-gray-800/20"
                    >
                        {/* Overlay for text readability */}
                        <div className="absolute inset-0 bg-black/40 pointer-events-none -z-10"></div>

                        <div className={`max-w-7xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-24 items-center ${isRight ? 'md:grid-flow-col-dense' : ''}`}>
                            
                            {/* TEXT CONTENT - Order 2 on Mobile (Appears Below Card) */}
                            <div className={`space-y-6 md:space-y-8 order-2 md:order-none ${isRight ? 'md:col-start-2' : ''}`}>
                                <div className="reveal-item flex items-center gap-4">
                                    <div className="w-10 md:w-16 h-1 bg-[var(--team-color)]" style={{ '--team-color': team.color } as React.CSSProperties}></div>
                                    <span className="font-mono text-[10px] md:text-xs tracking-[0.2em] md:tracking-[0.3em] text-[var(--team-color)] uppercase drop-shadow-[0_0_8px_currentColor]" style={{ '--team-color': team.color } as React.CSSProperties}>
                                        DATA_LOG // {team.id.toUpperCase()}
                                    </span>
                                </div>
                                
                                <div className="reveal-item">
                                    <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black font-cyber text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 leading-[0.9] mb-3 md:mb-4 tracking-tighter break-words uppercase">
                                        {team.name}
                                    </h2>
                                    <h3 className="text-lg md:text-2xl font-bold text-white flex items-center gap-3">
                                        <Code2 className="text-[var(--team-color)]" style={{ '--team-color': team.color } as React.CSSProperties} />
                                        {lore.title}
                                    </h3>
                                </div>
                                
                                <p className="reveal-item text-gray-400 font-ui text-sm md:text-base leading-relaxed pl-4 md:pl-6 border-l-2 border-gray-800 max-w-lg">
                                    {lore.desc}
                                </p>

                                {/* Stats */}
                                <div className="reveal-item grid gap-3 md:gap-4 pt-2 md:pt-4 max-w-sm">
                                    {[
                                        { label: 'CPU_LOAD', val: lore.stats.strength, icon: Cpu },
                                        { label: 'MEM_SPEED', val: lore.stats.agility, icon: Zap },
                                        { label: 'FIREWALL', val: lore.stats.intelligence, icon: Shield },
                                    ].map((stat, i) => (
                                        <div key={i} className="group">
                                            <div className="flex justify-between text-[10px] font-mono tracking-widest text-gray-500 mb-1 group-hover:text-white transition-colors">
                                                <span className="flex items-center gap-2"><stat.icon size={12}/> {stat.label}</span>
                                                <span>{stat.val}%</span>
                                            </div>
                                            <div className="w-full h-1 bg-gray-900 overflow-hidden">
                                                <div 
                                                    className="h-full bg-[var(--team-color)] shadow-[0_0_10px_currentColor] transition-all duration-1000 ease-out" 
                                                    style={{ '--team-color': team.color, width: `${stat.val}%` } as React.CSSProperties}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button 
                                    onClick={() => handleInitialize(team.id)}
                                    className="reveal-item mt-4 md:mt-6 flex items-center gap-2 text-xs font-bold font-mono text-[var(--team-color)] border border-[var(--team-color)] px-6 py-3 rounded hover:bg-[var(--team-color)] hover:text-black transition-all duration-300 w-full md:w-auto justify-center md:justify-start"
                                    style={{ '--team-color': team.color } as React.CSSProperties}
                                >
                                    <Terminal size={14} /> INITIALIZE_PROTOCOL
                                </button>
                            </div>

                            {/* HOLO CARD */}
                            <div className={`reveal-item flex justify-center perspective-1000 order-1 md:order-none ${isRight ? 'md:col-start-1' : ''} mb-4 md:mb-0`}>
                                <div 
                                    className="relative w-56 h-72 sm:w-72 sm:h-96 md:w-96 md:h-[500px] cursor-pointer group"
                                    onClick={() => handleInitialize(team.id)}
                                >
                                    <div className="absolute inset-0 bg-[#0a0a0a]/80 backdrop-blur-md border border-gray-800 hover:border-[var(--team-color)] transition-all duration-500 rounded-2xl flex flex-col items-center justify-center overflow-hidden shadow-2xl group-hover:shadow-[0_0_50px_var(--glow-color)]"
                                         style={{ '--team-color': team.color, '--glow-color': `${team.color}40` } as React.CSSProperties}
                                    >
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 md:w-64 md:h-64 bg-[var(--team-color)] opacity-10 blur-[80px] rounded-full group-hover:opacity-30 transition-opacity duration-500" style={{ '--team-color': team.color } as React.CSSProperties}></div>

                                        <div className="relative z-10 text-7xl md:text-9xl transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 filter drop-shadow-lg">
                                            {team.logo}
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
            
            {/* End Spacer */}
            <div className="h-48 flex flex-col items-center justify-center bg-gradient-to-t from-black to-transparent space-y-2 opacity-50">
                 <Database className="text-gray-600 animate-pulse" size={24}/>
                 <span className="font-mono text-[10px] tracking-widest text-gray-600">END OF RECORD</span>
            </div>
        </div>
    </div>
  );
};

export default TeamLore;
