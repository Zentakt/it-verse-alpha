
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';

interface CyberBackgroundProps {
  mode: 'static' | 'cruise' | 'warp';
  colorTheme: string; // Hex color
}

const CyberBackground: React.FC<CyberBackgroundProps> = ({ mode, colorTheme }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const starsRef = useRef<THREE.Points | null>(null);
  const nebulaRef = useRef<THREE.Points | null>(null);
  const speedRef = useRef(0);
  const targetSpeedRef = useRef(0);

  useEffect(() => {
    if (!mountRef.current) return;

    // --- SETUP ---
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05050a, 0.001);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- STARFIELD ---
    // PERFORMANCE OPTIMIZATION: Reduced from 6000 to 2500
    const starCount = 2500;
    const starGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    const colorObj = new THREE.Color(colorTheme);

    for(let i=0; i<starCount; i++) {
        positions[i*3] = (Math.random() - 0.5) * 800;
        positions[i*3+1] = (Math.random() - 0.5) * 800;
        positions[i*3+2] = (Math.random() - 0.5) * 800;
        
        const variation = (Math.random() - 0.5) * 0.2;
        colors[i*3] = Math.max(0, Math.min(1, colorObj.r + variation));
        colors[i*3+1] = Math.max(0, Math.min(1, colorObj.g + variation));
        colors[i*3+2] = Math.max(0, Math.min(1, colorObj.b + variation));
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMat = new THREE.PointsMaterial({
        size: 0.8,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
    });

    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);
    starsRef.current = stars;

    // --- NEBULA (Fake Dust) ---
    const nebulaCount = 50;
    const nebulaGeo = new THREE.BufferGeometry();
    const nebulaPos = new Float32Array(nebulaCount * 3);
    for(let i=0; i<nebulaCount; i++) {
        nebulaPos[i*3] = (Math.random() - 0.5) * 400;
        nebulaPos[i*3+1] = (Math.random() - 0.5) * 400;
        nebulaPos[i*3+2] = (Math.random() - 0.5) * 400;
    }
    nebulaGeo.setAttribute('position', new THREE.BufferAttribute(nebulaPos, 3));
    
    // Create a soft circular texture programmatically
    const canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 32;
    const context = canvas.getContext('2d');
    if(context) {
        const gradient = context.createRadialGradient(16,16,0,16,16,16);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        context.fillStyle = gradient;
        context.fillRect(0,0,32,32);
    }
    const texture = new THREE.CanvasTexture(canvas);

    const nebulaMat = new THREE.PointsMaterial({
        color: colorTheme,
        size: 50,
        map: texture,
        transparent: true,
        opacity: 0.1,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    
    const nebula = new THREE.Points(nebulaGeo, nebulaMat);
    scene.add(nebula);
    nebulaRef.current = nebula;

    // --- ANIMATION LOOP ---
    let frameId = 0;

    const animate = () => {
        frameId = requestAnimationFrame(animate);
        
        speedRef.current += (targetSpeedRef.current - speedRef.current) * 0.05;

        // Move Stars
        const positions = stars.geometry.attributes.position.array as Float32Array;
        for(let i=0; i<starCount; i++) {
            positions[i*3+2] += speedRef.current; 
            if (positions[i*3+2] > 400) {
                positions[i*3+2] = -400;
            }
        }
        stars.geometry.attributes.position.needsUpdate = true;
        
        // Move Nebula (Slower)
        const nebPos = nebula.geometry.attributes.position.array as Float32Array;
        for(let i=0; i<nebulaCount; i++) {
            nebPos[i*3+2] += speedRef.current * 0.5;
            if(nebPos[i*3+2] > 200) nebPos[i*3+2] = -200;
        }
        nebula.geometry.attributes.position.needsUpdate = true;

        // Rotation
        stars.rotation.z += 0.0005;
        nebula.rotation.z += 0.0002;

        renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(frameId);
        if (mountRef.current && renderer.domElement) {
            mountRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
    };
  }, []); // Init once

  // --- REACT TO PROPS ---
  useEffect(() => {
    if (mode === 'static') targetSpeedRef.current = 0.2;
    if (mode === 'cruise') targetSpeedRef.current = 1.0; 
    if (mode === 'warp') targetSpeedRef.current = 15.0; 

    const colorObj = new THREE.Color(colorTheme);
    
    if (starsRef.current) {
        const material = starsRef.current.material as THREE.PointsMaterial;
        gsap.to(material.color, {
            r: colorObj.r, g: colorObj.g, b: colorObj.b, duration: 1.5
        });
    }
    if (nebulaRef.current) {
         const material = nebulaRef.current.material as THREE.PointsMaterial;
         gsap.to(material.color, {
            r: colorObj.r, g: colorObj.g, b: colorObj.b, duration: 1.5
        });
    }

  }, [mode, colorTheme]);

  return <div ref={mountRef} className="fixed inset-0 -z-10 bg-[#05050a]" />;
};

export default CyberBackground;
