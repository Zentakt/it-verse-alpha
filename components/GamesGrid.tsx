
import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react';
import { GameEvent, Team, LiveStream } from '../types';
import { Play, ChevronLeft, ChevronRight, Zap, Star, Tag, Trophy, ArrowLeft, ArrowRight, Monitor, Clock, X } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import EnhancedStreamView from './EnhancedStreamView';

gsap.registerPlugin(ScrollTrigger);

// --- SHARED COMPONENTS ---

const LiveBadge: React.FC = () => (
    <div className="inline-flex items-center gap-1.5 bg-[#ea0029] text-white text-[10px] font-bold px-2 py-0.5 rounded-[2px] uppercase tracking-wider shadow-lg">
        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
        LIVE
    </div>
);

const TagPill: React.FC<{ label: string }> = ({ label }) => (
    <span className="text-[10px] font-bold text-gray-400 bg-[#1a1a1f] px-2 py-0.5 rounded border border-white/5 uppercase tracking-wide">
        {label}
    </span>
);

// --- GLITCH CARD COMPONENT (REFINED) ---

const GLITCH_COLORS = ['#ff00de', '#00ffff', '#ffff00', '#ff0000', '#00ff00', '#7c3aed'];

interface GameCardProps {
    item: GameEvent;
    onSelect: (evt: GameEvent) => void;
    showLiveBadge?: boolean;
}

