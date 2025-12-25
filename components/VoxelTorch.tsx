
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';

interface VoxelTorchProps {
  isLit: boolean;
  isMobile?: boolean;
  tilt?: number; // Rotation in Z axis (radians)
}

// --- SHADERS FOR SMOOTH VOXEL FIRE ---

const FIRE_VERTEX_SHADER = `
  uniform float uTime;
  uniform float uIgnition; // 0 to 1
  
  attribute float aOffset;
  attribute float aSpeed;
  attribute float aLife; 
  
  varying float vLife; 
  varying vec3 vColorType;

  float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
  }

  void main() {
    // Smooth time for fluid motion (removed stepped time for better quality)
    float t = uTime * aSpeed + aOffset;
    
    // Lifecycle (0.0 to 1.0)
    float loopTime = 2.5 + aLife; 
    float progress = mod(t, loopTime) / loopTime;
    vLife = progress;

    vec3 pos = position;

    // PARTICLE PHYSICS
    // Rise upwards
    float height = progress * 12.0; 
    
    // Noise / Turbulence
    // Using smooth sine waves to create a weaving fire effect
    float noiseFreq = 0.5;
    float wobbleX = sin(t * 2.0 + pos.y * 0.5) * (progress * 1.5);
    float wobbleZ = cos(t * 1.5 + pos.y * 0.5) * (progress * 1.5);
    
    vec3 offsetPos = vec3(0.0, 0.0, 0.0);
    
    // Initial spread
    float spread = 0.8; 
    offsetPos.x += wobbleX + (rand(vec2(aOffset, 1.0)) - 0.5) * spread;
    offsetPos.z += wobbleZ + (rand(vec2(aOffset, 2.0)) - 0.5) * spread;
    offsetPos.y += height;

    // Ignition Control: Squash to emitter when off
    offsetPos *= uIgnition; 
    
    // Note: We removed the 'floor' snapping. 
    // Smooth moving voxels look much more "high-end" than jumpy ones, 
    // while maintaining the voxel aesthetic via the cube geometry.

    vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(pos + offsetPos, 1.0);
    
    // Scale Logic
    // Particles start small, grow, then shrink at top
    float scale = 1.0;
    if (progress < 0.1) scale = progress * 10.0;
    else if (progress > 0.7) scale = 1.0 - (progress - 0.7) * 3.33;
    
    // Master Scale
    scale *= uIgnition * 1.2; // Slightly larger voxels

    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4((pos * scale) + offsetPos, 1.0);
  }
`;

const FIRE_FRAGMENT_SHADER = `
  varying float vLife;
  
  void main() {
    // IT-VERSE NEON PALETTE
    vec3 cWhite = vec3(1.0, 1.0, 1.0);
    vec3 cCyan = vec3(0.2, 1.0, 1.0);
    vec3 cPink = vec3(1.0, 0.0, 0.8); 
    vec3 cPurple = vec3(0.3, 0.0, 0.8); 
    
    vec3 color = cPurple;
    
    // Smooth Gradients instead of hard bands for "Award Worthy" look
    // while the geometry provides the pixelation.
    
    if (vLife < 0.1) {
        color = mix(cWhite, cCyan, vLife * 10.0);
    } else if (vLife < 0.4) {
        color = mix(cCyan, cPink, (vLife - 0.1) * 3.33);
    } else {
        color = mix(cPink, cPurple, (vLife - 0.4) * 1.66);
    }
    
    // Alpha fade at tip
    float alpha = 1.0;
    if (vLife > 0.8) alpha = 1.0 - (vLife - 0.8) * 5.0;

    gl_FragColor = vec4(color, alpha);
  }
`;

