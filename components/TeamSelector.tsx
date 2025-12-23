
import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { TEAMS } from '../constants';
import { ChevronRight, ChevronLeft, Hexagon, Cpu, Zap, Activity, Shield, Target, MousePointer2 } from 'lucide-react';
import FactionEntryTransition from './FactionEntryTransition';

interface TeamSelectorProps {
  onSelect: (teamId: string) => void;
}

// --- ASSET GENERATION ---

const createLogoTexture = (text: string, color: string) => {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 1024, 1024);
    
    // Tech Circle Background
    ctx.strokeStyle = color;
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.arc(512, 512, 380, 0, Math.PI * 2);
    ctx.shadowColor = color;
    ctx.shadowBlur = 30;
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Dashed Ring
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(512, 512, 440, 0, Math.PI * 2);
    ctx.setLineDash([40, 60]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Inner Glow
    const gradient = ctx.createRadialGradient(512, 512, 100, 512, 512, 500);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.5, 'transparent');
    ctx.fillStyle = gradient;
    ctx.globalAlpha = 0.4;
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // Emoji Logo
    ctx.font = '450px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 20;
    ctx.fillText(text, 512, 550);
    
    // Scanlines
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    for(let i=0; i<1024; i+=8) {
        ctx.fillRect(0, i, 1024, 3);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 16;
  return tex;
};

// --- SHADERS ---

const COMMON_VERTEX = `
  varying vec2 vUv;
  varying vec3 vPos;
  varying vec3 vNormal;
  
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const PYTHON_FRAG = `
  varying vec2 vUv;
  uniform sampler2D uTexture;
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uOpacity;

  void main() {
    vec2 uv = vUv;
    // Glitch shift
    float glitch = step(0.99, sin(uTime * 10.0 + uv.y * 5.0));
    uv.x += glitch * 0.02;

    vec4 tex = texture2D(uTexture, uv);
    
    // Boost color intensity
    vec3 col = tex.rgb * uColor * 2.5;
    
    // Moving scanline
    float scan = sin(uv.y * 50.0 - uTime * 5.0) * 0.1;
    col += uColor * scan;

    gl_FragColor = vec4(col, tex.a * uOpacity);
  }
`;

const AJAX_FRAG = `
  varying vec2 vUv;
  uniform sampler2D uTexture;
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uOpacity;

  void main() {
    vec2 uv = vUv;
    float wave = sin(uv.y * 20.0 + uTime * 5.0) * 0.01;
    uv.x += wave;
    
    vec4 tex = texture2D(uTexture, uv);
    vec3 col = tex.rgb * uColor * 2.8;
    
    // Lightning flash
    float flash = step(0.95, fract(uTime * 2.0));
    col += vec3(1.0) * flash * 0.2 * tex.a;

    gl_FragColor = vec4(col, tex.a * uOpacity);
  }
`;

const JAVA_FRAG = `
  varying vec2 vUv;
  uniform sampler2D uTexture;
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uOpacity;

  void main() {
    // Pixelate
    vec2 grid = vec2(60.0, 60.0);
    vec2 uv = floor(vUv * grid) / grid;
    
    vec4 tex = texture2D(uTexture, uv);
    vec3 col = tex.rgb * uColor * 2.5;
    
    // Block decay
    float decay = step(0.5, sin(uv.x * 10.0 + uTime));
    col *= (0.8 + 0.2 * decay);

    gl_FragColor = vec4(col, tex.a * uOpacity);
  }
`;

const RUBY_FRAG = `
  varying vec2 vUv;
  uniform sampler2D uTexture;
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uOpacity;

  void main() {
    vec4 tex = texture2D(uTexture, vUv);
    
    // Facet shine
    float shine = pow(max(0.0, sin(vUv.x * 10.0 + vUv.y * 10.0 + uTime * 2.0)), 8.0);
    
    vec3 col = tex.rgb * uColor * 2.0;
    col += vec3(1.0) * shine * tex.a * 0.8;

    gl_FragColor = vec4(col, tex.a * uOpacity);
  }
