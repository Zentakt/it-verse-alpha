
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { TEAMS } from '../constants';

interface FactionEntryProps {
  teamId: string;
  onComplete: () => void;
}

// --- SHARED UTILS ---

const createNoiseTexture = () => {
  const size = 512;
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size * 4; i++) {
    data[i] = Math.random() * 255;
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.needsUpdate = true;
  return texture;
};

// --- SCENE 1: PYTHON (The Digital Ouroboros) ---
// Concept: High-speed intake tunnel of code.
const createPythonScene = (scene: THREE.Scene, color: THREE.Color, isMobile: boolean) => {
    // 1. DYNAMIC CODE TEXTURE
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 1024; // Taller for better scroll
    const ctx = canvas.getContext('2d');
    if(ctx) {
        ctx.fillStyle = '#000000'; ctx.fillRect(0,0,512,1024);
        ctx.font = '24px "Courier New", monospace';
        const cols = 20;
        const rows = 40;
        for(let i=0; i<cols; i++) {
            for(let j=0; j<rows; j++) {
                const char = Math.random() > 0.5 ? '1' : '0';
                const x = i * 25 + Math.random() * 5;
                const y = j * 25 + Math.random() * 5;
                
                // Matrix green highlights
                const isHighlight = Math.random() > 0.9;
                ctx.fillStyle = isHighlight ? '#4ade80' : '#166534'; // Bright green vs dark green
                if (Math.random() > 0.98) ctx.fillStyle = '#ffffff'; // White spark
                
                ctx.fillText(char, x, y);
                
                // Occasional python keyword
                if(Math.random() > 0.99) {
                     ctx.fillStyle = '#ffffff';
                     ctx.fillText(['def', 'class', 'import', 'self'][Math.floor(Math.random()*4)], x, y);
                }
            }
        }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;

    // 2. TUBE SHADER (Warp Speed)
    const material = new THREE.ShaderMaterial({
        side: THREE.BackSide,
        transparent: true,
        blending: THREE.AdditiveBlending,
        uniforms: {
            uTime: { value: 0 },
            uColor: { value: color },
            uTexture: { value: tex },
            uDistortion: { value: 0 },
            uSpeed: { value: 0 },
            uAlpha: { value: 0 }
        },
        vertexShader: `
            varying vec2 vUv;
            varying float vDepth;
            uniform float uTime;
            uniform float uDistortion;

            void main() {
                vUv = uv;
                vec3 pos = position;
                
                // Breathing/Pulse
                float pulse = sin(pos.z * 0.2 + uTime * 4.0) * 0.5;
                float twist = sin(pos.z * 0.1 - uTime * 2.0) * 0.5;
                
                // Apply distortion based on progress (uDistortion)
                float intensity = uDistortion * 2.0;
                
                // Widen the tunnel opening slightly as we speed up
                pos.xy *= (1.0 + intensity * 0.2);
                
                // Add organic wave
                pos.x += pulse * intensity;
                pos.y += twist * intensity;

                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                vDepth = -mvPosition.z;
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            varying vec2 vUv;
            varying float vDepth;
            uniform sampler2D uTexture;
            uniform vec3 uColor;
            uniform float uTime;
            uniform float uAlpha;
            uniform float uSpeed;

            void main() {
                vec2 uv = vUv;
                uv.x *= 8.0; // Repeat around circumference
                
                // High speed scroll
                uv.y += uTime * uSpeed; 
                
                vec4 tex = texture2D(uTexture, uv);
                
                // Depth Fog (Fade into darkness far away)
                float fog = smoothstep(100.0, 20.0, vDepth);
                
                // Color grading
                vec3 col = uColor * tex.r;
                
                // Overdrive brightness at high speed
                col *= (1.0 + uSpeed * 0.5);
                
                // Scanlines for digital feel
                float scan = abs(sin(uv.y * 50.0));
                col += uColor * scan * 0.2;

                gl_FragColor = vec4(col, fog * uAlpha * tex.a);
            }
        `
    });

    // 3. CURVED TUNNEL GEOMETRY
    const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 10),
        new THREE.Vector3(2, -2, -40),
        new THREE.Vector3(-2, 2, -90),
        new THREE.Vector3(0, 0, -150)
    ]);
    const geo = new THREE.TubeGeometry(curve, 64, 6, 16, false);
    const mesh = new THREE.Mesh(geo, material);
    scene.add(mesh);

    // 4. DATA DEBRIS (Looping Particles)
    const pCount = isMobile ? 300 : 800;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    const pSpeed = new Float32Array(pCount);
    
    for(let i=0; i<pCount; i++) {
        pPos[i*3] = (Math.random()-0.5) * 15;
        pPos[i*3+1] = (Math.random()-0.5) * 15;
        pPos[i*3+2] = -Math.random() * 150; 
        pSpeed[i] = 1.0 + Math.random();
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    
    // Streaks instead of dots
    const pMat = new THREE.PointsMaterial({ 
        color: 0xffffff, 
        size: 0.4, 
        transparent: true, 
        opacity: 0,
        blending: THREE.AdditiveBlending 
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // 5. ANIMATION HOOK
    return (t: number, progress: number) => {
        // Ramping up speed
        const speed = 1.0 + Math.pow(progress, 3) * 15.0; // Explosive speed at end
        
        material.uniforms.uTime.value = t;
        material.uniforms.uSpeed.value = speed;
        material.uniforms.uDistortion.value = progress;
        material.uniforms.uAlpha.value = Math.min(1, progress * 3);

        // Particle Loop
        const positions = particles.geometry.attributes.position.array as Float32Array;
        const moveDist = speed * 0.5; // Scale relative to texture speed
        
        for(let i=0; i<pCount; i++) {
            // Move +Z (towards camera)
            positions[i*3+2] += moveDist * pSpeed[i];
            
            // Loop
            if(positions[i*3+2] > 5) {
                positions[i*3+2] = -150;
                // Randomize xy to feel like new debris
                const spread = 8 + (progress * 10);
                positions[i*3] = (Math.random()-0.5) * spread;
                positions[i*3+1] = (Math.random()-0.5) * spread;
            }
        }
        particles.geometry.attributes.position.needsUpdate = true;
        
        // Match rotation speed to tunnel visual
        particles.rotation.z = -t * 0.5;
        pMat.opacity = progress;
    };
};

// --- SCENE 2: AJAX (The Quantum Slipstream) ---
// Concept: Hyperspace tunnel with lightning veins and passing energy rings.
const createAjaxScene = (scene: THREE.Scene, color: THREE.Color, isMobile: boolean) => {
    // 1. THE SLIPSTREAM TUNNEL (Shader)
    const tunnelGeo = new THREE.CylinderGeometry(12, 4, 150, 32, 32, true);
    tunnelGeo.rotateX(-Math.PI / 2); // Align with Z
    
    const tunnelMat = new THREE.ShaderMaterial({
        side: THREE.BackSide,
        transparent: true,
        blending: THREE.AdditiveBlending,
        uniforms: {
            uTime: { value: 0 },
            uColor: { value: color },
            uSpeed: { value: 0 },
            uDistortion: { value: 0 }
        },
        vertexShader: `
            varying vec2 vUv;
            varying float vDepth;
            uniform float uTime;
            uniform float uDistortion;
            void main() {
                vUv = uv;
                vec3 pos = position;
                // Warping the tunnel
                float twist = sin(pos.z * 0.05 + uTime * 5.0) * uDistortion;
                pos.x += twist * 4.0;
                pos.y += cos(pos.z * 0.05 + uTime * 4.0) * uDistortion * 4.0;
                
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                vDepth = -mvPosition.z;
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            varying vec2 vUv;
            varying float vDepth;
            uniform float uTime;
            uniform float uSpeed;
            uniform vec3 uColor;
            
            float random(vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123); }

            void main() {
                vec2 uv = vUv;
                uv.y += uTime * uSpeed; // Scroll texture along length
                
                // Lightning veins
                vec2 grid = uv * vec2(30.0, 4.0);
                float noise = random(floor(grid));
                float bolt = step(0.97, noise);
                
                // Fast Streaks
                float streaks = smoothstep(0.4, 0.6, sin(uv.x * 60.0 + uv.y * 20.0));
                
                // Energy Pulse
                float pulse = sin(uv.y * 10.0 - uTime * 10.0) * 0.5 + 0.5;
                
                vec3 col = uColor * (bolt * 4.0 + streaks * 0.8 + pulse * 0.2);
                
                // Depth fade (fog)
                float alpha = smoothstep(120.0, 50.0, vDepth) * smoothstep(0.0, 20.0, vDepth);
                
                gl_FragColor = vec4(col, alpha);
            }
        `
    });
    const tunnel = new THREE.Mesh(tunnelGeo, tunnelMat);
    tunnel.position.z = -50;
    scene.add(tunnel);

    // 2. HYPER DEBRIS (InstancedMesh)
    const count = isMobile ? 600 : 1500;
    const debrisGeo = new THREE.BoxGeometry(0.1, 0.1, 2);
    const debrisMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const debris = new THREE.InstancedMesh(debrisGeo, debrisMat, count);
    
    const dummy = new THREE.Object3D();
    const debrisData: {x:number, y:number, z:number, speed:number}[] = [];
    
    for(let i=0; i<count; i++) {
        const r = 2 + Math.random() * 12; // Wider spread
        const theta = Math.random() * Math.PI * 2;
        const x = Math.cos(theta) * r;
        const y = Math.sin(theta) * r;
        const z = -Math.random() * 200;
        debrisData.push({ x, y, z, speed: 1 + Math.random() });
        dummy.position.set(x,y,z);
        dummy.updateMatrix();
        debris.setMatrixAt(i, dummy.matrix);
    }
    scene.add(debris);

    // 3. ENERGY RINGS PASSING BY
    const ringGeo = new THREE.TorusGeometry(8, 0.2, 8, 32);
    const ringMat = new THREE.MeshBasicMaterial({ 
        color: new THREE.Color(0xccffff), // Bright white-cyan
        transparent: true, 
        opacity: 0 
    });
    
    const rings: THREE.Mesh[] = [];
    for(let i=0; i<3; i++) {
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.z = -200; // Far away
        scene.add(ring);
        rings.push(ring);
    }

    // 4. CENTRAL LIGHTNING CORE
    const coreGeo = new THREE.CylinderGeometry(0.2, 0.2, 100, 8, 1, true);
    coreGeo.rotateX(-Math.PI/2);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending });
    const core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);

    return (t: number, progress: number) => {
        // Tunnel Shader Params
        tunnelMat.uniforms.uTime.value = t;
        // Exponential speed ramping
        const speedMultiplier = 1.0 + Math.pow(progress, 3) * 20.0; 
        tunnelMat.uniforms.uSpeed.value = 2.0 * speedMultiplier; 
        tunnelMat.uniforms.uDistortion.value = progress * 1.5;
        
        // --- DEBRIS WARP ---
        // Calculate a Z offset that accelerates
        const warpZ = (t * 40) + (progress * 800); 
        
        for(let i=0; i<count; i++) {
            const d = debrisData[i];
            let z = d.z + warpZ * d.speed;
            z = (z % 200) - 200; // Loop between -200 and 0
            if(z > 10) z -= 200; // Safety reset

            dummy.position.set(d.x, d.y, z);
            // Stretch based on speed (progress)
            dummy.scale.z = 1 + (progress * 40); 
            // Rotation adds chaos
            dummy.rotation.z = t * 5 + i;
            dummy.updateMatrix();
            debris.setMatrixAt(i, dummy.matrix);
        }
        debris.instanceMatrix.needsUpdate = true;
        
        // --- PASSING RINGS ---
        rings.forEach((ring, i) => {
             // Staggered waves
             const cycle = (t * 2 + i * 2) % 4; // 0 to 4s cycle
             // Map cycle to Z position: Start -150, End 10 (behind cam)
             const zPos = -150 + (cycle / 4) * 160;
             
             ring.position.z = zPos;
             ring.rotation.z = t * 4 * (i%2===0 ? 1 : -1);
             // Scale down as they get closer to simulate tunnel perspective trickery
             ring.scale.setScalar(1.0 - (zPos/ -150) * 0.5);
             
             // Fade in then out
             const dist = Math.abs(zPos + 50); // Peak near -50
             const alpha = Math.max(0, 1.0 - dist * 0.02) * progress;
             ringMat.opacity = alpha;
        });

        // --- CORE FLASH ---
        if (progress > 0.6) {
             coreMat.opacity = Math.random() * progress;
             core.scale.x = 1 + Math.random() * 2;
             core.scale.y = 1 + Math.random() * 2;
        }

        // --- COLOR BLOWOUT ---
        // As we reach max speed, everything goes white
        if (progress > 0.8) {
            tunnelMat.uniforms.uColor.value.lerp(new THREE.Color(0xffffff), 0.1);
            debrisMat.color.lerp(new THREE.Color(0xffffff), 0.1);
        }
    };
};

