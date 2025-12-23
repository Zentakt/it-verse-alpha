
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { Lock, LockOpen, ShieldAlert, Fingerprint, ChevronRight, Activity } from 'lucide-react';

interface PortalProps {
  onComplete: () => void;
}

// --- SHADERS ---

const SINGULARITY_FRAGMENT = `
  uniform float uTime;
  uniform float uProgress; 
  uniform float uOpen;     
  uniform float uShockwave;
  varying vec2 vUv;

  float random (in vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  float noise (in vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  // Function to calculate color channel intensity
  float getChannel(float offset, float r, float a) {
      float spiral = a + (r * 3.0) - (uTime * (2.0 + uOpen * 20.0));
      float n = noise(vec2(r * 4.0 - uTime * 3.0 + offset, spiral));
      return n;
  }

  void main() {
    vec2 center = vUv - 0.5;
    float r = length(center) * 2.0; 
    float a = atan(center.y, center.x);

    // Dynamic RGB Split (Chromatic Aberration) based on energy
    float aberration = 0.02 * uShockwave + 0.015 * uProgress;
    
    float rChannel = getChannel(aberration, r, a);
    float gChannel = getChannel(0.0, r, a);
    float bChannel = getChannel(-aberration, r, a);

    // Ring Shape
    float holeRadius = 0.0 + (uOpen * 4.0); 
    float ring = smoothstep(holeRadius, holeRadius + 0.1, r) * smoothstep(1.0, 0.8, r);

    // Shockwave Ring
    float shock = smoothstep(uShockwave - 0.1, uShockwave, r) * smoothstep(uShockwave + 0.1, uShockwave, r);
    
    // Colors
    vec3 cLocked = vec3(0.0, 0.05, 0.1); 
    vec3 cActive = vec3(0.0, 0.8, 1.0); 
    vec3 cOpen = vec3(1.0, 1.0, 1.0);   
    
    vec3 col = mix(cLocked, cActive, uProgress);
    col = mix(col, cOpen, uOpen);
    
    // Add noise detail with chromatic aberration
    col += vec3(rChannel, gChannel * 0.9, bChannel) * (uProgress + 0.4); 
    
    // Add shockwave (Hot Pink/White)
    col += vec3(1.0, 0.5, 0.9) * shock * 5.0;

    // Alpha
    float alpha = ring * (0.4 + uProgress * 0.6) + shock;
    
    // Hard clip
    if (r > 1.0 && shock < 0.01) alpha = 0.0;
    if (r < holeRadius) alpha = 0.0;

    gl_FragColor = vec4(col, alpha);
  }
`;

const SINGULARITY_VERTEX = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const BEAM_FRAGMENT = `
  uniform float uTime;
  uniform float uOpacity;
  varying vec2 vUv;

  void main() {
    // Holographic Grid Effect
    float scanY = fract(vUv.y * 20.0 - uTime * 4.0);
    float scanX = fract(vUv.x * 20.0);
    
    float lineY = step(0.8, scanY);
    float lineX = step(0.95, scanX);
    
    // Fade out at edges
    float alpha = smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.0, vUv.y); 
    alpha *= smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x); 
    
    vec3 color = vec3(0.0, 1.0, 1.0); 
    
    float intensity = (lineY * 0.5 + lineX * 0.2);
    
    gl_FragColor = vec4(color, intensity * alpha * uOpacity);
  }
`;

