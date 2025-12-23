import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';

interface VoxelTorchProps {
  isLit: boolean;
  isMobile?: boolean;
  tilt?: number; // Rotation in Z axis (radians)
}

const VoxelTorch: React.FC<VoxelTorchProps> = ({ isLit, isMobile = false, tilt = 0 }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationFrameRef = useRef<number>(0);
  
  // Animation State for GSAP to manipulate
  const torchState = useRef({
      ignitionProgress: 0, // 0 to 1
      lightIntensity: 0,
  });

  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        const x = (e.clientX / window.innerWidth) * 2 - 1;
        const y = -(e.clientY / window.innerHeight) * 2 + 1;
        mouseRef.current = { x, y };
    };
    if (!isMobile) {
        window.addEventListener('mousemove', handleMouseMove);
    }
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isMobile]);

  useEffect(() => {
    if (!mountRef.current) return;

    // --- SCENE SETUP ---
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    
    const scene = new THREE.Scene();
    
    // Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    
    // Adjust camera position
    const camDist = isMobile ? 31 : 25; 
    camera.position.set(camDist, 0, camDist);
    camera.lookAt(0, 1, 0); 

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- LIGHTING ---
    const ambientLight = new THREE.AmbientLight(0x2d1b4e, 0.6); 
    scene.add(ambientLight);

    const rimLight = new THREE.DirectionalLight(0xa78bfa, 1.0); 
    rimLight.position.set(-5, 10, -5);
    rimLight.castShadow = true;
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0x6d28d9, 0.4);
    fillLight.position.set(0, 2, 10);
    scene.add(fillLight);

    const flameLight = new THREE.PointLight(0xff00de, 0, 30);
    flameLight.castShadow = true;
    flameLight.shadow.bias = -0.0001;
    scene.add(flameLight);

    // --- TORCH HIERARCHY ---
    const torchWrapper = new THREE.Group();
    scene.add(torchWrapper);

    const modelGroup = new THREE.Group();
    modelGroup.rotation.z = tilt; // Apply static tilt
    torchWrapper.add(modelGroup);

    // Construct Torch
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const createVoxel = (x: number, y: number, z: number, color: number, emissive: boolean = false) => {
        const mat = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.6,
            metalness: 0.5,
            emissive: emissive ? color : 0x000000,
            emissiveIntensity: emissive ? 0.5 : 0
        });
        const mesh = new THREE.Mesh(boxGeo, mat);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    };

    const handleColor = 0x1a1a1a;
    const metalColor = 0x666666;
    const glowColor = 0x4c1d95;
    
    // Handle Construction
    const startY = -6;
    for(let y=startY; y<=2; y++) {
        modelGroup.add(createVoxel(0, y, 0, handleColor));
        if(y === startY) { 
             modelGroup.add(createVoxel(1, y, 0, metalColor));
             modelGroup.add(createVoxel(-1, y, 0, metalColor));
             modelGroup.add(createVoxel(0, y, 1, metalColor));
             modelGroup.add(createVoxel(0, y, -1, metalColor));
             modelGroup.add(createVoxel(0, y-1, 0, glowColor, true));
        }
        if (y === -2 || y === 1) { 
            modelGroup.add(createVoxel(1, y, 0, handleColor));
            modelGroup.add(createVoxel(-1, y, 0, handleColor));
            modelGroup.add(createVoxel(0, y, 1, handleColor));
            modelGroup.add(createVoxel(0, y, -1, handleColor));
        }
    }
    
    const cupY = 3;
    const headColor = 0x222222;
    for(let x=-1; x<=1; x++) for(let z=-1; z<=1; z++) modelGroup.add(createVoxel(x, cupY, z, headColor));
    for(let x=-2; x<=2; x++) for(let z=-2; z<=2; z++) {
        const isCorner = Math.abs(x)===2 && Math.abs(z)===2;
        const isWall = Math.abs(x)===2 || Math.abs(z)===2;
        if(isWall) {
             modelGroup.add(createVoxel(x, cupY+1, z, headColor));
             modelGroup.add(createVoxel(x, cupY+2, z, headColor));
             if(isCorner) {
                 modelGroup.add(createVoxel(x, cupY+3, z, metalColor));
                 modelGroup.add(createVoxel(x, cupY+4, z, metalColor));
             }
        }
    }
    modelGroup.add(createVoxel(0, cupY+1, 0, 0x330033, true));
    
    const fireOrigin = new THREE.Object3D();
    fireOrigin.position.set(0, 5, 0); 
    modelGroup.add(fireOrigin);

    // --- PARTICLES ---
    const particleGroup = new THREE.Group();
    scene.add(particleGroup);

    const particleCount = 120; 
    const particles: any[] = [];
    const colors = [0xffffff, 0x00ffff, 0xff00de, 0xd946ef, 0x7c3aed, 0x4c1d95]; 
    const particleGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6); // Slightly smaller voxels

    for(let i=0; i<particleCount; i++) {
        const mat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0x000000,
            transparent: true,
            opacity: 0,
            depthWrite: false,
        });
        const mesh = new THREE.Mesh(particleGeo, mat);
        particleGroup.add(mesh);
        
        particles.push({
            mesh,
            speed: 0.08 + Math.random() * 0.15,
            life: Math.random(),
            noiseOffset: Math.random() * 1000,
            relX: (Math.random() - 0.5) * 1.5,
            relZ: (Math.random() - 0.5) * 1.5,
        });
    }

    const clock = new THREE.Clock();
    const vec3 = new THREE.Vector3();

    const animate = () => {
        const time = clock.getElapsedTime();
        
        // --- INTERACTIVE ROTATION ---
        // Smoothly look at mouse position
        const targetRotX = mouseRef.current.y * 0.2; // Look up/down
        const targetRotY = mouseRef.current.x * 0.3; // Look left/right
        
        torchWrapper.rotation.x += (targetRotX - torchWrapper.rotation.x) * 0.05;
        torchWrapper.rotation.y += (targetRotY - torchWrapper.rotation.y) * 0.05;
        
        // Idle breathing
        torchWrapper.position.y = Math.sin(time) * 0.2; 

        // Fire Logic
        const ignition = torchState.current.ignitionProgress;
        const intensity = torchState.current.lightIntensity;

        fireOrigin.getWorldPosition(vec3);
        
        flameLight.position.copy(vec3);
        flameLight.position.y += 1; 

        if (ignition > 0.01) {
            const flicker = Math.sin(time * 25) * 0.8 + Math.cos(time * 60) * 0.4;
            flameLight.intensity = Math.max(0, intensity + flicker);
            const hueShift = Math.sin(time * 2) * 0.05;
            flameLight.color.setHSL(0.85 + hueShift, 1, 0.5); 
        } else {
            flameLight.intensity = 0;
        }

        particles.forEach((p) => {
            const currentSpeed = p.speed * (0.2 + ignition * 1.8);
            p.life += currentSpeed * 0.016; 
            
            if (p.life > 1) {
                p.life = 0;
                const spread = 0.2 + (ignition * 0.8);
                p.relX = (Math.random() - 0.5) * 1.5 * spread;
                p.relZ = (Math.random() - 0.5) * 1.5 * spread;
            }

            if (ignition <= 0.01) {
                p.mesh.visible = false;
                return;
            }
            p.mesh.visible = true;

            const maxHeight = 2 + (ignition * 8); 
            const verticalRise = p.life * maxHeight;

            const turbStrength = verticalRise * 0.3;
            const noiseX = Math.sin(time * 4 + p.noiseOffset + verticalRise) * turbStrength;
            const noiseZ = Math.cos(time * 3 + p.noiseOffset + verticalRise) * turbStrength;

            // Follow the torch tip position BUT drift upwards in World Space
            // To simulate fire reacting to movement, we lag the x/z slightly or just project from tip
            // For simplicity in this voxel style, we project from current tip position + vertical offset
            
            p.mesh.position.set(
                vec3.x + p.relX + noiseX,
                vec3.y + verticalRise, 
                vec3.z + p.relZ + noiseZ
            );

            p.mesh.rotation.x += 0.1;
            p.mesh.rotation.z += 0.1;

            const lifeStage = p.life;
            let scale = 0;
            if (lifeStage < 0.2) scale = lifeStage * 5; 
            else scale = 1 - ((lifeStage - 0.2) / 0.8); 
            
            scale *= (0.3 + ignition * 0.7);
            p.mesh.scale.setScalar(Math.max(0.001, scale));

            const floatIndex = lifeStage * (colors.length - 1);
            const index = Math.floor(floatIndex);
            const colorHex = colors[Math.min(index, colors.length - 1)];
            
            p.mesh.material.color.setHex(colorHex);
            p.mesh.material.emissive.setHex(colorHex);
            
            p.mesh.material.emissiveIntensity = (2.0 * (1 - lifeStage)) * ignition;
            p.mesh.material.opacity = (scale * 2) * ignition; 
        });

        renderer.render(scene, camera);
        animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();

    const handleResize = () => {
       if(!mountRef.current) return;
       const w = mountRef.current.clientWidth;
       const h = mountRef.current.clientHeight;
       camera.aspect = w/h;
       camera.updateProjectionMatrix();
       renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationFrameRef.current);
        if (rendererRef.current) {
            rendererRef.current.dispose();
            mountRef.current?.removeChild(rendererRef.current.domElement);
        }
    };
  }, [isMobile, tilt]); 

  // --- IGNITION SEQUENCE ---
  useEffect(() => {
    const state = torchState.current;
    
    if (isLit) {
        const tl = gsap.timeline();
        tl.to(state, { 
            ignitionProgress: 0.15, 
            lightIntensity: 10, 
            duration: 0.15, 
            ease: "power2.out" 
        })
        .to(state, { 
            ignitionProgress: 0.1, 
            lightIntensity: 1, 
            duration: 0.2, 
            ease: "power1.in" 
        })
        .to(state, { 
            ignitionProgress: 1, 
            lightIntensity: 5, 
            duration: 2.5, 
            ease: "elastic.out(1, 0.5)" 
        });

    } else {
        gsap.to(state, { 
            ignitionProgress: 0, 
            lightIntensity: 0, 
            duration: 0.8, 
            ease: "power2.in" 
        });
    }
  }, [isLit]);

  return <div ref={mountRef} className="w-full h-full" title="Interactive Torch" />;
};

export default VoxelTorch;