// --- SCENE 3: JAVA (The Obsidian Cathedral) ---
// Concept: High-tech, monochromatic server fortress. No yellow. Pure data energy.
const createJavaScene = (scene: THREE.Scene, color: THREE.Color, isMobile: boolean) => {
    // 1. SETUP
    scene.fog = new THREE.FogExp2(0x000000, 0.03);

    // 2. INSTANCED MONOLITHS (SERVERS)
    const count = isMobile ? 40 : 100;
    const geo = new THREE.BoxGeometry(4, 60, 4);

    // High-tech server shader (Monochromatic)
    const mat = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uColor: { value: color },
            uProgress: { value: 0 }
        },
        vertexShader: `
            varying vec2 vUv;
            varying float vY;
            varying float vRand;
            attribute float aRandom;
            attribute float aSpeed;
            varying float vSpeed;

            void main() {
                vUv = uv;
                vRand = aRandom;
                vSpeed = aSpeed;
                vec4 worldPos = instanceMatrix * vec4(position, 1.0);
                vY = worldPos.y;
                gl_Position = projectionMatrix * viewMatrix * worldPos;
            }
        `,
        fragmentShader: `
            varying vec2 vUv;
            varying float vY;
            varying float vRand;
            varying float vSpeed;
            uniform float uTime;
            uniform vec3 uColor;
            uniform float uProgress;

            void main() {
                // Circuitry Pattern
                vec2 grid = fract(vUv * vec2(1.0, 15.0)); // Vertical segments
                float line = step(0.1, grid.y) * step(0.1, grid.x);
                
                // Data pulses moving upwards
                float pulseSpeed = 2.0 + vSpeed * 5.0 + (uProgress * 10.0);
                float pulse = fract(vUv.y * 2.0 - uTime * 0.5 * pulseSpeed);
                float beam = smoothstep(0.8, 1.0, pulse);
                
                // Base material (Dark Obsidian)
                vec3 base = vec3(0.05, 0.05, 0.08);
                
                // Emission (Team Color Only)
                vec3 glow = uColor * beam * 2.0;
                
                // Status Lights (Blinking)
                float blink = step(0.95, sin(uTime * 5.0 + vRand * 100.0));
                vec3 lights = uColor * blink * step(0.9, vUv.x) * step(0.9, fract(vUv.y * 30.0));

                vec3 finalColor = base + glow + lights;
                
                // Vertical gradient fade at top/bottom of geometry
                finalColor *= smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.9, vUv.y);

                gl_FragColor = vec4(finalColor, 1.0);
            }
        `
    });

    const mesh = new THREE.InstancedMesh(geo, mat, count);
    const randoms = new Float32Array(count);
    const speeds = new Float32Array(count);
    for(let i=0; i<count; i++) {
        randoms[i] = Math.random();
        speeds[i] = Math.random();
    }
    geo.setAttribute('aRandom', new THREE.InstancedBufferAttribute(randoms, 1));
    geo.setAttribute('aSpeed', new THREE.InstancedBufferAttribute(speeds, 1));
    scene.add(mesh);

    // 3. REFLECTIVE DATA FLOOR
    const floorGeo = new THREE.PlaneGeometry(100, 400);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uColor: { value: color }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec2 vUv;
            uniform float uTime;
            uniform vec3 uColor;

            void main() {
                // Moving Grid
                vec2 uv = vUv * vec2(10.0, 40.0);
                uv.y += uTime * 2.0;
                
                float grid = step(0.98, fract(uv.x)) + step(0.98, fract(uv.y));
                
                // Reflection approximation (glossy)
                vec3 col = uColor * grid * 0.5;
                
                // Center glow path
                float center = 1.0 - abs(vUv.x - 0.5) * 2.0;
                col += uColor * pow(center, 4.0) * 0.2;

                gl_FragColor = vec4(col, 1.0);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -20;
    scene.add(floor);

    // 4. ASCENDING DATA BITS (Particles)
    const pCount = isMobile ? 200 : 500;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for(let i=0; i<pCount; i++) {
        pPos[i*3] = (Math.random() - 0.5) * 40;
        pPos[i*3+1] = -20 + Math.random() * 60;
        pPos[i*3+2] = (Math.random() - 0.5) * 200;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    
    // Using simple points but stylized
    const pMat = new THREE.PointsMaterial({
        color: color,
        size: 0.4,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);
    
    // 5. LASER SCANNERS (Sweeping horizontal lights)
    const laserGeo = new THREE.PlaneGeometry(30, 0.2);
    const laserMat = new THREE.MeshBasicMaterial({ 
        color: color, 
        transparent: true, 
        opacity: 0.5, 
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
    });
    const lasers: THREE.Mesh[] = [];
    for(let i=0; i<5; i++) {
        const l = new THREE.Mesh(laserGeo, laserMat);
        scene.add(l);
        lasers.push(l);
    }

    // Setup Instances (Corridor Layout)
    const dummy = new THREE.Object3D();
    const data: { x: number, z: number, yOffset: number }[] = [];
    
    for(let i=0; i<count; i++) {
        const isLeft = i % 2 === 0;
        const x = isLeft ? -15 : 15;
        const z = -200 + Math.random() * 300;
        data.push({ x, z, yOffset: Math.random() * 100 });
        
        dummy.position.set(x, -10, z);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
    }

    return (t: number, progress: number) => {
        mat.uniforms.uTime.value = t;
        mat.uniforms.uProgress.value = progress;
        floorMat.uniforms.uTime.value = t;

        const speed = 20 + progress * 300; // Hyper acceleration

        for(let i=0; i<count; i++) {
            const d = data[i];
            
            // Move infinite tunnel
            let z = d.z + t * speed;
            z = (z % 400) - 200;
            
            // Vertical shift (Hydraulic movement)
            const y = Math.sin(t * 2.0 + d.yOffset) * 10.0;
            
            // Closing walls effect (Claustrophobia)
            const w = 15 - (progress * 8); // 15 -> 7
            const x = d.x > 0 ? w : -w;

            dummy.position.set(x, y, z);
            dummy.scale.y = 1.0 + Math.sin(t * 5.0 + i) * 0.1; // Subtle breathing
            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;

        // Particles
        const pa = particles.geometry.attributes.position.array as Float32Array;
        for(let i=0; i<pCount; i++) {
            // Rise up
            pa[i*3+1] += 0.2 + progress; 
            if(pa[i*3+1] > 40) pa[i*3+1] = -20;
            
            // Move with camera slightly
            pa[i*3+2] += speed * 0.5;
            if(pa[i*3+2] > 50) pa[i*3+2] = -200;
        }
        particles.geometry.attributes.position.needsUpdate = true;
        
        // Lasers
        lasers.forEach((l, i) => {
            // Sweep forward relative to speed
            let z = -200 + ((t * speed * 1.5 + i * 80) % 300);
            l.position.set(0, Math.sin(t + i)*10, z);
            (l.material as THREE.MeshBasicMaterial).opacity = (1.0 - Math.abs(z)/200) * 0.5 * (1.0 + progress);
        });
    }
};

// --- SCENE 4: RUBY (The Prism Singularity) ---
// Concept: A kaleidoscopic tunnel of refractive gemstones.
const createRubyScene = (scene: THREE.Scene, color: THREE.Color, isMobile: boolean) => {
    // 1. SETUP
    scene.fog = new THREE.FogExp2(0x1a0505, 0.02); // Deep red fog

    // 2. CRYSTAL GEOMETRY (Instanced)
    // Octahedrons capture light beautifully for gems
    const geo = new THREE.OctahedronGeometry(1, 0); 
    const count = isMobile ? 300 : 800;

    // 3. REFRACTIVE SHADER
    const mat = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uColor: { value: color },
            uProgress: { value: 0 }
        },
        vertexShader: `
            attribute float aRandom;
            attribute float aScale;
            varying vec3 vNormal;
            varying vec3 vViewPos;
            varying float vRand;
            
            void main() {
                vRand = aRandom;
                // Scale instance individually
                vec3 sPos = position * aScale;
                vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(sPos, 1.0);
                gl_Position = projectionMatrix * mvPosition;
                vViewPos = -mvPosition.xyz;
                vNormal = normalize(normalMatrix * mat3(instanceMatrix) * normal);
            }
        `,
        fragmentShader: `
            varying vec3 vNormal;
            varying vec3 vViewPos;
            varying float vRand;
            
            uniform vec3 uColor;
            uniform float uTime;
            uniform float uProgress;
            
            void main() {
                vec3 viewDir = normalize(vViewPos);
                vec3 normal = normalize(vNormal);
                
                // Fresnel Rim (Glassy edge)
                float fresnel = pow(1.0 - abs(dot(viewDir, normal)), 2.0);
                
                // "Diamond" Sparkle - View dependent reflection
                float sparkle = pow(max(0.0, dot(reflect(-viewDir, normal), vec3(0.0,1.0,0.0))), 8.0);
                
                // Chromatic Dispersion Simulation (RGB Split)
                vec3 colA = uColor; // Base Red
                vec3 colB = vec3(1.0, 0.2, 0.6); // Hot Pink
                
                // Shift color based on time and instance random
                vec3 crystalCol = mix(colA, colB, sin(uTime * 3.0 + vRand * 10.0) * 0.5 + 0.5);
                
                // Compose Color
                vec3 finalColor = crystalCol * 0.15; // Ambient
                finalColor += crystalCol * fresnel * 2.5; // Glowing Edges
                
                // Intense white sparkles that react to progress
                finalColor += vec3(1.0) * sparkle * (0.5 + uProgress * 3.0); 
                
                // Add inner glow
                float inner = pow(max(0.0, dot(viewDir, normal)), 4.0);
                finalColor += uColor * inner * 0.5;

                gl_FragColor = vec4(finalColor, 0.7 + fresnel * 0.3);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });

    const mesh = new THREE.InstancedMesh(geo, mat, count);
    
    // Add Instanced Attributes
    const randoms = new Float32Array(count);
    const scales = new Float32Array(count);
    for(let i=0; i<count; i++) {
        randoms[i] = Math.random();
        scales[i] = 0.5 + Math.random() * 1.5; // Varied sizes
    }
    geo.setAttribute('aRandom', new THREE.InstancedBufferAttribute(randoms, 1));
    geo.setAttribute('aScale', new THREE.InstancedBufferAttribute(scales, 1));
    
    scene.add(mesh);

    // 4. HYPER-SPEED LINES
    const lineCount = isMobile ? 40 : 100;
    const lineGeo = new THREE.BufferGeometry();
    const linePos = new Float32Array(lineCount * 6); // 2 points per line
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffaaaa, transparent: true, opacity: 0, blending: THREE.AdditiveBlending });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    // 5. CORE GLOW SPRITE
    // Simple gradient texture for flare
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if(ctx) {
        const g = ctx.createRadialGradient(32,32,0,32,32,32);
        g.addColorStop(0, 'rgba(255, 200, 200, 1)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0,0,64,64);
    }
    const flareTex = new THREE.CanvasTexture(canvas);
    const flareMat = new THREE.SpriteMaterial({ map: flareTex, color: 0xffaaaa, blending: THREE.AdditiveBlending, opacity: 0 });
    const flare = new THREE.Sprite(flareMat);
    flare.scale.set(30, 30, 1);
    flare.position.z = -150;
    scene.add(flare);

    // INIT POSITIONS (Spiral Tunnel)
    const dummy = new THREE.Object3D();
    const instances: { r: number, theta: number, z: number, speed: number, rotSpeed: number }[] = [];
    
    for(let i=0; i<count; i++) {
        const r = 6 + Math.random() * 14;
        const theta = (i / count) * Math.PI * 40; // Long spiral
        const z = -200 + Math.random() * 200;
        instances.push({ 
            r, 
            theta, 
            z, 
            speed: 0.5 + Math.random(), 
            rotSpeed: (Math.random() - 0.5) * 2 
        });
    }

    return (t: number, progress: number) => {
        mat.uniforms.uTime.value = t;
        mat.uniforms.uProgress.value = progress;
        
        // Acceleration Curve
        const velocity = 20 + (progress * 300); // 20 -> 320
        
        // Update Crystals
        for(let i=0; i<count; i++) {
            const d = instances[i];
            
            // Move Z
            d.z += velocity * 0.1 * d.speed;
            if(d.z > 10) d.z -= 200; // Loop
            
            // Spiral Motion
            // As progress increases, the spiral tightens and spins faster
            const spin = t * d.rotSpeed + (progress * t * 5.0);
            
            // Warp effect: radius shrinks slightly at high speed to center the view
            const r = d.r * (1.0 - progress * 0.2); 
            
            const x = Math.cos(d.theta + spin) * r;
            const y = Math.sin(d.theta + spin) * r;
            
            dummy.position.set(x, y, d.z);
            
            // Tumbling crystals
            dummy.rotation.x = t * d.speed + i;
            dummy.rotation.y = t * 0.5 + i;
            dummy.rotation.z = t * 0.2;
            
            // Stretch Effect
            const stretch = 1.0 + (progress * 3.0);
            dummy.scale.set(1, 1, stretch);
            
            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
        
        // Update Lines (Warp Streaks)
        if (progress > 0.1) {
             lineMat.opacity = Math.min(1, progress * 0.8);
             const lArr = lines.geometry.attributes.position.array as Float32Array;
             for(let i=0; i<lineCount; i++) {
                 // Random positions around camera
                 const idx = i*6;
                 // We regenerate positions cyclically or just warp them?
                 // Let's simple procedural update
                 const length = 20 + progress * 100;
                 
                 // If we strictly update every frame it flickers too much. 
                 // Let's just use static randoms and shift Z
                 const offset = i * 13.0;
                 const zz = -150 + ((t * 500 + offset) % 200);
                 
                 // Re-calc x/y based on index to keep lines stable
                 const stableR = 5 + (i % 10) * 2;
                 const stableA = (i / lineCount) * Math.PI * 2 + t;
                 const sx = Math.cos(stableA) * stableR;
                 const sy = Math.sin(stableA) * stableR;

                 lArr[idx] = sx; lArr[idx+1] = sy; lArr[idx+2] = zz;
                 lArr[idx+3] = sx; lArr[idx+4] = sy; lArr[idx+5] = zz - length;
             }
             lines.geometry.attributes.position.needsUpdate = true;
        } else {
            lineMat.opacity = 0;
        }

        // Update Flare
        flareMat.opacity = progress;
        flare.scale.setScalar(30 + progress * 50);
        flare.rotation.z = t * 2.0;
    };
};


const FactionEntryTransition: React.FC<FactionEntryProps> = ({ teamId, onComplete }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!mountRef.current) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobile = width < 768;
    
    // Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.02);
    
    const camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 500);
    camera.position.set(0, 0, 0); // Start at 0

    const renderer = new THREE.WebGLRenderer({ alpha: false, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);
    
    // Team Config
    const team = TEAMS[teamId];
    const color = new THREE.Color(team.color);
    renderer.setClearColor(0x000000);

    // Init Scene based on Team
    let updateFn: (t: number, p: number) => void;
    
    if (teamId === 't1') updateFn = createPythonScene(scene, color, isMobile);
    else if (teamId === 't2') updateFn = createAjaxScene(scene, color, isMobile);
    else if (teamId === 't3') updateFn = createJavaScene(scene, color, isMobile);
    else updateFn = createRubyScene(scene, color, isMobile);

    // Animation Loop
    const clock = new THREE.Clock();
    let frameId = 0;
    const animState = { progress: 0, shake: 0 };
    
    // GSAP Sequence (Cinematic Timing)
    const tl = gsap.timeline({
        onComplete: () => {
            onComplete();
        }
    });

    // Phase 1: Engine Spool Up (0s - 1.5s)
    tl.to(animState, {
        progress: 0.3,
        duration: 1.5,
        ease: "power2.inOut"
    });
    
    // Phase 2: Hyper Speed / Impact (1.5s - 2.5s)
    tl.to(animState, {
        progress: 1.0,
        duration: 1.0,
        ease: "expo.in"
    });
    
    // Phase 3: Whiteout (2.5s)
    tl.to(mountRef.current, {
        backgroundColor: '#ffffff',
        duration: 0.1,
        onStart: () => {
             if(mountRef.current) mountRef.current.style.opacity = '0'; // Trigger CSS fade
        }
    }, "-=0.1");


    const animate = () => {
        const t = clock.getElapsedTime();
        updateFn(t, animState.progress);
        
        // Screen Shake Logic (Increases with progress)
        const shakeIntensity = animState.progress * 0.5;
        camera.position.x = (Math.random() - 0.5) * shakeIntensity;
        camera.position.y = (Math.random() - 0.5) * shakeIntensity;

        renderer.render(scene, camera);
        frameId = requestAnimationFrame(animate);
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
        cancelAnimationFrame(frameId);
        if (mountRef.current && renderer.domElement) mountRef.current.removeChild(renderer.domElement);
        renderer.dispose();
        tl.kill();
    };
  }, [teamId, onComplete]);

  return (
    <div 
        ref={mountRef} 
        className="fixed inset-0 z-[100] bg-black pointer-events-none transition-opacity duration-700 ease-out"
    >
        {/* Optional Overlay Text */}
        <div className="absolute inset-0 flex items-center justify-center">
             <h2 className="text-white/20 font-black text-6xl md:text-9xl tracking-tighter opacity-0 animate-[ping_2s_ease-in-out]">
                {TEAMS[teamId].id === 't2' ? 'WARP_ENGAGED' : 'INITIALIZING'}
             </h2>
        </div>
    </div>
  );
};

export default FactionEntryTransition;