const BEAM_VERTEX = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const PortalTransition: React.FC<PortalProps> = ({ onComplete }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [uiState, setUiState] = useState<'locked' | 'scanning' | 'denied' | 'unlocking'>('locked');
  const [scanPercent, setScanPercent] = useState(0); 
  const [flash, setFlash] = useState(false);

  // Logic Refs
  const statusRef = useRef<'locked' | 'unlocking'>('locked');
  const isHoldingRef = useRef(false);
  const progressRef = useRef(0); 
  const lockedChevronsRef = useRef(0);

  // Three.js Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  
  // Stargate Components
  const gateRef = useRef<{
    rotor: THREE.Group;
    glyphs: THREE.Group;
    chevrons: THREE.Group[];
    iris: THREE.Group;
    horizon: THREE.Mesh;
    particles: THREE.Points;
    scanner: THREE.Mesh;
    sparks: THREE.Points;
    stars: THREE.Points;
    lightning: THREE.LineSegments;
  } | null>(null);
  
  // Spark System State
  const sparksRef = useRef<{
    pos: Float32Array;
    vel: Float32Array;
    life: Float32Array;
    activeCount: number;
  }>({
    pos: new Float32Array(300 * 3),
    vel: new Float32Array(300 * 3),
    life: new Float32Array(300),
    activeCount: 0
  });

  const frameIdRef = useRef<number>(0);
  const uniformsRef = useRef({ 
      uTime: { value: 0 }, 
      uProgress: { value: 0 }, 
      uOpen: { value: 0 },
      uShockwave: { value: 0 },
      uBeamOpacity: { value: 0 }
  });

  // --- UNLOCK SEQUENCE ---
  const unlock = useCallback(() => {
    if (statusRef.current !== 'locked') return;
    
    statusRef.current = 'unlocking';
    setUiState('unlocking');
    
    const gate = gateRef.current;
    const cam = cameraRef.current;
    if (!gate || !cam) return;

    const tl = gsap.timeline({
        onComplete: () => onComplete()
    });

    // 0. Disable Scanner & Lightning
    tl.to(uniformsRef.current.uBeamOpacity, { value: 0, duration: 0.2 }, 0);
    if(gate.lightning) gate.lightning.visible = false;

    // 1. FINAL LOCKDOWN
    gate.chevrons.forEach((chev, i) => {
        const mesh = chev.children[1] as THREE.Mesh;
        gsap.to(mesh.material, { emissiveIntensity: 4, color: 0xff00de, duration: 0.2 });
        gsap.to(chev.position, { 
            x: Math.cos((i/8)*Math.PI*2) * 5.6, 
            y: Math.sin((i/8)*Math.PI*2) * 5.6, 
            duration: 0.3,
            ease: "back.out(4)" // Violent lock
        });
    });

    // 2. ANTICIPATION (Pull back)
    tl.to(gate.rotor.scale, { x: 0.9, y: 0.9, duration: 0.4, ease: "power2.in" }, 0);
    tl.to(cam.position, { z: 24, duration: 0.4, ease: "power2.in" }, 0);

    // 3. EXPLOSION & SPIN
    tl.to(gate.rotor.scale, { x: 1.2, y: 1.2, duration: 0.2, ease: "elastic.out(1, 0.3)" }, 0.4);
    tl.to(uniformsRef.current.uShockwave, { value: 2.0, duration: 0.8, ease: "power1.out" }, 0.4);
    
    // Crazy Spin
    tl.to(gate.rotor.rotation, { z: "+=25", duration: 3, ease: "power3.in" }, 0.4);
    tl.to(gate.glyphs.rotation, { z: "-=30", duration: 3, ease: "power3.in" }, 0.4);

    // 4. IRIS OPEN
    tl.to(gate.iris.scale, { x: 0, y: 0, duration: 0.3, ease: "power2.in" }, 0.6);
    tl.to(gate.iris.rotation, { z: "+=3", duration: 0.4, ease: "power2.in" }, 0.6); // Spin iris while opening

    // 5. EVENT HORIZON OPEN
    tl.to(uniformsRef.current.uOpen, { value: 1, duration: 1.0, ease: "expo.in" }, 0.6);
    tl.to(gate.horizon.scale, { x: 8, y: 8, duration: 1.0 }, 0.6);

    // 6. WARP STARS (Stretch Z)
    tl.to(gate.stars.scale, { z: 40, duration: 1.5, ease: "expo.in" }, 0.6);

    // 7. FLASH BANG
    tl.call(() => setFlash(true), [], 0.7);

    // 8. PARTICLE SUCK
    tl.to(gate.particles.scale, { x: 0.001, y: 0.001, duration: 0.5 }, 0.6);

    // 9. CAMERA WARP (Through the gate)
    tl.to(cam.position, { z: -150, duration: 1.2, ease: "expo.in" }, 0.8);
    
    // Fade UI
    gsap.to(mountRef.current, { opacity: 0, duration: 0.5, delay: 1.5 });

  }, [onComplete]);

  const startScan = () => {
    if (statusRef.current !== 'locked') return;
    isHoldingRef.current = true;
    setUiState('scanning');
  };

  const stopScan = () => {
    if (statusRef.current !== 'locked') return;
    isHoldingRef.current = false;
    
    if (progressRef.current < 1.0) {
        setUiState('denied');
        
        if(cameraRef.current) {
            gsap.fromTo(cameraRef.current.position, 
                { x: -0.5 }, 
                { x: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" }
            );
        }
        setTimeout(() => {
            if (statusRef.current === 'locked') setUiState('locked');
        }, 600);
    }
  };

  const spawnSparks = (position: THREE.Vector3) => {
      const count = 30; // Sparks per impact
      const { pos, vel, life } = sparksRef.current;
      
      // Find inactive particles
      let spawned = 0;
      for (let i = 0; i < life.length; i++) {
          if (life[i] <= 0 && spawned < count) {
              pos[i*3] = position.x;
              pos[i*3+1] = position.y;
              pos[i*3+2] = position.z;
              
              // Random velocity explosion
              const speed = 0.2 + Math.random() * 0.4;
              const angle = Math.random() * Math.PI * 2;
              const zSpread = (Math.random() - 0.5) * 1.0;
              
              vel[i*3] = Math.cos(angle) * speed;
              vel[i*3+1] = Math.sin(angle) * speed;
              vel[i*3+2] = zSpread;
              
              life[i] = 1.0; // Full life
              spawned++;
          }
      }
  };

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
  }, []);

  // --- THREE.JS SCENE ---
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05050a, 0.02);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 500);
    camera.position.set(0, 0, 16);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    canvasContainerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- GEOMETRY ---
    
    // 1. ROTOR
    const rotorGroup = new THREE.Group();
    const segmentCount = 18;
    const rotorRadius = 6.2;
    const segmentGeo = new THREE.BoxGeometry(1.5, 0.4, 0.8);
    const segmentMat = new THREE.MeshStandardMaterial({ 
        color: 0x1e293b, 
        roughness: 0.3, 
        metalness: 0.9,
        emissive: 0x00ffff,
        emissiveIntensity: 0
    });

    for(let i=0; i<segmentCount; i++) {
        const angle = (i / segmentCount) * Math.PI * 2;
        const mesh = new THREE.Mesh(segmentGeo, segmentMat.clone()); // Clone for individual glow
        mesh.position.set(Math.cos(angle)*rotorRadius, Math.sin(angle)*rotorRadius, -0.2);
        mesh.rotation.z = angle;
        rotorGroup.add(mesh);
    }
    scene.add(rotorGroup);

    // 2. GLYPH RING
    const glyphsGroup = new THREE.Group();
    const glyphCount = 36;
    const glyphRadius = 5.2;
    const glyphGeo = new THREE.PlaneGeometry(0.3, 0.1);
    const glyphMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, side: THREE.DoubleSide });
    for(let i=0; i<glyphCount; i++) {
        const angle = (i / glyphCount) * Math.PI * 2;
        const glyph = new THREE.Mesh(glyphGeo, glyphMat);
        glyph.position.set(Math.cos(angle)*glyphRadius, Math.sin(angle)*glyphRadius, 0.1);
        glyph.rotation.z = angle;
        glyphsGroup.add(glyph);
    }
    scene.add(glyphsGroup);

    // 3. MECHANICAL CHEVRONS
    const chevrons: THREE.Group[] = [];
    const pistonGeo = new THREE.CylinderGeometry(0.2, 0.2, 2);
    const headGeo = new THREE.BoxGeometry(1.2, 1, 0.8);
    const lightGeo = new THREE.BoxGeometry(0.6, 0.2, 0.9);
    
    const pistonMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
    const headMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });
    const lightMat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x00ffff, emissiveIntensity: 0 });

    for(let i=0; i<8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const group = new THREE.Group();
        const piston = new THREE.Mesh(pistonGeo, pistonMat);
        piston.rotation.z = Math.PI / 2;
        piston.position.x = 1;
        group.add(piston);
        const head = new THREE.Mesh(headGeo, headMat);
        group.add(head);
        const light = new THREE.Mesh(lightGeo, lightMat.clone());
        group.add(light);

        const r = 7.0; 
        group.position.set(Math.cos(angle)*r, Math.sin(angle)*r, 0.2);
        group.rotation.z = angle;
        chevrons.push(group);
        scene.add(group);
    }

    // 4. IRIS
    const irisGroup = new THREE.Group();
    const bladeGeo = new THREE.BufferGeometry();
    const vertices = new Float32Array([0, 0, 0, -1.2, 5, 0, 1.2, 5, 0]);
    bladeGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.4, metalness: 0.6, side: THREE.DoubleSide });
    for(let i=0; i<12; i++) {
         const angle = (i / 12) * Math.PI * 2;
         const blade = new THREE.Mesh(bladeGeo, bladeMat);
         blade.rotation.z = angle - 0.4;
         blade.position.z = i * 0.005;
         irisGroup.add(blade);
    }
    scene.add(irisGroup);

    // 5. EVENT HORIZON
    const horizonGeo = new THREE.PlaneGeometry(10, 10);
    const horizonMat = new THREE.ShaderMaterial({
        vertexShader: SINGULARITY_VERTEX,
        fragmentShader: SINGULARITY_FRAGMENT,
        uniforms: uniformsRef.current,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const horizon = new THREE.Mesh(horizonGeo, horizonMat);
    horizon.position.z = -0.5;
    scene.add(horizon);

    // 6. SUCTION PARTICLES
    const pGeo = new THREE.BufferGeometry();
    const pCount = 600;
    const pPos = new Float32Array(pCount * 3);
    for(let i=0; i<pCount; i++) {
        const r = 8 + Math.random() * 5;
        const theta = Math.random() * Math.PI * 2;
        pPos[i*3] = Math.cos(theta) * r;
        pPos[i*3+1] = Math.sin(theta) * r;
        pPos[i*3+2] = (Math.random() - 0.5) * 5;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({ color: 0x60a5fa, size: 0.08, transparent: true, opacity: 0.6 });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // 7. VOLUMETRIC SCANNER BEAM
    const beamGeo = new THREE.ConeGeometry(4, 12, 32, 1, true);
    beamGeo.translate(0, 6, 0); 
    beamGeo.rotateX(Math.PI / 2);
    const beamMat = new THREE.ShaderMaterial({
        uniforms: uniformsRef.current,
        vertexShader: BEAM_VERTEX,
        fragmentShader: BEAM_FRAGMENT,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
    });
    const scanner = new THREE.Mesh(beamGeo, beamMat);
    scanner.position.z = 2;
    scene.add(scanner);

    // 8. SPARKS SYSTEM
    const sparksGeo = new THREE.BufferGeometry();
    sparksGeo.setAttribute('position', new THREE.BufferAttribute(sparksRef.current.pos, 3));
    const sparksMat = new THREE.PointsMaterial({ color: 0xffaa00, size: 0.15, transparent: true, blending: THREE.AdditiveBlending });
    const sparks = new THREE.Points(sparksGeo, sparksMat);
    scene.add(sparks);

    // 9. STARS (Background Warp)
    const starsGeo = new THREE.BufferGeometry();
    const starsPos = new Float32Array(1000 * 3);
    for(let i=0; i<1000; i++) {
        starsPos[i*3] = (Math.random()-0.5) * 200;
        starsPos[i*3+1] = (Math.random()-0.5) * 200;
        starsPos[i*3+2] = -50 - Math.random() * 100;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starsPos, 3));
    const starsMat = new THREE.PointsMaterial({ color: 0xaaaaaa, size: 0.5 });
    const stars = new THREE.Points(starsGeo, starsMat);
    scene.add(stars);

    // 10. LIGHTNING ARCS
    const lightningGeo = new THREE.BufferGeometry();
    const lightningMaxPoints = 8 * 12 * 3; // 8 active chevrons max, 12 segments per bolt
    const lightningPos = new Float32Array(lightningMaxPoints);
    lightningGeo.setAttribute('position', new THREE.BufferAttribute(lightningPos, 3));
    const lightningMat = new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending });
    const lightning = new THREE.LineSegments(lightningGeo, lightningMat);
    scene.add(lightning);

    gateRef.current = { rotor: rotorGroup, glyphs: glyphsGroup, chevrons, iris: irisGroup, horizon, particles, scanner, sparks, stars, lightning };

    // LIGHTS
    const ambient = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambient);
    const keyLight = new THREE.PointLight(0x00ffff, 1, 30);
    keyLight.position.set(5, 5, 10);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0xff00de, 0.5, 20);
    rimLight.position.set(-5, -5, 5);
    scene.add(rimLight);

    // --- ANIMATION LOOP ---
    const clock = new THREE.Clock();

    const animate = () => {
        frameIdRef.current = requestAnimationFrame(animate);
        const time = clock.getElapsedTime();
        const delta = 0.016;

        uniformsRef.current.uTime.value = time;
        uniformsRef.current.uProgress.value = progressRef.current;

        // IDLE ANIMATIONS
        const spinSpeed = 0.002 + (progressRef.current * 0.2); // Accelerate spin
        rotorGroup.rotation.z -= spinSpeed; 
        glyphsGroup.rotation.z += spinSpeed * 1.5;

        // ROTOR GLOW EFFECT
        if (statusRef.current === 'locked') {
            rotorGroup.children.forEach((mesh) => {
                const m = (mesh as THREE.Mesh).material as THREE.MeshStandardMaterial;
                m.emissiveIntensity = progressRef.current * 0.5;
            });
        }

        // PARTICLES (Vortex)
        if (statusRef.current === 'locked') {
            const positions = particles.geometry.attributes.position.array as Float32Array;
            const speed = 0.05 + (progressRef.current * 0.8);
            for(let i=0; i<pCount; i++) {
                let x = positions[i*3];
                let y = positions[i*3+1];
                let z = positions[i*3+2];
                // Suction
                x *= (1 - speed * 0.01);
                y *= (1 - speed * 0.01);
                // Rotate
                const angle = speed * 0.05;
                const nx = x * Math.cos(angle) - y * Math.sin(angle);
                const ny = x * Math.sin(angle) + y * Math.cos(angle);
                // Respawn
                if (Math.abs(nx) < 0.5 && Math.abs(ny) < 0.5) {
                     const r = 10 + Math.random() * 5;
                     const theta = Math.random() * Math.PI * 2;
                     positions[i*3] = Math.cos(theta) * r;
                     positions[i*3+1] = Math.sin(theta) * r;
                } else {
                    positions[i*3] = nx;
                    positions[i*3+1] = ny;
                }
            }
            particles.geometry.attributes.position.needsUpdate = true;
        }

        // LIGHTNING SYSTEM
        if (statusRef.current === 'locked') {
             const activeCount = Math.floor(progressRef.current * 8);
             const lPos = lightning.geometry.attributes.position.array as Float32Array;
             let idx = 0;
             
             for(let i=0; i<activeCount; i++) {
                 // Calculate Chevron Position
                 const angle = (i / 8) * Math.PI * 2;
                 const r = 5.6; // Inner locked radius
                 // Rotor rotation affects chevron alignment visually, but we are connecting to mechanical chevrons which are static relative to rotor spin? 
                 // Actually chevrons are static in rotation (0, 45, 90...).
                 const startX = Math.cos(angle) * r;
                 const startY = Math.sin(angle) * r;
                 
                 // Generate bolt
                 let cx = startX;
                 let cy = startY;
                 let cz = 0.5;
                 
                 for(let s=0; s<12; s++) {
                     lPos[idx++] = cx;
                     lPos[idx++] = cy;
                     lPos[idx++] = cz;

                     const progress = (s + 1) / 12;
                     const tx = 0; // Target center
                     const ty = 0;
                     const tz = -0.5;
                     
                     // Next point with jitter
                     const jitter = (1 - progress) * 0.5; // More jitter near outside
                     const nextX = startX + (tx - startX) * progress + (Math.random()-0.5)*jitter;
                     const nextY = startY + (ty - startY) * progress + (Math.random()-0.5)*jitter;
                     const nextZ = cz + (tz - cz) * progress + (Math.random()-0.5)*jitter;
                     
                     lPos[idx++] = nextX;
                     lPos[idx++] = nextY;
                     lPos[idx++] = nextZ;
                     
                     cx = nextX; cy = nextY; cz = nextZ;
                 }
             }
             // Clear remaining
             for(let k=idx; k<lightningMaxPoints; k++) lPos[k] = 0;
             lightning.geometry.attributes.position.needsUpdate = true;
        }

        // SPARKS PHYSICS
        const { pos, vel, life } = sparksRef.current;
        let activeSparks = false;
        for(let i=0; i<life.length; i++) {
            if (life[i] > 0) {
                activeSparks = true;
                life[i] -= 0.03; // Fade out
                pos[i*3] += vel[i*3];
                pos[i*3+1] += vel[i*3+1];
                pos[i*3+2] += vel[i*3+2];
                // Gravity
                vel[i*3+1] -= 0.015;
                // Floor bounce
                if (pos[i*3+1] < -8 && vel[i*3+1] < 0) {
                    vel[i*3+1] *= -0.5;
                    vel[i*3] *= 0.8;
                }
            } else {
                // Hide
                pos[i*3] = 0; pos[i*3+1] = 0; pos[i*3+2] = -1000;
            }
        }
        if (activeSparks) sparks.geometry.attributes.position.needsUpdate = true;

        // LOGIC
        if (statusRef.current === 'locked') {
            if (isHoldingRef.current) {
                progressRef.current = Math.min(1, progressRef.current + (delta * 0.6));
                if (progressRef.current >= 1) {
                    isHoldingRef.current = false;
                    unlock();
                }
                // Scanner Beam
                uniformsRef.current.uBeamOpacity.value = Math.min(1, uniformsRef.current.uBeamOpacity.value + 0.1);
                scanner.rotation.z -= 0.15; 
                scanner.scale.setScalar(1 + Math.sin(time*30)*0.1); 
            } else {
                progressRef.current = Math.max(0, progressRef.current - (delta * 2.0));
                uniformsRef.current.uBeamOpacity.value = Math.max(0, uniformsRef.current.uBeamOpacity.value - 0.1);
            }
            setScanPercent(Math.floor(progressRef.current * 100));

            // CHEVRONS
            const activeCount = Math.floor(progressRef.current * 8);
            
            // Impact Trigger
            if (activeCount > lockedChevronsRef.current) {
                // 1. Shake Camera
                const intensity = 0.5;
                gsap.fromTo(camera.position, 
                    { x: (Math.random()-0.5)*intensity, y: (Math.random()-0.5)*intensity },
                    { x: 0, y: 0, duration: 0.2, ease: "elastic.out(1, 0.3)" }
                );
                // 2. Flash Light
                keyLight.intensity = 8;
                gsap.to(keyLight, { intensity: 1, duration: 0.3 });

                // 3. Recoil Rotor
                gsap.to(rotorGroup.rotation, { z: "-=0.3", duration: 0.2, yoyo: true, repeat: 1 });

                // 4. Spawn Sparks
                const chevronIndex = activeCount - 1; 
                const angle = (chevronIndex / 8) * Math.PI * 2;
                const impactPos = new THREE.Vector3(Math.cos(angle)*5.6, Math.sin(angle)*5.6, 0.5);
                spawnSparks(impactPos);

                lockedChevronsRef.current = activeCount;
            } else if (activeCount < lockedChevronsRef.current) {
                lockedChevronsRef.current = activeCount;
            }

            chevrons.forEach((chev, i) => {
                const isLocked = i < activeCount;
                const mat = (chev.children[2] as THREE.Mesh).material as THREE.MeshStandardMaterial;
                const targetR = isLocked ? 5.6 : 6.8;
                const currentR = Math.sqrt(chev.position.x**2 + chev.position.y**2);
                
                // Snap movement
                const dist = targetR - currentR;
                const newR = currentR + dist * 0.4; // Faster snap
                
                const angle = (i / 8) * Math.PI * 2;
                chev.position.set(Math.cos(angle)*newR, Math.sin(angle)*newR, 0.2);

                mat.emissiveIntensity = isLocked ? 2 : 0;
            });
        } 

        renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
        if(!canvasContainerRef.current) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(frameIdRef.current);
        if (canvasContainerRef.current && renderer.domElement) {
            canvasContainerRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
    };
  }, [unlock]);

  return (
    <div 
        ref={mountRef} 
        className="fixed inset-0 z-[100] bg-[#05050a] select-none overflow-hidden"
    >
        {/* WHITE FLASH OVERLAY */}
        <div className={`absolute inset-0 z-[120] bg-white pointer-events-none transition-opacity duration-1000 ${flash ? 'opacity-100' : 'opacity-0'}`}></div>

        {/* BACKGROUND 3D LAYER */}
        <div ref={canvasContainerRef} className="absolute inset-0 z-0" />
        
        {/* FOREGROUND UI LAYER */}
        <div 
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-8 md:gap-12 cursor-pointer touch-none"
            onPointerDown={startScan}
            onPointerUp={stopScan}
            onPointerLeave={stopScan}
        >
            {/* Header */}
            <div className={`transition-all duration-300 flex flex-col items-center text-center ${uiState === 'unlocking' ? 'opacity-0 -translate-y-10' : 'opacity-100'}`}>
                 <div className="flex items-center justify-center gap-2 text-cyan-400 mb-2">
                    <ShieldAlert size={16} />
                    <span className="text-xs font-mono font-bold tracking-[0.3em]">SECURE GATEWAY</span>
                 </div>
                 <h1 className="text-4xl md:text-5xl font-black font-cyber text-white tracking-widest drop-shadow-[0_0_15px_rgba(0,255,255,0.5)]">
                    QUANTUM LOCK
                </h1>
            </div>

            {/* Center Interactive Zone */}
            <div className={`relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center transition-all duration-300 ${uiState === 'unlocking' ? 'scale-150 blur-sm opacity-0' : ''}`}>
                 
                 {/* Dynamic Scan Ring SVG */}
                 <div className="absolute inset-0 pointer-events-none">
                     <svg className="w-full h-full -rotate-90">
                         <circle cx="50%" cy="50%" r="48%" fill="none" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 4" />
                         {/* Active Progress */}
                         <circle 
                            cx="50%" cy="50%" r="48%" 
                            fill="none" 
                            stroke={uiState === 'denied' ? '#ef4444' : '#00ffff'} 
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray="300" 
                            strokeDashoffset={300 - (scanPercent * 3)}
                            className="transition-all duration-75 ease-linear drop-shadow-[0_0_10px_currentColor]"
                        />
                     </svg>
                </div>

                {/* Central UI Icon */}
                <div className={`
                    w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center 
                    bg-black/40 backdrop-blur-md border border-cyan-500/30
                    transition-all duration-200 group
                    ${uiState === 'scanning' ? 'scale-105 border-cyan-400 shadow-[0_0_40px_rgba(0,255,255,0.3)] animate-vibrate' : ''}
                    ${uiState === 'denied' ? 'border-red-500 animate-shake shadow-[0_0_40px_rgba(239,68,68,0.4)]' : ''}
                `}>
                     {uiState === 'unlocking' ? (
                        <LockOpen size={40} className="text-white" />
                     ) : uiState === 'scanning' ? (
                         <div className="relative">
                            <Fingerprint size={48} className="text-cyan-400 animate-pulse relative z-10" />
                            <div className="absolute inset-0 bg-cyan-400 blur-xl opacity-50 animate-pulse"></div>
                         </div>
                     ) : (
                        <Lock size={40} className={`transition-colors duration-300 ${uiState === 'denied' ? 'text-red-500' : 'text-gray-400'}`} />
                     )}
                </div>
            </div>

            {/* Footer Status */}
            <div className={`transition-all duration-300 h-20 flex flex-col items-center justify-center ${uiState === 'unlocking' ? 'opacity-0 translate-y-10' : 'opacity-100'}`}>
                 {uiState === 'scanning' ? (
                    <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold tracking-[0.2em] animate-pulse">
                            <Activity size={14} /> ENGAGING CHEVRONS... {scanPercent}%
                        </div>
                        {/* Visual Segments */}
                        <div className="flex gap-1">
                             {[...Array(8)].map((_, i) => (
                                 <div 
                                    key={i} 
                                    className={`w-3 h-1 md:w-4 md:h-1.5 rounded-sm transition-colors duration-100 ${i < (scanPercent / 12.5) ? 'bg-cyan-400 shadow-[0_0_8px_#00ffff]' : 'bg-gray-800'}`} 
                                 />
                             ))}
                        </div>
                    </div>
                ) : uiState === 'denied' ? (
                    <div className="text-red-500 font-mono text-sm font-bold tracking-[0.2em] animate-pulse">
                        AUTHORIZATION FAILED
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-400 animate-bounce">
                        <ChevronRight className="-rotate-90" size={20} />
                        <div className="font-mono text-[10px] tracking-[0.3em] uppercase">
                            Hold to Initialize
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Global Styles for Custom Animations */}
        <style dangerouslySetInnerHTML={{__html: `
            @keyframes vibrate {
                0% { transform: translate(0); }
                20% { transform: translate(-2px, 2px); }
                40% { transform: translate(-2px, -2px); }
                60% { transform: translate(2px, 2px); }
                80% { transform: translate(2px, -2px); }
                100% { transform: translate(0); }
            }
            .animate-vibrate {
                animation: vibrate 0.1s linear infinite;
            }
        `}} />

        {/* Background Vignette */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,#000000_100%)] opacity-80 z-20"></div>
    </div>
  );
};

export default PortalTransition;