const GameCard: React.FC<GameCardProps> = ({ item, onSelect, showLiveBadge = true }) => {
    const [accentColor, setAccentColor] = useState('#9333ea');

    const handleMouseEnter = () => {
        setAccentColor(GLITCH_COLORS[Math.floor(Math.random() * GLITCH_COLORS.length)]);
    };

    return (
        <div 
            onClick={() => onSelect(item)}
            onMouseEnter={handleMouseEnter}
            className="w-[280px] md:w-[320px] cursor-pointer group relative perspective-1000"
        >
            {/* HOVER SHADOW BLOCK - Hidden by default, appears on hover */}
            <div 
                className="absolute inset-0 z-0 transition-all duration-300 ease-out rounded-lg opacity-0 group-hover:opacity-100"
                style={{ 
                    backgroundColor: accentColor,
                    transform: 'translate(-6px, 6px)', // Offset to Bottom-Left
                }}
            ></div>

            {/* Thumbnail Container (Top Layer) */}
            <div className="relative z-10 flex flex-col gap-3 bg-[#0e0e10] p-0 transition-transform duration-300 ease-out group-hover:-translate-y-1 group-hover:translate-x-1 border border-white/5 group-hover:border-transparent rounded-lg h-full">
                <div className="relative aspect-video bg-[#1f1f23] overflow-hidden rounded-t-lg">
                    <img src={item.image} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    
                    {/* Live Badge */}
                    {showLiveBadge && (
                        <div className="absolute top-2 left-2">
                            <LiveBadge />
                        </div>
                    )}

                    {/* Viewer Count Overlay Removed */}
                    
                    {/* Hover Glitch Overlay */}
                    <div className="absolute inset-0 bg-white/10 pointer-events-none mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-20"></div>
                    </div>
                </div>
                
                {/* Meta Info */}
                <div className="px-3 pb-4">
                    <div className="flex justify-between items-start">
                        <h4 
                            className="text-base font-bold text-white leading-tight mb-1 truncate transition-colors duration-200 group-hover:text-[var(--accent)]" 
                            style={{ '--accent': accentColor } as React.CSSProperties}
                            title={item.title}
                        >
                            {item.title}
                        </h4>
                    </div>
                    <div className="text-xs text-gray-400 mb-3">
                        {item.game}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        <TagPill label="Esports" />
                        {item.bracketType && <TagPill label={item.bracketType} />}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- HERO CAROUSEL COMPONENT ---

interface HeroShowcaseProps {
    events: GameEvent[];
    onPlay: (evt: GameEvent) => void;
}

const HeroShowcase: React.FC<HeroShowcaseProps> = ({ events, onPlay }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    
    // Refs for animation
    const heroRef = useRef<HTMLDivElement>(null);
    const bgRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);
    const carouselRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const activeEvent = events[activeIndex];

    const handleNext = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setActiveIndex(prev => (prev + 1) % events.length);
        setIsAutoPlaying(false);
    };

    const handlePrev = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setActiveIndex(prev => (prev - 1 + events.length) % events.length);
        setIsAutoPlaying(false);
    };

    // Auto-rotation
    useEffect(() => {
        if (isAutoPlaying) {
            timerRef.current = setTimeout(() => {
                setActiveIndex(prev => (prev + 1) % events.length);
            }, 8000);
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [activeIndex, isAutoPlaying, events.length]);

    // Animations when activeIndex changes
    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            // Text Stagger
            if (textRef.current) {
                gsap.fromTo(textRef.current.children, 
                    { y: 20, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: "power2.out" }
                );
            }
            
            // BG Fade
            if (bgRef.current) {
                gsap.fromTo(bgRef.current,
                    { scale: 1.1, opacity: 0.5 },
                    { scale: 1, opacity: 1, duration: 1.5, ease: "power2.out" }
                );
            }

            // Scroll carousel to keep active item visible
            if (carouselRef.current) {
                const activeCard = carouselRef.current.children[activeIndex] as HTMLElement;
                if (activeCard) {
                    activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                }
            }

        }, heroRef);
        return () => ctx.revert();
    }, [activeIndex]);

    if (!activeEvent) return null;

    return (
        <div 
            ref={heroRef} 
            className="relative w-full h-[450px] md:h-[650px] overflow-hidden group mb-8 md:mb-12 bg-[#0e0e10]"
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
        >
            {/* 1. CINEMATIC BACKGROUND */}
            <div className="absolute inset-0">
                <div ref={bgRef} key={`bg-${activeEvent.id}`} className="absolute inset-0">
                    <img 
                        src={activeEvent.image} 
                        alt="Hero BG" 
                        className="w-full h-full object-cover transition-opacity duration-1000" 
                    />
                    {/* Strong Gradient Overlay for Text Readability (Left Side) */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0e0e10] via-[#0e0e10]/60 to-transparent w-[85%]"></div>
                    {/* Bottom Gradient for Carousel */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e10] via-transparent to-transparent opacity-90"></div>
                </div>
            </div>

            {/* 2. MAIN CONTENT (LEFT) */}
            <div className="absolute inset-0 flex flex-col justify-center px-4 md:px-16 z-10 pointer-events-none">
                <div ref={textRef} className="max-w-2xl flex flex-col items-start pointer-events-auto pb-28 md:pb-0">
                    {/* Top Meta */}
                    <div className="flex items-center gap-3 mb-2 md:mb-4">
                        <LiveBadge />
                        <span className="text-gray-300 font-bold font-mono tracking-widest text-xs uppercase bg-black/30 backdrop-blur px-2.5 py-1 rounded border border-white/10">
                            {activeEvent.bracketType} Tournament
                        </span>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black font-cyber text-white leading-[0.9] tracking-tighter mb-2 md:mb-4 drop-shadow-xl text-shadow-glow">
                        {activeEvent.title}
                    </h1>

                    {/* Author/Game Info */}
                    <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6 bg-black/40 backdrop-blur-md p-1.5 md:p-2 pr-4 md:pr-6 rounded-full border border-white/10">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white shadow-lg text-xs md:text-base">
                            {activeEvent.game.substring(0, 1)}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-white font-bold text-sm md:text-base leading-none flex items-center gap-2">
                                {activeEvent.game} <span className="text-blue-400 text-xs">âœ“</span>
                            </span>
                            <span className="text-gray-400 text-xs md:text-sm">Official Broadcast</span>
                        </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-300 text-sm md:text-lg leading-relaxed max-w-lg mb-6 md:mb-8 line-clamp-2 md:line-clamp-3">
                        {activeEvent.description}
                    </p>

                    {/* CTA */}
                    <button 
                        onClick={() => onPlay(activeEvent)}
                        className="group relative flex items-center gap-2 md:gap-3 bg-[#5c54f0] hover:bg-[#4f46e5] text-white px-5 py-2.5 md:px-8 md:py-4 rounded-lg font-black font-cyber tracking-widest text-sm md:text-lg transition-all shadow-[0_0_30px_rgba(92,84,240,0.4)] hover:shadow-[0_0_50px_rgba(92,84,240,0.6)] active:scale-95"
                    >
                        <Play fill="white" className="w-3 h-3 md:w-5 md:h-5" />
                        <span>WATCH NOW</span>
                    </button>
                </div>
            </div>

            {/* 3. THUMBNAIL NAVIGATOR (BOTTOM RIGHT FLOATING) */}
            <div className="absolute bottom-6 right-0 left-0 md:bottom-10 md:left-auto md:right-12 z-20 flex flex-col gap-2 md:gap-3 px-4 md:px-0">
                
                {/* Navigation Header - VISIBLE ON MOBILE NOW */}
                <div className="flex justify-end items-center mb-1 gap-4">
                    <div className="flex gap-1 bg-black/40 backdrop-blur rounded-full p-1 border border-white/5">
                        <button 
                            onClick={handlePrev}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                            aria-label="Previous Slide"
                        >
                            <ChevronLeft size={20} strokeWidth={1.5} />
                        </button>
                        <button 
                            onClick={handleNext}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                             aria-label="Next Slide"
                        >
                            <ChevronRight size={20} strokeWidth={1.5} />
                        </button>
                    </div>
                </div>

                {/* Carousel Strip */}
                <div className="relative w-full md:w-[600px]">
                    <div 
                        ref={carouselRef}
                        className="flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory py-4 px-4 [&::-webkit-scrollbar]:hidden"
                        style={{ scrollBehavior: 'smooth', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {events.map((evt, idx) => {
                            const isActive = idx === activeIndex;
                            return (
                                <div 
                                    key={evt.id}
                                    onClick={() => { setActiveIndex(idx); setIsAutoPlaying(false); }}
                                    className={`
                                        relative shrink-0 w-[130px] md:w-[200px] aspect-video rounded-lg overflow-hidden cursor-pointer transition-all duration-300 snap-start
                                        ${isActive ? 'ring-2 ring-purple-500 scale-105 shadow-[0_0_20px_rgba(0,0,0,0.5)] z-10' : 'opacity-60 hover:opacity-100 hover:scale-105 grayscale hover:grayscale-0'}
                                    `}
                                >
                                    <img src={evt.image} alt="" className="w-full h-full object-cover" />
                                    
                                    {/* Overlay Gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
                                    
                                    {/* Active Indicator */}
                                    {isActive && (
                                        <div className="absolute top-1.5 left-1.5 md:top-2 md:left-2 scale-75 md:scale-100 origin-top-left">
                                            <LiveBadge />
                                        </div>
                                    )}

                                    {/* Info */}
                                    <div className="absolute bottom-0 left-0 w-full p-2 md:p-3">
                                        <div className="text-[10px] md:text-sm font-bold text-purple-300 truncate mb-0.5">{evt.game}</div>
                                        <div className="text-xs md:text-base font-bold text-white truncate leading-tight">{evt.title}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- SCROLL ROW ---


interface ScrollRowProps {
    title: string;
    subtitle?: string;
    items: GameEvent[];
    onSelect: (evt: GameEvent) => void;
    showLiveBadge?: boolean;
}

const HorizontalRow: React.FC<ScrollRowProps> = ({ title, subtitle, items, onSelect, showLiveBadge = true }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const rowRef = useRef<HTMLDivElement>(null);

    // Stagger Reveal
    useEffect(() => {
        if (!rowRef.current) return;
        ScrollTrigger.create({
            trigger: rowRef.current,
            start: "top 85%",
            onEnter: () => {
                gsap.fromTo(rowRef.current?.querySelectorAll('.scroll-item'), 
                    { opacity: 0, y: 20 },
                    { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: "power2.out" }
                );
            },
            once: true
        });
    }, []);

    const scroll = (dir: 'left' | 'right') => {
        if (!containerRef.current) return;
        const amount = containerRef.current.clientWidth * 0.7;
        containerRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
    };

    return (
        <div ref={rowRef} className="w-full max-w-[1800px] mx-auto px-4 md:px-8 mb-12">
            
            {/* HEADER with Navigation Arrows Inline */}
            <div className="flex items-center justify-between mb-4 group cursor-pointer">
                <div className="flex items-end gap-3 flex-wrap">
                    <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors flex items-center gap-2">
                        {title}
                    </h3>
                    {subtitle && <span className="text-sm text-gray-500 font-semibold mb-0.5 hidden md:inline-block">{subtitle}</span>}
                </div>

                {/* Inline Arrows - VISIBLE ON MOBILE NOW */}
                <div className="flex items-center gap-1">
                    <button 
                        onClick={() => scroll('left')} 
                        className="p-1.5 rounded hover:bg-white/10 text-white transition-colors active:scale-95"
                        aria-label="Scroll Left"
                    >
                        <ChevronLeft size={24} strokeWidth={1.5} />
                    </button>
                    <button 
                        onClick={() => scroll('right')} 
                        className="p-1.5 rounded hover:bg-white/10 text-white transition-colors active:scale-95"
                        aria-label="Scroll Right"
                    >
                        <ChevronRight size={24} strokeWidth={1.5} />
                    </button>
                </div>
            </div>

            {/* CONTENT */}
            <div className="relative group/scroll">
                <div 
                    ref={containerRef}
                    className="flex gap-4 overflow-x-auto pb-6 pt-2 pl-1 pr-5 snap-x snap-mandatory scrollbar-hide [&::-webkit-scrollbar]:hidden"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {items.map((item, i) => (
                        <div key={`${item.id}-${i}`} className="scroll-item flex-none snap-start">
                            <GameCard item={item} onSelect={onSelect} showLiveBadge={showLiveBadge} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- MAIN PAGE ---

interface GamesGridProps {
  events: GameEvent[];
  teams: Record<string, Team>;
  onSelectEvent: (event: GameEvent) => void;
}

// --- LIVE STREAM CARD COMPONENT ---
const LiveStreamCard: React.FC<{ stream: LiveStream; onSelect: (stream: LiveStream) => void }> = ({ stream, onSelect }) => {
    const accentColor = '#a855f7';
    
    return (
        <div 
            onClick={() => onSelect(stream)}
            className="group cursor-pointer relative overflow-hidden transition-all duration-300 ease-out flex flex-col h-full"
        >
            {/* HOVER SHADOW BLOCK */}
            <div 
                className="absolute inset-0 z-0 transition-all duration-300 ease-out rounded-lg opacity-0 group-hover:opacity-100"
                style={{ 
                    backgroundColor: accentColor,
                    transform: 'translate(-6px, 6px)',
                }}
            ></div>

            {/* Thumbnail Container */}
            <div className="relative z-10 flex flex-col gap-3 bg-[#0e0e10] p-0 transition-transform duration-300 ease-out group-hover:-translate-y-1 group-hover:translate-x-1 border border-white/5 group-hover:border-transparent rounded-lg h-full">
                <div className="relative aspect-video bg-[#1f1f23] overflow-hidden rounded-t-lg">
                    {stream.thumbnail_url ? (
                        <img src={stream.thumbnail_url} alt={stream.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-600/20 to-cyan-600/20 flex items-center justify-center">
                            <Play size={48} className="text-white/50" />
                        </div>
                    )}
                    
                    {/* Status Badge */}
                    {stream.status === 'live' && <div className="absolute top-2 left-2"><LiveBadge /></div>}
                    {stream.status === 'scheduled' && (
                        <div className="absolute top-2 left-2 inline-flex items-center gap-1.5 bg-yellow-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 bg-white rounded-full" />
                            UPCOMING
                        </div>
                    )}
                    {stream.status === 'ended' && (
                        <div className="absolute top-2 left-2 inline-flex items-center gap-1.5 bg-gray-700 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                            ENDED
                        </div>
                    )}

                    {/* Hover Glitch Overlay */}
                    <div className="absolute inset-0 bg-white/10 pointer-events-none mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-20"></div>
                    </div>
                </div>
                
                {/* Meta Info */}
                <div className="px-3 pb-4">
                    <h4 className="text-base font-bold text-white leading-tight mb-1 truncate transition-colors duration-200 group-hover:text-purple-300">
                        {stream.title}
                    </h4>
                    <div className="text-xs text-gray-400 mb-3">
                        {stream.game_category || 'Esports'}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {stream.status === 'live' && <TagPill label="Live" />}
                        {stream.game_category && <TagPill label={stream.game_category} />}
                        <TagPill label={stream.placement === 'hero' ? 'Featured' : stream.placement} />
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- LIVE STREAM HERO SHOWCASE ---
const LiveStreamShowcase: React.FC<{ streams: LiveStream[]; onSelect: (stream: LiveStream) => void }> = ({ streams, onSelect }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    const heroRef = useRef<HTMLDivElement>(null);
    const bgRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const activeStream = streams[activeIndex % streams.length];

    const handleNext = () => {
        setActiveIndex(prev => (prev + 1) % streams.length);
        setIsAutoPlaying(false);
    };

    const handlePrev = () => {
        setActiveIndex(prev => (prev - 1 + streams.length) % streams.length);
        setIsAutoPlaying(false);
    };

    useEffect(() => {
        if (!isAutoPlaying) return;
        timerRef.current = setTimeout(() => {
            setActiveIndex(i => (i + 1) % streams.length);
        }, 6000);
        return () => timerRef.current && clearTimeout(timerRef.current);
    }, [isAutoPlaying, activeIndex, streams.length]);

    return (
        <div
            ref={heroRef}
            className="relative w-full min-h-[400px] sm:min-h-[500px] md:min-h-[600px] lg:h-[700px] overflow-hidden group mb-6 sm:mb-8 md:mb-12"
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
        >
            {/* Animated Background with Blur */}
            <div className="absolute inset-0">
                <div ref={bgRef} key={`bg-${activeStream.id}`} className="absolute inset-0 transition-all duration-1000">
                    {activeStream.thumbnail_url ? (
                        <img
                            src={activeStream.thumbnail_url}
                            alt="Hero BG"
                            className="w-full h-full object-cover scale-105 blur-sm"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-900 via-[#0e0e10] to-cyan-900" />
                    )}
                    {/* Multi-layer gradient overlays */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0e0e10] via-[#0e0e10]/80 to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e10] via-transparent to-[#0e0e10]/50"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_transparent_0%,_#0e0e10_70%)]"></div>
                    {/* Scanline effect */}
                    <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none opacity-30"></div>
                </div>
            </div>

            {/* Glowing accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-80"></div>

            {/* Main Content */}
            <div className="absolute inset-0 flex items-center z-10">
                <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 md:px-12 lg:px-16 py-8 sm:py-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 items-center">
                        
                        {/* Left Side - Info */}
                        <div ref={textRef} className="flex flex-col items-start order-2 lg:order-1">
                            {/* Status Badges */}
                            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-6">
                                {activeStream.status === 'live' && (
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-red-500 rounded blur-md animate-pulse"></div>
                                        <LiveBadge />
                                    </div>
                                )}
                                {activeStream.game_category && (
                                    <span className="text-purple-300 font-bold font-mono tracking-widest text-[10px] sm:text-xs uppercase bg-purple-500/20 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-purple-500/30">
                                        {activeStream.game_category}
                                    </span>
                                )}
                            </div>

                            {/* Title with glow effect */}
                            <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-black font-cyber text-white leading-[0.95] tracking-tight mb-3 sm:mb-4 md:mb-6 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                                {activeStream.title}
                            </h2>

                            {/* Scoreboard - Mobile Optimized */}
                            {(activeStream.team1_name || activeStream.team2_name) && (
                                <div className="w-full max-w-md mb-4 sm:mb-6 bg-black/40 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 border border-white/10">
                                    <div className="flex items-center justify-between gap-2 sm:gap-4">
                                        {/* Team 1 */}
                                        <div className="flex-1 flex items-center gap-2 sm:gap-3">
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                                {activeStream.team1_logo ? (
                                                    activeStream.team1_logo.startsWith('data:') || activeStream.team1_logo.startsWith('http') ? (
                                                        <img src={activeStream.team1_logo} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-lg sm:text-xl">{activeStream.team1_logo}</span>
                                                    )
                                                ) : (
                                                    <span className="text-xs sm:text-sm font-bold text-white/50">T1</span>
                                                )}
                                            </div>
                                            <span className="text-[10px] sm:text-xs md:text-sm font-bold text-white truncate max-w-[60px] sm:max-w-[80px] md:max-w-[100px]">
                                                {activeStream.team1_name || 'Team 1'}
                                            </span>
                                        </div>

                                        {/* Score */}
                                        <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1 sm:py-2 bg-black/60 rounded-lg">
                                            <span className="text-xl sm:text-2xl md:text-3xl font-black font-mono text-white">{activeStream.team1_score ?? 0}</span>
                                            <span className="text-sm sm:text-lg md:text-xl font-bold text-gray-600">:</span>
                                            <span className="text-xl sm:text-2xl md:text-3xl font-black font-mono text-white">{activeStream.team2_score ?? 0}</span>
                                        </div>

                                        {/* Team 2 */}
                                        <div className="flex-1 flex items-center justify-end gap-2 sm:gap-3">
                                            <span className="text-[10px] sm:text-xs md:text-sm font-bold text-white truncate max-w-[60px] sm:max-w-[80px] md:max-w-[100px] text-right">
                                                {activeStream.team2_name || 'Team 2'}
                                            </span>
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                                {activeStream.team2_logo ? (
                                                    activeStream.team2_logo.startsWith('data:') || activeStream.team2_logo.startsWith('http') ? (
                                                        <img src={activeStream.team2_logo} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-lg sm:text-xl">{activeStream.team2_logo}</span>
                                                    )
                                                ) : (
                                                    <span className="text-xs sm:text-sm font-bold text-white/50">T2</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Description - Hidden on very small screens */}
                            <p className="hidden sm:block text-gray-400 text-sm md:text-base lg:text-lg leading-relaxed max-w-lg mb-4 sm:mb-6 md:mb-8 line-clamp-2 md:line-clamp-3">
                                {activeStream.description || 'Watch the action unfold live'}
                            </p>

                            {/* CTA Button */}
                            <button
                                onClick={() => onSelect(activeStream)}
                                className="group relative inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 bg-gradient-to-r from-red-600 to-red-500 text-white font-black font-cyber tracking-wider uppercase rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(239,68,68,0.5)] text-xs sm:text-sm md:text-base"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <Play size={18} fill="white" className="relative z-10 w-4 h-4 sm:w-5 sm:h-5" />
                                <span className="relative z-10">Watch Now</span>
                            </button>
                        </div>

                        {/* Right Side - Video Preview Card */}
                        <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
                            <div
                                onClick={() => onSelect(activeStream)}
                                className="relative w-full max-w-[400px] lg:max-w-[500px] aspect-video rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer group/preview shadow-[0_0_60px_rgba(0,0,0,0.8)] border border-white/10 hover:border-purple-500/50 transition-all duration-500 hover:scale-[1.02]"
                            >
                            {activeStream.thumbnail_url ? (
                                <img
                                    src={activeStream.thumbnail_url}
                                    alt={activeStream.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover/preview:scale-110"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-purple-600/30 to-cyan-600/30 flex items-center justify-center">
                                    <Play size={64} className="text-white/30" />
                                </div>
                            )}
                            
                            {/* Play button overlay */}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover/preview:opacity-100 transition-all duration-300">
                                <div className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.6)] transform scale-90 group-hover/preview:scale-100 transition-transform duration-300">
                                    <Play size={32} fill="white" className="text-white ml-1" />
                                </div>
                            </div>

                            {/* Live indicator on thumbnail */}
                            {activeStream.status === 'live' && (
                                <div className="absolute top-4 left-4">
                                    <LiveBadge />
                                </div>
                            )}

                            {/* Bottom gradient */}
                            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent"></div>
                        </div>
                    </div>
                </div>
            </div>
            </div>

            {/* Navigation Arrows - Mobile Responsive */}
            <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 right-4 sm:right-6 md:right-16 z-20 flex items-center gap-2 sm:gap-3">
                <button
                    onClick={handlePrev}
                    className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-95"
                >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                </button>
                <div className="flex gap-1.5 sm:gap-2 mx-2 sm:mx-4">
                    {streams.slice(0, Math.min(streams.length, 5)).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => { setActiveIndex(i); setIsAutoPlaying(false); }}
                            className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${activeIndex % streams.length === i ? 'bg-red-500 w-5 sm:w-8' : 'bg-white/30 w-1.5 sm:w-2 hover:bg-white/50'}`}
                        />
                    ))}
                </div>
                <button
                    onClick={handleNext}
                    className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-95"
                >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                </button>
            </div>
        </div>
    );
};

// --- LIVE STREAM HORIZONTAL ROW ---
const LiveStreamHorizontalRow: React.FC<{ 
    title: string; 
    subtitle?: string; 
    streams: LiveStream[]; 
    showEndedBadge?: boolean;
    onSelect?: (stream: LiveStream) => void;
}> = ({ title, subtitle, streams, showEndedBadge, onSelect }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const scroll = (dir: 'left' | 'right') => {
        if (!containerRef.current) return;
        const amount = containerRef.current.clientWidth * 0.7;
        containerRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
    };

    return (
        <div className="relative w-full px-4 md:px-12 py-8 md:py-12">
            {/* Header with Navigation */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl md:text-2xl font-black font-cyber text-white tracking-wide mb-1 flex items-center gap-3">
                        <span className="w-1 h-6 bg-gradient-to-b from-red-500 to-purple-600 rounded-full"></span>
                        {title}
                    </h2>
                    {subtitle && <p className="text-sm text-gray-500 font-mono tracking-widest uppercase ml-4">{subtitle}</p>}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => scroll('left')}
                        className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-all active:scale-95"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-all active:scale-95"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            <div
                ref={containerRef}
                className="flex gap-4 overflow-x-auto pb-4 pt-2 snap-x snap-mandatory scrollbar-hide [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {streams.map((stream, i) => (
                    <div key={`${stream.id}-${i}`} className="scroll-item flex-none snap-start w-72 sm:w-80">
                        <LiveStreamCard stream={stream} onSelect={onSelect || (() => {})} />
                    </div>
                ))}
            </div>
        </div>
    );
};

const GamesGrid: React.FC<GamesGridProps> = ({ events, teams, onSelectEvent }) => {
    const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
    const [isLoadingStreams, setIsLoadingStreams] = useState(true);
    const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);

    // Fetch live streams from API
    useEffect(() => {
        const fetchStreams = async () => {
            try {
                const response = await fetch('/api/live-streams');
                if (response.ok) {
                    const data = await response.json();
                    setLiveStreams(data);
                    console.log('âœ… Fetched live streams:', data.length);
                }
            } catch (error) {
                console.error('Error fetching live streams:', error);
            } finally {
                setIsLoadingStreams(false);
            }
        };

        fetchStreams();

        // Set up WebSocket listener for real-time updates
        let ws: WebSocket | null = null;
        try {
            ws = new WebSocket(`ws://${window.location.host}/api/ws`);
            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    if (message.type?.includes('live_stream')) {
                        console.log('ðŸ”„ Live stream update via WebSocket, refetching...');
                        fetchStreams();
                    }
                } catch (err) {
                    console.error('WebSocket message error:', err);
                }
            };
            ws.onerror = () => {
                console.warn('WebSocket error, falling back to polling');
            };
        } catch (err) {
            console.warn('WebSocket connection failed, using polling');
        }

        // Also set up polling as fallback (every 3 seconds)
        const pollInterval = setInterval(() => {
            fetchStreams();
        }, 3000);

        return () => {
            if (ws) ws.close();
            clearInterval(pollInterval);
        };
    }, []);

    // Filter streams by placement - support both array and legacy string format
    const heroStreams = liveStreams.filter(s => 
        Array.isArray(s.placement) ? s.placement.includes('hero') : s.placement === 'hero'
    );
    const recommendedStreams = liveStreams.filter(s => 
        Array.isArray(s.placement) ? s.placement.includes('recommended') : s.placement === 'recommended'
    );
    const previousStreams = liveStreams.filter(s => 
        Array.isArray(s.placement) ? s.placement.includes('previous') : s.placement === 'previous'
    );
    
    // Log multi-placement streams for debugging
    const multiPlacementStreams = liveStreams.filter(s => 
        Array.isArray(s.placement) && s.placement.length > 1
    );
    if (multiPlacementStreams.length > 0) {
        console.log('🎬 Multi-placement streams:', multiPlacementStreams.map(s => ({
            title: s.title,
            placements: s.placement
        })));
    }
    
    // Use streams directly without duplication
    const heroCarousel = heroStreams;
    const recommendedCarousel = recommendedStreams;
    const previousCarousel = previousStreams;
    
    return (
        <div className="min-h-screen bg-[#0e0e10] font-sans pb-20">
            
            {/* HERO SECTION - Featured Streams */}
            {heroCarousel.length > 0 && (
                <LiveStreamShowcase streams={heroCarousel} onSelect={setSelectedStream} />
            )}

            {/* RECOMMENDED SECTION */}
            {recommendedCarousel.length > 0 && (
                <LiveStreamHorizontalRow 
                    title="Live channels we think you'll like" 
                    streams={recommendedCarousel}
                    onSelect={setSelectedStream}
                />
            )}

            {/* PREVIOUS LIVES SECTION */}
            {previousCarousel.length > 0 && (
                <LiveStreamHorizontalRow
                    title="Previous Lives"
                    streams={previousCarousel}
                    showEndedBadge={true}
                    onSelect={setSelectedStream}
                />
            )}

            {/* Fallback to Events ONLY if not still loading streams and no streams configured */}
            {!isLoadingStreams && liveStreams.length === 0 && (
                <>
                    <HeroShowcase events={events} onPlay={onSelectEvent} />
                    <HorizontalRow
                        title="Live channels we think you'll like"
                        items={events}
                        onSelect={onSelectEvent}
                        showLiveBadge={true}
                    />
                </>
            )}
            
            {/* ENHANCED LIVE STREAM VIEW */}
            {selectedStream && (
                <EnhancedStreamView 
                    stream={selectedStream} 
                    onClose={() => setSelectedStream(null)} 
                />
            )}
        </div>
    );
};

export default GamesGrid;