const VoxelTorch: React.FC<VoxelTorchProps> = ({ isLit, isMobile = false, tilt = 0 }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const ignitionVal = useRef({ value: 0 }); 

  useEffect(() => {
    if (!mountRef.current) return;

    // --- SETUP SCENE ---
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    
    // Camera Setup
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 1000);
    // Adjusted camera Y (0) to move object UP, and Z (52) for framing
    camera.position.set(0, 0, 52); 
    
    // PERFORMANCE OPTIMIZATIONS
    const renderer = new THREE.WebGLRenderer({ 
        alpha: true, 
        antialias: !isMobile, // Disable antialias on mobile for performance
        powerPreference: 'high-performance' 
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.0 : 1.5)); // Cap pixel ratio
    
    // ACES Filmic for that "Award Worthy" contrast
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    mountRef.current.appendChild(renderer.domElement);

    const mainGroup = new THREE.Group();
    mainGroup.rotation.z = tilt; 
    mainGroup.rotation.y = Math.PI / 4; 
    scene.add(mainGroup);

    // --- 1. PROCEDURAL VOXEL TORCH GENERATION ---
    const voxels: {x: number, y: number, z: number, color: THREE.Color, type: 'metal'|'glow'|'dark'|'accent'}[] = [];
    
    const addVoxel = (x:number, y:number, z:number, hex: string, type: 'metal'|'glow'|'dark'|'accent' = 'metal') => {
        voxels.push({ x, y, z, color: new THREE.Color(hex), type });
    };

    const addSym4 = (x:number, y:number, z:number, hex:string, type: 'metal'|'glow'|'dark'|'accent' = 'metal') => {
        addVoxel(x, y, z, hex, type);
        addVoxel(-x, y, z, hex, type);
        addVoxel(x, y, -z, hex, type);
        addVoxel(-x, y, -z, hex, type);
    };

    // Colors
    const C_DARK_METAL = '#1e293b'; 
    const C_LIGHT_METAL = '#94a3b8';
    const C_ACCENT = '#334155';
    const C_GLOW_PINK = '#d946ef';
    const C_GLOW_CYAN = '#06b6d4';

    // -- HANDLE --
    for(let y=-8; y<=0; y++) {
        // Inner Core
        addVoxel(0, y, 0, C_DARK_METAL, 'dark');
        
        // Detailed Grip
        if (y < -1) {
             if (y % 2 === 0) {
                 addSym4(1, y, 0, C_ACCENT, 'accent');
                 addSym4(0, y, 1, C_ACCENT, 'accent');
             } else {
                 addSym4(1, y, 0, C_LIGHT_METAL, 'metal');
                 addSym4(0, y, 1, C_LIGHT_METAL, 'metal');
             }
        }
        // Pommel
        if (y === -8) {
            addSym4(1, y, 1, C_GLOW_PINK, 'glow'); 
        }
    }

    // -- EMITTER HEAD --
    // Base platform
    addSym4(1, 1, 1, C_DARK_METAL, 'dark');
    addSym4(1, 1, 0, C_DARK_METAL, 'dark');
    addSym4(0, 1, 1, C_DARK_METAL, 'dark');

    // Floating Prongs (Mag-Lev look)
    for(let y=2; y<=5; y++) {
        const offset = 2;
        addSym4(offset, y, offset, C_LIGHT_METAL, 'metal');
        // Inner energy vents
        addSym4(offset, y, offset-1, C_GLOW_CYAN, 'glow');
        addSym4(offset-1, y, offset, C_GLOW_CYAN, 'glow');
    }

    // -- MESH GENERATION --
    // Use slightly beveled box for better specular highlights (simulated via spacing)
    const geometryBox = new THREE.BoxGeometry(0.9, 0.9, 0.9); 
    
    // Materials
    const mMetal = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.9 });
    const mDark = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, metalness: 0.3 });
    const mAccent = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0.5 });
    const mGlow = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2, toneMapped: false });

    const groups = { metal: [] as any[], dark: [] as any[], accent: [] as any[], glow: [] as any[] };
    voxels.forEach(v => groups[v.type].push(v));

    const buildMesh = (items: any[], mat: THREE.Material) => {
        if (!items.length) return;
        const mesh = new THREE.InstancedMesh(geometryBox, mat, items.length);
        const dummy = new THREE.Object3D();
        items.forEach((v, i) => {
            dummy.position.set(v.x, v.y, v.z);
            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
            mesh.setColorAt(i, v.color);
        });
        mesh.instanceMatrix.needsUpdate = true;
        if(mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        mainGroup.add(mesh);
    };

    buildMesh(groups.metal, mMetal);
    buildMesh(groups.dark, mDark);
    buildMesh(groups.accent, mAccent);
    buildMesh(groups.glow, mGlow);


    // --- 2. FLUID VOXEL FIRE SYSTEM ---
    // OPTIMIZATION: Reduced particle count on mobile (150)
    const fireCount = isMobile ? 150 : 400; 
    const fireGeo = new THREE.BoxGeometry(1.0, 1.0, 1.0); 
    
    const fireMat = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uIgnition: { value: 0 }
        },
        vertexShader: FIRE_VERTEX_SHADER,
        fragmentShader: FIRE_FRAGMENT_SHADER,
        transparent: true,
        blending: THREE.AdditiveBlending, // Glow effect
        depthWrite: false, 
    });
    // @ts-ignore
    materialRef.current = fireMat;

    const fireMesh = new THREE.InstancedMesh(fireGeo, fireMat, fireCount);
    
    const offsets = new Float32Array(fireCount);
    const speeds = new Float32Array(fireCount);
    const lifes = new Float32Array(fireCount);
    
    const dummyFire = new THREE.Object3D();
    for(let i=0; i<fireCount; i++) {
        // Emitter origin is slightly above the handle
        dummyFire.position.set(0, 2, 0); 
        dummyFire.updateMatrix();
        fireMesh.setMatrixAt(i, dummyFire.matrix);
        
        offsets[i] = Math.random() * 100; 
        speeds[i] = 1.0 + Math.random() * 0.5; // Faster fire
        lifes[i] = Math.random(); 
    }
    
    fireGeo.setAttribute('aOffset', new THREE.InstancedBufferAttribute(offsets, 1));
    fireGeo.setAttribute('aSpeed', new THREE.InstancedBufferAttribute(speeds, 1));
    fireGeo.setAttribute('aLife', new THREE.InstancedBufferAttribute(lifes, 1));
    
    mainGroup.add(fireMesh);


    // --- 3. PARTICLES (Sparks/Embers) ---
    // OPTIMIZATION: Reduced spark count
    const sparkCount = isMobile ? 20 : 50;
    const sparkGeo = new THREE.BufferGeometry();
    const sparkPos = new Float32Array(sparkCount * 3);
    for(let i=0; i<sparkCount; i++) sparkPos[i] = 0;
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
    
    const sparkMat = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uIgnition: { value: 0 } },
        vertexShader: `
            uniform float uTime;
            uniform float uIgnition;
            attribute float aOffset;
            varying float vAlpha;
            void main() {
                float t = mod(uTime + aOffset, 4.0);
                vec3 p = vec3(0.0);
                // Spiral motion
                float radius = 1.0 + t * 0.5;
                p.x = sin(t * 3.0 + aOffset) * radius;
                p.z = cos(t * 3.0 + aOffset) * radius;
                p.y = 4.0 + t * 5.0; // Rise
                
                p *= uIgnition;
                
                vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
                gl_Position = projectionMatrix * mvPosition;
                gl_PointSize = (10.0 / -mvPosition.z) * 5.0;
                vAlpha = (1.0 - (t/4.0)) * uIgnition;
            }
        `,
        fragmentShader: `
            varying float vAlpha;
            void main() { 
                if (length(gl_PointCoord - 0.5) > 0.5) discard;
                gl_FragColor = vec4(1.0, 0.9, 0.5, vAlpha); 
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    
    const sparkOffsets = new Float32Array(sparkCount);
    for(let i=0; i<sparkCount; i++) sparkOffsets[i] = Math.random() * 100;
    sparkGeo.setAttribute('aOffset', new THREE.BufferAttribute(sparkOffsets, 1));
    const sparks = new THREE.Points(sparkGeo, sparkMat);
    mainGroup.add(sparks);


    // --- 4. LIGHTING STUDIO ---
    // Dynamic Fire Light
    const fireLight = new THREE.PointLight(0xff00de, 0, 30);
    fireLight.position.set(0, 5, 0); 
    mainGroup.add(fireLight);
    lightRef.current = fireLight;

    // Rim Light (Back)
    const rimLight = new THREE.DirectionalLight(0x00ffff, 2.0); 
    rimLight.position.set(-10, 10, -20);
    scene.add(rimLight);
    
    // Fill Light (Front/Top)
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(10, 10, 20);
    scene.add(fillLight);
    
    // Ambient
    const ambient = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambient);


    // --- ANIMATION LOOP ---
    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        const time = clock.getElapsedTime();
        const ignition = ignitionVal.current.value;

        // Update Uniforms
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = time;
            materialRef.current.uniforms.uIgnition.value = ignition;
        }
        sparkMat.uniforms.uTime.value = time;
        sparkMat.uniforms.uIgnition.value = ignition;

        // Light Flicker
        if (lightRef.current && ignition > 0.01) {
             const flicker = 0.9 + Math.sin(time * 25.0) * 0.1 + Math.random() * 0.05; 
             lightRef.current.intensity = ignition * 8.0 * flicker; 
             // Hue Shift: Pink <-> Purple
             const hue = 0.8 + (Math.sin(time) * 0.05); 
             lightRef.current.color.setHSL(hue, 1.0, 0.5);
        } else if (lightRef.current) {
            lightRef.current.intensity = 0;
        }

        // Levitation
        mainGroup.position.y = Math.sin(time * 1.5) * 0.3;
        mainGroup.rotation.y = (Math.PI / 4) + Math.sin(time * 0.5) * 0.15;

        renderer.render(scene, camera);
    };
    animate();

    // --- RESIZE ---
    const handleResize = () => {
        if (!mountRef.current) return;
        const w = mountRef.current.clientWidth;
        const h = mountRef.current.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);
    const resizeObs = new ResizeObserver(handleResize);
    resizeObs.observe(mountRef.current);

    return () => {
        window.removeEventListener('resize', handleResize);
        resizeObs.disconnect();
        cancelAnimationFrame(animationFrameId);
        renderer.dispose();
        fireGeo.dispose();
        geometryBox.dispose();
        if(mountRef.current) mountRef.current.innerHTML = '';
    };

  }, [isMobile, tilt]);

  // Ignition Animation
  useEffect(() => {
    gsap.to(ignitionVal.current, {
        value: isLit ? 1 : 0,
        duration: isLit ? 2.0 : 0.5,
        ease: isLit ? "power2.out" : "power2.in"
    });
  }, [isLit]);

  return <div ref={mountRef} className="w-full h-full" />;
};

export default VoxelTorch;
