import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';

interface VoxelTorchProps {
  isLit: boolean;
  isMobile?: boolean;
  tilt?: number; // Rotation in Z axis (radians)
}

// --- SHADERS ---

// A swirling plasma core that sits inside the torch cup
const CORE_VERTEX = `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const CORE_FRAGMENT = `
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    // Noise-like swirl
    float noise = sin(vUv.x * 20.0 + uTime * 5.0) * sin(vUv.y * 20.0 - uTime * 3.0);
    
    // Fresnel glow
    float fresnel = pow(1.0 - dot(vNormal, vec3(0,0,1)), 3.0);
    
    vec3 col = mix(uColorA, uColorB, noise * 0.5 + 0.5);
    col += uColorB * fresnel * 2.0;
    
    // Pulse intensity
    gl_FragColor = vec4(col, uIntensity * (0.5 + fresnel * 0.5));
  }
`;

const VoxelTorch: React.FC<VoxelTorchProps> = ({ isLit, isMobile = false, tilt = 0 }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  
  // Logic Refs
  const torchGroup = useRef<THREE.Group>(null);
  const animationState = useRef({
      fireStrength: 0, // 0 to 1
      chargeLevel: 0,  // 0 to 1 (for suction effect)
      shake: 0,
  });

  useEffect(() => {
    if (!mountRef.current) return;

    // --- SETUP ---
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    
    // Use a frontal camera to make "crossing" via Z-rotation predictable on screen
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    const camDist = isMobile ? 40 : 35;
    camera.position.set(0, 0, camDist);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ 
        alpha: true, 
        antialias: true,
        powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    mountRef.current.appendChild(renderer.domElement);

    // --- GROUP STRUCTURE ---
    // Outer group handles the "Tilt" (Screen rotation)
    const mainGroup = new THREE.Group();
    mainGroup.rotation.z = tilt;
    scene.add(mainGroup);
    torchGroup.current = mainGroup;

    // Inner group handles the "Isometric Angle" of the 3D model
    const isoGroup = new THREE.Group();
    // Rotate to show depth (Isometric-ish)
    isoGroup.rotation.x = 0.5; 
    isoGroup.rotation.y = 0.7; 
    mainGroup.add(isoGroup);

    // Voxel Geometry
    const voxelGeo = new THREE.BoxGeometry(1, 1, 1);
    // Brighter material for better visibility against dark background
    const voxelMat = new THREE.MeshStandardMaterial({
        color: 0x444444,
        roughness: 0.6,
        metalness: 0.5,
    });
    const glowMat = new THREE.MeshStandardMaterial({
        color: 0x6d28d9,
        emissive: 0x7c3aed,
        emissiveIntensity: 0.8,
        roughness: 0.2
    });

    // Handle: 8 high. Head: 4 wide.
    const bodyVoxels: {x:number, y:number, z:number, type:'body'|'glow'}[] = [];
    
    // Handle
    for(let y=-8; y<=0; y++) {
        bodyVoxels.push({x:0, y, z:0, type:'body'});
        if (y % 2 === 0) { // Grips
            bodyVoxels.push({x:1, y, z:0, type:'body'});
            bodyVoxels.push({x:-1, y, z:0, type:'body'});
            bodyVoxels.push({x:0, y, z:1, type:'body'});
            bodyVoxels.push({x:0, y, z:-1, type:'body'});
        }
        if (y === -4) {
            bodyVoxels.push({x:0, y, z:0, type:'glow'}); // Inner energy vein
        }
    }
    
    // Cup
    for(let y=1; y<=3; y++) {
        for(let x=-2; x<=2; x++) {
            for(let z=-2; z<=2; z++) {
                if (Math.abs(x)===2 || Math.abs(z)===2) {
                     bodyVoxels.push({x, y, z, type: y===2 ? 'glow' : 'body'});
                }
            }
        }
    }

    // Create Mesh
    const bodyMesh = new THREE.InstancedMesh(voxelGeo, voxelMat, bodyVoxels.length);
    const glowMesh = new THREE.InstancedMesh(voxelGeo, glowMat, 20); // Reserve buffer for glows if needed separately
    
    let bIdx = 0;
    const dummy = new THREE.Object3D();
    
    bodyVoxels.forEach(v => {
        dummy.position.set(v.x, v.y, v.z);
        dummy.updateMatrix();
        // Use single mesh for structural simplicity
        bodyMesh.setMatrixAt(bIdx++, dummy.matrix);
    });
    
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    isoGroup.add(bodyMesh);

    // --- PLASMA CORE (Shader) ---
    const coreGeo = new THREE.IcosahedronGeometry(1.5, 2);
    const coreMat = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uIntensity: { value: 0 },
            uColorA: { value: new THREE.Color(0xff00de) },
            uColorB: { value: new THREE.Color(0x00ffff) }
        },
        vertexShader: CORE_VERTEX,
        fragmentShader: CORE_FRAGMENT,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.set(0, 3, 0);
    isoGroup.add(core);

    // --- PARTICLE SYSTEM (InstancedMesh) ---
    const pCount = isMobile ? 300 : 800;
    const pGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const pMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const particles = new THREE.InstancedMesh(pGeo, pMat, pCount);
    particles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    isoGroup.add(particles);

    // Particle Data
    const pData: { 
        x: number, y: number, z: number, 
        vx: number, vy: number, vz: number, 
        life: number, scale: number, offset: number 
    }[] = [];
    
    for(let i=0; i<pCount; i++) {
        pData.push({
            x: (Math.random()-0.5)*3, y: 3 + Math.random()*2, z: (Math.random()-0.5)*3,
            vx: 0, vy: 0, vz: 0,
            life: Math.random(),
            scale: Math.random(),
            offset: Math.random() * 100
        });
    }

    // --- LIGHTS ---
    // 1. Ambient - Boosted for visibility
    const ambient = new THREE.AmbientLight(0x221144, 1.0);
    scene.add(ambient);

    // 2. Key Light (Front-Top-Right) - Illuminates the faces towards camera
    const keyLight = new THREE.DirectionalLight(0xa78bfa, 2.0);
    keyLight.position.set(10, 10, 20);
    scene.add(keyLight);

    // 3. Rim Light (Back-Left) - Edges
    const rimLight = new THREE.DirectionalLight(0xff00de, 2.0);
    rimLight.position.set(-10, 5, -10);
    scene.add(rimLight);

    // 4. Flame Light (Dynamic)
    const flameLight = new THREE.PointLight(0x00ffff, 0, 40);
    flameLight.position.set(0, 6, 0);
    isoGroup.add(flameLight);

    // --- ANIMATION LOOP ---
    const clock = new THREE.Clock();
    const tempColor = new THREE.Color();

    // Reusable colors
    const colHot = new THREE.Color(0xffffff); // Core white
    const colMid = new THREE.Color(0x00ffff); // Cyan
    const colCool = new THREE.Color(0x7c3aed); // Purple
    const colDark = new THREE.Color(0x330033); // Smoke

    let frameId = 0;

    const animate = () => {
        frameId = requestAnimationFrame(animate);
        const time = clock.getElapsedTime();
        const dt = 0.016; 

        const { fireStrength, chargeLevel, shake } = animationState.current;

        // 1. Shake Effect
        if (shake > 0) {
            isoGroup.position.x = (Math.random() - 0.5) * shake;
            isoGroup.position.z = (Math.random() - 0.5) * shake;
        } else {
            isoGroup.position.set(0,0,0);
        }

        // 2. Core Shader
        coreMat.uniforms.uTime.value = time;
        // Intensity is mix of charge (suction glow) and fire (stable glow)
        const targetIntensity = (chargeLevel * 2.0) + (fireStrength * 1.0);
        coreMat.uniforms.uIntensity.value = targetIntensity;
        
        // 3. Particles Logic
        for (let i = 0; i < pCount; i++) {
            const p = pData[i];
            
            if (chargeLevel > 0.1 && fireStrength < 0.1) {
                // SUCTION MODE
                const px = p.x; const py = p.y; const pz = p.z;
                p.x += (0 - px) * 0.1 * chargeLevel;
                p.y += (3 - py) * 0.1 * chargeLevel;
                p.z += (0 - pz) * 0.1 * chargeLevel;
                
                p.x += (Math.random()-0.5) * 0.1;
                p.scale = Math.max(0.1, 1.0 - chargeLevel);
                
                if (Math.abs(p.y - 3) < 0.2) {
                    const ang = Math.random() * Math.PI * 2;
                    const r = 3 + Math.random() * 2;
                    p.x = Math.cos(ang) * r;
                    p.z = Math.sin(ang) * r;
                    p.y = 3 + (Math.random()-0.5) * 4;
                }
                tempColor.set(colMid).lerp(colHot, Math.random());
                
            } else if (fireStrength > 0.01) {
                // FIRE MODE
                p.life += dt * (0.5 + fireStrength);
                if (p.life > 1) {
                    p.life = 0;
                    const ang = Math.random() * Math.PI * 2;
                    const r = Math.random() * 1.0;
                    p.x = Math.cos(ang) * r;
                    p.z = Math.sin(ang) * r;
                    p.y = 3;
                    p.scale = Math.random();
                }

                const rise = dt * (3.0 + fireStrength * 5.0);
                p.y += rise;
                
                const noiseFreq = 0.5;
                const noiseAmp = 0.05 * fireStrength;
                p.x += Math.sin(time * 5 + p.y * noiseFreq + p.offset) * noiseAmp;
                p.z += Math.cos(time * 4 + p.y * noiseFreq + p.offset) * noiseAmp;
                
                let s = 0;
                if (p.life < 0.2) s = p.life * 5;
                else s = 1.0 - (p.life - 0.2) * 1.25;
                s = Math.max(0, s * p.scale);
                
                if (p.life < 0.3) tempColor.set(colHot).lerp(colMid, p.life * 3);
                else if (p.life < 0.7) tempColor.set(colMid).lerp(colCool, (p.life - 0.3) * 2.5);
                else tempColor.set(colCool).lerp(colDark, (p.life - 0.7) * 3);

            } else {
                p.scale = 0;
            }

            dummy.position.set(p.x, p.y, p.z);
            if (fireStrength > 0) {
                dummy.rotation.x += dt * 2;
                dummy.rotation.z += dt * 2;
            }
            dummy.scale.setScalar(p.scale * (chargeLevel > 0 ? 1 : fireStrength)); 
            dummy.updateMatrix();
            particles.setMatrixAt(i, dummy.matrix);
            particles.setColorAt(i, tempColor);
        }
        
        particles.instanceMatrix.needsUpdate = true;
        if (particles.instanceColor) particles.instanceColor.needsUpdate = true;

        // 4. Lights
        if (fireStrength > 0) {
            const flicker = 0.8 + Math.random() * 0.4;
            flameLight.intensity = fireStrength * 40 * flicker;
            if (fireStrength > 0.9) flameLight.color.setHex(0x00ffff);
            else flameLight.color.setHex(0xffffff);
        } else if (chargeLevel > 0) {
             flameLight.intensity = chargeLevel * 5;
             flameLight.color.setHex(0xbd00ff);
        } else {
            flameLight.intensity = 0;
        }

        renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
        if (!mountRef.current) return;
        const w = mountRef.current.clientWidth;
        const h = mountRef.current.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(frameId);
        renderer.dispose();
        mountRef.current?.removeChild(renderer.domElement);
    };
  }, [isMobile, tilt]);

  // --- IGNITION SEQUENCE ---
  useEffect(() => {
     const state = animationState.current;

     if (isLit) {
         const tl = gsap.timeline();
         tl.to(state, { chargeLevel: 1, duration: 1.5, ease: "power2.in" });
         tl.to(state, { shake: 0.2, duration: 1.5, ease: "expo.in" }, "<");
         tl.to(state, { chargeLevel: 0, shake: 0, duration: 0.1 });
         tl.to(state, { fireStrength: 1.5, duration: 0.2, ease: "expo.out" }); 
         tl.to(state, { fireStrength: 1.0, duration: 2.0, ease: "elastic.out(1, 0.3)" });
     } else {
         gsap.to(state, { fireStrength: 0, chargeLevel: 0, duration: 0.5 });
     }

  }, [isLit]);

  return <div ref={mountRef} className="w-full h-full" />;
};

export default VoxelTorch;