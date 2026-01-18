
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { Facebook, Instagram, Mail, MapPin } from 'lucide-react';

// Custom TikTok Icon
const TikTokIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z"/>
  </svg>
);

// --- LEGENDARY SOCIAL BUTTON COMPONENT ---
const SocialButton = ({ icon: Icon, href, label }: { icon: any, href: string, label: string }) => {
    const btnRef = useRef<HTMLAnchorElement>(null);
    const iconRef = useRef<HTMLDivElement>(null);
    const glowRef = useRef<HTMLDivElement>(null);
    const borderRef = useRef<HTMLDivElement>(null);

    const handleMove = (e: React.MouseEvent) => {
        if (!btnRef.current || !glowRef.current || !iconRef.current || !borderRef.current) return;
        
        const rect = btnRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Magnetic pull physics (Stronger for that 'heavy' legendary feel)
        const moveX = (x - centerX) * 0.4;
        const moveY = (y - centerY) * 0.4;
        
        // Move Button with 3D Tilt
        gsap.to(btnRef.current, {
            x: moveX,
            y: moveY,
            rotationX: -((y - centerY) / centerY) * 20, // Max tilt 20deg
            rotationY: ((x - centerX) / centerX) * 20,
            scale: 1.15,
            duration: 0.4,
            ease: "power2.out"
        });

        // Icon Parallax (Opposite direction for deep holographic depth)
        gsap.to(iconRef.current, {
            x: moveX * 0.6,
            y: moveY * 0.6,
            duration: 0.4
        });
        
        // Spotlight Glow follows cursor
        gsap.to(glowRef.current, {
            x: x,
            y: y,
            opacity: 0.8,
            scale: 1.8,
            duration: 0.2
        });

        // Border Glow Intensity
        gsap.to(borderRef.current, {
            opacity: 1,
            duration: 0.3
        });
    };

    const handleLeave = () => {
        if (!btnRef.current || !glowRef.current || !iconRef.current || !borderRef.current) return;
        
        // Elastic Reset
        gsap.to(btnRef.current, {
            x: 0,
            y: 0,
            rotationX: 0,
            rotationY: 0,
            scale: 1,
            duration: 0.8,
            ease: "elastic.out(1, 0.4)"
        });
        
        gsap.to(iconRef.current, {
            x: 0,
            y: 0,
            duration: 0.8,
            ease: "elastic.out(1, 0.4)"
        });

        gsap.to(glowRef.current, {
            opacity: 0,
            scale: 0.5,
            duration: 0.3
        });
        
        gsap.to(borderRef.current, {
            opacity: 0,
            duration: 0.3
        });
    };

    return (
        <a 
            ref={btnRef}
            href={href}
            aria-label={label}
            onMouseMove={handleMove}
            onMouseLeave={handleLeave}
            className="relative w-16 h-16 md:w-20 md:h-20 rounded-xl bg-black/40 backdrop-blur-md flex items-center justify-center group active:scale-95 transition-transform will-change-transform"
            style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
        >
             {/* Base Border (Subtle) */}
            <div className="absolute inset-0 rounded-xl border border-white/10 group-hover:border-white/0 transition-colors duration-300"></div>

            {/* Active Border Gradient (Controlled by GSAP) */}
            <div ref={borderRef} className="absolute inset-0 rounded-xl p-[1px] bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 opacity-0 mask-gradient">
                <div className="w-full h-full bg-black/90 rounded-xl"></div>
            </div>

            {/* Spotlight Glow */}
            <div 
                ref={glowRef} 
                className="absolute top-0 left-0 w-32 h-32 bg-[radial-gradient(circle,rgba(0,255,255,0.4)_0%,transparent_70%)] -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-0 blur-xl mix-blend-screen"
            />
            
            {/* Tech Corners (SVG for crispness) */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                 <svg className="absolute top-0 left-0 w-3 h-3 text-cyan-400" viewBox="0 0 10 10"><path d="M1 9 V 1 H 9" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
                 <svg className="absolute top-0 right-0 w-3 h-3 text-pink-500" viewBox="0 0 10 10"><path d="M1 1 H 9 V 9" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
                 <svg className="absolute bottom-0 right-0 w-3 h-3 text-cyan-400" viewBox="0 0 10 10"><path d="M9 1 V 9 H 1" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
                 <svg className="absolute bottom-0 left-0 w-3 h-3 text-pink-500" viewBox="0 0 10 10"><path d="M9 9 H 1 V 1" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
            </div>

            {/* Icon Layer */}
            <div ref={iconRef} className="relative z-10 text-gray-400 group-hover:text-white transition-colors duration-300 transform-gpu">
                 {/* Glitch Shadow Cyan (Holographic Split) */}
                 <div className="absolute inset-0 text-cyan-400 opacity-0 group-hover:opacity-100 animate-pulse" style={{ transform: 'translate(-3px, -2px)', mixBlendMode: 'screen', animationDuration: '0.1s' }}>
                     <Icon size={28} className="md:w-8 md:h-8" />
                 </div>
                 {/* Glitch Shadow Pink (Holographic Split) */}
                 <div className="absolute inset-0 text-pink-500 opacity-0 group-hover:opacity-100 animate-pulse" style={{ transform: 'translate(3px, 2px)', mixBlendMode: 'screen', animationDuration: '0.15s' }}>
                     <Icon size={28} className="md:w-8 md:h-8" />
                 </div>
                 {/* Main Icon */}
                 <Icon size={28} className="md:w-8 md:h-8 relative z-20 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
            </div>
        </a>
    );
};

const GRID_VERTEX = `
  varying vec2 vUv;
  varying float vElevation;
  uniform float uTime;
  
  void main() {
    vUv = uv;
    vec3 pos = position;
    
    // Rolling hills effect
    float warp = sin(pos.x * 0.1 + uTime) * cos(pos.y * 0.1 + uTime) * 2.0;
    
    // Curvature (Horizon effect)
    float dist = length(pos.xy);
    pos.z -= pow(dist * 0.08, 2.0);
    
    pos.z += warp;
    vElevation = warp;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const GRID_FRAGMENT = `
  varying vec2 vUv;
  varying float vElevation;
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;

  void main() {
    // Moving Grid
    vec2 gridUV = vUv * 40.0;
    gridUV.y += uTime * 2.0;
    
    float grid = step(0.95, fract(gridUV.x)) + step(0.95, fract(gridUV.y));
    
    // Depth fade
    float dist = distance(vUv, vec2(0.5, 0.0)); // Fade from bottom center
    float alpha = 1.0 - smoothstep(0.2, 0.8, dist);
    
    vec3 col = mix(uColorA, uColorB, vElevation * 0.2 + 0.5);
    col += vec3(1.0) * grid * alpha;

    gl_FragColor = vec4(col, alpha * 0.5);
  }
`;

const Footer: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  // Singleton pattern for renderer/canvas
  let rendererSingleton: THREE.WebGLRenderer | null = null;
  let canvasSingleton: HTMLCanvasElement | null = null;

  useEffect(() => {
    if (!mountRef.current) return;

    // Defensive: Remove any existing canvas before creating a new one
    while (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }

    // --- THREE.JS SETUP ---
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.03);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(0, -10, 5);
    camera.lookAt(0, 10, 0);

    rendererSingleton = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    rendererSingleton.setSize(width, height);
    rendererSingleton.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    canvasSingleton = rendererSingleton.domElement;
    mountRef.current.appendChild(canvasSingleton);

    // --- OBJECTS ---
    const planeGeo = new THREE.PlaneGeometry(60, 60, 64, 64);
    const planeMat = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uColorA: { value: new THREE.Color(0x2e0249) }, // Deep Purple
            uColorB: { value: new THREE.Color(0xff00de) }  // Neon Pink
        },
        vertexShader: GRID_VERTEX,
        fragmentShader: GRID_FRAGMENT,
        transparent: true,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    scene.add(plane);

    // Particles (Data Dust)
    const pGeo = new THREE.BufferGeometry();
    const pCount = 200;
    const pPos = new Float32Array(pCount * 3);
    for(let i=0; i<pCount; i++) {
        pPos[i*3] = (Math.random()-0.5) * 50;
        pPos[i*3+1] = (Math.random()-0.5) * 50;
        pPos[i*3+2] = Math.random() * 10;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({ color: 0x00ffff, size: 0.15, transparent: true, opacity: 0.6 });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // --- ANIMATION ---
    const clock = new THREE.Clock();
    let frameId = 0;

    const animate = () => {
        frameId = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        planeMat.uniforms.uTime.value = t * 0.5;
        particles.position.y = (t * 2) % 10;
        particles.rotation.z = t * 0.05;

        // Camera float
        camera.position.x = Math.sin(t * 0.2) * 2;
        camera.lookAt(0, 15, 0);

        rendererSingleton!.render(scene, camera);
    };
    animate();

    // Resize
    const handleResize = () => {
        if(!mountRef.current) return;
        const w = mountRef.current.clientWidth;
        const h = mountRef.current.clientHeight;
        camera.aspect = w/h;
        camera.updateProjectionMatrix();
        rendererSingleton!.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(frameId);
        if (rendererSingleton) {
          rendererSingleton.dispose();
        }
        if (canvasSingleton && mountRef.current?.contains(canvasSingleton)) {
          mountRef.current.removeChild(canvasSingleton);
        }
        rendererSingleton = null;
        canvasSingleton = null;
    };
  }, []);

  return (
    <footer className="relative w-full bg-[#020205] overflow-hidden border-t border-purple-900/30">
        {/* 3D BACKGROUND CANVAS */}
        <div ref={mountRef} className="absolute inset-0 pointer-events-none opacity-40" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-24">
            
            {/* SUBFOOTER: CTA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-900/10 backdrop-blur-md">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <span className="text-[10px] font-mono tracking-widest text-green-400">SYSTEMS ONLINE</span>
                    </div>
                    <h2 ref={titleRef} className="text-4xl md:text-6xl font-black font-cyber text-white leading-tight tracking-widest mix-blend-screen">
                        JOIN THE <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 glitch-effect" data-text="EXPERIENCE">EXPERIENCE</span>
                    </h2>
                    <p className="text-gray-400 max-w-md font-ui text-sm md:text-base leading-relaxed">
                        The grid awaits your signature. Connect with the IT-VERSE network for real-time updates, exclusive drops, and tactical briefings.
                    </p>
                </div>

                {/* SOCIAL HUB */}
                <div className="flex flex-col items-start md:items-end gap-6 md:gap-8">
                    <div className="text-right hidden md:block">
                        <h3 className="text-xl font-bold text-white mb-2">SOCIAL UPLINK</h3>
                        <div className="h-1 w-24 bg-gradient-to-r from-transparent to-purple-500 ml-auto"></div>
                    </div>
                    
                    <div className="flex gap-4 md:gap-6 perspective-1000">
                        <SocialButton icon={Facebook} href="https://www.facebook.com/itverseph" label="FACEBOOK" />
                        <SocialButton icon={Instagram} href="https://www.instagram.com/itverse.ph/" label="INSTAGRAM" />
                        <SocialButton icon={TikTokIcon} href="https://www.tiktok.com/@itverseph" label="TIKTOK" />
                    </div>

                    <div className="flex gap-8 text-[10px] font-mono tracking-widest text-gray-500">
                        <span className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer"><MapPin size={12}/> MANILA, PH</span>
                        <span className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer"><Mail size={12}/> CONTACT@ITVERSE.COM</span>
                    </div>
                </div>
            </div>
        </div>
    </footer>
  );
};

export default Footer;