`;

// --- SCENE FACTORY ---

const createTeamScene = (teamId: string, colorHex: string, logo: string) => {
    const root = new THREE.Group();
    const color = new THREE.Color(colorHex);
    const texture = createLogoTexture(logo, colorHex);

    let frag = PYTHON_FRAG;
    if (teamId === 't2') frag = AJAX_FRAG;
    if (teamId === 't3') frag = JAVA_FRAG;
    if (teamId === 't4') frag = RUBY_FRAG;

    const logoMat = new THREE.ShaderMaterial({
        uniforms: {
            uTexture: { value: texture },
            uColor: { value: color },
            uTime: { value: 0 },
            uOpacity: { value: 0 }
        },
        vertexShader: COMMON_VERTEX,
        fragmentShader: frag,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    });
    
    const logoMesh = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), logoMat); 
    root.add(logoMesh);

    const extras = new THREE.Group();
    root.add(extras);

    const tickFunctions: ((t: number) => void)[] = [];

    // Common Background Particles for depth
    const pGeo = new THREE.BufferGeometry();
    const pCount = 50;
    const pPos = new Float32Array(pCount * 3);
    for(let i=0; i<pCount; i++) {
        pPos[i*3] = (Math.random()-0.5) * 10;
        pPos[i*3+1] = (Math.random()-0.5) * 10;
        pPos[i*3+2] = (Math.random()-0.5) * 5;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({ color: colorHex, size: 0.1, transparent: true, opacity: 0.6 });
    const particles = new THREE.Points(pGeo, pMat);
    extras.add(particles);
    tickFunctions.push((t) => {
        particles.rotation.y = t * 0.05;
    });

    if (teamId === 't1') {
        const path = new THREE.CatmullRomCurve3([
            new THREE.Vector3(4, -2, 0),
            new THREE.Vector3(-4, -1, 2),
            new THREE.Vector3(4, 1, -2),
            new THREE.Vector3(-3, 3, 0)
        ]);
        const tubeGeo = new THREE.TubeGeometry(path, 64, 0.3, 8, false);
        const tubeMat = new THREE.MeshBasicMaterial({ 
            color: colorHex, 
            wireframe: true,
            transparent: true,
            opacity: 0.3, 
            blending: THREE.AdditiveBlending
        });
        const tube = new THREE.Mesh(tubeGeo, tubeMat);
        extras.add(tube);
        
        const headGeo = new THREE.BoxGeometry(0.8, 0.3, 1.0);
        const headMat = new THREE.MeshBasicMaterial({ color: colorHex });
        const head = new THREE.Mesh(headGeo, headMat);
        extras.add(head);

        tickFunctions.push((t) => {
            tube.rotation.y = Math.sin(t * 0.3) * 0.1;
            const pos = (t * 0.2) % 1;
            const point = path.getPointAt(pos);
            const tangent = path.getTangentAt(pos);
            head.position.copy(point);
            head.lookAt(point.clone().add(tangent));
        });
    }

    if (teamId === 't2') {
        const ringGeo = new THREE.TorusGeometry(4.5, 0.08, 16, 100);
        const ringMat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        extras.add(ring);

        const boltCount = 8;
        const bolts: THREE.Line[] = [];
        for(let i=0; i<boltCount; i++) {
             const pts = new Array(5).fill(0).map(() => new THREE.Vector3());
             const g = new THREE.BufferGeometry().setFromPoints(pts);
             const m = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
             const l = new THREE.Line(g, m);
             bolts.push(l);
             extras.add(l);
        }

        tickFunctions.push((t) => {
            ring.rotation.z = -t * 1.5;
            ring.rotation.x = Math.sin(t) * 0.4;
            bolts.forEach((bolt) => {
                if(Math.random() > 0.85) {
                    const positions = bolt.geometry.attributes.position.array as Float32Array;
                    const ang = Math.random() * Math.PI * 2;
                    let curr = new THREE.Vector3(Math.cos(ang)*4.5, Math.sin(ang)*4.5, 0);
                    for(let i=0; i<5; i++) {
                        positions[i*3] = curr.x;
                        positions[i*3+1] = curr.y;
                        positions[i*3+2] = curr.z;
                        curr.x *= 0.7; curr.y *= 0.7; curr.z += (Math.random()-0.5)*3;
                    }
                    bolt.geometry.attributes.position.needsUpdate = true;
                    (bolt.material as THREE.LineBasicMaterial).opacity = 1;
                } else {
                    (bolt.material as THREE.LineBasicMaterial).opacity *= 0.7;
                }
            });
        });
    }

    if (teamId === 't3') {
        const cubes = new THREE.Group();
        const geo = new THREE.BoxGeometry(1.2, 5, 1.2);
        const mat = new THREE.MeshBasicMaterial({ color: colorHex, wireframe: true, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending });
        for(let i=0; i<6; i++) {
            const mesh = new THREE.Mesh(geo, mat);
            const a = (i/6) * Math.PI * 2;
            mesh.position.set(Math.cos(a)*5, 0, Math.sin(a)*5);
            mesh.lookAt(0,0,0);
            cubes.add(mesh);
        }
        extras.add(cubes);
        tickFunctions.push((t) => {
            cubes.rotation.y = t * 0.3;
            cubes.children.forEach((c, i) => {
                c.position.y = Math.sin(t + i) * 2;
                c.rotation.z = Math.sin(t*2 + i) * 0.2;
            });
        });
    }

    if (teamId === 't4') {
        const mainGeo = new THREE.OctahedronGeometry(2.2, 0);
        const mainMat = new THREE.MeshBasicMaterial({ color: colorHex, wireframe: true, blending: THREE.AdditiveBlending });
        const main = new THREE.Mesh(mainGeo, mainMat);
        extras.add(main);
        const shardsGroup = new THREE.Group();
        const shardGeo = new THREE.ConeGeometry(0.3, 1.2, 3);
        const shardMat = new THREE.MeshBasicMaterial({ color: colorHex, opacity: 0.8, transparent: true });
        for(let i=0; i<16; i++) {
            const shard = new THREE.Mesh(shardGeo, shardMat);
            shard.position.set(3.5, 0, 0);
            const pivot = new THREE.Group();
            pivot.rotation.z = (i/16) * Math.PI * 2;
            pivot.rotation.y = Math.random() * Math.PI;
            pivot.add(shard);
            shardsGroup.add(pivot);
        }
        extras.add(shardsGroup);
        tickFunctions.push((t) => {
            main.rotation.x = t; main.rotation.y = t * 0.5;
            shardsGroup.rotation.z = -t * 0.8; 
            shardsGroup.rotation.x = Math.sin(t * 0.5) * 0.5;
        });
    }

    const update = (time: number) => {
        logoMat.uniforms.uTime.value = time;
        logoMesh.position.y = Math.sin(time) * 0.3; 
        tickFunctions.forEach(fn => fn(time));
    };

    return { root, logoMat, update, extras };
};

const TeamSelector: React.FC<TeamSelectorProps> = ({ onSelect }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const teamKeys = useMemo(() => Object.keys(TEAMS).slice(0, 4), []);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitioningTeam, setTransitioningTeam] = useState<string | null>(null);
  
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameIdRef = useRef<number>(0);
  const sceneObjects = useRef<any[]>([]);

  const [displayText, setDisplayText] = useState("");
  useEffect(() => {
    const target = TEAMS[teamKeys[activeIndex]].name.toUpperCase();
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ_#@%$&";
    let iter = 0;
    const interval = setInterval(() => {
        setDisplayText(target.split("").map((c, i) => {
            if(i < iter) return c;
            return chars[Math.floor(Math.random() * chars.length)];
        }).join(""));
        if(iter >= target.length) clearInterval(interval);
        iter += 1/2; 
    }, 40);
    return () => clearInterval(interval);
  }, [activeIndex, teamKeys]);

  useEffect(() => {
    if (!mountRef.current) return;
    const w = mountRef.current.clientWidth;
    const h = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 0, 20);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const gridHelper = new THREE.GridHelper(100, 100, 0x333333, 0x111111);
    gridHelper.rotation.x = Math.PI / 2;
    gridHelper.position.z = -12;
    scene.add(gridHelper);

    // Add Lights for non-shader materials
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);
    
    const spotLight = new THREE.SpotLight(0xffffff, 2);
    spotLight.position.set(-10, 10, 20);
    spotLight.lookAt(0, 0, 0);
    scene.add(spotLight);

    teamKeys.forEach((key, i) => {
        const t = TEAMS[key];
        const obj = createTeamScene(key, t.color, t.logo);
        obj.root.visible = i === 0;
        if(i === 0) obj.logoMat.uniforms.uOpacity.value = 1;
        scene.add(obj.root);
        sceneObjects.current.push(obj);
    });

    const clock = new THREE.Clock();
    const animate = () => {
        if (!mountRef.current) return;
        const time = clock.getElapsedTime();
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        const aspect = width / height;
        const isMobile = width < 1024;

        // Dynamic viewport calculation
        const vH = 2 * 20 * Math.tan((45 * Math.PI) / 360);
        const vW = vH * aspect;

        if (isMobile) {
            camera.position.lerp(new THREE.Vector3(0, 0, 26), 0.05);
            camera.lookAt(0, 2, 0);
        } else {
            camera.position.lerp(new THREE.Vector3(0, 0, 20), 0.05);
            camera.lookAt(0, 0, 0);
        }

        const teamColor = new THREE.Color(TEAMS[teamKeys[activeIndex]].color);
        (gridHelper.material as THREE.LineBasicMaterial).color.lerp(teamColor, 0.02);
        gridHelper.rotation.z = time * 0.05;
        spotLight.color.lerp(teamColor, 0.05);

        sceneObjects.current.forEach(obj => {
            if(obj.root.visible) {
                obj.update(time);
                
                if (isMobile) {
                    obj.root.position.set(0, 4.5, 0);
                    obj.root.scale.setScalar(0.75);
                } else {
                    // LEFT ALIGNMENT
                    // Center of left half is -vW/4 (0.25).
                    const targetX = -vW * 0.25; // PERFECT CENTER OF LEFT COLUMN
                    
                    obj.root.position.lerp(new THREE.Vector3(targetX, 0, 0), 0.1);
                    obj.root.scale.setScalar(1.45); // Slightly smaller to prevent overlap
                }
                
                // Idle Rotation
                obj.root.rotation.y = Math.sin(time * 0.3) * 0.15;
                obj.root.rotation.z = Math.cos(time * 0.2) * 0.08;
            }
        });

        renderer.render(scene, camera);
        frameIdRef.current = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
        if(!mountRef.current) return;
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(frameIdRef.current);
        if(mountRef.current && renderer.domElement) mountRef.current.removeChild(renderer.domElement);
        renderer.dispose();
    };
  }, [activeIndex, teamKeys]);

  const changeTeam = (dir: 'next' | 'prev') => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      const nextIdx = dir === 'next' ? (activeIndex + 1) % teamKeys.length : (activeIndex - 1 + teamKeys.length) % teamKeys.length;
      
      const prevObj = sceneObjects.current[activeIndex];
      const nextObj = sceneObjects.current[nextIdx];
      
      const tl = gsap.timeline({ onComplete: () => { setActiveIndex(nextIdx); setIsTransitioning(false); }});

      tl.to(prevObj.logoMat.uniforms.uOpacity, { value: 0, duration: 0.3 });
      tl.to(prevObj.root.scale, { x: 0, y: 0, z: 0, duration: 0.4, ease: "back.in(1.5)" }, "<");
      tl.set(prevObj.root, { visible: false });

      tl.set(nextObj.root, { visible: true }, ">");
      tl.fromTo(nextObj.root.scale, { x: 0, y: 0, z: 0 }, { x: 1.45, y: 1.45, z: 1.45, duration: 0.6, ease: "elastic.out(1, 0.6)" });
      tl.to(nextObj.logoMat.uniforms.uOpacity, { value: 1, duration: 0.5 }, "<0.2");
  };

  const handleInitialize = () => {
      setTransitioningTeam(currentTeam.id);
  };

  const currentTeam = TEAMS[teamKeys[activeIndex]];
  const StatIcons = [Cpu, Zap, Shield, Activity];

  return (
    <div className="relative w-full h-screen bg-[#05050a] flex flex-col overflow-hidden border-t border-gray-900">
        {transitioningTeam && (
            <FactionEntryTransition 
                teamId={transitioningTeam} 
                onComplete={() => onSelect(transitioningTeam)} 
            />
        )}
        
        {/* BACKGROUND LAYER */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_50%,rgba(10,10,20,0.8)_0%,#05050a_70%)] pointer-events-none z-0"></div>
        
        {/* 3D LAYER - Placed AFTER background so it's visible */}
        <div ref={mountRef} className="absolute inset-0 z-1 pointer-events-none" />
        
        {/* LAYOUT GRID - Text Content */}
        <div className="relative z-10 w-full h-full grid grid-cols-1 md:grid-cols-2 pointer-events-none">
            
            {/* LEFT COL: Reserved for 3D Model */}
            <div className="hidden md:block relative h-full">
                 {/* Spotlight Glow behind model - Centered in this col */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[var(--color)] opacity-20 blur-[100px] rounded-full transition-colors duration-500" style={{ '--color': currentTeam.color } as React.CSSProperties}></div>
            </div>

            {/* RIGHT COL: CONTENT */}
            <div className="flex flex-col justify-end md:justify-center p-6 md:p-12 h-full pointer-events-none border-l border-white/5 bg-gradient-to-l from-black/90 via-black/50 to-transparent backdrop-blur-[2px]">
                 <div className="pointer-events-auto max-w-xl w-full mr-auto md:ml-12 md:mr-auto">
                    
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-8 animate-in slide-in-from-right-8 fade-in duration-700">
                        <Hexagon size={20} className="text-gray-500 animate-spin-slow" />
                        <span className="font-mono text-sm text-[var(--color)] tracking-[0.4em] uppercase font-bold" style={{ '--color': currentTeam.color } as React.CSSProperties}>
                            FACTION // 0{activeIndex + 1}
                        </span>
                    </div>

                    {/* TITLE */}
                    <h1 className="text-6xl sm:text-7xl lg:text-9xl font-black font-cyber text-white leading-[0.85] tracking-tighter mb-8 drop-shadow-[0_0_30px_rgba(255,255,255,0.15)] break-words">
                        {displayText}
                    </h1>
                    
                    {/* Lore Box */}
                    <div className="relative pl-8 mb-12 transition-colors duration-500 border-l-4" style={{ borderColor: currentTeam.color }}>
                        <div className="absolute -left-[11px] top-0 w-5 h-5 bg-black border-2 border-white rounded-full"></div>
                        <h3 className="text-xl font-bold text-white mb-2">{currentTeam.description}</h3>
                        <p className="text-gray-400 font-ui text-sm md:text-lg leading-relaxed uppercase tracking-wide opacity-80">
                            Elite operatives specializing in high-velocity code deployment and neural network optimization.
                        </p>
                    </div>

                    {/* Stats HUD */}
                    <div className="grid grid-cols-2 gap-x-12 gap-y-8 mb-12 opacity-90 max-w-xl">
                        {['POWER', 'SPEED', 'DEFENSE', 'RANGE'].map((stat, i) => {
                            const Icon = StatIcons[i];
                            const val = 60 + Math.random() * 40;
                            return (
                                <div key={stat} className="group">
                                    <div className="flex justify-between text-xs font-bold text-gray-400 tracking-widest mb-2 group-hover:text-white transition-colors">
                                        <span className="flex items-center gap-2"><Icon size={14} /> {stat}</span>
                                        <span className="font-mono">{Math.floor(val)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-gray-800/50 skew-x-[-20deg] overflow-hidden">
                                        <div className="h-full transition-all duration-1000 ease-out shadow-[0_0_10px_currentColor]" 
                                             style={{ width: `${val}%`, backgroundColor: currentTeam.color, color: currentTeam.color }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* CTA Button */}
                    <button 
                        onClick={handleInitialize}
                        className="group relative inline-flex items-center gap-6 px-12 py-6 bg-white text-black font-black font-cyber tracking-widest text-lg hover:scale-[1.02] transition-transform overflow-hidden clip-path-slant"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ '--color': currentTeam.color } as React.CSSProperties}></div>
                        <span className="relative z-10 flex items-center gap-3">
                             INITIALIZE UPLINK <Target size={24} className="group-hover:rotate-90 transition-transform duration-500"/>
                        </span>
                    </button>
                 </div>
            </div>

        </div>

        {/* CONTROLS (Absolute) - Positioned Bottom Left of the screen/viewport */}
        <div className="absolute bottom-10 left-8 md:left-16 z-30 flex flex-col gap-6 items-start pointer-events-none">
             <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                <MousePointer2 size={12} /> Navigation Control
             </div>
             {/* Nav */}
             <div className="flex gap-4 pointer-events-auto">
                <button onClick={() => changeTeam('prev')} className="w-16 h-16 border border-white/10 bg-black/60 backdrop-blur text-white hover:bg-white hover:text-black hover:border-white transition-all active:scale-95 flex items-center justify-center rounded-full group">
                    <ChevronLeft size={28} className="group-hover:-translate-x-1 transition-transform" />
                </button>
                <button onClick={() => changeTeam('next')} className="w-16 h-16 border border-white/10 bg-black/60 backdrop-blur text-white hover:bg-white hover:text-black hover:border-white transition-all active:scale-95 flex items-center justify-center rounded-full group">
                    <ChevronRight size={28} className="group-hover:translate-x-1 transition-transform" />
                </button>
             </div>
             
             {/* Pagination Dots */}
             <div className="flex gap-3 items-center mt-2">
                {teamKeys.map((k, i) => (
                    <button 
                        key={k} 
                        onClick={() => {
                             if(isTransitioning) return;
                             const dir = i > activeIndex ? 'next' : 'prev';
                        }}
                        className={`h-1.5 transition-all duration-300 rounded-full ${i === activeIndex ? 'w-12 bg-white shadow-[0_0_10px_white]' : 'w-1.5 bg-gray-700'}`}
                    />
                ))}
             </div>
        </div>

    </div>
  );
};

export default TeamSelector;
