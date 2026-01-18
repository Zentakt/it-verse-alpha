import React, { useState, useEffect, useRef } from 'react';
import { LiveStream } from '../types';
import { X, ArrowLeft, Clock, Play, Zap, Trophy, Users } from 'lucide-react';
import gsap from 'gsap';
import * as THREE from 'three';

interface EnhancedStreamViewProps {
    stream: LiveStream;
    onClose: () => void;
}

// ============ 3D SCOREBOARD COMPONENT ============
const ScoreboardCanvas: React.FC<{ team1: { name: string; logo?: string; score: number }, team2: { name: string; logo?: string; score: number }, isLive: boolean }> = ({ team1, team2, isLive }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);

    useEffect(() => {
        if (!canvasRef.current || !containerRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        sceneRef.current = scene;
        const camera = new THREE.PerspectiveCamera(75, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true, alpha: true });
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        renderer.setClearColor(0x000000, 0.1);
        camera.position.z = 5;

        // Create background grid
        const gridGeometry = new THREE.PlaneGeometry(20, 10, 40, 20);
        const gridMaterial = new THREE.LineBasicMaterial({ color: 0x7c3aed, wireframe: true, transparent: true, opacity: 0.15 });
        const grid = new THREE.LineSegments(new THREE.EdgesGeometry(gridGeometry), gridMaterial);
        scene.add(grid);

        // Create 3D score boxes
        const createScoreBox = (position: number) => {
            const group = new THREE.Group();
            const boxGeometry = new THREE.BoxGeometry(1.8, 1.2, 0.5);
            const boxMaterial = new THREE.MeshPhongMaterial({ color: 0x9333ea, emissive: 0x6d28d9, emissiveIntensity: 0.5 });
            const box = new THREE.Mesh(boxGeometry, boxMaterial);
            box.position.x = position;
            group.add(box);

            // Add glow effect with lines
            const edgeGeometry = new THREE.EdgesGeometry(boxGeometry);
            const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.8 });
            const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
            group.add(edges);

            return { group, box };
        };

        const scoreBox1 = createScoreBox(-2.5);
        const scoreBox2 = createScoreBox(2.5);
        scene.add(scoreBox1.group);
        scene.add(scoreBox2.group);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        const pointLight = new THREE.PointLight(0x7c3aed, 2);
        pointLight.position.set(5, 5, 5);
        scene.add(pointLight);

        // Animation loop
        let animationId: number;
        const animate = () => {
            const wrappedAnimate = () => {
                animate();
                animationId = requestAnimationFrame(wrappedAnimate);
            };
            animationId = requestAnimationFrame(wrappedAnimate);
            
            // Rotate boxes
            scoreBox1.box.rotation.x += 0.005;
            scoreBox1.box.rotation.z += 0.003;
            scoreBox2.box.rotation.x -= 0.005;
            scoreBox2.box.rotation.z -= 0.003;

            // Pulsing effect for live matches
            if (isLive) {
                const pulse = 1 + Math.sin(Date.now() * 0.005) * 0.1;
                scoreBox1.box.scale.set(pulse, pulse, pulse);
                scoreBox2.box.scale.set(pulse, pulse, pulse);
            }

            // Rotate grid
            grid.rotation.z += 0.0005;

            renderer.render(scene, camera);
        };
        animate();

        // Handle resize
        const handleResize = () => {
            if (!containerRef.current) return;
            const width = containerRef.current.clientWidth;
            const height = containerRef.current.clientHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationId);
            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, [isLive]);

    return (
        <div ref={containerRef} className="w-full h-40 relative rounded-xl overflow-hidden border border-white/10 bg-black/50 backdrop-blur">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
            {/* Score overlay on top of 3D scene */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="flex items-center gap-8">
                    <div className="text-center">
                        <div className="text-4xl md:text-5xl font-black font-mono text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text">
                            {team1.score}
                        </div>
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-gray-500">:</div>
                    <div className="text-center">
                        <div className="text-4xl md:text-5xl font-black font-mono text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text">
                            {team2.score}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============ ENHANCED SCOREBOARD DISPLAY ============
const EnhancedScoreboard: React.FC<{ team1: { name: string; logo?: string; score: number }, team2: { name: string; logo?: string; score: number }, isLive: boolean }> = ({ team1, team2, isLive }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        gsap.from(containerRef.current, {
            duration: 0.8,
            opacity: 0,
            y: 30,
            ease: 'power3.out'
        });
        if (isLive) {
            const liveIndicator = containerRef.current.querySelector('[data-live-indicator]');
            if (liveIndicator) {
                gsap.to(liveIndicator, {
                    duration: 1.5,
                    scale: [1, 1.05, 1],
                    repeat: -1,
                    ease: 'sine.inOut'
                });
            }
        }
    }, [isLive]);

    return (
        <div ref={containerRef} className="w-full relative rounded-2xl overflow-hidden bg-gradient-to-br from-purple-900/20 via-black to-cyan-900/20 border border-white/10">
            {/* 3D Background Canvas */}
            <div className="absolute inset-0 opacity-30">
                <ScoreboardCanvas team1={team1} team2={team2} isLive={isLive} />
            </div>

            {/* Unified Scoreboard Content */}
            <div className="relative z-10 p-6 md:p-8">
                {/* Live Indicator at top */}
                {isLive && (
                    <div data-live-indicator className="flex items-center justify-center gap-2 mb-4">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Live Match</span>
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    </div>
                )}

                {/* Main Scoreboard Grid */}
                <div className="grid grid-cols-[1fr_auto_1fr] gap-4 md:gap-8 items-center">
                    {/* Team 1 */}
                    <div className="flex items-center gap-3 md:gap-4 justify-end">
                        <div className="text-right">
                            <div className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-1">Team A</div>
                            <h3 className="text-lg md:text-2xl font-bold text-white truncate">
                                {team1.name}
                            </h3>
                        </div>
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0 overflow-hidden hover:scale-110 transition-transform">
                            {team1.logo ? (
                                team1.logo.startsWith('data:') || team1.logo.startsWith('http') ? (
                                    <img src={team1.logo} alt={team1.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl md:text-3xl">{team1.logo}</span>
                                )
                            ) : (
                                <Users size={24} className="text-purple-400/50" />
                            )}
                        </div>
                    </div>

                    {/* Center Score Display */}
                    <div className="flex flex-col items-center gap-2 px-4 md:px-6 py-3 bg-black/50 backdrop-blur-sm rounded-xl border border-white/20">
                        <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Score</div>
                        <div className="flex items-center gap-3">
                            <div className="text-4xl md:text-6xl font-black font-mono text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text">
                                {team1.score}
                            </div>
                            <div className="text-2xl md:text-4xl font-bold text-gray-600">:</div>
                            <div className="text-4xl md:text-6xl font-black font-mono text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text">
                                {team2.score}
                            </div>
                        </div>
                    </div>

                    {/* Team 2 */}
                    <div className="flex items-center gap-3 md:gap-4 justify-start">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0 overflow-hidden hover:scale-110 transition-transform">
                            {team2.logo ? (
                                team2.logo.startsWith('data:') || team2.logo.startsWith('http') ? (
                                    <img src={team2.logo} alt={team2.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl md:text-3xl">{team2.logo}</span>
                                )
                            ) : (
                                <Users size={24} className="text-cyan-400/50" />
                            )}
                        </div>
                        <div className="text-left">
                            <div className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-1">Team B</div>
                            <h3 className="text-lg md:text-2xl font-bold text-white truncate">
                                {team2.name}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
// ============ MAIN ENHANCED STREAM VIEW ============
const EnhancedStreamView: React.FC<EnhancedStreamViewProps> = ({ stream, onClose }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLDivElement>(null);
    const particlesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Entrance animation
        gsap.from(containerRef.current, {
            duration: 0.4,
            opacity: 0,
            ease: 'power2.out'
        });

        // Content slide up
        if (contentRef.current) {
            gsap.from(contentRef.current, {
                duration: 0.6,
                y: 30,
                opacity: 0,
                ease: 'power3.out',
                delay: 0.1
            });
        }

        // Video element zoom effect
        if (videoRef.current) {
            gsap.from(videoRef.current, {
                duration: 0.8,
                scale: 0.95,
                opacity: 0,
                ease: 'power2.out'
            });
        }
    }, []);

    // Create particle effects for live matches
    useEffect(() => {
        if (!stream.status === 'live' || !particlesRef.current) return;

        const particles = particlesRef.current;
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'absolute w-1 h-1 bg-purple-500 rounded-full';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particles.appendChild(particle);

            // Animate particle
            gsap.to(particle, {
                duration: Math.random() * 2 + 1,
                y: (Math.random() - 0.5) * 200,
                x: (Math.random() - 0.5) * 200,
                opacity: 0,
                repeat: -1,
                delay: Math.random() * 0.5
            });
        }
    }, [stream.status]);

    return (
        <div ref={containerRef} className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-sm flex flex-col overflow-hidden">
            {/* Particle background for live */}
            {stream.status === 'live' && (
                <div ref={particlesRef} className="absolute inset-0 pointer-events-none opacity-50"></div>
            )}

            {/* Header with navigation */}
            <div className="sticky top-0 z-50 bg-gradient-to-b from-black via-black/95 to-transparent border-b border-white/5 backdrop-blur-xl">
                <div className="max-w-5xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-all duration-300 group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">Back</span>
                    </button>

                    <div className="flex items-center gap-3">
                        {stream.status === 'live' && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-600/20 border border-red-500/50 rounded-full backdrop-blur-sm">
                                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Live</span>
                            </div>
                        )}
                        {stream.status === 'scheduled' && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-600/20 border border-yellow-500/30 rounded-full backdrop-blur-sm">
                                <Clock size={12} />
                                <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">Scheduled</span>
                            </div>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-red-600/30 text-gray-400 hover:text-red-400 transition-all duration-300"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-5xl mx-auto w-full px-4 md:px-6 py-6">
                    {/* Video Player */}
                    <div ref={videoRef} className="relative w-full mb-6 max-w-5xl mx-auto">
                        <div className="relative w-full aspect-video rounded-xl md:rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_60px_rgba(124,58,237,0.3)] group">
                            {/* Prominent exit/back controls overlaid on video */}
                            <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between">
                                <button
                                    onClick={onClose}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black/70 border-2 border-white/30 text-white hover:bg-black/90 hover:border-white/60 backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.8)] transition-all font-semibold text-sm"
                                >
                                    <ArrowLeft size={18} />
                                    <span>BACK</span>
                                </button>
                                <button
                                    onClick={onClose}
                                    className="flex items-center justify-center w-10 h-10 rounded-full bg-red-600/70 hover:bg-red-600 border-2 border-red-500 text-white backdrop-blur-md shadow-[0_0_20px_rgba(220,38,38,0.8)] transition-all hover:scale-110 active:scale-95"
                                    aria-label="Close Stream"
                                    title="Close Stream"
                                >
                                    <X size={22} className="font-bold" />
                                </button>
                            </div>
                            {stream.embed_url ? (
                                <iframe
                                    src={stream.embed_url}
                                    title={stream.title}
                                    className="w-full h-full"
                                    allowFullScreen
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                />
                            ) : stream.thumbnail_url ? (
                                <div className="relative w-full h-full">
                                    <img
                                        src={stream.thumbnail_url}
                                        alt={stream.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                                        <div className="w-20 h-20 md:w-32 md:h-32 rounded-full bg-red-600 flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.6)] group-hover:scale-110 transition-transform duration-300 cursor-pointer">
                                            <Play size={48} fill="white" className="text-white ml-2" />
                                        </div>
                                        <p className="text-white/80 text-sm font-medium mt-4">Click to play</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-cyan-900/30 flex flex-col items-center justify-center">
                                    <Play size={64} className="text-white/20 mb-4" />
                                    <div className="text-gray-500 font-mono text-sm tracking-widest uppercase">Stream Unavailable</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Scoreboard - right beneath the video */}
                    {(stream.team1_name || stream.team2_name) && (
                        <div className="mb-8">
                            <EnhancedScoreboard
                                team1={{
                                    name: stream.team1_name || 'Team 1',
                                    logo: stream.team1_logo,
                                    score: stream.team1_score ?? 0
                                }}
                                team2={{
                                    name: stream.team2_name || 'Team 2',
                                    logo: stream.team2_logo,
                                    score: stream.team2_score ?? 0
                                }}
                                isLive={stream.status === 'live'}
                            />
                        </div>
                    )}

                    {/* Content section */}
                    <div ref={contentRef} className="space-y-8">
                        {/* Stream Title & Description */}
                        <div className="space-y-4">
                            <div>
                                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black font-cyber text-white leading-tight mb-4">
                                    {stream.title}
                                </h1>
                                {stream.description && (
                                    <p className="text-gray-400 text-base md:text-lg leading-relaxed">
                                        {stream.description}
                                    </p>
                                )}
                            </div>

                            {/* Info Cards Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
                                {stream.game_category && (
                                    <div className="group relative overflow-hidden rounded-lg p-4 bg-gradient-to-br from-purple-900/30 to-black border border-purple-500/30 hover:border-purple-500/60 transition-all duration-300">
                                        <div className="relative z-10">
                                            <div className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                                                <Zap size={12} /> Game
                                            </div>
                                            <div className="text-sm font-bold text-white">{stream.game_category}</div>
                                        </div>
                                    </div>
                                )}

                                <div className="group relative overflow-hidden rounded-lg p-4 bg-gradient-to-br from-cyan-900/30 to-black border border-cyan-500/30 hover:border-cyan-500/60 transition-all duration-300">
                                    <div className="relative z-10">
                                        <div className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                                            <Trophy size={12} /> Status
                                        </div>
                                        <div className={`text-sm font-bold ${
                                            stream.status === 'live' ? 'text-red-400' :
                                            stream.status === 'scheduled' ? 'text-yellow-400' :
                                            'text-gray-400'
                                        }`}>
                                            {stream.status.charAt(0).toUpperCase() + stream.status.slice(1)}
                                        </div>
                                    </div>
                                </div>

                                {stream.placement && (
                                    <div className="group relative overflow-hidden rounded-lg p-4 bg-gradient-to-br from-pink-900/30 to-black border border-pink-500/30 hover:border-pink-500/60 transition-all duration-300">
                                        <div className="relative z-10">
                                            <div className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                                                <Trophy size={12} /> Placement
                                            </div>
                                            <div className="text-sm font-bold text-white capitalize">{stream.placement}</div>
                                        </div>
                                    </div>
                                )}

                                <div className="group relative overflow-hidden rounded-lg p-4 bg-gradient-to-br from-orange-900/30 to-black border border-orange-500/30 hover:border-orange-500/60 transition-all duration-300">
                                    <div className="relative z-10">
                                        <div className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                                            <Clock size={12} /> Started
                                        </div>
                                        <div className="text-sm font-bold text-white">{new Date(stream.created_at).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnhancedStreamView;